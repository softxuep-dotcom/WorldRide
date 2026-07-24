import * as THREE from "three";
import type { RegionalSpecialtyDefinition } from "./regional-specialties";

const textureLoader = new THREE.TextureLoader();

const boardGeometry = new THREE.BoxGeometry(1.58, 1.58, 0.085);
const backplateGeometry = new THREE.BoxGeometry(1.72, 1.72, 0.1);
const artworkGeometry = new THREE.PlaneGeometry(1.48, 1.48);
const poleGeometry = new THREE.CylinderGeometry(0.045, 0.055, 2.18, 10);
const finialGeometry = new THREE.SphereGeometry(0.082, 12, 8);
const bracketGeometry = new THREE.BoxGeometry(0.19, 0.055, 0.07);
const footGeometry = new THREE.CylinderGeometry(0.24, 0.31, 0.13, 10);

export interface RegionalSpecialtyStandeeView {
  readonly root: THREE.Group;
  readonly fadeMaterials: THREE.Material[];
  readonly swayPhase: number;
  readonly baseLean: number;
}

export function createRegionalSpecialtyStandee(
  specialty: RegionalSpecialtyDefinition,
): RegionalSpecialtyStandeeView {
  const root = new THREE.Group();
  root.name = `${specialty.id} regional specialty placard`;
  root.userData.regionalSpecialtyId = specialty.id;

  const boardBottom = 0.42;
  const boardCenterY = boardBottom + 0.79;
  const poleX = -0.91;

  const boardMaterial = createStandardMaterial(0xf1efd7, 0.9);
  const frameMaterial = createStandardMaterial(0x245f52, 0.78);
  const poleMaterial = createStandardMaterial(0x2f806b, 0.68);
  const footMaterial = createStandardMaterial(0x7c8d70, 0.92);

  const backplate = new THREE.Mesh(backplateGeometry, frameMaterial);
  backplate.name = `${specialty.id} specialty frame`;
  backplate.position.set(0, boardCenterY, -0.04);

  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.name = `${specialty.id} specialty square board`;
  board.position.set(0, boardCenterY, 0.025);

  const artMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    alphaTest: 0.025,
    depthWrite: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  artMaterial.userData.baseOpacity = 1;
  const art = new THREE.Mesh(artworkGeometry, artMaterial);
  art.name = `${specialty.id} specialty artwork`;
  art.position.set(0, boardCenterY, 0.075);
  art.renderOrder = 2;

  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.name = `${specialty.id} short teal pole`;
  pole.position.set(poleX, 1.09, -0.11);

  const finial = new THREE.Mesh(finialGeometry, poleMaterial);
  finial.name = `${specialty.id} teal finial`;
  finial.position.set(poleX, 2.22, -0.11);

  const upperBracket = new THREE.Mesh(bracketGeometry, poleMaterial);
  upperBracket.position.set(poleX + 0.08, boardCenterY + 0.47, -0.055);
  const lowerBracket = new THREE.Mesh(bracketGeometry, poleMaterial);
  lowerBracket.position.set(poleX + 0.08, boardCenterY - 0.47, -0.055);

  const foot = new THREE.Mesh(footGeometry, footMaterial);
  foot.name = `${specialty.id} compact placard foot`;
  foot.position.set(poleX, 0.065, -0.11);

  root.add(
    backplate,
    board,
    art,
    pole,
    finial,
    upperBracket,
    lowerBracket,
    foot,
  );

  textureLoader.load(
    `assets/regional-specialties/${specialty.id}.png`,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 2;
      texture.needsUpdate = true;
      artMaterial.map = texture;
      artMaterial.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn(`Unable to load regional specialty art for ${specialty.id}.`);
    },
  );

  return {
    root,
    fadeMaterials: [
      artMaterial,
      boardMaterial,
      frameMaterial,
      poleMaterial,
      footMaterial,
    ],
    swayPhase: createStablePhase(specialty.id),
    baseLean: createStableLean(specialty.id),
  };
}

export function updateRegionalSpecialtyStandeeOverview(
  standee: RegionalSpecialtyStandeeView,
  overviewBlend: number,
  elapsed: number,
): void {
  standee.root.rotation.z =
    standee.baseLean + Math.sin(elapsed * 0.66 + standee.swayPhase) * 0.006;

  const opacity = 1 - THREE.MathUtils.smoothstep(overviewBlend, 0.12, 0.48);
  standee.root.visible = opacity > 0.01;

  for (const material of standee.fadeMaterials) {
    if (
      material instanceof THREE.MeshBasicMaterial ||
      material instanceof THREE.MeshStandardMaterial
    ) {
      const baseOpacity =
        typeof material.userData.baseOpacity === "number"
          ? material.userData.baseOpacity
          : 1;
      material.opacity = baseOpacity * opacity;
      material.transparent = true;
    }
  }
}

function createStandardMaterial(
  color: THREE.ColorRepresentation,
  roughness: number,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
    transparent: true,
    opacity: 1,
    flatShading: true,
  });
  material.userData.baseOpacity = 1;
  return material;
}

function createStablePhase(id: string): number {
  return (hashId(id) % 628) / 100;
}

function createStableLean(id: string): number {
  return ((hashId(id) % 7) - 3) * 0.003;
}

function hashId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash;
}
