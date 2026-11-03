/** Shown instantly while an admin page loads, so navigation never feels frozen. */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-56 animate-pulse bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse border border-line bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse border border-line bg-white" />
    </div>
  );
}
