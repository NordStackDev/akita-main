import { Skeleton } from "@/components/ui/skeleton";

export const LoadingSkeleton = () => (
  <div className="p-6 space-y-4 animate-fade-in">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
    <Skeleton className="h-[200px] w-full" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-[100px]" />
      <Skeleton className="h-[100px]" />
      <Skeleton className="h-[100px]" />
    </div>
  </div>
);