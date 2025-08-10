import { inngest } from "./client";
import { openai, createAgent, createTool, createNetwork, type Message, createState } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { PROMPT, FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { z } from "zod";
import prisma from "@/lib/db";
import type { ZodTypeAny } from "zod";

interface AgentState {
  summary: string;
  files: Record<string, string>;
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      try {
        const sandbox = await Sandbox.create("codenebula");
        await sandbox.setTimeout(60_000 * 10 * 3);
        return sandbox.sandboxId;
      } catch (error) {
        console.error("Failed to create sandbox:", error);
        throw error;
      }
    })

    const previousMessages = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];

      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });
      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        })
      }
      return formattedMessages.reverse();
    })

    const state = createState<AgentState>({
      summary: "",
      files: {},
    }, {
      messages: previousMessages,
    })

    // Predefine schemas to avoid deep generic inference at callsites
    const terminalParamsSchema: ZodTypeAny = z.object({
      command: z.string(),
    });
    const createOrUpdateFilesParamsSchema: ZodTypeAny = z.object({
      files: z.array(
        z.object({
          path: z.string(),
          content: z.string(),
        })
      ),
    });
    const readFilesParamsSchema: ZodTypeAny = z.object({
      files: z.array(z.string()),
    });

  // Create a wrapper to avoid deep generic instantiation at callsites
  const createToolLoose = createTool as unknown as (arg: unknown) => ReturnType<typeof createTool>;

  const codeAgent = createAgent<AgentState>({
      name: "codeAgent",
      description: "An coding agent expert in its field",
      system: PROMPT,
      model: openai({
        model: "gpt-4",
        defaultParameters: {
          temperature: 0.1,
        }
      }),
      tools: [
        // Use the loose wrapper to prevent TS deep instantiation
        createToolLoose({
          name: "terminal",
          description: "Use terminal to run commands",
          parameters: terminalParamsSchema,
          handler: async (
            { command }: { command: string },
            { step }: { step?: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> } }
          ) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                });
                return result.stdout;
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`;
              }
            })
          },
  }),
        createToolLoose({
          name: "createOrUpdatefiles",
          description: "create or update files in the sandbox",
          parameters: createOrUpdateFilesParamsSchema,
          handler: async (
            { files }: { files: Array<{ path: string; content: string }> },
            context: {
              step?: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> },
              network: { state: { data: { files: Record<string, string> } } }
            }
          ) => {
            const { step, network } = context;
            const newFiles = await step?.run("createOrUpdatefiles", async () => {
              try {
                const baseFiles: Record<string, string> = network.state.data.files ?? {};
                const updatedFiles = { ...baseFiles };
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }

                return updatedFiles;
              } catch (e) {
                return "Error: " + e;
              }
            });

            if (typeof newFiles === "object" && newFiles && typeof newFiles !== "string") {
              network.state.data.files = newFiles;
            }
          }
        }),
        createToolLoose({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: readFilesParamsSchema,
          handler: async (
            { files }: { files: string[] },
            { step }: { step?: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> } }
          ) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            })
          }
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      }
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      }
    })

    const result = await network.run(event.data.value, { state: state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4o",
      })
    })

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "response-generator",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4o",
      })
    })

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(result.state.data.summary);
    const { output: responseOutput } = await responseGenerator.run(result.state.data.summary);

    const generateFragmentTitle = () => {
      if (
        !Array.isArray(fragmentTitleOutput) ||
        !fragmentTitleOutput[0] ||
        fragmentTitleOutput[0].type !== "text"
      ) {
        return "Fragment";
      }
      const content = fragmentTitleOutput[0].content;
      return Array.isArray(content) ? content.join("  ") : content;
    };

    const generateResponse = () => {
      if (
        !Array.isArray(responseOutput) ||
        !responseOutput[0] ||
        responseOutput[0].type !== "text"
      ) {
        return "Here You Go";
      }
      const content = responseOutput[0].content;
      return Array.isArray(content) ? content.join("  ") : content;
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    })

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR"
          }
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            }
          },
        },
      })
    })

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
