import * as THREE from "three";
import {
  COUNTRIES,
  MAP_BOUNDS,
  MAP_SCALE,
  PHOTO_SPOTS,
  type CountryDefinition,
  type GeoPoint,
  type PhotoSpotDefinition,
  geoToWorld,
  getCountryBorders,
  getCountryById,
  isGeoPointInCountry,
  worldToGeo,
} from "./data";
import {
  WORLD_COUNTRIES,
  getWorldCountryByName,
  isGeoPointInWorldCountry,
  type WorldCountry,
} from "./world-map";

interface VehicleView {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  pontoons: THREE.Mesh[];
  wake: THREE.Mesh[];
}

interface PhotoSpotEffect {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  anchorX: number;
  anchorZ: number;
  phase: number;
}

const PHOTO_SPOT_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uStrength;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 animated = position;
    float drift = uTime * 0.7 + aPhase;
    animated.x += sin(drift) * 0.12;
    animated.z += cos(drift * 0.8) * 0.12;
    animated.y += sin(drift * 1.3) * 0.16;

    vec4 viewPosition = modelViewMatrix * vec4(animated, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp((12.0 + 5.0 * sin(drift)) * uStrength * (18.0 / -viewPosition.z), 1.0, 14.0);
    vAlpha = uStrength * (0.68 + 0.22 * sin(drift));
  }
`;

const PHOTO_SPOT_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float glow = 1.0 - smoothstep(0.08, 0.5, distanceToCenter);
    gl_FragColor = vec4(uColor, glow * vAlpha);
  }
`;

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
  private readonly photoSpotEffects: PhotoSpotEffect[] = [];
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

    for (const effect of this.photoSpotEffects) {
      const distance = Math.hypot(effect.anchorX - position.x, effect.anchorZ - position.z);
      const strength = THREE.MathUtils.clamp((13 - distance) / 8, 0, 1);
      effect.points.visible = strength > 0.01;
      effect.points.rotation.y = elapsed * 0.12 + effect.phase;
      effect.material.uniforms.uTime.value = elapsed;
      effect.material.uniforms.uStrength.value = strength;
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
    const palette = [0x8bc99a, 0xa8cf8a, 0xd9c579, 0xd3aa72, 0x8fc1ad, 0xb7c783];

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
        depth: 0.16,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 1,
      });
      geometry.rotateX(-Math.PI / 2);

      const material = new THREE.MeshStandardMaterial({
        color: palette[hashString(country.id) % palette.length],
        roughness: 0.96,
      });
      const land = new THREE.Mesh(geometry, material);
      land.position.y = 0.015;
      land.receiveShadow = true;
      land.name = `${country.name} world base`;
      this.root.add(land);

      this.addWorldCountryBorder(country);
    }
  }

  private addWorldCountryBorder(country: WorldCountry): void {
    const material = new THREE.LineBasicMaterial({
      color: 0xf4f1ce,
      transparent: true,
      opacity: 0.42,
    });

    for (const polygon of country.renderPolygons) {
      if (polygon.length < 3) {
        continue;
      }

      const positions: number[] = [];
      for (const point of polygon) {
        const world = geoToWorld(point);
        positions.push(world.x, 0.205, world.z);
      }

      const first = geoToWorld(polygon[0]);
      positions.push(first.x, 0.205, first.z);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      this.root.add(new THREE.Line(geometry, material));
    }
  }

  private addCountries(): void {
    for (const country of COUNTRIES) {
      this.addCountryBase(country);
      this.addCountryBorder(country);
      this.addScenery(country);
      this.addCountryAnchor(country);
    }

    for (const spot of PHOTO_SPOTS) {
      this.addPhotoSpot(spot);
    }
  }

  private addCountryBase(country: CountryDefinition): void {
    const shapes = getDetailedCountryBorders(country).map((border) => {
      const shape = new THREE.Shape();
      border.forEach((point, index) => {
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

    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.42,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1,
    });
    geometry.rotateX(-Math.PI / 2);

    const palette = getTerrainPalette(country, country.city.point);
    const surfaceColor = new THREE.Color(palette.tileLow).lerp(
      new THREE.Color(palette.tileHigh),
      0.48,
    );
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: surfaceColor,
      map: getTerrainTexture(country.scenery),
      roughness: 0.97,
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: palette.base,
      roughness: 1,
    });
    const land = new THREE.Mesh(geometry, [surfaceMaterial, edgeMaterial]);
    land.position.y = 0.02;
    land.receiveShadow = true;
    land.castShadow = true;
    land.name = `${country.name} land`;
    this.root.add(land);
  }

  private addCountryBorder(country: CountryDefinition): void {
    const material = new THREE.LineBasicMaterial({
      color: 0xfff7df,
      transparent: true,
      opacity: 0.78,
    });

    for (const border of getDetailedCountryBorders(country)) {
      const positions: number[] = [];
      for (const point of border) {
        const world = geoToWorld(point);
        positions.push(world.x, 0.452, world.z);
      }
      const first = geoToWorld(border[0]);
      positions.push(first.x, 0.452, first.z);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      this.root.add(new THREE.Line(geometry, material));
    }
  }

  private addScenery(country: CountryDefinition): void {
    const random = mulberry32(hashString(country.id));
    const allBorderPoints = getDetailedCountryBorders(country).flat();
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

      if (!isGeoPointInDetailedCountry(point, country)) {
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
        this.addTreeCluster(world.x, world.z, size, country, random);
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
        this.addTreeCluster(world.x, world.z, size, country, random);
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
        this.addTreeCluster(world.x, world.z, size, country, random);
      } else if (country.scenery === "mediterranean" && choice < 0.52) {
        this.addFieldPatch(world.x, world.z, size, country);
      } else if (country.scenery === "mediterranean" && choice < 0.72) {
        this.addMeadowPatch(world.x, world.z, size, false);
      } else if (country.scenery === "highland" && choice < 0.66) {
        this.addTreeCluster(world.x, world.z, size, country, random);
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

  private addCountryAnchor(country: CountryDefinition): void {
    const world = geoToWorld(country.city.point);
    const group = new THREE.Group();
    const random = mulberry32(hashString(`${country.id}-anchor`));
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: country.accent,
      roughness: 0.88,
    });
    const wallMaterial = new THREE.MeshStandardMaterial({
      color:
        country.scenery === "sahara" || country.scenery === "atlas"
          ? 0xffe2aa
          : 0xfff4d8,
      roughness: 0.94,
    });
    const plazaMaterial = new THREE.MeshStandardMaterial({
      color: country.darkColor,
      roughness: 1,
    });

    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.96, 0.08, 12),
      plazaMaterial,
    );
    plaza.position.y = 0.04;
    plaza.receiveShadow = true;
    group.add(plaza);

    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + random() * 0.28;
      const radius = index === 0 ? 0 : 0.42 + random() * 0.18;
      const height = 0.42 + random() * 0.42 + (index === 0 ? 0.28 : 0);
      const width = 0.3 + random() * 0.18;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, width),
        index === 0 ? accentMaterial : wallMaterial,
      );
      body.position.set(
        Math.cos(angle) * radius,
        0.08 + height / 2,
        Math.sin(angle) * radius,
      );
      body.rotation.y = -angle + random() * 0.2;
      body.castShadow = true;
      group.add(body);

      if (country.scenery !== "sahara" && country.scenery !== "atlas") {
        const roof = new THREE.Mesh(shared.roofGeometry, accentMaterial);
        roof.position.set(
          body.position.x,
          0.1 + height + 0.12,
          body.position.z,
        );
        roof.scale.setScalar(width * 1.05);
        roof.rotation.y = Math.PI / 4 + body.rotation.y;
        roof.castShadow = true;
        group.add(roof);
      }
    }

    group.position.set(world.x, 0.445, world.z);
    group.rotation.y = (hashString(country.id) % 12) * (Math.PI / 6);
    group.name = `${country.name} · ${country.city.name} country anchor`;
    this.root.add(group);
  }

  private addPhotoSpot(spot: PhotoSpotDefinition): void {
    const country = getCountryById(spot.countryId);
    const world = geoToWorld(spot.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.445, world.z);
    group.name = `${spot.name} photo spot`;

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: country.accent,
      roughness: 0.84,
    });
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff5d9,
      roughness: 0.9,
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

    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    }
    this.addPhotoSpotEffect(group, country, world);
    this.root.add(group);
  }

  private addPhotoSpotEffect(
    group: THREE.Group,
    country: CountryDefinition,
    world: { x: number; z: number },
  ): void {
    const particleCount = 12;
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      const angle = (index / particleCount) * Math.PI * 2;
      const radius = 0.7 + (index % 3) * 0.22;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = 0.25 + (index % 4) * 0.48;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
      phases[index] = angle + (index % 2) * 0.7;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0 },
        uColor: { value: new THREE.Color(country.accent) },
      },
      vertexShader: PHOTO_SPOT_VERTEX_SHADER,
      fragmentShader: PHOTO_SPOT_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);
    this.photoSpotEffects.push({
      points,
      material,
      anchorX: world.x,
      anchorZ: world.z,
      phase: this.photoSpotEffects.length * 0.73,
    });
  }

  private addGeographyFeatures(): void {
    this.addRiver(
      [
        [31.0, 22.5],
        [31.2, 25.0],
        [31.4, 27.5],
        [31.2, 30.8],
      ],
      0x3fabc4,
      0.11,
    );
    this.addRiver(
      [
        [8.3, 47.6],
        [7.6, 49.3],
        [7.0, 51.0],
        [6.8, 53.0],
      ],
      0x56a9bf,
      0.07,
    );
    this.addRiver(
      [
        [91.0, 31.0],
        [101.0, 30.2],
        [110.0, 30.5],
        [121.0, 31.2],
      ],
      0x4aa8c2,
      0.09,
    );
    this.addRiver(
      [
        [77.0, 30.0],
        [80.0, 27.5],
        [84.0, 25.5],
        [88.0, 23.0],
      ],
      0x5db1c5,
      0.085,
    );
    this.addRiver(
      [
        [101.0, 22.0],
        [103.0, 18.0],
        [104.5, 14.0],
        [105.0, 10.0],
      ],
      0x55a9bc,
      0.07,
    );
    this.addRiver(
      [
        [9.0, 48.0],
        [16.0, 48.2],
        [22.0, 46.0],
        [29.0, 45.2],
      ],
      0x4da5bd,
      0.075,
    );
    this.addRiver(
      [
        [35.0, 57.0],
        [40.0, 54.5],
        [45.0, 50.5],
        [48.0, 46.0],
      ],
      0x55a8bf,
      0.08,
    );
    this.addRiver(
      [
        [73.5, 35.5],
        [71.0, 31.0],
        [69.0, 27.0],
        [67.5, 24.5],
      ],
      0x57a9be,
      0.075,
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

  private addRiver(points: readonly GeoPoint[], color: number, radius: number): void {
    const curvePoints = points.map((point) => {
      const world = geoToWorld(point);
      return new THREE.Vector3(world.x, 0.46, world.z);
    });
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const river = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, radius, 5, false),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.02,
      }),
    );
    river.receiveShadow = true;
    this.root.add(river);
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
      if (COUNTRIES.some((country) => isGeoPointInCountry(geo, country))) {
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
      if (!isGeoPointInDetailedCountry(worldToGeo(treeX, treeZ), country)) {
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

interface TerrainPalette {
  base: number;
  tileLow: number;
  tileHigh: number;
}

function getDetailedCountryBorders(
  country: CountryDefinition,
): readonly (readonly GeoPoint[])[] {
  return (
    getWorldCountryByName(country.englishName)?.renderPolygons ??
    getCountryBorders(country)
  );
}

function isGeoPointInDetailedCountry(
  point: GeoPoint,
  country: CountryDefinition,
): boolean {
  const detailedCountry = getWorldCountryByName(country.englishName);
  return detailedCountry
    ? isGeoPointInWorldCountry(point, detailedCountry)
    : isGeoPointInCountry(point, country);
}

const TERRAIN_PALETTES: Record<CountryDefinition["scenery"], TerrainPalette> = {
  atlantic: {
    base: 0x315f49,
    tileLow: 0x549962,
    tileHigh: 0x8bca78,
  },
  mediterranean: {
    base: 0x647044,
    tileLow: 0x91a653,
    tileHigh: 0xc8c96c,
  },
  green: {
    base: 0x356448,
    tileLow: 0x4d965b,
    tileHigh: 0x86c86f,
  },
  atlas: {
    base: 0x78623f,
    tileLow: 0xa79b54,
    tileHigh: 0xd2bc68,
  },
  sahara: {
    base: 0x96552f,
    tileLow: 0xd58b3f,
    tileHigh: 0xf3c762,
  },
  monsoon: {
    base: 0x286346,
    tileLow: 0x3d9255,
    tileHigh: 0x78ca67,
  },
  tropical: {
    base: 0x175d3e,
    tileLow: 0x2d814e,
    tileHigh: 0x65b95e,
  },
  highland: {
    base: 0x505f4c,
    tileLow: 0x718067,
    tileHigh: 0xadb084,
  },
};

const RIVER_VALLEY_PALETTE: TerrainPalette = {
  base: 0x286348,
  tileLow: 0x4d9d5b,
  tileHigh: 0x93d06f,
};

const terrainTextures = new Map<CountryDefinition["scenery"], THREE.CanvasTexture>();

function getTerrainTexture(
  scenery: CountryDefinition["scenery"],
): THREE.CanvasTexture {
  const cached = terrainTextures.get(scenery);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  const textureSize = 256;
  canvas.width = textureSize;
  canvas.height = textureSize;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create terrain texture");
  }
  const random = mulberry32(hashString(`terrain-${scenery}`));

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";

  for (let index = 0; index < 180; index += 1) {
    const radius = 4 + random() * 18;
    context.fillStyle = `rgba(58, 74, 50, ${0.012 + random() * 0.024})`;
    context.beginPath();
    context.arc(
      random() * textureSize,
      random() * textureSize,
      radius,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  if (scenery === "sahara" || scenery === "atlas") {
    context.strokeStyle = "rgba(126, 91, 48, 0.18)";
    context.lineWidth = 1.8;
    for (let y = 8; y < textureSize; y += 18) {
      const drift = Math.sin(y * 0.15) * 8;
      context.beginPath();
      context.moveTo(-12, y + drift);
      context.bezierCurveTo(
        textureSize * 0.28,
        y - 7 + drift,
        textureSize * 0.58,
        y + 8 - drift,
        textureSize + 12,
        y + drift,
      );
      context.stroke();
    }
    context.fillStyle = "rgba(120, 77, 43, 0.16)";
    for (let index = 0; index < 70; index += 1) {
      context.beginPath();
      context.arc(
        random() * textureSize,
        random() * textureSize,
        0.6 + random() * 1.2,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  } else if (scenery === "tropical" || scenery === "monsoon") {
    context.fillStyle = "rgba(42, 105, 60, 0.15)";
    for (let index = 0; index < 150; index += 1) {
      const x = random() * textureSize;
      const y = random() * textureSize;
      context.beginPath();
      context.ellipse(
        x,
        y,
        2.5 + random() * 3.5,
        1 + random() * 1.5,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.strokeStyle = "rgba(38, 94, 54, 0.16)";
    context.lineWidth = 1.1;
    for (let index = 0; index < 110; index += 1) {
      const x = random() * textureSize;
      const y = random() * textureSize;
      context.beginPath();
      context.moveTo(x, y + 3);
      context.lineTo(x + random() * 2, y - 3);
      context.stroke();
    }
  } else if (scenery === "highland") {
    context.strokeStyle = "rgba(72, 79, 64, 0.16)";
    context.lineWidth = 1.35;
    for (let index = 0; index < 16; index += 1) {
      const y = 5 + index * 17;
      context.beginPath();
      context.moveTo(-8, y + 8);
      for (let x = 0; x <= textureSize + 16; x += 24) {
        context.lineTo(x, y + Math.sin(x * 0.09 + index) * 7);
      }
      context.stroke();
    }
  } else if (scenery === "mediterranean") {
    context.strokeStyle = "rgba(113, 107, 50, 0.14)";
    context.lineWidth = 2;
    for (let x = -textureSize; x < textureSize * 1.5; x += 21) {
      context.beginPath();
      context.moveTo(x, textureSize);
      context.lineTo(x + textureSize * 0.58, 0);
      context.stroke();
    }
    context.fillStyle = "rgba(82, 103, 52, 0.16)";
    for (let index = 0; index < 100; index += 1) {
      context.beginPath();
      context.arc(
        random() * textureSize,
        random() * textureSize,
        0.8 + random(),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  } else {
    context.strokeStyle = "rgba(47, 112, 57, 0.16)";
    context.lineWidth = 1.25;
    for (let index = 0; index < 260; index += 1) {
      const x = random() * textureSize;
      const y = random() * textureSize;
      context.beginPath();
      context.moveTo(x, y + 2.4);
      context.lineTo(x + (random() - 0.5) * 2.2, y - 2.4);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.82, 0.82);
  texture.anisotropy = 4;
  terrainTextures.set(scenery, texture);
  return texture;
}

function getTerrainPalette(
  country: CountryDefinition,
  point: GeoPoint,
): TerrainPalette {
  if (
    country.id === "egypt" &&
    Math.abs(point[0] - 31.2) < 1.05 &&
    point[1] < 31.4
  ) {
    return RIVER_VALLEY_PALETTE;
  }

  if (isDesertPoint(country, point)) {
    return TERRAIN_PALETTES.sahara;
  }

  return TERRAIN_PALETTES[country.scenery];
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
