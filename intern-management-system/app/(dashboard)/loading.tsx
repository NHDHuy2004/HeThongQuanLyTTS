export default function Loading() {
  return (
    <div className="space-y-8" aria-label="Đang tải">
      <div className="max-w-xl space-y-3">
        <div className="h-3 w-32 rounded-full bg-muted" />
        <div className="h-7 w-72 rounded-md bg-muted" />
        <div className="h-4 w-96 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-card p-5">
            <div className="h-3 w-2/3 rounded-md bg-muted" />
            <div className="mt-4 h-7 w-16 rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-lg border border-border bg-card shadow-card" />
    </div>
  )
}