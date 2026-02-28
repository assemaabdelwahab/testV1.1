import { Suspense } from "react";
import CategoriesContent from "./CategoriesContent";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <ChartSkeleton height="h-72" />
          <TableSkeleton rows={8} />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
