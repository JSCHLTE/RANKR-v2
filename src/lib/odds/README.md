# NFL odds data contract

Routes: `/odds` and `/odds/nfl` temporarily redirect to `/odds/nfl/2026/week-1`.
The weekly route is `/odds/nfl/[season]/week-[number]`, with `/<away>-<home>` for details.
The App Router uses `[week]` because dynamic parameters must occupy a full segment; the loader validates the `week-N` format.

`public/data/odds/<season>/week-<number>/games.json` contains week metadata and lightweight game summaries with team metadata, kickoff, stable event ID, slug, and headline markets per book. No props are loaded on the listing.
`<AWAY>-<HOME>.json` contains the same identity fields plus season/week/update metadata, `gameOdds`, and `playerProps`. `isMock` controls the demo disclosure.
Types live in `src/types/odds.ts`; supported book IDs are derived from `sportsbooks.ts`. Unsupported books never participate in the UI or calculations. Markets, books, lines, and prices may be absent or null. Never write zero to represent missing prices; zero is a valid spread line.

The compact odds selector uses all six supported books for consensus. The reusable math helpers still accept a subset for future controls. Lines use the median, including the midpoint for even samples. Prices convert American odds to implied probability, average those probabilities, then convert back and round to an integer. This includes bookmaker margin; it is not a no-vig probability estimate or an executable offer. For spread/total/prop prices, every available line must agree before prices are combined. Otherwise the median line displays with unavailable prices. Missing prices are excluded independently for each outcome. At the utility level, selecting no books produces unavailable values. Display preferences persist under `rankr-odds-v1` and survive navigation; older saved book subsets are reset to all books. Sportsbook logos are configured centrally and shown in the dropdown and card badges.

The three fixtures are illustrative, not verified 2026 schedules, rosters, or live offers. BUF–MIA and DET–GB include six books and passing/rushing/receiving/touchdown props. KC–LAC omits ESPN BET and has partial bet365 markets, with empty receiving/touchdown categories. Passing-yard lines vary to exercise median behavior; other props use matching lines to demonstrate combined prices.

## Future sync

A server-side SportsGameOdds adapter should validate provider data and normalize it to these types, whitelist the six configured book IDs, and write both summary and detail files with consistent event IDs/slugs and timestamps. Set `isMock: false` for actual data. Validate normalized output before publishing, use atomic file replacement, and publish details before the weekly index. API keys stay exclusively in the sync environment. No frontend dependency on provider response shapes is needed.

The loader reads files on the server per request. Deployment must include `public/data/odds` and supply updated files through a writable persistent volume or a redeploy; immutable/serverless deployments cannot assume scheduled writes to the deployed filesystem. The typed loader is the replacement point if JSON later moves to object storage. Runtime schema validation belongs at the sync boundary; the current loader trusts repository-owned JSON and sends malformed files to the route error boundary.

TODO: live adapter/scheduler, current-week redirect, provider validation, historical season navigation, and an optional best-price mode that compares identical markets/lines only. The week selector discovers published week files in the selected season; only Week 1 is currently published.

Run math and fixture checks with `node --import tsx --test src/lib/odds/consensus.test.ts`.

## File inventory

Created:

- `src/types/odds.ts`
- `src/lib/odds/sportsbooks.ts`
- `src/lib/odds/consensus.ts`
- `src/lib/odds/consensus.test.ts`
- `src/lib/odds/loadOdds.ts`
- `src/lib/odds/README.md`
- `src/components/odds/OddsPreferences.tsx`
- `src/components/odds/OddsValue.tsx`
- `src/components/odds/OddsPageHeader.tsx`
- `src/components/odds/GameOddsCard.tsx`
- `src/components/odds/GameLines.tsx`
- `src/components/odds/PlayerProps.tsx`
- `src/app/(pages)/odds/layout.tsx`
- `src/app/(pages)/odds/page.tsx`
- `src/app/(pages)/odds/loading.tsx`
- `src/app/(pages)/odds/error.tsx`
- `src/app/(pages)/odds/not-found.tsx`
- `src/app/(pages)/odds/nfl/page.tsx`
- `src/app/(pages)/odds/nfl/[season]/[week]/page.tsx`
- `src/app/(pages)/odds/nfl/[season]/[week]/[game]/page.tsx`
- `public/data/odds/2026/week-1/games.json`
- `public/data/odds/2026/week-1/BUF-MIA.json`
- `public/data/odds/2026/week-1/DET-GB.json`
- `public/data/odds/2026/week-1/KC-LAC.json`

Modified:

- `src/components/navbar/navbar.tsx` — added Odds to the shared desktop/mobile links and active highlighting on nested odds routes; preserved existing navigation edits.

Validation: production build and TypeScript pass; focused odds lint passes; four math/fixture tests and nine production route smoke checks pass. Full-project lint reports three pre-existing errors in signup/username code. Browser interaction and visual QA have not been performed.
