export type GamePlatformId = "web" | "poki" | "crazygames";
export type AdKind = "commercial" | "rewarded";

export interface PlatformAdapter {
  readonly id: GamePlatformId;
  readonly startupCommercial: boolean;
  initialize(): Promise<void>;
  loadingStart(): void;
  loadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  requestAd(kind: AdKind, onStart: () => void): Promise<boolean>;
}

export interface PlatformPauseHooks {
  pause(): void;
  resume(): void;
}
