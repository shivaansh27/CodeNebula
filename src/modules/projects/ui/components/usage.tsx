import Link from "next/link";
import {CrownIcon} from "lucide-react";
import {formatDuration, intervalToDuration} from "date-fns";
import {Button} from "@/components/ui/button";
interface Props{
    points: number;
    msBeforeNext: number;
}
export const Usage = ({points,msBeforeNext,}:Props) => {
    return(
        <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
            <div className="flex items-center gap-x-2">
                <div>
                    <p className="text-sm">
                        {points} free credits remaining
                    </p>
                    <p className="text-xs text-muted-foreground">
                    Resets in {" "}
                    {formatDuration(
                        intervalToDuration({
                            start:new Date(),
                            end: new Date(Date.now() + msBeforeNext)
                        }),
                        {format: ["months","days","hours"]}
                    )} 
                    </p>
                </div>
                <Button asChild size="sm" variant="ghost" className="ml-auto">
                    <Link href="/pricing"><CrownIcon />Upgrade</Link>
                </Button>
            </div>

        </div>
    )
}