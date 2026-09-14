// Test-only module loader, following the existing API route tests' VM pattern.
// Keeps Firebase credentials and server-only imports out of offline tests.
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
export function loadTestModule<T>(file: string, mocks: Record<string, unknown> = {}, globals: Record<string, unknown> = {}): T {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(filename: string): unknown {
    const absolute = path.resolve(filename);
    const cached = cache.get(absolute);
    if (cached) return cached.exports;
    const loadedModule = { exports: {} };
    cache.set(absolute, loadedModule);
    const code = ts.transpileModule(readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, Response, Request, URL, URLSearchParams, AbortSignal, Buffer, Date, Intl,
      console: { error() {} }, process: { env: {} }, fetch: () => { throw new Error("Unexpected network access in test"); }, ...globals,
      require(name: string) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name === "server-only") return {};
        if (name.startsWith("@/")) return load(path.resolve("src", `${name.slice(2)}.ts`));
        if (name.startsWith(".")) return load(path.resolve(path.dirname(absolute), `${name}.ts`));
        return nodeRequire(name);
      },
    }, { filename: absolute });
    return loadedModule.exports;
  }
  return load(file) as T;
}

export function providerEvent() {
  const quote = (odds: string, line?: string) => ({ odds, available: true, ...(line ? { overUnder: line } : {}), lastUpdatedAt: "2026-09-10T12:00:00Z" });
  return {
    eventID: "fixture-event-1", leagueID: "NFL", type: "match",
    status: { startsAt: "2026-09-13T17:00:00Z", oddsPresent: true },
    teams: { away: { teamID: "BUFFALO_BILLS_NFL", names: { short: "BUF", long: "Buffalo Bills" } }, home: { teamID: "MIAMI_DOLPHINS_NFL", names: { short: "MIA", long: "Miami Dolphins" } } },
    players: { ALLEN: { playerID: "ALLEN", name: "Josh Allen", teamID: "BUFFALO_BILLS_NFL" } },
    odds: {
      ml: { statID: "points", statEntityID: "away", periodID: "game", betTypeID: "ml", sideID: "away", byBookmaker: { draftkings: quote("-170") } },
      spread: { statID: "points", statEntityID: "away", periodID: "game", betTypeID: "sp", sideID: "away", byBookmaker: { draftkings: { ...quote("-110"), spread: "-3.5" } } },
      over: { statID: "points", statEntityID: "all", periodID: "game", betTypeID: "ou", sideID: "over", byBookmaker: { draftkings: quote("-110", "48.5") } },
      under: { statID: "points", statEntityID: "all", periodID: "game", betTypeID: "ou", sideID: "under", byBookmaker: { draftkings: quote("-115", "48.5") } },
      propOver: { statID: "passing_yards", statEntityID: "ALLEN", periodID: "game", betTypeID: "ou", sideID: "over", byBookmaker: { draftkings: quote("-110", "265.5"), fanduel: quote("+105", "267.5") } },
      propUnder: { statID: "passing_yards", statEntityID: "ALLEN", periodID: "game", betTypeID: "ou", sideID: "under", byBookmaker: { draftkings: quote("-115", "265.5") } },
    },
  };
}
