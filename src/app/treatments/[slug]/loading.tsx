export default function TreatmentDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Back button skeleton */}
        <div className="mb-8">
          <div className="h-11 w-24 animate-pulse rounded-xl bg-gray-200"></div>
        </div>

        {/* Header skeleton - compact */}
        <div className="mb-6 sm:mb-8 space-y-3">
          {/* H1 skeleton - large title line */}
          <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200"></div>
          {/* Optional metadata line (FDA approval, etc.) */}
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200"></div>
          {/* Subtitle/description skeleton - 2-3 short lines */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>

        {/* Section placeholder - just one compact card */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="space-y-3">
              <div className="h-7 w-1/3 animate-pulse rounded bg-gray-200"></div>
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-11/12 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




