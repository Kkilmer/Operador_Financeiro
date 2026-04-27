function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <main className="space-y-6">
      <SkeletonBlock className="h-36 w-full rounded-3xl" />
      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
        <SkeletonBlock className="h-40 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SkeletonBlock className="h-28 w-full" />
          <SkeletonBlock className="h-28 w-full" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SkeletonBlock className="h-72 w-full" />
        <SkeletonBlock className="h-72 w-full" />
      </div>
    </main>
  );
}
