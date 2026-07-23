import * as THREE from "three";
import {
  MAP_BOUNDS,
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
}

const shared = {
  trunkGeometry: new THREE.CylinderGeometry(0.08, 0.11, 0.55, 6),
  treeGeometry: new THREE.DodecahedronGeometry(0.38, 0),
  palmGeometry: new THREE.ConeGeometry(0.38, 0.65, 6),
  grassGeometry: new THREE.ConeGeometry(0.11, 0.3, 5),
  groundPatchGeometry: new THREE.DodecahedronGeometry(0.28, 0),
  rockGeometry: new THREE.DodecahedronGeometry(0.32, 0),
  buildingGeometry: new THREE.BoxGeometry(0.55, 0.55, 0.55),
  fieldStripGeometry: new THREE.BoxGeometry(0.72, 0.055, 0.12),
  roofGeometry: new THREE.ConeGeometry(0.42, 0.3, 4),
  duneGeometry: new THREE.SphereGeometry(0.55, 7, 4),
  trunkMaterial: new THREE.MeshStandardMaterial({ color: 0x8b694d, roughness: 0.95 }),
  whiteMaterial: new THREE.MeshStandardMaterial({ color: 0xfff4d8, roughness: 0.9 }),
  roofMaterial: new THREE.MeshStandardMaterial({ color: 0xd46348, roughness: 0.9 }),
  greenMaterial: new THREE.MeshStandardMaterial({ color: 0x3c8c66, roughness: 0.95 }),
  grassMaterial: new THREE.MeshStandardMaterial({ color: 0x55a95f, roughness: 0.98 }),
  grassLightMaterial: new THREE.MeshStandardMaterial({ color: 0x83bd67, roughness: 0.98 }),
  jungleMaterial: new THREE.MeshStandardMaterial({ color: 0x22734b, roughness: 0.98 }),
  oliveMaterial: new THREE.MeshStandardMaterial({ color: 0x6f965c, roughness: 0.95 }),
  darkGreenMaterial: new THREE.MeshStandardMaterial({ color: 0x266c58, roughness: 0.95 }),
  orangeMaterial: new THREE.MeshStandardMaterial({ color: 0xef9446, roughness: 0.9 }),
  purpleMaterial: new THREE.MeshStandardMaterial({ color: 0x8c75bd, roughness: 0.9 }),
  sandMaterial: new THREE.MeshStandardMaterial({ color: 0xe8b96d, roughness: 1 }),
  sandLightMaterial: new THREE.MeshStandardMaterial({ color: 0xf2cb75, roughness: 1 }),
  desertRockMaterial: new THREE.MeshStandardMaterial({ color: 0xaa6841, roughness: 1 }),
  fieldGreenMaterial: new THREE.MeshStandardMaterial({ color: 0x739c4f, roughness: 1 }),
  fieldGoldMaterial: new THREE.MeshStandardMaterial({ color: 0xc8a64e, roughness: 1 }),
  fieldSoilMaterial: new THREE.MeshStandardMaterial({ color: 0x8d6844, roughness: 1 }),
};

export class WorldView {
  readonly root = new THREE.Group();
  readonly vehicle: VehicleView;
  private readonly wavelets: THREE.Mesh[] = [];
  private readonly landmarkEffects: LandmarkEffect[] = [];
  private modeBlend = 0;

  constructor() {
    this.root.name = "Pocket Earth world";
    this.addBoard();
    this.addWorldCountries();
    this.addCountries();
    this.addGeographyFeatures();
    this.addOceanDetails();
    this.vehicle = this.createVehicle();
    this.root.add(this.vehicle.root);
  }

  update(
    elapsed: number,
    delta: number,
    position: { x: number; z: number },
    heading: number,
    boatMode: boolean,
  ): void {
    this.modeBlend += ((boatMode ? 1 : 0) - this.modeBlend) * (1 - Math.exp(-7 * delta));
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

    for (const effect of this.landmarkEffects) {
      const distance = Math.hypot(effect.anchorX - position.x, effect.anchorZ - position.z);
      const strength = THREE.MathUtils.clamp((18 - distance) / 13, 0, 1);
      const acquire = THREE.MathUtils.smoothstep(strength, 0.03, 0.4);
      const focus = THREE.MathUtils.smoothstep(strength, 0.38, 0.9);
      const targetReveal = THREE.MathUtils.smoothstep(strength, 0.18, 0.72);
      effect.reveal +=
        (targetReveal - effect.reveal) * (1 - Math.exp(-4.8 * delta));

      const visible = acquire > 0.002;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.35 + effect.phase);
      effect.outerRing.visible = visible;
      effect.innerRing.visible = visible;
      effect.scanArc.visible = visible;
      effect.lightField.visible = visible;
      effect.marker.visible = visible;

      effect.outerRing.scale.setScalar(1.08 - effect.reveal * 0.08 + pulse * 0.015);
      effect.outerRing.rotation.z = elapsed * 0.08 + effect.phase;
      effect.outerRingMaterial.opacity = acquire * (0.1 + focus * 0.16);

      effect.innerRing.scale.setScalar(0.82 + effect.reveal * 0.18);
      effect.innerRing.rotation.z = -elapsed * 0.16 - effect.phase;
      effect.innerRingMaterial.opacity = effect.reveal * (0.07 + focus * 0.13);

      effect.scanArc.rotation.z = -elapsed * (0.54 + focus * 0.24) + effect.phase;
      effect.scanArcMaterial.opacity = effect.reveal * (0.1 + focus * 0.28);

      effect.lightField.scale.y = 0.72 + effect.reveal * 0.28;
      effect.lightFieldMaterial.opacity = effect.reveal * (0.018 + focus * 0.052);

      effect.marker.position.y =
        2.54 - effect.reveal * 0.24 +
        Math.sin(elapsed * 1.35 + effect.phase) * (0.045 + acquire * 0.035);
      effect.marker.rotation.y = elapsed * 0.42 + effect.phase;
      effect.marker.rotation.z = Math.sin(elapsed * 0.55 + effect.phase) * 0.08;
      effect.marker.scale.setScalar(0.58 + acquire * 0.24 + focus * 0.14);
      effect.markerMaterial.emissiveIntensity = 0.12 + focus * 0.5;
      effect.markerMaterial.opacity = 0.52 + acquire * 0.48;
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
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x52704f,
      roughness: 1,
    });

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
      applyWorldTerrainUvs(geometry);

      const land = new THREE.Mesh(geometry, [terrainMaterial, edgeMaterial]);
      land.position.y = 0.02;
      land.receiveShadow = true;
      land.castShadow = true;
      land.name = `${country.name} natural terrain`;
      this.root.add(land);

      this.addWorldCountryBorder(country);
    }
  }

  private addWorldCountryBorder(country: WorldCountry): void {
    const material = new THREE.LineBasicMaterial({
      color: 0xfff9e8,
      transparent: true,
      opacity: 0.72,
    });

    for (const polygon of country.renderPolygons) {
      if (polygon.length < 3) {
        continue;
      }

      const positions: number[] = [];
      for (const point of polygon) {
        const world = geoToWorld(point);
        positions.push(world.x, 0.458, world.z);
      }

      const first = geoToWorld(polygon[0]);
      positions.push(first.x, 0.458, first.z);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      this.root.add(new THREE.Line(geometry, material));
    }
  }

  private addCountries(): void {
    for (const { content: country, atlas } of COUNTRY_ATLAS_BINDINGS) {
      this.addScenery(country, atlas);
    }

    for (const spot of PHOTO_SPOTS) {
      this.addPhotoSpot(spot);
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

  private addPhotoSpot(spot: PhotoSpotDefinition): void {
    const country = getCountryContentForAtlas(
      getWorldCountryByName(spot.atlasCountryName),
    );
    const accent = country?.accent ?? spot.accent ?? 0xc16f54;
    const world = geoToWorld(spot.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.445, world.z);
    group.name = `${spot.name} photo spot`;

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.76,
      flatShading: true,
    });
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3dfb8,
      roughness: 0.88,
      flatShading: true,
    });

    if (spot.id === "gibraltar-strait") {
      const europeanCliff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.52, 0),
        shared.greenMaterial,
      );
      europeanCliff.scale.set(1.15, 0.5, 0.62);
      europeanCliff.position.set(-0.45, 0.24, -0.58);
      const africanCliff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.5, 0),
        shared.sandMaterial,
      );
      africanCliff.scale.set(1.1, 0.48, 0.6);
      africanCliff.position.set(0.42, 0.22, 0.58);
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.72, 7),
        baseMaterial,
      );
      beacon.position.set(-0.65, 0.72, -0.52);
      const beaconCap = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.22, 7),
        accentMaterial,
      );
      beaconCap.position.set(-0.65, 1.18, -0.52);
      group.add(europeanCliff, africanCliff, beacon, beaconCap);
    } else if (spot.id === "big-ben") {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.55, 0.48), baseMaterial);
      tower.position.y = 0.78;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 4), accentMaterial);
      cap.position.y = 1.78;
      cap.rotation.y = Math.PI / 4;
      const clock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12),
        accentMaterial,
      );
      clock.rotation.x = Math.PI / 2;
      clock.position.set(0, 1.15, -0.26);
      group.add(tower, cap, clock);
      const bus = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.55, 0.34), accentMaterial);
      bus.position.set(0.62, 0.3, 0.35);
      group.add(bus);
    } else if (spot.id === "brandenburg-gate") {
      for (let index = 0; index < 4; index += 1) {
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.12, 0.9, 7),
          baseMaterial,
        );
        column.position.set(-0.55 + index * 0.36, 0.45, 0);
        group.add(column);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.24, 0.38), accentMaterial);
      lintel.position.y = 0.98;
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.32), baseMaterial);
      top.position.y = 1.2;
      group.add(lintel, top);
    } else if (spot.id === "colosseum") {
      const arena = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.8, 0.58, 12, 1, true),
        baseMaterial,
      );
      arena.position.y = 0.34;
      arena.scale.z = 0.7;
      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.09, 5, 12),
        accentMaterial,
      );
      inner.rotation.x = Math.PI / 2;
      inner.position.y = 0.68;
      group.add(arena, inner);
    } else if (spot.id === "acropolis") {
      for (let index = 0; index < 4; index += 1) {
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.82, 7),
          baseMaterial,
        );
        column.position.set(-0.48 + index * 0.32, 0.42, 0);
        group.add(column);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.38), accentMaterial);
      lintel.position.y = 0.92;
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 3), baseMaterial);
      pediment.rotation.z = Math.PI / 2;
      pediment.position.y = 1.2;
      group.add(lintel, pediment);
    } else if (spot.id === "giza-pyramids") {
      const pyramid = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.25, 4), accentMaterial);
      pyramid.position.set(-0.22, 0.63, 0);
      pyramid.rotation.y = Math.PI / 4;
      const smallerPyramid = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 0.78, 4),
        baseMaterial,
      );
      smallerPyramid.position.set(0.68, 0.4, 0.25);
      smallerPyramid.rotation.y = Math.PI / 4;
      group.add(pyramid, smallerPyramid);
    } else if (spot.id === "hagia-sophia") {
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.65), baseMaterial);
      hall.position.y = 0.28;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        accentMaterial,
      );
      dome.position.y = 0.56;
      group.add(hall, dome);
      for (const x of [-0.68, 0.68]) {
        const minaret = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.1, 1.25, 7),
          baseMaterial,
        );
        minaret.position.set(x, 0.63, 0);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 7), accentMaterial);
        cap.position.set(x, 1.4, 0);
        group.add(minaret, cap);
      }
    } else if (spot.id === "great-wall") {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.48, 0.5), baseMaterial);
      wall.position.y = 0.25;
      group.add(wall);
      for (const x of [-0.48, 0.48]) {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.75, 0.46), accentMaterial);
        tower.position.set(x, 0.56, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 4), accentMaterial);
        roof.position.set(x, 1.08, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(tower, roof);
      }
    } else if (spot.id === "fuji-view") {
      const mountainMaterial = new THREE.MeshStandardMaterial({
        color: 0x5f8878,
        roughness: 0.95,
      });
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.65, 8), mountainMaterial);
      peak.position.y = 0.82;
      const snow = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.52, 8), baseMaterial);
      snow.position.y = 1.52;
      group.add(peak, snow);
    } else if (spot.id === "taj-mahal") {
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.58, 0.75), baseMaterial);
      hall.position.y = 0.3;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        accentMaterial,
      );
      dome.position.y = 0.6;
      group.add(hall, dome);
      for (const x of [-0.7, 0.7]) {
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.1, 1.15, 7),
          baseMaterial,
        );
        tower.position.set(x, 0.58, 0);
        group.add(tower);
      }
    } else if (spot.id === "java-volcano") {
      for (const x of [-0.48, 0.48]) {
        const gate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.46), baseMaterial);
        gate.position.set(x, 0.55, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 4), accentMaterial);
        roof.position.set(x, 1.18, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(gate, roof);
      }
      const volcano = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 7), accentMaterial);
      volcano.position.set(0, 0.4, 0.55);
      group.add(volcano);
    } else if (spot.id === "swiss-alps") {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.45, 5), baseMaterial);
      peak.position.set(-0.25, 0.72, 0.15);
      const train = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.34, 0.38), accentMaterial);
      train.position.set(0.45, 0.28, -0.35);
      group.add(peak, train);
    } else if (spot.id === "norway-fjord") {
      const lighthouse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.3, 1.35, 8),
        baseMaterial,
      );
      lighthouse.position.set(-0.35, 0.68, 0);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 8), accentMaterial);
      cap.position.set(-0.35, 1.52, 0);
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 6), accentMaterial);
      peak.position.set(0.5, 0.55, 0.25);
      group.add(lighthouse, cap, peak);
    } else if (spot.id === "moscow-domes") {
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 0.62), baseMaterial);
      hall.position.y = 0.32;
      group.add(hall);
      for (const [index, x] of [-0.5, 0, 0.5].entries()) {
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.18, 0.55 + index * 0.12, 8),
          baseMaterial,
        );
        tower.position.set(x, 0.83 + index * 0.06, 0);
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 6),
          index === 1 ? accentMaterial : baseMaterial,
        );
        dome.scale.y = 1.35;
        dome.position.set(x, 1.2 + index * 0.12, 0);
        group.add(tower, dome);
      }
    } else if (
      this.addWorldLandmarkModel(
        group,
        spot.id,
        baseMaterial,
        accentMaterial,
      )
    ) {
      // The first expansion batch uses dedicated silhouettes below.
    } else {
      for (let index = 0; index < 4; index += 1) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.42 + index * 0.2, 0.45),
          index === 2 ? accentMaterial : baseMaterial,
        );
        block.position.set(-0.7 + index * 0.46, block.geometry.parameters.height / 2, 0);
        group.add(block);
      }
      this.addTreeToGroup(group, 0.45, 0.45, 1.05, shared.darkGreenMaterial);
    }

    for (const child of [...group.children]) {
      if (child instanceof THREE.Mesh) {
        child.position.y += 0.14;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    }
    this.addLandmarkPresentation(group, accent, world);
    group.scale.setScalar(1.08);
    this.root.add(group);
  }

  private addWorldLandmarkModel(
    group: THREE.Group,
    id: PhotoSpotDefinition["id"],
    baseMaterial: THREE.Material,
    accentMaterial: THREE.Material,
  ): boolean {
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x9d8267,
      roughness: 0.95,
      flatShading: true,
    });
    const redRockMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8674f,
      roughness: 0.96,
      flatShading: true,
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f4e50,
      roughness: 0.8,
      metalness: 0.12,
      flatShading: true,
    });
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4eb1ca,
      roughness: 0.34,
      transparent: true,
      opacity: 0.82,
      flatShading: true,
    });
    const vegetationMaterial = new THREE.MeshStandardMaterial({
      color: 0x5e8060,
      roughness: 0.96,
      flatShading: true,
    });

    switch (id) {
      case "eiffel-tower": {
        for (const x of [-0.42, 0.42]) {
          for (const z of [-0.32, 0.32]) {
            const leg = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 1.62, 0.12),
              darkMaterial,
            );
            leg.position.set(x * 0.54, 0.78, z * 0.54);
            leg.rotation.z = x > 0 ? -0.24 : 0.24;
            leg.rotation.x = z > 0 ? 0.18 : -0.18;
            group.add(leg);
          }
        }
        const lowerDeck = new THREE.Mesh(
          new THREE.BoxGeometry(0.82, 0.12, 0.66),
          accentMaterial,
        );
        lowerDeck.position.y = 0.68;
        const upperDeck = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.1, 0.35),
          accentMaterial,
        );
        upperDeck.position.y = 1.28;
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.13, 0.68, 6),
          darkMaterial,
        );
        mast.position.y = 1.64;
        const antenna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.025, 0.44, 5),
          accentMaterial,
        );
        antenna.position.y = 2.18;
        group.add(lowerDeck, upperDeck, mast, antenna);
        return true;
      }
      case "statue-of-liberty": {
        const pedestal = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.68, 0.62),
          stoneMaterial,
        );
        pedestal.position.y = 0.34;
        const robe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.34, 0.92, 7),
          accentMaterial,
        );
        robe.position.y = 1.12;
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 6),
          accentMaterial,
        );
        head.position.y = 1.72;
        const raisedArm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.075, 0.78, 6),
          accentMaterial,
        );
        raisedArm.position.set(0.22, 1.88, 0);
        raisedArm.rotation.z = -0.25;
        const torch = new THREE.Mesh(
          new THREE.ConeGeometry(0.13, 0.28, 7),
          new THREE.MeshStandardMaterial({
            color: 0xf3b94e,
            emissive: 0xc87a24,
            emissiveIntensity: 0.35,
            roughness: 0.5,
          }),
        );
        torch.position.set(0.32, 2.33, 0);
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 0.22, 7),
          accentMaterial,
        );
        crown.position.y = 1.9;
        group.add(pedestal, robe, head, raisedArm, torch, crown);
        return true;
      }
      case "machu-picchu": {
        for (let level = 0; level < 4; level += 1) {
          const terrace = new THREE.Mesh(
            new THREE.BoxGeometry(1.55 - level * 0.24, 0.16, 0.9 - level * 0.1),
            level % 2 === 0 ? vegetationMaterial : stoneMaterial,
          );
          terrace.position.set(-0.1, 0.08 + level * 0.16, 0.08);
          group.add(terrace);
        }
        for (const [x, z] of [
          [-0.5, -0.08],
          [-0.12, 0.08],
          [0.3, -0.02],
        ] as const) {
          const ruin = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.24),
            stoneMaterial,
          );
          ruin.position.set(x, 0.78, z);
          group.add(ruin);
        }
        const mountain = new THREE.Mesh(
          new THREE.ConeGeometry(0.62, 1.45, 6),
          vegetationMaterial,
        );
        mountain.position.set(0.62, 0.72, 0.48);
        mountain.rotation.z = -0.14;
        group.add(mountain);
        return true;
      }
      case "christ-the-redeemer": {
        const mountain = new THREE.Mesh(
          new THREE.ConeGeometry(0.92, 0.9, 8),
          vegetationMaterial,
        );
        mountain.position.y = 0.45;
        const pedestal = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.36, 0.34),
          stoneMaterial,
        );
        pedestal.position.y = 0.96;
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.28, 0.8, 7),
          baseMaterial,
        );
        body.position.y = 1.48;
        const arms = new THREE.Mesh(
          new THREE.BoxGeometry(1.36, 0.16, 0.2),
          baseMaterial,
        );
        arms.position.y = 1.76;
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 8, 6),
          baseMaterial,
        );
        head.position.y = 2.02;
        group.add(mountain, pedestal, body, arms, head);
        return true;
      }
      case "chichen-itza": {
        for (let level = 0; level < 7; level += 1) {
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(1.5 - level * 0.16, 0.14, 1.28 - level * 0.14),
            level % 2 === 0 ? stoneMaterial : baseMaterial,
          );
          step.position.y = 0.07 + level * 0.14;
          group.add(step);
        }
        const staircase = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 1.0, 0.82),
          baseMaterial,
        );
        staircase.position.set(0, 0.52, -0.4);
        staircase.rotation.x = -0.42;
        const temple = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.36, 0.46),
          accentMaterial,
        );
        temple.position.y = 1.18;
        group.add(staircase, temple);
        return true;
      }
      case "petra": {
        for (const x of [-0.88, 0.88]) {
          const cliff = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.76, 0),
            redRockMaterial,
          );
          cliff.scale.set(0.75, 1.45, 0.72);
          cliff.position.set(x, 0.75, 0.16);
          group.add(cliff);
        }
        const facade = new THREE.Mesh(
          new THREE.BoxGeometry(1.05, 1.15, 0.2),
          redRockMaterial,
        );
        facade.position.set(0, 0.72, -0.34);
        group.add(facade);
        for (const x of [-0.36, -0.12, 0.12, 0.36]) {
          const column = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.07, 0.72, 6),
            baseMaterial,
          );
          column.position.set(x, 0.74, -0.48);
          group.add(column);
        }
        const pediment = new THREE.Mesh(
          new THREE.ConeGeometry(0.48, 0.32, 3),
          baseMaterial,
        );
        pediment.rotation.z = Math.PI / 2;
        pediment.position.set(0, 1.26, -0.49);
        const urn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.13, 0.3, 7),
          accentMaterial,
        );
        urn.position.set(0, 1.62, -0.48);
        group.add(pediment, urn);
        return true;
      }
      case "angkor-wat": {
        const causeway = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.08, 1.65),
          stoneMaterial,
        );
        causeway.position.set(0, 0.08, -0.22);
        const templeBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.42, 0.34, 0.88),
          stoneMaterial,
        );
        templeBase.position.set(0, 0.28, 0.28);
        group.add(causeway, templeBase);
        for (const [x, z, height] of [
          [-0.48, 0.16, 0.76],
          [0.48, 0.16, 0.76],
          [-0.38, 0.52, 0.7],
          [0.38, 0.52, 0.7],
          [0, 0.36, 1.18],
        ] as const) {
          const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.2, height, 6),
            accentMaterial,
          );
          tower.position.set(x, 0.54 + height / 2, z);
          const bud = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.36, 6),
            accentMaterial,
          );
          bud.position.set(x, 0.72 + height, z);
          group.add(tower, bud);
        }
        return true;
      }
      case "sydney-opera-house": {
        const podium = new THREE.Mesh(
          new THREE.BoxGeometry(1.58, 0.24, 0.92),
          stoneMaterial,
        );
        podium.position.y = 0.16;
        group.add(podium);
        for (const [x, scale, tilt] of [
          [-0.64, 0.72, 0.22],
          [-0.22, 1, 0.1],
          [0.24, 0.88, -0.08],
          [0.62, 0.64, -0.18],
        ] as const) {
          const shell = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 1.12, 10, 1, false, 0, Math.PI),
            baseMaterial,
          );
          shell.scale.set(scale, scale, 0.62);
          shell.rotation.z = tilt;
          shell.rotation.y = -0.18;
          shell.position.set(x, 0.38 + 0.54 * scale, 0);
          group.add(shell);
        }
        return true;
      }
      case "grand-canyon": {
        for (const side of [-1, 1]) {
          for (let level = 0; level < 3; level += 1) {
            const bank = new THREE.Mesh(
              new THREE.BoxGeometry(0.62 + level * 0.18, 0.22, 1.55),
              level === 1 ? stoneMaterial : redRockMaterial,
            );
            bank.position.set(
              side * (0.52 + level * 0.11),
              0.12 + level * 0.22,
              level * 0.06,
            );
            group.add(bank);
          }
        }
        const river = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.05, 1.58),
          waterMaterial,
        );
        river.position.y = 0.08;
        river.rotation.y = 0.12;
        group.add(river);
        return true;
      }
      case "mount-everest": {
        for (const [x, z, radius, height] of [
          [-0.65, 0.28, 0.48, 1.05],
          [0.62, 0.34, 0.5, 1.2],
          [0, 0, 0.72, 2.05],
        ] as const) {
          const peak = new THREE.Mesh(
            new THREE.ConeGeometry(radius, height, 6),
            darkMaterial,
          );
          peak.position.set(x, height / 2, z);
          const snow = new THREE.Mesh(
            new THREE.ConeGeometry(radius * 0.45, height * 0.38, 6),
            baseMaterial,
          );
          snow.position.set(x, height * 0.82, z);
          group.add(peak, snow);
        }
        const glacier = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.06, 1.25),
          baseMaterial,
        );
        glacier.position.set(0.2, 0.18, -0.26);
        glacier.rotation.y = -0.28;
        group.add(glacier);
        return true;
      }
      case "niagara-falls": {
        const fall = new THREE.Mesh(
          new THREE.BoxGeometry(1.48, 0.88, 0.12),
          waterMaterial,
        );
        fall.position.set(0, 0.62, 0.18);
        const crest = new THREE.Mesh(
          new THREE.TorusGeometry(0.64, 0.1, 6, 24, Math.PI),
          waterMaterial,
        );
        crest.rotation.x = Math.PI / 2;
        crest.position.set(0, 1.08, 0.18);
        const riverApproach = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.06, 1.0),
          waterMaterial,
        );
        riverApproach.position.set(0, 1.04, -0.34);
        group.add(fall, crest, riverApproach);
        for (const x of [-0.88, 0.88]) {
          const cliff = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.42, 0),
            redRockMaterial,
          );
          cliff.scale.set(0.8, 1.3, 0.72);
          cliff.position.set(x, 0.56, 0.2);
          group.add(cliff);
        }
        for (const x of [-0.45, 0, 0.45]) {
          const mist = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 8, 5),
            new THREE.MeshBasicMaterial({
              color: 0xe8fbff,
              transparent: true,
              opacity: 0.48,
              depthWrite: false,
            }),
          );
          mist.scale.y = 0.5;
          mist.position.set(x, 0.24, 0.5);
          group.add(mist);
        }
        return true;
      }
      case "easter-island-moai": {
        const ahu = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.2, 0.48),
          stoneMaterial,
        );
        ahu.position.y = 0.12;
        group.add(ahu);
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.42, 0.12);
        const headGeometry = new THREE.DodecahedronGeometry(0.11, 0);
        for (let index = 0; index < 15; index += 1) {
          const x = -0.84 + index * 0.12;
          const variation = 0.9 + (index % 4) * 0.04;
          const body = new THREE.Mesh(bodyGeometry, darkMaterial);
          body.scale.y = variation;
          body.position.set(x, 0.42, 0);
          const head = new THREE.Mesh(headGeometry, stoneMaterial);
          head.scale.set(0.75, 1.45 + (index % 3) * 0.08, 0.72);
          head.position.set(x, 0.72 + (variation - 0.9) * 0.16, -0.01);
          group.add(body, head);
        }
        return true;
      }
      default:
        return false;
    }
  }

  private addLandmarkPresentation(
    group: THREE.Group,
    accent: THREE.ColorRepresentation,
    world: { x: number; z: number },
  ): void {
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x5f796d,
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
        color: 0xf0ddae,
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

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.48, 1.55), bodyMaterial);
    body.position.y = 0.58;
    body.castShadow = true;
    root.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.78), creamMaterial);
    cabin.position.set(0, 0.98, 0.05);
    cabin.castShadow = true;
    root.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.25, 0.06), glassMaterial);
    windshield.position.set(0, 1.0, -0.37);
    windshield.rotation.x = -0.12;
    root.add(windshield);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.38, 6), creamMaterial);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0.55, -0.92);
    root.add(nose);

    const wheels: THREE.Mesh[] = [];
    for (const x of [-0.68, 0.68]) {
      for (const z of [-0.48, 0.5]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 10), wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.31, z);
        wheel.castShadow = true;
        wheels.push(wheel);
        root.add(wheel);
      }
    }

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
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(shared.trunkGeometry, shared.trunkMaterial);
    trunk.position.y = 0.28 * size;
    trunk.scale.setScalar(size);
    group.add(trunk);

    if (country.scenery === "sahara" || country.scenery === "atlas") {
      trunk.position.y = 0.44 * size;
      trunk.scale.set(size * 0.78, size * 1.55, size * 0.78);
      for (const [index, offset] of [
        [0, 0],
        [-0.23, 0.03],
        [0.23, -0.03],
      ].entries()) {
        const crown = new THREE.Mesh(shared.groundPatchGeometry, shared.darkGreenMaterial);
        crown.position.set(offset[0] * size, (0.93 + index * 0.04) * size, offset[1] * size);
        crown.scale.set(size * 1.05, size * 0.38, size * 0.8);
        group.add(crown);
      }
    } else if (country.scenery === "highland") {
      const lowerCrown = new THREE.Mesh(shared.palmGeometry, shared.darkGreenMaterial);
      lowerCrown.position.y = 0.72 * size;
      lowerCrown.scale.set(size * 1.05, size * 1.05, size * 1.05);
      const upperCrown = new THREE.Mesh(shared.palmGeometry, shared.greenMaterial);
      upperCrown.position.y = 1.02 * size;
      upperCrown.scale.set(size * 0.72, size * 0.82, size * 0.72);
      group.add(lowerCrown, upperCrown);
    } else if (country.scenery === "tropical" || country.scenery === "monsoon") {
      const mainCrown = new THREE.Mesh(shared.treeGeometry, shared.jungleMaterial);
      mainCrown.position.y = 0.8 * size;
      mainCrown.scale.set(size * 1.1, size * 0.92, size * 1.05);
      const leftTrunk = new THREE.Mesh(shared.trunkGeometry, shared.trunkMaterial);
      leftTrunk.position.set(-0.31 * size, 0.22 * size, 0.08 * size);
      leftTrunk.scale.setScalar(size * 0.72);
      const rightTrunk = new THREE.Mesh(shared.trunkGeometry, shared.trunkMaterial);
      rightTrunk.position.set(0.3 * size, 0.23 * size, -0.07 * size);
      rightTrunk.scale.setScalar(size * 0.76);
      const leftCrown = new THREE.Mesh(shared.groundPatchGeometry, shared.greenMaterial);
      leftCrown.position.set(-0.31 * size, 0.62 * size, 0.08 * size);
      leftCrown.scale.setScalar(size * 1.08);
      const rightCrown = new THREE.Mesh(shared.groundPatchGeometry, shared.grassLightMaterial);
      rightCrown.position.set(0.3 * size, 0.65 * size, -0.07 * size);
      rightCrown.scale.setScalar(size * 0.94);
      group.add(mainCrown, leftTrunk, rightTrunk, leftCrown, rightCrown);
    } else {
      const foliageMaterial =
        country.scenery === "mediterranean" ? shared.oliveMaterial : shared.greenMaterial;
      const crown = new THREE.Mesh(shared.treeGeometry, foliageMaterial);
      crown.position.y = 0.78 * size;
      crown.scale.set(
        size * (country.scenery === "mediterranean" ? 1.15 : 1),
        size * (country.scenery === "mediterranean" ? 0.72 : 1),
        size,
      );
      group.add(crown);
    }

    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    }
    group.position.set(x, 0.445, z);
    this.root.add(group);
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

  private addTreeToGroup(
    group: THREE.Group,
    x: number,
    z: number,
    size: number,
    material: THREE.Material,
  ): void {
    const trunk = new THREE.Mesh(shared.trunkGeometry, shared.trunkMaterial);
    trunk.position.set(x, 0.28 * size, z);
    trunk.scale.setScalar(size);
    const crown = new THREE.Mesh(shared.treeGeometry, material);
    crown.position.set(x, 0.78 * size, z);
    crown.scale.setScalar(size);
    group.add(trunk, crown);
  }

  private addBuilding(x: number, z: number, size: number, country: CountryDefinition): void {
    const group = new THREE.Group();
    const building = new THREE.Mesh(
      shared.buildingGeometry,
      country.scenery === "sahara" || country.scenery === "atlas"
        ? shared.whiteMaterial
        : shared.whiteMaterial,
    );
    building.scale.set(size, size * (0.8 + size * 0.45), size);
    building.position.y = 0.28 * building.scale.y;
    building.castShadow = true;
    group.add(building);

    if (country.scenery !== "sahara" && country.scenery !== "atlas") {
      const roof = new THREE.Mesh(shared.roofGeometry, shared.roofMaterial);
      roof.scale.setScalar(size);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = building.position.y * 2 + 0.15 * size;
      roof.castShadow = true;
      group.add(roof);
    }

    group.position.set(x, 0.445, z);
    this.root.add(group);
  }

  private addFieldPatch(
    x: number,
    z: number,
    size: number,
    country: CountryDefinition,
  ): void {
    const group = new THREE.Group();
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
    }

    group.position.set(x, 0.445, z);
    group.rotation.y = x * 0.13 + z * 0.17;
    this.root.add(group);
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
    const group = new THREE.Group();
    for (let index = 0; index < 3; index += 1) {
      const dune = new THREE.Mesh(
        shared.duneGeometry,
        index === 1 ? shared.sandLightMaterial : shared.sandMaterial,
      );
      dune.scale.set(
        size * (0.78 + index * 0.18),
        size * (0.2 + index * 0.035),
        size * (0.42 + (2 - index) * 0.08),
      );
      dune.position.set((index - 1) * 0.38 * size, index * 0.025, (index % 2) * 0.3 * size);
      dune.castShadow = true;
      group.add(dune);
    }
    group.position.set(x, 0.44, z);
    group.rotation.y = x * 0.09 + z * 0.13;
    this.root.add(group);
  }

  private addDesertRock(x: number, z: number, size: number): void {
    const group = new THREE.Group();
    for (let index = 0; index < 2; index += 1) {
      const rock = new THREE.Mesh(shared.rockGeometry, shared.desertRockMaterial);
      const rockSize = size * (0.48 + index * 0.2);
      rock.scale.set(rockSize, rockSize * (0.7 + index * 0.25), rockSize * 0.82);
      rock.position.set((index - 0.5) * 0.42 * size, 0.16 * size, index * 0.12 * size);
      rock.rotation.y = index * 0.9 + x;
      rock.castShadow = true;
      group.add(rock);
    }
    group.position.set(x, 0.445, z);
    this.root.add(group);
  }

  private addMountain(x: number, z: number, size: number, color: number): void {
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(0.6 * size, 1.4 * size, 5),
      new THREE.MeshStandardMaterial({ color, roughness: 1 }),
    );
    mountain.position.set(x, 0.44 + 0.7 * size, z);
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

type Rgb = readonly [red: number, green: number, blue: number];

const WORLD_TERRAIN_TEXTURE_SIZE = 1536;
let worldTerrainMaterial: THREE.MeshStandardMaterial | undefined;

function getWorldTerrainMaterial(): THREE.MeshStandardMaterial {
  if (worldTerrainMaterial) {
    return worldTerrainMaterial;
  }

  const texture = createWorldTerrainTexture();
  worldTerrainMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.96,
    metalness: 0,
  });
  return worldTerrainMaterial;
}

function createWorldTerrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_TERRAIN_TEXTURE_SIZE;
  canvas.height = WORLD_TERRAIN_TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create world terrain texture");
  }

  const image = context.createImageData(canvas.width, canvas.height);
  const longitudes = Array.from(
    { length: canvas.width },
    (_, x) =>
      MAP_BOUNDS.minLongitude +
      (x / (canvas.width - 1)) *
        (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude),
  );
  const northWest = geoToWorld([
    MAP_BOUNDS.minLongitude,
    MAP_BOUNDS.maxLatitude,
  ]);
  const southEast = geoToWorld([
    MAP_BOUNDS.maxLongitude,
    MAP_BOUNDS.minLatitude,
  ]);
  const latitudes = Array.from({ length: canvas.height }, (_, y) => {
    const z = THREE.MathUtils.lerp(
      northWest.z,
      southEast.z,
      y / (canvas.height - 1),
    );
    return worldToGeo(0, z)[1];
  });

  for (let y = 0; y < canvas.height; y += 1) {
    const latitude = latitudes[y];
    for (let x = 0; x < canvas.width; x += 1) {
      const longitude = longitudes[x];
      const color = getNaturalTerrainColor(longitude, latitude);
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function getNaturalTerrainColor(longitude: number, latitude: number): Rgb {
  const absoluteLatitude = Math.abs(latitude);
  const broadNoise = fractalNoise(longitude * 0.055, latitude * 0.07, 17);
  const detailNoise = fractalNoise(longitude * 0.22, latitude * 0.25, 43);
  const tropicalHumidity = Math.max(
    regionMask(longitude, latitude, -80, -46, -18, 8, 7),
    regionMask(longitude, latitude, 8, 32, -12, 7, 6),
    regionMask(longitude, latitude, 94, 145, -12, 24, 7),
  );
  const temperateHumidity = Math.max(
    regionMask(longitude, latitude, -12, 32, 42, 63, 8),
    regionMask(longitude, latitude, -130, -65, 40, 60, 9),
    regionMask(longitude, latitude, 102, 150, 22, 50, 8),
  );
  const desert = THREE.MathUtils.clamp(
    Math.max(
      regionMask(longitude, latitude, -18, 38, 13, 35, 5),
      regionMask(longitude, latitude, 34, 63, 12, 32, 5),
      regionMask(longitude, latitude, 112, 151, -39, -17, 6),
      regionMask(longitude, latitude, 12, 30, -31, -16, 5),
      regionMask(longitude, latitude, 82, 117, 35, 49, 5),
      regionMask(longitude, latitude, -122, -101, 24, 39, 5),
      regionMask(longitude, latitude, -76, -66, -29, -13, 4),
    ) *
      (0.82 + broadNoise * 0.28),
    0,
    1,
  );
  const elevation = getMountainStrength(longitude, latitude);
  const cold = THREE.MathUtils.smoothstep(absoluteLatitude, 54, 78);
  const polar = THREE.MathUtils.smoothstep(absoluteLatitude, 68, 81);

  const dryGrass: Rgb = [151, 155, 87];
  const lushGrass: Rgb = [57, 127, 70];
  const rainforest: Rgb = [28, 101, 55];
  const tundra: Rgb = [135, 145, 120];
  const desertSand: Rgb = [205, 164, 86];
  const desertRock: Rgb = [160, 111, 67];
  const mountainRock: Rgb = [116, 104, 82];
  const snow: Rgb = [224, 228, 213];

  const humidity = THREE.MathUtils.clamp(
    0.22 +
      tropicalHumidity * 0.78 +
      temperateHumidity * 0.48 +
      broadNoise * 0.27 -
      desert * 0.75,
    0,
    1,
  );
  let color = mixRgb(dryGrass, lushGrass, humidity);
  color = mixRgb(
    color,
    rainforest,
    tropicalHumidity * (1 - desert) * (0.55 + detailNoise * 0.25),
  );
  color = mixRgb(color, tundra, cold * (1 - polar));
  color = mixRgb(
    color,
    mixRgb(desertSand, desertRock, elevation * 0.5 + detailNoise * 0.18),
    desert,
  );
  color = mixRgb(color, mountainRock, elevation * (0.56 + detailNoise * 0.18));
  const snowyMountainRange =
    (longitude >= -80 && longitude <= -60 && latitude >= -58 && latitude <= 12) ||
    (longitude >= -126 && longitude <= -98 && latitude >= 28 && latitude <= 65) ||
    (longitude >= -3 && longitude <= 20 && latitude >= 42 && latitude <= 50) ||
    (longitude >= 65 && longitude <= 108 && latitude >= 22 && latitude <= 40);
  const highAltitudeCold = snowyMountainRange
    ? THREE.MathUtils.smoothstep(absoluteLatitude, 12, 30)
    : 0;
  const snowLine =
    THREE.MathUtils.clamp(
      (elevation - (0.93 - absoluteLatitude * 0.0007)) * 8,
      0,
      1,
    ) * highAltitudeCold;
  color = mixRgb(color, snow, Math.max(polar, snowLine));

  const reliefLight = 0.88 + broadNoise * 0.13 + detailNoise * 0.08;
  return [
    Math.round(THREE.MathUtils.clamp(color[0] * reliefLight, 0, 255)),
    Math.round(THREE.MathUtils.clamp(color[1] * reliefLight, 0, 255)),
    Math.round(THREE.MathUtils.clamp(color[2] * reliefLight, 0, 255)),
  ];
}

function getMountainStrength(longitude: number, latitude: number): number {
  const andesLongitude = -70.5 + (latitude + 20) * 0.035;
  const rockiesLongitude = -111 + (latitude - 42) * -0.45;
  return THREE.MathUtils.clamp(
    Math.max(
      ridgeMask(longitude, latitude, andesLongitude, -57, 12, 2.8),
      ridgeMask(longitude, latitude, rockiesLongitude, 28, 63, 4.2),
      ridgeMask(longitude, latitude, 7 + (latitude - 45) * 4.2, 43, 49, 2.4),
      ridgeMask(longitude, latitude, 87 + (latitude - 29) * 2.4, 25, 35, 5.2),
      ridgeMask(longitude, latitude, 51 + (latitude - 31) * -1.7, 24, 40, 4.3),
      ridgeMask(longitude, latitude, 37 + (latitude + 3) * 0.25, -20, 13, 4),
      ridgeMask(longitude, latitude, 145, -44, -11, 3.8),
    ),
    0,
    1,
  );
}

function ridgeMask(
  longitude: number,
  latitude: number,
  ridgeLongitude: number,
  minLatitude: number,
  maxLatitude: number,
  width: number,
): number {
  const latitudeWindow =
    smoothWindow(latitude, minLatitude, maxLatitude, 4) *
    Math.exp(-Math.pow((longitude - ridgeLongitude) / width, 2));
  return latitudeWindow;
}

function regionMask(
  longitude: number,
  latitude: number,
  minLongitude: number,
  maxLongitude: number,
  minLatitude: number,
  maxLatitude: number,
  feather: number,
): number {
  return (
    smoothWindow(longitude, minLongitude, maxLongitude, feather) *
    smoothWindow(latitude, minLatitude, maxLatitude, feather)
  );
}

function smoothWindow(
  value: number,
  minimum: number,
  maximum: number,
  feather: number,
): number {
  const enter = THREE.MathUtils.smoothstep(value, minimum - feather, minimum + feather);
  const exit =
    1 - THREE.MathUtils.smoothstep(value, maximum - feather, maximum + feather);
  return enter * exit;
}

function fractalNoise(x: number, y: number, seed: number): number {
  let amplitude = 0.58;
  let frequency = 1;
  let value = 0;
  let total = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    value += valueNoise(x * frequency, y * frequency, seed + octave * 101) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return value / total;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const top = THREE.MathUtils.lerp(
    coordinateNoise(x0, y0, seed),
    coordinateNoise(x0 + 1, y0, seed),
    sx,
  );
  const bottom = THREE.MathUtils.lerp(
    coordinateNoise(x0, y0 + 1, seed),
    coordinateNoise(x0 + 1, y0 + 1, seed),
    sx,
  );
  return THREE.MathUtils.lerp(top, bottom, sy);
}

function coordinateNoise(x: number, y: number, seed: number): number {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed * 1447;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = THREE.MathUtils.clamp(amount, 0, 1);
  return [
    THREE.MathUtils.lerp(from[0], to[0], t),
    THREE.MathUtils.lerp(from[1], to[1], t),
    THREE.MathUtils.lerp(from[2], to[2], t),
  ];
}

function applyWorldTerrainUvs(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  const { width, depth } = getMapDimensions();
  const northWest = geoToWorld([
    MAP_BOUNDS.minLongitude,
    MAP_BOUNDS.maxLatitude,
  ]);
  const uvs = new Float32Array(positions.count * 2);

  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = (positions.getX(index) - northWest.x) / width;
    uvs[index * 2 + 1] = 1 - (positions.getZ(index) - northWest.z) / depth;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
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

function getMapDimensions(): { width: number; depth: number } {
  const northWest = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
  const southEast = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);
  return {
    width: southEast.x - northWest.x,
    depth: southEast.z - northWest.z,
  };
}
