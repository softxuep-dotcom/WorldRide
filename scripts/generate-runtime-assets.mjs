import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const TERRAIN_SIZE = 1024;
const MIN_LATITUDE = -82;
const MAX_LATITUDE = 82;

const terrainPath = resolve("public/assets/generated/world-terrain.webp");
const legacyTerrainPath = resolve(
  "public/assets/generated/world-terrain.png",
);

mkdirSync(dirname(terrainPath), { recursive: true });
rmSync(legacyTerrainPath, { force: true });

await sharp(createTerrainPixels(), {
  raw: {
    width: TERRAIN_SIZE,
    height: TERRAIN_SIZE,
    channels: 4,
  },
})
  .webp({
    quality: 80,
    effort: 6,
    smartSubsample: true,
  })
  .toFile(terrainPath);

console.log(`Generated ${terrainPath}`);

function createTerrainPixels() {
  const rowStride = TERRAIN_SIZE * 4;
  const pixels = Buffer.allocUnsafe(rowStride * TERRAIN_SIZE);

  for (let y = 0; y < TERRAIN_SIZE; y += 1) {
    const rowOffset = y * rowStride;
    const mercatorY = lerp(
      latitudeToMercator(MAX_LATITUDE),
      latitudeToMercator(MIN_LATITUDE),
      y / (TERRAIN_SIZE - 1),
    );
    const latitude = mercatorToLatitude(mercatorY);

    for (let x = 0; x < TERRAIN_SIZE; x += 1) {
      const longitude = lerp(-180, 180, x / (TERRAIN_SIZE - 1));
      const color = getNaturalTerrainColor(longitude, latitude);
      const offset = rowOffset + x * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  return pixels;
}

function getNaturalTerrainColor(longitude, latitude) {
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
  const desert = clamp(
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
  const cold = smoothstep(absoluteLatitude, 54, 78);
  const polar = smoothstep(absoluteLatitude, 68, 81);
  const humidity = clamp(
    0.22 +
      tropicalHumidity * 0.78 +
      temperateHumidity * 0.48 +
      broadNoise * 0.27 -
      desert * 0.75,
    0,
    1,
  );

  let color = mixRgb([151, 155, 87], [57, 127, 70], humidity);
  color = mixRgb(
    color,
    [28, 101, 55],
    tropicalHumidity * (1 - desert) * (0.55 + detailNoise * 0.25),
  );
  color = mixRgb(color, [135, 145, 120], cold * (1 - polar));
  color = mixRgb(
    color,
    mixRgb([205, 164, 86], [160, 111, 67], elevation * 0.5 + detailNoise * 0.18),
    desert,
  );
  color = mixRgb(
    color,
    [116, 104, 82],
    elevation * (0.56 + detailNoise * 0.18),
  );
  color = mixRgb(color, [224, 228, 213], polar);
  const reliefLight = 0.88 + broadNoise * 0.13 + detailNoise * 0.08;
  return color.map((channel) =>
    Math.round(clamp(channel * reliefLight, 0, 255)),
  );
}

function getMountainStrength(longitude, latitude) {
  const andesLongitude = -70.5 + (latitude + 20) * 0.035;
  const rockiesLongitude = -111 + (latitude - 42) * -0.45;
  return clamp(
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
  longitude,
  latitude,
  ridgeLongitude,
  minLatitude,
  maxLatitude,
  width,
) {
  return (
    smoothWindow(latitude, minLatitude, maxLatitude, 4) *
    Math.exp(-Math.pow((longitude - ridgeLongitude) / width, 2))
  );
}

function regionMask(
  longitude,
  latitude,
  minLongitude,
  maxLongitude,
  minLatitude,
  maxLatitude,
  feather,
) {
  return (
    smoothWindow(longitude, minLongitude, maxLongitude, feather) *
    smoothWindow(latitude, minLatitude, maxLatitude, feather)
  );
}

function smoothWindow(value, minimum, maximum, feather) {
  return (
    smoothstep(value, minimum - feather, minimum + feather) *
    (1 - smoothstep(value, maximum - feather, maximum + feather))
  );
}

function fractalNoise(x, y, seed) {
  let amplitude = 0.58;
  let frequency = 1;
  let value = 0;
  let total = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    value +=
      valueNoise(x * frequency, y * frequency, seed + octave * 101) *
      amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return value / total;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  return lerp(
    lerp(
      coordinateNoise(x0, y0, seed),
      coordinateNoise(x0 + 1, y0, seed),
      sx,
    ),
    lerp(
      coordinateNoise(x0, y0 + 1, seed),
      coordinateNoise(x0 + 1, y0 + 1, seed),
      sx,
    ),
    sy,
  );
}

function coordinateNoise(x, y, seed) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed * 1447;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function mixRgb(from, to, amount) {
  const value = clamp(amount, 0, 1);
  return from.map((channel, index) => lerp(channel, to[index], value));
}

function latitudeToMercator(latitude) {
  const radians = (clamp(latitude, MIN_LATITUDE, MAX_LATITUDE) * Math.PI) / 180;
  return (Math.log(Math.tan(Math.PI / 4 + radians / 2)) * 180) / Math.PI;
}

function mercatorToLatitude(mercatorLatitude) {
  const radians =
    2 * Math.atan(Math.exp((mercatorLatitude * Math.PI) / 180)) - Math.PI / 2;
  return (radians * 180) / Math.PI;
}

function smoothstep(value, minimum, maximum) {
  const amount = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
