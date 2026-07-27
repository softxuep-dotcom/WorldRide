import type { AdKind, PlatformAdapter } from "./types";

export class WebPlatformAdapter implements PlatformAdapter {
  readonly id = "web";
  readonly startupCommercial = false;

  async initialize(): Promise<void> {}

  loadingStart(): void {}

  loadingFinished(): void {}

  gameplayStart(): void {}

  gameplayStop(): void {}

  async requestAd(_kind: AdKind, _onStart: () => void): Promise<boolean> {
    return false;
  }
}
