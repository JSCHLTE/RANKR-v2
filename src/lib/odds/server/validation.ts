import { OddsSyncError } from "./errors";

export function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export function requiredObject(value: unknown): Record<string, unknown> {
  const result = object(value);
  if (!result) throw new OddsSyncError("SportsGameOdds returned malformed data; nothing was updated.");
  return result;
}
export function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new OddsSyncError("SportsGameOdds returned incomplete event data; nothing was updated.");
  return value;
}
export function numeric(value: unknown): number | undefined {
  if (typeof value !== "number" && (typeof value !== "string" || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim()))) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
export function american(value: unknown): number | undefined {
  const number = numeric(value);
  return number !== undefined && Math.abs(number) >= 100 ? number : undefined;
}
export function isoDate(value: unknown): string | undefined {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
}
