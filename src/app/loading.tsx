export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="space-y-4 text-center">
        <div className="relative">
          {/* Animated spinner */}
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>

          {/* Pulse effect */}
          <div className="absolute inset-0 mx-auto h-16 w-16 animate-ping rounded-full border-4 border-blue-300 opacity-20"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="text-sm text-gray-600">Please wait while we prepare your content</p>
        </div>
      </div>
    </div>
  );
}
