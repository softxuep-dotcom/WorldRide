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

export class GamePlatform {
  readonly id: GamePlatformId;
  private gameplayActive = false;
  private adPending = false;

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

  async beginGameplay(): Promise<void> {
    this.adapter.loadingFinished();
    if (this.adapter.startupCommercial) {
      await this.adapter.requestAd("commercial", () => {});
    }
    this.gameplayActive = true;
    this.adapter.gameplayStart();
  }

  async commercialBreak(): Promise<void> {
    await this.runAd("commercial");
  }

  async rewardedBreak(): Promise<boolean> {
    return this.runAd("rewarded");
  }

  private async runAd(kind: AdKind): Promise<boolean> {
    if (this.adPending) {
      return false;
    }
    this.adPending = true;
    const resumeGameplay = this.gameplayActive;
    if (resumeGameplay) {
      this.gameplayActive = false;
      this.adapter.gameplayStop();
    }

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
      if (resumeGameplay) {
        this.gameplayActive = true;
        this.adapter.gameplayStart();
      }
      this.adPending = false;
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
