export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function StatusCardSkeleton() {
  return (
    <div className="rounded-[8px] border border-border bg-surface p-4" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
        <SkeletonBlock className="h-6 w-20" />
      </div>
      <div className="mt-5">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="mt-2 h-8 w-24" />
      </div>
      <div className="mt-5 space-y-3.5">
        <div className="flex justify-between"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="h-3 w-28" /></div>
        <div className="flex justify-between"><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="h-3 w-32" /></div>
        <div className="flex justify-between"><SkeletonBlock className="h-3 w-16" /><SkeletonBlock className="h-3 w-24" /></div>
        <div className="flex justify-between"><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="h-3 w-20" /></div>
        <div className="flex justify-between"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="h-3 w-16" /></div>
      </div>
    </div>
  );
}

export function DeviceListSkeleton() {
  return (
    <div className="space-y-3 p-3" aria-hidden="true">
      <SkeletonBlock className="h-9 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1.5 rounded-[8px] border border-border p-3">
          <SkeletonBlock className="h-3.5 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div
      className="relative h-full min-h-[280px] w-full overflow-hidden rounded-[8px] border border-border bg-surface-2"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-6">
        <SkeletonBlock className="h-4 w-40" />
      </div>
    </div>
  );
}
