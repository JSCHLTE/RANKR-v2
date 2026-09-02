const SkeletonRow = () => (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] animate-pulse">
      <div className="w-7 shrink-0">
        <div className="h-3.5 w-5 rounded bg-[var(--surface-hover)]" />
      </div>
      <div className="flex-1 flex items-center gap-3">
        <div className="h-3.5 w-32 rounded bg-[var(--surface-hover)]" />
        <div className="h-5 w-10 rounded-full bg-[var(--surface-hover)]" />
      </div>
      <div className="h-3 w-10 rounded bg-[var(--surface-hover)]" />
    </div>
  );

export default SkeletonRow;