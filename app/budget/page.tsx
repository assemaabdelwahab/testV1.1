import { Suspense } from "react";
import BudgetContent from "./BudgetContent";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <CardSkeleton />
          <TableSkeleton rows={10} />
        </div>
      }
    >
      <BudgetContent />
    </Suspense>
  );
}
