import * as THREE from "three";

interface CurrentStreak {
  offsetX: number;
  offsetZ: number;
  driftX: number;
  driftZ: number;
  rotation: number;
  scale: number;
  phase: number;
}

interface WaterPatch {
  offsetX: number;
  offsetZ: number;
  driftX: number;
  driftZ: number;
  scaleX: number;
  scaleZ: number;
  phase: number;
}

interface FishSchool {
  offsetX: number;
  offsetZ: number;
  velocityX: number;
  velocityZ: number;
  cruiseX: number;
  cruiseZ: number;
  phase: number;
}

interface DistantSailboat {
  readonly root: THREE.Group;
  offsetX: number;
  offsetZ: number;
  driftX: number;
  driftZ: number;
  phase: number;
}

const CURRENT_FIELD_X = 15;
const CURRENT_FIELD_Z = 13;
const FISH_FIELD_X = 12;
const FISH_FIELD_Z = 10;
const SAIL_FIELD_X = 14;
const SAIL_FIELD_Z = 12;
const CURRENT_COUNT = 26;
const FISH_PER_SCHOOL = 6;
const WATER_PATCH_COUNT = 7;

function createSoftWaterPatchTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create water patch texture.");
  }
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.52, "rgba(255, 255, 255, 0.42)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A pooled, player-local ocean layer. It gives long crossings changing scale
 * cues and living responses without filling the whole world with scene nodes.
 */
export class OceanLife {
  readonly root = new THREE.Group();

  private readonly currentStreaks: CurrentStreak[] = [];
  private readonly waterPatches: WaterPatch[] = [];
  private readonly fishSchools: FishSchool[] = [];
  private readonly sailboats: DistantSailboat[] = [];
  private readonly dolphins: THREE.Group[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly currentMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8fbf7,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly waterPatchMaterial = new THREE.MeshBasicMaterial({
    map: createSoftWaterPatchTexture(),
    color: 0x207fa6,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly fishMaterial = new THREE.MeshBasicMaterial({
    color: 0x235f78,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly sailMaterials: THREE.Material[] = [];
  private readonly dolphinMaterials: THREE.Material[] = [];
  private currentMesh?: THREE.InstancedMesh;
  private waterPatchMesh?: THREE.InstancedMesh;
  private fishMesh?: THREE.InstancedMesh;
  private previousPlayerX?: number;
  private previousPlayerZ?: number;
  private modeBlend = 0;
  private dolphinEncounter = 0;
  private dolphinCooldown = 0.9;

  constructor() {
    this.root.name = "Local ocean life";
    this.buildWaterPatches();
    this.buildCurrentStreaks();
    this.buildFishSchools();
    this.buildSailboats();
    this.buildDolphins();
  }

  update(
    elapsed: number,
    delta: number,
    player: { x: number; z: number },
    velocity: { x: number; z: number },
    heading: number,
    boatMode: boolean,
    overviewBlend: number,
  ): void {
    this.modeBlend +=
      ((boatMode ? 1 : 0) - this.modeBlend) * (1 - Math.exp(-6.5 * delta));
    const localFactor =
      1 - THREE.MathUtils.smoothstep(overviewBlend, 0.18, 0.58);
    const visibility = this.modeBlend * localFactor;

    const playerDeltaX =
      this.previousPlayerX === undefined ? 0 : player.x - this.previousPlayerX;
    const playerDeltaZ =
      this.previousPlayerZ === undefined ? 0 : player.z - this.previousPlayerZ;
    this.previousPlayerX = player.x;
    this.previousPlayerZ = player.z;

    this.root.visible = visibility > 0.01;
    if (!this.root.visible) {
      return;
    }

    this.currentMaterial.opacity = 0.22 * visibility;
    this.waterPatchMaterial.opacity = 0.14 * visibility;
    this.fishMaterial.opacity = 0.48 * visibility;
    for (const material of this.sailMaterials) {
      if ("opacity" in material) {
        material.opacity = visibility;
      }
    }
    for (const material of this.dolphinMaterials) {
      if ("opacity" in material) {
        material.opacity = visibility;
      }
    }

    this.updateWaterPatches(
      elapsed,
      delta,
      player,
      playerDeltaX,
      playerDeltaZ,
    );
    this.updateCurrents(elapsed, delta, player, playerDeltaX, playerDeltaZ);
    this.updateFish(
      elapsed,
      delta,
      player,
      playerDeltaX,
      playerDeltaZ,
      velocity,
    );
    this.updateSailboats(
      elapsed,
      delta,
      player,
      playerDeltaX,
      playerDeltaZ,
    );
    this.updateDolphins(
      elapsed,
      delta,
      player,
      velocity,
      heading,
      boatMode,
    );
  }

  private updateWaterPatches(
    elapsed: number,
    delta: number,
    player: { x: number; z: number },
    playerDeltaX: number,
    playerDeltaZ: number,
  ): void {
    const mesh = this.waterPatchMesh;
    if (!mesh) {
      return;
    }
    for (let index = 0; index < this.waterPatches.length; index += 1) {
      const patch = this.waterPatches[index];
      patch.offsetX = wrapField(
        patch.offsetX - playerDeltaX + patch.driftX * delta,
        CURRENT_FIELD_X,
      );
      patch.offsetZ = wrapField(
        patch.offsetZ - playerDeltaZ + patch.driftZ * delta,
        CURRENT_FIELD_Z,
      );
      const breathe = 1 + Math.sin(elapsed * 0.32 + patch.phase) * 0.06;
      this.dummy.position.set(
        player.x + patch.offsetX,
        0.015,
        player.z + patch.offsetZ,
      );
      this.dummy.rotation.set(-Math.PI / 2, 0, patch.phase);
      this.dummy.scale.set(
        patch.scaleX * breathe,
        patch.scaleZ * breathe,
        1,
      );
      this.dummy.updateMatrix();
      mesh.setMatrixAt(index, this.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private updateCurrents(
    elapsed: number,
    delta: number,
    player: { x: number; z: number },
    playerDeltaX: number,
    playerDeltaZ: number,
  ): void {
    const mesh = this.currentMesh;
    if (!mesh) {
      return;
    }
    for (let index = 0; index < this.currentStreaks.length; index += 1) {
      const streak = this.currentStreaks[index];
      streak.offsetX = wrapField(
        streak.offsetX - playerDeltaX + streak.driftX * delta,
        CURRENT_FIELD_X,
      );
      streak.offsetZ = wrapField(
        streak.offsetZ - playerDeltaZ + streak.driftZ * delta,
        CURRENT_FIELD_Z,
      );
      const breathe = 1 + Math.sin(elapsed * 1.15 + streak.phase) * 0.13;
      this.dummy.position.set(
        player.x + streak.offsetX,
        0.045,
        player.z + streak.offsetZ,
      );
      this.dummy.rotation.set(-Math.PI / 2, 0, streak.rotation);
      this.dummy.scale.set(
        streak.scale * breathe,
        streak.scale * (0.72 + breathe * 0.2),
        1,
      );
      this.dummy.updateMatrix();
      mesh.setMatrixAt(index, this.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private updateFish(
    elapsed: number,
    delta: number,
    player: { x: number; z: number },
    playerDeltaX: number,
    playerDeltaZ: number,
    playerVelocity: { x: number; z: number },
  ): void {
    const mesh = this.fishMesh;
    if (!mesh) {
      return;
    }
    let instanceIndex = 0;
    const playerSpeed = Math.hypot(playerVelocity.x, playerVelocity.z);
    for (const school of this.fishSchools) {
      school.offsetX = wrapField(
        school.offsetX - playerDeltaX + school.velocityX * delta,
        FISH_FIELD_X,
      );
      school.offsetZ = wrapField(
        school.offsetZ - playerDeltaZ + school.velocityZ * delta,
        FISH_FIELD_Z,
      );
      const distance = Math.hypot(school.offsetX, school.offsetZ);
      if (distance < 3.4 && playerSpeed > 0.8) {
        const inverseDistance = 1 / Math.max(0.1, distance);
        school.velocityX =
          school.offsetX * inverseDistance * 3.4 + playerVelocity.x * 0.15;
        school.velocityZ =
          school.offsetZ * inverseDistance * 3.4 + playerVelocity.z * 0.15;
      } else {
        const smoothing = 1 - Math.exp(-1.5 * delta);
        school.velocityX +=
          (school.cruiseX - school.velocityX) * smoothing;
        school.velocityZ +=
          (school.cruiseZ - school.velocityZ) * smoothing;
      }
      const rotation = Math.atan2(school.velocityX, school.velocityZ);
      for (let fishIndex = 0; fishIndex < FISH_PER_SCHOOL; fishIndex += 1) {
        const row = Math.floor(fishIndex / 3);
        const column = fishIndex % 3;
        const wobble =
          Math.sin(elapsed * 3.2 + school.phase + fishIndex * 0.8) * 0.12;
        this.dummy.position.set(
          player.x + school.offsetX + (column - 1) * 0.48 + wobble,
          0.055,
          player.z + school.offsetZ + (row - 0.5) * 0.58 + column * 0.12,
        );
        this.dummy.rotation.set(-Math.PI / 2, 0, -rotation);
        this.dummy.scale.setScalar(0.72 + (fishIndex % 2) * 0.16);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(instanceIndex, this.dummy.matrix);
        instanceIndex += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private updateSailboats(
    elapsed: number,
    delta: number,
    player: { x: number; z: number },
    playerDeltaX: number,
    playerDeltaZ: number,
  ): void {
    for (const sailboat of this.sailboats) {
      sailboat.offsetX = wrapField(
        sailboat.offsetX - playerDeltaX + sailboat.driftX * delta,
        SAIL_FIELD_X,
      );
      sailboat.offsetZ = wrapField(
        sailboat.offsetZ - playerDeltaZ + sailboat.driftZ * delta,
        SAIL_FIELD_Z,
      );
      sailboat.root.position.set(
        player.x + sailboat.offsetX,
        0.02 + Math.sin(elapsed * 1.4 + sailboat.phase) * 0.025,
        player.z + sailboat.offsetZ,
      );
      sailboat.root.rotation.y = Math.atan2(
        sailboat.driftX,
        sailboat.driftZ,
      );
      sailboat.root.rotation.z =
        Math.sin(elapsed * 0.85 + sailboat.phase) * 0.035;
    }
  }

  private updateDolphins(
    elapsed: number,
    delta: number,
    player: { x: number; z: number },
    velocity: { x: number; z: number },
    heading: number,
    boatMode: boolean,
  ): void {
    const speed = Math.hypot(velocity.x, velocity.z);
    if (boatMode && speed > 0.8) {
      this.dolphinCooldown = Math.max(0, this.dolphinCooldown - delta);
      if (this.dolphinCooldown === 0 && this.dolphinEncounter === 0) {
        this.dolphinEncounter = 6.2;
        this.dolphinCooldown = 16;
      }
    }
    this.dolphinEncounter = Math.max(0, this.dolphinEncounter - delta);

    const directionX = speed > 0.1 ? velocity.x / speed : -Math.sin(heading);
    const directionZ = speed > 0.1 ? velocity.z / speed : -Math.cos(heading);
    const sideX = directionZ;
    const sideZ = -directionX;
    for (let index = 0; index < this.dolphins.length; index += 1) {
      const dolphin = this.dolphins[index];
      dolphin.visible = this.dolphinEncounter > 0;
      if (!dolphin.visible) {
        continue;
      }
      const phase = elapsed * 2.15 + index * 1.7;
      const jump = Math.max(0, Math.sin(phase));
      const side = (index - 1) * 0.9 + Math.sin(elapsed * 0.55 + index) * 0.28;
      const forward = 0.9 + index * 0.48 + Math.sin(phase * 0.5) * 0.35;
      dolphin.position.set(
        player.x + directionX * forward + sideX * side,
        0.04 + jump * (0.62 + index * 0.08),
        player.z + directionZ * forward + sideZ * side,
      );
      dolphin.rotation.y = Math.atan2(directionX, directionZ);
      dolphin.rotation.x = Math.cos(phase) * 0.24;
      dolphin.rotation.z = (index - 1) * 0.055;
    }
  }

  private buildWaterPatches(): void {
    const random = mulberry32(20260726);
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.InstancedMesh(
      geometry,
      this.waterPatchMaterial,
      WATER_PATCH_COUNT,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    for (let index = 0; index < WATER_PATCH_COUNT; index += 1) {
      const angle = random() * Math.PI * 2;
      this.waterPatches.push({
        offsetX: randomBetween(random, -CURRENT_FIELD_X, CURRENT_FIELD_X),
        offsetZ: randomBetween(random, -CURRENT_FIELD_Z, CURRENT_FIELD_Z),
        driftX: Math.cos(angle) * randomBetween(random, 0.04, 0.1),
        driftZ: Math.sin(angle) * randomBetween(random, 0.04, 0.1),
        scaleX: randomBetween(random, 4.5, 8.5),
        scaleZ: randomBetween(random, 2.8, 5.4),
        phase: random() * Math.PI * 2,
      });
    }
    this.waterPatchMesh = mesh;
    this.root.add(mesh);
  }

  private buildCurrentStreaks(): void {
    const random = mulberry32(20260727);
    const geometry = new THREE.TorusGeometry(
      0.72,
      0.035,
      4,
      18,
      Math.PI * 0.72,
    );
    const mesh = new THREE.InstancedMesh(
      geometry,
      this.currentMaterial,
      CURRENT_COUNT,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;

    for (let index = 0; index < CURRENT_COUNT; index += 1) {
      const angle = random() * Math.PI * 2;
      this.currentStreaks.push({
        offsetX: randomBetween(random, -CURRENT_FIELD_X, CURRENT_FIELD_X),
        offsetZ: randomBetween(random, -CURRENT_FIELD_Z, CURRENT_FIELD_Z),
        driftX: Math.cos(angle) * randomBetween(random, 0.18, 0.42),
        driftZ: Math.sin(angle) * randomBetween(random, 0.18, 0.42),
        rotation: angle + randomBetween(random, -0.3, 0.3),
        scale: randomBetween(random, 0.7, 1.45),
        phase: random() * Math.PI * 2,
      });
    }
    this.currentMesh = mesh;
    this.root.add(mesh);
  }

  private buildFishSchools(): void {
    const random = mulberry32(20260728);
    const geometry = createFishGeometry();
    const mesh = new THREE.InstancedMesh(
      geometry,
      this.fishMaterial,
      FISH_PER_SCHOOL * 4,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;

    for (let index = 0; index < 4; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = randomBetween(random, 0.48, 0.78);
      const cruiseX = Math.cos(angle) * speed;
      const cruiseZ = Math.sin(angle) * speed;
      this.fishSchools.push({
        offsetX: randomBetween(random, -FISH_FIELD_X, FISH_FIELD_X),
        offsetZ: randomBetween(random, -FISH_FIELD_Z, FISH_FIELD_Z),
        velocityX: cruiseX,
        velocityZ: cruiseZ,
        cruiseX,
        cruiseZ,
        phase: random() * Math.PI * 2,
      });
    }
    this.fishMesh = mesh;
    this.root.add(mesh);
  }

  private buildSailboats(): void {
    const random = mulberry32(20260729);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x375c69,
      roughness: 0.8,
      transparent: true,
      opacity: 0,
    });
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c653f,
      roughness: 0.88,
      transparent: true,
      opacity: 0,
    });
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff2ce,
      roughness: 0.84,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.sailMaterials.push(hullMaterial, mastMaterial, sailMaterial);

    const hullGeometry = new THREE.BoxGeometry(0.7, 0.14, 0.28);
    const mastGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.82, 6);
    const sailGeometry = createSailGeometry();

    for (let index = 0; index < 3; index += 1) {
      const root = new THREE.Group();
      root.name = `distant sailboat ${index}`;
      root.scale.setScalar(0.78 + index * 0.12);

      const hull = new THREE.Mesh(hullGeometry, hullMaterial);
      hull.position.y = 0.1;
      const mast = new THREE.Mesh(mastGeometry, mastMaterial);
      mast.position.y = 0.56;
      const sail = new THREE.Mesh(sailGeometry, sailMaterial);
      sail.position.set(0.035, 0.55, 0);
      root.add(hull, mast, sail);

      const angle = random() * Math.PI * 2;
      const speed = randomBetween(random, 0.16, 0.28);
      this.sailboats.push({
        root,
        offsetX:
          (index === 0 ? -1 : 1) * randomBetween(random, 5.2, 8.2),
        offsetZ:
          index === 2
            ? randomBetween(random, -5.5, -3.5)
            : randomBetween(random, -7, 7),
        driftX: Math.cos(angle) * speed,
        driftZ: Math.sin(angle) * speed,
        phase: random() * Math.PI * 2,
      });
      this.root.add(root);
    }
  }

  private buildDolphins(): void {
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d7189,
      roughness: 0.62,
      flatShading: true,
      transparent: true,
      opacity: 0,
    });
    const bellyMaterial = new THREE.MeshStandardMaterial({
      color: 0xa6d8dc,
      roughness: 0.72,
      flatShading: true,
      transparent: true,
      opacity: 0,
    });
    this.dolphinMaterials.push(bodyMaterial, bellyMaterial);
    const bodyGeometry = new THREE.CapsuleGeometry(0.12, 0.38, 3, 7);
    bodyGeometry.rotateX(Math.PI / 2);
    const snoutGeometry = new THREE.ConeGeometry(0.07, 0.26, 6);
    snoutGeometry.rotateX(Math.PI / 2);
    const finGeometry = new THREE.ConeGeometry(0.09, 0.22, 3);
    const flukeGeometry = createDolphinFlukeGeometry();

    for (let index = 0; index < 3; index += 1) {
      const dolphin = new THREE.Group();
      dolphin.name = `dolphin companion ${index}`;
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.scale.set(1, 0.82, 1);
      const snout = new THREE.Mesh(snoutGeometry, bellyMaterial);
      snout.position.z = 0.34;
      const dorsal = new THREE.Mesh(finGeometry, bodyMaterial);
      dorsal.position.set(0, 0.13, -0.03);
      dorsal.rotation.z = Math.PI;
      const sideFin = new THREE.Mesh(finGeometry, bodyMaterial);
      sideFin.position.set(0.12, -0.02, 0);
      sideFin.rotation.z = -Math.PI / 2;
      sideFin.scale.set(0.72, 0.72, 0.72);
      const fluke = new THREE.Mesh(flukeGeometry, bodyMaterial);
      fluke.position.set(0, 0, -0.34);
      fluke.rotation.x = -Math.PI / 2;
      dolphin.add(body, snout, dorsal, sideFin, fluke);
      dolphin.scale.setScalar(0.82 + index * 0.06);
      dolphin.visible = false;
      this.dolphins.push(dolphin);
      this.root.add(dolphin);
    }
  }
}

export function createOceanSurfaceMaterial(): THREE.MeshStandardMaterial {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create ocean surface texture.");
  }

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#5bc2da");
  gradient.addColorStop(0.48, "#53b6d2");
  gradient.addColorStop(1, "#68c7da");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const random = mulberry32(20260730);
  context.lineCap = "round";
  for (let index = 0; index < 34; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const length = randomBetween(random, 18, 54);
    const bend = randomBetween(random, -8, 8);
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(
      x + length * 0.5,
      y + bend,
      x + length,
      y + bend * 0.35,
    );
    context.strokeStyle =
      index % 3 === 0
        ? "rgba(220, 251, 247, 0.16)"
        : "rgba(25, 119, 157, 0.09)";
    context.lineWidth = randomBetween(random, 1, 2.4);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 7);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.58,
    metalness: 0.03,
  });
}

function createFishGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.24);
  shape.quadraticCurveTo(0.18, 0.08, 0, -0.16);
  shape.quadraticCurveTo(-0.18, 0.08, 0, 0.24);
  shape.moveTo(0, -0.13);
  shape.lineTo(0.18, -0.34);
  shape.lineTo(0, -0.27);
  shape.lineTo(-0.18, -0.34);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 3);
}

function createSailGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.34);
  shape.lineTo(0, -0.33);
  shape.quadraticCurveTo(0.34, -0.18, 0.42, -0.3);
  shape.lineTo(0.08, 0.28);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 4);
}

function createDolphinFlukeGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.08);
  shape.lineTo(0.34, 0.2);
  shape.lineTo(0.22, -0.04);
  shape.lineTo(0, -0.1);
  shape.lineTo(-0.22, -0.04);
  shape.lineTo(-0.34, 0.2);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 3);
}

function wrapField(value: number, half: number): number {
  const span = half * 2;
  return (((value + half) % span) + span) % span - half;
}

function randomBetween(
  random: () => number,
  minimum: number,
  maximum: number,
): number {
  return minimum + random() * (maximum - minimum);
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
