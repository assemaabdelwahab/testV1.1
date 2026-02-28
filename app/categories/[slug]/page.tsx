import { Suspense } from "react";
import CategoryDrilldown from "./CategoryDrilldown";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function CategoryDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <ChartSkeleton height="h-48" />
          <TableSkeleton rows={6} />
        </div>
      }
    >
      <CategoryDrilldown />
    </Suspense>
  );
}
