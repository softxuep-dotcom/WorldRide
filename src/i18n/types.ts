import type {
  CountryId,
  PhotoSpotId,
} from "../game/data";

export interface UiMessages {
  "meta.title": string;
  "meta.description": string;
  "canvas.label": string;
  "worldMap.toggle": string;
  "worldMap.playerPosition": string;
  "worldMap.label": string;
  "worldMap.back": string;
  "worldMap.openToast": string;
  "worldMap.closeToast": string;
  "controls.desktop": string;
  "controls.touch": string;
  "passport.open": string;
  "passport.eyebrow": string;
  "passport.title": string;
  "passport.close": string;
  "passport.description": string;
  "passport.primaryDestinations": string;
  "passport.destinations": string;
  "landmark.close": string;
  "landmark.defaultKind": string;
  "landmark.defaultName": string;
  "landmark.defaultStatus": string;
  "landmark.kind.landmark": string;
  "landmark.kind.natural": string;
  "landmark.kind.wonder": string;
  "landmark.kind.historical": string;
  "landmark.travelSelection": string;
  "landmark.reflectionSelection": string;
  "landmark.added": string;
  "landmark.alreadyAdded": string;
  "landmark.recorded": string;
  "landmark.alreadyRecorded": string;
  "action.done": string;
  "action.backToJourney": string;
  "aria.countryDetail": string;
  "aria.landmarkDetail": string;
  "toast.discoveredSpot": string;
  "toast.discoveredHistoricalSite": string;
  "toast.boatMode": string;
  "toast.carMode": string;
  "toast.mapEdge": string;
  "toast.worldWrapped": string;
  "toast.contextLost": string;
  "toast.contextRestored": string;
  "quiz.challenge": string;
  "quiz.close": string;
  "quiz.leave": string;
  "quiz.next": string;
  "quiz.finish": string;
  "quiz.progress": string;
  "quiz.correct": string;
  "quiz.wrong": string;
  "quiz.result": string;
  "quiz.perfect": string;
  "quiz.retry": string;
  "quiz.completedToast": string;
  "language.label": string;
  "country.genericIntro": string;
  "country.regionalIntro": string;
  "country.regionalDetailGeography": string;
  "country.regionalDetailCulture": string;
  "region.africa": string;
  "region.asia": string;
  "region.europe": string;
  "region.northAmerica": string;
  "region.southAmerica": string;
  "region.oceania": string;
}

export type MessageKey = keyof UiMessages;
export type MessageParams = Readonly<Record<string, string | number>>;

export interface CountryTranslation {
  name: string;
  cityName: string;
  intro: string;
  facts?: readonly string[];
}

export interface PhotoSpotTranslation {
  name: string;
  postcard: string;
  description: string;
  fact: string;
}

export interface WorldCountryTranslation {
  name?: string;
  intro?: string;
  details?: readonly string[];
}

export interface LocaleDefinition {
  code: string;
  htmlLang: string;
  label: string;
  direction?: "ltr" | "rtl";
  messages: UiMessages;
  countries: Partial<Record<CountryId, CountryTranslation>>;
  photoSpots: Partial<Record<PhotoSpotId, PhotoSpotTranslation>>;
  worldCountries: Readonly<Record<string, WorldCountryTranslation>>;
}
