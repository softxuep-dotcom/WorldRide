import * as THREE from "three";
import { MAP_BOUNDS, geoToWorld } from "./data";
import {
  PropInstancePool,
  type PropArchetypeId,
} from "./prop-kit";
import {
  WORLD_ECOLOGY_CELL_SIZE,
  WORLD_ECOLOGY_KIND_NAMES,
  WORLD_ECOLOGY_POINTS,
  WORLD_ECOLOGY_POINT_STRIDE,
  WORLD_ECOLOGY_QUANTIZATION,
  type WorldEcologyKind,
} from "./world-ecology-data";

const ACTIVE_CELL_RADIUS_X = 3;
const ACTIVE_CELL_RADIUS_Z = 2;
const MAP_MARKER_CLEARANCE = 2.05;
const ECOLOGY_OVERVIEW_HIDE_BLEND = 0.22;
const FIELD_POOL_CAPACITY = 48;

const PROP_CAPACITIES: Partial<Record<PropArchetypeId, number>> = {
  broadleaf: 512,
  pine: 384,
  cypress: 256,
  palm: 384,
  acacia: 384,
  townhouse: 160,
  villa: 160,
  chalet: 160,
  adobe: 160,
  dune: 384,
  rock: 512,
  "mountain-green": 256,
  "mountain-dry": 256,
  "mountain-alpine": 256,
  "meadow-lush": 256,
  "meadow-dry": 256,
};

type FieldKind = "field-green" | "field-gold";

interface FieldState {
  x: number;
  z: number;
  size: number;
  rotationY: number;
  green: boolean;
  waveTime: number;
  waveDirection: 1 | -1;
  cooldown: number;
}

/**
 * Country-independent rendering adapter for the world's decorative ecology.
 *
 * Source coordinates are generated offline. At runtime this module only keeps
 * cells around the player active and rewrites fixed-capacity instance buffers.
 */
export class WorldEcology {
  readonly root = new THREE.Group();

  private readonly props = new PropInstancePool(PROP_CAPACITIES);
  private readonly fields = new FieldInstancePool(FIELD_POOL_CAPACITY);
  private readonly pointOffsetsByCell = new Map<number, number[]>();
  private readonly minimumX: number;
  private readonly minimumZ: number;
  private readonly cellCountX: number;
  private readonly cellCountZ: number;
  private activeCellKey?: number;
  private warnedAboutOverflow = false;

  constructor(
    private readonly reservedPositions: readonly { x: number; z: number }[],
  ) {
    this.root.name = "World ecology";
    this.root.add(this.props.root, this.fields.root);

    const northWest = geoToWorld([
      MAP_BOUNDS.minLongitude,
      MAP_BOUNDS.maxLatitude,
    ]);
    const southEast = geoToWorld([
      MAP_BOUNDS.maxLongitude,
      MAP_BOUNDS.minLatitude,
    ]);
    this.minimumX = Math.min(northWest.x, southEast.x);
    this.minimumZ = Math.min(northWest.z, southEast.z);
    this.cellCountX = Math.ceil(
      Math.abs(southEast.x - northWest.x) / WORLD_ECOLOGY_CELL_SIZE,
    );
    this.cellCountZ = Math.ceil(
      Math.abs(southEast.z - northWest.z) / WORLD_ECOLOGY_CELL_SIZE,
    );
    this.indexGeneratedPoints();
  }

  update(
    delta: number,
    position: { x: number; z: number },
    velocity: { x: number; z: number },
    overviewBlend: number,
  ): void {
    const localView = overviewBlend < ECOLOGY_OVERVIEW_HIDE_BLEND;
    this.root.visible = localView;
    if (!localView) {
      return;
    }

    const cellX = this.getCellX(position.x);
    const cellZ = this.getCellZ(position.z);
    const nextCellKey = this.getCellKey(cellX, cellZ);
    if (nextCellKey !== this.activeCellKey) {
      this.activeCellKey = nextCellKey;
      this.rebuildActiveCells(cellX, cellZ);
    }

    this.fields.update(delta, position, velocity);
  }

  private indexGeneratedPoints(): void {
    for (
      let offset = 0;
      offset < WORLD_ECOLOGY_POINTS.length;
      offset += WORLD_ECOLOGY_POINT_STRIDE
    ) {
      const x =
        WORLD_ECOLOGY_POINTS[offset + 1] / WORLD_ECOLOGY_QUANTIZATION;
      const z =
        WORLD_ECOLOGY_POINTS[offset + 2] / WORLD_ECOLOGY_QUANTIZATION;
      const cellX = this.getCellX(x);
      const cellZ = this.getCellZ(z);
      const key = this.getCellKey(cellX, cellZ);
      const bucket = this.pointOffsetsByCell.get(key);
      if (bucket) {
        bucket.push(offset);
      } else {
        this.pointOffsetsByCell.set(key, [offset]);
      }
    }
  }

  private rebuildActiveCells(centerCellX: number, centerCellZ: number): void {
    this.props.beginUpdate();
    this.fields.beginUpdate();

    for (
      let cellZ = Math.max(0, centerCellZ - ACTIVE_CELL_RADIUS_Z);
      cellZ <= Math.min(this.cellCountZ - 1, centerCellZ + ACTIVE_CELL_RADIUS_Z);
      cellZ += 1
    ) {
      for (
        let cellX = Math.max(0, centerCellX - ACTIVE_CELL_RADIUS_X);
        cellX <= Math.min(this.cellCountX - 1, centerCellX + ACTIVE_CELL_RADIUS_X);
        cellX += 1
      ) {
        const offsets = this.pointOffsetsByCell.get(
          this.getCellKey(cellX, cellZ),
        );
        if (!offsets) {
          continue;
        }
        for (const offset of offsets) {
          this.activatePoint(offset);
        }
      }
    }

    const dropped = this.props.commit() + this.fields.commit();
    if (dropped > 0 && !this.warnedAboutOverflow) {
      this.warnedAboutOverflow = true;
      console.warn(
        `World ecology pools dropped ${dropped} low-priority placements. Increase pool capacity if this persists.`,
      );
    }
  }

  private activatePoint(offset: number): void {
    const kindCode = WORLD_ECOLOGY_POINTS[offset];
    const kind = WORLD_ECOLOGY_KIND_NAMES[kindCode];
    if (!kind) {
      return;
    }
    const x =
      WORLD_ECOLOGY_POINTS[offset + 1] / WORLD_ECOLOGY_QUANTIZATION;
    const z =
      WORLD_ECOLOGY_POINTS[offset + 2] / WORLD_ECOLOGY_QUANTIZATION;
    if (this.isReservedPosition(x, z)) {
      return;
    }

    const rotationY =
      (WORLD_ECOLOGY_POINTS[offset + 3] / 255) * Math.PI * 2;
    const size =
      WORLD_ECOLOGY_POINTS[offset + 4] / WORLD_ECOLOGY_QUANTIZATION;
    if (isFieldKind(kind)) {
      this.fields.place(kind, x, z, size, rotationY);
      return;
    }

    this.props.place(kind, {
      x,
      z,
      y: 0.445,
      size,
      rotationY,
    });
  }

  private isReservedPosition(x: number, z: number): boolean {
    return this.reservedPositions.some(
      (position) =>
        Math.hypot(position.x - x, position.z - z) < MAP_MARKER_CLEARANCE,
    );
  }

  private getCellX(x: number): number {
    return THREE.MathUtils.clamp(
      Math.floor((x - this.minimumX) / WORLD_ECOLOGY_CELL_SIZE),
      0,
      this.cellCountX - 1,
    );
  }

  private getCellZ(z: number): number {
    return THREE.MathUtils.clamp(
      Math.floor((z - this.minimumZ) / WORLD_ECOLOGY_CELL_SIZE),
      0,
      this.cellCountZ - 1,
    );
  }

  private getCellKey(cellX: number, cellZ: number): number {
    return cellZ * this.cellCountX + cellX;
  }
}

class FieldInstancePool {
  readonly root = new THREE.Group();

  private readonly states: FieldState[];
  private readonly soilMesh: THREE.InstancedMesh;
  private readonly greenMesh: THREE.InstancedMesh;
  private readonly goldMesh: THREE.InstancedMesh;
  private readonly groupMatrix = new THREE.Matrix4();
  private readonly stripMatrix = new THREE.Matrix4();
  private readonly worldMatrix = new THREE.Matrix4();
  private readonly hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  private readonly groupPosition = new THREE.Vector3();
  private readonly stripPosition = new THREE.Vector3();
  private readonly groupQuaternion = new THREE.Quaternion();
  private readonly stripQuaternion = new THREE.Quaternion();
  private readonly groupScale = new THREE.Vector3(1, 1, 1);
  private readonly stripScale = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private activeCount = 0;
  private droppedPlacements = 0;

  constructor(private readonly capacity: number) {
    this.root.name = "Interactive field instance pool";
    const geometry = new THREE.BoxGeometry(0.72, 0.055, 0.12);
    this.soilMesh = this.createMesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x8d6844, roughness: 1 }),
      "field-soil",
    );
    this.greenMesh = this.createMesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x739c4f, roughness: 1 }),
      "field-green",
    );
    this.goldMesh = this.createMesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xc8a64e, roughness: 1 }),
      "field-gold",
    );
    this.root.add(this.soilMesh, this.greenMesh, this.goldMesh);
    this.states = Array.from({ length: capacity }, () => ({
      x: 0,
      z: 0,
      size: 1,
      rotationY: 0,
      green: true,
      waveTime: -1,
      waveDirection: 1,
      cooldown: 0,
    }));
  }

  beginUpdate(): void {
    this.activeCount = 0;
    this.droppedPlacements = 0;
  }

  place(
    kind: FieldKind,
    x: number,
    z: number,
    size: number,
    rotationY: number,
  ): void {
    if (this.activeCount >= this.capacity) {
      this.droppedPlacements += 1;
      return;
    }
    const state = this.states[this.activeCount];
    state.x = x;
    state.z = z;
    state.size = size;
    state.rotationY = rotationY;
    state.green = kind === "field-green";
    state.waveTime = -1;
    state.waveDirection = 1;
    state.cooldown = 0;
    this.activeCount += 1;
  }

  commit(): number {
    for (let index = 0; index < this.activeCount; index += 1) {
      this.writeFieldMatrices(index);
    }
    const instanceCount = this.activeCount * 5;
    for (const mesh of [this.soilMesh, this.greenMesh, this.goldMesh]) {
      mesh.count = instanceCount;
      mesh.visible = instanceCount > 0;
      if (instanceCount > 0) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      }
    }
    return this.droppedPlacements;
  }

  update(
    delta: number,
    position: { x: number; z: number },
    velocity: { x: number; z: number },
  ): void {
    const playerSpeed = Math.hypot(velocity.x, velocity.z);
    let matricesChanged = false;

    for (let index = 0; index < this.activeCount; index += 1) {
      const field = this.states[index];
      field.cooldown = Math.max(0, field.cooldown - delta);
      if (field.waveTime >= 0) {
        field.waveTime += delta;
        if (field.waveTime > 1.75) {
          field.waveTime = -1;
        }
        this.writeFieldMatrices(index);
        matricesChanged = true;
        continue;
      }

      if (playerSpeed < 0.8 || field.cooldown > 0) {
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
      this.writeFieldMatrices(index);
      matricesChanged = true;
    }

    if (matricesChanged) {
      this.soilMesh.instanceMatrix.needsUpdate = true;
      this.greenMesh.instanceMatrix.needsUpdate = true;
      this.goldMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private writeFieldMatrices(index: number): void {
    const field = this.states[index];
    this.groupPosition.set(field.x, 0.445, field.z);
    this.groupQuaternion.setFromAxisAngle(this.up, field.rotationY);
    this.groupMatrix.compose(
      this.groupPosition,
      this.groupQuaternion,
      this.groupScale,
    );

    for (let row = 0; row < 5; row += 1) {
      const order =
        field.waveDirection === 1 ? row : 4 - row;
      const phase =
        field.waveTime < 0 ? -1 : field.waveTime * 5.5 - order * 0.42;
      const wave =
        phase > 0 && phase < Math.PI ? Math.sin(phase) : 0;
      this.stripPosition.set(
        0,
        0.035 + (row % 2) * 0.004 + wave * 0.13,
        (row - 2) * 0.14 * field.size,
      );
      this.stripQuaternion.identity();
      this.stripScale.set(
        field.size * (0.9 + (row % 2) * 0.1),
        1,
        field.size * (1 + wave * 0.16),
      );
      this.stripMatrix.compose(
        this.stripPosition,
        this.stripQuaternion,
        this.stripScale,
      );
      this.worldMatrix.multiplyMatrices(this.groupMatrix, this.stripMatrix);

      const instanceIndex = index * 5 + row;
      const soil = row % 3 === 0;
      this.soilMesh.setMatrixAt(
        instanceIndex,
        soil ? this.worldMatrix : this.hiddenMatrix,
      );
      this.greenMesh.setMatrixAt(
        instanceIndex,
        !soil && field.green ? this.worldMatrix : this.hiddenMatrix,
      );
      this.goldMesh.setMatrixAt(
        instanceIndex,
        !soil && !field.green ? this.worldMatrix : this.hiddenMatrix,
      );
    }
  }

  private createMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    name: string,
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, this.capacity * 5);
    mesh.name = name;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

function isFieldKind(kind: WorldEcologyKind): kind is FieldKind {
  return kind === "field-green" || kind === "field-gold";
}
