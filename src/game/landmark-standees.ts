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
  "pompeii",
  "burj-khalifa",
  "sagrada-familia",
  "leaning-tower-of-pisa",
  "stonehenge",
  "golden-gate-bridge",
  "uluru",
  "grand-prismatic-spring",
  "victoria-falls",
  "great-barrier-reef",
  "pointe-du-hoc",
  "hiroshima-peace-memorial",
  "lake-baikal",
  "lena-pillars",
  "persepolis",
  "hegra",
  "samarra-minaret",
  "lake-louise",
  "teotihuacan",
  "panama-canal",
  "iguazu-falls",
  "salar-de-uyuni",
  "torres-del-paine",
  "fish-river-canyon",
  "drakensberg",
  "lalibela",
  "great-mosque-djenne",
  "registan",
]);

/** True when the landmark ships a hand-drawn WebP placard illustration. */
export function hasLandmarkIllustration(id: PhotoSpotId): boolean {
  return GENERATED_LANDMARK_IDS.has(id);
}

/** Base-URL-aware path to a landmark's placard illustration. */
export function landmarkIllustrationUrl(id: PhotoSpotId): string {
  return `${import.meta.env.BASE_URL}assets/landmarks/placard/${id}.webp`;
}

const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Bolivia: "🇧🇴",
  Brazil: "🇧🇷",
  Cambodia: "🇰🇭",
  Canada: "🇨🇦",
  Chile: "🇨🇱",
  China: "🇨🇳",
  Egypt: "🇪🇬",
  Ethiopia: "🇪🇹",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Greece: "🇬🇷",
  India: "🇮🇳",
  Indonesia: "🇮🇩",
  Iran: "🇮🇷",
  Iraq: "🇮🇶",
  Italy: "🇮🇹",
  Japan: "🇯🇵",
  Jordan: "🇯🇴",
  Mali: "🇲🇱",
  Mexico: "🇲🇽",
  Namibia: "🇳🇦",
  Nepal: "🇳🇵",
  Norway: "🇳🇴",
  Panama: "🇵🇦",
  Peru: "🇵🇪",
  Russia: "🇷🇺",
  "Saudi Arabia": "🇸🇦",
  "South Africa": "🇿🇦",
  Spain: "🇪🇸",
  Switzerland: "🇨🇭",
  Turkey: "🇹🇷",
  Uzbekistan: "🇺🇿",
  "United Arab Emirates": "🇦🇪",
  "United Kingdom": "🇬🇧",
  "United States of America": "🇺🇸",
  Zimbabwe: "🇿🇼",
};

const textureLoader = new THREE.TextureLoader();
const LANDMARK_TEXTURE_LOAD_RADIUS = 18;

export interface LandmarkStandeeView {
  readonly root: THREE.Group;
  readonly fadeMaterials: THREE.Material[];
  readonly swayPhase: number;
  readonly baseLean: number;
  readonly anchorX: number;
  readonly anchorZ: number;
  readonly spot: PhotoSpotDefinition;
  readonly artMaterial: THREE.MeshBasicMaterial;
  readonly fallbackTexture: THREE.CanvasTexture;
  textureRequested: boolean;
}

export function createLandmarkStandee(
  spot: PhotoSpotDefinition,
  accent: THREE.ColorRepresentation,
  anchor: { x: number; z: number },
): LandmarkStandeeView {
  const root = new THREE.Group();
  root.name = `${spot.id} rigid illustration placard`;

  const boardSize = 2.9;
  const boardBottom = 0.65;
  const boardCenterY = boardBottom + boardSize / 2;
  const supportOffset = 0.72;
  const supportHeight = boardBottom + 0.28;

  const boardMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff4d8,
    roughness: 0.86,
    metalness: 0,
    transparent: true,
    opacity: 1,
    flatShading: true,
  });
  boardMaterial.userData.baseOpacity = 1;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(boardSize, boardSize, 0.1),
    boardMaterial,
  );
  board.name = `${spot.id} rigid square board`;
  board.position.set(0, boardCenterY, -0.035);
  root.add(board);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x674b36,
    roughness: 0.72,
    metalness: 0.02,
    transparent: true,
    opacity: 1,
    flatShading: true,
  });
  frameMaterial.userData.baseOpacity = 1;

  const frameOffset = boardSize / 2 - 0.055;
  const horizontalFrameGeometry = new THREE.BoxGeometry(
    boardSize + 0.08,
    0.1,
    0.09,
  );
  const verticalFrameGeometry = new THREE.BoxGeometry(
    0.1,
    boardSize + 0.08,
    0.09,
  );
  const topRail = new THREE.Mesh(horizontalFrameGeometry, frameMaterial);
  const bottomRail = new THREE.Mesh(horizontalFrameGeometry, frameMaterial);
  const leftRail = new THREE.Mesh(verticalFrameGeometry, frameMaterial);
  const rightRail = new THREE.Mesh(verticalFrameGeometry, frameMaterial);
  topRail.position.set(0, boardCenterY + frameOffset, 0.055);
  bottomRail.position.set(0, boardCenterY - frameOffset, 0.055);
  leftRail.position.set(-frameOffset, boardCenterY, 0.055);
  rightRail.position.set(frameOffset, boardCenterY, 0.055);
  root.add(topRail, bottomRail, leftRail, rightRail);

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
  art.name = `${spot.id} square placard artwork`;
  art.scale.set(2.68, 2.68, 1);
  art.position.set(0, boardCenterY, 0.108);
  art.renderOrder = 2;
  root.add(art);

  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x674b36,
    roughness: 0.68,
    metalness: 0.04,
    transparent: true,
    opacity: 1,
    flatShading: true,
  });
  poleMaterial.userData.baseOpacity = 1;
  const supportGeometry = new THREE.CylinderGeometry(
    0.055,
    0.065,
    supportHeight,
    10,
  );
  const leftSupport = new THREE.Mesh(
    supportGeometry,
    poleMaterial,
  );
  leftSupport.name = `${spot.id} left centered support`;
  leftSupport.position.set(-supportOffset, supportHeight / 2, -0.105);
  const rightSupport = new THREE.Mesh(
    supportGeometry,
    poleMaterial,
  );
  rightSupport.name = `${spot.id} right centered support`;
  rightSupport.position.set(supportOffset, supportHeight / 2, -0.105);

  const supportRail = new THREE.Mesh(
    new THREE.BoxGeometry(supportOffset * 2 + 0.18, 0.075, 0.09),
    poleMaterial,
  );
  supportRail.name = `${spot.id} centered support rail`;
  supportRail.position.set(0, boardBottom - 0.055, -0.075);
  root.add(leftSupport, rightSupport, supportRail);

  return {
    root,
    fadeMaterials: [
      artMaterial,
      boardMaterial,
      frameMaterial,
      poleMaterial,
    ],
    swayPhase: createStablePhase(spot.id),
    baseLean: createStableLean(spot.id),
    anchorX: anchor.x,
    anchorZ: anchor.z,
    spot,
    artMaterial,
    fallbackTexture,
    textureRequested: false,
  };
}

export function updateLandmarkStandeeOverview(
  standee: LandmarkStandeeView,
  overviewBlend: number,
  elapsed: number,
  distanceToPlayer: number,
): void {
  if (
    !standee.textureRequested &&
    distanceToPlayer <= LANDMARK_TEXTURE_LOAD_RADIUS
  ) {
    requestLandmarkTexture(standee);
  }

  standee.root.rotation.z =
    standee.baseLean + Math.sin(elapsed * 0.72 + standee.swayPhase) * 0.008;

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

function requestLandmarkTexture(standee: LandmarkStandeeView): void {
  standee.textureRequested = true;
  if (!GENERATED_LANDMARK_IDS.has(standee.spot.id)) {
    return;
  }

  textureLoader.load(
    landmarkIllustrationUrl(standee.spot.id),
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 4;
      texture.needsUpdate = true;

      standee.artMaterial.map = texture;
      standee.artMaterial.needsUpdate = true;
      standee.fallbackTexture.dispose();
    },
    undefined,
    () => {
      console.warn(
        `Unable to load illustration for ${standee.spot.id}; keeping the flag card.`,
      );
    },
  );
}

function createStablePhase(id: string): number {
  return (hashId(id) % 628) / 100;
}

function createStableLean(id: string): number {
  return ((hashId(id) % 7) - 3) * 0.004;
}

function hashId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function createFlagCardTexture(
  spot: PhotoSpotDefinition,
  accent: THREE.ColorRepresentation,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create landmark flag-card canvas.");
  }

  const accentColor = `#${new THREE.Color(accent).getHexString()}`;
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.save();
  roundedRectPath(context, 16, 16, 480, 480, 30);
  context.fillStyle = "#fff4d8";
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = "#5a4637";
  context.stroke();
  context.clip();

  context.fillStyle = accentColor;
  context.fillRect(16, 16, 480, 132);
  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  context.fillRect(16, 120, 480, 28);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font =
    '88px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  context.fillStyle = "#ffffff";
  context.fillText(
    COUNTRY_FLAGS[spot.atlasCountryName] ?? "🌍",
    canvas.width / 2,
    83,
  );

  const nameLines = splitName(spot.name);
  const fontSize = fitFontSize(context, nameLines, 420, 54, 32);
  context.font =
    `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
  context.fillStyle = "#3e332b";
  const lineHeight = fontSize * 1.28;
  const blockHeight = lineHeight * nameLines.length;
  const firstLineY = 292 - blockHeight / 2 + lineHeight / 2;
  nameLines.forEach((line, index) => {
    context.fillText(
      line,
      canvas.width / 2,
      firstLineY + index * lineHeight,
    );
  });

  context.font =
    '600 24px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
  context.fillStyle = accentColor;
  context.fillText("插画待补", canvas.width / 2, 414);

  context.fillStyle = "#5a4637";
  context.fillRect(116, 456, 280, 8);
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
