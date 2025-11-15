export default function ResourcesLoading() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-1/3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200"></div>
        </div>

        {/* Category tabs skeleton */}
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-40 flex-shrink-0 animate-pulse rounded bg-gray-200"
            ></div>
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
