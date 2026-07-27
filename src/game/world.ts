import * as THREE from "three";
import {
  MAP_SCALE,
  PHOTO_SPOTS,
  type CountryDefinition,
  type GeoPoint,
  type PhotoSpotDefinition,
  geoToWorld,
  worldToGeo,
} from "./data";
import {
  COUNTRY_ATLAS_BINDINGS,
  WORLD_COUNTRIES,
  getCountryContentForAtlas,
  getWorldCountryByName,
  getWorldCountryAtGeo,
  isGeoPointInWorldCountry,
  type WorldCountry,
} from "./world-map";
import { PropBatcher, type PropArchetypeId } from "./prop-kit";
import {
  getMapDimensions,
  getWorldTerrainMaterial,
  prepareWorldTerrainGeometry,
} from "./world-terrain";
import {
  createLandmarkStandee,
  updateLandmarkStandeeOverview,
  type LandmarkStandeeView,
} from "./landmark-standees";
import {
  REGIONAL_SPECIALTIES,
  type RegionalSpecialtyDefinition,
} from "./regional-specialties";
import {
  createRegionalSpecialtyStandee,
  updateRegionalSpecialtyStandeeOverview,
  type RegionalSpecialtyStandeeView,
} from "./regional-specialty-standees";
import { WorldLife } from "./world-life";

const RESERVED_MAP_MARKER_POSITIONS = [
  ...PHOTO_SPOTS.map((spot) => geoToWorld(spot.point)),
  ...REGIONAL_SPECIALTIES.map((specialty) => geoToWorld(specialty.point)),
];

interface VehicleView {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  pontoons: THREE.Mesh[];
  wake: THREE.Mesh[];
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

interface FieldPatchEffect {
  readonly x: number;
  readonly z: number;
  readonly size: number;
  readonly rotationY: number;
  readonly strips: {
    readonly mesh: THREE.Mesh;
    readonly baseY: number;
    readonly baseScaleZ: number;
  }[];
  waveTime: number;
  waveDirection: 1 | -1;
  cooldown: number;
}

const shared = {
  grassGeometry: new THREE.ConeGeometry(0.11, 0.3, 5),
  groundPatchGeometry: new THREE.DodecahedronGeometry(0.28, 0),
  fieldStripGeometry: new THREE.BoxGeometry(0.72, 0.055, 0.12),
  grassMaterial: new THREE.MeshStandardMaterial({ color: 0x55a95f, roughness: 0.98 }),
  grassLightMaterial: new THREE.MeshStandardMaterial({ color: 0x83bd67, roughness: 0.98 }),
  oliveMaterial: new THREE.MeshStandardMaterial({ color: 0x6f965c, roughness: 0.95 }),
  purpleMaterial: new THREE.MeshStandardMaterial({ color: 0x8c75bd, roughness: 0.9 }),
  sandLightMaterial: new THREE.MeshStandardMaterial({ color: 0xf2cb75, roughness: 1 }),
  fieldGreenMaterial: new THREE.MeshStandardMaterial({ color: 0x739c4f, roughness: 1 }),
  fieldGoldMaterial: new THREE.MeshStandardMaterial({ color: 0xc8a64e, roughness: 1 }),
  fieldSoilMaterial: new THREE.MeshStandardMaterial({ color: 0x8d6844, roughness: 1 }),
};

export class WorldView {
  readonly root = new THREE.Group();
  readonly vehicle: VehicleView;
  private readonly wavelets: THREE.Mesh[] = [];
  private readonly landmarkEffects: LandmarkEffect[] = [];
  private readonly landmarkStandees: LandmarkStandeeView[] = [];
  private readonly regionalSpecialtyStandees: RegionalSpecialtyStandeeView[] =
    [];
  private readonly props = new PropBatcher();
  private readonly life = new WorldLife();
  private readonly fieldPatches: FieldPatchEffect[] = [];
  private modeBlend = 0;

  constructor() {
    this.root.name = "Pocket Earth world";
    this.addBoard();
    this.addWorldCountries();
    this.addCountries();
    this.addGeographyFeatures();
    this.addOceanDetails();
    this.flushProps();
    this.vehicle = this.createVehicle();
    this.root.add(this.vehicle.root);
    this.root.add(this.life.root);
  }

  private flushProps(): void {
    for (const mesh of this.props.build()) {
      this.root.add(mesh);
    }
  }

  update(
    elapsed: number,
    delta: number,
    position: { x: number; z: number },
    velocity: { x: number; z: number },
    heading: number,
    boatMode: boolean,
    overviewBlend = 0,
  ): void {
    this.modeBlend += ((boatMode ? 1 : 0) - this.modeBlend) * (1 - Math.exp(-7 * delta));
    this.life.update(
      elapsed,
      delta,
      position.x,
      position.z,
      velocity,
      overviewBlend,
    );
    this.updateFieldPatches(delta, position, velocity, overviewBlend);
    this.vehicle.root.position.x = position.x;
    this.vehicle.root.position.z = position.z;
    this.vehicle.root.position.y = THREE.MathUtils.lerp(0.37, 0.09, this.modeBlend);
    this.vehicle.root.rotation.y = heading;
    this.vehicle.root.rotation.z = boatMode ? Math.sin(elapsed * 2.1) * 0.045 : 0;

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
      const pulse = (elapsed * 1.3 + index * 0.35) % 1;
      wake.position.z = 0.9 + pulse * 1.5;
      wake.scale.setScalar(0.4 + pulse);
      (wake.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * this.modeBlend * 0.5;
    }

    for (const [index, wavelet] of this.wavelets.entries()) {
      wavelet.position.y = 0.09 + Math.sin(elapsed * 1.2 + index) * 0.025;
      wavelet.rotation.z = Math.sin(elapsed * 0.3 + index) * 0.12;
    }

    for (const standee of this.landmarkStandees) {
      updateLandmarkStandeeOverview(standee, overviewBlend, elapsed);
    }

    for (const standee of this.regionalSpecialtyStandees) {
      updateRegionalSpecialtyStandeeOverview(
        standee,
        overviewBlend,
        elapsed,
      );
    }

    for (const effect of this.landmarkEffects) {
      const distance = Math.hypot(effect.anchorX - position.x, effect.anchorZ - position.z);
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
        color: 0x58bdd8,
        roughness: 0.62,
        metalness: 0.02,
      }),
    );
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

  private addCountries(): void {
    for (const { content: country, atlas } of COUNTRY_ATLAS_BINDINGS) {
      this.addScenery(country, atlas);
    }

    for (const spot of PHOTO_SPOTS) {
      this.addPhotoSpot(spot);
    }

    for (const specialty of REGIONAL_SPECIALTIES) {
      this.addRegionalSpecialty(specialty);
    }
  }

  private addScenery(
    country: CountryDefinition,
    atlas: WorldCountry,
  ): void {
    const random = mulberry32(hashString(country.id));
    const allBorderPoints = atlas.renderPolygons.flat();
    const longitudes = allBorderPoints.map((point) => point[0]);
    const latitudes = allBorderPoints.map((point) => point[1]);
    const minimumLongitude = Math.min(...longitudes);
    const maximumLongitude = Math.max(...longitudes);
    const minimumLatitude = Math.min(...latitudes);
    const maximumLatitude = Math.max(...latitudes);
    const geographicArea =
      (maximumLongitude - minimumLongitude) * (maximumLatitude - minimumLatitude);
    const lushBiome =
      country.scenery === "tropical" || country.scenery === "monsoon";
    const targetCount = THREE.MathUtils.clamp(
      Math.round(geographicArea * (lushBiome ? 0.23 : 0.18)),
      8,
      country.id === "russia" ? 56 : lushBiome ? 46 : 38,
    );
    let placed = 0;
    let attempts = 0;

    while (placed < targetCount && attempts < targetCount * 70) {
      attempts += 1;
      const point = [
        THREE.MathUtils.lerp(minimumLongitude, maximumLongitude, random()),
        THREE.MathUtils.lerp(minimumLatitude, maximumLatitude, random()),
      ] as const;

      if (!isGeoPointInWorldCountry(point, atlas)) {
        continue;
      }

      const cityDistance = Math.hypot(
        (point[0] - country.city.point[0]) * MAP_SCALE.x,
        (point[1] - country.city.point[1]) * MAP_SCALE.z,
      );
      if (cityDistance < 2.35) {
        continue;
      }

      const world = geoToWorld(point);
      const nearMapMarker = RESERVED_MAP_MARKER_POSITIONS.some(
        (marker) => Math.hypot(marker.x - world.x, marker.z - world.z) < 2.05,
      );
      if (nearMapMarker) {
        continue;
      }

      const size = 0.64 + random() * 0.38;
      const choice = random();
      const desert = isDesertPoint(country, point);

      if (desert && choice < 0.74) {
        this.addDune(world.x, world.z, size * 1.1);
      } else if (desert && choice < 0.91) {
        this.addDesertRock(world.x, world.z, size);
      } else if (desert) {
        this.addTree(world.x, world.z, size * 0.92, country);
      } else if (country.id === "france" && choice < 0.14) {
        this.addLavenderPatch(world.x, world.z, size);
      } else if (
        (country.scenery === "atlas" || country.scenery === "highland") &&
        choice < 0.38
      ) {
        this.addMountain(world.x, world.z, size, 0x886f55);
      } else if (
        (country.scenery === "tropical" || country.scenery === "monsoon") &&
        choice < 0.52
      ) {
        this.addTreeCluster(world.x, world.z, size, country, atlas, random);
      } else if (
        (country.scenery === "tropical" || country.scenery === "monsoon") &&
        choice < 0.68
      ) {
        this.addFieldPatch(world.x, world.z, size, country);
      } else if (
        (country.scenery === "tropical" || country.scenery === "monsoon") &&
        choice < 0.84
      ) {
        this.addMeadowPatch(world.x, world.z, size, true);
      } else if (
        (country.scenery === "green" || country.scenery === "atlantic") &&
        choice < 0.42
      ) {
        this.addTreeCluster(world.x, world.z, size, country, atlas, random);
      } else if (
        (country.scenery === "green" || country.scenery === "atlantic") &&
        choice < 0.58
      ) {
        this.addFieldPatch(world.x, world.z, size, country);
      } else if (
        (country.scenery === "green" || country.scenery === "atlantic") &&
        choice < 0.78
      ) {
        this.addMeadowPatch(world.x, world.z, size, true);
      } else if (country.scenery === "mediterranean" && choice < 0.34) {
        this.addTreeCluster(world.x, world.z, size, country, atlas, random);
      } else if (country.scenery === "mediterranean" && choice < 0.52) {
        this.addFieldPatch(world.x, world.z, size, country);
      } else if (country.scenery === "mediterranean" && choice < 0.72) {
        this.addMeadowPatch(world.x, world.z, size, false);
      } else if (country.scenery === "highland" && choice < 0.66) {
        this.addTreeCluster(world.x, world.z, size, country, atlas, random);
      } else if (country.scenery === "highland" && choice < 0.82) {
        this.addMeadowPatch(world.x, world.z, size, false);
      } else if (
        isEuropeanSceneryPoint(country, point) &&
        choice < 0.99
      ) {
        this.addEuropeanBackgroundDetail(world.x, world.z, size, country);
      } else {
        this.addBuilding(world.x, world.z, size, country);
      }
      placed += 1;
    }

    if (country.id === "spain" || country.id === "france") {
      const mountainPoints =
        country.id === "spain"
          ? ([
              [-0.8, 42.8],
              [0.25, 42.55],
              [1.25, 42.45],
            ] as const)
          : ([
              [-0.45, 43.15],
              [0.65, 43.0],
              [1.6, 42.7],
            ] as const);
      for (const point of mountainPoints) {
        const world = geoToWorld(point);
        this.addMountain(world.x, world.z, 1.25, 0x718b77);
      }
    }
  }

  private addRegionalSpecialty(
    specialty: RegionalSpecialtyDefinition,
  ): void {
    const world = geoToWorld(specialty.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.445, world.z);
    group.name = `${specialty.name} regional specialty`;

    const standee = createRegionalSpecialtyStandee(specialty);
    this.regionalSpecialtyStandees.push(standee);
    group.add(standee.root);
    this.root.add(group);
  }

  private addPhotoSpot(spot: PhotoSpotDefinition): void {
    const country = getCountryContentForAtlas(
      getWorldCountryByName(spot.atlasCountryName),
    );
    const accent = country?.accent ?? spot.accent ?? 0xc16f54;
    const world = geoToWorld(spot.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.445, world.z);
    group.name = `${spot.name} photo spot`;

    const standee = createLandmarkStandee(spot, accent);
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

    const alpinePoints = [
      [8.0, 45.8],
      [10.2, 46.1],
      [12.2, 46.2],
    ] as const;
    for (const point of alpinePoints) {
      const world = geoToWorld(point);
      this.addMountain(world.x, world.z, 1.15, 0x718b77);
    }

    const himalayanPoints = [
      [77.5, 31.0],
      [82.0, 29.5],
      [87.0, 28.5],
      [92.0, 28.0],
      [96.0, 28.4],
    ] as const;
    for (const point of himalayanPoints) {
      const world = geoToWorld(point);
      this.addMountain(world.x, world.z, 1.28, 0x7b8580);
    }

    const zagrosPoints = [
      [46.5, 36.0],
      [49.0, 33.5],
      [52.0, 30.5],
      [55.0, 28.0],
    ] as const;
    for (const point of zagrosPoints) {
      const world = geoToWorld(point);
      this.addMountain(world.x, world.z, 1.15, 0x9a7359);
    }
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

    return { root, wheels, pontoons, wake };
  }

  private addTree(x: number, z: number, size: number, country: CountryDefinition): void {
    this.props.place(treeArchetypeFor(country.scenery), {
      x,
      z,
      y: 0.445,
      size,
      rotationY: propRotation(x, z),
    });
  }

  private addTreeCluster(
    x: number,
    z: number,
    size: number,
    country: CountryDefinition,
    atlas: WorldCountry,
    random: () => number,
  ): void {
    const offsets = [
      [0, 0],
      [-0.3, 0.18],
      [0.28, -0.16],
    ] as const;

    for (const [index, [offsetX, offsetZ]] of offsets.entries()) {
      const treeX = x + offsetX * size;
      const treeZ = z + offsetZ * size;
      if (!isGeoPointInWorldCountry(worldToGeo(treeX, treeZ), atlas)) {
        continue;
      }
      const treeSize = size * (index === 0 ? 0.82 : 0.58 + random() * 0.16);
      this.addTree(treeX, treeZ, treeSize, country);
    }
  }

  private addBuilding(x: number, z: number, size: number, country: CountryDefinition): void {
    this.props.place(buildingArchetypeFor(country.scenery), {
      x,
      z,
      y: 0.445,
      size,
      rotationY: propRotation(x, z),
    });
  }

  private addEuropeanBackgroundDetail(
    x: number,
    z: number,
    size: number,
    country: CountryDefinition,
  ): void {
    if (country.scenery === "highland" || country.scenery === "atlas") {
      this.addMountain(x, z, size * 0.82, 0x7f806f);
      return;
    }

    this.addMeadowPatch(
      x,
      z,
      size,
      country.scenery === "green" || country.scenery === "atlantic",
    );
  }

  private addFieldPatch(
    x: number,
    z: number,
    size: number,
    country: CountryDefinition,
  ): void {
    const group = new THREE.Group();
    const strips: FieldPatchEffect["strips"] = [];
    const greenField =
      country.scenery === "green" ||
      country.scenery === "atlantic" ||
      country.scenery === "monsoon" ||
      country.scenery === "tropical";

    for (let row = 0; row < 5; row += 1) {
      const material =
        row % 3 === 0
          ? shared.fieldSoilMaterial
          : greenField
            ? shared.fieldGreenMaterial
            : shared.fieldGoldMaterial;
      const strip = new THREE.Mesh(shared.fieldStripGeometry, material);
      strip.position.set(0, 0.035 + (row % 2) * 0.004, (row - 2) * 0.14 * size);
      strip.scale.set(size * (0.9 + (row % 2) * 0.1), 1, size);
      strip.castShadow = true;
      strip.receiveShadow = true;
      group.add(strip);
      strips.push({
        mesh: strip,
        baseY: strip.position.y,
        baseScaleZ: strip.scale.z,
      });
    }

    group.position.set(x, 0.445, z);
    group.rotation.y = x * 0.13 + z * 0.17;
    this.root.add(group);
    this.fieldPatches.push({
      x,
      z,
      size,
      rotationY: group.rotation.y,
      strips,
      waveTime: -1,
      waveDirection: 1,
      cooldown: 0,
    });
  }

  /**
   * Field strips lift in sequence when the vehicle brushes past. This is a
   * purely visual response: it adds texture to driving without creating a
   * collectible, prompt, collision, or simulation rule.
   */
  private updateFieldPatches(
    delta: number,
    position: { x: number; z: number },
    velocity: { x: number; z: number },
    overviewBlend: number,
  ): void {
    const playerSpeed = Math.hypot(velocity.x, velocity.z);
    const localView = overviewBlend < 0.35;

    for (const field of this.fieldPatches) {
      field.cooldown = Math.max(0, field.cooldown - delta);
      if (field.waveTime >= 0) {
        field.waveTime += delta;
        for (let index = 0; index < field.strips.length; index += 1) {
          const strip = field.strips[index];
          const order =
            field.waveDirection === 1
              ? index
              : field.strips.length - 1 - index;
          const phase = field.waveTime * 5.5 - order * 0.42;
          const wave =
            phase > 0 && phase < Math.PI ? Math.sin(phase) : 0;
          strip.mesh.position.y = strip.baseY + wave * 0.13;
          strip.mesh.scale.z = strip.baseScaleZ * (1 + wave * 0.16);
        }
        if (field.waveTime > 1.75) {
          field.waveTime = -1;
          for (const strip of field.strips) {
            strip.mesh.position.y = strip.baseY;
            strip.mesh.scale.z = strip.baseScaleZ;
          }
        }
        continue;
      }

      if (!localView || playerSpeed < 0.8 || field.cooldown > 0) {
        continue;
      }
      const dx = position.x - field.x;
      const dz = position.z - field.z;
      if (Math.hypot(dx, dz) > Math.max(1.25, field.size * 1.55)) {
        continue;
      }

      const localZ =
        -Math.sin(field.rotationY) * dx + Math.cos(field.rotationY) * dz;
      field.waveDirection = localZ >= 0 ? -1 : 1;
      field.waveTime = 0;
      field.cooldown = 3.2;
    }
  }

  private addMeadowPatch(
    x: number,
    z: number,
    size: number,
    lush: boolean,
  ): void {
    const group = new THREE.Group();
    const patchMaterial = lush ? shared.grassMaterial : shared.oliveMaterial;
    const highlightMaterial = lush ? shared.grassLightMaterial : shared.sandLightMaterial;

    for (let index = 0; index < 3; index += 1) {
      const patch = new THREE.Mesh(
        shared.groundPatchGeometry,
        index === 1 ? highlightMaterial : patchMaterial,
      );
      patch.position.set((index - 1) * 0.28 * size, 0.04, (index % 2) * 0.17 * size);
      patch.scale.set(size * 0.9, size * 0.16, size * 0.62);
      patch.rotation.y = index * 0.72;
      patch.castShadow = true;
      group.add(patch);
    }

    for (const offset of [-0.19, 0.18]) {
      const grass = new THREE.Mesh(shared.grassGeometry, patchMaterial);
      grass.position.set(offset * size, 0.2 * size, -0.12 * size);
      grass.scale.setScalar(size * 0.82);
      grass.castShadow = true;
      group.add(grass);
    }

    group.position.set(x, 0.445, z);
    group.rotation.y = x * 0.17 + z * 0.11;
    this.root.add(group);
  }

  private addDune(x: number, z: number, size: number): void {
    const baseRotation = x * 0.09 + z * 0.13;
    for (let index = 0; index < 3; index += 1) {
      this.props.place("dune", {
        x: x + (index - 1) * 0.38 * size,
        z: z + (index % 2) * 0.3 * size,
        y: 0.44 + index * 0.025,
        size: size * (0.82 + index * 0.14),
        rotationY: baseRotation + index * 0.35,
      });
    }
  }

  private addDesertRock(x: number, z: number, size: number): void {
    this.props.place("rock", {
      x,
      z,
      y: 0.445,
      size,
      rotationY: propRotation(x, z),
    });
  }

  private addMountain(x: number, z: number, size: number, color: number): void {
    const mountain = new THREE.Mesh(
      sharedMountainGeometry(),
      sharedMountainMaterial(color),
    );
    mountain.position.set(x, 0.44 + 0.7 * size, z);
    mountain.scale.setScalar(size);
    mountain.rotation.y = x + z;
    mountain.castShadow = true;
    this.root.add(mountain);
  }

  private addLavenderPatch(x: number, z: number, size: number): void {
    const patch = new THREE.Mesh(
      new THREE.BoxGeometry(0.75 * size, 0.09, 0.36 * size),
      shared.purpleMaterial,
    );
    patch.position.set(x, 0.49, z);
    patch.rotation.y = x * 0.2;
    patch.castShadow = true;
    this.root.add(patch);
  }
}

type Scenery = CountryDefinition["scenery"];

const TREE_ARCHETYPES: Record<Scenery, PropArchetypeId> = {
  atlantic: "broadleaf",
  green: "broadleaf",
  mediterranean: "cypress",
  highland: "pine",
  atlas: "acacia",
  sahara: "acacia",
  monsoon: "palm",
  tropical: "palm",
};

const BUILDING_ARCHETYPES: Record<Scenery, PropArchetypeId> = {
  atlantic: "townhouse",
  green: "townhouse",
  mediterranean: "villa",
  highland: "chalet",
  atlas: "adobe",
  sahara: "adobe",
  monsoon: "villa",
  tropical: "villa",
};

function treeArchetypeFor(scenery: Scenery): PropArchetypeId {
  return TREE_ARCHETYPES[scenery];
}

function buildingArchetypeFor(scenery: Scenery): PropArchetypeId {
  return BUILDING_ARCHETYPES[scenery];
}

function propRotation(x: number, z: number): number {
  const value = Math.sin(x * 91.7 + z * 47.3) * 43758.5453;
  return (value - Math.floor(value)) * Math.PI * 2;
}

let mountainGeometry: THREE.ConeGeometry | undefined;
const mountainMaterials = new Map<number, THREE.MeshStandardMaterial>();

function sharedMountainGeometry(): THREE.ConeGeometry {
  if (!mountainGeometry) {
    mountainGeometry = new THREE.ConeGeometry(0.6, 1.4, 5);
  }
  return mountainGeometry;
}

function sharedMountainMaterial(color: number): THREE.MeshStandardMaterial {
  let material = mountainMaterials.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    mountainMaterials.set(color, material);
  }
  return material;
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

function isDesertPoint(country: CountryDefinition, point: GeoPoint): boolean {
  if (country.scenery === "sahara") {
    return !(
      country.id === "egypt" &&
      Math.abs(point[0] - 31.2) < 1.05 &&
      point[1] < 31.4
    );
  }

  if (country.scenery !== "atlas") {
    return false;
  }

  const desertLatitude =
    country.id === "morocco" ? 31.7 : country.id === "tunisia" ? 34.0 : 34.5;
  return point[1] < desertLatitude;
}

const EUROPEAN_SCENERY_COUNTRY_IDS: ReadonlySet<CountryDefinition["id"]> =
  new Set([
    "portugal",
    "spain",
    "france",
    "united-kingdom",
    "germany",
    "italy",
    "greece",
    "netherlands",
    "switzerland",
    "austria",
    "poland",
    "norway",
  ]);

function isEuropeanSceneryPoint(
  country: CountryDefinition,
  point: GeoPoint,
): boolean {
  if (EUROPEAN_SCENERY_COUNTRY_IDS.has(country.id)) {
    return true;
  }

  if (country.id === "russia") {
    return point[0] < 45;
  }

  if (country.id === "turkey") {
    return point[0] < 29.8 && point[1] > 40.4;
  }

  return false;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
