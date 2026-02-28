import { Suspense } from "react";
import TrendsContent from "./TrendsContent";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ChartSkeleton height="h-80" />
        </div>
      }
    >
      <TrendsContent />
    </Suspense>
  );
}
