import "./styles.css";
import type { PocketEarthGame } from "./game/game";
import {
  getLocale,
  initializeI18n,
  setLocale,
  t,
} from "./i18n";
import { createGamePlatform, type GamePlatformId } from "./platform";

let activeLoadingScreen: ReturnType<typeof createLoadingScreen> | undefined;

declare global {
  interface Window {
    __POCKET_EARTH__: {
      game: PocketEarthGame;
      platform: GamePlatformId;
      teleport: (longitude: number, latitude: number) => void;
      interact: () => void;
      commercialBreak: () => Promise<void>;
      rewardedBreak: () => Promise<boolean>;
      getLocale: () => string;
      setLocale: (locale: string) => Promise<boolean>;
    };
  }
}

async function bootstrap(): Promise<void> {
  const pageParams = new URLSearchParams(window.location.search);
  if (pageParams.get("capture") === "cover") {
    document.documentElement.dataset.coverCapture = "true";
  }

  const loading = createLoadingScreen();
  activeLoadingScreen = loading;
  loading.update(0.08, "Preparing your trip…");

  let game: PocketEarthGame | undefined;
  const platform = createGamePlatform({
    pause: () => game?.pauseForPlatform(),
    resume: () => game?.resumeFromPlatform(),
  });

  await Promise.all([initializeI18n(), platform.initialize()]);
  document.documentElement.dataset.gamePlatform = platform.id;
  loading.update(0.28, t("loading.map"));

  const [{ PocketEarthGame }, { COUNTRIES, PHOTO_SPOTS }] = await Promise.all([
    import("./game/game"),
    import("./game/data"),
  ]);

  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #game-canvas");
  }

  loading.update(0.58, t("loading.engine"));
  game = new PocketEarthGame(
    canvas,
    () => platform.quizCommercialBreak(),
    platform.id === "web" ? undefined : () => platform.rewardedBreak(),
  );

  const requestedStart = pageParams.get("start");
  const requestedLongitude = Number(pageParams.get("longitude"));
  const requestedLatitude = Number(pageParams.get("latitude"));
  const requestedPoint =
    pageParams.get("capture") === "cover" &&
    Number.isFinite(requestedLongitude) &&
    Number.isFinite(requestedLatitude)
      ? ([requestedLongitude, requestedLatitude] as const)
      : undefined;
  const requestedCountry = requestedStart
    ? COUNTRIES.find(
        (country) =>
          country.id === requestedStart ||
          country.englishName.toLowerCase() === requestedStart.toLowerCase(),
      )
    : undefined;
  const requestedPhotoSpot = requestedStart
    ? PHOTO_SPOTS.find((spot) => spot.id === requestedStart)
    : undefined;

  if (requestedPoint || requestedCountry || requestedPhotoSpot) {
    game.simulation.state.visitedCountries.clear();
    game.simulation.state.collectedPostcards.clear();
    game.simulation.state.currentCountry = undefined;
    const point =
      requestedPoint ??
      requestedPhotoSpot?.point ??
      requestedCountry!.city.point;
    game.simulation.teleport(point[0], point[1]);
  }

  game.renderInitialFrame();
  loading.update(0.86, t("loading.ready"));
  platform.finishLoading();
  game.start();
  beginGameplayOnFirstInput(() => platform.beginGameplay());
  document.documentElement.dataset.gameReady = "true";
  loading.complete();

  void game.loadDeferredContent().catch((error: unknown) => {
    console.warn("[assets] Optional world details could not be loaded.", error);
  });

  window.__POCKET_EARTH__ = {
    game,
    platform: platform.id,
    teleport(longitude: number, latitude: number) {
      game!.simulation.teleport(longitude, latitude);
    },
    interact() {
      game!.interact();
    },
    commercialBreak: () => platform.commercialBreak(),
    rewardedBreak: () => platform.rewardedBreak(),
    getLocale,
    setLocale,
  };
}

function beginGameplayOnFirstInput(beginGameplay: () => void): void {
  const onFirstInput = (event: PointerEvent | KeyboardEvent): void => {
    if (
      (event instanceof PointerEvent && !event.isPrimary) ||
      (event instanceof KeyboardEvent && event.repeat)
    ) {
      return;
    }
    window.removeEventListener("pointerdown", onFirstInput);
    window.removeEventListener("keydown", onFirstInput);
    beginGameplay();
  };

  window.addEventListener("pointerdown", onFirstInput);
  window.addEventListener("keydown", onFirstInput);
}

function createLoadingScreen(): {
  update(progress: number, label: string): void;
  complete(): void;
  fail(message: string): void;
} {
  const root = document.getElementById("loading-screen");
  const label = document.getElementById("loading-label");
  const bar = document.getElementById("loading-progress-bar");
  if (!(root instanceof HTMLElement) || !(label instanceof HTMLElement)) {
    throw new Error("Missing loading screen elements");
  }
  if (!(bar instanceof HTMLElement)) {
    throw new Error("Missing loading progress bar");
  }

  return {
    update(progress, message) {
      label.textContent = message;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
    },
    complete() {
      bar.style.transform = "scaleX(1)";
      root.setAttribute("aria-busy", "false");
      root.classList.add("is-complete");
      window.setTimeout(() => root.remove(), 420);
    },
    fail(message) {
      label.textContent = message;
      root.classList.add("has-error");
    },
  };
}

void bootstrap().catch((error: unknown) => {
  console.error("Pocket Planet failed to start.", error);
  activeLoadingScreen?.fail(t("loading.error"));
});
