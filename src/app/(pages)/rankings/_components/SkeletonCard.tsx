const SkeletonCard = () => (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 w-1/3 rounded bg-[var(--surface-hover)]" />
          <div className="h-2.5 w-1/5 rounded bg-[var(--surface-hover)]" />
        </div>
      </div>
      {/* Body */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="h-4 w-3/5 rounded bg-[var(--surface-hover)]" />
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-[var(--surface-hover)]" />
          <div className="h-3 w-4/5 rounded bg-[var(--surface-hover)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-12 rounded-full bg-[var(--surface-hover)]" />
          <div className="h-6 w-12 rounded-full bg-[var(--surface-hover)]" />
          <div className="h-6 w-12 rounded-full bg-[var(--surface-hover)]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[64, 80, 56, 72].map((w, i) => (
            <div key={i} className="h-6 rounded-md bg-[var(--surface-hover)]" style={{ width: w }} />
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--border)] flex justify-end">
        <div className="h-5 w-16 rounded-full bg-[var(--surface-hover)]" />
      </div>
    </div>
  );

  export default SkeletonCard;