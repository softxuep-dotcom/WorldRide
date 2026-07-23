import "./styles.css";
import { COUNTRIES } from "./game/data";
import { PocketEarthGame } from "./game/game";

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

if (requestedCountry) {
  game.simulation.state.visitedCountries.clear();
  game.simulation.state.collectedPostcards.clear();
  game.simulation.teleport(
    requestedCountry.city.point[0],
    requestedCountry.city.point[1],
  );
}
game.start();

declare global {
  interface Window {
    __POCKET_EARTH__: {
      game: PocketEarthGame;
      teleport: (longitude: number, latitude: number) => void;
      interact: () => void;
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
};
