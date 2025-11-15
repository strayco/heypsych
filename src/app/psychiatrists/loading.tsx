export default function ProvidersLoading() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-1/3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200"></div>
        </div>

        {/* Search skeleton */}
        <div className="h-12 w-full animate-pulse rounded bg-gray-200"></div>

        {/* Filters skeleton */}
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-32 animate-pulse rounded bg-gray-200"></div>
          ))}
        </div>

        {/* List skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-lg bg-gray-200"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-6 w-20 animate-pulse rounded bg-gray-200"></div>
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
