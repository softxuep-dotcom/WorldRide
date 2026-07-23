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
import {
  getLocale,
  getWorldCountryTranslation,
  localizeCountry,
  t,
} from "../i18n";

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

export type CountryTier = "A" | "B" | "C" | "D";

export interface CountryProfile {
  id: string;
  atlasName: string;
  name: string;
  flag: string;
  tier: CountryTier;
  intro: string;
  details: readonly string[];
  passportEligible: boolean;
  showInHud: boolean;
  showReveal: boolean;
  content?: CountryDefinition;
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

const TIER_A_COUNTRIES = new Set([
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "China",
  "Egypt",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Iran",
  "Italy",
  "Japan",
  "Mexico",
  "Netherlands",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Switzerland",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States of America",
]);

const TIER_C_COUNTRIES = new Set([
  "Albania",
  "Armenia",
  "Belize",
  "Benin",
  "Bhutan",
  "Bosnia and Herz.",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Central African Rep.",
  "Chad",
  "Comoros",
  "Djibouti",
  "Dominica",
  "Eq. Guinea",
  "Eritrea",
  "Gambia",
  "Greenland",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Kiribati",
  "Kosovo",
  "Kyrgyzstan",
  "Lesotho",
  "Liberia",
  "Malawi",
  "Mauritania",
  "Moldova",
  "Montenegro",
  "Niger",
  "Palestine",
  "Rwanda",
  "Sierra Leone",
  "Solomon Is.",
  "Suriname",
  "Taiwan",
  "Tajikistan",
  "Timor-Leste",
  "Togo",
  "Turkmenistan",
  "Vanuatu",
  "W. Sahara",
  "Zambia",
  "eSwatini",
]);

const TIER_D_COUNTRIES = new Set([
  "American Samoa",
  "Andorra",
  "Anguilla",
  "Antarctica",
  "Antigua and Barb.",
  "Aruba",
  "Ashmore and Cartier Is.",
  "Bermuda",
  "Br. Indian Ocean Ter.",
  "British Virgin Is.",
  "Barbados",
  "Cayman Is.",
  "Cook Is.",
  "Curaçao",
  "Faeroe Is.",
  "Falkland Is.",
  "Fr. Polynesia",
  "Fr. S. Antarctic Lands",
  "Grenada",
  "Guam",
  "Guernsey",
  "Heard I. and McDonald Is.",
  "Hong Kong",
  "Indian Ocean Ter.",
  "Isle of Man",
  "Jersey",
  "Liechtenstein",
  "Luxembourg",
  "Macao",
  "Maldives",
  "Malta",
  "Marshall Is.",
  "Micronesia",
  "Monaco",
  "Montserrat",
  "N. Cyprus",
  "N. Mariana Is.",
  "New Caledonia",
  "Nauru",
  "Niue",
  "Norfolk Island",
  "Palau",
  "Pitcairn Is.",
  "Puerto Rico",
  "S. Geo. and the Is.",
  "Saint Helena",
  "Saint Lucia",
  "Samoa",
  "San Marino",
  "Seychelles",
  "Siachen Glacier",
  "Sint Maarten",
  "Somaliland",
  "St-Barthélemy",
  "St-Martin",
  "St. Kitts and Nevis",
  "St. Pierre and Miquelon",
  "St. Vin. and Gren.",
  "São Tomé and Principe",
  "Tonga",
  "Turks and Caicos Is.",
  "U.S. Virgin Is.",
  "Vatican",
  "Wallis and Futuna Is.",
  "Åland",
]);

const COUNTRY_FLAG_ALIASES: Readonly<Record<string, string>> = {
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Brazil: "🇧🇷",
  Cambodia: "🇰🇭",
  Canada: "🇨🇦",
  Chile: "🇨🇱",
  Jordan: "🇯🇴",
  Mexico: "🇲🇽",
  Nepal: "🇳🇵",
  Peru: "🇵🇪",
  Singapore: "🇸🇬",
  "South Africa": "🇿🇦",
  "United Arab Emirates": "🇦🇪",
  "United States of America": "🇺🇸",
};

const TIER_COLORS: Readonly<Record<CountryTier, string>> = {
  A: "#d45e4f",
  B: "#397d65",
  C: "#607587",
  D: "#8b9298",
};

export function getWorldCountryByName(name: string): WorldCountry | undefined {
  return worldCountriesByName.get(name.toLowerCase());
}

export function getCountryContentForAtlas(
  country: WorldCountry | undefined,
): CountryDefinition | undefined {
  return country ? contentCountryByAtlasId.get(country.id) : undefined;
}

export function getCountryTier(country: WorldCountry): CountryTier {
  if (TIER_A_COUNTRIES.has(country.name)) {
    return "A";
  }
  if (TIER_D_COUNTRIES.has(country.name)) {
    return "D";
  }
  if (TIER_C_COUNTRIES.has(country.name)) {
    return "C";
  }
  return "B";
}

export function getCountryProfile(country: WorldCountry): CountryProfile {
  const sourceContent = getCountryContentForAtlas(country);
  const content = sourceContent ? localizeCountry(sourceContent) : undefined;
  const translatedWorldCountry = getWorldCountryTranslation(country.name);
  const tier = getCountryTier(country);
  const name = content?.name ?? translatedWorldCountry.name ?? country.name;
  const region = getWorldRegionName(country);
  const intro =
    content?.intro ??
    translatedWorldCountry.intro ??
    t("country.regionalIntro", { name, region });
  const contentDetails =
    content && content.facts.length > 0
      ? content.facts
      : undefined;
  const details =
    contentDetails ??
    translatedWorldCountry.details ?? [
      t("country.regionalDetailGeography", { name, region }),
      t("country.regionalDetailCulture", { name, region }),
    ];
  const passportEligible = tier === "A" || tier === "B";
  return {
    id: country.id,
    atlasName: country.name,
    name,
    flag: content?.flag ?? COUNTRY_FLAG_ALIASES[country.name] ?? "•",
    tier,
    intro,
    details,
    passportEligible,
    showInHud: tier !== "D",
    showReveal: tier !== "D",
    content,
  };
}

type WorldRegion =
  | "africa"
  | "asia"
  | "europe"
  | "northAmerica"
  | "southAmerica"
  | "oceania";

const SOUTH_AMERICAN_COUNTRIES = new Set([
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Ecuador",
  "Guyana",
  "Paraguay",
  "Peru",
  "Suriname",
  "Uruguay",
  "Venezuela",
]);

const OCEANIA_COUNTRIES = new Set([
  "Australia",
  "Fiji",
  "Kiribati",
  "Micronesia",
  "New Zealand",
  "Papua New Guinea",
  "Samoa",
  "Solomon Is.",
  "Tonga",
  "Vanuatu",
]);

const ASIAN_EDGE_COUNTRIES = new Set([
  "Brunei",
  "Cambodia",
  "Indonesia",
  "Iran",
  "Azerbaijan",
  "Bahrain",
  "Cyprus",
  "Georgia",
  "Iraq",
  "Israel",
  "Jordan",
  "Kuwait",
  "Laos",
  "Lebanon",
  "Malaysia",
  "Myanmar",
  "Oman",
  "Palestine",
  "Philippines",
  "Qatar",
  "Saudi Arabia",
  "Singapore",
  "Syria",
  "Thailand",
  "Timor-Leste",
  "Turkey",
  "United Arab Emirates",
  "Vietnam",
  "Yemen",
]);

const NORTH_AMERICAN_EDGE_COUNTRIES = new Set([
  "Canada",
  "Mexico",
  "United States of America",
]);

function getWorldRegionName(country: WorldCountry): string {
  const region = getWorldRegion(country);
  const messageKeys: Readonly<Record<WorldRegion, Parameters<typeof t>[0]>> = {
    africa: "region.africa",
    asia: "region.asia",
    europe: "region.europe",
    northAmerica: "region.northAmerica",
    southAmerica: "region.southAmerica",
    oceania: "region.oceania",
  };
  return t(messageKeys[region]);
}

function getWorldRegion(country: WorldCountry): WorldRegion {
  if (SOUTH_AMERICAN_COUNTRIES.has(country.name)) {
    return "southAmerica";
  }
  if (OCEANIA_COUNTRIES.has(country.name)) {
    return "oceania";
  }
  if (
    country.name === "Greenland" ||
    NORTH_AMERICAN_EDGE_COUNTRIES.has(country.name) ||
    country.bounds.maxLongitude < -30
  ) {
    return "northAmerica";
  }
  if (ASIAN_EDGE_COUNTRIES.has(country.name)) {
    return "asia";
  }

  const longitude =
    (country.bounds.minLongitude + country.bounds.maxLongitude) / 2;
  const latitude =
    (country.bounds.minLatitude + country.bounds.maxLatitude) / 2;
  if (
    longitude >= -25 &&
    longitude <= 45 &&
    latitude >= 34
  ) {
    return "europe";
  }
  if (
    longitude >= -25 &&
    longitude <= 60 &&
    latitude >= -40 &&
    latitude < 37
  ) {
    return "africa";
  }
  if ((longitude >= 105 && latitude < 5) || longitude >= 150) {
    return "oceania";
  }
  return "asia";
}

export function getPassportCountryProfiles(): readonly CountryProfile[] {
  return WORLD_COUNTRIES.map(getCountryProfile)
    .filter((country) => country.passportEligible)
    .sort((left, right) => {
      if (left.tier !== right.tier) {
        return left.tier.localeCompare(right.tier);
      }
      return left.name.localeCompare(right.name, getLocale());
    });
}

export function getCountryTierColor(tier: CountryTier): string {
  return TIER_COLORS[tier];
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
