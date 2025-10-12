import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid h-full gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[40px] w-[200px]" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[40px] w-[150px] self-end" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[40px] w-[150px]" />
            <div className="space-y-3">
              <Skeleton className="h-[60px] w-full" />
              <Skeleton className="h-[60px] w-full" />
              <Skeleton className="h-[60px] w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
