export default function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-3 rounded-lg border p-6">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
