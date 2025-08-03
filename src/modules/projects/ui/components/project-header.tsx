import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SunMoonIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({ id: projectId })
  );
  const { setTheme, theme } = useTheme();

  return (
    <header className="p-2 flex justify-between items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="focus-visible:ring-0 hover:bg-muted hover:opacity-80 transition-opacity pl-2 flex items-center gap-2"
          >
            <Image src="/logo.png" alt="CodeNebula" height={20} width={28} className="bg-transparent" />
            <span className="text-sm font-medium">{project.name}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="start"
          className="bg-white dark:bg-zinc-900 border rounded-md shadow-md p-1 min-w-[200px]"
        >
          <DropdownMenuItem
            asChild
            className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-muted transition-colors"
          >
            <Link href="/">
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Launch Control Center</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-muted transition-colors">
              <SunMoonIcon className="size-4 text-muted-foreground" />
              <span>Appearance</span>
              <ChevronRightIcon className="h-4 w-4" />
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-white dark:bg-zinc-900 border rounded-md shadow-md p-1">
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={setTheme}
                >
                  <DropdownMenuRadioItem
                    value="light"
                    className="px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-muted transition-colors"
                  >
                    <span>Solar Mode</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="dark"
                    className="px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-muted transition-colors"
                  >
                    <span>Lunar Mode</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="system"
                    className="px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-muted transition-colors"
                  >
                    <span>Auto Sync</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
