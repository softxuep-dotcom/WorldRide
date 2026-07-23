import "./styles.css";
import { COUNTRIES, PHOTO_SPOTS } from "./game/data";
import { PocketEarthGame } from "./game/game";
import {
  getLocale,
  initializeI18n,
  setLocale,
} from "./i18n";

initializeI18n();

const canvas = document.getElementById("game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #game-canvas");
}

const game = new PocketEarthGame(canvas);
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
game.start();

declare global {
  interface Window {
    __POCKET_EARTH__: {
      game: PocketEarthGame;
      teleport: (longitude: number, latitude: number) => void;
      interact: () => void;
      getLocale: () => string;
      setLocale: (locale: string) => boolean;
    };
  }
}

window.__POCKET_EARTH__ = {
  game,
  teleport(longitude: number, latitude: number) {
    game.simulation.teleport(longitude, latitude);
  },
  interact() {
    game.interact();
  },
  getLocale,
  setLocale,
};
