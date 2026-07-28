import * as THREE from "three";
import {
  PHOTO_SPOTS,
  type GeoPoint,
  type PhotoSpotDefinition,
  geoToWorld,
  worldToGeo,
} from "./data";
import {
  WORLD_COUNTRIES,
  getCountryContentForAtlas,
  getWorldCountryByName,
  getWorldCountryAtGeo,
  type WorldCountry,
} from "./world-map";
import {
  getMapDimensions,
  getWorldTerrainMaterial,
  loadWorldTerrainTexture,
  prepareWorldTerrainGeometry,
} from "./world-terrain";
import type { LandmarkStandeeView } from "./landmark-standees";
import {
  REGIONAL_SPECIALTIES,
  type RegionalSpecialtyDefinition,
} from "./regional-specialties";
import type { RegionalSpecialtyStandeeView } from "./regional-specialty-standees";
import type { WorldEcology } from "./world-ecology";
import type { WorldLife } from "./world-life";
import type { OceanLife } from "./ocean-life";
import { wrappedDeltaX } from "./progression";

const RESERVED_MAP_MARKER_POSITIONS = [
  ...PHOTO_SPOTS.map((spot) => geoToWorld(spot.point)),
  ...REGIONAL_SPECIALTIES.map((specialty) => geoToWorld(specialty.point)),
];

interface VehicleView {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  pontoons: THREE.Mesh[];
  wake: THREE.Mesh[];
  /** Shared body material, retained so unlocked paints can recolour it. */
  bodyMaterial: THREE.MeshStandardMaterial;
}

interface VehicleTrailParticle {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.MeshBasicMaterial;
  age: number;
  lifetime: number;
  velocityX: number;
  velocityZ: number;
  baseScale: number;
}

interface LandmarkEffect {
  outerRing: THREE.Mesh;
  innerRing: THREE.Mesh;
  scanArc: THREE.Mesh;
  lightField: THREE.Mesh;
  marker: THREE.Mesh;
  outerRingMaterial: THREE.MeshBasicMaterial;
  innerRingMaterial: THREE.MeshBasicMaterial;
  scanArcMaterial: THREE.MeshBasicMaterial;
  lightFieldMaterial: THREE.MeshBasicMaterial;
  markerMaterial: THREE.MeshStandardMaterial;
  anchorX: number;
  anchorZ: number;
  phase: number;
  reveal: number;
  quiet: boolean;
}

type CreateLandmarkStandee =
  typeof import("./landmark-standees").createLandmarkStandee;
type UpdateLandmarkStandeeOverview =
  typeof import("./landmark-standees").updateLandmarkStandeeOverview;
type CreateRegionalSpecialtyStandee =
  typeof import("./regional-specialty-standees").createRegionalSpecialtyStandee;
type UpdateRegionalSpecialtyStandeeOverview =
  typeof import("./regional-specialty-standees").updateRegionalSpecialtyStandeeOverview;
type CreateOceanSurfaceMaterial =
  typeof import("./ocean-life").createOceanSurfaceMaterial;

export class WorldView {
  readonly root = new THREE.Group();
  readonly vehicle: VehicleView;
  private readonly wavelets: THREE.Mesh[] = [];
  private readonly landmarkEffects: LandmarkEffect[] = [];
  private readonly landmarkStandees: LandmarkStandeeView[] = [];
  private readonly regionalSpecialtyStandees: RegionalSpecialtyStandeeView[] =
    [];
  private ecology?: WorldEcology;
  private life?: WorldLife;
  private oceanLife?: OceanLife;
  private ocean?: THREE.Mesh;
  private createOceanSurfaceMaterial?: CreateOceanSurfaceMaterial;
  private updateLandmarkStandeeOverview?: UpdateLandmarkStandeeOverview;
  private updateRegionalSpecialtyStandeeOverview?: UpdateRegionalSpecialtyStandeeOverview;
  private deferredLoad?: Promise<void>;
  private readonly vehicleTrail: VehicleTrailParticle[] = [];
  private modeBlend = 0;
  private vehicleLean = 0;
  private previousVehicleHeading?: number;
  private previousVehicleBoatMode?: boolean;
  private vehicleTrailClock = 0;
  private vehicleTrailCursor = 0;

  constructor() {
    this.root.name = "Pocket Planet world";
    this.addBoard();
    this.vehicle = this.createVehicle();
    this.root.add(this.vehicle.root);
    this.buildVehicleTrail();
  }

  loadDeferredContent(
    onProgress: (phase: string) => void = () => {},
  ): Promise<void> {
    this.deferredLoad ??= this.loadDeferredContentOnce(onProgress);
    return this.deferredLoad;
  }

  private async loadDeferredContentOnce(
    onProgress: (phase: string) => void,
  ): Promise<void> {
    onProgress("world");
    await nextFrame();
    this.addWorldCountries();

    onProgress("places");
    await nextFrame();
    const [
      landmarkModule,
      specialtyModule,
      ecologyModule,
      lifeModule,
      oceanModule,
    ] = await Promise.all([
      import("./landmark-standees"),
      import("./regional-specialty-standees"),
      import("./world-ecology"),
      import("./world-life"),
      import("./ocean-life"),
    ]);
    this.updateLandmarkStandeeOverview =
      landmarkModule.updateLandmarkStandeeOverview;
    this.updateRegionalSpecialtyStandeeOverview =
      specialtyModule.updateRegionalSpecialtyStandeeOverview;
    this.createOceanSurfaceMaterial = oceanModule.createOceanSurfaceMaterial;
    this.addCountries(
      landmarkModule.createLandmarkStandee,
      specialtyModule.createRegionalSpecialtyStandee,
    );

    onProgress("details");
    await nextFrame();
    this.addGeographyFeatures();
    this.addOceanDetails();
    this.ecology = new ecologyModule.WorldEcology(
      RESERVED_MAP_MARKER_POSITIONS,
    );
    this.life = new lifeModule.WorldLife();
    this.oceanLife = new oceanModule.OceanLife();
    this.root.add(this.ecology.root, this.life.root, this.oceanLife.root);

    if (this.ocean) {
      const previousMaterial = this.ocean.material;
      this.ocean.material = oceanModule.createOceanSurfaceMaterial();
      if (previousMaterial instanceof THREE.Material) {
        previousMaterial.dispose();
      }
    }
    onProgress("texture");
    await loadWorldTerrainTexture();
  }

  /**
   * Mobile browsers may discard a CanvasTexture's GPU contents while the page
   * is in the background without losing the rest of the WebGL scene. Rebuild
   * only the generated ocean texture when play resumes.
   */
  refreshOceanSurface(): void {
    if (!this.ocean || !this.createOceanSurfaceMaterial) {
      return;
    }
    const previousMaterial = this.ocean.material;
    this.ocean.material = this.createOceanSurfaceMaterial();
    if (previousMaterial instanceof THREE.MeshStandardMaterial) {
      previousMaterial.map?.dispose();
      previousMaterial.dispose();
    }
  }

  update(
    elapsed: number,
    delta: number,
    position: { x: number; z: number },
    velocity: { x: number; z: number },
    heading: number,
    boatMode: boolean,
    cruiseFlow = 0,
    modeTransition = 0,
    overviewBlend = 0,
  ): void {
    this.modeBlend += ((boatMode ? 1 : 0) - this.modeBlend) * (1 - Math.exp(-7 * delta));
    this.life?.update(
      elapsed,
      delta,
      position.x,
      position.z,
      velocity,
      overviewBlend,
    );
    this.oceanLife?.update(
      elapsed,
      delta,
      position,
      velocity,
      heading,
      boatMode,
      overviewBlend,
    );
    this.ecology?.update(delta, position, velocity, overviewBlend);
    const speed = Math.hypot(velocity.x, velocity.z);
    const headingDelta =
      this.previousVehicleHeading === undefined
        ? 0
        : shortestAngleDelta(this.previousVehicleHeading, heading);
    this.previousVehicleHeading = heading;
    const turnRate = headingDelta / Math.max(0.001, delta);
    const targetLean =
      THREE.MathUtils.clamp(-turnRate * 0.038, -0.15, 0.15) *
      THREE.MathUtils.lerp(0.9, 1.18, this.modeBlend);
    this.vehicleLean +=
      (targetLean - this.vehicleLean) * (1 - Math.exp(-9 * delta));
    const transitionArc = Math.sin(
      (1 - THREE.MathUtils.clamp(modeTransition, 0, 1)) * Math.PI,
    );
    this.vehicle.root.position.x = position.x;
    this.vehicle.root.position.z = position.z;
    this.vehicle.root.position.y =
      THREE.MathUtils.lerp(0.37, 0.09, this.modeBlend) +
      transitionArc * (boatMode ? 0.13 : 0.06);
    this.vehicle.root.rotation.y = heading;
    this.vehicle.root.rotation.x =
      -transitionArc * (boatMode ? 0.085 : 0.035);
    this.vehicle.root.rotation.z =
      this.vehicleLean +
      (boatMode ? Math.sin(elapsed * 2.1) * 0.045 : 0);

    for (const wheel of this.vehicle.wheels) {
      const scale = THREE.MathUtils.lerp(1, 0.08, this.modeBlend);
      wheel.scale.set(scale, scale, scale);
      wheel.rotation.x -= delta * 8 * (1 - this.modeBlend);
    }

    for (const pontoon of this.vehicle.pontoons) {
      const scale = THREE.MathUtils.lerp(0.08, 1, this.modeBlend);
      pontoon.scale.set(scale, scale, scale);
    }

    for (let index = 0; index < this.vehicle.wake.length; index += 1) {
      const wake = this.vehicle.wake[index];
      wake.visible = this.modeBlend > 0.2;
      const speedFactor = THREE.MathUtils.clamp(speed / 6.4, 0, 1);
      const pulse =
        (elapsed * (1.15 + speedFactor * 0.75) + index * 0.35) % 1;
      wake.position.z = 0.9 + pulse * (1.35 + speedFactor * 0.55);
      wake.scale.setScalar(0.4 + pulse);
      (wake.material as THREE.MeshBasicMaterial).opacity =
        (1 - pulse) *
        this.modeBlend *
        (0.28 + speedFactor * 0.28 + modeTransition * 0.32);
    }

    this.updateVehicleTrail(
      delta,
      position,
      velocity,
      heading,
      boatMode,
      cruiseFlow,
      overviewBlend,
    );

    for (const [index, wavelet] of this.wavelets.entries()) {
      wavelet.position.y = 0.09 + Math.sin(elapsed * 1.2 + index) * 0.025;
      wavelet.rotation.z = Math.sin(elapsed * 0.3 + index) * 0.12;
    }

    for (const standee of this.landmarkStandees) {
      const distance = Math.hypot(
        wrappedDeltaX(standee.anchorX, position.x),
        standee.anchorZ - position.z,
      );
      this.updateLandmarkStandeeOverview?.(
        standee,
        overviewBlend,
        elapsed,
        distance,
      );
    }

    for (const standee of this.regionalSpecialtyStandees) {
      const distance = Math.hypot(
        wrappedDeltaX(standee.anchorX, position.x),
        standee.anchorZ - position.z,
      );
      this.updateRegionalSpecialtyStandeeOverview?.(
        standee,
        overviewBlend,
        elapsed,
        distance,
      );
    }

    for (const effect of this.landmarkEffects) {
      const distance = Math.hypot(
        wrappedDeltaX(effect.anchorX, position.x),
        effect.anchorZ - position.z,
      );
      const strength = THREE.MathUtils.clamp((18 - distance) / 13, 0, 1);
      const acquire = THREE.MathUtils.smoothstep(strength, 0.03, 0.4);
      const focus = THREE.MathUtils.smoothstep(strength, 0.38, 0.9);
      const targetReveal = THREE.MathUtils.smoothstep(strength, 0.18, 0.72);
      effect.reveal +=
        (targetReveal - effect.reveal) * (1 - Math.exp(-4.8 * delta));

      const visible = acquire > 0.002;
      const quietFactor = effect.quiet ? 0.34 : 1;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.35 + effect.phase);
      effect.outerRing.visible = visible;
      effect.innerRing.visible = visible;
      effect.scanArc.visible = visible && !effect.quiet;
      effect.lightField.visible = visible && !effect.quiet;
      effect.marker.visible = visible;

      effect.outerRing.scale.setScalar(1.08 - effect.reveal * 0.08 + pulse * 0.015);
      effect.outerRing.rotation.z = elapsed * 0.08 + effect.phase;
      effect.outerRingMaterial.opacity =
        acquire * (0.1 + focus * 0.16) * quietFactor;

      effect.innerRing.scale.setScalar(0.82 + effect.reveal * 0.18);
      effect.innerRing.rotation.z = -elapsed * 0.16 - effect.phase;
      effect.innerRingMaterial.opacity =
        effect.reveal * (0.07 + focus * 0.13) * quietFactor;

      effect.scanArc.rotation.z = -elapsed * (0.54 + focus * 0.24) + effect.phase;
      effect.scanArcMaterial.opacity = effect.quiet
        ? 0
        : effect.reveal * (0.1 + focus * 0.28);

      effect.lightField.scale.y = 0.72 + effect.reveal * 0.28;
      effect.lightFieldMaterial.opacity = effect.quiet
        ? 0
        : effect.reveal * (0.018 + focus * 0.052);

      effect.marker.position.y =
        2.54 - effect.reveal * 0.24 +
        Math.sin(elapsed * (effect.quiet ? 0.55 : 1.35) + effect.phase) *
          (effect.quiet ? 0.018 : 0.045 + acquire * 0.035);
      effect.marker.rotation.y =
        elapsed * (effect.quiet ? 0.08 : 0.42) + effect.phase;
      effect.marker.rotation.z = effect.quiet
        ? 0
        : Math.sin(elapsed * 0.55 + effect.phase) * 0.08;
      effect.marker.scale.setScalar(
        effect.quiet
          ? 0.52 + acquire * 0.12
          : 0.58 + acquire * 0.24 + focus * 0.14,
      );
      effect.markerMaterial.emissiveIntensity = effect.quiet
        ? 0.05 + focus * 0.08
        : 0.12 + focus * 0.5;
      effect.markerMaterial.opacity = effect.quiet
        ? 0.4 + acquire * 0.32
        : 0.52 + acquire * 0.48;
    }
  }

  private addBoard(): void {
    const { width, depth } = getMapDimensions();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(width + 2.2, 0.75, depth + 2.2),
      new THREE.MeshStandardMaterial({ color: 0x195a73, roughness: 0.9 }),
    );
    base.position.y = -0.62;
    base.receiveShadow = true;
    this.root.add(base);

    const ocean = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.34, depth),
      new THREE.MeshStandardMaterial({
        color: 0x53bad8,
        roughness: 0.42,
        metalness: 0.04,
      }),
    );
    this.ocean = ocean;
    ocean.position.y = -0.18;
    ocean.receiveShadow = true;
    this.root.add(ocean);

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4d59b,
      roughness: 0.95,
    });
    const northSouthGeometry = new THREE.BoxGeometry(width + 2.2, 0.55, 0.75);
    const eastWestGeometry = new THREE.BoxGeometry(0.75, 0.55, depth + 2.2);
    const frameOffsetZ = depth / 2 + 0.72;
    const frameOffsetX = width / 2 + 0.72;

    for (const z of [-frameOffsetZ, frameOffsetZ]) {
      const rail = new THREE.Mesh(northSouthGeometry, frameMaterial);
      rail.position.set(0, -0.05, z);
      rail.castShadow = true;
      this.root.add(rail);
    }

    for (const x of [-frameOffsetX, frameOffsetX]) {
      const rail = new THREE.Mesh(eastWestGeometry, frameMaterial);
      rail.position.set(x, -0.05, 0);
      rail.castShadow = true;
      this.root.add(rail);
    }
  }

  private addWorldCountries(): void {
    const terrainMaterial = getWorldTerrainMaterial();
    const borderPositions: number[] = [];

    for (const country of WORLD_COUNTRIES) {
      const shapes = country.renderPolygons
        .filter((polygon) => polygon.length >= 3)
        .map((polygon) => {
          const shape = new THREE.Shape();
          polygon.forEach((point, index) => {
            const world = geoToWorld(point);
            if (index === 0) {
              shape.moveTo(world.x, -world.z);
            } else {
              shape.lineTo(world.x, -world.z);
            }
          });
          shape.closePath();
          return shape;
        });

      if (shapes.length === 0) {
        continue;
      }

      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.42,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 1,
      });
      geometry.rotateX(-Math.PI / 2);
      prepareWorldTerrainGeometry(geometry);

      const land = new THREE.Mesh(geometry, terrainMaterial);
      land.position.y = 0.02;
      land.receiveShadow = true;
      land.castShadow = true;
      land.name = `${country.name} natural terrain`;
      this.root.add(land);

      this.appendWorldCountryBorderSegments(country, borderPositions);
    }

    this.addMergedWorldCountryBorders(borderPositions);
  }

  private appendWorldCountryBorderSegments(
    country: WorldCountry,
    positions: number[],
  ): void {
    for (const polygon of country.renderPolygons) {
      if (polygon.length < 3) {
        continue;
      }

      for (let index = 0; index < polygon.length; index += 1) {
        const start = geoToWorld(polygon[index]);
        const end = geoToWorld(polygon[(index + 1) % polygon.length]);
        positions.push(
          start.x,
          0.458,
          start.z,
          end.x,
          0.458,
          end.z,
        );
      }
    }
  }

  private addMergedWorldCountryBorders(positions: readonly number[]): void {
    if (positions.length === 0) {
      return;
    }

    const material = new THREE.LineBasicMaterial({
      color: 0xfff9e8,
      transparent: true,
      opacity: 0.72,
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.computeBoundingSphere();

    const borders = new THREE.LineSegments(geometry, material);
    borders.name = "merged world country borders";
    this.root.add(borders);
  }

  private addCountries(
    createLandmarkStandee: CreateLandmarkStandee,
    createRegionalSpecialtyStandee: CreateRegionalSpecialtyStandee,
  ): void {
    for (const spot of PHOTO_SPOTS) {
      this.addPhotoSpot(spot, createLandmarkStandee);
    }

    for (const specialty of REGIONAL_SPECIALTIES) {
      this.addRegionalSpecialty(specialty, createRegionalSpecialtyStandee);
    }
  }

  private addRegionalSpecialty(
    specialty: RegionalSpecialtyDefinition,
    createRegionalSpecialtyStandee: CreateRegionalSpecialtyStandee,
  ): void {
    const world = geoToWorld(specialty.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.445, world.z);
    group.name = `${specialty.name} regional specialty`;

    const standee = createRegionalSpecialtyStandee(specialty, world);
    this.regionalSpecialtyStandees.push(standee);
    group.add(standee.root);
    this.root.add(group);
  }

  private addPhotoSpot(
    spot: PhotoSpotDefinition,
    createLandmarkStandee: CreateLandmarkStandee,
  ): void {
    const country = getCountryContentForAtlas(
      getWorldCountryByName(spot.atlasCountryName),
    );
    const accent = spot.accent ?? country?.accent ?? 0xc16f54;
    const world = geoToWorld(spot.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.445, world.z);
    group.name = `${spot.name} photo spot`;

    const standee = createLandmarkStandee(spot, accent, world);
    this.landmarkStandees.push(standee);
    group.add(standee.root);
    this.addLandmarkPresentation(group, spot, accent, world);
    group.scale.setScalar(1.08);
    this.root.add(group);
  }
  private addLandmarkPresentation(
    group: THREE.Group,
    spot: PhotoSpotDefinition,
    accent: THREE.ColorRepresentation,
    world: { x: number; z: number },
  ): void {
    const quiet = spot.visitMode === "reflection";
    const reef = spot.id === "great-barrier-reef";
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: reef ? 0x2c879a : quiet ? 0x59645f : 0x5f796d,
      roughness: 0.96,
      flatShading: true,
    });
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22, 1.35, 0.16, 12),
      platformMaterial,
    );
    platform.position.y = 0.08;
    platform.receiveShadow = true;
    platform.castShadow = true;

    const inset = new THREE.Mesh(
      new THREE.CylinderGeometry(1.02, 1.08, 0.08, 12),
      new THREE.MeshStandardMaterial({
        color: reef ? 0x72d0cb : quiet ? 0xc5c3b7 : 0xf0ddae,
        roughness: 0.9,
        flatShading: true,
      }),
    );
    inset.position.y = 0.19;
    inset.receiveShadow = true;

    const outerRingMaterial = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.44, 1.51, 64),
      outerRingMaterial,
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.035;
    outerRing.renderOrder = 4;

    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xf4fbff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.16, 1.205, 64),
      innerRingMaterial,
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.055;
    innerRing.renderOrder = 5;

    const scanArcMaterial = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const scanArc = new THREE.Mesh(
      new THREE.RingGeometry(1.27, 1.37, 48, 1, 0, Math.PI * 0.68),
      scanArcMaterial,
    );
    scanArc.rotation.x = -Math.PI / 2;
    scanArc.position.y = 0.075;
    scanArc.renderOrder = 6;

    const lightFieldMaterial = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const lightField = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.88, 2.25, 24, 1, true),
      lightFieldMaterial,
    );
    lightField.position.y = 1.18;
    lightField.renderOrder = 3;

    const markerMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.16,
      roughness: 0.42,
      metalness: 0.08,
      flatShading: true,
      transparent: true,
      opacity: 0,
    });
    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.17, 0),
      markerMaterial,
    );
    marker.position.y = 2.25;
    marker.castShadow = true;

    group.add(platform, inset, lightField, outerRing, innerRing, scanArc, marker);
    this.landmarkEffects.push({
      outerRing,
      innerRing,
      scanArc,
      lightField,
      marker,
      outerRingMaterial,
      innerRingMaterial,
      scanArcMaterial,
      lightFieldMaterial,
      markerMaterial,
      anchorX: world.x,
      anchorZ: world.z,
      phase: this.landmarkEffects.length * 0.83,
      reveal: 0,
      quiet,
    });
  }

  private addGeographyFeatures(): void {
    this.addRiver(
      [
        [31.0, 22.5],
        [31.45, 24.2],
        [31.1, 26.0],
        [31.35, 28.1],
        [31.05, 30.0],
        [31.2, 31.25],
      ],
      0x3fabc4,
      0.12,
      "Nile",
    );
    this.addRiver(
      [
        [8.3, 47.6],
        [8.0, 48.5],
        [7.6, 49.35],
        [6.9, 50.5],
        [6.7, 51.5],
        [6.75, 53.0],
      ],
      0x56a9bf,
      0.07,
      "Rhine",
    );
    this.addRiver(
      [
        [91.0, 31.0],
        [97.0, 32.0],
        [101.0, 30.2],
        [106.0, 29.6],
        [110.0, 30.5],
        [115.0, 30.3],
        [121.0, 31.2],
      ],
      0x4aa8c2,
      0.1,
      "Yangtze",
    );
    this.addRiver(
      [
        [77.0, 30.0],
        [80.0, 27.5],
        [83.0, 25.9],
        [86.0, 25.1],
        [88.0, 23.0],
      ],
      0x5db1c5,
      0.085,
      "Ganges",
    );
    this.addRiver(
      [
        [101.0, 22.0],
        [102.0, 20.0],
        [103.0, 18.0],
        [104.1, 16.0],
        [104.5, 14.0],
        [105.0, 10.0],
      ],
      0x55a9bc,
      0.07,
      "Mekong",
    );
    this.addRiver(
      [
        [9.0, 48.0],
        [12.0, 48.1],
        [16.0, 48.2],
        [19.0, 47.2],
        [22.0, 46.0],
        [29.0, 45.2],
      ],
      0x4da5bd,
      0.075,
      "Danube",
    );
    this.addRiver(
      [
        [35.0, 57.0],
        [38.0, 56.0],
        [40.0, 54.5],
        [45.0, 50.5],
        [48.0, 46.0],
      ],
      0x55a8bf,
      0.08,
      "Volga",
    );
    this.addRiver(
      [
        [73.5, 35.5],
        [72.0, 33.4],
        [71.0, 31.0],
        [69.0, 27.0],
        [67.5, 24.5],
      ],
      0x57a9be,
      0.09,
      "Indus",
    );
    this.addRiver(
      [
        [-73.2, -4.2],
        [-69.0, -4.0],
        [-65.0, -3.5],
        [-61.0, -3.3],
        [-57.0, -3.0],
        [-52.0, -1.7],
        [-48.3, -1.3],
      ],
      0x43a9c0,
      0.14,
      "Amazon",
    );
    this.addRiver(
      [
        [-63.0, 5.0],
        [-64.2, 3.0],
        [-62.0, 1.0],
        [-59.0, -1.7],
        [-57.0, -3.0],
      ],
      0x4aadc1,
      0.065,
      "Rio Negro",
    );
    this.addRiver(
      [
        [-54.5, -19.0],
        [-56.3, -23.0],
        [-58.0, -27.0],
        [-58.2, -31.0],
        [-58.4, -34.4],
      ],
      0x54aabe,
      0.09,
      "Paraná",
    );
    this.addRiver(
      [
        [-95.0, 47.0],
        [-93.0, 43.5],
        [-91.0, 39.0],
        [-90.2, 35.5],
        [-91.0, 31.0],
        [-89.2, 29.1],
      ],
      0x51a7bd,
      0.1,
      "Mississippi",
    );
    this.addRiver(
      [
        [24.0, -11.0],
        [22.0, -8.0],
        [21.0, -5.0],
        [18.0, -3.5],
        [15.0, -4.5],
        [12.5, -5.8],
      ],
      0x45a9bd,
      0.1,
      "Congo",
    );
    this.addRiver(
      [
        [-10.5, 11.0],
        [-7.0, 12.5],
        [-4.0, 14.0],
        [0.0, 13.0],
        [3.0, 11.5],
        [5.4, 10.2],
      ],
      0x52a9bc,
      0.085,
      "Niger",
    );
    this.addRiver(
      [
        [146.8, -36.0],
        [144.8, -35.2],
        [142.0, -34.6],
        [139.0, -34.9],
      ],
      0x5aabbd,
      0.07,
      "Murray",
    );

  }

  private addRiver(
    points: readonly GeoPoint[],
    color: number,
    radius: number,
    name: string,
  ): void {
    const curvePoints = points.map((point) => {
      const world = geoToWorld(point);
      return new THREE.Vector3(world.x, 0, world.z);
    });
    const curve = new THREE.CatmullRomCurve3(curvePoints, false, "centripetal");
    const group = new THREE.Group();
    group.name = `${name} river`;

    const valley = new THREE.Mesh(
      createRiverRibbonGeometry(curve, radius * 2.35, 0.454),
      new THREE.MeshStandardMaterial({
        color: 0x4b7952,
        roughness: 1,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      }),
    );
    valley.renderOrder = 1;

    const river = new THREE.Mesh(
      createRiverRibbonGeometry(curve, radius, 0.464),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.38,
        metalness: 0.06,
      }),
    );
    river.receiveShadow = true;
    river.renderOrder = 2;

    const highlight = new THREE.Mesh(
      createRiverRibbonGeometry(curve, radius * 0.18, 0.47),
      new THREE.MeshBasicMaterial({
        color: 0xc4f3ee,
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      }),
    );
    highlight.renderOrder = 3;

    group.add(valley, river, highlight);
    this.root.add(group);
  }

  private addOceanDetails(): void {
    const random = mulberry32(20260723);
    const { width, depth } = getMapDimensions();
    const material = new THREE.MeshBasicMaterial({
      color: 0xd9f7f5,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });

    for (let index = 0; index < 180; index += 1) {
      const x = (random() - 0.5) * (width - 2);
      const z = (random() - 0.5) * (depth - 2);
      const geo = worldToGeo(x, z);
      if (getWorldCountryAtGeo(geo)) {
        continue;
      }
      const wave = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 4, 10, Math.PI), material);
      wave.rotation.x = -Math.PI / 2;
      wave.rotation.z = random() * Math.PI;
      wave.position.set(x, 0.09, z);
      this.wavelets.push(wave);
      this.root.add(wave);
    }
  }

  private createVehicle(): VehicleView {
    const root = new THREE.Group();
    root.name = "Traveller car boat";

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6c55,
      roughness: 0.62,
      metalness: 0.03,
    });
    const creamMaterial = new THREE.MeshStandardMaterial({
      color: 0xffedc1,
      roughness: 0.76,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x29627a,
      roughness: 0.3,
      metalness: 0.08,
    });
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x243847,
      roughness: 0.92,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x314b57,
      roughness: 0.72,
      metalness: 0.12,
    });
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9d1cb,
      roughness: 0.45,
      metalness: 0.48,
    });
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe99b,
      emissive: 0xd28a22,
      emissiveIntensity: 0.45,
      roughness: 0.36,
    });
    const tailLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xb93832,
      emissive: 0x6d120f,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    });
    const luggageMaterial = new THREE.MeshStandardMaterial({
      color: 0x397d68,
      roughness: 0.84,
    });

    const addPart = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: readonly [number, number, number],
      rotation?: readonly [number, number, number],
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      if (rotation) {
        mesh.rotation.set(...rotation);
      }
      mesh.castShadow = true;
      root.add(mesh);
      return mesh;
    };

    // A dark chassis and inset body give the small vehicle a readable layered
    // silhouette without increasing its footprint on the world map.
    addPart(new THREE.BoxGeometry(1.28, 0.16, 1.48), trimMaterial, [0, 0.41, 0.02]);
    addPart(new THREE.BoxGeometry(1.18, 0.42, 1.42), bodyMaterial, [0, 0.64, 0.02]);
    addPart(new THREE.BoxGeometry(1.02, 0.22, 0.46), bodyMaterial, [0, 0.82, -0.82]);

    addPart(new THREE.BoxGeometry(0.96, 0.46, 0.78), creamMaterial, [0, 1.04, 0.12]);
    addPart(new THREE.BoxGeometry(1.02, 0.12, 0.86), creamMaterial, [0, 1.31, 0.12]);

    // Glazing on all four sides keeps the cabin legible from the chase camera
    // as the car turns, rather than reading as a plain cream cube.
    addPart(
      new THREE.BoxGeometry(0.76, 0.25, 0.045),
      glassMaterial,
      [0, 1.08, -0.29],
      [-0.08, 0, 0],
    );
    addPart(
      new THREE.BoxGeometry(0.7, 0.22, 0.04),
      glassMaterial,
      [0, 1.07, 0.525],
      [0.04, 0, 0],
    );
    for (const x of [-0.492, 0.492]) {
      addPart(new THREE.BoxGeometry(0.035, 0.22, 0.48), glassMaterial, [x, 1.07, 0.12]);
    }

    // Bumpers, running boards, lights, and grille supply strong small-scale
    // landmarks at the normal orthographic gameplay zoom.
    addPart(new THREE.BoxGeometry(1.12, 0.1, 0.11), metalMaterial, [0, 0.46, -1.08]);
    addPart(new THREE.BoxGeometry(1.12, 0.1, 0.11), metalMaterial, [0, 0.46, 0.79]);
    addPart(new THREE.BoxGeometry(0.62, 0.12, 0.035), trimMaterial, [0, 0.64, -1.065]);
    for (const x of [-0.39, 0.39]) {
      addPart(new THREE.BoxGeometry(0.17, 0.13, 0.045), headlightMaterial, [
        x,
        0.78,
        -1.065,
      ]);
      addPart(new THREE.BoxGeometry(0.14, 0.14, 0.04), tailLightMaterial, [x, 0.7, 0.745]);
      addPart(new THREE.BoxGeometry(0.13, 0.09, 0.62), bodyMaterial, [
        Math.sign(x) * 0.61,
        0.65,
        0.08,
      ]);
    }
    for (const x of [-0.7, 0.7]) {
      addPart(new THREE.BoxGeometry(0.12, 0.08, 0.86), trimMaterial, [x, 0.43, 0.09]);
    }

    const wheels: THREE.Mesh[] = [];
    for (const x of [-0.68, 0.68]) {
      for (const z of [-0.48, 0.5]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.18, 12),
          wheelMaterial,
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.31, z);
        wheel.castShadow = true;

        const hubcap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.195, 12),
          metalMaterial,
        );
        hubcap.castShadow = true;
        wheel.add(hubcap);

        wheels.push(wheel);
        root.add(wheel);
      }
    }

    // Roof rack, travel case, aerial, and rear spare make the car feel like a
    // purpose-built world traveller and are visible from the default high view.
    for (const x of [-0.37, 0.37]) {
      addPart(new THREE.BoxGeometry(0.055, 0.055, 0.72), trimMaterial, [x, 1.41, 0.12]);
    }
    for (const z of [-0.18, 0.4]) {
      addPart(new THREE.BoxGeometry(0.82, 0.045, 0.055), trimMaterial, [0, 1.42, z]);
    }
    addPart(new THREE.BoxGeometry(0.46, 0.17, 0.36), luggageMaterial, [
      -0.04,
      1.52,
      0.12,
    ]);
    addPart(new THREE.BoxGeometry(0.18, 0.04, 0.08), trimMaterial, [-0.04, 1.63, 0.12]);

    addPart(
      new THREE.TorusGeometry(0.19, 0.065, 7, 14),
      wheelMaterial,
      [0, 0.76, 0.82],
    );
    addPart(
      new THREE.CylinderGeometry(0.08, 0.08, 0.045, 12),
      creamMaterial,
      [0, 0.76, 0.825],
      [Math.PI / 2, 0, 0],
    );
    addPart(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6), trimMaterial, [
      0.4,
      1.56,
      0.36,
    ]);
    addPart(new THREE.SphereGeometry(0.035, 7, 5), bodyMaterial, [0.4, 1.78, 0.36]);

    const pontoons: THREE.Mesh[] = [];
    for (const x of [-0.76, 0.76]) {
      const pontoon = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.0, 4, 7), creamMaterial);
      pontoon.rotation.x = Math.PI / 2;
      pontoon.position.set(x, 0.3, 0.05);
      pontoon.scale.setScalar(0.08);
      pontoon.castShadow = true;
      pontoons.push(pontoon);
      root.add(pontoon);
    }

    const wake: THREE.Mesh[] = [];
    for (let index = 0; index < 3; index += 1) {
      const ripple = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.04, 5, 16, Math.PI),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = 0.08;
      ripple.visible = false;
      wake.push(ripple);
      root.add(ripple);
    }

    return { root, wheels, pontoons, wake, bodyMaterial };
  }

  /** Applies an unlocked paint colour to the travel car and boat hull. */
  setVehiclePaint(color: number): void {
    this.vehicle.bodyMaterial.color.setHex(color);
  }

  private buildVehicleTrail(): void {
    const geometry = new THREE.RingGeometry(0.12, 0.24, 10);
    geometry.rotateX(-Math.PI / 2);

    for (let index = 0; index < 32; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.renderOrder = 4;
      this.vehicleTrail.push({
        mesh,
        material,
        age: 0,
        lifetime: 0.6,
        velocityX: 0,
        velocityZ: 0,
        baseScale: 1,
      });
      this.root.add(mesh);
    }
  }

  private updateVehicleTrail(
    delta: number,
    position: { x: number; z: number },
    velocity: { x: number; z: number },
    heading: number,
    boatMode: boolean,
    cruiseFlow: number,
    overviewBlend: number,
  ): void {
    const speed = Math.hypot(velocity.x, velocity.z);
    const localFactor =
      1 - THREE.MathUtils.smoothstep(overviewBlend, 0.2, 0.55);

    if (
      this.previousVehicleBoatMode !== undefined &&
      this.previousVehicleBoatMode !== boatMode
    ) {
      for (let index = 0; index < 9; index += 1) {
        const angle = (index / 9) * Math.PI * 2;
        this.spawnVehicleTrailParticle(
          {
            x: position.x + Math.cos(angle) * 0.36,
            z: position.z + Math.sin(angle) * 0.36,
          },
          heading,
          boatMode,
          true,
          angle,
        );
      }
    }
    this.previousVehicleBoatMode = boatMode;

    if (localFactor > 0.05 && speed > 0.8) {
      const speedFactor = THREE.MathUtils.clamp(speed / 6.4, 0, 1);
      const interval = boatMode
        ? THREE.MathUtils.lerp(0.15, 0.075, speedFactor)
        : THREE.MathUtils.lerp(
            0.24,
            0.105,
            Math.max(speedFactor * 0.45, cruiseFlow),
          );
      this.vehicleTrailClock += delta;
      let spawnBudget = 3;
      while (this.vehicleTrailClock >= interval && spawnBudget > 0) {
        this.vehicleTrailClock -= interval;
        this.spawnVehicleTrailParticle(
          position,
          heading,
          boatMode,
          false,
        );
        spawnBudget -= 1;
      }
    } else {
      this.vehicleTrailClock = 0;
    }

    for (const particle of this.vehicleTrail) {
      if (!particle.mesh.visible) {
        continue;
      }
      particle.age += delta;
      const progress = particle.age / particle.lifetime;
      if (progress >= 1) {
        particle.mesh.visible = false;
        particle.material.opacity = 0;
        continue;
      }
      particle.mesh.position.x += particle.velocityX * delta;
      particle.mesh.position.z += particle.velocityZ * delta;
      const scale = particle.baseScale * (0.72 + progress * 1.55);
      particle.mesh.scale.setScalar(scale);
      particle.material.opacity =
        Math.sin(progress * Math.PI) *
        (particle.material.color.getHex() === 0xe7fbff ? 0.5 : 0.24) *
        localFactor;
    }
  }

  private spawnVehicleTrailParticle(
    position: { x: number; z: number },
    heading: number,
    boatMode: boolean,
    burst: boolean,
    burstAngle = 0,
  ): void {
    const particle =
      this.vehicleTrail[this.vehicleTrailCursor % this.vehicleTrail.length];
    this.vehicleTrailCursor += 1;

    const lateral = burst
      ? 0
      : (this.vehicleTrailCursor % 2 === 0 ? -1 : 1) * 0.24;
    const rearX = Math.sin(heading) * 0.88 + Math.cos(heading) * lateral;
    const rearZ = Math.cos(heading) * 0.88 - Math.sin(heading) * lateral;
    particle.mesh.position.set(
      position.x + (burst ? 0 : rearX),
      boatMode ? 0.115 : 0.49,
      position.z + (burst ? 0 : rearZ),
    );
    particle.mesh.visible = true;
    particle.mesh.scale.setScalar(0.7);
    particle.material.color.setHex(boatMode ? 0xe7fbff : 0xd6bd84);
    particle.material.opacity = 0;
    particle.age = 0;
    particle.lifetime = burst
      ? boatMode ? 0.72 : 0.52
      : boatMode ? 0.62 : 0.5;
    particle.baseScale = burst ? 1.35 : boatMode ? 0.85 : 0.65;
    particle.velocityX = burst ? Math.cos(burstAngle) * 1.15 : 0;
    particle.velocityZ = burst ? Math.sin(burstAngle) * 1.15 : 0;
  }

}

function createRiverRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  maximumHalfWidth: number,
  y: number,
): THREE.BufferGeometry {
  const segmentCount = Math.max(40, curve.points.length * 14);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const side = new THREE.Vector3();

  for (let index = 0; index <= segmentCount; index += 1) {
    const t = index / segmentCount;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    side.set(-tangent.z, 0, tangent.x).normalize();
    const downstreamGrowth = THREE.MathUtils.smoothstep(t, 0, 1);
    const halfWidth = maximumHalfWidth * THREE.MathUtils.lerp(0.5, 1.18, downstreamGrowth);

    positions.push(
      point.x + side.x * halfWidth,
      y,
      point.z + side.z * halfWidth,
      point.x - side.x * halfWidth,
      y,
      point.z - side.z * halfWidth,
    );
    uvs.push(0, t, 1, t);

    if (index < segmentCount) {
      const current = index * 2;
      indices.push(
        current,
        current + 2,
        current + 1,
        current + 2,
        current + 3,
        current + 1,
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function shortestAngleDelta(from: number, to: number): number {
  let difference = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (difference < -Math.PI) {
    difference += Math.PI * 2;
  }
  return difference;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
