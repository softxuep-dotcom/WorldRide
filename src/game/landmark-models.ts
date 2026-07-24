import * as THREE from "three";
import type { PhotoSpotDefinition } from "./data";

type Position = readonly [number, number, number];
type Rotation = readonly [number, number, number];
type Scale = readonly [number, number, number];

interface PartTransform {
  position: Position;
  rotation?: Rotation;
  scale?: Scale;
}

const material = (
  color: number,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
    ...options,
  });

const palette = {
  paleStone: material(0xe5d4aa),
  warmStone: material(0xc8a36b),
  darkStone: material(0x796f62),
  whiteStone: material(0xf1ead8),
  sandstone: material(0xd2aa63),
  brick: material(0x9d6048),
  slate: material(0x48565f),
  dark: material(0x35464b),
  snow: material(0xf4f6e9),
  mountain: material(0x637b6c),
  mountainDark: material(0x4c685d),
  grass: material(0x6f9c5d),
  forest: material(0x347459),
  forestLight: material(0x5b9663),
  trunk: material(0x825d3f),
  gold: material(0xe4b84d, {
    emissive: 0x8b5416,
    emissiveIntensity: 0.18,
    roughness: 0.55,
  }),
  bronze: material(0x90744d, { metalness: 0.22, roughness: 0.62 }),
  copper: material(0x3f9b83, { metalness: 0.08, roughness: 0.72 }),
  red: material(0xc65f45),
  blue: material(0x4c83a0),
  glass: material(0x72a7b2, {
    transparent: true,
    opacity: 0.78,
    roughness: 0.26,
  }),
  water: material(0x4caabd, {
    transparent: true,
    opacity: 0.72,
    roughness: 0.28,
  }),
  smoke: material(0xd5d4c9, {
    transparent: true,
    opacity: 0.72,
    roughness: 1,
  }),
};

class LandmarkBuilder {
  readonly root = new THREE.Group();
  private partCount = 0;
  private readonly matrixHelper = new THREE.Object3D();

  add(
    geometry: THREE.BufferGeometry,
    partMaterial: THREE.Material,
    position: Position,
    rotation: Rotation = [0, 0, 0],
    scale: Scale = [1, 1, 1],
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, partMaterial);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.root.add(mesh);
    this.partCount += 1;
    return mesh;
  }

  addInstances(
    geometry: THREE.BufferGeometry,
    partMaterial: THREE.Material,
    transforms: readonly PartTransform[],
    name: string,
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(
      geometry,
      partMaterial,
      transforms.length,
    );
    mesh.name = name;
    transforms.forEach((transform, index) => {
      this.matrixHelper.position.set(...transform.position);
      this.matrixHelper.rotation.set(...(transform.rotation ?? [0, 0, 0]));
      this.matrixHelper.scale.set(...(transform.scale ?? [1, 1, 1]));
      this.matrixHelper.updateMatrix();
      mesh.setMatrixAt(index, this.matrixHelper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    this.root.add(mesh);
    this.partCount += transforms.length;
    return mesh;
  }

  finish(name: string): THREE.Group {
    if (this.partCount < 30) {
      throw new Error(
        `${name} has ${this.partCount} visible parts; expected at least 30.`,
      );
    }
    this.root.name = `${name} detailed landmark`;
    this.root.userData.detailPartCount = this.partCount;
    return this.root;
  }
}

const box = (x: number, y: number, z: number): THREE.BoxGeometry =>
  new THREE.BoxGeometry(x, y, z);

const cylinder = (
  top: number,
  bottom: number,
  height: number,
  segments = 8,
): THREE.CylinderGeometry =>
  new THREE.CylinderGeometry(top, bottom, height, segments);

const cone = (radius: number, height: number, segments = 8): THREE.ConeGeometry =>
  new THREE.ConeGeometry(radius, height, segments);

const sphere = (radius: number, detail = 0): THREE.BufferGeometry =>
  detail === 0
    ? new THREE.IcosahedronGeometry(radius, 1)
    : new THREE.SphereGeometry(radius, 10, 6);

function buildGizaPyramids(): THREE.Group {
  const b = new LandmarkBuilder();
  const pyramidGeometry = cone(0.72, 1.18, 4);
  b.add(pyramidGeometry, palette.sandstone, [-0.3, 0.59, 0], [0, Math.PI / 4, 0]);
  b.add(cone(0.52, 0.86, 4), palette.warmStone, [0.65, 0.43, 0.18], [0, Math.PI / 4, 0]);
  b.add(cone(0.36, 0.62, 4), palette.paleStone, [0.2, 0.31, -0.68], [0, Math.PI / 4, 0]);

  b.addInstances(
    box(1, 0.035, 1),
    palette.paleStone,
    Array.from({ length: 7 }, (_, index) => ({
      position: [-0.3, 0.035 + index * 0.075, 0] as Position,
      scale: [1.35 - index * 0.095, 1, 1.35 - index * 0.095] as Scale,
    })),
    "Great Pyramid stone courses",
  );
  b.addInstances(
    cone(0.15, 0.26, 4),
    palette.warmStone,
    [-0.25, 0, 0.25].map((z, index) => ({
      position: [-0.95 + index * 0.28, 0.13, -0.65 + z] as Position,
      rotation: [0, Math.PI / 4, 0] as Rotation,
    })),
    "Queens pyramids",
  );
  b.addInstances(
    box(0.18, 0.045, 0.16),
    palette.darkStone,
    Array.from({ length: 9 }, (_, index) => ({
      position: [-0.85 + index * 0.2, 0.03, 0.78] as Position,
      rotation: [0, -0.08, 0] as Rotation,
    })),
    "Pyramid causeway stones",
  );

  b.add(box(0.55, 0.25, 0.26), palette.sandstone, [0.82, 0.14, -0.58]);
  b.add(sphere(0.18), palette.sandstone, [0.58, 0.24, -0.58], [0, 0, 0], [1.4, 1, 1]);
  b.add(sphere(0.13), palette.warmStone, [0.45, 0.38, -0.58]);
  b.add(cone(0.17, 0.22, 4), palette.paleStone, [0.45, 0.48, -0.58], [0, Math.PI / 4, 0]);
  b.addInstances(
    box(0.35, 0.09, 0.08),
    palette.sandstone,
    [
      { position: [0.55, 0.07, -0.76] },
      { position: [0.55, 0.07, -0.4] },
    ],
    "Sphinx paws",
  );
  b.addInstances(
    cylinder(0.035, 0.045, 0.34, 6),
    palette.paleStone,
    Array.from({ length: 6 }, (_, index) => ({
      position: [-0.45 + index * 0.17, 0.17, 0.94] as Position,
    })),
    "Valley temple columns",
  );
  b.add(box(1.08, 0.09, 0.16), palette.warmStone, [-0.02, 0.38, 0.94]);
  return b.finish("Giza Pyramids");
}

function buildMountFuji(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(cone(0.96, 1.55, 12), palette.mountain, [0, 0.76, 0.15]);
  b.add(cone(0.78, 0.72, 12), palette.mountainDark, [0, 0.38, 0.15]);
  b.add(cone(0.38, 0.55, 12), palette.snow, [0, 1.3, 0.15]);
  b.add(
    new THREE.TorusGeometry(0.13, 0.035, 5, 14),
    palette.darkStone,
    [0, 1.57, 0.15],
    [Math.PI / 2, 0, 0],
  );

  const treePositions = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    const radius = 0.82 + (index % 3) * 0.14;
    return {
      position: [
        Math.cos(angle) * radius,
        0.11,
        0.15 + Math.sin(angle) * radius,
      ] as Position,
    };
  });
  b.addInstances(
    cylinder(0.025, 0.035, 0.22, 5),
    palette.trunk,
    treePositions,
    "Fuji forest trunks",
  );
  b.addInstances(
    cone(0.12, 0.34, 6),
    palette.forest,
    treePositions.map(({ position }) => ({
      position: [position[0], 0.32, position[2]] as Position,
    })),
    "Fuji forest crowns",
  );

  for (let level = 0; level < 4; level += 1) {
    b.add(
      box(0.27 - level * 0.035, 0.12, 0.22 - level * 0.025),
      level % 2 === 0 ? palette.red : palette.whiteStone,
      [-0.72, 0.12 + level * 0.16, -0.55],
    );
    b.add(
      cone(0.25 - level * 0.035, 0.1, 4),
      palette.slate,
      [-0.72, 0.23 + level * 0.16, -0.55],
      [0, Math.PI / 4, 0],
    );
  }
  b.add(cylinder(0.018, 0.025, 0.38, 5), palette.gold, [-0.72, 0.88, -0.55]);
  b.addInstances(
    box(0.05, 0.5, 0.05),
    palette.red,
    [
      { position: [0.7, 0.25, -0.58] },
      { position: [1.0, 0.25, -0.58] },
    ],
    "Torii pillars",
  );
  b.add(box(0.52, 0.06, 0.07), palette.red, [0.85, 0.49, -0.58]);
  b.add(box(0.66, 0.055, 0.08), palette.red, [0.85, 0.59, -0.58]);
  b.add(box(2.25, 0.025, 0.48), palette.water, [0, 0.01, -0.95]);
  return b.finish("Mount Fuji");
}

function buildSwissAlps(): THREE.Group {
  const b = new LandmarkBuilder();
  const peaks: readonly Position[] = [
    [-0.62, 0.72, 0.18],
    [0.18, 0.9, 0.3],
    [0.72, 0.62, 0.12],
    [-0.05, 0.55, -0.34],
  ];
  peaks.forEach((position, index) => {
    b.add(
      cone(0.55 - index * 0.035, 1.15 + (index % 2) * 0.35, 6),
      index % 2 === 0 ? palette.mountain : palette.mountainDark,
      position,
    );
    b.add(
      cone(0.2, 0.34, 6),
      palette.snow,
      [position[0], position[1] + 0.52 + (index % 2) * 0.16, position[2]],
    );
  });

  const pinePositions = Array.from({ length: 14 }, (_, index) => ({
    position: [
      -1.0 + (index % 7) * 0.32,
      0.12,
      -0.68 + Math.floor(index / 7) * 0.24,
    ] as Position,
  }));
  b.addInstances(
    cylinder(0.018, 0.028, 0.24, 5),
    palette.trunk,
    pinePositions,
    "Alpine pine trunks",
  );
  b.addInstances(
    cone(0.11, 0.32, 6),
    palette.forest,
    pinePositions.map(({ position }) => ({
      position: [position[0], 0.34, position[2]] as Position,
    })),
    "Alpine pine crowns",
  );

  b.addInstances(
    box(0.12, 0.42, 0.12),
    palette.paleStone,
    Array.from({ length: 7 }, (_, index) => ({
      position: [-0.78 + index * 0.26, 0.21, 0.72] as Position,
    })),
    "Alpine viaduct piers",
  );
  b.add(box(1.78, 0.1, 0.18), palette.darkStone, [0, 0.47, 0.72]);
  b.add(box(0.42, 0.22, 0.24), palette.red, [-0.58, 0.63, 0.72]);
  b.add(box(0.16, 0.12, 0.18), palette.slate, [-0.82, 0.78, 0.72]);
  b.addInstances(
    box(0.3, 0.19, 0.22),
    palette.red,
    Array.from({ length: 4 }, (_, index) => ({
      position: [-0.15 + index * 0.34, 0.61, 0.72] as Position,
    })),
    "Alpine train cars",
  );
  b.addInstances(
    cylinder(0.055, 0.055, 0.04, 8),
    palette.dark,
    Array.from({ length: 10 }, (_, index) => ({
      position: [-0.68 + Math.floor(index / 2) * 0.34, 0.5, 0.6 + (index % 2) * 0.24] as Position,
      rotation: [Math.PI / 2, 0, 0] as Rotation,
    })),
    "Alpine train wheels",
  );
  return b.finish("Swiss Alps");
}

function buildBigBen(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(box(0.72, 0.12, 0.72), palette.darkStone, [0, 0.06, 0]);
  b.add(box(0.62, 0.14, 0.62), palette.warmStone, [0, 0.19, 0]);
  b.add(box(0.54, 1.15, 0.54), palette.warmStone, [0, 0.82, 0]);
  b.add(box(0.62, 0.1, 0.62), palette.paleStone, [0, 1.41, 0]);
  b.add(box(0.66, 0.48, 0.66), palette.warmStone, [0, 1.69, 0]);

  const cornerTransforms: PartTransform[] = [];
  for (const x of [-0.31, 0.31]) {
    for (const z of [-0.31, 0.31]) {
      for (let level = 0; level < 3; level += 1) {
        cornerTransforms.push({
          position: [x, 0.52 + level * 0.42, z],
          scale: [1, 1 + level * 0.06, 1],
        });
      }
    }
  }
  b.addInstances(
    cylinder(0.045, 0.06, 0.36, 6),
    palette.paleStone,
    cornerTransforms,
    "Big Ben corner buttresses",
  );
  b.addInstances(
    box(0.08, 0.2, 0.025),
    palette.dark,
    Array.from({ length: 12 }, (_, index) => ({
      position: [
        -0.2 + (index % 3) * 0.2,
        0.48 + Math.floor(index / 3) * 0.25,
        -0.286,
      ] as Position,
    })),
    "Big Ben lancet windows",
  );

  const clockFace = cylinder(0.19, 0.19, 0.035, 16);
  b.add(clockFace, palette.whiteStone, [0, 1.72, -0.35], [Math.PI / 2, 0, 0]);
  b.add(clockFace, palette.whiteStone, [0, 1.72, 0.35], [Math.PI / 2, 0, 0]);
  b.add(clockFace, palette.whiteStone, [-0.35, 1.72, 0], [0, 0, Math.PI / 2]);
  b.add(clockFace, palette.whiteStone, [0.35, 1.72, 0], [0, 0, Math.PI / 2]);
  b.add(box(0.025, 0.15, 0.025), palette.dark, [0, 1.75, -0.375], [0, 0, 0.25]);
  b.add(box(0.12, 0.022, 0.025), palette.dark, [0.04, 1.7, -0.378], [0, 0, -0.15]);

  b.add(cone(0.45, 0.58, 4), palette.slate, [0, 2.22, 0], [0, Math.PI / 4, 0]);
  b.add(cylinder(0.025, 0.045, 0.35, 6), palette.gold, [0, 2.66, 0]);
  b.addInstances(
    cone(0.07, 0.3, 4),
    palette.slate,
    [
      { position: [-0.29, 2.04, -0.29], rotation: [0, Math.PI / 4, 0] },
      { position: [0.29, 2.04, -0.29], rotation: [0, Math.PI / 4, 0] },
      { position: [-0.29, 2.04, 0.29], rotation: [0, Math.PI / 4, 0] },
      { position: [0.29, 2.04, 0.29], rotation: [0, Math.PI / 4, 0] },
    ],
    "Big Ben corner pinnacles",
  );
  b.add(box(1.2, 0.42, 0.42), palette.paleStone, [0.82, 0.28, 0.05]);
  b.addInstances(
    box(0.08, 0.18, 0.025),
    palette.glass,
    Array.from({ length: 6 }, (_, index) => ({
      position: [0.36 + index * 0.18, 0.31, -0.175] as Position,
    })),
    "Parliament windows",
  );
  return b.finish("Big Ben");
}

function buildTajMahal(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(box(1.9, 0.09, 1.35), palette.paleStone, [0, 0.045, 0]);
  b.add(box(1.62, 0.1, 1.12), palette.whiteStone, [0, 0.14, 0]);
  b.add(box(1.05, 0.68, 0.78), palette.whiteStone, [0, 0.53, 0]);
  b.add(cylinder(0.38, 0.42, 0.18, 16), palette.whiteStone, [0, 0.94, 0]);
  b.add(
    new THREE.SphereGeometry(0.43, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    palette.whiteStone,
    [0, 1.03, 0],
  );
  b.add(cylinder(0.018, 0.025, 0.34, 7), palette.gold, [0, 1.55, 0]);
  b.add(sphere(0.045), palette.gold, [0, 1.75, 0]);

  b.add(
    new THREE.TorusGeometry(0.22, 0.045, 6, 12, Math.PI),
    palette.darkStone,
    [0, 0.56, -0.415],
    [0, 0, 0],
  );
  b.add(box(0.35, 0.34, 0.035), palette.dark, [0, 0.39, -0.42]);
  b.addInstances(
    new THREE.TorusGeometry(0.11, 0.025, 5, 10, Math.PI),
    palette.warmStone,
    [-0.34, 0.34].map((x) => ({
      position: [x, 0.48, -0.415] as Position,
    })),
    "Taj Mahal side arches",
  );

  const minaretPositions: readonly Position[] = [
    [-0.78, 0, -0.52],
    [0.78, 0, -0.52],
    [-0.78, 0, 0.52],
    [0.78, 0, 0.52],
  ];
  minaretPositions.forEach(([x, , z]) => {
    b.add(cylinder(0.06, 0.085, 0.82, 10), palette.whiteStone, [x, 0.56, z]);
    b.add(cylinder(0.11, 0.11, 0.06, 10), palette.warmStone, [x, 0.82, z]);
    b.add(cylinder(0.095, 0.095, 0.05, 10), palette.warmStone, [x, 1.0, z]);
    b.add(cone(0.11, 0.22, 10), palette.whiteStone, [x, 1.16, z]);
    b.add(sphere(0.025), palette.gold, [x, 1.3, z]);
  });

  const pavilionPositions: readonly Position[] = [
    [-0.39, 0.93, -0.31],
    [0.39, 0.93, -0.31],
    [-0.39, 0.93, 0.31],
    [0.39, 0.93, 0.31],
  ];
  b.addInstances(
    cylinder(0.11, 0.13, 0.2, 10),
    palette.whiteStone,
    pavilionPositions.map((transform) => ({ position: transform })),
    "Taj Mahal corner pavilions",
  );
  b.addInstances(
    new THREE.SphereGeometry(0.14, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    palette.whiteStone,
    pavilionPositions.map(([x, y, z]) => ({
      position: [x, y + 0.1, z] as Position,
    })),
    "Taj Mahal pavilion domes",
  );
  b.add(box(0.22, 0.025, 1.65), palette.water, [0, 0.02, -1.2]);
  b.addInstances(
    sphere(0.035),
    palette.forest,
    Array.from({ length: 8 }, (_, index) => ({
      position: [
        index % 2 === 0 ? -0.32 : 0.32,
        0.05,
        -0.65 - Math.floor(index / 2) * 0.3,
      ] as Position,
    })),
    "Taj Mahal garden trees",
  );
  return b.finish("Taj Mahal");
}

function buildGibraltar(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(box(2.5, 0.025, 0.72), palette.water, [0, 0.01, 0]);

  const cliffTransforms: PartTransform[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 11; index += 1) {
      cliffTransforms.push({
        position: [
          side * (0.84 + (index % 3) * 0.16),
          0.12 + (index % 4) * 0.09,
          -0.52 + Math.floor(index / 3) * 0.29,
        ],
        scale: [1.2, 0.62 + (index % 3) * 0.2, 1],
        rotation: [0, index * 0.37, 0],
      });
    }
  }
  b.addInstances(
    new THREE.DodecahedronGeometry(0.25, 0),
    palette.darkStone,
    cliffTransforms,
    "Gibraltar cliff rocks",
  );
  b.addInstances(
    box(0.42, 0.035, 0.12),
    palette.paleStone,
    Array.from({ length: 10 }, (_, index) => ({
      position: [
        index < 5 ? -1.02 : 1.02,
        0.12 + (index % 5) * 0.085,
        -0.42 + (index % 5) * 0.2,
      ] as Position,
      rotation: [0, index < 5 ? 0.16 : -0.16, 0] as Rotation,
    })),
    "Gibraltar rock strata",
  );

  for (const x of [-0.82, 0.82]) {
    b.add(cylinder(0.055, 0.08, 0.5, 8), palette.whiteStone, [x, 0.58, -0.48]);
    b.add(cylinder(0.09, 0.09, 0.08, 8), palette.red, [x, 0.85, -0.48]);
    b.add(cone(0.11, 0.15, 8), palette.red, [x, 0.96, -0.48]);
  }
  b.add(box(0.5, 0.15, 0.2), palette.whiteStone, [0, 0.12, 0.18]);
  b.add(box(0.34, 0.12, 0.18), palette.red, [0.02, 0.25, 0.18]);
  b.add(cylinder(0.025, 0.025, 0.34, 6), palette.dark, [0, 0.48, 0.18]);
  b.add(box(0.22, 0.09, 0.08), palette.whiteStone, [0.14, 0.44, 0.18]);
  b.addInstances(
    new THREE.TorusGeometry(0.12, 0.018, 4, 10, Math.PI),
    palette.whiteStone,
    Array.from({ length: 8 }, (_, index) => ({
      position: [-0.7 + index * 0.2, 0.045, 0.44] as Position,
      rotation: [Math.PI / 2, 0, 0] as Rotation,
    })),
    "Strait wave crests",
  );
  return b.finish("Strait of Gibraltar");
}

function buildGreatWall(): THREE.Group {
  const b = new LandmarkBuilder();
  const path: readonly Position[] = [
    [-1.05, 0.22, 0.45],
    [-0.82, 0.31, 0.24],
    [-0.56, 0.38, 0.08],
    [-0.28, 0.34, -0.02],
    [0, 0.42, 0.02],
    [0.28, 0.5, 0.16],
    [0.56, 0.43, 0.32],
    [0.84, 0.48, 0.22],
    [1.08, 0.56, 0.02],
  ];
  path.forEach((position, index) => {
    const next = path[Math.min(index + 1, path.length - 1)];
    const yaw = Math.atan2(next[0] - position[0], next[2] - position[2]);
    b.add(box(0.38, 0.25, 0.22), palette.warmStone, position, [0, yaw, 0]);
  });
  b.addInstances(
    box(0.09, 0.12, 0.09),
    palette.paleStone,
    path.flatMap(([x, y, z], index) => {
      const yaw = index * 0.18;
      return [
        { position: [x - 0.08, y + 0.18, z - 0.08] as Position, rotation: [0, yaw, 0] as Rotation },
        { position: [x + 0.08, y + 0.18, z + 0.08] as Position, rotation: [0, yaw, 0] as Rotation },
      ];
    }),
    "Great Wall battlements",
  );
  for (const [x, y, z] of [path[1], path[4], path[7]]) {
    b.add(box(0.42, 0.42, 0.38), palette.darkStone, [x, y + 0.16, z]);
    b.add(box(0.5, 0.1, 0.46), palette.paleStone, [x, y + 0.42, z]);
    b.add(cone(0.38, 0.2, 4), palette.slate, [x, y + 0.57, z], [0, Math.PI / 4, 0]);
  }
  b.addInstances(
    cone(0.38, 0.55, 6),
    palette.mountain,
    Array.from({ length: 8 }, (_, index) => ({
      position: [-1.1 + index * 0.31, 0.24, 0.72 - (index % 3) * 0.2] as Position,
      scale: [1, 0.65 + (index % 2) * 0.25, 1] as Scale,
    })),
    "Great Wall mountain ridges",
  );
  return b.finish("Great Wall");
}

function buildJavaVolcanoes(): THREE.Group {
  const b = new LandmarkBuilder();
  const volcanoes: readonly Position[] = [
    [-0.55, 0.58, 0.28],
    [0.15, 0.78, 0.4],
    [0.72, 0.48, 0.18],
  ];
  volcanoes.forEach((position, index) => {
    b.add(
      cone(0.48 - index * 0.05, 1.0 + (index % 2) * 0.3, 9),
      index === 1 ? palette.mountainDark : palette.mountain,
      position,
    );
    b.add(
      new THREE.TorusGeometry(0.12, 0.035, 5, 12),
      palette.darkStone,
      [position[0], position[1] + 0.49 + (index % 2) * 0.15, position[2]],
      [Math.PI / 2, 0, 0],
    );
  });
  b.addInstances(
    sphere(0.12),
    palette.smoke,
    Array.from({ length: 6 }, (_, index) => ({
      position: [
        0.15 + Math.sin(index) * 0.08,
        1.48 + index * 0.16,
        0.4 + Math.cos(index) * 0.06,
      ] as Position,
      scale: [1 + index * 0.08, 0.7, 1] as Scale,
    })),
    "Java volcanic smoke",
  );
  const terraces = Array.from({ length: 12 }, (_, index) => ({
    position: [-0.95 + (index % 6) * 0.38, 0.035 + Math.floor(index / 6) * 0.05, -0.62] as Position,
    scale: [1, 1, 0.82 + (index % 2) * 0.15] as Scale,
  }));
  b.addInstances(box(0.32, 0.04, 0.18), palette.grass, terraces, "Java rice terraces");
  b.addInstances(
    box(0.22, 0.18, 0.2),
    palette.warmStone,
    Array.from({ length: 5 }, (_, index) => ({
      position: [-0.72 + index * 0.36, 0.13, -0.28] as Position,
    })),
    "Java village houses",
  );
  b.addInstances(
    cone(0.2, 0.16, 4),
    palette.red,
    Array.from({ length: 5 }, (_, index) => ({
      position: [-0.72 + index * 0.36, 0.3, -0.28] as Position,
      rotation: [0, Math.PI / 4, 0] as Rotation,
    })),
    "Java village roofs",
  );
  b.addInstances(
    cylinder(0.025, 0.035, 0.34, 5),
    palette.trunk,
    Array.from({ length: 8 }, (_, index) => ({
      position: [-0.9 + index * 0.26, 0.17, 0.86] as Position,
    })),
    "Java palm trunks",
  );
  b.addInstances(
    sphere(0.12),
    palette.forest,
    Array.from({ length: 8 }, (_, index) => ({
      position: [-0.9 + index * 0.26, 0.38, 0.86] as Position,
      scale: [1.4, 0.35, 0.7] as Scale,
    })),
    "Java palm crowns",
  );
  b.add(box(0.1, 0.72, 0.16), palette.brick, [-0.18, 0.36, -0.86]);
  b.add(box(0.1, 0.72, 0.16), palette.brick, [0.18, 0.36, -0.86]);
  b.add(box(0.52, 0.09, 0.18), palette.brick, [0, 0.7, -0.86]);
  return b.finish("Java Volcanoes");
}

function buildChristTheRedeemer(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(cone(1.0, 1.0, 7), palette.mountainDark, [0, 0.48, 0.12]);
  b.add(cone(0.76, 0.52, 7), palette.grass, [0, 0.66, 0.12]);
  b.add(box(0.9, 0.1, 0.6), palette.paleStone, [0, 0.9, -0.02]);
  b.add(box(0.62, 0.15, 0.42), palette.whiteStone, [0, 1.02, -0.02]);
  b.add(box(0.32, 0.48, 0.26), palette.whiteStone, [0, 1.32, -0.02]);
  b.add(cone(0.27, 0.64, 7), palette.whiteStone, [0, 1.7, -0.02]);
  b.add(sphere(0.15), palette.whiteStone, [0, 2.08, -0.02], [0, 0, 0], [0.78, 1.05, 0.82]);
  b.add(box(1.68, 0.13, 0.14), palette.whiteStone, [0, 1.88, -0.02]);
  b.addInstances(
    sphere(0.09),
    palette.whiteStone,
    [
      { position: [-0.9, 1.88, -0.02], scale: [1.4, 0.6, 0.8] },
      { position: [0.9, 1.88, -0.02], scale: [1.4, 0.6, 0.8] },
    ],
    "Christ statue hands",
  );
  b.addInstances(
    box(0.56, 0.055, 0.12),
    palette.paleStone,
    Array.from({ length: 8 }, (_, index) => ({
      position: [0, 0.96 - index * 0.055, -0.36 - index * 0.08] as Position,
    })),
    "Corcovado stairs",
  );
  const railPosts = Array.from({ length: 16 }, (_, index) => ({
    position: [
      index < 8 ? -0.48 : 0.48,
      1.04,
      -0.48 + (index % 8) * 0.14,
    ] as Position,
  }));
  b.addInstances(
    cylinder(0.018, 0.022, 0.22, 5),
    palette.bronze,
    railPosts,
    "Corcovado lookout railings",
  );
  b.addInstances(
    cone(0.11, 0.28, 6),
    palette.forest,
    Array.from({ length: 14 }, (_, index) => {
      const angle = (index / 14) * Math.PI * 2;
      return {
        position: [Math.cos(angle) * 0.78, 0.56, 0.12 + Math.sin(angle) * 0.62] as Position,
      };
    }),
    "Corcovado forest",
  );
  b.add(box(1.7, 0.02, 0.02), palette.dark, [0, 0.48, -0.72], [0, 0, -0.18]);
  b.addInstances(
    box(0.22, 0.16, 0.18),
    palette.red,
    [
      { position: [-0.5, 0.56, -0.72], rotation: [0, 0, -0.18] },
      { position: [0.52, 0.38, -0.72], rotation: [0, 0, -0.18] },
    ],
    "Corcovado cable cars",
  );
  return b.finish("Christ the Redeemer");
}

function buildSydneyOperaHouse(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(box(1.95, 0.09, 1.18), palette.darkStone, [0, 0.05, 0]);
  b.add(box(1.68, 0.12, 0.98), palette.paleStone, [0, 0.14, 0]);
  b.add(box(1.32, 0.14, 0.8), palette.whiteStone, [0, 0.25, 0]);
  b.addInstances(
    box(0.42, 0.28, 0.36),
    palette.glass,
    Array.from({ length: 5 }, (_, index) => ({
      position: [-0.72 + index * 0.36, 0.42, 0.08] as Position,
    })),
    "Opera House glass halls",
  );

  const sailGeometry = new THREE.SphereGeometry(
    0.42,
    12,
    7,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  const sailPositions: readonly PartTransform[] = [
    { position: [-0.58, 0.54, -0.08], rotation: [0, 0.45, -0.42], scale: [0.48, 1.25, 0.68] },
    { position: [-0.28, 0.65, -0.02], rotation: [0, 0.22, -0.36], scale: [0.5, 1.55, 0.72] },
    { position: [0.06, 0.7, 0.02], rotation: [0, 0, -0.3], scale: [0.52, 1.68, 0.76] },
    { position: [0.4, 0.62, 0.02], rotation: [0, -0.2, -0.36], scale: [0.5, 1.45, 0.72] },
    { position: [0.7, 0.52, -0.06], rotation: [0, -0.4, -0.42], scale: [0.46, 1.15, 0.66] },
    { position: [-0.42, 0.44, 0.32], rotation: [0, 0.3, -0.48], scale: [0.38, 1.0, 0.52] },
    { position: [0.28, 0.46, 0.34], rotation: [0, -0.28, -0.46], scale: [0.38, 1.05, 0.54] },
  ];
  b.addInstances(sailGeometry, palette.whiteStone, sailPositions, "Opera House shells");
  b.addInstances(
    box(0.025, 0.62, 0.025),
    palette.paleStone,
    Array.from({ length: 14 }, (_, index) => ({
      position: [-0.72 + (index % 7) * 0.24, 0.62, -0.14 + Math.floor(index / 7) * 0.48] as Position,
      rotation: [0, 0, -0.38 + (index % 7) * 0.12] as Rotation,
    })),
    "Opera House shell ribs",
  );
  b.addInstances(
    box(0.9, 0.035, 0.1),
    palette.paleStone,
    Array.from({ length: 7 }, (_, index) => ({
      position: [0, 0.22 - index * 0.025, -0.52 - index * 0.08] as Position,
    })),
    "Opera House forecourt steps",
  );
  b.addInstances(
    cylinder(0.025, 0.035, 0.28, 6),
    palette.darkStone,
    Array.from({ length: 10 }, (_, index) => ({
      position: [-1.05 + index * 0.24, 0.14, 0.72] as Position,
    })),
    "Sydney quay posts",
  );
  b.add(box(2.5, 0.02, 0.5), palette.water, [0, 0.01, 0.92]);
  return b.finish("Sydney Opera House");
}

function buildAcropolis(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(new THREE.DodecahedronGeometry(0.92, 0), palette.darkStone, [0, 0.28, 0], [0, 0, 0], [1.2, 0.42, 0.82]);
  b.add(box(1.82, 0.1, 1.08), palette.warmStone, [0, 0.46, 0]);
  b.add(box(1.62, 0.09, 0.92), palette.paleStone, [0, 0.55, 0]);
  b.add(box(1.42, 0.08, 0.78), palette.whiteStone, [0, 0.64, 0]);

  const columnPositions: Position[] = [];
  for (const z of [-0.3, 0.3]) {
    for (let index = 0; index < 7; index += 1) {
      columnPositions.push([-0.58 + index * 0.195, 1.05, z]);
    }
  }
  for (const x of [-0.58, 0.58]) {
    columnPositions.push([x, 1.05, -0.1], [x, 1.05, 0.1]);
  }
  b.addInstances(
    cylinder(0.045, 0.06, 0.72, 8),
    palette.whiteStone,
    columnPositions.map((position) => ({ position })),
    "Parthenon columns",
  );
  b.addInstances(
    cylinder(0.075, 0.075, 0.055, 8),
    palette.paleStone,
    columnPositions.map(([x, , z]) => ({ position: [x, 0.68, z] as Position })),
    "Parthenon column bases",
  );
  b.addInstances(
    box(0.13, 0.07, 0.13),
    palette.paleStone,
    columnPositions.map(([x, , z]) => ({ position: [x, 1.43, z] as Position })),
    "Parthenon capitals",
  );
  b.add(box(1.42, 0.11, 0.78), palette.warmStone, [0, 1.5, 0]);
  b.add(box(1.5, 0.08, 0.86), palette.paleStone, [0, 1.59, 0]);
  b.add(cone(0.48, 0.28, 3), palette.whiteStone, [0, 1.75, -0.31], [Math.PI / 2, 0, 0]);
  b.add(cone(0.48, 0.28, 3), palette.whiteStone, [0, 1.75, 0.31], [-Math.PI / 2, 0, 0]);
  b.addInstances(
    new THREE.DodecahedronGeometry(0.09, 0),
    palette.darkStone,
    Array.from({ length: 10 }, (_, index) => ({
      position: [-0.9 + (index % 5) * 0.45, 0.52, -0.6 + Math.floor(index / 5) * 1.2] as Position,
      rotation: [0, index * 0.4, 0] as Rotation,
    })),
    "Acropolis ruins",
  );
  return b.finish("Acropolis");
}

function buildBrandenburgGate(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(box(1.9, 0.08, 0.82), palette.darkStone, [0, 0.04, 0]);
  b.add(box(1.72, 0.08, 0.7), palette.paleStone, [0, 0.12, 0]);

  const columnPositions: Position[] = [];
  for (const z of [-0.24, 0.24]) {
    for (let index = 0; index < 6; index += 1) {
      columnPositions.push([-0.72 + index * 0.288, 0.62, z]);
    }
  }
  b.addInstances(
    cylinder(0.055, 0.075, 0.88, 8),
    palette.paleStone,
    columnPositions.map((position) => ({ position })),
    "Brandenburg columns",
  );
  b.addInstances(
    cylinder(0.09, 0.09, 0.08, 8),
    palette.warmStone,
    columnPositions.map(([x, , z]) => ({ position: [x, 0.18, z] as Position })),
    "Brandenburg column bases",
  );
  b.addInstances(
    box(0.15, 0.09, 0.15),
    palette.warmStone,
    columnPositions.map(([x, , z]) => ({ position: [x, 1.09, z] as Position })),
    "Brandenburg capitals",
  );
  b.add(box(1.78, 0.16, 0.68), palette.paleStone, [0, 1.18, 0]);
  b.add(box(1.6, 0.16, 0.58), palette.warmStone, [0, 1.34, 0]);
  b.add(box(1.3, 0.22, 0.5), palette.paleStone, [0, 1.52, 0]);
  b.addInstances(
    box(0.05, 0.22, 0.05),
    palette.bronze,
    Array.from({ length: 8 }, (_, index) => ({
      position: [-0.42 + (index % 4) * 0.28, 1.78, -0.12 + Math.floor(index / 4) * 0.24] as Position,
      rotation: [0, index * 0.18, 0.2] as Rotation,
    })),
    "Quadriga horse legs",
  );
  b.addInstances(
    sphere(0.11),
    palette.bronze,
    Array.from({ length: 4 }, (_, index) => ({
      position: [-0.42 + index * 0.28, 1.93, 0] as Position,
      scale: [0.65, 1.25, 0.55] as Scale,
    })),
    "Quadriga horses",
  );
  b.add(box(0.52, 0.12, 0.28), palette.bronze, [0, 1.83, 0.22]);
  b.addInstances(
    cylinder(0.11, 0.11, 0.045, 10),
    palette.dark,
    [
      { position: [-0.22, 1.79, 0.38], rotation: [Math.PI / 2, 0, 0] },
      { position: [0.22, 1.79, 0.38], rotation: [Math.PI / 2, 0, 0] },
    ],
    "Quadriga wheels",
  );
  b.add(cylinder(0.055, 0.065, 0.4, 8), palette.bronze, [0, 2.1, 0.18]);
  b.add(sphere(0.09), palette.bronze, [0, 2.34, 0.18]);
  b.add(box(0.46, 0.05, 0.06), palette.bronze, [0, 2.12, 0.18]);
  return b.finish("Brandenburg Gate");
}

function buildHagiaSophia(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(box(1.25, 0.62, 0.88), palette.warmStone, [0, 0.4, 0]);
  b.add(box(0.92, 0.3, 1.08), palette.paleStone, [0, 0.55, 0]);
  b.add(cylinder(0.44, 0.48, 0.2, 14), palette.warmStone, [0, 0.84, 0]);
  b.add(
    new THREE.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    palette.paleStone,
    [0, 0.94, 0],
  );
  const halfDomeGeometry = new THREE.SphereGeometry(
    0.28,
    10,
    6,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  b.add(halfDomeGeometry, palette.paleStone, [-0.52, 0.7, 0]);
  b.add(halfDomeGeometry, palette.paleStone, [0.52, 0.7, 0]);
  b.add(halfDomeGeometry, palette.paleStone, [0, 0.7, -0.42]);
  b.add(halfDomeGeometry, palette.paleStone, [0, 0.7, 0.42]);
  b.addInstances(
    box(0.16, 0.48, 0.18),
    palette.darkStone,
    [
      { position: [-0.6, 0.34, -0.36] },
      { position: [0.6, 0.34, -0.36] },
      { position: [-0.6, 0.34, 0.36] },
      { position: [0.6, 0.34, 0.36] },
      { position: [-0.34, 0.32, -0.52] },
      { position: [0.34, 0.32, -0.52] },
      { position: [-0.34, 0.32, 0.52] },
      { position: [0.34, 0.32, 0.52] },
    ],
    "Hagia Sophia buttresses",
  );

  const minaretPositions: readonly Position[] = [
    [-0.78, 0, -0.58],
    [0.78, 0, -0.58],
    [-0.78, 0, 0.58],
    [0.78, 0, 0.58],
  ];
  minaretPositions.forEach(([x, , z]) => {
    b.add(cylinder(0.055, 0.085, 1.22, 9), palette.paleStone, [x, 0.61, z]);
    b.add(cylinder(0.11, 0.11, 0.07, 9), palette.darkStone, [x, 0.77, z]);
    b.add(cylinder(0.095, 0.095, 0.06, 9), palette.darkStone, [x, 1.08, z]);
    b.add(cone(0.12, 0.32, 9), palette.slate, [x, 1.44, z]);
    b.add(cylinder(0.012, 0.018, 0.22, 5), palette.gold, [x, 1.7, z]);
  });
  b.addInstances(
    box(0.1, 0.16, 0.025),
    palette.glass,
    Array.from({ length: 14 }, (_, index) => ({
      position: [-0.48 + (index % 7) * 0.16, 0.42 + Math.floor(index / 7) * 0.25, -0.455] as Position,
    })),
    "Hagia Sophia windows",
  );
  return b.finish("Hagia Sophia");
}

function buildStatueOfLiberty(): THREE.Group {
  const b = new LandmarkBuilder();
  b.add(cylinder(0.9, 1.02, 0.1, 8), palette.grass, [0, 0.05, 0]);
  b.add(box(0.72, 0.12, 0.72), palette.darkStone, [0, 0.16, 0]);
  b.add(box(0.58, 0.18, 0.58), palette.warmStone, [0, 0.31, 0]);
  b.add(box(0.48, 0.52, 0.48), palette.paleStone, [0, 0.66, 0]);
  b.add(box(0.6, 0.1, 0.6), palette.warmStone, [0, 0.96, 0]);
  b.add(cone(0.28, 0.82, 7), palette.copper, [0, 1.38, 0]);
  b.add(sphere(0.15), palette.copper, [0, 1.88, 0], [0, 0, 0], [0.78, 1.05, 0.82]);

  b.add(cylinder(0.07, 0.09, 0.58, 7), palette.copper, [0.2, 1.78, 0], [0, 0, -0.32]);
  b.add(cylinder(0.055, 0.07, 0.52, 7), palette.copper, [0.35, 2.22, 0], [0, 0, -0.12]);
  b.add(cylinder(0.1, 0.12, 0.16, 8), palette.gold, [0.39, 2.52, 0]);
  b.add(cone(0.11, 0.28, 7), palette.gold, [0.39, 2.73, 0]);
  b.add(box(0.28, 0.38, 0.08), palette.copper, [-0.2, 1.58, -0.12], [0, 0, 0.12]);
  b.add(cylinder(0.055, 0.075, 0.48, 7), palette.copper, [-0.22, 1.65, 0], [0, 0, 0.3]);

  b.add(cylinder(0.18, 0.18, 0.08, 10), palette.copper, [0, 2.02, 0]);
  b.addInstances(
    cone(0.045, 0.42, 5),
    palette.copper,
    Array.from({ length: 7 }, (_, index) => {
      const angle = (index / 7) * Math.PI * 2;
      return {
        position: [Math.cos(angle) * 0.17, 2.18, Math.sin(angle) * 0.17] as Position,
        rotation: [Math.sin(angle) * 0.32, 0, -Math.cos(angle) * 0.32] as Rotation,
      };
    }),
    "Liberty crown rays",
  );
  b.addInstances(
    box(0.045, 0.5, 0.035),
    palette.copper,
    Array.from({ length: 10 }, (_, index) => ({
      position: [
        -0.18 + (index % 5) * 0.09,
        1.25 + Math.floor(index / 5) * 0.25,
        -0.2,
      ] as Position,
      rotation: [0, 0, -0.18 + (index % 5) * 0.09] as Rotation,
    })),
    "Liberty robe folds",
  );
  b.addInstances(
    cylinder(0.015, 0.02, 0.24, 5),
    palette.bronze,
    Array.from({ length: 16 }, (_, index) => {
      const angle = (index / 16) * Math.PI * 2;
      return {
        position: [Math.cos(angle) * 0.72, 0.3, Math.sin(angle) * 0.72] as Position,
      };
    }),
    "Liberty island rail posts",
  );
  b.add(new THREE.TorusGeometry(0.72, 0.015, 4, 16), palette.bronze, [0, 0.38, 0], [Math.PI / 2, 0, 0]);
  return b.finish("Statue of Liberty");
}

const BUILDERS: Partial<
  Record<PhotoSpotDefinition["id"], () => THREE.Group>
> = {
  "giza-pyramids": buildGizaPyramids,
  "fuji-view": buildMountFuji,
  "swiss-alps": buildSwissAlps,
  "big-ben": buildBigBen,
  "taj-mahal": buildTajMahal,
  "gibraltar-strait": buildGibraltar,
  "great-wall": buildGreatWall,
  "java-volcano": buildJavaVolcanoes,
  "christ-the-redeemer": buildChristTheRedeemer,
  "sydney-opera-house": buildSydneyOperaHouse,
  acropolis: buildAcropolis,
  "brandenburg-gate": buildBrandenburgGate,
  "hagia-sophia": buildHagiaSophia,
  "statue-of-liberty": buildStatueOfLiberty,
};

export function createDetailedLandmarkModel(
  id: PhotoSpotDefinition["id"],
): THREE.Group | undefined {
  return BUILDERS[id]?.();
}
