/**
 * Versioned local save for travel progress.
 *
 * Storage is treated as optional throughout: private browsing, disabled
 * storage, a full quota or corrupt data must never stop the game from running.
 * Every failure path degrades to "no save" rather than throwing.
 */
const STORAGE_KEY = "pocket-earth:save";
const SAVE_VERSION = 1;
const ROUTINE_WRITE_INTERVAL_MS = 2000;

export interface SaveSnapshot {
  version: number;
  savedAt: number;
  position: { x: number; z: number };
  heading: number;
  elapsed: number;
  visitedCountries: string[];
  collectedPostcards: string[];
  completedQuizzes: string[];
  discoveredSpecialties: string[];
  activeTrip: string[];
  completedTrips: number;
  unlockedPaints: string[];
  equippedPaint: string;
}

function probeStorage(): Storage | undefined {
  try {
    const storage = window.localStorage;
    const probeKey = "__pocket_earth_probe__";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return undefined;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function parseSnapshot(raw: string): SaveSnapshot | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }

  const candidate = parsed as Partial<SaveSnapshot>;
  if (candidate.version !== SAVE_VERSION) {
    // Only one format exists so far; older or newer saves are discarded rather
    // than guessed at. Add migrations here when SAVE_VERSION moves past 1.
    return undefined;
  }

  // Trip and paint fields arrived after the first saves were written, so they
  // are read as optional: an older save loads and simply starts a fresh trip
  // rather than being thrown away.

  const position = candidate.position;
  if (
    !position ||
    typeof position !== "object" ||
    !isFiniteNumber(position.x) ||
    !isFiniteNumber(position.z)
  ) {
    return undefined;
  }

  return {
    version: SAVE_VERSION,
    savedAt: isFiniteNumber(candidate.savedAt) ? candidate.savedAt : 0,
    position: { x: position.x, z: position.z },
    heading: isFiniteNumber(candidate.heading) ? candidate.heading : 0,
    elapsed: isFiniteNumber(candidate.elapsed) && candidate.elapsed >= 0
      ? candidate.elapsed
      : 0,
    visitedCountries: toStringArray(candidate.visitedCountries),
    collectedPostcards: toStringArray(candidate.collectedPostcards),
    completedQuizzes: toStringArray(candidate.completedQuizzes),
    discoveredSpecialties: toStringArray(candidate.discoveredSpecialties),
    activeTrip: toStringArray(candidate.activeTrip),
    completedTrips:
      isFiniteNumber(candidate.completedTrips) && candidate.completedTrips >= 0
        ? Math.floor(candidate.completedTrips)
        : 0,
    unlockedPaints: toStringArray(candidate.unlockedPaints),
    equippedPaint:
      typeof candidate.equippedPaint === "string" ? candidate.equippedPaint : "",
  };
}

export class SaveStore {
  private readonly storage = probeStorage();
  private lastWriteAt = 0;
  private pendingSnapshot?: SaveSnapshot;
  private flushTimer?: number;

  get available(): boolean {
    return this.storage !== undefined;
  }

  load(): SaveSnapshot | undefined {
    if (!this.storage) {
      return undefined;
    }
    let raw: string | null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch {
      return undefined;
    }
    if (!raw) {
      return undefined;
    }

    const snapshot = parseSnapshot(raw);
    if (!snapshot) {
      // Unreadable save: clear it so the player is not stuck failing to load
      // the same broken record on every visit.
      this.clear();
    }
    return snapshot;
  }

  /**
   * `immediate` is for milestones (a new country, a postcard, a finished
   * challenge). Routine position updates are throttled so driving does not
   * write to storage every frame.
   */
  save(snapshot: Omit<SaveSnapshot, "version" | "savedAt">, immediate = false): void {
    if (!this.storage) {
      return;
    }

    const record: SaveSnapshot = {
      ...snapshot,
      version: SAVE_VERSION,
      savedAt: Date.now(),
    };

    if (immediate) {
      this.writeNow(record);
      return;
    }

    this.pendingSnapshot = record;
    const elapsed = Date.now() - this.lastWriteAt;
    if (elapsed >= ROUTINE_WRITE_INTERVAL_MS) {
      this.flush();
      return;
    }
    if (this.flushTimer === undefined) {
      this.flushTimer = window.setTimeout(
        () => this.flush(),
        ROUTINE_WRITE_INTERVAL_MS - elapsed,
      );
    }
  }

  flush(): void {
    if (this.flushTimer !== undefined) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
    if (this.pendingSnapshot) {
      this.writeNow(this.pendingSnapshot);
    }
  }

  clear(): void {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing further to do; the game keeps running without a save.
    }
  }

  private writeNow(record: SaveSnapshot): void {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(record));
      this.lastWriteAt = Date.now();
      this.pendingSnapshot = undefined;
    } catch {
      // Quota exceeded or storage revoked mid-session: keep playing unsaved.
    }
  }
}
