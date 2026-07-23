import * as THREE from "three";
import { MAP_BOUNDS, geoToWorld } from "./data";
import { InputController } from "./input";
import { GameSimulation } from "./simulation";
import { GameUI } from "./ui";
import { WorldView } from "./world";

export class PocketEarthGame {
  readonly simulation = new GameSimulation();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly world = new WorldView();
  private readonly localFog = new THREE.Fog(0x9fe4ef, 32, 62);
  private readonly clock = new THREE.Clock();
  private readonly input: InputController;
  private readonly ui: GameUI;
  private cameraViewSize = 17;
  private worldOverview = false;
  private animationFrame?: number;

  constructor(canvas: HTMLCanvasElement) {
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

    const joystick = requireHTMLElement("joystick");
    const joystickKnob = requireHTMLElement("joystick-knob");
    this.input = new InputController(joystick, joystickKnob);
    this.ui = new GameUI(
      () => this.simulation.interact(),
      () => this.toggleWorldOverview(),
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
    this.onResize();

    this.simulation.update(0, { x: 0, z: 0 });
    this.processEvents();
    this.ui.update(this.simulation.state);
  }

  start(): void {
    if (this.animationFrame !== undefined) {
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
    this.simulation.interact();
    this.processEvents();
  }

  toggleWorldOverview(): void {
    this.worldOverview = !this.worldOverview;
    this.scene.fog = this.worldOverview ? null : this.localFog;
    this.ui.setWorldOverview(this.worldOverview);
    this.onResize();
  }

  private readonly tick = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const movement = this.worldOverview ? { x: 0, z: 0 } : this.input.update();

    if (!this.worldOverview && this.input.consumeInteractRequest()) {
      this.simulation.interact();
    }

    this.simulation.update(delta, movement);
    this.processEvents();

    const { state } = this.simulation;
    this.world.update(
      state.elapsed,
      delta,
      state.position,
      state.heading,
      state.vehicleMode === "boat",
    );
    this.updateCamera(delta);
    this.ui.update(state);
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private processEvents(): void {
    for (const event of this.simulation.consumeEvents()) {
      this.ui.handleEvent(event);
    }
  }

  private updateCamera(delta: number): void {
    const { position } = this.simulation.state;
    const targetPosition = this.worldOverview
      ? new THREE.Vector3(0, 240, 92)
      : new THREE.Vector3(position.x, 20, position.z + 16);
    const smoothing = 1 - Math.exp(-4.5 * delta);
    this.camera.position.lerp(targetPosition, smoothing);
    if (this.worldOverview) {
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera.lookAt(position.x, 0, position.z - 2.4);
    }
  }

  private addLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0xfffae8, 0x3f7c88, 2.1);
    this.scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xfff3cf, 3.4);
    sun.position.set(-16, 28, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.00035;
    sun.target.position.set(0, 0, 0);
    this.scene.add(sun, sun.target);
  }

  private readonly onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const mobileAdjustment = width < 700 ? 1.16 : 1;
    const northWest = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
    const southEast = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);
    const mapWidth = southEast.x - northWest.x;
    const mapDepth = southEast.z - northWest.z;
    const overviewSize = Math.max(mapDepth * 1.24, (mapWidth + 18) / aspect);
    const viewSize = this.worldOverview
      ? overviewSize
      : this.cameraViewSize * mobileAdjustment;

    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(width, height, false);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (this.worldOverview) {
      return;
    }
    this.cameraViewSize = THREE.MathUtils.clamp(
      this.cameraViewSize + Math.sign(event.deltaY) * 1.2,
      12,
      27,
    );
    this.onResize();
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.stop();
    this.ui.showToast("3D 画面暂时中断，正在恢复……");
  };

  private readonly onContextRestored = (): void => {
    this.ui.showToast("画面已恢复，继续旅行吧");
    this.start();
  };

  private readonly onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyM" && !event.repeat) {
      this.toggleWorldOverview();
    }
  };
}

function requireHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}
