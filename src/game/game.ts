import * as THREE from "three";
import { MAP_BOUNDS, geoToWorld } from "./data";
import { InputController } from "./input";
import { GameSimulation } from "./simulation";
import { GameUI } from "./ui";
import { WorldView } from "./world";
import { SaveStore } from "./save-store";
import { GameAudio } from "./audio";
import { t } from "../i18n";

const ROUTINE_SAVE_SECONDS = 5;
const COMPASS_INTRO_MOVEMENT_SECONDS = 0.4;

export class PocketEarthGame {
  readonly simulation = new GameSimulation();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly world = new WorldView();
  private readonly localFog = new THREE.Fog(0x9fe4ef, 32, 62);
  private readonly sun = new THREE.DirectionalLight(0xfff3cf, 3.4);
  private readonly sunTarget = new THREE.Object3D();
  private readonly clock = new THREE.Clock();
  private readonly input: InputController;
  private readonly ui: GameUI;
  private cameraViewSize = 17;
  private projectionViewSize = 17;
  private overviewBlend = 0;
  private hasSizedCamera = false;
  private worldOverview = false;
  private animationFrame?: number;
  private readonly saveStore = new SaveStore();
  private readonly audio = new GameAudio();
  private restoredFromSave = false;
  private sinceRoutineSave = 0;
  private compassAvailable = false;
  private compassMovementSeconds = 0;
  private platformSuspended = false;
  private contextLost = false;

  constructor(
    canvas: HTMLCanvasElement,
    onCommercialBreak: () => void = () => {},
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x9fe4ef);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene.background = new THREE.Color(0x9fe4ef);
    this.scene.fog = this.localFog;
    this.scene.add(this.world.root);
    this.addLighting();

    this.input = new InputController(canvas);
    this.ui = new GameUI(
      () => this.interact(),
      () => this.toggleWorldOverview(),
      () => this.audio.onMilestone(),
      (color) => this.world.setVehiclePaint(color),
      () => this.persist(true),
      onCommercialBreak,
    );

    this.camera.near = 0.1;
    this.camera.far = 600;
    this.camera.position.set(0, 20, 16);
    this.camera.lookAt(0, 0, -2);
    this.scene.add(this.camera);

    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onGlobalKeyDown);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    window.addEventListener("pagehide", this.onPageHide);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pointerdown", this.onFirstGesture);
    window.addEventListener("keydown", this.onFirstGesture);
    this.setupSoundToggle();
    this.onResize();

    this.restoreSave();
    this.compassAvailable = this.restoredFromSave;
    this.ui.setCompassAvailable(this.compassAvailable);
    this.simulation.update(0, { x: 0, z: 0 });
    // Establish Paris as the starting context without pretending that the
    // player has just crossed a border into France.
    this.processEvents(true);
    this.ui.update(this.simulation.state);
  }

  private readonly onFirstGesture = (): void => {
    this.audio.unlock();
    window.removeEventListener("pointerdown", this.onFirstGesture);
    window.removeEventListener("keydown", this.onFirstGesture);
  };

  private setupSoundToggle(): void {
    const button = document.getElementById("sound-button");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const paint = () => {
      const muted = this.audio.isMuted;
      button.textContent = muted ? "🔇" : "🔊";
      button.setAttribute("aria-pressed", String(!muted));
    };
    paint();
    button.addEventListener("click", () => {
      this.audio.toggleMuted();
      paint();
    });
  }

  private restoreSave(): void {
    const snapshot = this.saveStore.load();
    if (!snapshot) {
      return;
    }
    this.simulation.restore(snapshot);
    this.ui.restoreCompletedQuizzes(snapshot.completedQuizzes);
    this.ui.restoreProgression({
      activeTrip: snapshot.activeTrip,
      completedTrips: snapshot.completedTrips,
      unlockedPaints: snapshot.unlockedPaints,
      equippedPaint: snapshot.equippedPaint,
    });
    this.restoredFromSave = true;
  }

  /** `immediate` is used for milestones so progress survives an instant close. */
  private persist(immediate = false): void {
    const { state } = this.simulation;
    const progression = this.ui.getProgression();
    this.saveStore.save(
      {
        position: { x: state.position.x, z: state.position.z },
        heading: state.heading,
        elapsed: state.elapsed,
        visitedCountries: [...state.visitedCountries],
        collectedPostcards: [...state.collectedPostcards],
        completedQuizzes: this.ui.getCompletedQuizzes(),
        discoveredSpecialties: [...state.discoveredSpecialties],
        ...progression,
      },
      immediate,
    );
  }

  hasRestoredProgress(): boolean {
    return this.restoredFromSave;
  }

  resetProgress(): void {
    this.saveStore.clear();
    this.restoredFromSave = false;
  }

  start(): void {
    if (
      this.animationFrame !== undefined ||
      this.platformSuspended ||
      this.contextLost ||
      document.visibilityState === "hidden"
    ) {
      return;
    }
    this.clock.start();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  interact(): void {
    if (this.platformSuspended) {
      return;
    }
    this.simulation.interact();
    this.processEvents();
  }

  toggleWorldOverview(): void {
    if (this.platformSuspended || this.ui.isInputBlocked()) {
      return;
    }
    this.worldOverview = !this.worldOverview;
    this.ui.setWorldOverview(this.worldOverview);
    this.onResize();
  }

  pauseForPlatform(): void {
    if (this.platformSuspended) {
      return;
    }
    this.platformSuspended = true;
    this.persist(true);
    this.saveStore.flush();
    this.input.setEnabled(false);
    this.audio.suspend();
    this.stop();
  }

  resumeFromPlatform(): void {
    if (!this.platformSuspended) {
      return;
    }
    this.platformSuspended = false;
    this.input.setEnabled(true);
    this.audio.resume();
    this.start();
  }

  private readonly tick = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const movement =
      this.worldOverview || this.ui.isInputBlocked()
        ? { x: 0, z: 0 }
        : this.input.update();

    if (
      !this.worldOverview &&
      !this.ui.isInputBlocked() &&
      this.input.consumeInteractRequest()
    ) {
      this.simulation.interact();
    }

    this.simulation.update(delta, movement);
    this.processEvents();

    const { state } = this.simulation;
    if (
      !this.compassAvailable &&
      Math.hypot(movement.x, movement.z) > 0.1 &&
      Math.hypot(state.velocity.x, state.velocity.z) > 0.65
    ) {
      this.compassMovementSeconds += delta;
      if (this.compassMovementSeconds >= COMPASS_INTRO_MOVEMENT_SECONDS) {
        this.compassAvailable = true;
        this.ui.setCompassAvailable(true);
      }
    }
    this.world.update(
      state.elapsed,
      delta,
      state.position,
      state.velocity,
      state.heading,
      state.vehicleMode === "boat",
      state.cruiseFlow,
      state.modeTransition,
      this.overviewBlend,
    );
    this.updateCamera(delta);
    this.ui.update(state);
    this.audio.updateDrive(state);
    this.renderer.render(this.scene, this.camera);

    this.sinceRoutineSave += delta;
    if (this.sinceRoutineSave >= ROUTINE_SAVE_SECONDS) {
      this.sinceRoutineSave = 0;
      this.persist();
    }

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private processEvents(suppressCountryFeedback = false): void {
    let reachedMilestone = false;
    for (const event of this.simulation.consumeEvents()) {
      if (event.type === "world-wrapped") {
        this.camera.position.x += event.deltaX;
      }
      if (
        (event.type === "country-entered" && event.firstVisit) ||
        (event.type === "postcard-collected" && event.firstCollection) ||
        (event.type === "specialty-discovered" && event.firstDiscovery)
      ) {
        reachedMilestone = true;
      }
      const suppressFeedback =
        suppressCountryFeedback && event.type === "country-entered";
      if (!suppressFeedback) {
        this.emitAudioForEvent(event);
        this.ui.handleEvent(event);
      }
    }
    if (reachedMilestone) {
      this.persist(true);
      this.sinceRoutineSave = 0;
    }
  }

  private emitAudioForEvent(
    event: ReturnType<GameSimulation["consumeEvents"]>[number],
  ): void {
    switch (event.type) {
      case "mode-changed":
        this.audio.onModeChanged(event.mode);
        break;
      case "cruise-flow":
        this.audio.onCruiseFlow();
        break;
      case "country-entered":
        this.audio.onCountryEntered(event.firstVisit);
        break;
      case "postcard-collected":
        this.audio.onPostcardCollected(event.firstCollection);
        break;
      case "map-edge":
        this.audio.onMapEdge();
        break;
      case "specialty-discovered":
        this.audio.onSpecialtyDiscovered(event.firstDiscovery);
        break;
      case "world-wrapped":
        break;
    }
  }

  private updateCamera(delta: number): void {
    const { position, velocity, cruiseFlow, modeTransition } =
      this.simulation.state;
    const transitionSmoothing = 1 - Math.exp(-3.2 * delta);
    this.overviewBlend +=
      ((this.worldOverview ? 1 : 0) - this.overviewBlend) *
      transitionSmoothing;
    const easedOverviewBlend = THREE.MathUtils.smoothstep(
      this.overviewBlend,
      0,
      1,
    );
    const localFactor = 1 - easedOverviewBlend;
    const leadX = velocity.x * 0.2 * localFactor;
    const leadZ = velocity.z * 0.2 * localFactor;
    const targetPosition = new THREE.Vector3(
      position.x + leadX * 0.45,
      20,
      position.z + 16 + leadZ * 0.45,
    ).lerp(new THREE.Vector3(0, 240, 92), easedOverviewBlend);
    const smoothing = 1 - Math.exp(-4.5 * delta);
    this.camera.position.lerp(targetPosition, smoothing);
    const lookAtTarget = new THREE.Vector3(
      position.x + leadX,
      0,
      position.z - 2.4 + leadZ,
    ).lerp(new THREE.Vector3(0, 0, 0), easedOverviewBlend);
    this.camera.lookAt(lookAtTarget);
    const lightingCenter = new THREE.Vector3(
      position.x,
      0,
      position.z,
    ).lerp(new THREE.Vector3(0, 0, 0), easedOverviewBlend);
    this.sun.position.set(
      lightingCenter.x - 16,
      28,
      lightingCenter.z + 18,
    );
    this.sunTarget.position.copy(lightingCenter);
    this.sun.castShadow = easedOverviewBlend < 0.35;

    const targetViewSize =
      this.getTargetViewSize() +
      (cruiseFlow * 0.55 + modeTransition * 1.25) * localFactor;
    this.projectionViewSize +=
      (targetViewSize - this.projectionViewSize) * transitionSmoothing;
    this.applyCameraProjection(this.projectionViewSize);

    this.localFog.near = THREE.MathUtils.lerp(
      32,
      175,
      easedOverviewBlend,
    );
    this.localFog.far = THREE.MathUtils.lerp(
      62,
      520,
      easedOverviewBlend,
    );
  }

  private addLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0xfffae8, 0x3f7c88, 2.1);
    this.scene.add(hemisphere);

    this.sun.position.set(-16, 28, 18);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -25;
    this.sun.shadow.camera.right = 25;
    this.sun.shadow.camera.top = 25;
    this.sun.shadow.camera.bottom = -25;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 70;
    this.sun.shadow.bias = -0.00035;
    this.sun.target = this.sunTarget;
    this.scene.add(this.sun, this.sunTarget);
  }

  private readonly onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!this.hasSizedCamera) {
      this.projectionViewSize = this.getTargetViewSize();
      this.hasSizedCamera = true;
    }
    this.applyCameraProjection(this.projectionViewSize);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(width, height, false);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (this.platformSuspended || this.worldOverview) {
      return;
    }
    this.cameraViewSize = THREE.MathUtils.clamp(
      this.cameraViewSize + Math.sign(event.deltaY) * 1.2,
      12,
      27,
    );
    this.onResize();
  };

  private getTargetViewSize(): number {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const mobileAdjustment = width < 700 ? 1.16 : 1;
    const northWest = geoToWorld([
      MAP_BOUNDS.minLongitude,
      MAP_BOUNDS.maxLatitude,
    ]);
    const southEast = geoToWorld([
      MAP_BOUNDS.maxLongitude,
      MAP_BOUNDS.minLatitude,
    ]);
    const mapWidth = southEast.x - northWest.x;
    const mapDepth = southEast.z - northWest.z;
    const overviewSize = Math.max(
      mapDepth * 1.24,
      (mapWidth + 18) / aspect,
    );
    return this.worldOverview
      ? overviewSize
      : this.cameraViewSize * mobileAdjustment;
  }

  private applyCameraProjection(viewSize: number): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();
  }

  private readonly onPageHide = (): void => {
    this.persist(true);
    this.saveStore.flush();
  };

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.persist(true);
      this.saveStore.flush();
      this.audio.suspend();
      this.stop();
    } else {
      this.audio.resume();
      this.start();
    }
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    this.stop();
    this.ui.showToast(t("toast.contextLost"));
  };

  private readonly onContextRestored = (): void => {
    this.contextLost = false;
    this.ui.showToast(t("toast.contextRestored"));
    this.start();
  };

  private readonly onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (
      event.code === "KeyM" &&
      !event.repeat &&
      !this.platformSuspended &&
      !this.ui.isInputBlocked()
    ) {
      this.toggleWorldOverview();
    }
  };
}
