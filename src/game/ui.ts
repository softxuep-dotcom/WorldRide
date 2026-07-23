import {
  MAP_BOUNDS,
  type PhotoSpotDefinition,
  geoToWorld,
} from "./data";
import type { GameEvent, GameState } from "./simulation";
import { getCurrentGeoPosition } from "./simulation";
import {
  WORLD_COUNTRIES,
  type CountryProfile,
  getPassportCountryProfiles,
  getCountryProfile,
  getCountryTierColor,
  getWorldCountryByName,
} from "./world-map";
import {
  getLocale,
  getSupportedLocales,
  localizePhotoSpot,
  onLocaleChange,
  setLocale,
  t,
} from "../i18n";

interface UIElements {
  countryReveal: HTMLElement;
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
  landmarkDetail: HTMLElement;
  landmarkDetailBackdrop: HTMLButtonElement;
  landmarkDetailClose: HTMLButtonElement;
  landmarkDetailKind: HTMLElement;
  landmarkDetailName: HTMLElement;
  landmarkDetailCountry: HTMLElement;
  landmarkDetailIntro: HTMLElement;
  landmarkDetailDescription: HTMLElement;
  landmarkDetailFact: HTMLElement;
  landmarkDetailStatus: HTMLElement;
  landmarkDetailConfirm: HTMLButtonElement;
  languageSelect: HTMLSelectElement;
}

export class GameUI {
  private readonly elements: UIElements;
  private readonly playerDot: SVGCircleElement;
  private readonly playerHalo: SVGCircleElement;
  private toastTimer?: number;
  private displayedContextId?: string;
  private previousNearestPhotoSpot?: string;
  private selectedPhotoSpot?: PhotoSpotDefinition;
  private selectedCountry?: CountryProfile;
  private currentCountry?: CountryProfile;
  private currentNearestPhotoSpot?: PhotoSpotDefinition;
  private selectedPhotoSpotFirstCollection = false;
  private worldOverviewActive = false;

  constructor(onInteract: () => void, onToggleWorldView: () => void) {
    this.elements = {
      countryReveal: requireElement("country-reveal"),
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
      landmarkDetail: requireElement("landmark-detail"),
      landmarkDetailBackdrop: requireButton("landmark-detail-backdrop"),
      landmarkDetailClose: requireButton("landmark-detail-close"),
      landmarkDetailKind: requireElement("landmark-detail-kind"),
      landmarkDetailName: requireElement("landmark-detail-name"),
      landmarkDetailCountry: requireElement("landmark-detail-country"),
      landmarkDetailIntro: requireElement("landmark-detail-intro"),
      landmarkDetailDescription: requireElement("landmark-detail-description"),
      landmarkDetailFact: requireElement("landmark-detail-fact"),
      landmarkDetailStatus: requireElement("landmark-detail-status"),
      landmarkDetailConfirm: requireButton("landmark-detail-confirm"),
      languageSelect: requireSelect("language-select"),
    };

    this.buildLanguageSelector();
    const { halo, dot } = this.buildMiniMap();
    this.playerHalo = halo;
    this.playerDot = dot;
    this.buildPassport();

    this.elements.interactButton.addEventListener("click", () => {
      if (this.currentNearestPhotoSpot) {
        onInteract();
      } else if (this.currentCountry) {
        this.showCountryDetail(this.currentCountry);
      }
    });
    this.elements.worldMapButton.addEventListener("click", onToggleWorldView);
    this.elements.passportButton.addEventListener("click", () => this.togglePassport());
    this.elements.passportClose.addEventListener("click", () => this.togglePassport(false));
    this.elements.landmarkDetailBackdrop.addEventListener("click", () =>
      this.toggleLandmarkDetail(false),
    );
    this.elements.landmarkDetailClose.addEventListener("click", () =>
      this.toggleLandmarkDetail(false),
    );
    this.elements.landmarkDetailConfirm.addEventListener("click", () =>
      this.toggleLandmarkDetail(false),
    );
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        this.toggleLandmarkDetail(false);
        this.togglePassport(false);
      }
    });

    window.setTimeout(() => this.elements.controlsHint.classList.add("is-faded"), 7000);
    onLocaleChange(() => this.refreshLocale());
  }

  update(state: GameState): void {
    const geoPosition = getCurrentGeoPosition(state);
    const currentWorldCountry = state.currentCountryProfile
      ? WORLD_COUNTRIES.find(
          (country) => country.id === state.currentCountryProfile?.id,
        )
      : undefined;
    const currentProfile = currentWorldCountry
      ? getCountryProfile(currentWorldCountry)
      : undefined;
    const profile = currentProfile?.showReveal
      ? currentProfile
      : undefined;
    const localizedSpot = state.nearestPhotoSpot
      ? localizePhotoSpot(state.nearestPhotoSpot)
      : undefined;
    this.currentCountry = profile;
    this.currentNearestPhotoSpot = state.nearestPhotoSpot;
    this.updateTravelInfo(profile, localizedSpot);
    const passportCountries = getPassportCountryProfiles();
    this.elements.visitedCount.textContent =
      `${state.visitedCountries.size} / ${passportCountries.length}`;

    const mapPosition = geoToMiniMap(geoPosition);
    this.playerDot.setAttribute("cx", String(mapPosition.x));
    this.playerDot.setAttribute("cy", String(mapPosition.y));
    this.playerHalo.setAttribute("cx", String(mapPosition.x));
    this.playerHalo.setAttribute("cy", String(mapPosition.y));

    for (const country of passportCountries) {
      const element = document.querySelector<SVGElement>(
        `[data-country-map="${country.id}"]`,
      );
      element?.classList.toggle(
        "is-visited",
        state.visitedCountries.has(country.id),
      );

      const stamp = document.querySelector<HTMLElement>(
        `[data-country-stamp="${country.id}"]`,
      );
      stamp?.classList.toggle(
        "is-visited",
        state.visitedCountries.has(country.id),
      );
    }

    const nearestId = state.nearestPhotoSpot?.id;
    this.elements.interactButton.disabled = !profile && !state.nearestPhotoSpot;

    if (nearestId && nearestId !== this.previousNearestPhotoSpot) {
      this.showToast(
        t("toast.discoveredSpot", {
          name: localizePhotoSpot(state.nearestPhotoSpot!).name,
        }),
      );
    }
    this.previousNearestPhotoSpot = nearestId;
  }

  handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "country-entered":
        break;
      case "mode-changed":
        this.showToast(
          event.mode === "boat" ? t("toast.boatMode") : t("toast.carMode"),
        );
        break;
      case "map-edge":
        this.showToast(t("toast.mapEdge"));
        break;
      case "world-wrapped":
        this.showToast(t("toast.worldWrapped"));
        break;
      case "postcard-collected":
        this.capturePostcard(event.spot, event.firstCollection);
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
    this.worldOverviewActive = active;
    document.getElementById("game-shell")?.classList.toggle("is-world-overview", active);
    this.elements.worldMapButton.classList.toggle("is-overview", active);
    this.elements.worldMapButton.setAttribute("aria-pressed", String(active));
    this.elements.mapViewLabel.textContent = active
      ? t("worldMap.back")
      : t("worldMap.label");
    this.showToast(
      active ? t("worldMap.openToast") : t("worldMap.closeToast"),
    );
  }

  isInputBlocked(): boolean {
    return (
      this.elements.landmarkDetail.classList.contains("is-visible") ||
      this.elements.passportPanel.classList.contains("is-visible")
    );
  }

  private updateTravelInfo(
    country?: CountryProfile,
    spot?: PhotoSpotDefinition,
  ): void {
    if (!country && !spot) {
      this.displayedContextId = undefined;
      this.elements.countryReveal.classList.remove("is-visible");
      return;
    }

    this.elements.countryReveal.classList.add("is-visible");
    const contextId = spot ? `spot:${spot.id}` : `country:${country!.id}`;
    if (contextId === this.displayedContextId) {
      return;
    }

    this.displayedContextId = contextId;
    this.elements.countryReveal.classList.toggle("has-landmark", Boolean(spot));
    if (spot) {
      this.elements.countryName.textContent = spot.name;
      this.elements.countryIntro.textContent = spot.postcard;
      this.elements.interactButton.setAttribute(
        "aria-label",
        t("aria.landmarkDetail", { name: spot.name }),
      );
      return;
    }

    this.elements.countryName.textContent = country!.name;
    this.elements.countryIntro.textContent = country!.intro;
    this.elements.interactButton.setAttribute(
      "aria-label",
      t("aria.countryDetail", { name: country!.name }),
    );
  }

  private showCountryDetail(country: CountryProfile): void {
    this.selectedPhotoSpot = undefined;
    this.selectedCountry = country;
    this.elements.landmarkDetail.classList.add("is-country-detail");
    this.elements.landmarkDetailKind.textContent = "";
    this.elements.landmarkDetailName.textContent = country.name;
    this.elements.landmarkDetailCountry.textContent = "";
    this.elements.landmarkDetailIntro.textContent = country.intro;
    this.elements.landmarkDetailDescription.textContent =
      country.details.join(" ");
    this.elements.landmarkDetailFact.textContent = "";
    this.elements.landmarkDetailStatus.textContent = "";
    this.elements.landmarkDetailConfirm.textContent = t("action.backToJourney");
    this.togglePassport(false);
    this.toggleLandmarkDetail(true);
  }

  private capturePostcard(spot: PhotoSpotDefinition, firstCollection: boolean): void {
    this.elements.flash.classList.remove("is-active");
    void this.elements.flash.offsetWidth;
    this.elements.flash.classList.add("is-active");

    this.showLandmarkDetail(spot, firstCollection);
  }

  private showLandmarkDetail(
    spot: PhotoSpotDefinition,
    firstCollection: boolean,
  ): void {
    const localizedSpot = localizePhotoSpot(spot);
    const atlasCountry = getWorldCountryByName(spot.atlasCountryName);
    const worldCountry = atlasCountry
      ? getCountryProfile(atlasCountry)
      : undefined;
    const countryFlag = worldCountry?.flag ?? "◆";
    const countryName =
      worldCountry?.name ?? spot.atlasCountryName;
    const kindLabels: Readonly<Record<PhotoSpotDefinition["kind"], string>> = {
      landmark: t("landmark.kind.landmark"),
      natural: t("landmark.kind.natural"),
      wonder: t("landmark.kind.wonder"),
    };
    this.selectedCountry = undefined;
    this.selectedPhotoSpot = spot;
    this.selectedPhotoSpotFirstCollection = firstCollection;
    this.elements.landmarkDetail.classList.remove("is-country-detail");
    this.elements.landmarkDetailKind.textContent = kindLabels[spot.kind];
    this.elements.landmarkDetailName.textContent = localizedSpot.name;
    this.elements.landmarkDetailCountry.textContent =
      `${countryFlag} ${countryName} · ${t("landmark.travelSelection")}`;
    this.elements.landmarkDetailIntro.textContent = localizedSpot.postcard;
    this.elements.landmarkDetailDescription.textContent =
      localizedSpot.description;
    this.elements.landmarkDetailFact.textContent = localizedSpot.fact;
    this.elements.landmarkDetailStatus.textContent = firstCollection
      ? t("landmark.added")
      : t("landmark.alreadyAdded");
    this.elements.landmarkDetailConfirm.textContent = firstCollection
      ? t("action.done")
      : t("action.backToJourney");
    this.togglePassport(false);
    this.toggleLandmarkDetail(true);
  }

  private toggleLandmarkDetail(force?: boolean): void {
    const shouldOpen =
      force ??
      !this.elements.landmarkDetail.classList.contains("is-visible");
    if (shouldOpen && !this.selectedPhotoSpot && !this.selectedCountry) {
      return;
    }
    this.elements.landmarkDetail.classList.toggle("is-visible", shouldOpen);
    this.elements.landmarkDetail.setAttribute(
      "aria-hidden",
      String(!shouldOpen),
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
      const profile = getCountryProfile(country);
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
      path.setAttribute(
        "class",
        `map-country--world map-country--tier-${profile.tier.toLowerCase()}`,
      );
      if (profile.passportEligible) {
        path.dataset.countryMap = profile.id;
      }
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
    this.elements.stampGrid.replaceChildren();
    let previousTier: CountryProfile["tier"] | undefined;
    getPassportCountryProfiles().forEach((country, index) => {
      if (country.tier !== previousTier) {
        const heading = document.createElement("h3");
        heading.className = "stamp-grid__tier";
        heading.textContent =
          country.tier === "A"
            ? t("passport.primaryDestinations")
            : t("passport.destinations");
        this.elements.stampGrid.append(heading);
        previousTier = country.tier;
      }
      const stamp = document.createElement("div");
      stamp.className = `stamp stamp--tier-${country.tier.toLowerCase()}`;
      stamp.dataset.countryStamp = country.id;
      stamp.style.setProperty("--stamp-color", getCountryTierColor(country.tier));
      stamp.style.setProperty("--stamp-tilt", `${index % 2 === 0 ? -3 : 3}deg`);
      const stampSymbol = /^[A-D]$/.test(country.flag) ? "•" : country.flag;
      const symbol = document.createElement("span");
      const name = document.createElement("small");
      symbol.textContent = stampSymbol;
      name.textContent = country.name;
      stamp.append(symbol, name);
      this.elements.stampGrid.append(stamp);
    });
  }

  private buildLanguageSelector(): void {
    this.elements.languageSelect.replaceChildren();
    for (const locale of getSupportedLocales()) {
      const option = document.createElement("option");
      option.value = locale.code;
      option.textContent = locale.label;
      option.selected = locale.code === getLocale();
      this.elements.languageSelect.append(option);
    }
    this.elements.languageSelect.addEventListener("change", () => {
      if (!setLocale(this.elements.languageSelect.value)) {
        this.elements.languageSelect.value = getLocale();
      }
    });
  }

  private refreshLocale(): void {
    this.elements.languageSelect.value = getLocale();
    this.displayedContextId = undefined;
    window.clearTimeout(this.toastTimer);
    this.elements.toast.classList.remove("is-visible");
    this.elements.toast.textContent = "";
    this.elements.mapViewLabel.textContent = this.worldOverviewActive
      ? t("worldMap.back")
      : t("worldMap.label");
    this.buildPassport();

    if (this.selectedPhotoSpot) {
      this.showLandmarkDetail(
        this.selectedPhotoSpot,
        this.selectedPhotoSpotFirstCollection,
      );
      return;
    }

    if (this.selectedCountry) {
      const country = WORLD_COUNTRIES.find(
        (candidate) => candidate.id === this.selectedCountry?.id,
      );
      if (country) {
        this.showCountryDetail(getCountryProfile(country));
      }
    }
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

function requireSelect(id: string): HTMLSelectElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Missing select #${id}`);
  }
  return element;
}
