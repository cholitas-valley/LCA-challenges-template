export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
