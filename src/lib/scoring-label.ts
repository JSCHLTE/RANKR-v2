const SCORING_LABELS: Record<string, string> = {
  PPR: "PPR",
  HALF_PPR: "Half PPR",
  NO_PPR: "No PPR",
};

export function scoringLabel(value?: string): string | undefined {
  return value ? SCORING_LABELS[value] ?? value : undefined;
}
