import * as THREE from "three";
import {
  COUNTRIES,
  MAP_BOUNDS,
  MAP_SCALE,
  type CountryDefinition,
  type GeoPoint,
  geoToWorld,
  getCountryBorders,
  isGeoPointInCountry,
  worldToGeo,
} from "./data";
import { WORLD_COUNTRIES, type WorldCountry } from "./world-map";

interface VehicleView {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  pontoons: THREE.Mesh[];
  wake: THREE.Mesh[];
}

const shared = {
  trunkGeometry: new THREE.CylinderGeometry(0.08, 0.11, 0.55, 6),
  treeGeometry: new THREE.DodecahedronGeometry(0.38, 0),
  palmGeometry: new THREE.ConeGeometry(0.38, 0.65, 6),
  buildingGeometry: new THREE.BoxGeometry(0.55, 0.55, 0.55),
  roofGeometry: new THREE.ConeGeometry(0.42, 0.3, 4),
  duneGeometry: new THREE.SphereGeometry(0.55, 7, 4),
  trunkMaterial: new THREE.MeshStandardMaterial({ color: 0x8b694d, roughness: 0.95 }),
  whiteMaterial: new THREE.MeshStandardMaterial({ color: 0xfff4d8, roughness: 0.9 }),
  roofMaterial: new THREE.MeshStandardMaterial({ color: 0xd46348, roughness: 0.9 }),
  greenMaterial: new THREE.MeshStandardMaterial({ color: 0x3c8c66, roughness: 0.95 }),
  darkGreenMaterial: new THREE.MeshStandardMaterial({ color: 0x266c58, roughness: 0.95 }),
  orangeMaterial: new THREE.MeshStandardMaterial({ color: 0xef9446, roughness: 0.9 }),
  purpleMaterial: new THREE.MeshStandardMaterial({ color: 0x8c75bd, roughness: 0.9 }),
  sandMaterial: new THREE.MeshStandardMaterial({ color: 0xe8b96d, roughness: 1 }),
};

export class WorldView {
  readonly root = new THREE.Group();
  readonly vehicle: VehicleView;
  readonly landmarkRings = new Map<string, THREE.Mesh>();
  readonly oceanGrid: THREE.GridHelper;
  private readonly wavelets: THREE.Mesh[] = [];
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

    const { width, depth } = getMapDimensions();
    this.oceanGrid = new THREE.GridHelper(
      Math.max(width, depth),
      96,
      0xbbeef5,
      0x65c4db,
    );
    this.oceanGrid.position.y = 0.035;
    const gridMaterials = Array.isArray(this.oceanGrid.material)
      ? this.oceanGrid.material
      : [this.oceanGrid.material];
    for (const material of gridMaterials) {
      material.transparent = true;
      material.opacity = 0.12;
      material.depthWrite = false;
    }
    this.root.add(this.oceanGrid);
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
    this.vehicle.root.position.y = THREE.MathUtils.lerp(0.55, 0.09, this.modeBlend);
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

    for (const [index, ring] of [...this.landmarkRings.values()].entries()) {
      ring.rotation.z = elapsed * 0.45 + index;
      const glow = 1 + Math.sin(elapsed * 2 + index) * 0.08;
      ring.scale.setScalar(glow);
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
      this.addCountryTiles(country);
      this.addCountryBorder(country);
      this.addScenery(country);
      this.addLandmark(country);
    }
  }

  private addCountryBase(country: CountryDefinition): void {
    const shapes = getCountryBorders(country).map((border) => {
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

    const material = new THREE.MeshStandardMaterial({
      color: country.darkColor,
      roughness: 0.94,
    });
    const land = new THREE.Mesh(geometry, material);
    land.position.y = 0.02;
    land.receiveShadow = true;
    land.castShadow = true;
    land.name = `${country.name} land`;
    this.root.add(land);
  }

  private addCountryTiles(country: CountryDefinition): void {
    const points = getCountryBorders(country).flatMap((border) => border.map(geoToWorld));
    const minimumX = Math.min(...points.map((point) => point.x));
    const maximumX = Math.max(...points.map((point) => point.x));
    const minimumZ = Math.min(...points.map((point) => point.z));
    const maximumZ = Math.max(...points.map((point) => point.z));
    const tileSize = 1.08;
    const positions: { x: number; z: number; height: number }[] = [];
    const seed = hashString(country.id);

    for (let x = minimumX + tileSize / 2; x <= maximumX; x += tileSize) {
      for (let z = minimumZ + tileSize / 2; z <= maximumZ; z += tileSize) {
        if (isGeoPointInCountry(worldToGeo(x, z), country)) {
          const noise = pseudoNoise(x, z, seed);
          positions.push({ x, z, height: 0.07 + noise * 0.17 });
        }
      }
    }

    const geometry = new THREE.BoxGeometry(tileSize * 0.94, 1, tileSize * 0.94);
    const material = new THREE.MeshStandardMaterial({
      color: country.color,
      roughness: 0.92,
    });
    const tiles = new THREE.InstancedMesh(geometry, material, positions.length);
    const matrix = new THREE.Matrix4();

    positions.forEach((position, index) => {
      matrix.compose(
        new THREE.Vector3(position.x, 0.47 + position.height / 2, position.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, position.height, 1),
      );
      tiles.setMatrixAt(index, matrix);
    });

    tiles.instanceMatrix.needsUpdate = true;
    tiles.receiveShadow = true;
    tiles.castShadow = true;
    tiles.name = `${country.name} mosaic tiles`;
    this.root.add(tiles);
  }

  private addCountryBorder(country: CountryDefinition): void {
    const material = new THREE.LineBasicMaterial({
      color: 0xfff7df,
      transparent: true,
      opacity: 0.78,
    });

    for (const border of getCountryBorders(country)) {
      const positions: number[] = [];
      for (const point of border) {
        const world = geoToWorld(point);
        positions.push(world.x, 0.68, world.z);
      }
      const first = geoToWorld(border[0]);
      positions.push(first.x, 0.68, first.z);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      this.root.add(new THREE.Line(geometry, material));
    }
  }

  private addScenery(country: CountryDefinition): void {
    const random = mulberry32(hashString(country.id));
    const allBorderPoints = getCountryBorders(country).flat();
    const longitudes = allBorderPoints.map((point) => point[0]);
    const latitudes = allBorderPoints.map((point) => point[1]);
    const minimumLongitude = Math.min(...longitudes);
    const maximumLongitude = Math.max(...longitudes);
    const minimumLatitude = Math.min(...latitudes);
    const maximumLatitude = Math.max(...latitudes);
    const targetCount = country.id === "algeria" ? 40 : 28;
    let placed = 0;
    let attempts = 0;

    while (placed < targetCount && attempts < 800) {
      attempts += 1;
      const point = [
        THREE.MathUtils.lerp(minimumLongitude, maximumLongitude, random()),
        THREE.MathUtils.lerp(minimumLatitude, maximumLatitude, random()),
      ] as const;

      if (!isGeoPointInCountry(point, country)) {
        continue;
      }

      const cityDistance = Math.hypot(
        (point[0] - country.city.point[0]) * MAP_SCALE.x,
        (point[1] - country.city.point[1]) * MAP_SCALE.z,
      );
      if (cityDistance < 1.9) {
        continue;
      }

      const world = geoToWorld(point);
      const size = 0.72 + random() * 0.55;
      const choice = random();

      if (country.scenery === "sahara" && choice < 0.62) {
        this.addDune(world.x, world.z, size);
      } else if (
        (country.scenery === "atlas" || country.scenery === "highland") &&
        choice < 0.4
      ) {
        this.addMountain(world.x, world.z, size, 0xb87956);
      } else if (country.scenery === "green" && choice < 0.28) {
        this.addLavenderPatch(world.x, world.z, size);
      } else if (choice < 0.68) {
        this.addTree(world.x, world.z, size, country);
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

  private addLandmark(country: CountryDefinition): void {
    const world = geoToWorld(country.city.point);
    const group = new THREE.Group();
    group.position.set(world.x, 0.63, world.z);
    group.name = `${country.city.name} landmark`;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.08, 0.07, 7, 24),
      new THREE.MeshBasicMaterial({
        color: country.accent,
        transparent: true,
        opacity: 0.9,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);
    this.landmarkRings.set(country.id, ring);

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: country.accent,
      roughness: 0.84,
    });
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff5d9,
      roughness: 0.9,
    });

    if (country.id === "portugal") {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.33, 1.35, 7), baseMaterial);
      tower.position.y = 0.68;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.4, 7), accentMaterial);
      roof.position.y = 1.55;
      group.add(tower, roof);
      const tram = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.42), accentMaterial);
      tram.position.set(0.58, 0.28, 0.35);
      group.add(tram);
    } else if (country.id === "spain") {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.42), baseMaterial);
      tower.position.set(-0.35, 0.67, 0);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.4, 4), accentMaterial);
      roof.position.set(-0.35, 1.55, 0);
      group.add(tower, roof);
      this.addTreeToGroup(group, 0.45, 0.2, 1.15, shared.orangeMaterial);
    } else if (country.id === "france") {
      const sail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.25, 3), baseMaterial);
      sail.rotation.z = Math.PI / 2;
      sail.position.set(0.15, 0.8, 0);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 5), accentMaterial);
      mast.position.y = 0.75;
      group.add(sail, mast);
    } else if (country.id === "morocco") {
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.4), baseMaterial);
      const right = left.clone();
      left.position.set(-0.48, 0.6, 0);
      right.position.set(0.48, 0.6, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.32, 0.42), accentMaterial);
      lintel.position.y = 1.2;
      group.add(left, right, lintel);
    } else if (country.id === "united-kingdom") {
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
    } else if (country.id === "germany") {
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
    } else if (country.id === "italy") {
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
    } else if (country.id === "greece") {
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
    } else if (country.id === "tunisia") {
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.05, 0.38), baseMaterial);
      const right = left.clone();
      left.position.set(-0.45, 0.52, 0);
      right.position.set(0.45, 0.52, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.28, 0.4), accentMaterial);
      lintel.position.y = 1.02;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
        accentMaterial,
      );
      dome.position.set(0, 1.18, 0);
      group.add(left, right, lintel, dome);
    } else if (country.id === "egypt") {
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
    } else if (country.id === "turkey") {
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
    } else if (country.id === "china") {
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
    } else if (country.id === "japan") {
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.2), accentMaterial);
      const right = left.clone();
      left.position.set(-0.52, 0.65, 0);
      right.position.set(0.52, 0.65, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.18, 0.24), accentMaterial);
      lintel.position.y = 1.18;
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.28), accentMaterial);
      top.position.y = 1.42;
      group.add(left, right, lintel, top);
    } else if (country.id === "south-korea") {
      const gate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, 0.52), baseMaterial);
      gate.position.y = 0.32;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.34, 4), accentMaterial);
      roof.position.y = 0.82;
      roof.rotation.y = Math.PI / 4;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.42), baseMaterial);
      upper.position.y = 1.05;
      group.add(gate, roof, upper);
    } else if (country.id === "india") {
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
    } else if (country.id === "thailand") {
      for (let index = 0; index < 3; index += 1) {
        const level = new THREE.Mesh(
          new THREE.ConeGeometry(0.65 - index * 0.16, 0.42, 6),
          index % 2 === 0 ? accentMaterial : baseMaterial,
        );
        level.position.y = 0.24 + index * 0.34;
        group.add(level);
      }
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 7), accentMaterial);
      spire.position.y = 1.42;
      group.add(spire);
    } else if (country.id === "vietnam") {
      for (let index = 0; index < 3; index += 1) {
        const level = new THREE.Mesh(
          new THREE.BoxGeometry(0.95 - index * 0.2, 0.25, 0.58 - index * 0.08),
          baseMaterial,
        );
        level.position.y = 0.18 + index * 0.34;
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(0.58 - index * 0.1, 0.23, 4),
          accentMaterial,
        );
        roof.position.y = level.position.y + 0.23;
        roof.rotation.y = Math.PI / 4;
        group.add(level, roof);
      }
    } else if (country.id === "indonesia") {
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
    this.root.add(group);
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
  }

  private addRiver(points: readonly GeoPoint[], color: number, radius: number): void {
    const curvePoints = points.map((point) => {
      const world = geoToWorld(point);
      return new THREE.Vector3(world.x, 0.74, world.z);
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
    const isPalm =
      country.scenery === "atlas" ||
      country.scenery === "sahara" ||
      country.scenery === "tropical";
    const foliageMaterial =
      country.scenery === "mediterranean" ? shared.orangeMaterial : shared.greenMaterial;
    const trunk = new THREE.Mesh(shared.trunkGeometry, shared.trunkMaterial);
    trunk.position.y = 0.28 * size;
    trunk.scale.setScalar(size);
    const crown = new THREE.Mesh(
      isPalm ? shared.palmGeometry : shared.treeGeometry,
      isPalm ? shared.darkGreenMaterial : foliageMaterial,
    );
    crown.position.y = 0.78 * size;
    crown.scale.setScalar(size);
    crown.castShadow = true;
    group.add(trunk, crown);
    group.position.set(x, 0.57, z);
    this.root.add(group);
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

    group.position.set(x, 0.57, z);
    this.root.add(group);
  }

  private addDune(x: number, z: number, size: number): void {
    const dune = new THREE.Mesh(shared.duneGeometry, shared.sandMaterial);
    dune.scale.set(size * 1.15, size * 0.32, size * 0.65);
    dune.position.set(x, 0.56, z);
    dune.castShadow = true;
    this.root.add(dune);
  }

  private addMountain(x: number, z: number, size: number, color: number): void {
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(0.6 * size, 1.4 * size, 5),
      new THREE.MeshStandardMaterial({ color, roughness: 1 }),
    );
    mountain.position.set(x, 0.55 + 0.7 * size, z);
    mountain.rotation.y = x + z;
    mountain.castShadow = true;
    this.root.add(mountain);
  }

  private addLavenderPatch(x: number, z: number, size: number): void {
    const patch = new THREE.Mesh(
      new THREE.BoxGeometry(0.75 * size, 0.09, 0.36 * size),
      shared.purpleMaterial,
    );
    patch.position.set(x, 0.63, z);
    patch.rotation.y = x * 0.2;
    patch.castShadow = true;
    this.root.add(patch);
  }
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

function pseudoNoise(x: number, z: number, seed: number): number {
  const value = Math.sin(x * 12.9898 + z * 78.233 + seed * 0.001) * 43758.5453;
  return value - Math.floor(value);
}

function getMapDimensions(): { width: number; depth: number } {
  const northWest = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
  const southEast = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);
  return {
    width: southEast.x - northWest.x,
    depth: southEast.z - northWest.z,
  };
}
