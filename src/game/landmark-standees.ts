import * as THREE from "three";
import type {
  PhotoSpotDefinition,
  PhotoSpotId,
} from "./data";

const GENERATED_LANDMARK_IDS = new Set<PhotoSpotId>([
  "gibraltar-strait",
  "big-ben",
  "brandenburg-gate",
  "colosseum",
  "acropolis",
  "swiss-alps",
  "norway-fjord",
  "giza-pyramids",
  "hagia-sophia",
  "great-wall",
  "fuji-view",
  "taj-mahal",
  "java-volcano",
  "moscow-domes",
  "eiffel-tower",
  "statue-of-liberty",
  "machu-picchu",
  "christ-the-redeemer",
  "chichen-itza",
  "petra",
  "angkor-wat",
  "sydney-opera-house",
  "grand-canyon",
  "mount-everest",
  "niagara-falls",
  "easter-island-moai",
]);

const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
  Australia: "🇦🇺",
  Brazil: "🇧🇷",
  Cambodia: "🇰🇭",
  Canada: "🇨🇦",
  Chile: "🇨🇱",
  China: "🇨🇳",
  Egypt: "🇪🇬",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Greece: "🇬🇷",
  India: "🇮🇳",
  Indonesia: "🇮🇩",
  Italy: "🇮🇹",
  Japan: "🇯🇵",
  Jordan: "🇯🇴",
  Mexico: "🇲🇽",
  Nepal: "🇳🇵",
  Norway: "🇳🇴",
  Peru: "🇵🇪",
  Russia: "🇷🇺",
  Spain: "🇪🇸",
  Switzerland: "🇨🇭",
  Turkey: "🇹🇷",
  "United Arab Emirates": "🇦🇪",
  "United Kingdom": "🇬🇧",
  "United States of America": "🇺🇸",
  Zimbabwe: "🇿🇼",
};

const textureLoader = new THREE.TextureLoader();

export interface LandmarkStandeeView {
  readonly root: THREE.Group;
  readonly fadeMaterials: THREE.Material[];
}

export function createLandmarkStandee(
  spot: PhotoSpotDefinition,
  accent: THREE.ColorRepresentation,
): LandmarkStandeeView {
  const root = new THREE.Group();
  root.name = `${spot.id} illustration standee`;

  const fallbackTexture = createFlagCardTexture(spot, accent);
  const artMaterial = new THREE.MeshBasicMaterial({
    map: fallbackTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    alphaTest: 0.025,
    depthWrite: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  artMaterial.userData.baseOpacity = 1;

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    artMaterial,
  );
  art.name = `${spot.id} standee artwork`;
  fitArtworkPlane(art, 0.75, false);
  art.renderOrder = 2;
  root.add(art);

  const footMaterial = new THREE.MeshBasicMaterial({
    color: 0x8a6744,
    transparent: true,
    opacity: 1,
    toneMapped: false,
  });
  footMaterial.userData.baseOpacity = 1;
  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.13, 0.24),
    footMaterial,
  );
  foot.name = `${spot.id} standee foot`;
  foot.position.set(0, 0.25, -0.045);
  root.add(foot);

  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x263832,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    toneMapped: false,
  });
  shadowMaterial.userData.baseOpacity = 0.14;
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.88, 28),
    shadowMaterial,
  );
  shadow.name = `${spot.id} standee shadow`;
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.3, 0.38, 1);
  shadow.position.set(0, 0.225, 0.04);
  shadow.renderOrder = 1;
  root.add(shadow);

  if (GENERATED_LANDMARK_IDS.has(spot.id)) {
    textureLoader.load(
      `assets/landmarks/${spot.id}.webp`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 4;
        texture.needsUpdate = true;

        const source = texture.image as {
          naturalWidth?: number;
          naturalHeight?: number;
          width: number;
          height: number;
        };
        const width = source.naturalWidth ?? source.width;
        const height = source.naturalHeight ?? source.height;
        fitArtworkPlane(art, width / Math.max(1, height), true);

        artMaterial.map = texture;
        artMaterial.needsUpdate = true;
        fallbackTexture.dispose();
      },
      undefined,
      () => {
        console.warn(
          `Unable to load illustration for ${spot.id}; keeping the flag card.`,
        );
      },
    );
  }

  return {
    root,
    fadeMaterials: [artMaterial, footMaterial, shadowMaterial],
  };
}

export function updateLandmarkStandeeOverview(
  standee: LandmarkStandeeView,
  overviewBlend: number,
): void {
  const opacity = 1 - THREE.MathUtils.smoothstep(overviewBlend, 0.3, 0.72);
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

function fitArtworkPlane(
  art: THREE.Mesh,
  aspect: number,
  illustration: boolean,
): void {
  const maxWidth = illustration ? 3.35 : 2.18;
  const maxHeight = illustration ? 3.2 : 2.9;
  let width = maxWidth;
  let height = width / Math.max(0.1, aspect);

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  art.scale.set(width, height, 1);
  art.position.set(0, 0.28 + height / 2, 0);
}

function createFlagCardTexture(
  spot: PhotoSpotDefinition,
  accent: THREE.ColorRepresentation,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create landmark flag-card canvas.");
  }

  const accentColor = `#${new THREE.Color(accent).getHexString()}`;
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.save();
  roundedRectPath(context, 16, 16, 352, 480, 32);
  context.fillStyle = "#fff4d8";
  context.fill();
  context.lineWidth = 12;
  context.strokeStyle = "#5a4637";
  context.stroke();
  context.clip();

  context.fillStyle = accentColor;
  context.fillRect(16, 16, 352, 142);
  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  context.fillRect(16, 130, 352, 28);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font =
    '94px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  context.fillStyle = "#ffffff";
  context.fillText(
    COUNTRY_FLAGS[spot.atlasCountryName] ?? "🌍",
    canvas.width / 2,
    98,
  );

  const nameLines = splitName(spot.name);
  const fontSize = fitFontSize(context, nameLines, 304, 48, 30);
  context.font =
    `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
  context.fillStyle = "#3e332b";
  const lineHeight = fontSize * 1.28;
  const blockHeight = lineHeight * nameLines.length;
  const firstLineY = 302 - blockHeight / 2 + lineHeight / 2;
  nameLines.forEach((line, index) => {
    context.fillText(
      line,
      canvas.width / 2,
      firstLineY + index * lineHeight,
    );
  });

  context.font =
    '600 23px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
  context.fillStyle = accentColor;
  context.fillText("插画待补", canvas.width / 2, 430);

  context.fillStyle = "#5a4637";
  context.fillRect(82, 462, 220, 9);
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function splitName(name: string): string[] {
  const centeredDot = name.indexOf("·");
  if (centeredDot > 1 && centeredDot < name.length - 2) {
    return [
      name.slice(0, centeredDot),
      name.slice(centeredDot + 1),
    ];
  }
  if (name.length <= 6) {
    return [name];
  }
  const midpoint = Math.ceil(name.length / 2);
  return [name.slice(0, midpoint), name.slice(midpoint)];
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  lines: readonly string[],
  maxWidth: number,
  initialSize: number,
  minimumSize: number,
): number {
  let size = initialSize;
  while (size > minimumSize) {
    context.font =
      `700 ${size}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
    if (lines.every((line) => context.measureText(line).width <= maxWidth)) {
      break;
    }
    size -= 2;
  }
  return size;
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const right = x + width;
  const bottom = y + height;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(right - radius, y);
  context.quadraticCurveTo(right, y, right, y + radius);
  context.lineTo(right, bottom - radius);
  context.quadraticCurveTo(right, bottom, right - radius, bottom);
  context.lineTo(x + radius, bottom);
  context.quadraticCurveTo(x, bottom, x, bottom - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
