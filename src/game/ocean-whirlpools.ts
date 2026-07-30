import {
  MAP_BOUNDS,
  type GeoPoint,
  geoToWorld,
  worldToGeo,
} from "./data";
import { getWorldCountryAtGeo } from "./world-map";
import { wrappedDeltaX } from "./progression";

export interface OceanWhirlpool {
  id: string;
  point: GeoPoint;
  radius: number;
  coreRadius: number;
  spin: -1 | 1;
  pullStrength: number;
  swirlStrength: number;
  ejectSpeed: number;
  phase: number;
}

interface WhirlpoolRegion {
  id: string;
  count: number;
  longitude: readonly [number, number];
  latitude: readonly [number, number];
}

/**
 * A seeded generator keeps hazards stable between sessions while avoiding a
 * hand-authored list of coordinates. The first region deliberately gives the
 * waters west of Britain a denser cluster; the remaining regions spread the
 * same mechanic across the world's major oceans.
 */
const WHIRLPOOL_REGIONS: readonly WhirlpoolRegion[] = [
  {
    id: "british-atlantic",
    count: 3,
    longitude: [-24, -10],
    latitude: [48, 61],
  },
  {
    id: "north-atlantic",
    count: 2,
    longitude: [-58, -26],
    latitude: [24, 51],
  },
  {
    id: "south-atlantic",
    count: 2,
    longitude: [-38, -4],
    latitude: [-48, -13],
  },
  {
    id: "north-pacific-west",
    count: 2,
    longitude: [142, 176],
    latitude: [16, 46],
  },
  {
    id: "north-pacific-east",
    count: 2,
    longitude: [-174, -126],
    latitude: [12, 45],
  },
  {
    id: "south-pacific",
    count: 3,
    longitude: [-168, -92],
    latitude: [-49, -12],
  },
  {
    id: "indian-ocean",
    count: 3,
    longitude: [48, 103],
    latitude: [-43, 5],
  },
  {
    id: "southern-ocean",
    count: 2,
    longitude: [12, 138],
    latitude: [-61, -51],
  },
] as const;

export const OCEAN_WHIRLPOOLS: readonly OceanWhirlpool[] =
  generateOceanWhirlpools();

function generateOceanWhirlpools(): OceanWhirlpool[] {
  const random = mulberry32(0x6f636561);
  const generated: OceanWhirlpool[] = [];

  for (const region of WHIRLPOOL_REGIONS) {
    let created = 0;
    let attempts = 0;
    while (created < region.count && attempts < region.count * 120) {
      attempts += 1;
      const longitude = lerp(region.longitude[0], region.longitude[1], random());
      const latitude = lerp(region.latitude[0], region.latitude[1], random());
      const point = [longitude, latitude] as const;
      const radius = 2.55 + random() * 0.55;

      if (!isOpenOcean(point, radius + 1.25)) {
        continue;
      }

      const world = geoToWorld(point);
      const overlapsExisting = generated.some((other) => {
        const otherWorld = geoToWorld(other.point);
        return (
          Math.hypot(
            wrappedDeltaX(otherWorld.x, world.x),
            otherWorld.z - world.z,
          ) <
          other.radius + radius + 4.2
        );
      });
      if (overlapsExisting) {
        continue;
      }

      generated.push({
        id: `${region.id}-${created + 1}`,
        point,
        radius,
        coreRadius: radius * (0.27 + random() * 0.035),
        spin: random() < 0.5 ? -1 : 1,
        pullStrength: 8.8 + random() * 1.7,
        swirlStrength: 7 + random() * 1.4,
        ejectSpeed: 9.2 + random() * 1.2,
        phase: random() * Math.PI * 2,
      });
      created += 1;
    }
  }

  return generated;
}

/**
 * Reject land and coastlines by sampling a ring in world units around the
 * candidate. Keeping the whole influence circle at sea prevents invisible
 * forces from reaching a car on shore.
 */
function isOpenOcean(point: GeoPoint, clearance: number): boolean {
  if (getWorldCountryAtGeo(point)) {
    return false;
  }

  const center = geoToWorld(point);
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const sample = worldToGeo(
      center.x + Math.cos(angle) * clearance,
      center.z + Math.sin(angle) * clearance,
    );
    if (
      sample[0] <= MAP_BOUNDS.minLongitude ||
      sample[0] >= MAP_BOUNDS.maxLongitude ||
      sample[1] <= MAP_BOUNDS.minLatitude ||
      sample[1] >= MAP_BOUNDS.maxLatitude ||
      getWorldCountryAtGeo(sample)
    ) {
      return false;
    }
  }

  return true;
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
