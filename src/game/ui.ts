import {
  COUNTRIES,
  MAP_BOUNDS,
  type CountryDefinition,
  getSeaName,
  geoToWorld,
  getCountryBorders,
} from "./data";
import type { GameEvent, GameState } from "./simulation";
import { getCurrentGeoPosition } from "./simulation";
import { WORLD_COUNTRIES } from "./world-map";

interface UIElements {
  placeName: HTMLElement;
  modeName: HTMLElement;
  modeIcon: HTMLElement;
  countryReveal: HTMLElement;
  countryFlag: HTMLElement;
  countryKicker: HTMLElement;
  countryName: HTMLElement;
  countryIntro: HTMLElement;
  toast: HTMLElement;
  visitedCount: HTMLElement;
  miniMapSvg: SVGSVGElement;
  interactButton: HTMLButtonElement;
  passportButton: HTMLButtonElement;
  passportPanel: HTMLElement;
  passportClose: HTMLButtonElement;
  stampGrid: HTMLElement;
  controlsHint: HTMLElement;
  flash: HTMLElement;
  worldMapButton: HTMLButtonElement;
  mapViewLabel: HTMLElement;
}

export class GameUI {
  private readonly elements: UIElements;
  private readonly playerDot: SVGCircleElement;
  private readonly playerHalo: SVGCircleElement;
  private revealTimer?: number;
  private toastTimer?: number;
  private previousNearestLandmark?: string;

  constructor(onInteract: () => void, onToggleWorldView: () => void) {
    this.elements = {
      placeName: requireElement("place-name"),
      modeName: requireElement("mode-name"),
      modeIcon: requireElement("mode-icon"),
      countryReveal: requireElement("country-reveal"),
      countryFlag: requireElement("country-flag"),
      countryKicker: requireElement("country-kicker"),
      countryName: requireElement("country-name"),
      countryIntro: requireElement("country-intro"),
      toast: requireElement("toast"),
      visitedCount: requireElement("visited-count"),
      miniMapSvg: requireSvgElement("mini-map-svg"),
      interactButton: requireButton("interact-button"),
      passportButton: requireButton("passport-button"),
      passportPanel: requireElement("passport-panel"),
      passportClose: requireButton("passport-close"),
      stampGrid: requireElement("stamp-grid"),
      controlsHint: requireElement("controls-hint"),
      flash: requireElement("flash"),
      worldMapButton: requireButton("world-map-button"),
      mapViewLabel: requireElement("map-view-label"),
    };

    const { halo, dot } = this.buildMiniMap();
    this.playerHalo = halo;
    this.playerDot = dot;
    this.buildPassport();

    this.elements.interactButton.addEventListener("click", onInteract);
    this.elements.worldMapButton.addEventListener("click", onToggleWorldView);
    this.elements.passportButton.addEventListener("click", () => this.togglePassport());
    this.elements.passportClose.addEventListener("click", () => this.togglePassport(false));

    window.setTimeout(() => this.elements.controlsHint.classList.add("is-faded"), 7000);
  }

  update(state: GameState): void {
    const geoPosition = getCurrentGeoPosition(state);
    const placeName =
      state.currentCountry?.name ??
      state.currentWorldCountryName ??
      getSeaName(geoPosition);

    this.elements.placeName.textContent = placeName;
    this.elements.modeName.textContent = state.vehicleMode === "car" ? "汽车模式" : "小船模式";
    this.elements.modeIcon.textContent = state.vehicleMode === "car" ? "🚗" : "🚤";
    this.elements.visitedCount.textContent = `${state.visitedCountries.size} / ${COUNTRIES.length}`;

    const mapPosition = geoToMiniMap(geoPosition);
    this.playerDot.setAttribute("cx", String(mapPosition.x));
    this.playerDot.setAttribute("cy", String(mapPosition.y));
    this.playerHalo.setAttribute("cx", String(mapPosition.x));
    this.playerHalo.setAttribute("cy", String(mapPosition.y));

    for (const country of COUNTRIES) {
      const element = document.querySelector<SVGElement>(`[data-country-map="${country.id}"]`);
      element?.classList.toggle("is-visited", state.visitedCountries.has(country.id));

      const stamp = document.querySelector<HTMLElement>(`[data-country-stamp="${country.id}"]`);
      stamp?.classList.toggle("is-visited", state.visitedCountries.has(country.id));
    }

    const nearestId = state.nearestLandmark?.id;
    this.elements.interactButton.classList.toggle("is-visible", Boolean(nearestId));
    if (state.nearestLandmark) {
      const collected = state.collectedPostcards.has(state.nearestLandmark.id);
      this.elements.interactButton.lastElementChild!.textContent = collected
        ? `重拍 · ${state.nearestLandmark.city.name}`
        : `拍照 · ${state.nearestLandmark.city.name}`;
    }

    if (nearestId && nearestId !== this.previousNearestLandmark) {
      this.showToast(`发现拍照点：${state.nearestLandmark!.city.name}`);
    }
    this.previousNearestLandmark = nearestId;
  }

  handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "country-entered":
        this.showCountry(event.country, event.firstVisit);
        break;
      case "mode-changed":
        this.showToast(event.mode === "boat" ? "咔哒！轮胎收起，变成小船" : "啪嗒！轮胎落下，继续开车");
        break;
      case "map-edge":
        this.showToast("这里是原型地图的边缘，换个方向继续旅行吧");
        break;
      case "postcard-collected":
        this.capturePostcard(event.country, event.firstCollection);
        break;
    }
  }

  showToast(message: string): void {
    window.clearTimeout(this.toastTimer);
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add("is-visible");
    this.toastTimer = window.setTimeout(() => {
      this.elements.toast.classList.remove("is-visible");
    }, 2200);
  }

  setWorldOverview(active: boolean): void {
    document.getElementById("game-shell")?.classList.toggle("is-world-overview", active);
    this.elements.worldMapButton.classList.toggle("is-overview", active);
    this.elements.worldMapButton.setAttribute("aria-pressed", String(active));
    this.elements.mapViewLabel.textContent = active
      ? "世界地图 · 点击返回"
      : "世界地图 · 点击展开";
    this.showToast(active ? "全球拼盘地图" : "返回旅行车");
  }

  private showCountry(country: CountryDefinition, firstVisit: boolean): void {
    window.clearTimeout(this.revealTimer);
    this.elements.countryFlag.textContent = country.flag;
    this.elements.countryKicker.textContent = firstVisit ? "新国家 · 护照已盖章" : "再次进入";
    this.elements.countryName.textContent = country.name;
    this.elements.countryIntro.textContent = country.intro;
    this.elements.countryReveal.classList.add("is-visible");
    this.revealTimer = window.setTimeout(() => {
      this.elements.countryReveal.classList.remove("is-visible");
    }, firstVisit ? 3900 : 2000);
  }

  private capturePostcard(country: CountryDefinition, firstCollection: boolean): void {
    this.elements.flash.classList.remove("is-active");
    void this.elements.flash.offsetWidth;
    this.elements.flash.classList.add("is-active");

    const fact = country.facts[Math.floor(Math.random() * country.facts.length)];
    this.showToast(
      firstCollection
        ? `明信片已收藏：${country.city.postcard} · ${fact}`
        : `又拍了一张 ${country.city.name} 的照片`,
    );
  }

  private togglePassport(force?: boolean): void {
    const shouldOpen =
      force ?? !this.elements.passportPanel.classList.contains("is-visible");
    this.elements.passportPanel.classList.toggle("is-visible", shouldOpen);
    this.elements.passportPanel.setAttribute("aria-hidden", String(!shouldOpen));
    this.elements.passportButton.setAttribute("aria-expanded", String(shouldOpen));
  }

  private buildMiniMap(): { halo: SVGCircleElement; dot: SVGCircleElement } {
    const namespace = "http://www.w3.org/2000/svg";

    for (const country of WORLD_COUNTRIES) {
      const path = document.createElementNS(namespace, "path");
      const commands = country.renderPolygons
        .filter((polygon) => polygon.length >= 3)
        .map((polygon) =>
          polygon
            .map((point, index) => {
              const projected = geoToMiniMap(point);
              return `${index === 0 ? "M" : "L"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
            })
            .join(" ") + " Z",
        )
        .join(" ");
      path.setAttribute("d", commands);
      path.setAttribute("class", "map-country--world");
      this.elements.miniMapSvg.append(path);
    }

    for (const country of COUNTRIES) {
      const path = document.createElementNS(namespace, "path");
      const commands = getCountryBorders(country)
        .map(
          (border) =>
            border
              .map((point, index) => {
                const projected = geoToMiniMap(point);
                return `${index === 0 ? "M" : "L"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
              })
              .join(" ") + " Z",
        )
        .join(" ");
      path.setAttribute("d", commands);
      path.setAttribute("fill", country.color);
      path.setAttribute("class", "map-country");
      path.dataset.countryMap = country.id;
      this.elements.miniMapSvg.append(path);
    }

    const halo = document.createElementNS(namespace, "circle");
    halo.setAttribute("r", "5.5");
    halo.setAttribute("class", "map-player-halo");
    this.elements.miniMapSvg.append(halo);

    const dot = document.createElementNS(namespace, "circle");
    dot.setAttribute("r", "3.2");
    dot.setAttribute("class", "map-player");
    this.elements.miniMapSvg.append(dot);

    return { halo, dot };
  }

  private buildPassport(): void {
    COUNTRIES.forEach((country, index) => {
      const stamp = document.createElement("div");
      stamp.className = "stamp";
      stamp.dataset.countryStamp = country.id;
      stamp.style.setProperty("--stamp-color", country.darkColor);
      stamp.style.setProperty("--stamp-tilt", `${index % 2 === 0 ? -3 : 3}deg`);
      stamp.innerHTML = `<span>${country.flag}</span><small>${country.name}</small>`;
      this.elements.stampGrid.append(stamp);
    });
  }
}

function geoToMiniMap(point: readonly [number, number]): { x: number; y: number } {
  const world = geoToWorld(point);
  const northWest = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
  const southEast = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);
  return {
    x: ((world.x - northWest.x) / (southEast.x - northWest.x)) * 360,
    y: ((world.z - northWest.z) / (southEast.z - northWest.z)) * 180,
  };
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing UI element #${id}`);
  }
  return element;
}

function requireButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing button #${id}`);
  }
  return element;
}

function requireSvgElement(id: string): SVGSVGElement {
  const element = document.getElementById(id);
  if (!(element instanceof SVGSVGElement)) {
    throw new Error(`Missing SVG #${id}`);
  }
  return element;
}
