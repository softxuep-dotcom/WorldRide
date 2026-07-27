import * as THREE from "three";

/**
 * Ambient "living world" layer: things that move but never gate gameplay —
 * a few flocks of birds and blossom petals drifting on the wind.
 *
 * Everything is anchored to a moving field centred on the player, so the local
 * travel view is always populated without spawning life across the whole map.
 * Offsets wrap inside that field, which also means the east–west world wrap
 * needs no special handling here. The whole layer fades out with the overview
 * blend, exactly like the landmark standees, to keep the global map clean.
 */

interface Bird {
  readonly group: THREE.Group;
  readonly leftWing: THREE.Mesh;
  readonly rightWing: THREE.Mesh;
  offsetX: number;
  offsetZ: number;
  velocityX: number;
  velocityZ: number;
  readonly cruiseVelocityX: number;
  readonly cruiseVelocityZ: number;
  readonly baseAltitude: number;
  altitude: number;
  readonly phase: number;
  readonly flapSpeed: number;
  readonly groundBird: boolean;
  startledFor: number;
  frightCooldown: number;
}

interface Petal {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  readonly driftX: number;
  readonly driftZ: number;
  readonly fall: number;
  readonly size: number;
  spin: number;
  readonly spinSpeed: number;
  readonly tilt: number;
  readonly phase: number;
}

interface Fadeable {
  readonly material: THREE.Material & { opacity: number };
  readonly baseOpacity: number;
}

const BIRD_FIELD_X = 16;
const BIRD_FIELD_Z = 14;
const PETAL_FIELD_X = 11;
const PETAL_FIELD_Z = 9;
const PETAL_TOP = 7.5;
const PETAL_FLOOR = 0.45;
const BIRD_STARTLE_RADIUS = 3.2;
const BIRD_STARTLE_SPEED = 6.8;

export class WorldLife {
  readonly root = new THREE.Group();

  private readonly birds: Bird[] = [];
  private readonly petals: Petal[] = [];
  private petalMesh?: THREE.InstancedMesh;
  private readonly fadeables: Fadeable[] = [];
  private readonly dummy = new THREE.Object3D();
  private previousPlayerX?: number;
  private previousPlayerZ?: number;

  constructor() {
    this.root.name = "Ambient life";
    const soft = createSoftSpriteTexture();
    this.buildBirds();
    this.buildPetals(soft);
  }

  update(
    elapsed: number,
    delta: number,
    playerX: number,
    playerZ: number,
    playerVelocity: { x: number; z: number },
    overviewBlend: number,
  ): void {
    const localFactor = 1 - THREE.MathUtils.smoothstep(overviewBlend, 0.3, 0.72);
    this.root.visible = localFactor > 0.01;
    if (!this.root.visible) {
      return;
    }
    for (const fade of this.fadeables) {
      fade.material.opacity = fade.baseOpacity * localFactor;
    }

    const playerDeltaX =
      this.previousPlayerX === undefined ? 0 : playerX - this.previousPlayerX;
    const playerDeltaZ =
      this.previousPlayerZ === undefined ? 0 : playerZ - this.previousPlayerZ;
    this.previousPlayerX = playerX;
    this.previousPlayerZ = playerZ;

    this.updateBirds(
      elapsed,
      delta,
      playerX,
      playerZ,
      playerDeltaX,
      playerDeltaZ,
      playerVelocity,
    );
    this.updatePetals(elapsed, delta, playerX, playerZ);
  }

  private updateBirds(
    elapsed: number,
    delta: number,
    playerX: number,
    playerZ: number,
    playerDeltaX: number,
    playerDeltaZ: number,
    playerVelocity: { x: number; z: number },
  ): void {
    for (const bird of this.birds) {
      // Subtracting player travel keeps each bird anchored in the world until
      // it leaves the local field. The old implementation moved the whole
      // flock with the player, so the car could never actually approach it.
      const nextOffsetX =
        bird.offsetX - playerDeltaX + bird.velocityX * delta;
      const nextOffsetZ =
        bird.offsetZ - playerDeltaZ + bird.velocityZ * delta;
      const wrapped =
        Math.abs(nextOffsetX) > BIRD_FIELD_X ||
        Math.abs(nextOffsetZ) > BIRD_FIELD_Z;
      bird.offsetX = wrapField(nextOffsetX, BIRD_FIELD_X);
      bird.offsetZ = wrapField(nextOffsetZ, BIRD_FIELD_Z);
      bird.frightCooldown = Math.max(0, bird.frightCooldown - delta);

      const playerSpeed = Math.hypot(playerVelocity.x, playerVelocity.z);
      const distance = Math.hypot(bird.offsetX, bird.offsetZ);
      if (
        bird.groundBird &&
        bird.frightCooldown <= 0 &&
        playerSpeed > 0.75 &&
        distance < BIRD_STARTLE_RADIUS
      ) {
        const inverseDistance = distance > 0.01 ? 1 / distance : 0;
        const awayX =
          distance > 0.01
            ? bird.offsetX * inverseDistance
            : -playerVelocity.x / playerSpeed;
        const awayZ =
          distance > 0.01
            ? bird.offsetZ * inverseDistance
            : -playerVelocity.z / playerSpeed;
        bird.velocityX = awayX * BIRD_STARTLE_SPEED + playerVelocity.x * 0.18;
        bird.velocityZ = awayZ * BIRD_STARTLE_SPEED + playerVelocity.z * 0.18;
        bird.startledFor = 1.35;
        bird.frightCooldown = 3.4;
      }

      bird.startledFor = Math.max(0, bird.startledFor - delta);
      if (wrapped) {
        bird.startledFor = 0;
        bird.frightCooldown = 0.8;
      }
      const cruiseSmoothing = 1 - Math.exp(-1.8 * delta);
      if (bird.startledFor <= 0) {
        bird.velocityX +=
          (bird.cruiseVelocityX - bird.velocityX) * cruiseSmoothing;
        bird.velocityZ +=
          (bird.cruiseVelocityZ - bird.velocityZ) * cruiseSmoothing;
      }
      const targetAltitude =
        bird.baseAltitude + (bird.startledFor > 0 ? 3.2 : 0);
      bird.altitude +=
        (targetAltitude - bird.altitude) *
        (1 - Math.exp(-(bird.startledFor > 0 ? 7 : 2.4) * delta));

      bird.group.position.set(
        playerX + bird.offsetX,
        bird.altitude + Math.sin(elapsed * 0.6 + bird.phase) * 0.32,
        playerZ + bird.offsetZ,
      );
      bird.group.rotation.y = Math.atan2(bird.velocityX, bird.velocityZ);
      const flapMultiplier = bird.startledFor > 0 ? 1.75 : 1;
      const flap =
        Math.sin(elapsed * bird.flapSpeed * flapMultiplier + bird.phase) *
        (bird.startledFor > 0 ? 0.72 : 0.55);
      bird.leftWing.rotation.z = 0.22 + flap;
      bird.rightWing.rotation.z = -0.22 - flap;
    }
  }

  private updatePetals(
    elapsed: number,
    delta: number,
    playerX: number,
    playerZ: number,
  ): void {
    const mesh = this.petalMesh;
    if (!mesh) {
      return;
    }
    for (let index = 0; index < this.petals.length; index += 1) {
      const petal = this.petals[index];
      petal.offsetY -= petal.fall * delta;
      petal.offsetX += (petal.driftX + Math.sin(elapsed * 0.8 + petal.phase) * 0.45) * delta;
      petal.offsetZ += petal.driftZ * delta;
      if (petal.offsetY < PETAL_FLOOR) {
        petal.offsetY = PETAL_TOP;
        petal.offsetX = randomBetween(-PETAL_FIELD_X, PETAL_FIELD_X);
        petal.offsetZ = randomBetween(-PETAL_FIELD_Z, PETAL_FIELD_Z);
      }
      petal.offsetX = wrapField(petal.offsetX, PETAL_FIELD_X);
      petal.offsetZ = wrapField(petal.offsetZ, PETAL_FIELD_Z);
      petal.spin += petal.spinSpeed * delta;

      this.dummy.position.set(
        playerX + petal.offsetX,
        petal.offsetY,
        playerZ + petal.offsetZ,
      );
      this.dummy.rotation.set(petal.tilt, petal.spin, petal.spin * 0.6);
      this.dummy.scale.setScalar(petal.size);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(index, this.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private buildBirds(): void {
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x557885,
      roughness: 0.86,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x294550,
      roughness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xdba34c,
      roughness: 0.82,
      flatShading: true,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    this.fadeables.push(
      { material: wingMaterial, baseOpacity: 0.9 },
      { material: bodyMaterial, baseOpacity: 0.94 },
      { material: beakMaterial, baseOpacity: 0.94 },
    );

    const wingGeometry = createBirdWingGeometry();
    const bodyGeometry = new THREE.DodecahedronGeometry(0.17, 0);
    const headGeometry = new THREE.DodecahedronGeometry(0.105, 0);
    const tailGeometry = createBirdTailGeometry();
    const beakGeometry = new THREE.ConeGeometry(0.045, 0.14, 3);
    beakGeometry.rotateX(Math.PI / 2);

    for (let index = 0; index < 8; index += 1) {
      const group = new THREE.Group();
      group.name = `bird ${index}`;

      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.scale.x = -1;

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, 0.025, 0.015);
      body.scale.set(0.7, 0.58, 1.55);

      const head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.set(0, 0.035, 0.25);
      head.scale.set(0.92, 0.82, 1);

      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.position.set(0, 0.01, -0.22);

      const beak = new THREE.Mesh(beakGeometry, beakMaterial);
      beak.position.set(0, 0.025, 0.38);

      group.add(tail, body, head, beak, leftWing, rightWing);

      // Two loose flocks travelling in slightly different directions.
      const flock = index % 2;
      const velocityX = (flock === 0 ? 1.35 : -1.15) + randomBetween(-0.2, 0.2);
      const velocityZ = (flock === 0 ? 0.45 : 0.7) + randomBetween(-0.2, 0.2);
      const groundBird = index < 5;
      const altitude = groundBird
        ? randomBetween(0.75, 1.25)
        : randomBetween(7.5, 10.5);

      const bird: Bird = {
        group,
        leftWing,
        rightWing,
        offsetX: groundBird
          ? randomBetween(-6.5, 6.5)
          : randomBetween(-BIRD_FIELD_X, BIRD_FIELD_X),
        offsetZ: groundBird
          ? randomBetween(-8.5, -2.2)
          : randomBetween(-BIRD_FIELD_Z, BIRD_FIELD_Z),
        velocityX,
        velocityZ,
        cruiseVelocityX: velocityX,
        cruiseVelocityZ: velocityZ,
        baseAltitude: altitude,
        altitude,
        phase: randomBetween(0, Math.PI * 2),
        flapSpeed: randomBetween(6.5, 9),
        groundBird,
        startledFor: 0,
        frightCooldown: randomBetween(0.4, 1.5),
      };
      const scale = groundBird
        ? randomBetween(0.62, 0.85)
        : randomBetween(0.8, 1.15);
      group.scale.setScalar(scale);
      this.birds.push(bird);
      this.root.add(group);
    }
  }

  private buildPetals(sprite: THREE.Texture): void {
    const count = 46;
    const petalMaterial = new THREE.MeshBasicMaterial({
      map: sprite,
      color: 0xffd7e2,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    this.fadeables.push({ material: petalMaterial, baseOpacity: 0.62 });

    const petalGeometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.InstancedMesh(petalGeometry, petalMaterial, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;

    for (let index = 0; index < count; index += 1) {
      this.petals.push({
        offsetX: randomBetween(-PETAL_FIELD_X, PETAL_FIELD_X),
        offsetY: randomBetween(PETAL_FLOOR, PETAL_TOP),
        offsetZ: randomBetween(-PETAL_FIELD_Z, PETAL_FIELD_Z),
        driftX: randomBetween(0.35, 0.85),
        driftZ: randomBetween(-0.25, 0.25),
        fall: randomBetween(0.55, 1.05),
        size: randomBetween(0.13, 0.26),
        spin: randomBetween(0, Math.PI * 2),
        spinSpeed: randomBetween(-1.6, 1.6),
        tilt: randomBetween(0.2, 1.2),
        phase: randomBetween(0, Math.PI * 2),
      });
    }

    this.petalMesh = mesh;
    this.root.add(mesh);
  }
}

/**
 * A tapered wing with a notched trailing edge. It stays a single flat mesh so
 * all birds can flap cheaply, while the outline reads as feathers instead of
 * the two rectangular bars used by the first version.
 */
function createBirdWingGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0.015, 0.08);
  shape.lineTo(0.16, 0.17);
  shape.lineTo(0.48, 0.15);
  shape.lineTo(0.74, 0.035);
  shape.lineTo(0.56, -0.025);
  shape.lineTo(0.7, -0.13);
  shape.lineTo(0.44, -0.085);
  shape.lineTo(0.5, -0.215);
  shape.lineTo(0.27, -0.12);
  shape.lineTo(0.13, -0.205);
  shape.lineTo(0.035, -0.075);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 4);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** A small forked tail that makes the travel direction legible from above. */
function createBirdTailGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.115, 0.035);
  shape.lineTo(0.115, 0.035);
  shape.lineTo(0.18, -0.27);
  shape.lineTo(0, -0.17);
  shape.lineTo(-0.18, -0.27);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 3);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function createSoftSpriteTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create ambient sprite texture.");
  }
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.82)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Keeps a value inside [-half, half] by wrapping, like a toroidal field. */
function wrapField(value: number, half: number): number {
  const span = half * 2;
  return (((value + half) % span) + span) % span - half;
}

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}
