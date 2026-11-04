export default function TemplatesLoading() {
  return (
    <div className="page-shell page-stack max-w-[1200px]">
      <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
