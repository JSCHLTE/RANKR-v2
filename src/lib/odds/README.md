# NFL odds: manual SportsGameOdds → Firestore sync

The existing RANKR odds components, normalized types, logos, filters, and consensus math are preserved. Pages now read Firestore through Firebase Admin. JSON fixtures are retained only for development/tests; production has no mock fallback.

## Setup

The only new secret is `SPORTSGAMEODDS_API_KEY`.

1. Add `SPORTSGAMEODDS_API_KEY=<your actual key>` to the existing local `.env.local` file. Restart the Next.js server afterward. Codex has not edited `.env.local`.
2. Add the same server-only variable to your production hosting project's environment settings (and its preview environment if needed), then redeploy/restart. Existing `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` continue to configure Firebase Admin.
3. Sign in with the existing admin account, open `/odds/nfl/2026/week-1` (or choose another week), and click **Pull Updated Odds**.
4. The first successful sync publishes the week, game lines, and available props. Until then the page shows an empty unpublished state. Admins can select unpublished 2026 weeks; other users can select published weeks.

No new admin UID variable, scheduler, client Firestore writes, affiliate functionality, or API SDK dependency was added. `/odds` and `/odds/nfl` still redirect to the agreed 2026 Week 1 route.

## Authorization and rules

`POST /api/admin/odds/sync` accepts only `{ season, week }`. The browser obtains the Firebase user's ID token from the existing AuthContext and sends `Authorization: Bearer <token>`. The server calls the existing Admin Auth `verifyIdToken(token, true)` (including revocation checks), then passes the decoded UID to the existing `isAdmin()` from `src/lib/admin-access.ts`. Missing/invalid tokens receive 401; authenticated non-admins receive 403. Client-supplied UIDs/dates are rejected. No second admin system or duplicate UID is introduced.

The admin UID in the existing shared helper is an identity identifier, not a credential. UI visibility uses the same existing helper, but the server independently enforces authorization. Secrets and raw provider/SDK errors are never sent to the browser or logged by this feature.

The Firestore rules supplied by the owner allow specific existing collections only, with no catch-all allow. They therefore already deny browser access to `odds-weeks`, `odds-games`, and their subcollections. No rule change or rule deployment is required. Firebase Admin uses server credentials and bypasses these client rules. Keep those collections absent from any future blanket client allow rule. See [Firebase rule behavior](https://firebase.google.com/docs/rules/rules-behavior).

## Provider contract and normalization

Verified against the current official [OpenAPI schema](https://sportsgameodds.com/openapi.json), [events endpoint](https://sportsgameodds.com/docs/endpoints/getEvents), [bookmaker IDs](https://sportsgameodds.com/docs/data-types/bookmakers), [odds schema](https://sportsgameodds.com/docs/data-types/odds), and [stat IDs](https://sportsgameodds.com/docs/data-types/stats).

- Calls `https://api.sportsgameodds.com/v2/events` server-side using the `x-api-key` header, never a URL key.
- Filters by `leagueID=NFL`, `type=match`, server-derived date boundaries, five supported bookmaker IDs, and supported full-game oddIDs. `PLAYER_ID` is the documented wildcard for player props.
- Follows `nextCursor`, with a 20-second request timeout and bounded pagination. A failed/malformed/repeated-cursor response aborts without publishing partial results.
- Does not filter events by odds availability: games with no currently available offers still belong in the week's schedule. Alternate lines and open/close prices are not requested.
- Maps the documented bookmaker IDs `draftkings`, `fanduel`, `betmgm`, `caesars`, and `espnbet` to the existing RANKR keys in one adapter mapping.
- Reads kickoff from `status.startsAt`, teams from `teams.away/home.names` and `teamID`, and player identity/name/team from `players[statEntityID]`.
- Reads each book's `odds`, `spread`, and `overUnder` fields under `odds[oddID].byBookmaker`, never the provider's `fairOdds` or `bookOdds` consensus.
- Parses numeric strings carefully. Missing/invalid prices stay absent; zero remains a valid spread. Quotes must have `available: true`; explicitly non-main lines are excluded. [v2 retains unavailable quotes](https://sportsgameodds.com/docs/info/v1-to-v2), so ignoring this field would revive stale prices.
- Different over/under main lines at the same book cannot fit the existing single-line schema. That book's market is omitted rather than pairing prices from different bets.
- Captures the latest supported bookmaker `lastUpdatedAt` as optional `sourceUpdatedAt`. This is distinct from the RANKR sync completion time.

Supported player O/U stats: passing yards, attempts, completions, interceptions; rushing yards and attempts; receiving yards and receptions; passing, rushing, receiving, and total touchdowns. Passing touchdowns are grouped under Touchdowns to match the existing categories.

Anytime TD and First TD use the provider's full-game `touchdowns` and `firstTouchdown` Yes/No markets (`yn-yes` / `yn-no`). Props store `betType: "yn"` and separate `yesOdds`/`noOdds` prices without a line. Consensus averages implied probabilities independently for each available side. Missing No prices are not inferred. Existing O/U props remain compatible; re-sync a week to populate the new markets. The cards and market dropdown display them when quotes are available.

Ignored: unsupported books, alternate lines, last touchdown scorer markets, half/quarter/regulation-only markets, team props, combination yardage props, defense/kicking props, and any stat/bet type not explicitly mapped. Unknown markets are not forced into a category.

## Season/week boundaries

Syncing initially supports the **2026 regular season, Weeks 1–18**, as agreed. A verified September 9 anchor includes the [Wednesday kickoff](https://www.nfl.com/schedules/2026/by-week/reg-1). Each window is Wednesday 00:00 America/New_York through the next Wednesday, exclusive; DST and January rollover are handled. This accommodates normal weekly games and Tuesday reschedules, but a game moved entirely outside its week window needs an explicit schedule override in a future enhancement. Other seasons/playoffs fail validation rather than guessing dates. The browser cannot supply the window.

## Firestore documents

```text
odds-weeks/2026-week-2
  schemaVersion, season, week, source, snapshotId, updatedAt (Timestamp)
  games[]: eventId, slug, teams, startTime, sportsbooks (headline markets only)

odds-games/<SportsGameOdds eventID>
  gameId, eventId, season, week, weekKey, slug, teams, startTime
  gameOdds (individual sportsbooks), source, snapshotId
  updatedAt (Timestamp), sourceUpdatedAt (optional Timestamp)

odds-games/<eventID>/props/passing-0
odds-games/<eventID>/props/passing-1
odds-games/<eventID>/props/rushing-0
odds-games/<eventID>/props/receiving-0
odds-games/<eventID>/props/touchdowns-0
  category, snapshotId, props[]
```

Category documents split automatically at approximately 180 KB, well below Firestore's document size limit. Empty categories need no document. The loader recombines all chunks into the existing `GameOdds.playerProps` array. The weekly index never contains player props. Queries use a single field (`season` or `weekKey`), so no composite index is required with standard Firestore indexing.

A sync uses deterministic game IDs and overwrites full documents without merge. It deletes disappeared games and stale prop chunks only in the selected week, including prices from books that no longer offer a market. No consensus is stored. `updatedAt` uses Firestore's server commit timestamp.

The complete week is published in one atomic transaction. All network fetching/normalization happens before it. A pre-fetch revision check rejects a concurrent stale sync with 409. A game ID already owned by another stored week also fails safely. Writes are capped at 400 operations and a conservative 6 MB combined payload; individual documents are checked too. Oversized snapshots fail before commit and preserve existing data rather than partially publishing. The read-only transaction for game details keeps the weekly index, game, and props on one consistent snapshot. [Firestore transaction behavior](https://firebase.google.com/docs/firestore/manage-data/transactions).

A completely empty provider response returns an actionable 422 and leaves existing data intact, rather than treating a lack of provider coverage as a command to wipe a week. Successful nonempty responses replace the selected snapshot, even when some games have no available offers. Cancelled games are excluded. Failed fetches, malformed events, write failures, and capacity errors do not publish changes.

## Historical data and consensus

Previous synced weeks remain browseable. They represent the most recent manual pull, not a time series of line movement. Re-syncing completed games may remove their prices because the API marks closed quotes unavailable; historical closing-price support is intentionally not synthesized as currently available odds. Provider plan coverage determines which events/books/markets can be returned.

Consensus is unchanged: median available lines; average implied probabilities converted back to American odds; matching lines required before combining spread/total/prop prices. Missing books and prices do not contribute zero. Filtering remains client-side with existing persisted preferences.

## Verification and fixtures

Offline tests cover normalization, missing/unavailable data, incompatible O/U lines, DST/week boundaries, prop chunking, pagination failures, authentication/authorization, forged bodies, replacement semantics, rollback, concurrency protection, and loader reconstruction. They use a fixture shaped from the official schema and an in-memory Firestore transaction double. No real API key or production database writes are used by tests.

Run:

```powershell
node --import tsx --test src/lib/odds/consensus.test.ts src/lib/odds/server/*.test.ts src/app/api/admin/odds/sync/route.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build
```

Live API-to-Firestore verification requires the owner's configured key and a manual admin pull. The four retained files `src/lib/odds/fixtures/2026/week-1/games.json`, `BUF-MIA.json`, `DET-GB.json`, and `KC-LAC.json` are no longer used by pages. Keep them while the live integration is verified; the existing consensus fixture test still uses them.

## Files in this integration

Created / added to version control:

- `.env.example` — existing local template is now included by the gitignore exception.
- `src/components/odds/AdminOddsSync.tsx`
- `src/app/api/admin/odds/sync/route.ts`
- `src/app/api/admin/odds/sync/route.test.ts`
- `src/lib/odds/server/errors.ts`
- `src/lib/odds/server/weekRange.ts`
- `src/lib/odds/server/providerMapping.ts`
- `src/lib/odds/server/validation.ts`
- `src/lib/odds/server/sportsGameOdds.ts`
- `src/lib/odds/server/normalizeSportsGameOdds.ts`
- `src/lib/odds/server/snapshot.ts`
- `src/lib/odds/server/store.ts`
- `src/lib/odds/server/syncOdds.ts`
- `src/lib/odds/server/testHelpers.ts`
- `src/lib/odds/server/normalizeSportsGameOdds.test.ts`
- `src/lib/odds/server/sportsGameOdds.test.ts`
- `src/lib/odds/server/store.test.ts`
- `src/lib/odds/server/syncOdds.test.ts`

Modified:

- `.gitignore`
- `src/lib/odds/loadOdds.ts`
- `src/lib/odds/README.md`
- `src/components/odds/WeekSelector.tsx`
- `src/components/odds/OddsPageHeader.tsx`
- `src/components/odds/OddsValue.tsx`
- `src/app/(pages)/odds/nfl/[season]/[week]/page.tsx`
- `src/app/(pages)/odds/nfl/[season]/[week]/[game]/page.tsx`

The normalized types, consensus utilities, Firebase configuration, admin-access helper, existing auth routes, and mock JSON files were not changed.

### Latest verification

- 22 offline odds/security/storage tests passed.
- TypeScript and production build passed.
- Focused odds lint passed; full-project lint retains three existing errors in `signup/_components/UsernameInput.tsx` and `api/set-username/route.ts`.
- Local production smoke check: unauthenticated sync returned 401.
- Local production smoke check: the page successfully read Firestore and rendered the unpublished-week state without mock fallback.
- No live SportsGameOdds pull or odds database write was performed. The first end-to-end pull remains an admin action after configuring the key.

### Subscription coverage fix

SportsGameOdds can return HTTP 400 when a requested sportsbook is unavailable on the configured subscription tier. The client now recognizes that specific provider response, excludes only the identified supported book, and retries before pagination begins. It keeps the bookmaker filter and fails if no supported books remain. Restrictions encountered after pagination begins abort rather than publishing a partial snapshot. Each manual pull starts from all five books, so a future plan upgrade is picked up automatically.

Successful sync responses include `unavailableSportsbooks`; the admin confirmation names books excluded by the plan. Other upstream errors include a safe HTTP status without returning raw provider text or credentials.

The corrected live request returned 16 games and 69 normalized props for 2026 Week 1. This was a read-only API diagnostic; no Firestore writes occurred. Twelve focused regression tests passed, including the new subscription/pagination cases.


Odds pages load through `/api/odds` using a verified Firebase ID token. Weekly summaries require sign-in; individual games require a current RANKR Pass checked from the user document before reading odds. Signed-out visitors redirect to `/signup`; signed-in users without an active pass redirect to `/subscribe` for individual games. Responses are private and no-store. Test fixtures live outside public assets. Deployed Firestore rules must deny direct client reads of odds collections (the Admin SDK API still reads them) and prevent client writes to pass expiry. No Firestore rules are managed by this repository.
