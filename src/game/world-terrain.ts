import * as THREE from "three";
import {
  MAP_BOUNDS,
  geoToWorld,
  worldToGeo,
} from "./data";

type Rgb = readonly [red: number, green: number, blue: number];

const WORLD_TERRAIN_TEXTURE_SIZE = 1024;
let worldTerrainMaterial: THREE.MeshStandardMaterial | undefined;
let worldTerrainTexturePromise: Promise<void> | undefined;

export function getWorldTerrainMaterial(): THREE.MeshStandardMaterial {
  if (worldTerrainMaterial) {
    return worldTerrainMaterial;
  }

  worldTerrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x83a86f,
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
  });
  return worldTerrainMaterial;
}

export function loadWorldTerrainTexture(): Promise<void> {
  if (worldTerrainTexturePromise) {
    return worldTerrainTexturePromise;
  }

  const material = getWorldTerrainMaterial();
  const url = `${import.meta.env.BASE_URL}assets/generated/world-terrain.webp`;
  worldTerrainTexturePromise = new Promise((resolve) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 8;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        resolve();
      },
      undefined,
      (error) => {
        console.warn("[assets] World terrain texture could not be loaded.", error);
        resolve();
      },
    );
  });
  return worldTerrainTexturePromise;
}

export function createWorldTerrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_TERRAIN_TEXTURE_SIZE;
  canvas.height = WORLD_TERRAIN_TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create world terrain texture");
  }

  const image = context.createImageData(canvas.width, canvas.height);
  const longitudes = Array.from(
    { length: canvas.width },
    (_, x) =>
      MAP_BOUNDS.minLongitude +
      (x / (canvas.width - 1)) *
        (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude),
  );
  const northWest = geoToWorld([
    MAP_BOUNDS.minLongitude,
    MAP_BOUNDS.maxLatitude,
  ]);
  const southEast = geoToWorld([
    MAP_BOUNDS.maxLongitude,
    MAP_BOUNDS.minLatitude,
  ]);
  const latitudes = Array.from({ length: canvas.height }, (_, y) => {
    const z = THREE.MathUtils.lerp(
      northWest.z,
      southEast.z,
      y / (canvas.height - 1),
    );
    return worldToGeo(0, z)[1];
  });

  for (let y = 0; y < canvas.height; y += 1) {
    const latitude = latitudes[y];
    for (let x = 0; x < canvas.width; x += 1) {
      const longitude = longitudes[x];
      const color = getNaturalTerrainColor(longitude, latitude);
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function getNaturalTerrainColor(longitude: number, latitude: number): Rgb {
  const absoluteLatitude = Math.abs(latitude);
  const broadNoise = fractalNoise(longitude * 0.055, latitude * 0.07, 17);
  const detailNoise = fractalNoise(longitude * 0.22, latitude * 0.25, 43);
  const tropicalHumidity = Math.max(
    regionMask(longitude, latitude, -80, -46, -18, 8, 7),
    regionMask(longitude, latitude, 8, 32, -12, 7, 6),
    regionMask(longitude, latitude, 94, 145, -12, 24, 7),
  );
  const temperateHumidity = Math.max(
    regionMask(longitude, latitude, -12, 32, 42, 63, 8),
    regionMask(longitude, latitude, -130, -65, 40, 60, 9),
    regionMask(longitude, latitude, 102, 150, 22, 50, 8),
  );
  const desert = THREE.MathUtils.clamp(
    Math.max(
      regionMask(longitude, latitude, -18, 38, 13, 35, 5),
      regionMask(longitude, latitude, 34, 63, 12, 32, 5),
      regionMask(longitude, latitude, 112, 151, -39, -17, 6),
      regionMask(longitude, latitude, 12, 30, -31, -16, 5),
      regionMask(longitude, latitude, 82, 117, 35, 49, 5),
      regionMask(longitude, latitude, -122, -101, 24, 39, 5),
      regionMask(longitude, latitude, -76, -66, -29, -13, 4),
    ) *
      (0.82 + broadNoise * 0.28),
    0,
    1,
  );
  const elevation = getMountainStrength(longitude, latitude);
  const cold = THREE.MathUtils.smoothstep(absoluteLatitude, 54, 78);
  const polar = THREE.MathUtils.smoothstep(absoluteLatitude, 68, 81);

  const dryGrass: Rgb = [151, 155, 87];
  const lushGrass: Rgb = [57, 127, 70];
  const rainforest: Rgb = [28, 101, 55];
  const tundra: Rgb = [135, 145, 120];
  const desertSand: Rgb = [205, 164, 86];
  const desertRock: Rgb = [160, 111, 67];
  const mountainRock: Rgb = [116, 104, 82];
  const snow: Rgb = [224, 228, 213];

  const humidity = THREE.MathUtils.clamp(
    0.22 +
      tropicalHumidity * 0.78 +
      temperateHumidity * 0.48 +
      broadNoise * 0.27 -
      desert * 0.75,
    0,
    1,
  );
  let color = mixRgb(dryGrass, lushGrass, humidity);
  color = mixRgb(
    color,
    rainforest,
    tropicalHumidity * (1 - desert) * (0.55 + detailNoise * 0.25),
  );
  color = mixRgb(color, tundra, cold * (1 - polar));
  color = mixRgb(
    color,
    mixRgb(desertSand, desertRock, elevation * 0.5 + detailNoise * 0.18),
    desert,
  );
  color = mixRgb(color, mountainRock, elevation * (0.56 + detailNoise * 0.18));
  // Keep polar land pale, but do not paint compressed mountain ranges with a
  // high-altitude snow mask: at this map scale it reads as a thin white line.
  color = mixRgb(color, snow, polar);

  const reliefLight = 0.88 + broadNoise * 0.13 + detailNoise * 0.08;
  return [
    Math.round(THREE.MathUtils.clamp(color[0] * reliefLight, 0, 255)),
    Math.round(THREE.MathUtils.clamp(color[1] * reliefLight, 0, 255)),
    Math.round(THREE.MathUtils.clamp(color[2] * reliefLight, 0, 255)),
  ];
}

function getMountainStrength(longitude: number, latitude: number): number {
  const andesLongitude = -70.5 + (latitude + 20) * 0.035;
  const rockiesLongitude = -111 + (latitude - 42) * -0.45;
  return THREE.MathUtils.clamp(
    Math.max(
      ridgeMask(longitude, latitude, andesLongitude, -57, 12, 2.8),
      ridgeMask(longitude, latitude, rockiesLongitude, 28, 63, 4.2),
      ridgeMask(longitude, latitude, 7 + (latitude - 45) * 4.2, 43, 49, 2.4),
      ridgeMask(longitude, latitude, 87 + (latitude - 29) * 2.4, 25, 35, 5.2),
      ridgeMask(longitude, latitude, 51 + (latitude - 31) * -1.7, 24, 40, 4.3),
      ridgeMask(longitude, latitude, 37 + (latitude + 3) * 0.25, -20, 13, 4),
      ridgeMask(longitude, latitude, 145, -44, -11, 3.8),
    ),
    0,
    1,
  );
}

function ridgeMask(
  longitude: number,
  latitude: number,
  ridgeLongitude: number,
  minLatitude: number,
  maxLatitude: number,
  width: number,
): number {
  const latitudeWindow =
    smoothWindow(latitude, minLatitude, maxLatitude, 4) *
    Math.exp(-Math.pow((longitude - ridgeLongitude) / width, 2));
  return latitudeWindow;
}

function regionMask(
  longitude: number,
  latitude: number,
  minLongitude: number,
  maxLongitude: number,
  minLatitude: number,
  maxLatitude: number,
  feather: number,
): number {
  return (
    smoothWindow(longitude, minLongitude, maxLongitude, feather) *
    smoothWindow(latitude, minLatitude, maxLatitude, feather)
  );
}

function smoothWindow(
  value: number,
  minimum: number,
  maximum: number,
  feather: number,
): number {
  const enter = THREE.MathUtils.smoothstep(value, minimum - feather, minimum + feather);
  const exit =
    1 - THREE.MathUtils.smoothstep(value, maximum - feather, maximum + feather);
  return enter * exit;
}

function fractalNoise(x: number, y: number, seed: number): number {
  let amplitude = 0.58;
  let frequency = 1;
  let value = 0;
  let total = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    value += valueNoise(x * frequency, y * frequency, seed + octave * 101) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return value / total;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const top = THREE.MathUtils.lerp(
    coordinateNoise(x0, y0, seed),
    coordinateNoise(x0 + 1, y0, seed),
    sx,
  );
  const bottom = THREE.MathUtils.lerp(
    coordinateNoise(x0, y0 + 1, seed),
    coordinateNoise(x0 + 1, y0 + 1, seed),
    sx,
  );
  return THREE.MathUtils.lerp(top, bottom, sy);
}

function coordinateNoise(x: number, y: number, seed: number): number {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed * 1447;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = THREE.MathUtils.clamp(amount, 0, 1);
  return [
    THREE.MathUtils.lerp(from[0], to[0], t),
    THREE.MathUtils.lerp(from[1], to[1], t),
    THREE.MathUtils.lerp(from[2], to[2], t),
  ];
}

export function prepareWorldTerrainGeometry(
  geometry: THREE.BufferGeometry,
): void {
  applyWorldTerrainUvs(geometry);
  applyWorldTerrainVertexColors(geometry);
}

function applyWorldTerrainUvs(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  const { width, depth } = getMapDimensions();
  const northWest = geoToWorld([
    MAP_BOUNDS.minLongitude,
    MAP_BOUNDS.maxLatitude,
  ]);
  const uvs = new Float32Array(positions.count * 2);

  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = (positions.getX(index) - northWest.x) / width;
    uvs[index * 2 + 1] = 1 - (positions.getZ(index) - northWest.z) / depth;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
}

function applyWorldTerrainVertexColors(
  geometry: THREE.BufferGeometry,
): void {
  const normals = geometry.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  const surfaceColor = new THREE.Color(0xffffff);
  const edgeColor = new THREE.Color(0x52704f);
  const color = new THREE.Color();

  for (let index = 0; index < normals.count; index += 1) {
    const surfaceAmount = THREE.MathUtils.smoothstep(
      Math.abs(normals.getY(index)),
      0.35,
      0.85,
    );
    color.lerpColors(edgeColor, surfaceColor, surfaceAmount);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

export function getMapDimensions(): { width: number; depth: number } {
  const northWest = geoToWorld([
    MAP_BOUNDS.minLongitude,
    MAP_BOUNDS.maxLatitude,
  ]);
  const southEast = geoToWorld([
    MAP_BOUNDS.maxLongitude,
    MAP_BOUNDS.minLatitude,
  ]);
  return {
    width: southEast.x - northWest.x,
    depth: southEast.z - northWest.z,
  };
}
