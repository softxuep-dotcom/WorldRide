import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Curated low-poly prop kit.
 *
 * Every archetype is baked once into a single vertex-coloured geometry, so all
 * of its instances worldwide render in one draw call through an InstancedMesh.
 * Colour lives in the vertices, which means the whole kit shares one material
 * and needs no texture atlas at all.
 *
 * To swap an archetype for an authored model later, replace its builder with a
 * loaded GLB geometry (merged and vertex-coloured the same way). Nothing else
 * in the pipeline has to change.
 */
export type PropArchetypeId =
  | "broadleaf"
  | "pine"
  | "cypress"
  | "palm"
  | "acacia"
  | "townhouse"
  | "villa"
  | "chalet"
  | "adobe"
  | "dune"
  | "rock"
  | "mountain-green"
  | "mountain-dry"
  | "mountain-alpine"
  | "meadow-lush"
  | "meadow-dry";

interface PropPart {
  geometry: THREE.BufferGeometry;
  color: number;
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: readonly [number, number, number];
}

export interface PropPlacement {
  x: number;
  z: number;
  y?: number;
  size?: number;
  rotationY?: number;
}

const PALETTE = {
  trunk: 0x8b694d,
  trunkPale: 0xa88963,
  leafDeep: 0x2f6f52,
  leafMid: 0x3f8b5f,
  leafLight: 0x63a86d,
  leafOlive: 0x6f8f56,
  leafJungle: 0x2c7a55,
  conifer: 0x2b5f4f,
  wallCream: 0xf6ead0,
  wallWhite: 0xfaf3e2,
  wallSand: 0xe2c290,
  wallOchre: 0xcfa671,
  roofCoastalBlue: 0x486b7b,
  roofSlate: 0x5b6470,
  roofWood: 0x8a5a3b,
  sand: 0xe4bd7d,
  rock: 0x8a8375,
  mountainGreen: 0x718b77,
  mountainDry: 0x9a7359,
  mountainAlpine: 0x7b8580,
  snow: 0xe3e7df,
  grass: 0x55a95f,
  grassLight: 0x83bd67,
  olive: 0x6f965c,
  sandLight: 0xf2cb75,
} as const;

function bakePart(part: PropPart): THREE.BufferGeometry {
  const geometry = part.geometry.index
    ? part.geometry.toNonIndexed()
    : part.geometry;
  if (geometry !== part.geometry) {
    part.geometry.dispose();
  }

  if (part.scale) {
    geometry.scale(part.scale[0], part.scale[1], part.scale[2]);
  }
  if (part.rotation) {
    geometry.rotateX(part.rotation[0]);
    geometry.rotateY(part.rotation[1]);
    geometry.rotateZ(part.rotation[2]);
  }
  if (part.position) {
    geometry.translate(part.position[0], part.position[1], part.position[2]);
  }

  const vertexCount = geometry.attributes.position.count;
  const colors = new Float32Array(vertexCount * 3);
  const color = new THREE.Color(part.color);
  for (let index = 0; index < vertexCount; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.deleteAttribute("uv");

  return geometry;
}

function buildProp(parts: readonly PropPart[]): THREE.BufferGeometry {
  const baked = parts.map(bakePart);
  const merged = mergeGeometries(baked, false);
  for (const geometry of baked) {
    geometry.dispose();
  }
  if (!merged) {
    throw new Error("Failed to merge prop geometry");
  }
  merged.computeVertexNormals();
  return merged;
}

/** Triangular prism used for gable roofs, ridge running along X. */
function gableGeometry(width: number, height: number, length: number): THREE.BufferGeometry {
  const prism = new THREE.CylinderGeometry(0, width, height, 3, 1);
  prism.rotateY(Math.PI / 2);
  prism.rotateZ(Math.PI / 2);
  prism.scale(length, 1, 1);
  return prism;
}

const ARCHETYPE_BUILDERS: Record<PropArchetypeId, () => THREE.BufferGeometry> = {
  broadleaf: () =>
    buildProp([
      {
        geometry: new THREE.CylinderGeometry(0.07, 0.1, 0.5, 5),
        color: PALETTE.trunk,
        position: [0, 0.25, 0],
      },
      {
        geometry: new THREE.IcosahedronGeometry(0.34, 0),
        color: PALETTE.leafMid,
        position: [0, 0.72, 0],
        scale: [1, 0.86, 1],
      },
      {
        geometry: new THREE.IcosahedronGeometry(0.24, 0),
        color: PALETTE.leafLight,
        position: [0.16, 0.92, -0.08],
      },
    ]),

  pine: () =>
    buildProp([
      {
        geometry: new THREE.CylinderGeometry(0.06, 0.09, 0.42, 5),
        color: PALETTE.trunk,
        position: [0, 0.21, 0],
      },
      {
        geometry: new THREE.ConeGeometry(0.36, 0.46, 6),
        color: PALETTE.conifer,
        position: [0, 0.58, 0],
      },
      {
        geometry: new THREE.ConeGeometry(0.28, 0.4, 6),
        color: PALETTE.leafDeep,
        position: [0, 0.86, 0],
      },
      {
        geometry: new THREE.ConeGeometry(0.18, 0.32, 6),
        color: PALETTE.conifer,
        position: [0, 1.12, 0],
      },
    ]),

  cypress: () =>
    buildProp([
      {
        geometry: new THREE.CylinderGeometry(0.05, 0.07, 0.28, 5),
        color: PALETTE.trunk,
        position: [0, 0.14, 0],
      },
      {
        geometry: new THREE.ConeGeometry(0.19, 1.15, 6),
        color: PALETTE.leafOlive,
        position: [0, 0.82, 0],
      },
      {
        geometry: new THREE.ConeGeometry(0.13, 0.5, 6),
        color: PALETTE.leafDeep,
        position: [0, 1.24, 0],
      },
    ]),

  palm: () =>
    buildProp([
      {
        geometry: new THREE.CylinderGeometry(0.055, 0.09, 1.05, 5),
        color: PALETTE.trunkPale,
        position: [0.04, 0.52, 0],
        rotation: [0, 0, -0.08],
      },
      ...[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2;
        return {
          geometry: new THREE.SphereGeometry(0.3, 5, 3),
          color: index % 2 === 0 ? PALETTE.leafJungle : PALETTE.leafMid,
          position: [
            Math.cos(angle) * 0.24,
            1.04 - Math.abs(Math.sin(angle)) * 0.05,
            Math.sin(angle) * 0.24,
          ] as const,
          scale: [1.05, 0.16, 0.42] as const,
          rotation: [0, -angle, 0.16] as const,
        };
      }),
    ]),

  acacia: () =>
    buildProp([
      {
        geometry: new THREE.CylinderGeometry(0.06, 0.11, 0.52, 5),
        color: PALETTE.trunkPale,
        position: [0, 0.26, 0],
      },
      {
        geometry: new THREE.CylinderGeometry(0.46, 0.5, 0.14, 7),
        color: PALETTE.leafOlive,
        position: [0, 0.62, 0],
      },
      {
        geometry: new THREE.CylinderGeometry(0.3, 0.36, 0.11, 7),
        color: PALETTE.leafDeep,
        position: [0.04, 0.73, -0.03],
      },
    ]),

  townhouse: () =>
    buildProp([
      {
        geometry: new THREE.BoxGeometry(0.46, 0.72, 0.42),
        color: PALETTE.wallCream,
        position: [0, 0.36, 0],
      },
      {
        geometry: gableGeometry(0.34, 0.3, 0.5),
        color: PALETTE.roofSlate,
        position: [0, 0.84, 0],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        geometry: new THREE.BoxGeometry(0.09, 0.22, 0.09),
        color: PALETTE.roofSlate,
        position: [0.13, 0.98, 0.1],
      },
    ]),

  villa: () =>
    buildProp([
      {
        geometry: new THREE.BoxGeometry(0.66, 0.44, 0.5),
        color: PALETTE.wallWhite,
        position: [0, 0.22, 0],
      },
      {
        geometry: new THREE.ConeGeometry(0.52, 0.24, 4),
        color: PALETTE.roofCoastalBlue,
        position: [0, 0.55, 0],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 0.78],
      },
      {
        geometry: new THREE.BoxGeometry(0.2, 0.26, 0.22),
        color: PALETTE.wallWhite,
        position: [0.38, 0.13, 0.14],
      },
    ]),

  chalet: () =>
    buildProp([
      {
        geometry: new THREE.BoxGeometry(0.5, 0.42, 0.44),
        color: PALETTE.roofWood,
        position: [0, 0.21, 0],
      },
      {
        geometry: new THREE.BoxGeometry(0.54, 0.1, 0.48),
        color: PALETTE.wallCream,
        position: [0, 0.46, 0],
      },
      {
        geometry: gableGeometry(0.42, 0.34, 0.62),
        color: PALETTE.roofSlate,
        position: [0, 0.66, 0],
        rotation: [0, Math.PI / 2, 0],
      },
    ]),

  adobe: () =>
    buildProp([
      {
        geometry: new THREE.BoxGeometry(0.5, 0.44, 0.46),
        color: PALETTE.wallSand,
        position: [0, 0.22, 0],
      },
      {
        geometry: new THREE.BoxGeometry(0.32, 0.3, 0.3),
        color: PALETTE.wallOchre,
        position: [0.32, 0.15, 0.14],
      },
      {
        geometry: new THREE.BoxGeometry(0.54, 0.05, 0.5),
        color: PALETTE.wallOchre,
        position: [0, 0.46, 0],
      },
    ]),

  dune: () =>
    buildProp([
      {
        geometry: new THREE.SphereGeometry(0.55, 7, 4),
        color: PALETTE.sand,
        position: [0, 0.04, 0],
        scale: [1.15, 0.34, 0.68],
      },
    ]),

  rock: () =>
    buildProp([
      {
        geometry: new THREE.DodecahedronGeometry(0.3, 0),
        color: PALETTE.rock,
        position: [0, 0.16, 0],
        scale: [1.1, 0.78, 0.95],
      },
      {
        geometry: new THREE.DodecahedronGeometry(0.16, 0),
        color: PALETTE.rock,
        position: [0.24, 0.09, 0.1],
      },
    ]),

  "mountain-green": () => buildMountain(PALETTE.mountainGreen, false),
  "mountain-dry": () => buildMountain(PALETTE.mountainDry, false),
  "mountain-alpine": () => buildMountain(PALETTE.mountainAlpine, true),

  "meadow-lush": () => buildMeadow(PALETTE.grass, PALETTE.grassLight),
  "meadow-dry": () => buildMeadow(PALETTE.olive, PALETTE.sandLight),
};

function buildMountain(color: number, snowy: boolean): THREE.BufferGeometry {
  const parts: PropPart[] = [
    {
      geometry: new THREE.ConeGeometry(0.6, 1.4, 5),
      color,
      position: [0, 0.7, 0],
    },
  ];
  if (snowy) {
    parts.push({
      geometry: new THREE.ConeGeometry(0.31, 0.5, 5),
      color: PALETTE.snow,
      position: [0, 1.22, 0],
    });
  }
  return buildProp(parts);
}

function buildMeadow(baseColor: number, highlightColor: number): THREE.BufferGeometry {
  return buildProp([
    ...[-1, 0, 1].map((offset, index) => ({
      geometry: new THREE.DodecahedronGeometry(0.28, 0),
      color: index === 1 ? highlightColor : baseColor,
      position: [offset * 0.28, 0.04, (index % 2) * 0.17] as const,
      scale: [0.9, 0.16, 0.62] as const,
      rotation: [0, index * 0.72, 0] as const,
    })),
    ...[-0.19, 0.18].map((offset) => ({
      geometry: new THREE.ConeGeometry(0.11, 0.3, 5),
      color: baseColor,
      position: [offset, 0.15, -0.12] as const,
    })),
  ]);
}

let sharedMaterial: THREE.MeshStandardMaterial | undefined;

function getPropMaterial(): THREE.MeshStandardMaterial {
  if (!sharedMaterial) {
    sharedMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0,
      flatShading: true,
    });
  }
  return sharedMaterial;
}

interface InstancePoolEntry {
  readonly mesh: THREE.InstancedMesh;
  readonly capacity: number;
  count: number;
}

/**
 * Fixed-capacity dynamic instance slots. The meshes are allocated once and
 * their matrices are rewritten only when the active ecology cells change.
 */
export class PropInstancePool {
  readonly root = new THREE.Group();
  private readonly entries = new Map<PropArchetypeId, InstancePoolEntry>();
  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly quaternion = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3();
  private readonly axis = new THREE.Vector3(0, 1, 0);
  private droppedPlacements = 0;

  constructor(capacities: Partial<Record<PropArchetypeId, number>>) {
    this.root.name = "Ecology instance pools";
    for (const [archetype, capacity] of Object.entries(capacities) as [
      PropArchetypeId,
      number,
    ][]) {
      if (capacity <= 0) {
        continue;
      }
      const mesh = new THREE.InstancedMesh(
        ARCHETYPE_BUILDERS[archetype](),
        getPropMaterial(),
        capacity,
      );
      mesh.name = `ecology:${archetype}`;
      mesh.count = 0;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.entries.set(archetype, { mesh, capacity, count: 0 });
      this.root.add(mesh);
    }
  }

  beginUpdate(): void {
    this.droppedPlacements = 0;
    for (const entry of this.entries.values()) {
      entry.count = 0;
    }
  }

  place(archetype: PropArchetypeId, placement: PropPlacement): void {
    const entry = this.entries.get(archetype);
    if (!entry || entry.count >= entry.capacity) {
      this.droppedPlacements += 1;
      return;
    }

    const size = placement.size ?? 1;
    this.position.set(placement.x, placement.y ?? 0, placement.z);
    this.quaternion.setFromAxisAngle(this.axis, placement.rotationY ?? 0);
    this.scale.setScalar(size);
    this.matrix.compose(this.position, this.quaternion, this.scale);
    entry.mesh.setMatrixAt(entry.count, this.matrix);
    entry.count += 1;
  }

  commit(): number {
    for (const entry of this.entries.values()) {
      entry.mesh.count = entry.count;
      entry.mesh.visible = entry.count > 0;
      if (entry.count > 0) {
        entry.mesh.instanceMatrix.needsUpdate = true;
        entry.mesh.computeBoundingSphere();
      }
    }
    return this.droppedPlacements;
  }
}
