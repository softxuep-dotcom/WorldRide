import type { PhotoSpotId } from "./data";

/**
 * Knowledge challenges offered on arrival at a tier-A country or a photo spot.
 *
 * Each question keeps its prompt, options, answer and explanation together in
 * every language. Splitting the text into the locale files would put the option
 * order in one file and the answer index in another, which silently breaks the
 * quiz whenever a translator reorders an option.
 *
 * A subject with no entry here simply never offers a challenge, so the bank can
 * be filled in incrementally.
 */
export type LocalizedText = Readonly<Record<string, string>>;

export interface QuizQuestion {
  id: string;
  prompt: LocalizedText;
  options: readonly LocalizedText[];
  answerIndex: number;
  explain: LocalizedText;
}

export interface QuizSet {
  id: string;
  questions: readonly QuizQuestion[];
}

const FALLBACK_LOCALE = "en";

export function localizeText(text: LocalizedText, locale: string): string {
  return text[locale] ?? text[FALLBACK_LOCALE] ?? Object.values(text)[0] ?? "";
}

/** Keyed by the world-atlas country name, matching CountryProfile.atlasName. */
const COUNTRY_QUIZZES: Readonly<Record<string, QuizSet>> = {
  France: {
    id: "country:France",
    questions: [
      {
        id: "france-capital",
        prompt: {
          en: "Which city is the capital of France?",
          "zh-CN": "法国的首都是哪座城市？",
        },
        options: [
          { en: "Paris", "zh-CN": "巴黎" },
          { en: "Marseille", "zh-CN": "马赛" },
          { en: "Lyon", "zh-CN": "里昂" },
        ],
        answerIndex: 0,
        explain: {
          en: "Paris sits on the River Seine and has been the capital for centuries.",
          "zh-CN": "巴黎坐落在塞纳河畔，长期以来都是法国的首都。",
        },
      },
      {
        id: "france-sea",
        prompt: {
          en: "Southern France faces which sea?",
          "zh-CN": "法国南部面向哪片海？",
        },
        options: [
          { en: "The Baltic Sea", "zh-CN": "波罗的海" },
          { en: "The Mediterranean Sea", "zh-CN": "地中海" },
          { en: "The Black Sea", "zh-CN": "黑海" },
        ],
        answerIndex: 1,
        explain: {
          en: "The southern coast, including Marseille, opens onto the Mediterranean.",
          "zh-CN": "包括马赛在内的南部海岸都面向地中海。",
        },
      },
    ],
  },

  China: {
    id: "country:China",
    questions: [
      {
        id: "china-river",
        prompt: {
          en: "Which is the longest river in China?",
          "zh-CN": "中国最长的河流是哪一条？",
        },
        options: [
          { en: "The Yellow River", "zh-CN": "黄河" },
          { en: "The Pearl River", "zh-CN": "珠江" },
          { en: "The Yangtze River", "zh-CN": "长江" },
        ],
        answerIndex: 2,
        explain: {
          en: "The Yangtze flows from the western highlands east into the sea.",
          "zh-CN": "长江发源于西部高原，自西向东注入大海。",
        },
      },
      {
        id: "china-terrain",
        prompt: {
          en: "In which direction does China's land generally get lower?",
          "zh-CN": "中国的地势总体上朝哪个方向降低？",
        },
        options: [
          { en: "Towards the east", "zh-CN": "自西向东降低" },
          { en: "Towards the west", "zh-CN": "自东向西降低" },
          { en: "Towards the north", "zh-CN": "自南向北降低" },
        ],
        answerIndex: 0,
        explain: {
          en: "China is high in the west and low in the east, so most rivers flow east.",
          "zh-CN": "中国地势西高东低，所以大多数河流向东流入海洋。",
        },
      },
    ],
  },

  Italy: {
    id: "country:Italy",
    questions: [
      {
        id: "italy-shape",
        prompt: {
          en: "The Italian peninsula is often said to look like what?",
          "zh-CN": "意大利半岛的轮廓常被形容成什么？",
        },
        options: [
          { en: "A boot", "zh-CN": "一只靴子" },
          { en: "A hat", "zh-CN": "一顶帽子" },
          { en: "A fish", "zh-CN": "一条鱼" },
        ],
        answerIndex: 0,
        explain: {
          en: "Italy stretches into the Mediterranean in a shape like a boot.",
          "zh-CN": "意大利伸入地中海，形状很像一只靴子。",
        },
      },
      {
        id: "italy-mountains",
        prompt: {
          en: "Which mountain range borders northern Italy?",
          "zh-CN": "意大利北部连接着哪条山脉？",
        },
        options: [
          { en: "The Andes", "zh-CN": "安第斯山脉" },
          { en: "The Alps", "zh-CN": "阿尔卑斯山脉" },
          { en: "The Ural Mountains", "zh-CN": "乌拉尔山脉" },
        ],
        answerIndex: 1,
        explain: {
          en: "The Alps form Italy's northern boundary with its neighbours.",
          "zh-CN": "阿尔卑斯山脉构成了意大利北部与邻国的分界。",
        },
      },
    ],
  },

  "United States of America": {
    id: "country:United States of America",
    questions: [
      {
        id: "usa-oceans",
        prompt: {
          en: "The mainland United States lies between which two oceans?",
          "zh-CN": "美国本土位于哪两大洋之间？",
        },
        options: [
          { en: "The Atlantic and the Pacific", "zh-CN": "大西洋和太平洋" },
          { en: "The Indian and the Pacific", "zh-CN": "印度洋和太平洋" },
          { en: "The Atlantic and the Arctic", "zh-CN": "大西洋和北冰洋" },
        ],
        answerIndex: 0,
        explain: {
          en: "The Atlantic lies to the east and the Pacific to the west.",
          "zh-CN": "东边是大西洋，西边是太平洋。",
        },
      },
      {
        id: "usa-canyon",
        prompt: {
          en: "Which river carved the Grand Canyon?",
          "zh-CN": "大峡谷是被哪条河流切割形成的？",
        },
        options: [
          { en: "The Mississippi River", "zh-CN": "密西西比河" },
          { en: "The Colorado River", "zh-CN": "科罗拉多河" },
          { en: "The Hudson River", "zh-CN": "哈德逊河" },
        ],
        answerIndex: 1,
        explain: {
          en: "The Colorado River cut down through the rock over millions of years.",
          "zh-CN": "科罗拉多河用数百万年的时间切开岩层，形成了大峡谷。",
        },
      },
    ],
  },

  Japan: {
    id: "country:Japan",
    questions: [
      {
        id: "japan-islands",
        prompt: {
          en: "Japan is made up of what kind of land?",
          "zh-CN": "日本的国土是由什么构成的？",
        },
        options: [
          { en: "A chain of islands", "zh-CN": "一系列岛屿" },
          { en: "One single landmass", "zh-CN": "一整块大陆" },
          { en: "A desert plateau", "zh-CN": "一片沙漠高原" },
        ],
        answerIndex: 0,
        explain: {
          en: "Japan has four main islands and many smaller ones.",
          "zh-CN": "日本由四个主要岛屿和许多小岛组成。",
        },
      },
    ],
  },

  Egypt: {
    id: "country:Egypt",
    questions: [
      {
        id: "egypt-nile",
        prompt: {
          en: "Which direction does the Nile flow in Egypt?",
          "zh-CN": "尼罗河在埃及境内向哪个方向流？",
        },
        options: [
          { en: "South, into the desert", "zh-CN": "向南流入沙漠" },
          { en: "North, into the Mediterranean", "zh-CN": "向北流入地中海" },
          { en: "East, into the Red Sea", "zh-CN": "向东流入红海" },
        ],
        answerIndex: 1,
        explain: {
          en: "The Nile flows north and reaches the Mediterranean through its delta.",
          "zh-CN": "尼罗河向北流，经三角洲注入地中海。",
        },
      },
    ],
  },
};

/** Keyed by PhotoSpotId. */
const SPOT_QUIZZES: Partial<Record<PhotoSpotId, QuizSet>> = {
  colosseum: {
    id: "spot:colosseum",
    questions: [
      {
        id: "colosseum-city",
        prompt: {
          en: "In which city does the Colosseum stand?",
          "zh-CN": "斗兽场坐落在哪座城市？",
        },
        options: [
          { en: "Rome", "zh-CN": "罗马" },
          { en: "Venice", "zh-CN": "威尼斯" },
          { en: "Naples", "zh-CN": "那不勒斯" },
        ],
        answerIndex: 0,
        explain: {
          en: "The Colosseum is in the centre of Rome, Italy's capital.",
          "zh-CN": "斗兽场位于意大利首都罗马的市中心。",
        },
      },
      {
        id: "colosseum-shape",
        prompt: {
          en: "What is the shape of the Colosseum's floor plan?",
          "zh-CN": "斗兽场的平面是什么形状？",
        },
        options: [
          { en: "A square", "zh-CN": "正方形" },
          { en: "A triangle", "zh-CN": "三角形" },
          { en: "An oval", "zh-CN": "椭圆形" },
        ],
        answerIndex: 2,
        explain: {
          en: "Its oval ring let crowds on every side see the arena floor.",
          "zh-CN": "椭圆形的环状看台让四面的观众都能看到中央场地。",
        },
      },
    ],
  },

  "eiffel-tower": {
    id: "spot:eiffel-tower",
    questions: [
      {
        id: "eiffel-material",
        prompt: {
          en: "What is the Eiffel Tower mainly built from?",
          "zh-CN": "埃菲尔铁塔主要是用什么建造的？",
        },
        options: [
          { en: "Iron", "zh-CN": "铁" },
          { en: "Stone", "zh-CN": "石头" },
          { en: "Wood", "zh-CN": "木头" },
        ],
        answerIndex: 0,
        explain: {
          en: "It is a lattice of iron, which is why it looks see-through.",
          "zh-CN": "它由铁制网格结构搭成，所以看上去是通透的。",
        },
      },
    ],
  },

  "giza-pyramids": {
    id: "spot:giza-pyramids",
    questions: [
      {
        id: "giza-country",
        prompt: {
          en: "The Pyramids of Giza are in which country?",
          "zh-CN": "吉萨金字塔群位于哪个国家？",
        },
        options: [
          { en: "Egypt", "zh-CN": "埃及" },
          { en: "Morocco", "zh-CN": "摩洛哥" },
          { en: "Turkey", "zh-CN": "土耳其" },
        ],
        answerIndex: 0,
        explain: {
          en: "They stand near Cairo, close to the Nile in Egypt.",
          "zh-CN": "它们位于埃及开罗附近，靠近尼罗河。",
        },
      },
    ],
  },

  "great-wall": {
    id: "spot:great-wall",
    questions: [
      {
        id: "great-wall-purpose",
        prompt: {
          en: "What was the Great Wall originally built for?",
          "zh-CN": "长城最初是为了什么而修建的？",
        },
        options: [
          { en: "Defence", "zh-CN": "防御" },
          { en: "Farming", "zh-CN": "耕种" },
          { en: "Racing", "zh-CN": "赛跑" },
        ],
        answerIndex: 0,
        explain: {
          en: "It was built as a defensive line across northern China.",
          "zh-CN": "它是横贯中国北方的一道防御工事。",
        },
      },
    ],
  },
};

export function getCountryQuiz(atlasName: string | undefined): QuizSet | undefined {
  return atlasName ? COUNTRY_QUIZZES[atlasName] : undefined;
}

export function getSpotQuiz(spotId: PhotoSpotId | undefined): QuizSet | undefined {
  return spotId ? SPOT_QUIZZES[spotId] : undefined;
}
