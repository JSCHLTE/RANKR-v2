import "server-only";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { GameOdds, WeekOdds } from "@/types/odds";

const root = path.join(process.cwd(), "public", "data", "odds");
export function validWeek(season: string, week: string) {
  return /^20\d{2}$/.test(season) && /^week-([1-9]|1\d|2[0-2])$/.test(week);
}
async function readOdds<T>(file: string): Promise<T | null> {
  try { return JSON.parse(await readFile(file, "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function loadWeekOdds(season: string, week: string) {
  return validWeek(season, week) ? readOdds<WeekOdds>(path.join(root, season, week, "games.json")) : null;
}
export async function loadGameOdds(season: string, week: string, game: string) {
  return validWeek(season, week) && /^[a-z]{2,3}-[a-z]{2,3}$/.test(game)
    ? readOdds<GameOdds>(path.join(root, season, week, `${game.toUpperCase()}.json`)) : null;
}
export async function availableWeeks(season: string): Promise<number[]> {
  if (!/^20\d{2}$/.test(season)) return [];
  try {
    const entries = await readdir(path.join(root, season));
    const weeks = await Promise.all(entries.filter(entry => validWeek(season, entry)).map(async entry => await loadWeekOdds(season, entry) ? Number(entry.slice(5)) : null));
    return weeks.filter((week): week is number => week !== null).sort((a, b) => a - b);
  } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}
