import {
  MAP_BOUNDS,
  PHOTO_SPOTS,
  type PhotoSpotDefinition,
  type PhotoSpotId,
  type SeaId,
  geoToWorld,
  getSeaId,
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
import type { QuizSet } from "./quiz";
import {
  REGIONAL_SPECIALTIES,
  type RegionalSpecialtyDefinition,
} from "./regional-specialties";
import { getSpecialtyCopy } from "./regional-specialty-copy";
import {
  hasLandmarkIllustration,
  landmarkIllustrationUrl,
} from "./landmark-assets";
import {
  DEFAULT_PAINT_ID,
  VEHICLE_PAINTS,
  buildTrip,
  evaluateUnlockedPaints,
  getPaint,
  sanitizeTrip,
  wrappedDeltaX,
  type ProgressTotals,
  type VehiclePaint,
} from "./progression";

const CHALLENGE_ATTENTION_SECONDS = 120;
const CHALLENGE_ATTENTION_MAX_OPENS = 3;

interface QuizSubject {
  quiz: QuizSet;
  label: string;
}

type QuizModule = typeof import("./quiz");

interface UIElements {
  countryReveal: HTMLElement;
  countryKicker: HTMLElement;
  countryName: HTMLElement;
  toast: HTMLElement;
  countryArrival: HTMLElement;
  visitedCount: HTMLElement;
  miniMapSvg: SVGSVGElement;
  interactButton: HTMLButtonElement;
  passportButton: HTMLButtonElement;
  passportBackdrop: HTMLButtonElement;
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
  settingsButton: HTMLButtonElement;
  settingsPopover: HTMLElement;
  quizButton: HTMLButtonElement;
  quizButtonSubject: HTMLElement;
  quizButtonAction: HTMLElement;
  quizPanel: HTMLElement;
  quizBackdrop: HTMLButtonElement;
  quizClose: HTMLButtonElement;
  quizProgress: HTMLElement;
  quizSubject: HTMLElement;
  quizPrompt: HTMLElement;
  quizOptions: HTMLElement;
  quizFeedback: HTMLElement;
  quizSkip: HTMLButtonElement;
  quizNext: HTMLButtonElement;
  progressTotals: HTMLElement;
  progressRegions: HTMLElement;
  compassDock: HTMLElement;
  compass: HTMLElement;
  compassArrow: HTMLElement;
  compassTarget: HTMLElement;
  compassDistance: HTMLElement;
  wishlist: HTMLElement;
  wishlistItems: HTMLElement;
  celebration: HTMLElement;
  celebrationEyebrow: HTMLElement;
  celebrationTitle: HTMLElement;
  celebrationDetail: HTMLElement;
  albumOpen: HTMLButtonElement;
  postcardAlbum: HTMLElement;
  albumBackdrop: HTMLButtonElement;
  albumClose: HTMLButtonElement;
  albumProgress: HTMLElement;
  albumEmpty: HTMLElement;
  albumGrid: HTMLElement;
  postcardReveals: HTMLElement;
  cruiseVeil: HTMLElement;
  tripProgress: HTMLElement;
  garageGrid: HTMLElement;
  gameOver: HTMLElement;
  gameOverRetry: HTMLButtonElement;
}

/** Everything the trip/paint loop needs to survive a reload. */
export interface ProgressionSnapshot {
  activeTrip: string[];
  completedTrips: number;
  unlockedPaints: string[];
  equippedPaint: string;
  goldStamps: string[];
}

interface WishlistRow {
  id: PhotoSpotId;
  li: HTMLLIElement;
  button: HTMLButtonElement;
  distance: HTMLElement;
}

interface CelebrationItem {
  eyebrow: string;
  title: string;
  detail: string;
}

interface TripStop {
  spot: PhotoSpotDefinition;
  worldDistance: number;
  done: boolean;
}

export class GameUI {
  private readonly elements: UIElements;
  private readonly playerDot: SVGCircleElement;
  private readonly playerHalo: SVGCircleElement;
  private toastTimer?: number;
  private countryArrivalTimer?: number;
  private displayedContextId?: string;
  private previousNearestPhotoSpot?: string;
  private selectedPhotoSpot?: PhotoSpotDefinition;
  private selectedCountry?: CountryProfile;
  private currentCountry?: CountryProfile;
  private currentNearestPhotoSpot?: PhotoSpotDefinition;
  private currentNearestSpecialty?: RegionalSpecialtyDefinition;
  private renderedCruiseLevel?: number;
  private renderedTotalsKey?: string;
  private renderedRegionKey?: string;
  private selectedPhotoSpotFirstCollection = false;
  private worldOverviewActive = false;
  private availableQuiz?: QuizSubject;
  private activeQuiz?: QuizSubject;
  private challengeAttentionStartElapsed?: number;
  private challengeOpenCount = 0;
  /** Retained for compatibility with saves created by the retired arrival quiz. */
  private readonly goldStamps = new Set<string>();
  private quizIndex = 0;
  private quizCorrect = 0;
  private quizAnswered = false;
  private quizQuestionsAnswered = 0;
  private quizFlowCompleted = false;
  private pendingFirstQuizReward = false;
  private quizFinishTimer?: number;
  private readonly completedQuizzes = new Set<string>();
  private latestState?: GameState;
  private selectedTargetId?: PhotoSpotId;
  private wishlistOpen = false;
  private settingsOpen = false;
  private wishlistRows: WishlistRow[] = [];
  private compassSignature?: string;
  private compassAvailable = false;
  private milestoneReady = false;
  private prevLandmarks = 0;
  private prevSpecialties = 0;
  private prevCountries = 0;
  private prevRegionDone = new Map<string, number>();
  private readonly celebrationQueue: CelebrationItem[] = [];
  private celebrationActive = false;
  private celebrationTimer?: number;
  private readonly onCelebrate: () => void;
  private readonly onPaintChange: (color: number) => void;
  private readonly onProgressionChanged: () => void;
  private readonly onCommercialBreak: () => Promise<boolean>;
  private readonly onRewardedBreak?: () => Promise<boolean>;
  private readonly onGameplayPauseChange: (paused: boolean) => void;
  private readonly onRetry: () => void;
  private gameplayPaused = false;
  private gameplayPauseSyncQueued = false;
  private rewardPending = false;
  private trip: PhotoSpotId[] = [];
  private completedTrips = 0;
  private readonly unlockedPaints = new Set<string>([DEFAULT_PAINT_ID]);
  private equippedPaint = DEFAULT_PAINT_ID;
  private progressionReady = false;
  private tripStructureSig?: string;
  private quizModule?: QuizModule;
  private quizLoad?: Promise<void>;
  private deferredLoad?: Promise<void>;
  private miniMapCountriesBuilt = false;
  private passportBuilt = false;

  constructor(
    onInteract: () => void,
    onToggleWorldView: () => void,
    onCelebrate: () => void = () => {},
    onPaintChange: (color: number) => void = () => {},
    onProgressionChanged: () => void = () => {},
    onCommercialBreak: () => Promise<boolean> = async () => false,
    onRewardedBreak?: () => Promise<boolean>,
    onGameplayPauseChange: (paused: boolean) => void = () => {},
    onRetry: () => void = () => {},
  ) {
    this.onCelebrate = onCelebrate;
    this.onPaintChange = onPaintChange;
    this.onProgressionChanged = onProgressionChanged;
    this.onCommercialBreak = onCommercialBreak;
    this.onRewardedBreak = onRewardedBreak;
    this.onGameplayPauseChange = onGameplayPauseChange;
    this.onRetry = onRetry;
    this.elements = {
      countryReveal: requireElement("country-reveal"),
      countryKicker: requireElement("context-kicker"),
      countryName: requireElement("country-name"),
      toast: requireElement("toast"),
      countryArrival: requireElement("country-arrival"),
      visitedCount: requireElement("visited-count"),
      miniMapSvg: requireSvgElement("mini-map-svg"),
      interactButton: requireButton("interact-button"),
      passportButton: requireButton("passport-button"),
      passportBackdrop: requireButton("passport-backdrop"),
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
      settingsButton: requireButton("settings-button"),
      settingsPopover: requireElement("settings-popover"),
      quizButton: requireButton("quiz-button"),
      quizButtonSubject: requireElement("quiz-button-subject"),
      quizButtonAction: requireElement("quiz-button-action"),
      quizPanel: requireElement("quiz-panel"),
      quizBackdrop: requireButton("quiz-backdrop"),
      quizClose: requireButton("quiz-close"),
      quizProgress: requireElement("quiz-progress"),
      quizSubject: requireElement("quiz-subject"),
      quizPrompt: requireElement("quiz-prompt"),
      quizOptions: requireElement("quiz-options"),
      quizFeedback: requireElement("quiz-feedback"),
      quizSkip: requireButton("quiz-skip"),
      quizNext: requireButton("quiz-next"),
      progressTotals: requireElement("progress-totals"),
      progressRegions: requireElement("progress-regions"),
      compassDock: requireElement("compass-dock"),
      compass: requireElement("compass"),
      compassArrow: requireElement("compass-arrow"),
      compassTarget: requireElement("compass-target"),
      compassDistance: requireElement("compass-distance"),
      wishlist: requireElement("wishlist"),
      wishlistItems: requireElement("wishlist-items"),
      celebration: requireElement("celebration"),
      celebrationEyebrow: requireElement("celebration-eyebrow"),
      celebrationTitle: requireElement("celebration-title"),
      celebrationDetail: requireElement("celebration-detail"),
      albumOpen: requireButton("album-open"),
      postcardAlbum: requireElement("postcard-album"),
      albumBackdrop: requireButton("album-backdrop"),
      albumClose: requireButton("album-close"),
      albumProgress: requireElement("album-progress"),
      albumEmpty: requireElement("album-empty"),
      albumGrid: requireElement("album-grid"),
      postcardReveals: requireElement("postcard-reveals"),
      cruiseVeil: requireElement("cruise-veil"),
      tripProgress: requireElement("trip-progress"),
      garageGrid: requireElement("garage-grid"),
      gameOver: requireElement("game-over"),
      gameOverRetry: requireButton("game-over-retry"),
    };

    this.syncChallengeAttentionState();
    this.buildLanguageSelector();
    const { halo, dot } = this.buildMiniMap();
    this.playerHalo = halo;
    this.playerDot = dot;

    this.elements.interactButton.addEventListener("click", () => {
      if (this.currentNearestPhotoSpot) {
        onInteract();
      } else if (this.currentNearestSpecialty) {
        this.showSpecialtyDetail(this.currentNearestSpecialty);
      } else if (this.currentCountry) {
        this.showCountryDetail(this.currentCountry);
      }
    });
    this.elements.worldMapButton.addEventListener("click", onToggleWorldView);
    this.elements.settingsButton.addEventListener("click", () =>
      this.setSettingsOpen(!this.settingsOpen),
    );
    this.elements.passportButton.addEventListener("click", () => this.togglePassport());
    this.elements.passportBackdrop.addEventListener("click", () =>
      this.togglePassport(false),
    );
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
    this.elements.quizButton.addEventListener("click", () => {
      void this.openQuiz();
    });
    this.elements.quizBackdrop.addEventListener("click", () => this.closeQuiz());
    this.elements.quizClose.addEventListener("click", () => this.closeQuiz());
    this.elements.quizSkip.addEventListener("click", () => this.closeQuiz());
    this.elements.quizNext.addEventListener("click", () => this.advanceQuiz());
    this.elements.gameOverRetry.addEventListener("click", () => {
      this.onRetry();
      this.toggleGameOver(false);
    });
    this.elements.albumOpen.addEventListener("click", () => this.openAlbum());
    this.elements.albumBackdrop.addEventListener("click", () =>
      this.toggleAlbum(false),
    );
    this.elements.albumClose.addEventListener("click", () =>
      this.toggleAlbum(false),
    );
    document.addEventListener("pointerdown", (event) => {
      const target = event.target as Node;
      if (
        this.wishlistOpen &&
        !this.elements.compassDock.contains(target)
      ) {
        this.setWishlistOpen(false);
      }
      if (
        this.settingsOpen &&
        !this.elements.settingsButton.contains(target) &&
        !this.elements.settingsPopover.contains(target)
      ) {
        this.setSettingsOpen(false);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        this.toggleLandmarkDetail(false);
        this.togglePassport(false);
        this.closeQuiz();
        this.setWishlistOpen(false);
        this.setSettingsOpen(false);
        this.toggleAlbum(false);
      }
    });

    window.setTimeout(() => this.elements.controlsHint.classList.add("is-faded"), 7000);
    onLocaleChange(() => this.refreshLocale());
  }

  loadDeferredContent(): Promise<void> {
    this.deferredLoad ??= this.loadDeferredContentOnce();
    return this.deferredLoad;
  }

  private async loadDeferredContentOnce(): Promise<void> {
    await nextFrame();
    this.buildMiniMapCountries();
    await nextFrame();
    await this.ensureQuizLoaded();
  }

  update(state: GameState): void {
    this.latestState = state;
    this.updateChallengeAttention(state.elapsed);
    const geoPosition = getCurrentGeoPosition(state);
    const currentWorldCountry = state.currentCountryProfile
      ? WORLD_COUNTRIES.find(
          (country) => country.id === state.currentCountryProfile?.id,
        )
      : undefined;
    const currentProfile = currentWorldCountry
      ? getCountryProfile(currentWorldCountry)
      : undefined;
    const profile = currentProfile;
    const localizedSpot = state.nearestPhotoSpot
      ? localizePhotoSpot(state.nearestPhotoSpot)
      : undefined;
    this.currentCountry = profile;
    this.currentNearestPhotoSpot = state.nearestPhotoSpot;
    this.currentNearestSpecialty = state.nearestSpecialty;
    const seaId = state.vehicleMode === "boat"
      ? getSeaId(geoPosition)
      : undefined;
    this.updateTravelInfo(profile, localizedSpot, seaId);
    this.updateProgress(state);
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
    this.elements.interactButton.disabled =
      !state.nearestPhotoSpot && !state.nearestSpecialty;

    if (nearestId && nearestId !== this.previousNearestPhotoSpot) {
      const nearestSpot = state.nearestPhotoSpot!;
      this.showToast(
        t(nearestSpot.visitMode === "reflection"
          ? "toast.discoveredHistoricalSite"
          : "toast.discoveredSpot", {
          name: localizePhotoSpot(nearestSpot).name,
        }),
      );
    }
    this.previousNearestPhotoSpot = nearestId;
    this.refreshQuizAvailability(profile, state.nearestPhotoSpot);
    this.updateCruiseVeil(state.cruiseFlow);
    this.checkMilestones(state);
    this.updateProgression(state);
    this.updateCompass(state);
  }

  /**
   * A fresh journey begins with the road, not navigation chrome. Restored
   * journeys can opt in immediately; new journeys call this after the first
   * sustained movement input.
   */
  setCompassAvailable(available: boolean): void {
    if (this.compassAvailable === available) {
      return;
    }
    this.compassAvailable = available;
    if (available) {
      this.elements.controlsHint.classList.add("is-faded");
      this.elements.compassDock.classList.add("is-introducing");
      window.setTimeout(
        () => this.elements.compassDock.classList.remove("is-introducing"),
        520,
      );
      this.compassSignature = undefined;
      return;
    }
    this.elements.compassDock.hidden = true;
    this.elements.compassDock.classList.remove("is-introducing");
    this.setWishlistOpen(false);
  }

  /**
   * The compass turns aimless roaming into a route: it always points at one
   * uncollected landmark — the player's pick, or the nearest one otherwise —
   * so every session has an obvious "where to next".
   */
  private updateCompass(state: GameState): void {
    const dock = this.elements.compassDock;
    const blocked =
      !this.compassAvailable ||
      this.worldOverviewActive ||
      this.hasPrimarySurface();
    // The itinerary drives the compass; the nearest uncollected spot is only a
    // fallback for the endgame, once no trip can be formed any more.
    const stops = blocked ? [] : this.tripStops(state);
    const targets = stops.filter((entry) => !entry.done);
    const fallback: TripStop[] =
      blocked || targets.length > 0
        ? []
        : this.uncollectedByDistance(state).map((entry) => ({
            ...entry,
            done: false,
          }));
    const pointable = targets.length > 0 ? targets : fallback;

    if (pointable.length === 0) {
      if (!dock.hidden) {
        dock.hidden = true;
        this.setWishlistOpen(false);
      }
      return;
    }
    dock.hidden = false;

    let target = this.selectedTargetId
      ? pointable.find((entry) => entry.spot.id === this.selectedTargetId)
      : undefined;
    if (!target) {
      this.selectedTargetId = undefined;
      target = pointable[0];
    }

    const targetWorld = geoToWorld(target.spot.point);
    const dx = wrappedDeltaX(targetWorld.x, state.position.x);
    const dz = targetWorld.z - state.position.z;
    const angle = (Math.atan2(dx, -dz) * 180) / Math.PI;
    this.elements.compassArrow.style.transform =
      `translate(-50%, -70%) rotate(${angle.toFixed(1)}deg)`;

    const name = localizePhotoSpot(target.spot).name;
    const distanceText =
      target.worldDistance < INTERACT_RADIUS
        ? t("compass.arrived")
        : t(qualitativeDistanceKey(target.worldDistance));
    const signature = `${target.spot.id}|${name}|${distanceText}`;
    if (signature !== this.compassSignature) {
      this.compassSignature = signature;
      this.elements.compassTarget.textContent = name;
      this.elements.compassDistance.textContent = distanceText;
    }

    this.setWishlistOpen(false);
  }

  /** The active itinerary, in order, with live distance and visited state. */
  private tripStops(state: GameState): TripStop[] {
    const stops: TripStop[] = [];
    for (const id of this.trip) {
      const spot = PHOTO_SPOTS.find((candidate) => candidate.id === id);
      if (!spot) {
        continue;
      }
      const world = geoToWorld(spot.point);
      stops.push({
        spot,
        worldDistance: Math.hypot(
          wrappedDeltaX(world.x, state.position.x),
          world.z - state.position.z,
        ),
        done: state.collectedPostcards.has(spot.id),
      });
    }
    return stops;
  }

  private uncollectedByDistance(
    state: GameState,
  ): { spot: PhotoSpotDefinition; worldDistance: number }[] {
    const entries: {
      spot: PhotoSpotDefinition;
      worldDistance: number;
    }[] = [];
    for (const spot of PHOTO_SPOTS) {
      if (state.collectedPostcards.has(spot.id)) {
        continue;
      }
      const world = geoToWorld(spot.point);
      const dx = wrappedDeltaX(world.x, state.position.x);
      const dz = world.z - state.position.z;
      entries.push({
        spot,
        worldDistance: Math.hypot(dx, dz),
      });
    }
    entries.sort((a, b) => a.worldDistance - b.worldDistance);
    return entries;
  }

  private setWishlistOpen(open: boolean): void {
    const next = open && !this.elements.compassDock.hidden;
    if (next) {
      this.setSettingsOpen(false);
      this.togglePassport(false);
      this.toggleLandmarkDetail(false);
      this.closeQuiz();
      this.toggleAlbum(false);
    }
    this.wishlistOpen = next;
    this.elements.wishlist.hidden = !next;
    this.elements.compass.setAttribute("aria-expanded", String(next));
    if (next) {
      this.tripStructureSig = undefined;
      if (this.latestState) {
        const stops = this.tripStops(this.latestState);
        const remaining = stops.filter((entry) => !entry.done);
        const targetId =
          remaining.find((entry) => entry.spot.id === this.selectedTargetId)
            ?.spot.id ?? remaining[0]?.spot.id;
        if (targetId) {
          this.renderTrip(stops, targetId);
        }
      }
    }
    this.syncSurfaceState();
  }

  private setSettingsOpen(open: boolean): void {
    const next = open && !this.worldOverviewActive;
    if (next) {
      this.setWishlistOpen(false);
      this.togglePassport(false);
      this.toggleLandmarkDetail(false);
      this.closeQuiz();
      this.toggleAlbum(false);
    }
    this.settingsOpen = next;
    this.elements.settingsPopover.hidden = !next;
    this.elements.settingsPopover.setAttribute("aria-hidden", String(!next));
    this.elements.settingsButton.setAttribute("aria-expanded", String(next));
    this.syncSurfaceState();
  }

  private renderTrip(stops: TripStop[], targetId: PhotoSpotId): void {
    const done = stops.filter((entry) => entry.done).length;
    this.elements.tripProgress.textContent = stops.length
      ? t("trip.progress", { done, total: stops.length })
      : "";

    const structureSig = stops.map((entry) => entry.spot.id).join(",");
    if (structureSig !== this.tripStructureSig) {
      this.tripStructureSig = structureSig;
      this.wishlistRows = stops.map((entry) => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wishlist__item";
        const icon = document.createElement("span");
        icon.className = "wishlist__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = KIND_ICON[entry.spot.kind];
        const name = document.createElement("span");
        name.className = "wishlist__name";
        name.textContent = localizePhotoSpot(entry.spot).name;
        const distance = document.createElement("span");
        distance.className = "wishlist__dist";
        button.append(icon, name, distance);
        button.addEventListener("click", () => this.selectTarget(entry.spot.id));
        li.append(button);
        return { id: entry.spot.id, li, button, distance };
      });
      this.elements.wishlistItems.replaceChildren(
        ...this.wishlistRows.map((row) => row.li),
      );
    }

    for (const row of this.wishlistRows) {
      const entry = stops.find((candidate) => candidate.spot.id === row.id);
      if (!entry) {
        continue;
      }
      // A finished stop keeps its place in the list so the itinerary reads as
      // a route being ticked off rather than a shrinking queue.
      row.distance.textContent = entry.done
        ? t("trip.visited")
        : entry.worldDistance < INTERACT_RADIUS
          ? t("wishlist.here")
          : t(qualitativeDistanceKey(entry.worldDistance));
      row.button.classList.toggle("is-done", entry.done);
      row.button.disabled = entry.done;
      row.button.classList.toggle(
        "is-active",
        !entry.done && row.id === targetId,
      );
    }
  }

  private selectTarget(id: PhotoSpotId): void {
    this.selectedTargetId = id;
    this.compassSignature = undefined;
    const spot = PHOTO_SPOTS.find((candidate) => candidate.id === id);
    if (spot) {
      this.showToast(
        t("wishlist.selectedToast", { name: localizePhotoSpot(spot).name }),
      );
    }
    this.setWishlistOpen(false);
  }

  /**
   * Milestones are detected from state deltas rather than events so a loaded
   * save never re-celebrates progress the player already made. The first
   * update after load just seeds the baselines.
   */
  private checkMilestones(state: GameState): void {
    const landmarks = state.collectedPostcards.size;
    const specialties = state.discoveredSpecialties.size;
    const countries = state.visitedCountries.size;
    const regionDone = new Map<string, number>();
    for (const specialty of REGIONAL_SPECIALTIES) {
      if (state.discoveredSpecialties.has(specialty.id)) {
        regionDone.set(
          specialty.region,
          (regionDone.get(specialty.region) ?? 0) + 1,
        );
      }
    }

    if (!this.milestoneReady) {
      this.milestoneReady = true;
      this.prevLandmarks = landmarks;
      this.prevSpecialties = specialties;
      this.prevCountries = countries;
      this.prevRegionDone = regionDone;
      return;
    }

    if (landmarks > this.prevLandmarks) {
      if (landmarks === PHOTO_SPOTS.length) {
        this.enqueueCelebration(
          t("celebrate.landmarksAll"),
          `${landmarks}/${PHOTO_SPOTS.length}`,
        );
      } else if (crossedStep(this.prevLandmarks, landmarks, LANDMARK_STEPS)) {
        this.enqueueCelebration(
          t("celebrate.landmarkCount", { count: landmarks }),
          `${landmarks}/${PHOTO_SPOTS.length}`,
        );
      }
    }

    if (specialties > this.prevSpecialties) {
      if (specialties === REGIONAL_SPECIALTIES.length) {
        this.enqueueCelebration(
          t("celebrate.specialtiesAll"),
          `${specialties}/${REGIONAL_SPECIALTIES.length}`,
        );
      } else {
        for (const [region, total] of REGION_TOTALS) {
          const done = regionDone.get(region) ?? 0;
          const before = this.prevRegionDone.get(region) ?? 0;
          if (before < total && done === total) {
            this.enqueueCelebration(
              t("celebrate.specialtyRegion", {
                region: t(`region.name.${region}` as never),
              }),
              `${done}/${total}`,
            );
          }
        }
      }
    }

    if (countries > this.prevCountries) {
      const total = getPassportCountryProfiles().length;
      if (countries === total) {
        this.enqueueCelebration(
          t("celebrate.countriesAll"),
          `${countries}/${total}`,
        );
      } else if (crossedStep(this.prevCountries, countries, COUNTRY_STEPS)) {
        this.enqueueCelebration(
          t("celebrate.countryCount", { count: countries }),
          `${countries}/${total}`,
        );
      }
    }

    this.prevLandmarks = landmarks;
    this.prevSpecialties = specialties;
    this.prevCountries = countries;
    this.prevRegionDone = regionDone;
  }

  /**
   * Keeps an itinerary alive and turns finished ones into rewards. Like the
   * milestones above, the first pass only seeds state: a restored save must
   * never replay the trips and unlocks it already earned.
   */
  private updateProgression(state: GameState): void {
    let changed = false;

    if (this.trip.length > 0 && this.tripIsComplete(state)) {
      this.completedTrips += 1;
      if (this.progressionReady) {
        this.enqueueCelebration(
          t("celebrate.tripDone"),
          t("celebrate.tripCount", { count: this.completedTrips }),
        );
      }
      this.trip = [];
      this.selectedTargetId = undefined;
      changed = true;
    }

    if (this.trip.length === 0) {
      // Returns empty once every landmark is collected; leaving the trip empty
      // then is intentional, and stops this from rebuilding every frame.
      const fresh = buildTrip(state.collectedPostcards, state.position);
      if (fresh.length > 0) {
        this.trip = fresh;
        this.tripStructureSig = undefined;
        changed = true;
      }
    }

    for (const id of evaluateUnlockedPaints(this.progressTotals(state))) {
      if (this.unlockedPaints.has(id)) {
        continue;
      }
      this.unlockedPaints.add(id);
      changed = true;
      if (this.progressionReady) {
        this.enqueueCelebration(
          t("celebrate.paintUnlocked", { name: paintName(id) }),
          t("garage.title"),
        );
        this.buildGarageGrid();
      }
    }

    if (!this.progressionReady) {
      this.progressionReady = true;
      this.buildGarageGrid();
      return;
    }
    if (changed) {
      this.onProgressionChanged();
    }
  }

  private tripIsComplete(state: GameState): boolean {
    return this.trip.every((id) => state.collectedPostcards.has(id));
  }

  private progressTotals(state: GameState): ProgressTotals {
    return {
      trips: this.completedTrips,
      landmarks: state.collectedPostcards.size,
      countries: state.visitedCountries.size,
      specialties: state.discoveredSpecialties.size,
    };
  }

  /** Restores the trip/paint loop from a save, then applies the paint. */
  restoreProgression(snapshot: ProgressionSnapshot): void {
    this.trip = sanitizeTrip(snapshot.activeTrip).slice(0, 1);
    this.completedTrips = Math.max(0, Math.floor(snapshot.completedTrips));
    for (const id of snapshot.unlockedPaints) {
      if (VEHICLE_PAINTS.some((paint) => paint.id === id)) {
        this.unlockedPaints.add(id);
      }
    }
    if (this.unlockedPaints.has(snapshot.equippedPaint)) {
      this.equippedPaint = snapshot.equippedPaint;
    }
    const knownSpots = new Set<string>(PHOTO_SPOTS.map((spot) => spot.id));
    for (const id of snapshot.goldStamps ?? []) {
      if (knownSpots.has(id)) {
        this.goldStamps.add(id);
      }
    }
    this.tripStructureSig = undefined;
    this.onPaintChange(getPaint(this.equippedPaint).color);
    this.buildGarageGrid();
  }

  getProgression(): ProgressionSnapshot {
    return {
      activeTrip: [...this.trip],
      completedTrips: this.completedTrips,
      unlockedPaints: [...this.unlockedPaints],
      equippedPaint: this.equippedPaint,
      goldStamps: [...this.goldStamps],
    };
  }

  private equipPaint(id: string): void {
    if (!this.unlockedPaints.has(id) || this.equippedPaint === id) {
      return;
    }
    this.equippedPaint = id;
    this.onPaintChange(getPaint(id).color);
    this.buildGarageGrid();
    this.showToast(t("garage.paintToast", { name: paintName(id) }));
    this.onProgressionChanged();
  }

  private buildGarageGrid(): void {
    const totals = this.latestState
      ? this.progressTotals(this.latestState)
      : undefined;

    const visiblePaints = VEHICLE_PAINTS.filter(
      (paint) =>
        !paint.rewarded ||
        this.onRewardedBreak !== undefined ||
        this.unlockedPaints.has(paint.id),
    );

    this.elements.garageGrid.replaceChildren(
      ...visiblePaints.map((paint) => {
        const unlocked = this.unlockedPaints.has(paint.id);
        const equipped = unlocked && paint.id === this.equippedPaint;
        const rewarded = Boolean(paint.rewarded && !unlocked);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "paint-chip";
        button.classList.toggle("is-locked", !unlocked);
        button.classList.toggle("is-rewarded", rewarded);
        button.classList.toggle("is-equipped", equipped);
        button.disabled = (!unlocked && !rewarded) || this.rewardPending;
        button.setAttribute(
          "aria-label",
          unlocked
            ? t("garage.equip", { name: paintName(paint.id) })
            : rewarded
              ? t("garage.rewarded.cta", { name: paintName(paint.id) })
            : requirementText(paint),
        );

        const swatch = document.createElement("span");
        swatch.className = "paint-chip__swatch";
        swatch.style.setProperty(
          "--paint",
          `#${paint.color.toString(16).padStart(6, "0")}`,
        );
        swatch.setAttribute("aria-hidden", "true");
        swatch.textContent = unlocked
          ? equipped
            ? "✓"
            : ""
          : rewarded
            ? "▶"
            : "🔒";

        const name = document.createElement("span");
        name.className = "paint-chip__name";
        name.textContent = unlocked ? paintName(paint.id) : "???";

        const status = document.createElement("span");
        status.className = "paint-chip__status";
        if (equipped) {
          status.textContent = t("garage.equipped");
        } else if (rewarded) {
          status.textContent = this.rewardPending
            ? t("garage.rewarded.pending")
            : t("garage.rewarded.cta", { name: paintName(paint.id) });
        } else if (!unlocked) {
          status.textContent = requirementText(paint);
          if (totals && paint.requirement) {
            status.textContent +=
              ` · ${totals[paint.requirement.type]}/${paint.requirement.count}`;
          }
        }

        button.append(swatch, name, status);
        button.addEventListener("click", () => {
          if (rewarded) {
            void this.unlockRewardedPaint(paint);
          } else {
            this.equipPaint(paint.id);
          }
        });
        return button;
      }),
    );
  }

  private async unlockRewardedPaint(paint: VehiclePaint): Promise<void> {
    if (
      !paint.rewarded ||
      !this.onRewardedBreak ||
      this.rewardPending ||
      this.unlockedPaints.has(paint.id)
    ) {
      return;
    }

    this.rewardPending = true;
    this.buildGarageGrid();
    const rewarded = await this.onRewardedBreak();
    this.rewardPending = false;

    if (!rewarded) {
      this.buildGarageGrid();
      this.showToast(t("garage.rewarded.unavailable"));
      return;
    }

    this.unlockedPaints.add(paint.id);
    this.equippedPaint = paint.id;
    this.onPaintChange(paint.color);
    this.buildGarageGrid();
    this.enqueueCelebration(
      t("garage.rewarded.unlocked", { name: paintName(paint.id) }),
      t("garage.title"),
    );
    this.onProgressionChanged();
  }

  private enqueueCelebration(title: string, detail: string): void {
    this.celebrationQueue.push({
      eyebrow: t("celebrate.eyebrow"),
      title,
      detail,
    });
    if (!this.celebrationActive) {
      this.showNextCelebration();
    }
  }

  private showNextCelebration(): void {
    const next = this.celebrationQueue.shift();
    if (!next) {
      this.celebrationActive = false;
      return;
    }
    this.celebrationActive = true;
    this.elements.celebrationEyebrow.textContent = next.eyebrow;
    this.elements.celebrationTitle.textContent = next.title;
    this.elements.celebrationDetail.textContent = next.detail;
    this.elements.celebration.classList.remove("is-visible");
    void this.elements.celebration.offsetWidth;
    this.elements.celebration.classList.add("is-visible");
    this.elements.celebration.setAttribute("aria-hidden", "false");
    this.onCelebrate();
    window.clearTimeout(this.celebrationTimer);
    this.celebrationTimer = window.setTimeout(() => {
      this.elements.celebration.classList.remove("is-visible");
      this.elements.celebration.setAttribute("aria-hidden", "true");
      window.setTimeout(() => this.showNextCelebration(), 260);
    }, 2800);
  }

  /**
   * A specialty is spotted by driving past, so the announcement stays as a
   * toast: it must never interrupt steering the way a landmark card does.
   */
  private announceSpecialty(
    specialty: RegionalSpecialtyDefinition,
    firstDiscovery: boolean,
  ): void {
    const copy = getSpecialtyCopy(specialty.id, getLocale(), specialty.name);
    this.showToast(
      t(firstDiscovery ? "specialty.discovered" : "specialty.seenAgain", {
        name: copy.name,
      }),
    );
  }

  private showSpecialtyDetail(specialty: RegionalSpecialtyDefinition): void {
    const copy = getSpecialtyCopy(specialty.id, getLocale(), specialty.name);
    const categoryKey = `specialty.category.${specialty.category}` as const;
    this.selectedCountry = undefined;
    this.selectedPhotoSpot = undefined;
    this.elements.landmarkDetail.classList.add("is-country-detail");
    this.elements.landmarkDetail.classList.remove("is-reflection");
    this.elements.landmarkDetailKind.textContent = t("specialty.kind");
    this.elements.landmarkDetailName.textContent = copy.name;
    this.elements.landmarkDetailCountry.textContent = `${t(
      `region.name.${specialty.region}` as never,
    )} · ${t(categoryKey as never)}`;
    this.elements.landmarkDetailIntro.textContent = copy.blurb;
    this.elements.landmarkDetailDescription.textContent = "";
    this.elements.landmarkDetailFact.textContent = "";
    this.elements.landmarkDetailStatus.textContent = "";
    this.elements.landmarkDetailConfirm.textContent = t("action.backToJourney");
    this.togglePassport(false);
    this.toggleLandmarkDetail(true);
  }

  /**
   * Region progress turns the existing content into self-set goals: seeing
   * "Africa 3/9" is what makes a player decide to go finish Africa.
   */
  private updateProgress(state: GameState): void {
    const totals: readonly [string, number, number][] = [
      ["progress.countries", state.visitedCountries.size, getPassportCountryProfiles().length],
      ["progress.landmarks", state.collectedPostcards.size, PHOTO_SPOTS.length],
      ["progress.specialties", state.discoveredSpecialties.size, REGIONAL_SPECIALTIES.length],
    ];
    const totalsKey = totals.map(([, done]) => done).join(",");
    if (totalsKey !== this.renderedTotalsKey) {
      this.renderedTotalsKey = totalsKey;
      this.elements.progressTotals.replaceChildren(
        ...totals.map(([labelKey, done, total]) =>
          buildProgressRow(t(labelKey as never), done, total),
        ),
      );
    }

    const byRegion = new Map<string, { done: number; total: number }>();
    for (const specialty of REGIONAL_SPECIALTIES) {
      const bucket = byRegion.get(specialty.region) ?? { done: 0, total: 0 };
      bucket.total += 1;
      if (state.discoveredSpecialties.has(specialty.id)) {
        bucket.done += 1;
      }
      byRegion.set(specialty.region, bucket);
    }
    const regionKey = [...byRegion.entries()]
      .map(([region, value]) => `${region}:${value.done}`)
      .join(",");
    if (regionKey === this.renderedRegionKey) {
      return;
    }
    this.renderedRegionKey = regionKey;
    this.elements.progressRegions.replaceChildren(
      ...[...byRegion.entries()].map(([region, value]) =>
        buildProgressRow(
          t(`region.name.${region}` as never),
          value.done,
          value.total,
        ),
      ),
    );
  }

  getCompletedQuizzes(): string[] {
    return [...this.completedQuizzes];
  }

  restoreCompletedQuizzes(ids: readonly string[]): void {
    this.completedQuizzes.clear();
    for (const id of ids) {
      this.completedQuizzes.add(id);
    }
    this.syncChallengeAttentionState();
  }

  private refreshQuizAvailability(
    profile: CountryProfile | undefined,
    spot: PhotoSpotDefinition | undefined,
  ): void {
    this.syncChallengeAttentionState();
    const quizModule = this.quizModule;
    if (!quizModule) {
      this.availableQuiz = undefined;
      this.elements.quizButton.disabled = true;
      this.elements.quizButtonSubject.textContent = t("quiz.world");
      this.elements.quizButtonAction.textContent = "…";
      return;
    }
    let subject: QuizSubject | undefined;

    const spotQuiz = quizModule.getSpotQuiz(spot?.id);
    if (spot && spotQuiz) {
      subject = { quiz: spotQuiz, label: localizePhotoSpot(spot).name };
    } else if (profile) {
      const countryQuiz = quizModule.getCountryQuiz(profile.atlasName);
      if (countryQuiz) {
        subject = { quiz: countryQuiz, label: profile.name };
      }
    }

    subject ??= {
      quiz: quizModule.getWorldQuiz(this.completedQuizzes),
      label: t("quiz.world"),
    };
    this.availableQuiz = subject;

    const completed = this.completedQuizzes.has(subject.quiz.id);
    const firstChallengePending = this.completedQuizzes.size === 0;
    this.elements.quizButton.hidden = false;
    this.elements.quizButton.disabled = false;
    this.elements.quizButton.classList.toggle("is-completed", completed);
    this.elements.quizButtonSubject.textContent = subject.label;
    this.elements.quizButtonAction.textContent = t(
      firstChallengePending
        ? "quiz.start"
        : completed
          ? "quiz.retry"
          : "quiz.challenge",
    );
    this.elements.quizButton.setAttribute(
      "aria-label",
      `${subject.label} · ${this.elements.quizButtonAction.textContent}`,
    );
  }

  private async openQuiz(): Promise<void> {
    await this.ensureQuizLoaded();
    this.refreshQuizAvailability(
      this.currentCountry,
      this.currentNearestPhotoSpot,
    );
    if (!this.availableQuiz) {
      return;
    }
    this.challengeOpenCount += 1;
    this.syncChallengeAttentionState();
    this.setSettingsOpen(false);
    this.setWishlistOpen(false);
    this.togglePassport(false);
    this.toggleLandmarkDetail(false);
    this.toggleAlbum(false);
    this.activeQuiz = this.availableQuiz;
    this.quizIndex = 0;
    this.quizCorrect = 0;
    this.quizQuestionsAnswered = 0;
    this.quizFlowCompleted = false;
    this.elements.quizSkip.textContent = t("quiz.leave");
    this.elements.quizPanel.classList.add("is-visible");
    this.elements.quizPanel.setAttribute("aria-hidden", "false");
    this.syncSurfaceState();
    this.renderQuizQuestion();
  }

  private closeQuiz(): void {
    const active = this.activeQuiz;
    if (!active) {
      return;
    }
    const worldFlowCompleted =
      this.isWorldQuiz(active) && this.quizQuestionsAnswered > 0;
    const completedFlow =
      this.quizFlowCompleted ||
      worldFlowCompleted;
    if (worldFlowCompleted && !this.completedQuizzes.has(active.quiz.id)) {
      const firstChallenge = this.completedQuizzes.size === 0;
      this.completedQuizzes.add(active.quiz.id);
      this.pendingFirstQuizReward ||= firstChallenge;
      this.syncChallengeAttentionState();
      this.onProgressionChanged();
    }
    if (this.quizFinishTimer !== undefined) {
      window.clearTimeout(this.quizFinishTimer);
      this.quizFinishTimer = undefined;
    }
    this.activeQuiz = undefined;
    this.quizFlowCompleted = false;
    this.quizQuestionsAnswered = 0;
    this.elements.quizSkip.textContent = t("quiz.leave");
    this.elements.quizPanel.classList.remove("is-visible");
    this.elements.quizPanel.setAttribute("aria-hidden", "true");
    this.syncSurfaceState();
    this.refreshQuizAvailability(
      this.currentCountry,
      this.currentNearestPhotoSpot,
    );
    const showFirstReward = this.pendingFirstQuizReward;
    this.pendingFirstQuizReward = false;
    if (completedFlow) {
      void this.finishCompletedQuizFlow(showFirstReward);
    } else if (showFirstReward) {
      this.showFirstQuizReward();
    }
  }

  private async finishCompletedQuizFlow(
    showFirstReward: boolean,
  ): Promise<void> {
    try {
      await this.onCommercialBreak();
    } catch {
      // A platform ad failure must never swallow the player's earned reward.
    }
    if (showFirstReward) {
      this.showFirstQuizReward();
    }
  }

  private showFirstQuizReward(): void {
    this.enqueueCelebration(
      t("quiz.firstReward"),
      t("quiz.firstRewardProgress", {
        countries: this.latestState?.visitedCountries.size ?? 0,
        total: getPassportCountryProfiles().length,
        challenges: this.completedQuizzes.size,
      }),
    );
  }

  private renderQuizQuestion(): void {
    const active = this.activeQuiz;
    if (!active) {
      return;
    }

    const locale = getLocale();
    const question = this.getQuizQuestion(active);
    this.quizAnswered = false;

    this.elements.quizSubject.textContent = active.label;
    this.elements.quizProgress.textContent = this.isWorldQuiz(active)
      ? t("quiz.progressEndless", { current: this.quizIndex + 1 })
      : t("quiz.progress", {
          current: this.quizIndex + 1,
          total: active.quiz.questions.length,
        });
    this.elements.quizPrompt.textContent =
      this.quizModule?.localizeText(question.prompt, locale) ?? "";
    this.elements.quizFeedback.hidden = true;
    this.elements.quizNext.hidden = true;
    this.elements.quizSkip.hidden = false;

    this.elements.quizOptions.replaceChildren();
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = this.quizModule?.localizeText(option, locale) ?? "";
      button.addEventListener("click", () => this.answerQuiz(index));
      this.elements.quizOptions.append(button);
    });
  }

  private answerQuiz(index: number): void {
    const active = this.activeQuiz;
    if (!active || this.quizAnswered) {
      return;
    }
    this.quizAnswered = true;
    this.quizQuestionsAnswered += 1;

    const locale = getLocale();
    const question = this.getQuizQuestion(active);
    const correct = index === question.answerIndex;
    if (correct) {
      this.quizCorrect += 1;
    }

    const buttons = [
      ...this.elements.quizOptions.querySelectorAll<HTMLButtonElement>("button"),
    ];
    buttons.forEach((button, buttonIndex) => {
      button.disabled = true;
      if (buttonIndex === question.answerIndex) {
        button.classList.add("is-correct");
      } else if (buttonIndex === index) {
        button.classList.add("is-wrong");
      }
    });

    this.elements.quizFeedback.hidden = false;
    this.elements.quizFeedback.classList.toggle("is-correct", correct);
    this.elements.quizFeedback.classList.toggle("is-wrong", !correct);
    this.elements.quizFeedback.textContent = `${
      correct ? t("quiz.correct") : t("quiz.wrong")
    } ${this.quizModule?.localizeText(question.explain, locale) ?? ""}`;

    const isLast =
      !this.isWorldQuiz(active) &&
      this.quizIndex >= active.quiz.questions.length - 1;
    this.elements.quizNext.hidden = false;
    this.elements.quizNext.textContent = isLast
      ? t("quiz.finish")
      : t("quiz.next");
  }

  private advanceQuiz(): void {
    const active = this.activeQuiz;
    if (!active) {
      return;
    }

    if (this.isWorldQuiz(active)) {
      this.quizIndex += 1;
      this.renderQuizQuestion();
      return;
    }

    if (this.quizIndex < active.quiz.questions.length - 1) {
      this.quizIndex += 1;
      this.renderQuizQuestion();
      return;
    }

    this.finishQuiz(active);
  }

  private finishQuiz(active: QuizSubject): void {
    const total = active.quiz.questions.length;
    const perfect = this.quizCorrect === total;
    const firstChallenge = this.completedQuizzes.size === 0;
    this.completedQuizzes.add(active.quiz.id);
    this.pendingFirstQuizReward ||= firstChallenge;
    this.quizFlowCompleted = true;
    this.syncChallengeAttentionState();
    this.onProgressionChanged();

    this.elements.quizOptions.replaceChildren();
    this.elements.quizPrompt.textContent = perfect
      ? t("quiz.perfect", { subject: active.label })
      : t("quiz.result", { correct: this.quizCorrect, total });
    this.elements.quizProgress.textContent = "";
    this.elements.quizFeedback.hidden = true;
    this.elements.quizNext.hidden = true;
    this.elements.quizSkip.hidden = false;
    this.elements.quizSkip.textContent = t("action.done");

    this.showToast(t("quiz.completedToast", { subject: active.label }));
    this.quizFinishTimer = window.setTimeout(() => {
      this.quizFinishTimer = undefined;
      this.closeQuiz();
    }, 1800);
  }

  private updateChallengeAttention(elapsed: number): void {
    this.challengeAttentionStartElapsed ??= elapsed;
    this.syncChallengeAttentionState();
  }

  private syncChallengeAttentionState(): void {
    const elapsed = this.latestState?.elapsed;
    const attentionElapsed =
      elapsed !== undefined && this.challengeAttentionStartElapsed !== undefined
        ? elapsed - this.challengeAttentionStartElapsed
        : 0;
    this.elements.quizButton.classList.toggle(
      "is-attention",
      this.challengeOpenCount < CHALLENGE_ATTENTION_MAX_OPENS &&
        attentionElapsed < CHALLENGE_ATTENTION_SECONDS,
    );
  }

  private getQuizQuestion(active: QuizSubject) {
    const questionCount = active.quiz.questions.length;
    if (questionCount === 0) {
      throw new Error(`Quiz "${active.quiz.id}" has no questions.`);
    }
    return active.quiz.questions[
      this.isWorldQuiz(active) ? this.quizIndex % questionCount : this.quizIndex
    ];
  }

  private isWorldQuiz(active: QuizSubject): boolean {
    return active.quiz.id.startsWith("world:");
  }

  handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "country-entered":
        this.showCountryArrival(
          t(
            event.firstVisit
              ? "toast.countryEntered"
              : "toast.countryReentered",
            {
              flag: event.country.flag,
              name: event.country.name,
            },
          ),
        );
        break;
      case "mode-changed":
        this.showToast(
          event.mode === "boat" ? t("toast.boatMode") : t("toast.carMode"),
        );
        break;
      case "cruise-flow":
        this.showToast(t("toast.cruiseFlow"));
        break;
      case "map-edge":
        this.showToast(t("toast.mapEdge"));
        break;
      case "world-wrapped":
        this.showToast(t("toast.worldWrapped"));
        break;
      case "postcard-collected":
        this.capturePostcard(
          event.spot,
          event.firstCollection,
          event.automatic ?? false,
        );
        break;
      case "specialty-discovered":
        this.announceSpecialty(event.specialty, event.firstDiscovery);
        break;
      case "trap-hit":
        this.showToast(
          t("trap.hit", {
            health: event.health,
            total: event.maxHealth,
          }),
        );
        break;
      case "game-over":
        this.toggleGameOver(true);
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

  private showCountryArrival(message: string): void {
    window.clearTimeout(this.countryArrivalTimer);
    this.elements.countryArrival.textContent = message;
    this.elements.countryArrival.classList.add("is-visible");
    this.elements.countryReveal.classList.add("is-arriving");
    this.elements.countryArrival.setAttribute("aria-hidden", "false");
    this.countryArrivalTimer = window.setTimeout(() => {
      this.elements.countryArrival.classList.remove("is-visible");
      this.elements.countryReveal.classList.remove("is-arriving");
      this.elements.countryArrival.setAttribute("aria-hidden", "true");
    }, 2400);
  }

  setWorldOverview(active: boolean): void {
    this.worldOverviewActive = active;
    if (active) {
      this.setWishlistOpen(false);
      this.setSettingsOpen(false);
    }
    document.getElementById("game-shell")?.classList.toggle("is-world-overview", active);
    this.elements.worldMapButton.classList.toggle("is-overview", active);
    this.elements.worldMapButton.setAttribute("aria-pressed", String(active));
    this.elements.mapViewLabel.textContent = active
      ? t("worldMap.back")
      : t("worldMap.label");
    this.showToast(
      active ? t("worldMap.openToast") : t("worldMap.closeToast"),
    );
    this.refreshQuizAvailability(
      this.currentCountry,
      this.currentNearestPhotoSpot,
    );
    this.syncSurfaceState();
  }

  isInputBlocked(): boolean {
    return (
      this.hasPrimarySurface() ||
      this.wishlistOpen ||
      this.settingsOpen
    );
  }

  private hasPrimarySurface(): boolean {
    return (
      this.elements.landmarkDetail.classList.contains("is-visible") ||
      this.elements.passportPanel.classList.contains("is-visible") ||
      this.elements.postcardAlbum.classList.contains("is-visible") ||
      this.elements.gameOver.classList.contains("is-visible") ||
      Boolean(this.activeQuiz)
    );
  }

  private syncSurfaceState(): void {
    const shell = document.getElementById("game-shell");
    shell?.classList.toggle("has-primary-surface", this.hasPrimarySurface());
    shell?.classList.toggle(
      "has-secondary-surface",
      this.wishlistOpen || this.settingsOpen,
    );
    if (this.gameplayPauseSyncQueued) {
      return;
    }
    this.gameplayPauseSyncQueued = true;
    queueMicrotask(() => {
      this.gameplayPauseSyncQueued = false;
      const paused = this.worldOverviewActive || this.isInputBlocked();
      if (paused === this.gameplayPaused) {
        return;
      }
      this.gameplayPaused = paused;
      this.onGameplayPauseChange(paused);
    });
  }

  private updateTravelInfo(
    country?: CountryProfile,
    spot?: PhotoSpotDefinition,
    seaId?: SeaId,
  ): void {
    const spotAtlasCountry = spot
      ? getWorldCountryByName(spot.atlasCountryName)
      : undefined;
    const displayCountry =
      country ?? (
        spotAtlasCountry ? getCountryProfile(spotAtlasCountry) : undefined
      );
    if (!displayCountry && !seaId) {
      this.displayedContextId = undefined;
      this.elements.countryReveal.classList.remove("is-visible");
      return;
    }

    this.elements.countryReveal.classList.add("is-visible");
    const contextId = displayCountry
      ? `country:${displayCountry.id}`
      : `sea:${seaId}`;
    if (contextId === this.displayedContextId) {
      return;
    }

    this.displayedContextId = contextId;
    this.elements.countryReveal.classList.toggle("has-landmark", Boolean(spot));
    this.elements.countryReveal.classList.toggle(
      "has-ocean",
      Boolean(seaId && !displayCountry),
    );
    if (displayCountry) {
      this.elements.countryKicker.textContent = displayCountry.flag;
      this.elements.countryName.textContent = displayCountry.name;
      this.elements.interactButton.setAttribute(
        "aria-label",
        spot
          ? t("aria.landmarkDetail", { name: spot.name })
          : displayCountry.name,
      );
      return;
    }

    if (seaId) {
      const seaName = t(`sea.${seaId}` as never);
      this.elements.countryReveal.classList.remove("has-landmark");
      this.elements.countryKicker.textContent = "🌊";
      this.elements.countryName.textContent = seaName;
      this.elements.interactButton.setAttribute("aria-label", seaName);
      return;
    }
  }

  private toggleGameOver(visible: boolean): void {
    this.elements.gameOver.classList.toggle("is-visible", visible);
    this.elements.gameOver.setAttribute("aria-hidden", String(!visible));
    if (visible) {
      this.setWishlistOpen(false);
      this.setSettingsOpen(false);
      this.togglePassport(false);
      this.toggleLandmarkDetail(false);
      this.closeQuiz();
      window.setTimeout(() => this.elements.gameOverRetry.focus(), 80);
    }
    this.syncSurfaceState();
  }

  private showCountryDetail(country: CountryProfile): void {
    this.selectedPhotoSpot = undefined;
    this.selectedCountry = country;
    this.elements.landmarkDetail.classList.add("is-country-detail");
    this.elements.landmarkDetail.classList.remove("is-reflection");
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

  private capturePostcard(
    spot: PhotoSpotDefinition,
    firstCollection: boolean,
    automatic: boolean,
  ): void {
    if (spot.visitMode !== "reflection") {
      this.elements.flash.classList.remove("is-active");
      void this.elements.flash.offsetWidth;
      this.elements.flash.classList.add("is-active");
    }

    if (automatic) {
      this.revealPostcard(spot);
      return;
    }

    this.showLandmarkDetail(spot, firstCollection);
  }

  /**
   * The collected artwork, shown briefly over the drive. Playtests showed the
   * old feedback was a white flash and nothing else: the illustration only
   * existed on the placard and two taps deep in the album, so collecting felt
   * like it produced no object at all.
   */
  /**
   * Quantised to twentieths: this runs every frame, and writing an unrounded
   * custom property each time would invalidate style on the whole layer for
   * changes no one can see.
   */
  private updateCruiseVeil(cruiseFlow: number): void {
    const level = Math.round(cruiseFlow * 20) / 20;
    if (level === this.renderedCruiseLevel) {
      return;
    }
    this.renderedCruiseLevel = level;
    // Set opacity directly rather than driving it through a custom property in
    // calc(): the indirection computed to zero in-browser and is not worth
    // debugging for a value this simple.
    this.elements.cruiseVeil.style.opacity = (level * 0.9).toFixed(2);
  }

  private revealPostcard(spot: PhotoSpotDefinition): void {
    const loadingScreen = document.getElementById("loading-screen");
    const loadingParent = loadingScreen?.parentElement;
    if (loadingScreen && loadingParent) {
      // The spawn collection happens while bootstrap still owns the screen.
      // Wait for the loading veil to be removed before creating the card so
      // its entire animation is visible rather than expiring underneath it.
      const observer = new MutationObserver(() => {
        if (loadingScreen.isConnected) {
          return;
        }
        observer.disconnect();
        this.revealPostcard(spot);
      });
      observer.observe(loadingParent, { childList: true });
      return;
    }

    const localized = localizePhotoSpot(spot);
    const card = document.createElement("div");
    card.className = "postcard-reveal";

    const art = buildPostcardArt(spot, this.spotCountry(spot));
    art.classList.add("postcard-reveal__art");

    const caption = document.createElement("span");
    caption.className = "postcard-reveal__caption";
    const name = document.createElement("strong");
    name.textContent = localized.name;
    const count = document.createElement("small");
    count.textContent = `${this.latestState?.collectedPostcards.size ?? 0} / ${PHOTO_SPOTS.length}`;
    caption.append(name, count);

    const stamp = document.createElement("span");
    stamp.className = "postcard-reveal__stamp";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = "✦";

    card.append(art, caption, stamp);
    this.elements.postcardReveals.append(card);
    card.addEventListener("animationend", () => card.remove());
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
      historical: t("landmark.kind.historical"),
    };
    const isReflection = spot.visitMode === "reflection";
    this.selectedCountry = undefined;
    this.selectedPhotoSpot = spot;
    this.selectedPhotoSpotFirstCollection = firstCollection;
    this.elements.landmarkDetail.classList.remove("is-country-detail");
    this.elements.landmarkDetail.classList.toggle("is-reflection", isReflection);
    this.elements.landmarkDetailKind.textContent = kindLabels[spot.kind];
    this.elements.landmarkDetailName.textContent = localizedSpot.name;
    this.elements.landmarkDetailCountry.textContent =
      `${countryFlag} ${countryName} · ${t(isReflection
        ? "landmark.reflectionSelection"
        : "landmark.travelSelection")}`;
    this.elements.landmarkDetailIntro.textContent = localizedSpot.postcard;
    this.elements.landmarkDetailDescription.textContent =
      localizedSpot.description;
    this.elements.landmarkDetailFact.textContent = localizedSpot.fact;
    const baseStatus = isReflection
      ? t(firstCollection ? "landmark.recorded" : "landmark.alreadyRecorded")
      : t(firstCollection ? "landmark.added" : "landmark.alreadyAdded");
    const collectedCount = this.latestState?.collectedPostcards.size ?? 0;
    this.elements.landmarkDetailStatus.textContent = firstCollection
      ? `${baseStatus} · ${t("progress.landmarks")} ${collectedCount}/${PHOTO_SPOTS.length}`
      : baseStatus;
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
    if (shouldOpen) {
      this.setSettingsOpen(false);
      this.setWishlistOpen(false);
      this.togglePassport(false);
      this.closeQuiz();
      this.toggleAlbum(false);
    }
    this.elements.landmarkDetail.classList.toggle("is-visible", shouldOpen);
    this.elements.landmarkDetail.setAttribute(
      "aria-hidden",
      String(!shouldOpen),
    );
    this.syncSurfaceState();
  }

  private togglePassport(force?: boolean): void {
    const shouldOpen =
      force ?? !this.elements.passportPanel.classList.contains("is-visible");
    if (shouldOpen) {
      this.ensurePassportBuilt();
      this.setSettingsOpen(false);
      this.setWishlistOpen(false);
      this.toggleLandmarkDetail(false);
      this.closeQuiz();
      this.toggleAlbum(false);
    }
    this.elements.passportPanel.classList.toggle("is-visible", shouldOpen);
    this.elements.passportPanel.setAttribute("aria-hidden", String(!shouldOpen));
    this.elements.passportButton.setAttribute("aria-expanded", String(shouldOpen));
    this.elements.passportBackdrop.classList.toggle("is-visible", shouldOpen);
    this.elements.passportBackdrop.setAttribute(
      "aria-hidden",
      String(!shouldOpen),
    );
    this.elements.passportBackdrop.tabIndex = shouldOpen ? 0 : -1;
    this.syncSurfaceState();
  }

  /**
   * The album is the collection's payoff: a browsable scrapbook of the
   * postcards you've earned. Built fresh on open so it always reflects the
   * live collection and the active locale, and never runs per frame.
   */
  private openAlbum(): void {
    this.togglePassport(false);
    this.buildAlbumGrid();
    this.toggleAlbum(true);
  }

  private toggleAlbum(force?: boolean): void {
    const shouldOpen =
      force ?? !this.elements.postcardAlbum.classList.contains("is-visible");
    if (shouldOpen) {
      this.setSettingsOpen(false);
      this.setWishlistOpen(false);
      this.toggleLandmarkDetail(false);
      this.togglePassport(false);
      this.closeQuiz();
    }
    this.elements.postcardAlbum.classList.toggle("is-visible", shouldOpen);
    this.elements.postcardAlbum.setAttribute("aria-hidden", String(!shouldOpen));
    this.syncSurfaceState();
  }

  private buildAlbumGrid(): void {
    const collected = this.latestState?.collectedPostcards;
    const collectedCount = collected?.size ?? 0;
    this.elements.albumProgress.textContent =
      `${collectedCount} / ${PHOTO_SPOTS.length}`;
    this.elements.albumEmpty.hidden = collectedCount > 0;

    const kindLabels: Readonly<Record<PhotoSpotDefinition["kind"], string>> = {
      landmark: t("landmark.kind.landmark"),
      natural: t("landmark.kind.natural"),
      wonder: t("landmark.kind.wonder"),
      historical: t("landmark.kind.historical"),
    };

    this.elements.albumGrid.replaceChildren(
      ...PHOTO_SPOTS.map((spot) =>
        collected?.has(spot.id)
          ? this.buildCollectedPostcard(spot, kindLabels[spot.kind])
          : buildLockedPostcard(KIND_ICON[spot.kind]),
      ),
    );
  }

  private buildCollectedPostcard(
    spot: PhotoSpotDefinition,
    kindLabel: string,
  ): HTMLButtonElement {
    const localized = localizePhotoSpot(spot);
    const country = this.spotCountry(spot);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "postcard";
    card.setAttribute("aria-label", localized.name);

    const inner = document.createElement("span");
    inner.className = "postcard__inner";

    // Front: illustration (or flag card) plus a caption strip.
    const front = document.createElement("span");
    front.className = "postcard__face postcard__face--front";
    front.append(buildPostcardArt(spot, country));

    const caption = document.createElement("span");
    caption.className = "postcard__caption";
    const captionIcon = document.createElement("span");
    captionIcon.className = "kind";
    captionIcon.setAttribute("aria-hidden", "true");
    captionIcon.textContent = KIND_ICON[spot.kind];
    const captionName = document.createElement("span");
    captionName.className = "name";
    captionName.textContent = localized.name;
    caption.append(captionIcon, captionName);
    front.append(caption);

    const flipHint = document.createElement("span");
    flipHint.className = "postcard__flip-hint";
    flipHint.textContent = t("album.flipHint");
    front.append(flipHint);

    // Back: written details.
    const back = document.createElement("span");
    back.className = "postcard__face postcard__face--back";
    const backKind = document.createElement("span");
    backKind.className = "postcard__back-kind";
    backKind.textContent = kindLabel;
    const backName = document.createElement("strong");
    backName.className = "postcard__back-name";
    backName.textContent = localized.name;
    const backCountry = document.createElement("span");
    backCountry.className = "postcard__back-country";
    backCountry.textContent = `${country.flag} ${country.name}`;
    const backBlurb = document.createElement("p");
    backBlurb.className = "postcard__back-blurb";
    backBlurb.textContent = localized.postcard;
    const backFact = document.createElement("p");
    backFact.className = "postcard__back-fact";
    backFact.textContent = localized.fact;
    back.append(backKind, backName, backCountry, backBlurb, backFact);

    inner.append(front, back);
    card.append(inner);
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });
    return card;
  }

  private spotCountry(spot: PhotoSpotDefinition): {
    flag: string;
    name: string;
  } {
    const atlasCountry = getWorldCountryByName(spot.atlasCountryName);
    const worldCountry = atlasCountry
      ? getCountryProfile(atlasCountry)
      : undefined;
    return {
      flag: worldCountry?.flag ?? "◆",
      name: worldCountry?.name ?? spot.atlasCountryName,
    };
  }

  private buildMiniMap(): { halo: SVGCircleElement; dot: SVGCircleElement } {
    const namespace = "http://www.w3.org/2000/svg";

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

  private buildMiniMapCountries(): void {
    if (this.miniMapCountriesBuilt) {
      return;
    }
    this.miniMapCountriesBuilt = true;
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
      this.elements.miniMapSvg.insertBefore(path, this.playerHalo);
    }
  }

  private ensurePassportBuilt(): void {
    if (this.passportBuilt) {
      return;
    }
    this.passportBuilt = true;
    this.buildPassport();
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
    this.elements.languageSelect.addEventListener("change", async () => {
      this.elements.languageSelect.disabled = true;
      if (!(await setLocale(this.elements.languageSelect.value))) {
        this.elements.languageSelect.value = getLocale();
      }
      this.elements.languageSelect.disabled = false;
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
    if (this.passportBuilt) {
      this.buildPassport();
    }
    this.buildGarageGrid();
    this.tripStructureSig = undefined;
    this.compassSignature = undefined;
    if (this.elements.postcardAlbum.classList.contains("is-visible")) {
      this.buildAlbumGrid();
    }

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

  private async ensureQuizLoaded(): Promise<void> {
    this.quizLoad ??= import("./quiz").then((module) => {
      this.quizModule = module;
      this.refreshQuizAvailability(
        this.currentCountry,
        this.currentNearestPhotoSpot,
      );
    });
    await this.quizLoad;
  }
}

const INTERACT_RADIUS = 3.5;
const LANDMARK_STEPS = [10, 20, 30] as const;
const COUNTRY_STEPS = [25, 50, 100] as const;

const REGION_TOTALS: ReadonlyMap<string, number> = (() => {
  const totals = new Map<string, number>();
  for (const specialty of REGIONAL_SPECIALTIES) {
    totals.set(specialty.region, (totals.get(specialty.region) ?? 0) + 1);
  }
  return totals;
})();

const KIND_ICON: Readonly<Record<PhotoSpotDefinition["kind"], string>> = {
  landmark: "🏙️",
  natural: "🏔️",
  wonder: "🏛️",
  historical: "🕊️",
};

function paintName(id: string): string {
  return t(`paint.name.${id}` as never);
}

function requirementText(paint: VehiclePaint): string {
  if (!paint.requirement) {
    return "";
  }
  const { type, count } = paint.requirement;
  // Only the trip track can ask for a single item, so it is the one place
  // where a plural label would read wrong.
  const key = type === "trips" && count === 1 ? "garage.req.tripsOne" : `garage.req.${type}`;
  return t(key as never, { count });
}

function qualitativeDistanceKey(
  worldDistance: number,
):
  | "compass.distanceNear"
  | "compass.distanceMedium"
  | "compass.distanceFar" {
  if (worldDistance < 5.5) {
    return "compass.distanceNear";
  }
  if (worldDistance < 12) {
    return "compass.distanceMedium";
  }
  return "compass.distanceFar";
}

function crossedStep(
  previous: number,
  current: number,
  steps: readonly number[],
): boolean {
  return steps.some((step) => previous < step && current >= step);
}

function buildProgressRow(
  label: string,
  done: number,
  total: number,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "progress-row";
  if (done >= total) {
    row.classList.add("is-complete");
  }

  const name = document.createElement("span");
  name.className = "progress-row__label";
  name.textContent = label;

  const bar = document.createElement("span");
  bar.className = "progress-row__bar";
  const fill = document.createElement("span");
  fill.className = "progress-row__fill";
  fill.style.width = `${total > 0 ? (done / total) * 100 : 0}%`;
  bar.append(fill);

  const count = document.createElement("span");
  count.className = "progress-row__count";
  count.textContent = `${done}/${total}`;

  row.append(name, bar, count);
  return row;
}

function buildPostcardArt(
  spot: PhotoSpotDefinition,
  country: { flag: string; name: string },
): HTMLElement {
  if (hasLandmarkIllustration(spot.id)) {
    const img = document.createElement("img");
    img.className = "postcard__photo";
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "";
    img.src = landmarkIllustrationUrl(spot.id);
    // If an illustration is ever missing, fall back to the flag card in place.
    img.addEventListener("error", () => {
      img.replaceWith(buildFlagCard(spot, country));
    });
    return img;
  }
  return buildFlagCard(spot, country);
}

function buildFlagCard(
  spot: PhotoSpotDefinition,
  country: { flag: string; name: string },
): HTMLElement {
  const card = document.createElement("span");
  card.className = "postcard__flagcard";
  const flag = document.createElement("span");
  flag.className = "flag";
  flag.setAttribute("aria-hidden", "true");
  flag.textContent = country.flag;
  const name = document.createElement("span");
  name.className = "flag-name";
  name.textContent = localizePhotoSpot(spot).name;
  card.append(flag, name);
  return card;
}

function buildLockedPostcard(icon: string): HTMLElement {
  const card = document.createElement("div");
  card.className = "postcard postcard--locked";
  const inner = document.createElement("span");
  inner.className = "postcard__inner";
  const face = document.createElement("span");
  face.className = "postcard__face";
  const lock = document.createElement("span");
  lock.className = "lock-icon";
  lock.setAttribute("aria-hidden", "true");
  lock.textContent = icon;
  const label = document.createElement("span");
  label.className = "lock-label";
  label.textContent = t("album.locked");
  face.append(lock, label);
  inner.append(face);
  card.append(inner);
  return card;
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

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
