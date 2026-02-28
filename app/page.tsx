import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ChartSkeleton height="h-80" />
          <TableSkeleton rows={8} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
