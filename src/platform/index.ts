import { CrazyGamesPlatformAdapter } from "./crazygames";
import { PokiPlatformAdapter } from "./poki";
import type {
  AdKind,
  GamePlatformId,
  PlatformAdapter,
  PlatformPauseHooks,
} from "./types";
import { WebPlatformAdapter } from "./web";

export type { GamePlatformId } from "./types";

type GameplayPauseReason = "surface" | "visibility" | "page" | "context";

export class GamePlatform {
  readonly id: GamePlatformId;
  private loadingFinished = false;
  private gameplayRequested = false;
  private gameplayActive = false;
  private adPending = false;
  private readonly gameplayPauseReasons = new Set<GameplayPauseReason>();

  constructor(
    private readonly adapter: PlatformAdapter,
    private readonly hooks: PlatformPauseHooks,
  ) {
    this.id = adapter.id;
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
    this.adapter.loadingStart();
  }

  finishLoading(): void {
    if (this.loadingFinished) {
      return;
    }
    this.loadingFinished = true;
    this.adapter.loadingFinished();
  }

  beginGameplay(): void {
    if (!this.loadingFinished || this.gameplayRequested) {
      return;
    }
    this.gameplayRequested = true;
    this.syncGameplayState();
  }

  setGameplayPaused(reason: GameplayPauseReason, paused: boolean): void {
    if (paused) {
      this.gameplayPauseReasons.add(reason);
    } else {
      this.gameplayPauseReasons.delete(reason);
    }
    this.syncGameplayState();
  }

  async commercialBreak(): Promise<void> {
    await this.runAd("commercial");
  }

  async quizCommercialBreak(): Promise<boolean> {
    return this.runAd("commercial");
  }

  async rewardedBreak(): Promise<boolean> {
    return this.runAd("rewarded");
  }

  private async runAd(kind: AdKind): Promise<boolean> {
    if (this.adPending) {
      return false;
    }
    this.adPending = true;
    this.syncGameplayState();

    let paused = false;
    const pause = () => {
      if (paused) {
        return;
      }
      paused = true;
      this.hooks.pause();
    };

    try {
      return await this.adapter.requestAd(kind, pause);
    } finally {
      if (paused) {
        this.hooks.resume();
      }
      this.adPending = false;
      this.syncGameplayState();
    }
  }

  private syncGameplayState(): void {
    const shouldBeActive =
      this.loadingFinished &&
      this.gameplayRequested &&
      !this.adPending &&
      this.gameplayPauseReasons.size === 0;
    if (shouldBeActive === this.gameplayActive) {
      return;
    }
    this.gameplayActive = shouldBeActive;
    if (shouldBeActive) {
      this.adapter.gameplayStart();
    } else {
      this.adapter.gameplayStop();
    }
  }
}

export function createGamePlatform(
  hooks: PlatformPauseHooks,
): GamePlatform {
  const adapter = createAdapter(__GAME_PLATFORM__);
  return new GamePlatform(adapter, hooks);
}

function createAdapter(platform: GamePlatformId): PlatformAdapter {
  switch (platform) {
    case "poki":
      return new PokiPlatformAdapter();
    case "crazygames":
      return new CrazyGamesPlatformAdapter();
    case "web":
      return new WebPlatformAdapter();
  }
}
