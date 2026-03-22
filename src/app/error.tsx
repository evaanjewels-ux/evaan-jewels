"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const handleRetry = () => {
    // reset() alone doesn't re-fetch server components reliably.
    // router.refresh() forces a full server re-render of the current route,
    // then reset() clears the error boundary so the new content shows.
    router.refresh();
    reset();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h1 className="font-heading text-2xl font-bold text-charcoal-700">
        Something Went Wrong
      </h1>
      <p className="mx-auto mt-3 max-w-md text-charcoal-400">
        An unexpected error occurred. Please try again or contact us if the problem
        persists.
      </p>
      <button
        onClick={handleRetry}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-600 active:scale-[0.97]"
      >
        Try Again
      </button>
    </div>
  );
}
