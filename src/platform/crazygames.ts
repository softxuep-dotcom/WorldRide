import type { AdKind, PlatformAdapter } from "./types";

interface CrazyGamesAdCallbacks {
  adStarted(): void;
  adFinished(): void;
  adError(error: unknown): void;
}

interface CrazyGamesSdk {
  init(): Promise<void>;
  readonly environment?: "local" | "crazygames" | "disabled";
  readonly game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
  };
  readonly ad: {
    requestAd(
      kind: "midgame" | "rewarded",
      callbacks: CrazyGamesAdCallbacks,
    ): void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSdk;
    };
  }
}

export class CrazyGamesPlatformAdapter implements PlatformAdapter {
  readonly id = "crazygames";
  private sdk?: CrazyGamesSdk;

  async initialize(): Promise<void> {
    const sdk = window.CrazyGames?.SDK;
    if (!sdk) {
      console.warn(
        "[platform] CrazyGames SDK script was not available; continuing.",
      );
      return;
    }
    try {
      await sdk.init();
      this.sdk = sdk;
    } catch (error) {
      console.warn(
        "[platform] CrazyGames SDK initialization failed; continuing.",
        error,
      );
    }
  }

  loadingStart(): void {
    this.availableSdk()?.game.loadingStart();
  }

  loadingFinished(): void {
    this.availableSdk()?.game.loadingStop();
  }

  gameplayStart(): void {
    this.availableSdk()?.game.gameplayStart();
  }

  gameplayStop(): void {
    this.availableSdk()?.game.gameplayStop();
  }

  requestAd(kind: AdKind, onStart: () => void): Promise<boolean> {
    const sdk = this.availableSdk();
    if (!sdk) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (shown: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(shown);
      };
      try {
        sdk.ad.requestAd(kind === "commercial" ? "midgame" : "rewarded", {
          adStarted: onStart,
          adFinished: () => finish(true),
          adError: (error) => {
            console.warn(`[platform] CrazyGames ${kind} ad was unavailable.`, error);
            finish(false);
          },
        });
      } catch (error) {
        console.warn(`[platform] CrazyGames ${kind} ad request failed.`, error);
        finish(false);
      }
    });
  }

  private availableSdk(): CrazyGamesSdk | undefined {
    return this.sdk?.environment === "disabled" ? undefined : this.sdk;
  }
}
