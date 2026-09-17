export function normalizeInjuryLevel(value: unknown): "low" | "medium" | "high" | null {
  const level = typeof value === "string" ? value.trim().toLowerCase() : "";
  return level === "low" || level === "medium" || level === "high" ? level : null;
}

export function formatInjuryLevel(value: string | null | undefined): string {
  const level = normalizeInjuryLevel(value);
  return level ? level[0].toUpperCase() + level.slice(1) : value?.trim() ?? "";
}
