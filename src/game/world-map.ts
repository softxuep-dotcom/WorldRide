import type {
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Polygon,
} from "geojson";
import { feature } from "topojson-client";
import type {
  GeometryCollection,
  Objects,
  Topology,
} from "topojson-specification";
import worldAtlas from "world-atlas/countries-50m.json";
import {
  COUNTRIES,
  type CountryDefinition,
  type GeoPoint,
} from "./data";

interface AtlasProperties {
  name?: string;
}

interface AtlasObjects extends Objects<AtlasProperties> {
  countries: GeometryCollection<AtlasProperties>;
  land: GeometryCollection<AtlasProperties>;
}

export interface WorldCountry {
  id: string;
  name: string;
  polygons: readonly (readonly GeoPoint[])[];
  renderPolygons: (readonly GeoPoint[])[];
  bounds: {
    minLongitude: number;
    maxLongitude: number;
    minLatitude: number;
    maxLatitude: number;
  };
}

export interface CountryAtlasBinding {
  content: CountryDefinition;
  atlas: WorldCountry;
}

const topology = worldAtlas as unknown as Topology<AtlasObjects>;
const countriesGeoJson = feature<AtlasProperties>(
  topology,
  topology.objects.countries,
) as unknown as FeatureCollection<Geometry, AtlasProperties>;

export const WORLD_COUNTRIES: readonly WorldCountry[] = countriesGeoJson.features
  .map((countryFeature, index) => {
    const polygons = geometryToOuterRings(countryFeature.geometry);
    const points = polygons.flat();

    if (points.length === 0) {
      return undefined;
    }

    const longitudes = points.map((point) => point[0]);
    const latitudes = points.map((point) => point[1]);

    return {
      id: String(countryFeature.id ?? index),
      name: countryFeature.properties?.name ?? `Country ${index + 1}`,
      polygons,
      renderPolygons: polygons.flatMap(createRenderableRings),
      bounds: {
        minLongitude: Math.min(...longitudes),
        maxLongitude: Math.max(...longitudes),
        minLatitude: Math.min(...latitudes),
        maxLatitude: Math.max(...latitudes),
      },
    } satisfies WorldCountry;
  })
  .filter((country): country is WorldCountry => country !== undefined);

const worldCountriesByName = new Map(
  WORLD_COUNTRIES.map((country) => [country.name.toLowerCase(), country]),
);

export const COUNTRY_ATLAS_BINDINGS: readonly CountryAtlasBinding[] = COUNTRIES.map(
  (content) => {
    const atlas = worldCountriesByName.get(content.englishName.toLowerCase());
    if (!atlas) {
      throw new Error(
        `Country content "${content.id}" cannot be matched to world-atlas name "${content.englishName}".`,
      );
    }
    if (!isGeoPointInWorldCountry(content.city.point, atlas)) {
      throw new Error(
        `City anchor for country content "${content.id}" is outside its world-atlas geometry.`,
      );
    }
    return { content, atlas };
  },
);

const contentCountryByAtlasId = new Map<string, CountryDefinition>(
  COUNTRY_ATLAS_BINDINGS.map(({ content, atlas }) => [atlas.id, content]),
);

export function getWorldCountryByName(name: string): WorldCountry | undefined {
  return worldCountriesByName.get(name.toLowerCase());
}

export function getCountryContentForAtlas(
  country: WorldCountry | undefined,
): CountryDefinition | undefined {
  return country ? contentCountryByAtlasId.get(country.id) : undefined;
}

export function isGeoPointInWorldCountry(
  point: GeoPoint,
  country: WorldCountry,
): boolean {
  const [longitude, latitude] = point;
  const { bounds } = country;
  if (
    longitude < bounds.minLongitude ||
    longitude > bounds.maxLongitude ||
    latitude < bounds.minLatitude ||
    latitude > bounds.maxLatitude
  ) {
    return false;
  }

  return country.polygons.some((polygon) => isPointInsideRing(point, polygon));
}

export function getWorldCountryAtGeo(point: GeoPoint): WorldCountry | undefined {
  const [longitude, latitude] = point;

  for (const country of WORLD_COUNTRIES) {
    const { bounds } = country;
    if (
      longitude < bounds.minLongitude ||
      longitude > bounds.maxLongitude ||
      latitude < bounds.minLatitude ||
      latitude > bounds.maxLatitude
    ) {
      continue;
    }

    if (isGeoPointInWorldCountry(point, country)) {
      return country;
    }
  }

  return undefined;
}

function geometryToOuterRings(geometry: Geometry | null): readonly (readonly GeoPoint[])[] {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return polygonToOuterRing(geometry);
  }

  if (geometry.type === "MultiPolygon") {
    return multiPolygonToOuterRings(geometry);
  }

  return [];
}

function polygonToOuterRing(polygon: Polygon): readonly (readonly GeoPoint[])[] {
  const outerRing = polygon.coordinates[0];
  return outerRing ? [outerRing.map(toGeoPoint)] : [];
}

function multiPolygonToOuterRings(
  multiPolygon: MultiPolygon,
): readonly (readonly GeoPoint[])[] {
  return multiPolygon.coordinates
    .map((polygon) => polygon[0])
    .filter((outerRing) => Boolean(outerRing))
    .map((outerRing) => outerRing.map(toGeoPoint));
}

function toGeoPoint(position: number[]): GeoPoint {
  return [position[0], position[1]];
}

function isPointInsideRing(point: GeoPoint, ring: readonly GeoPoint[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [currentX, currentY] = ring[index];
    const [previousX, previousY] = ring[previous];
    const crosses =
      currentY > y !== previousY > y &&
      x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

function createRenderableRings(ring: readonly GeoPoint[]): readonly (readonly GeoPoint[])[] {
  if (ring.length === 0) {
    return [];
  }

  const unwrapped: GeoPoint[] = [ring[0]];
  let previousLongitude = ring[0][0];

  for (let index = 1; index < ring.length; index += 1) {
    let longitude = ring[index][0];
    const latitude = ring[index][1];

    while (longitude - previousLongitude > 180) {
      longitude -= 360;
    }
    while (longitude - previousLongitude < -180) {
      longitude += 360;
    }

    unwrapped.push([longitude, latitude]);
    previousLongitude = longitude;
  }

  const longitudes = unwrapped.map((point) => point[0]);
  const minimum = Math.min(...longitudes);
  const maximum = Math.max(...longitudes);
  const rings: GeoPoint[][] = [unwrapped];

  if (maximum > 180) {
    rings.push(unwrapped.map(([longitude, latitude]) => [longitude - 360, latitude]));
  }
  if (minimum < -180) {
    rings.push(unwrapped.map(([longitude, latitude]) => [longitude + 360, latitude]));
  }

  return rings
    .map(clipRingToWorldBounds)
    .filter((candidate) => candidate.length >= 3);
}

function clipRingToWorldBounds(ring: readonly GeoPoint[]): GeoPoint[] {
  const leftClipped = clipRingAgainstLongitude(ring, -180, true);
  return clipRingAgainstLongitude(leftClipped, 180, false);
}

function clipRingAgainstLongitude(
  ring: readonly GeoPoint[],
  boundary: number,
  keepGreater: boolean,
): GeoPoint[] {
  if (ring.length === 0) {
    return [];
  }

  const output: GeoPoint[] = [];
  let previous = ring[ring.length - 1];
  let previousInside = keepGreater ? previous[0] >= boundary : previous[0] <= boundary;

  for (const current of ring) {
    const currentInside = keepGreater ? current[0] >= boundary : current[0] <= boundary;

    if (currentInside !== previousInside) {
      const longitudeDelta = current[0] - previous[0];
      const interpolation =
        Math.abs(longitudeDelta) < 0.000001
          ? 0
          : (boundary - previous[0]) / longitudeDelta;
      const latitude =
        previous[1] + (current[1] - previous[1]) * interpolation;
      output.push([boundary, latitude]);
    }

    if (currentInside) {
      output.push(current);
    }

    previous = current;
    previousInside = currentInside;
  }

  return output;
}
