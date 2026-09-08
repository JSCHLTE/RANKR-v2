const SkeletonCard = () => (
  <div className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 animate-pulse" aria-hidden="true">
    <div className="flex-1 space-y-4">
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded bg-[var(--surface-hover)]" />
        <div className="h-3 w-full rounded bg-[var(--surface-hover)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--surface-hover)]" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-7 w-20 rounded-full bg-[var(--surface-hover)]" />
        <div className="h-7 w-16 rounded-full bg-[var(--surface-hover)]" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-12 rounded bg-[var(--surface-hover)]" />
        <div className="flex flex-wrap gap-1.5">
          {[48, 48, 48, 48, 64].map((width, index) => <div key={index} className="h-7 rounded-md bg-[var(--surface-hover)]" style={{ width }} />)}
        </div>
      </div>
    </div>
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-[var(--surface-hover)]" />
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-[var(--surface-hover)]" />
          <div className="h-2.5 w-12 rounded bg-[var(--surface-hover)]" />
        </div>
      </div>
      <div className="h-7 w-28 rounded-full bg-[var(--surface-hover)]" />
    </div>
  </div>
);

export default SkeletonCard;
