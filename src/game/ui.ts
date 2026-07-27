import {
  MAP_BOUNDS,
  PHOTO_SPOTS,
  type PhotoSpotDefinition,
  type PhotoSpotId,
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
import {
  getCountryQuiz,
  getSpotQuiz,
  localizeText,
  type QuizSet,
} from "./quiz";
import {
  REGIONAL_SPECIALTIES,
  type RegionalSpecialtyDefinition,
} from "./regional-specialties";
import { getSpecialtyCopy } from "./regional-specialty-copy";
import {
  hasLandmarkIllustration,
  landmarkIllustrationUrl,
} from "./landmark-standees";

interface QuizSubject {
  quiz: QuizSet;
  label: string;
}

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
  quizButton: HTMLButtonElement;
  quizButtonSubject: HTMLElement;
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
  compass: HTMLButtonElement;
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
  private currentNearestSpecialty?: RegionalSpecialtyDefinition;
  private renderedTotalsKey?: string;
  private renderedRegionKey?: string;
  private selectedPhotoSpotFirstCollection = false;
  private worldOverviewActive = false;
  private availableQuiz?: QuizSubject;
  private activeQuiz?: QuizSubject;
  private quizIndex = 0;
  private quizCorrect = 0;
  private quizAnswered = false;
  private readonly completedQuizzes = new Set<string>();
  private latestState?: GameState;
  private selectedTargetId?: PhotoSpotId;
  private wishlistOpen = false;
  private wishlistStructureSig?: string;
  private wishlistRows: WishlistRow[] = [];
  private compassSignature?: string;
  private milestoneReady = false;
  private prevLandmarks = 0;
  private prevSpecialties = 0;
  private prevCountries = 0;
  private prevRegionDone = new Map<string, number>();
  private readonly celebrationQueue: CelebrationItem[] = [];
  private celebrationActive = false;
  private celebrationTimer?: number;
  private readonly onCelebrate: () => void;

  constructor(
    onInteract: () => void,
    onToggleWorldView: () => void,
    onCelebrate: () => void = () => {},
  ) {
    this.onCelebrate = onCelebrate;
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
      quizButton: requireButton("quiz-button"),
      quizButtonSubject: requireElement("quiz-button-subject"),
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
      compass: requireButton("compass"),
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
    };

    this.buildLanguageSelector();
    const { halo, dot } = this.buildMiniMap();
    this.playerHalo = halo;
    this.playerDot = dot;
    this.buildPassport();

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
    this.elements.quizButton.addEventListener("click", () => this.openQuiz());
    this.elements.quizBackdrop.addEventListener("click", () => this.closeQuiz());
    this.elements.quizClose.addEventListener("click", () => this.closeQuiz());
    this.elements.quizSkip.addEventListener("click", () => this.closeQuiz());
    this.elements.quizNext.addEventListener("click", () => this.advanceQuiz());
    this.elements.compass.addEventListener("click", () =>
      this.setWishlistOpen(!this.wishlistOpen),
    );
    this.elements.albumOpen.addEventListener("click", () => this.openAlbum());
    this.elements.albumBackdrop.addEventListener("click", () =>
      this.toggleAlbum(false),
    );
    this.elements.albumClose.addEventListener("click", () =>
      this.toggleAlbum(false),
    );
    document.addEventListener("pointerdown", (event) => {
      if (
        this.wishlistOpen &&
        !this.elements.compassDock.contains(event.target as Node)
      ) {
        this.setWishlistOpen(false);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        this.toggleLandmarkDetail(false);
        this.togglePassport(false);
        this.closeQuiz();
        this.setWishlistOpen(false);
        this.toggleAlbum(false);
      }
    });

    window.setTimeout(() => this.elements.controlsHint.classList.add("is-faded"), 7000);
    onLocaleChange(() => this.refreshLocale());
  }

  update(state: GameState): void {
    this.latestState = state;
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
    this.currentNearestSpecialty = state.nearestSpecialty;
    this.updateTravelInfo(profile, localizedSpot);
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
    this.elements.interactButton.disabled = !profile && !state.nearestPhotoSpot;

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
    this.updateCompass(state);
    this.checkMilestones(state);
  }

  /**
   * The compass turns aimless roaming into a route: it always points at one
   * uncollected landmark — the player's pick, or the nearest one otherwise —
   * so every session has an obvious "where to next".
   */
  private updateCompass(state: GameState): void {
    const dock = this.elements.compassDock;
    const blocked =
      this.worldOverviewActive ||
      this.isInputBlocked() ||
      Boolean(this.activeQuiz);
    const targets = blocked ? [] : this.uncollectedByDistance(state);

    if (targets.length === 0) {
      if (!dock.hidden) {
        dock.hidden = true;
        this.setWishlistOpen(false);
      }
      return;
    }
    dock.hidden = false;

    let target = this.selectedTargetId
      ? targets.find((entry) => entry.spot.id === this.selectedTargetId)
      : undefined;
    if (!target) {
      this.selectedTargetId = undefined;
      target = targets[0];
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
        : t("compass.distance", { km: formatKm(target.geoKm) });
    const signature = `${target.spot.id}|${name}|${distanceText}`;
    if (signature !== this.compassSignature) {
      this.compassSignature = signature;
      this.elements.compassTarget.textContent = name;
      this.elements.compassDistance.textContent = distanceText;
    }

    if (this.wishlistOpen) {
      this.renderWishlist(targets, target.spot.id);
    }
  }

  private uncollectedByDistance(
    state: GameState,
  ): { spot: PhotoSpotDefinition; worldDistance: number; geoKm: number }[] {
    const geo = getCurrentGeoPosition(state);
    const entries: {
      spot: PhotoSpotDefinition;
      worldDistance: number;
      geoKm: number;
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
        geoKm: haversineKm(geo, spot.point),
      });
    }
    entries.sort((a, b) => a.worldDistance - b.worldDistance);
    return entries;
  }

  private setWishlistOpen(open: boolean): void {
    const next = open && !this.elements.compassDock.hidden;
    this.wishlistOpen = next;
    this.elements.wishlist.hidden = !next;
    this.elements.compass.setAttribute("aria-expanded", String(next));
    if (next) {
      this.wishlistStructureSig = undefined;
      if (this.latestState) {
        const targets = this.uncollectedByDistance(this.latestState);
        const targetId =
          targets.find((entry) => entry.spot.id === this.selectedTargetId)?.spot
            .id ?? targets[0]?.spot.id;
        if (targetId) {
          this.renderWishlist(targets, targetId);
        }
      }
    }
  }

  private renderWishlist(
    targets: { spot: PhotoSpotDefinition; worldDistance: number; geoKm: number }[],
    targetId: PhotoSpotId,
  ): void {
    const top = targets.slice(0, 3);
    const structureSig = `${top.map((entry) => entry.spot.id).join(",")}`;
    if (structureSig !== this.wishlistStructureSig) {
      this.wishlistStructureSig = structureSig;
      this.wishlistRows = top.map((entry) => {
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
      const entry = top.find((candidate) => candidate.spot.id === row.id);
      if (!entry) {
        continue;
      }
      row.distance.textContent =
        entry.worldDistance < INTERACT_RADIUS
          ? t("wishlist.here")
          : t("compass.distance", { km: formatKm(entry.geoKm) });
      row.button.classList.toggle("is-active", row.id === targetId);
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
  }

  private refreshQuizAvailability(
    profile: CountryProfile | undefined,
    spot: PhotoSpotDefinition | undefined,
  ): void {
    let subject: QuizSubject | undefined;

    const spotQuiz = getSpotQuiz(spot?.id);
    if (spot && spotQuiz) {
      subject = { quiz: spotQuiz, label: localizePhotoSpot(spot).name };
    } else if (profile?.tier === "A") {
      const countryQuiz = getCountryQuiz(profile.atlasName);
      if (countryQuiz) {
        subject = { quiz: countryQuiz, label: profile.name };
      }
    }

    if (subject && this.completedQuizzes.has(subject.quiz.id)) {
      subject = undefined;
    }

    this.availableQuiz = subject;

    const hidden =
      !subject || this.worldOverviewActive || Boolean(this.activeQuiz);
    this.elements.quizButton.hidden = hidden;
    if (subject) {
      this.elements.quizButtonSubject.textContent = subject.label;
    }
  }

  private openQuiz(): void {
    if (!this.availableQuiz) {
      return;
    }
    this.activeQuiz = this.availableQuiz;
    this.quizIndex = 0;
    this.quizCorrect = 0;
    this.elements.quizButton.hidden = true;
    this.elements.quizPanel.classList.add("is-visible");
    this.elements.quizPanel.setAttribute("aria-hidden", "false");
    this.renderQuizQuestion();
  }

  private closeQuiz(): void {
    if (!this.activeQuiz) {
      return;
    }
    this.activeQuiz = undefined;
    this.elements.quizPanel.classList.remove("is-visible");
    this.elements.quizPanel.setAttribute("aria-hidden", "true");
  }

  private renderQuizQuestion(): void {
    const active = this.activeQuiz;
    if (!active) {
      return;
    }

    const locale = getLocale();
    const question = active.quiz.questions[this.quizIndex];
    this.quizAnswered = false;

    this.elements.quizSubject.textContent = active.label;
    this.elements.quizProgress.textContent = t("quiz.progress", {
      current: this.quizIndex + 1,
      total: active.quiz.questions.length,
    });
    this.elements.quizPrompt.textContent = localizeText(question.prompt, locale);
    this.elements.quizFeedback.hidden = true;
    this.elements.quizNext.hidden = true;
    this.elements.quizSkip.hidden = false;

    this.elements.quizOptions.replaceChildren();
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = localizeText(option, locale);
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

    const locale = getLocale();
    const question = active.quiz.questions[this.quizIndex];
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
    } ${localizeText(question.explain, locale)}`;

    const isLast = this.quizIndex >= active.quiz.questions.length - 1;
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
    this.completedQuizzes.add(active.quiz.id);

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
    window.setTimeout(() => {
      this.elements.quizSkip.textContent = t("quiz.leave");
      this.closeQuiz();
    }, 1800);
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
      case "specialty-discovered":
        this.announceSpecialty(event.specialty, event.firstDiscovery);
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
    if (active) {
      this.setWishlistOpen(false);
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
  }

  isInputBlocked(): boolean {
    return (
      this.elements.landmarkDetail.classList.contains("is-visible") ||
      this.elements.passportPanel.classList.contains("is-visible") ||
      this.elements.postcardAlbum.classList.contains("is-visible")
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

  private capturePostcard(spot: PhotoSpotDefinition, firstCollection: boolean): void {
    if (spot.visitMode !== "reflection") {
      this.elements.flash.classList.remove("is-active");
      void this.elements.flash.offsetWidth;
      this.elements.flash.classList.add("is-active");
    }

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
    this.elements.postcardAlbum.classList.toggle("is-visible", shouldOpen);
    this.elements.postcardAlbum.setAttribute("aria-hidden", String(!shouldOpen));
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
}

const INTERACT_RADIUS = 2.6;
const LANDMARK_STEPS = [10, 20, 30] as const;
const COUNTRY_STEPS = [25, 50, 100] as const;

const COMPASS_MIN_WORLD = geoToWorld([
  MAP_BOUNDS.minLongitude,
  MAP_BOUNDS.maxLatitude,
]);
const COMPASS_MAX_WORLD = geoToWorld([
  MAP_BOUNDS.maxLongitude,
  MAP_BOUNDS.minLatitude,
]);
const WORLD_WIDTH = COMPASS_MAX_WORLD.x - COMPASS_MIN_WORLD.x;

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

/** Shortest signed x offset, accounting for the east–west world wrap. */
function wrappedDeltaX(targetX: number, playerX: number): number {
  let dx = targetX - playerX;
  if (dx > WORLD_WIDTH / 2) {
    dx -= WORLD_WIDTH;
  } else if (dx < -WORLD_WIDTH / 2) {
    dx += WORLD_WIDTH;
  }
  return dx;
}

/** Great-circle distance in kilometres between two [lon, lat] points. */
function haversineKm(
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  const radius = 6371;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatKm(km: number): string {
  const rounded = km >= 100 ? Math.round(km / 10) * 10 : Math.max(1, Math.round(km));
  return rounded.toLocaleString(getLocale());
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
