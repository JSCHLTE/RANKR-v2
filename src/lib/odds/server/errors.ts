export class OddsSyncError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}
