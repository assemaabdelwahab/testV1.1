interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = "No data yet",
  message = "There are no transactions for this period.",
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">📭</div>
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
