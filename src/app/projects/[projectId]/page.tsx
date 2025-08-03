import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import {ErrorBoundary} from "react-error-boundary";
interface Props{
    params: Promise<{
        projectId: string;
    }>
}
const Page = async ({params}: Props) => {
    const {projectId} = await params;
    const queryClient =  getQueryClient();
    void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({
        projectId: projectId,
    }));
    void queryClient.prefetchQuery(trpc.projects.getOne.queryOptions({
        id: projectId,
    }));
    return(
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ErrorBoundary fallback = {<p>error!...</p>}>
            <Suspense fallback = {<p>Loading.....</p>}>
            <ProjectView projectId={projectId} />
            </Suspense>    
            </ErrorBoundary> 
        </HydrationBoundary>
    );
}
export default Page;