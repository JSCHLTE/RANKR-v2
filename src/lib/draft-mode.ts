export type DraftPick = "mine" | "other";
export interface DraftState { active: boolean; picks: Record<string, DraftPick> }
export const emptyDraft = (): DraftState => ({ active: false, picks: {} });
export const draftStorageKey = (uid: string, rankingId: string) => `rankr-draft-v1:${encodeURIComponent(uid)}:${encodeURIComponent(rankingId)}`;
export function readDraft(raw: string | null, playerIds: string[]): DraftState {
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object" || !data.picks || typeof data.picks !== "object" || Array.isArray(data.picks)) return emptyDraft();
    const picks: Record<string, DraftPick> = {};
    for (const id of playerIds) if (Object.hasOwn(data.picks, id) && (data.picks[id] === "mine" || data.picks[id] === "other")) picks[id] = data.picks[id];
    return { active: data.active === true, picks };
  } catch { return emptyDraft(); }
}
export function togglePick(state: DraftState, playerId: string, pick: DraftPick): DraftState {
  const picks = { ...state.picks };
  if (picks[playerId] === pick) delete picks[playerId]; else picks[playerId] = pick;
  return { ...state, picks };
}
