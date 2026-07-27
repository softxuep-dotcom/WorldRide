import type { AdKind, PlatformAdapter } from "./types";

interface PokiSdk {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(options?: {
    size?: "small" | "medium" | "large";
    onStart?: () => void;
  }): Promise<boolean>;
}

declare global {
  interface Window {
    PokiSDK?: PokiSdk;
  }
}

export class PokiPlatformAdapter implements PlatformAdapter {
  readonly id = "poki";
  readonly startupCommercial = true;
  private sdk?: PokiSdk;

  async initialize(): Promise<void> {
    this.sdk = window.PokiSDK;
    if (!this.sdk) {
      console.warn("[platform] Poki SDK script was not available; continuing.");
      return;
    }
    try {
      await this.sdk.init();
    } catch (error) {
      // Poki explicitly recommends continuing to load the game if init rejects.
      console.warn("[platform] Poki SDK initialization reported an error.", error);
    }
  }

  loadingStart(): void {}

  loadingFinished(): void {
    this.sdk?.gameLoadingFinished();
  }

  gameplayStart(): void {
    this.sdk?.gameplayStart();
  }

  gameplayStop(): void {
    this.sdk?.gameplayStop();
  }

  async requestAd(kind: AdKind, onStart: () => void): Promise<boolean> {
    if (!this.sdk) {
      return false;
    }
    try {
      if (kind === "rewarded") {
        return await this.sdk.rewardedBreak({
          size: "medium",
          onStart,
        });
      }
      await this.sdk.commercialBreak(onStart);
      return true;
    } catch (error) {
      console.warn(`[platform] Poki ${kind} ad request failed.`, error);
      return false;
    }
  }
}
