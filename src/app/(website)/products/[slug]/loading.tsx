import { Spinner } from "@/components/ui/Spinner";

export default function ProductLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-12 animate-pulse rounded bg-charcoal-100" />
          <div className="h-4 w-4 text-charcoal-200">/</div>
          <div className="h-4 w-20 animate-pulse rounded bg-charcoal-100" />
          <div className="h-4 w-4 text-charcoal-200">/</div>
          <div className="h-4 w-32 animate-pulse rounded bg-charcoal-100" />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery skeleton */}
          <div className="space-y-3">
            <div className="aspect-square animate-pulse rounded-xl bg-charcoal-100 flex items-center justify-center">
              <Spinner className="h-8 w-8 text-gold-500" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-charcoal-100 sm:h-20 sm:w-20"
                />
              ))}
            </div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-charcoal-100" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-charcoal-100" />
            </div>
            <div className="space-y-2">
              <div className="h-10 w-1/2 animate-pulse rounded bg-charcoal-100" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-charcoal-100" />
            </div>
            <div className="space-y-2 rounded-lg border border-charcoal-100 p-4">
              <div className="h-4 w-full animate-pulse rounded bg-charcoal-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-charcoal-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-charcoal-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-charcoal-100" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-12 flex-1 animate-pulse rounded-lg bg-charcoal-100" />
              <div className="h-12 w-12 animate-pulse rounded-lg bg-charcoal-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
