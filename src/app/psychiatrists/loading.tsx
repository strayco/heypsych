export default function ProvidersLoading() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-1/3 animate-pulse rounded-lg bg-surface-grouped"></div>
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-surface-grouped"></div>
        </div>

        {/* Search skeleton */}
        <div className="h-12 w-full animate-pulse rounded-lg bg-surface-grouped"></div>

        {/* Filters skeleton */}
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-32 animate-pulse rounded-lg bg-surface-grouped"></div>
          ))}
        </div>

        {/* List skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-separator bg-surface-grouped p-6">
              <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-fill-tertiary"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-1/3 animate-pulse rounded bg-fill-tertiary"></div>
                  <div className="h-4 w-1/2 animate-pulse rounded bg-fill-secondary"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 animate-pulse rounded bg-fill-tertiary"></div>
                    <div className="h-6 w-20 animate-pulse rounded bg-fill-tertiary"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
