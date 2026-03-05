export default function CollectionDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-20 rounded bg-muted" />
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="mt-2 flex gap-2">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded bg-muted" />
          <div className="h-10 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden">
            <div className="aspect-[2.5/3.5] bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
