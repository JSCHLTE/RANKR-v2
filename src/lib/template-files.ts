import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { TemplateData, templateError } from "./template-data";

export class TemplateError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// Only these fixed paths may be edited. No filename is accepted from a request.
const directory = path.join(process.cwd(), "public", "data");
const playersPath = path.join(directory, "players_lite.json");
const ranksPath = path.join(directory, "player_rankings.json");
const lockPath = path.join(process.cwd(), ".template-edit.lock");
const revision = (players: string, ranks: string) => createHash("sha256").update(players).update("\0").update(ranks).digest("hex");

async function withLock<T>(operation: () => Promise<T>): Promise<T> {
  let lock;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { lock = await fs.open(lockPath, "wx"); break; } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  if (!lock) throw new TemplateError("The template is busy. Please retry shortly.", 409);
  try { return await operation(); } finally { await lock.close(); await fs.unlink(lockPath); }
}

async function replaceFile(target: string, content: string) {
  const temporary = `${target}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temporary, content); await fs.rename(temporary, target); }
  finally { await fs.unlink(temporary).catch(() => {}); }
}

async function readFiles() {
  const [players, ranks] = await Promise.all([fs.readFile(playersPath, "utf8"), fs.readFile(ranksPath, "utf8")]);
  return { players, ranks };
}

export async function readTemplate() {
  return withLock(async () => {
    const files = await readFiles();
    return { players: JSON.parse(files.players), ranks: JSON.parse(files.ranks), revision: revision(files.players, files.ranks) };
  });
}

export async function saveTemplate(data: TemplateData, expectedRevision: string) {
  const error = templateError(data);
  if (error) throw new TemplateError(error, 400);
  return withLock(async () => {
    const old = await readFiles();
    if (revision(old.players, old.ranks) !== expectedRevision) throw new TemplateError("The template changed since you loaded it. Reload before saving.", 409);
    // Preserve metadata used by existing user rankings. Remove players from the template order instead.
    const ids = new Set(data.players.map(player => player.player_id));
    if (JSON.parse(old.players).some((player: { player_id: string }) => !ids.has(player.player_id))) throw new TemplateError("Existing player records cannot be deleted. Remove them from the template ranking instead.", 400);
    const players = JSON.stringify(data.players, null, 2) + "\n";
    const ranks = JSON.stringify([...data.ranks].sort((a, b) => a.rank - b.rank), null, 2) + "\n";
    const backup = path.join(process.cwd(), ".template-backups", randomUUID());
    await fs.mkdir(backup, { recursive: true });
    await Promise.all([fs.writeFile(path.join(backup, "players_lite.json"), old.players), fs.writeFile(path.join(backup, "player_rankings.json"), old.ranks)]);
    try {
      await replaceFile(playersPath, players);
      await replaceFile(ranksPath, ranks);
    } catch (error) {
      await Promise.all([replaceFile(playersPath, old.players), replaceFile(ranksPath, old.ranks)]);
      throw error;
    }
    return { revision: revision(players, ranks) };
  });
}
