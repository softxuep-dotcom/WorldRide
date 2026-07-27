import "./styles.css";
import { COUNTRIES, PHOTO_SPOTS } from "./game/data";
import { PocketEarthGame } from "./game/game";
import {
  getLocale,
  initializeI18n,
  setLocale,
} from "./i18n";
import { createGamePlatform, type GamePlatformId } from "./platform";

initializeI18n();

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
      setLocale: (locale: string) => boolean;
    };
  }
}

async function bootstrap(): Promise<void> {
  let game: PocketEarthGame | undefined;
  const platform = createGamePlatform({
    pause: () => game?.pauseForPlatform(),
    resume: () => game?.resumeFromPlatform(),
  });
  await platform.initialize();
  document.documentElement.dataset.gamePlatform = platform.id;

  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #game-canvas");
  }

  game = new PocketEarthGame(
    canvas,
    () => {
      void platform.commercialBreak();
    },
    platform.id === "web" ? undefined : () => platform.rewardedBreak(),
  );
  const requestedStart = new URLSearchParams(window.location.search).get("start");
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

  if (requestedCountry || requestedPhotoSpot) {
    game.simulation.state.visitedCountries.clear();
    game.simulation.state.collectedPostcards.clear();
    game.simulation.state.currentCountry = undefined;
    const point = requestedPhotoSpot?.point ?? requestedCountry!.city.point;
    game.simulation.teleport(point[0], point[1]);
  }

  await platform.beginGameplay();
  game.start();

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

void bootstrap().catch((error: unknown) => {
  console.error("Tiny World Roadtrip failed to start.", error);
});
