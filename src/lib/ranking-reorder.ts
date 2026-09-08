// onMove expects the final one-based rank after the source has been removed.
export function rankBelowPlayer(sourceRank: number, targetRank: number): number {
  return sourceRank < targetRank ? targetRank : targetRank + 1;
}
