import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "src", "i18n", "content");
const require = createRequire(import.meta.url);
const isoCountries = require("i18n-iso-countries");
const TARGETS = {
  fr: "fr",
  "pt-BR": "pt",
  it: "it",
  es: "es",
};
const MANUAL_OVERRIDES = {
  fr: {
    "Big Ben": "Big Ben",
    "Yellowstone · Grand Prismatic Spring":
      "Yellowstone · Grand Prismatic Spring",
    "In classical tradition, what name was given to the headlands flanking the strait?":
      "Dans la tradition classique, quel nom donnait-on aux promontoires qui bordent le détroit ?",
    "What pulls the Quadriga sculpture on top of the Brandenburg Gate?":
      "Quels animaux tirent le quadrige sculpté au sommet de la porte de Brandebourg ?",
    "How did garrisons use beacon towers to send warnings quickly along the Great Wall?":
      "Comment les garnisons utilisaient-elles les tours à signaux pour transmettre rapidement des alertes le long de la Grande Muraille ?",
    "What was Shah Jahan's central purpose in commissioning the Taj Mahal?":
      "Quel était l’objectif principal de Shah Jahan lorsqu’il fit construire le Taj Mahal ?",
    "Where and from what rock were most moai carved?":
      "Où et dans quelle roche la plupart des moaï ont-ils été sculptés ?",
    "The ninth-century minaret chiefly bears witness to which dynasty's period of building Samarra as a capital?":
      "Le minaret du IXe siècle témoigne surtout de l’époque où quelle dynastie fit de Samarra sa capitale ?",
    "Which South American camelid are travellers most likely to see on the grasslands of Torres del Paine?":
      "Quel camélidé sud-américain les voyageurs ont-ils le plus de chances d’observer dans les prairies de Torres del Paine ?",
  },
  "pt-BR": {
    "Big Ben": "Big Ben",
    "Grand Canyon": "Grand Canyon",
    "Yellowstone · Grand Prismatic Spring":
      "Yellowstone · Grand Prismatic Spring",
    "Fish River Canyon": "Cânion do Fish River",
    "Drakensberg Amphitheatre": "Anfiteatro de Drakensberg",
    "The Niagara River forms part of the border between Canada and the United States.":
      "O rio Niágara faz parte da fronteira entre o Canadá e os Estados Unidos.",
    "Why does Java have many volcanoes?":
      "Por que Java tem tantos vulcões?",
    "Which event is represented by the date on the tablet in the Statue of Liberty's left hand?":
      "Que evento é representado pela data na tábua segurada pela mão esquerda da Estátua da Liberdade?",
    "Where and from what rock were most moai carved?":
      "Onde e em que tipo de rocha foi esculpida a maioria dos moai?",
    "The ninth-century minaret chiefly bears witness to which dynasty's period of building Samarra as a capital?":
      "O minarete do século IX testemunha sobretudo o período em que qual dinastia fez de Samarra a sua capital?",
  },
  it: {
    "Big Ben": "Big Ben",
    "Grand Canyon": "Grand Canyon",
    "Golden Gate Bridge": "Golden Gate Bridge",
    "Yellowstone · Grand Prismatic Spring":
      "Yellowstone · Grand Prismatic Spring",
    "Lena Pillars": "Pilastri della Lena",
    "Hegra": "Hegra",
    "Registan": "Registan",
    "Fish River Canyon": "Canyon del Fish River",
    "Modern concrete panels": "Pannelli moderni in calcestruzzo",
    "Fr. Polynesia": "Polinesia francese",
    "Fr. S. Antarctic Lands":
      "Terre australi e antartiche francesi",
    "Uruguay": "Uruguay",
    "What pulls the Quadriga sculpture on top of the Brandenburg Gate?":
      "Che cosa traina la Quadriga scolpita in cima alla Porta di Brandeburgo?",
    "Beyond its physical landscape, which combination has strongly shaped Mount Fuji's cultural influence?":
      "Oltre al paesaggio naturale, quale combinazione ha contribuito maggiormente all’importanza culturale del Monte Fuji?",
    "What do Angkor's vast reservoirs and canals show was especially important to the Khmer city?":
      "Che cosa dimostrano i vasti bacini e canali di Angkor riguardo alle priorità della città khmer?",
    "Where and from what rock were most moai carved?":
      "Dove e in quale roccia fu scolpita la maggior parte dei moai?",
    "The ninth-century minaret chiefly bears witness to which dynasty's period of building Samarra as a capital?":
      "Il minareto del IX secolo testimonia soprattutto il periodo in cui quale dinastia fece di Samarra la propria capitale?",
  },
  es: {
    "Big Ben": "Big Ben",
    "A triangle": "Un triángulo",
    "Alpaca": "Alpaca",
    "Buenos Aires": "Buenos Aires",
    "Christ the Redeemer": "Cristo Redentor",
    "Dominica": "Dominica",
    "Drakensberg Amphitheatre": "Anfiteatro de Drakensberg",
    "Hong Kong": "Hong Kong",
    "Isle of Man": "Isla de Man",
    "King Protea": "Protea rey",
    "Lake Louise": "Lago Louise",
    "Lena Pillars": "Pilares del Lena",
    "Petra": "Petra",
    "Saint Helena": "Santa Elena",
    "South America": "América del Sur",
    "Southern Japan": "Sur de Japón",
    "Statue of Liberty": "Estatua de la Libertad",
    "Tanzania": "Tanzania",
    "The Colorado": "El río Colorado",
    "The Sonoran": "El desierto de Sonora",
    "Turkey": "Turquía",
    "Yellowstone": "Yellowstone",
    "What pulls the Quadriga sculpture on top of the Brandenburg Gate?":
      "¿Qué animales tiran de la Cuadriga situada en lo alto de la Puerta de Brandeburgo?",
    "What combination of purposes did Machu Picchu's terraces serve?":
      "¿Qué combinación de funciones cumplían las terrazas de Machu Picchu?",
    "The ninth-century minaret chiefly bears witness to which dynasty's period of building Samarra as a capital?":
      "¿De qué dinastía, que hizo de Samarra su capital, da testimonio principalmente este minarete del siglo IX?",
    "Which South American camelid are travellers most likely to see on the grasslands of Torres del Paine?":
      "¿Qué camélido sudamericano es más probable observar en las praderas de Torres del Paine?",
  },
};
const SPLIT_MARKER = "[[[SPLIT_7F3A]]]";
const MAX_BATCH_CHARACTERS = 3_800;
const MAX_BATCH_ITEMS = 24;
const CHECK_ONLY = process.argv.includes("--check");

globalThis.window = {
  location: { search: "" },
  localStorage: {
    getItem: () => null,
    setItem: () => undefined,
  },
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { languages: ["en"] },
});

const vite = await createServer({
  root: ROOT_DIR,
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const [{ en }, quizModule, specialtyModule, worldMapModule] =
    await Promise.all([
      vite.ssrLoadModule("/src/i18n/locales/en.ts"),
      vite.ssrLoadModule("/src/game/quiz.ts"),
      vite.ssrLoadModule("/src/game/regional-specialty-copy.ts"),
      vite.ssrLoadModule("/src/game/world-map.ts"),
    ]);

  const worldCountries = worldMapModule.WORLD_COUNTRIES;
  const sourceStrings = collectSourceStrings({
    en,
    quizzes: quizModule.getAllQuizSets(),
    specialties: specialtyModule.getAllSpecialtyCopies(),
    worldCountries,
  });

  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`Collected ${sourceStrings.length} unique English content strings.`);

  let validationFailed = false;
  for (const [locale, targetLanguage] of Object.entries(TARGETS)) {
    const outputPath = path.join(OUTPUT_DIR, `${locale}.json`);
    const existing = await readJson(outputPath);
    const missing = sourceStrings.filter((source) => !existing[source]);
    const unexpected = Object.keys(existing).filter(
      (source) => !sourceStrings.includes(source),
    );
    const markerLeaks = Object.values(existing).filter((value) =>
      value.includes(SPLIT_MARKER),
    );
    if (CHECK_ONLY) {
      console.log(
        `${locale}: entries=${Object.keys(existing).length}, missing=${missing.length}, unexpected=${unexpected.length}, markers=${markerLeaks.length}`,
      );
      validationFailed ||= Boolean(
        missing.length || unexpected.length || markerLeaks.length,
      );
      continue;
    }

    console.log(`${locale}: ${missing.length} strings to translate.`);

    const batches = createBatches(missing);
    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      const translated = await translateBatch(batch, targetLanguage);
      batch.forEach((source, itemIndex) => {
        existing[source] = translated[itemIndex];
      });
      process.stdout.write(
        `\r${locale}: translated ${Math.min(
          missing.length,
          (index + 1) * MAX_BATCH_ITEMS,
        )}/${missing.length}`,
      );
    }
    if (batches.length > 0) {
      process.stdout.write("\n");
    }

    applyIsoCountryNames(
      existing,
      worldCountries,
      en.worldCountries,
      locale,
    );
    normalizeTranslationCasing(existing, locale);
    Object.assign(existing, MANUAL_OVERRIDES[locale]);
    const ordered = Object.fromEntries(
      sourceStrings.map((source) => [source, existing[source]]),
    );
    await writeFile(
      outputPath,
      `${JSON.stringify(ordered, null, 2)}\n`,
      "utf8",
    );
  }
  if (validationFailed) {
    process.exitCode = 1;
  }
} finally {
  await vite.close();
}

function collectSourceStrings({ en, quizzes, specialties, worldCountries }) {
  const strings = new Set();
  const add = (value) => {
    if (typeof value === "string" && value.trim()) {
      strings.add(value);
    }
  };
  const addRecord = (record) => {
    for (const value of Object.values(record)) {
      add(value.name);
      add(value.cityName);
      add(value.intro);
      add(value.postcard);
      add(value.description);
      add(value.fact);
      value.facts?.forEach(add);
      value.details?.forEach(add);
    }
  };

  addRecord(en.countries);
  addRecord(en.photoSpots);
  addRecord(en.worldCountries);
  worldCountries.forEach((country) => add(country.name));
  specialties.forEach(({ name, blurb }) => {
    add(name);
    add(blurb);
  });
  quizzes.forEach((quiz) =>
    quiz.questions.forEach((question) => {
      add(question.prompt.en);
      question.options.forEach((option) => add(option.en));
      add(question.explain.en);
    }),
  );

  return [...strings].sort((a, b) => a.localeCompare(b, "en"));
}

function createBatches(strings) {
  const batches = [];
  let batch = [];
  let characters = 0;
  for (const value of strings) {
    const nextCharacters = characters + value.length + SPLIT_MARKER.length + 2;
    if (
      batch.length > 0 &&
      (batch.length >= MAX_BATCH_ITEMS ||
        nextCharacters > MAX_BATCH_CHARACTERS)
    ) {
      batches.push(batch);
      batch = [];
      characters = 0;
    }
    batch.push(value);
    characters += value.length + SPLIT_MARKER.length + 2;
  }
  if (batch.length > 0) {
    batches.push(batch);
  }
  return batches;
}

async function translateBatch(strings, targetLanguage) {
  if (strings.length === 0) {
    return [];
  }
  const combined = strings.join(`\n${SPLIT_MARKER}\n`);
  const result = await requestTranslation(combined, targetLanguage);
  const translated = result
    .split(new RegExp(`\\s*${escapeRegex(SPLIT_MARKER)}\\s*`))
    .map((value) => value.trim());

  if (translated.length === strings.length) {
    return translated;
  }

  console.warn(
    `Batch separator changed for ${targetLanguage}; retrying ${strings.length} strings individually.`,
  );
  return Promise.all(
    strings.map((value) => requestTranslation(value, targetLanguage)),
  );
}

async function requestTranslation(text, targetLanguage) {
  const url = new URL(
    "https://translate.googleapis.com/translate_a/single",
  );
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "WorldRide content localization generator" },
      });
      if (!response.ok) {
        throw new Error(`Translation request failed with ${response.status}.`);
      }
      const payload = await response.json();
      const translated = payload[0]
        .map((segment) => segment[0] ?? "")
        .join("")
        .trim();
      if (!translated) {
        throw new Error("Translation response was empty.");
      }
      return translated;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTranslationCasing(translations, locale) {
  if (locale !== "es") {
    return;
  }
  for (const [source, translation] of Object.entries(translations)) {
    if (/^\p{Lu}/u.test(source) && /^\p{Ll}/u.test(translation)) {
      translations[source] =
        translation[0].toLocaleUpperCase("es") + translation.slice(1);
    }
  }
}

function applyIsoCountryNames(
  translations,
  worldCountries,
  worldCountryAliases,
  locale,
) {
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  for (const country of worldCountries) {
    const alpha2 = isoCountries.numericToAlpha2(country.id);
    const localizedName = alpha2 ? displayNames.of(alpha2) : undefined;
    if (localizedName) {
      translations[country.name] = localizedName;
      const expandedName = worldCountryAliases[country.name]?.name;
      if (expandedName) {
        translations[expandedName] = localizedName;
      }
    }
  }
}
