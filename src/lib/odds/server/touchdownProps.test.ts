import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSportsGameOdds } from "./normalizeSportsGameOdds";
import { providerEvent } from "./testHelpers";
import { REQUESTED_ODDS } from "./providerMapping";
import { consensusYesNo } from "../consensus";

test("requests and normalizes separate Anytime TD, First TD and total touchdown markets", () => {
  const event = providerEvent();
  const quote = (odds: string, available = true) => ({ odds, available });
  const market = (statID: string, sideID: string) => ({ statID, sideID, statEntityID: "ALLEN", periodID: "game", betTypeID: "yn",
    byBookmaker: { draftkings: quote("+200"), fanduel: quote("+300", false) } });
  const [game] = normalizeSportsGameOdds([{ ...event, odds: { ...event.odds,
    anytime: market("touchdowns", "yes"), first: market("firstTouchdown", "yes"),
    no: { ...market("touchdowns", "no"), byBookmaker: { draftkings: quote("-250") } },
    invalid: { ...market("firstTouchdown", "no"), byBookmaker: { draftkings: quote("") } },
    total: { ...market("touchdowns", "over"), betTypeID: "ou", byBookmaker: { draftkings: { ...quote("+150"), overUnder: "0.5" } } },
    wrongPeriod: { ...market("firstTouchdown", "yes"), periodID: "1h", byBookmaker: { caesars: quote("+400") } },
  } }], 2026, 1);
  const anytime = game.playerProps.find(prop => prop.market === "anytime_touchdown")!;
  const first = game.playerProps.find(prop => prop.market === "first_touchdown")!;
  assert.equal(anytime.betType, "yn");
  assert.deepEqual(anytime.sportsbooks, { draftkings: { yesOdds: 200, noOdds: -250 } });
  assert.deepEqual(first.sportsbooks, { draftkings: { yesOdds: 200 } });
  assert.deepEqual(game.playerProps.find(prop => prop.market === "touchdowns")?.sportsbooks.draftkings, { line: 0.5, overOdds: 150 });
  for (const stat of ["touchdowns", "firstTouchdown"]) for (const side of ["yes", "no"]) {
    assert.ok(REQUESTED_ODDS.includes(`${stat}-PLAYER_ID-game-yn-${side}`));
  }
});

test("yes/no consensus averages each available side independently and ignores O/U fields", () => {
  assert.deepEqual(consensusYesNo({ draftkings: { yesOdds: 200, noOdds: -250 }, fanduel: { yesOdds: -200 }, caesars: { overOdds: -900, line: 0.5 } }, ["draftkings", "fanduel", "caesars"]), { yesOdds: 100, noOdds: -250 });
  assert.deepEqual(consensusYesNo({}, ["draftkings"]), { yesOdds: null, noOdds: null });
  assert.deepEqual(consensusYesNo({ draftkings: { yesOdds: 200 }, fanduel: { yesOdds: -200 } }, ["draftkings"]), { yesOdds: 200, noOdds: null });
});
