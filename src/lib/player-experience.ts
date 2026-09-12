import { readFile } from "node:fs/promises";
import path from "node:path";

export async function withPlayerExperience<T extends { player_id: string }>(players: T[]) {
  return Promise.all(players.map(async player => {
    // IDs are used only as filenames inside the player-details directory.
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(player.player_id)) return { ...player, years_exp: null };
    try {
      const details = JSON.parse(await readFile(path.join(process.cwd(), "public", "data", "players", `${player.player_id}.json`), "utf8"));
      const experience = details[player.player_id]?.years_exp;
      return { ...player, years_exp: Number.isInteger(experience) && experience >= 0 ? experience as number : null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { ...player, years_exp: null };
    }
  }));
}
