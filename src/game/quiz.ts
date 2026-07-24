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

type BilingualCopy = readonly [en: string, zhCn: string];

function bilingual([en, zhCn]: BilingualCopy): LocalizedText {
  return { en, "zh-CN": zhCn };
}

function spotQuestion(
  id: string,
  prompt: BilingualCopy,
  options: readonly BilingualCopy[],
  answerIndex: number,
  explain: BilingualCopy,
): QuizQuestion {
  return {
    id,
    prompt: bilingual(prompt),
    options: options.map(bilingual),
    answerIndex,
    explain: bilingual(explain),
  };
}

function spotQuiz(
  id: PhotoSpotId,
  questions: readonly QuizQuestion[],
): QuizSet {
  return { id: `spot:${id}`, questions };
}

/**
 * Every photo spot has exactly two short questions. Using a complete Record
 * makes a newly-added PhotoSpotId fail type-checking until its quiz is added.
 */
const SPOT_QUIZZES: Readonly<Record<PhotoSpotId, QuizSet>> = {
  "gibraltar-strait": spotQuiz("gibraltar-strait", [
    spotQuestion(
      "gibraltar-waters",
      ["Which two bodies of water does the Strait of Gibraltar connect?", "直布罗陀海峡连接哪两片水域？"],
      [
        ["The Atlantic Ocean and the Mediterranean Sea", "大西洋与地中海"],
        ["The Indian Ocean and the Red Sea", "印度洋与红海"],
        ["The Baltic Sea and the North Sea", "波罗的海与北海"],
      ],
      0,
      ["The strait is the western gateway between the Mediterranean and the Atlantic.", "这里是地中海通往大西洋的西部门户。"],
    ),
    spotQuestion(
      "gibraltar-continents",
      ["Which two continents face each other across the strait?", "海峡两岸相望的是哪两个大洲？"],
      [
        ["Asia and Europe", "亚洲与欧洲"],
        ["Europe and Africa", "欧洲与非洲"],
        ["Africa and South America", "非洲与南美洲"],
      ],
      1,
      ["Southern Europe and northern Africa are only about 14 kilometres apart at the narrowest point.", "欧洲南部与非洲北部在海峡最窄处仅相距约十四公里。"],
    ),
  ]),

  "big-ben": spotQuiz("big-ben", [
    spotQuestion(
      "big-ben-name",
      ["What did the name “Big Ben” originally refer to?", "“大本钟”这个名称最初指什么？"],
      [
        ["The great bell", "报时大钟"],
        ["The whole Parliament building", "整座议会大厦"],
        ["The River Thames", "泰晤士河"],
      ],
      0,
      ["Big Ben is the nickname of the great bell, not the official name of the tower.", "“大本钟”原本是报时大钟的昵称，并不是钟楼的正式名称。"],
    ),
    spotQuestion(
      "big-ben-tower",
      ["What is the clock tower officially called today?", "大本钟所在钟楼现在的正式名称是什么？"],
      [
        ["Victoria Tower", "维多利亚塔"],
        ["Elizabeth Tower", "伊丽莎白塔"],
        ["London Tower", "伦敦塔"],
      ],
      1,
      ["The tower at the north end of the Palace of Westminster is now called Elizabeth Tower.", "英国议会大厦北端的这座钟楼现名为伊丽莎白塔。"],
    ),
  ]),

  "brandenburg-gate": spotQuiz("brandenburg-gate", [
    spotQuestion(
      "brandenburg-city",
      ["In which city does the Brandenburg Gate stand?", "勃兰登堡门位于哪座城市？"],
      [
        ["Berlin", "柏林"],
        ["Munich", "慕尼黑"],
        ["Hamburg", "汉堡"],
      ],
      0,
      ["The gate stands at the end of Unter den Linden in central Berlin.", "勃兰登堡门位于柏林市中心菩提树下大街的一端。"],
    ),
    spotQuestion(
      "brandenburg-symbol",
      ["What does the Brandenburg Gate strongly symbolize today?", "今天的勃兰登堡门最常象征什么？"],
      [
        ["German division and reunification", "德国的分裂与重新统一"],
        ["The start of the Alps", "阿尔卑斯山的起点"],
        ["Germany's largest seaport", "德国最大的海港"],
      ],
      0,
      ["Once beside the divided city, the gate later became a major symbol of German reunification.", "它曾位于分裂城市的边缘，后来成为德国重新统一的重要象征。"],
    ),
  ]),

  colosseum: spotQuiz("colosseum", [
    spotQuestion(
      "colosseum-city",
      ["In which city does the Colosseum stand?", "斗兽场坐落在哪座城市？"],
      [
        ["Rome", "罗马"],
        ["Venice", "威尼斯"],
        ["Naples", "那不勒斯"],
      ],
      0,
      ["The Colosseum is in the centre of Rome, Italy's capital.", "斗兽场位于意大利首都罗马的市中心。"],
    ),
    spotQuestion(
      "colosseum-shape",
      ["What is the shape of the Colosseum's floor plan?", "斗兽场的平面是什么形状？"],
      [
        ["A square", "正方形"],
        ["A triangle", "三角形"],
        ["An oval", "椭圆形"],
      ],
      2,
      ["Its oval ring let crowds on every side see the arena floor.", "椭圆形的环状看台让四面的观众都能看到中央场地。"],
    ),
  ]),

  acropolis: spotQuiz("acropolis", [
    spotQuestion(
      "acropolis-city",
      ["The Acropolis rises above which city?", "雅典卫城位于哪座城市的高处？"],
      [
        ["Athens", "雅典"],
        ["Sparta", "斯巴达"],
        ["Thessaloniki", "塞萨洛尼基"],
      ],
      0,
      ["The limestone hill forms a natural high point in the centre of Athens.", "卫城所在的石灰岩山丘是雅典市中心的天然制高点。"],
    ),
    spotQuestion(
      "acropolis-temple",
      ["Which temple is the most prominent building on the Acropolis?", "卫城上最醒目的神庙是哪一座？"],
      [
        ["The Pantheon", "万神殿"],
        ["The Parthenon", "帕特农神庙"],
        ["The Temple of Heaven", "天坛"],
      ],
      1,
      ["The Parthenon dominates the hilltop ensemble of temples and monuments.", "帕特农神庙是卫城山顶建筑群中最醒目的主体。"],
    ),
  ]),

  "swiss-alps": spotQuiz("swiss-alps", [
    spotQuestion(
      "swiss-alps-landscape",
      ["Which landscape best matches the Swiss Alps?", "哪种景观最符合瑞士阿尔卑斯？"],
      [
        ["Snow peaks, glacial valleys and meadows", "雪峰、冰川谷地与草甸"],
        ["Mangrove swamps and coral reefs", "红树林沼泽与珊瑚礁"],
        ["Flat desert dunes", "平坦的沙漠沙丘"],
      ],
      0,
      ["High peaks, glaciers, valleys and alpine meadows shape the region.", "高峰、冰川、山谷与高山草甸共同塑造了这里的景观。"],
    ),
    spotQuestion(
      "swiss-alps-transport",
      ["What helps people travel through the steep Alpine terrain?", "什么交通方式帮助人们穿行陡峭的阿尔卑斯山区？"],
      [
        ["Railways and cable cars", "铁路与缆车"],
        ["Ocean ferries only", "只有远洋渡轮"],
        ["Desert camel roads", "沙漠骆驼道"],
      ],
      0,
      ["Mountain railways and cable cars connect valleys, settlements and high slopes.", "山地铁路和缆车连接山谷、聚落与高处山坡。"],
    ),
  ]),

  "norway-fjord": spotQuiz("norway-fjord", [
    spotQuestion(
      "fjord-formation",
      ["What carved many of Norway's deep fjord valleys?", "许多挪威峡湾的深谷最初由什么侵蚀形成？"],
      [
        ["Glaciers", "冰川"],
        ["Desert winds", "沙漠风"],
        ["Coral reefs", "珊瑚礁"],
      ],
      0,
      ["Glaciers carved deep valleys that were later flooded by seawater.", "冰川切割出深谷，后来海水进入其中形成峡湾。"],
    ),
    spotQuestion(
      "fjord-shape",
      ["What is a typical fjord landscape?", "典型的峡湾景观是什么样的？"],
      [
        ["A broad plain with no coast", "没有海岸的辽阔平原"],
        ["A narrow sea inlet between steep cliffs", "陡峭岩壁之间的狭长海湾"],
        ["A circular desert crater", "圆形沙漠陨石坑"],
      ],
      1,
      ["Fjord walls often rise steeply from a long, narrow arm of the sea.", "峡湾通常是深入陆地的狭长水域，两侧岩壁陡峭升起。"],
    ),
  ]),

  "giza-pyramids": spotQuiz("giza-pyramids", [
    spotQuestion(
      "giza-country",
      ["The Pyramids of Giza are in which country?", "吉萨金字塔群位于哪个国家？"],
      [
        ["Egypt", "埃及"],
        ["Morocco", "摩洛哥"],
        ["Turkey", "土耳其"],
      ],
      0,
      ["They stand near Cairo, close to the Nile in Egypt.", "它们位于埃及开罗附近，靠近尼罗河。"],
    ),
    spotQuestion(
      "giza-survivor",
      ["Why is the Great Pyramid of Khufu especially important?", "胡夫金字塔为什么格外重要？"],
      [
        ["It is the tallest modern skyscraper", "它是最高的现代摩天楼"],
        ["It is the only ancient Seven Wonder largely surviving", "它是大体保存至今的唯一古代世界七大奇迹"],
        ["It was built as a railway station", "它最初是一座火车站"],
      ],
      1,
      ["It is the only one of the ancient Seven Wonders still largely standing.", "它是古代世界七大奇迹中唯一大体保存至今的一处。"],
    ),
  ]),

  "hagia-sophia": spotQuiz("hagia-sophia", [
    spotQuestion(
      "hagia-city",
      ["In which city is Hagia Sophia?", "圣索菲亚大教堂位于哪座城市？"],
      [
        ["Istanbul", "伊斯坦布尔"],
        ["Ankara", "安卡拉"],
        ["Athens", "雅典"],
      ],
      0,
      ["Hagia Sophia stands in Istanbul's historic district near the Bosporus.", "圣索菲亚大教堂位于伊斯坦布尔历史城区，靠近博斯普鲁斯海峡。"],
    ),
    spotQuestion(
      "hagia-feature",
      ["Which architectural feature dominates Hagia Sophia?", "圣索菲亚大教堂最突出的建筑特征是什么？"],
      [
        ["A giant central dome", "巨大的中央穹顶"],
        ["A glass pyramid", "玻璃金字塔"],
        ["A suspension bridge", "悬索桥"],
      ],
      0,
      ["Its central dome and layered half-domes create a vast interior space.", "中央巨型穹顶与层叠半穹顶共同形成开阔的内部空间。"],
    ),
  ]),

  "great-wall": spotQuiz("great-wall", [
    spotQuestion(
      "great-wall-purpose",
      ["What was a main purpose of the Great Wall system?", "长城体系的主要用途之一是什么？"],
      [
        ["Defence", "防御"],
        ["Ocean fishing", "远洋捕鱼"],
        ["Growing rice", "种植水稻"],
      ],
      0,
      ["Walls, passes and beacon towers formed defensive lines across northern China.", "城墙、关隘与烽火台共同构成中国北方的防御体系。"],
    ),
    spotQuestion(
      "great-wall-system",
      ["Which statement about the Great Wall is correct?", "关于长城，哪项说法正确？"],
      [
        ["It is one wall built in a single year", "它是一年内建成的一道单一城墙"],
        ["It combines sections built in different periods", "它由不同时期修建的多段设施组成"],
        ["It runs entirely underground", "它完全建在地下"],
      ],
      1,
      ["Today's Great Wall includes walls, passes, trenches and beacon towers from different dynasties.", "今天的长城包含不同朝代修筑的城墙、关隘、壕堑与烽火台。"],
    ),
  ]),

  "fuji-view": spotQuiz("fuji-view", [
    spotQuestion(
      "fuji-height",
      ["What national record does Mount Fuji hold?", "富士山拥有日本的哪项纪录？"],
      [
        ["Japan's longest river", "日本最长的河流"],
        ["Japan's highest mountain", "日本最高的山峰"],
        ["Japan's largest island", "日本最大的岛屿"],
      ],
      1,
      ["Mount Fuji is the highest mountain in Japan.", "富士山是日本最高峰。"],
    ),
    spotQuestion(
      "fuji-volcano",
      ["What type of landform is Mount Fuji?", "富士山属于哪种地貌？"],
      [
        ["A stratovolcano", "成层火山"],
        ["A coral island", "珊瑚岛"],
        ["A limestone cave", "石灰岩洞穴"],
      ],
      0,
      ["Its layered volcanic cone is still classified as an active volcano.", "它是一座轮廓近乎对称、仍被列为活火山的成层火山。"],
    ),
  ]),

  "taj-mahal": spotQuiz("taj-mahal", [
    spotQuestion(
      "taj-material",
      ["Which material gives the Taj Mahal its famous pale appearance?", "泰姬陵主要使用什么材料呈现著名的白色外观？"],
      [
        ["White marble", "白色大理石"],
        ["Red brick", "红砖"],
        ["Dark basalt", "黑色玄武岩"],
      ],
      0,
      ["The central mausoleum is faced with white marble that changes subtly with the light.", "中央陵墓以白色大理石建造，会随光线呈现细微色彩变化。"],
    ),
    spotQuestion(
      "taj-layout",
      ["What strongly shapes the Taj Mahal's layout?", "泰姬陵整体布局最突出的特点是什么？"],
      [
        ["Near symmetry along a central axis", "沿中央轴线近乎对称"],
        ["A random maze of streets", "随机交错的街巷迷宫"],
        ["A circular race track", "圆形赛道"],
      ],
      0,
      ["The tomb, garden, pools and gateways are arranged around a strong central axis.", "陵墓、花园、水池与入口围绕明确的中央轴线展开。"],
    ),
  ]),

  "java-volcano": spotQuiz("java-volcano", [
    spotQuestion(
      "java-ring",
      ["Why does Java have many volcanoes?", "为什么爪哇岛分布着许多火山？"],
      [
        ["It lies on active plate boundaries", "它位于活跃板块边界"],
        ["It is close to the North Pole", "它靠近北极"],
        ["It has no tectonic activity", "这里没有构造活动"],
      ],
      0,
      ["Java is part of Indonesia's volcanic arc along the Pacific Ring of Fire.", "爪哇岛属于印度尼西亚火山弧，位于环太平洋火山带。"],
    ),
    spotQuestion(
      "java-soil",
      ["How can volcanic ash affect farming on Java?", "火山灰会怎样影响爪哇岛的农业？"],
      [
        ["It can create fertile soil", "它能形成肥沃土壤"],
        ["It permanently freezes the ground", "它会让土地永久冻结"],
        ["It turns every field into seawater", "它会把农田变成海水"],
      ],
      0,
      ["Weathered volcanic material can make the soil fertile, so farms often lie near volcanoes.", "风化后的火山物质能够形成肥沃土壤，因此农田常分布在火山附近。"],
    ),
  ]),

  "moscow-domes": spotQuiz("moscow-domes", [
    spotQuestion(
      "st-basil-place",
      ["Where does Saint Basil's Cathedral stand?", "圣瓦西里大教堂坐落在哪里？"],
      [
        ["At the south end of Red Square", "莫斯科红场南端"],
        ["On an island in the Thames", "泰晤士河中的岛上"],
        ["Beside Sydney Harbour", "悉尼港旁"],
      ],
      0,
      ["The cathedral stands at the southern end of Moscow's Red Square.", "教堂位于莫斯科红场南端。"],
    ),
    spotQuestion(
      "st-basil-domes",
      ["What makes Saint Basil's easy to recognize from far away?", "圣瓦西里大教堂为什么远看也很容易辨认？"],
      [
        ["Its varied colourful domes", "各不相同的彩色穹顶"],
        ["A single glass cube", "单一的玻璃方盒"],
        ["A very long stone wall", "一条很长的石墙"],
      ],
      0,
      ["Its chapels have domes with different shapes, patterns and colours.", "多座礼拜堂拥有形状、纹样和色彩各不相同的穹顶。"],
    ),
  ]),

  "eiffel-tower": spotQuiz("eiffel-tower", [
    spotQuestion(
      "eiffel-material",
      ["What is the Eiffel Tower mainly built from?", "埃菲尔铁塔主要是用什么建造的？"],
      [
        ["Iron", "铁"],
        ["Stone", "石头"],
        ["Wood", "木头"],
      ],
      0,
      ["It is a lattice of iron, which is why it looks see-through.", "它由铁制网格结构搭成，所以看上去是通透的。"],
    ),
    spotQuestion(
      "eiffel-exposition",
      ["For which event was the Eiffel Tower built?", "埃菲尔铁塔最初为哪项活动建造？"],
      [
        ["The 1889 Paris World's Fair", "1889年巴黎世界博览会"],
        ["The first modern Olympic Games", "第一届现代奥运会"],
        ["The opening of the Channel Tunnel", "英吉利海峡隧道通车"],
      ],
      0,
      ["The tower was built for the 1889 Exposition Universelle in Paris.", "铁塔是为1889年巴黎世界博览会建造的。"],
    ),
  ]),

  "statue-of-liberty": spotQuiz("statue-of-liberty", [
    spotQuestion(
      "liberty-gift",
      ["Which country gave the Statue of Liberty to the United States?", "自由女神像由哪个国家赠予美国？"],
      [
        ["France", "法国"],
        ["Canada", "加拿大"],
        ["Italy", "意大利"],
      ],
      0,
      ["France presented the copper statue to the United States; it was unveiled in 1886.", "这座铜像由法国赠予美国，并于1886年揭幕。"],
    ),
    spotQuestion(
      "liberty-green",
      ["Why is the Statue of Liberty green today?", "自由女神像今天为什么呈绿色？"],
      [
        ["Its copper surface formed a patina", "铜表面形成了绿色铜锈"],
        ["It is covered with grass", "表面长满青草"],
        ["Green lights shine on it all day", "全天都有绿灯照射"],
      ],
      0,
      ["Weathering changed the copper surface into a protective green patina.", "铜表面经过风化形成了具有保护作用的绿色铜锈。"],
    ),
  ]),

  "machu-picchu": spotQuiz("machu-picchu", [
    spotQuestion(
      "machu-culture",
      ["Which civilization built Machu Picchu?", "马丘比丘由哪个文明建造？"],
      [
        ["The Inca", "印加文明"],
        ["The Roman Empire", "罗马帝国"],
        ["Ancient Egypt", "古埃及"],
      ],
      0,
      ["Machu Picchu is a fifteenth-century Inca site in the Peruvian Andes.", "马丘比丘是位于秘鲁安第斯山区的十五世纪印加遗址。"],
    ),
    spotQuestion(
      "machu-stone",
      ["How were many stones at Machu Picchu fitted together?", "马丘比丘的许多石块采用什么方式结合？"],
      [
        ["Precise dry-stone masonry", "精密的干砌方式"],
        ["Steel welding", "钢材焊接"],
        ["Modern concrete panels", "现代混凝土预制板"],
      ],
      0,
      ["Carefully shaped stones fit tightly without mortar.", "经过精细加工的石块无需砂浆也能紧密结合。"],
    ),
  ]),

  "christ-the-redeemer": spotQuiz("christ-the-redeemer", [
    spotQuestion(
      "christ-mountain",
      ["On which mountain does Christ the Redeemer stand?", "里约热内卢基督像位于哪座山顶？"],
      [
        ["Corcovado", "科尔科瓦多山"],
        ["Mount Fuji", "富士山"],
        ["Ben Nevis", "本尼维斯山"],
      ],
      0,
      ["The statue overlooks Rio de Janeiro from the summit of Corcovado.", "雕像从科尔科瓦多山顶俯瞰里约热内卢。"],
    ),
    spotQuestion(
      "christ-pose",
      ["Which pose gives the statue its famous silhouette?", "哪种姿态构成了基督像著名的轮廓？"],
      [
        ["Arms spread wide", "双臂展开"],
        ["Holding a torch overhead", "高举火炬"],
        ["Sitting on a throne", "坐在王座上"],
      ],
      0,
      ["Its outstretched arms span about 28 metres.", "雕像展开的双臂宽约28米。"],
    ),
  ]),

  "chichen-itza": spotQuiz("chichen-itza", [
    spotQuestion(
      "chichen-culture",
      ["Chichén Itzá was an important city of which civilization?", "奇琴伊察是哪个文明的重要城市？"],
      [
        ["Maya", "玛雅文明"],
        ["Viking", "维京文明"],
        ["Inca", "印加文明"],
      ],
      0,
      ["The site was a major Maya city on Mexico's Yucatán Peninsula.", "这里是墨西哥尤卡坦半岛上的重要玛雅城市。"],
    ),
    spotQuestion(
      "chichen-calendar",
      ["What number is often linked to El Castillo's steps and top platform?", "库库尔坎金字塔的阶梯与顶部平台常与哪个数字联系起来？"],
      [
        ["100", "100"],
        ["365", "365"],
        ["1,000", "1000"],
      ],
      1,
      ["Their total is often interpreted as the 365 days of the solar year.", "它们的合计数常被解读为对应太阳年的365天。"],
    ),
  ]),

  petra: spotQuiz("petra", [
    spotQuestion(
      "petra-builders",
      ["Which people made Petra an important trade centre?", "哪个古代民族把佩特拉发展为重要商贸中心？"],
      [
        ["The Nabataeans", "纳巴泰人"],
        ["The Aztecs", "阿兹特克人"],
        ["The Vikings", "维京人"],
      ],
      0,
      ["Petra was a major centre of the Nabataean kingdom and its trade routes.", "佩特拉曾是纳巴泰王国及其商路上的重要中心。"],
    ),
    spotQuestion(
      "petra-rock",
      ["How were many of Petra's famous façades made?", "佩特拉许多著名建筑立面是怎样建成的？"],
      [
        ["Carved directly into sandstone cliffs", "直接从砂岩崖壁中凿出"],
        ["Printed from metal sheets", "用金属板打印"],
        ["Floated on wooden rafts", "建在木筏上漂浮"],
      ],
      0,
      ["Builders cut tombs and temples directly into rose-coloured sandstone.", "建造者直接在玫瑰色砂岩中凿出墓室与神殿。"],
    ),
  ]),

  "angkor-wat": spotQuiz("angkor-wat", [
    spotQuestion(
      "angkor-country",
      ["In which country is Angkor Wat?", "吴哥窟位于哪个国家？"],
      [
        ["Cambodia", "柬埔寨"],
        ["Thailand", "泰国"],
        ["India", "印度"],
      ],
      0,
      ["Angkor Wat stands near Siem Reap in Cambodia.", "吴哥窟位于柬埔寨暹粒附近。"],
    ),
    spotQuestion(
      "angkor-origin",
      ["To which deity was Angkor Wat originally dedicated?", "吴哥窟最初奉献给哪位神祇？"],
      [
        ["Vishnu", "毗湿奴"],
        ["Zeus", "宙斯"],
        ["Odin", "奥丁"],
      ],
      0,
      ["It was built in the twelfth century as a temple dedicated to Vishnu, and later became an important Buddhist site.", "它建于十二世纪，最初奉献给毗湿奴，后来成为重要佛教场所。"],
    ),
  ]),

  "sydney-opera-house": spotQuiz("sydney-opera-house", [
    spotQuestion(
      "opera-architect",
      ["Who designed the Sydney Opera House?", "悉尼歌剧院由谁设计？"],
      [
        ["Jørn Utzon", "约恩·乌松"],
        ["Antoni Gaudí", "安东尼·高迪"],
        ["Gustave Eiffel", "古斯塔夫·埃菲尔"],
      ],
      0,
      ["Danish architect Jørn Utzon designed the building, which opened in 1973.", "丹麦建筑师约恩·乌松设计了这座于1973年开放的建筑。"],
    ),
    spotQuestion(
      "opera-roof",
      ["What do the Opera House's white roof forms resemble?", "悉尼歌剧院白色屋顶的轮廓常让人联想到什么？"],
      [
        ["Sails or shells", "风帆或贝壳"],
        ["A stepped pyramid", "阶梯金字塔"],
        ["A stone circle", "石环"],
      ],
      0,
      ["The related shell forms spread across Bennelong Point beside Sydney Harbour.", "一组几何相关的壳体在悉尼港边的贝内朗角展开。"],
    ),
  ]),

  "grand-canyon": spotQuiz("grand-canyon", [
    spotQuestion(
      "grand-canyon-river",
      ["Which river flows through the Grand Canyon?", "哪条河流经美国大峡谷？"],
      [
        ["The Colorado River", "科罗拉多河"],
        ["The Mississippi River", "密西西比河"],
        ["The Hudson River", "哈德逊河"],
      ],
      0,
      ["The Colorado River and long-term erosion helped carve the canyon.", "科罗拉多河及长期侵蚀共同塑造了大峡谷。"],
    ),
    spotQuestion(
      "grand-canyon-rock",
      ["What can the canyon's exposed rock layers reveal?", "大峡谷裸露的岩层可以展示什么？"],
      [
        ["A long record of geological history", "漫长的地质历史"],
        ["Only last year's weather", "只有去年的天气"],
        ["The route of an underground railway", "地下铁路的线路"],
      ],
      0,
      ["Its stacked rock layers preserve evidence from immense spans of Earth's history.", "层层裸露的岩石记录了极其漫长的地球历史。"],
    ),
  ]),

  "mount-everest": spotQuiz("mount-everest", [
    spotQuestion(
      "everest-record",
      ["What record does Mount Everest hold?", "珠穆朗玛峰拥有哪项世界纪录？"],
      [
        ["Highest mountain above sea level", "海拔最高的山峰"],
        ["Largest volcano by area", "面积最大的火山"],
        ["Longest mountain tunnel", "最长的山地隧道"],
      ],
      0,
      ["Its official elevation is 8,848.86 metres above sea level.", "珠穆朗玛峰的海拔为8848.86米。"],
    ),
    spotQuestion(
      "everest-border",
      ["Mount Everest stands on the border of which two countries?", "珠穆朗玛峰位于哪两个国家的边界？"],
      [
        ["China and Nepal", "中国与尼泊尔"],
        ["India and Sri Lanka", "印度与斯里兰卡"],
        ["Japan and South Korea", "日本与韩国"],
      ],
      0,
      ["The summit lies on the China–Nepal border in the Himalayas.", "峰顶位于喜马拉雅山脉中的中国与尼泊尔边界。"],
    ),
  ]),

  "niagara-falls": spotQuiz("niagara-falls", [
    spotQuestion(
      "niagara-count",
      ["How many main waterfalls make up Niagara Falls?", "尼亚加拉瀑布由几处主要瀑布组成？"],
      [
        ["One", "一处"],
        ["Three", "三处"],
        ["Seven", "七处"],
      ],
      1,
      ["They are Horseshoe Falls, American Falls and Bridal Veil Falls.", "它由马蹄瀑布、美国瀑布和新娘面纱瀑布组成。"],
    ),
    spotQuestion(
      "niagara-border",
      ["Which two countries share Niagara Falls?", "尼亚加拉瀑布横跨哪两个国家？"],
      [
        ["Canada and the United States", "加拿大与美国"],
        ["Brazil and Argentina", "巴西与阿根廷"],
        ["France and Germany", "法国与德国"],
      ],
      0,
      ["The Niagara River forms part of the border between Canada and the United States.", "尼亚加拉河的一部分构成加拿大与美国的边界。"],
    ),
  ]),

  "easter-island-moai": spotQuiz("easter-island-moai", [
    spotQuestion(
      "moai-count",
      ["How many restored moai stand at Ahu Tongariki?", "阿胡汤加里基石台上重新竖立了多少尊摩艾？"],
      [
        ["Five", "五尊"],
        ["Fifteen", "十五尊"],
        ["Fifty", "五十尊"],
      ],
      1,
      ["Fifteen moai stand in a row on the island's largest restored ceremonial platform.", "十五尊摩艾在复活节岛规模最大的修复石台上一字排开。"],
    ),
    spotQuestion(
      "moai-direction",
      ["At Ahu Tongariki, which way do the moai face?", "在阿胡汤加里基，摩艾石像面向哪里？"],
      [
        ["Toward the island's interior", "面向岛内"],
        ["Straight out to sea", "面向大海"],
        ["Down into the ground", "面向地下"],
      ],
      0,
      ["The statues stand with the Pacific behind them and face inland.", "石像背靠太平洋，面向岛内排列。"],
    ),
  ]),

  pompeii: spotQuiz("pompeii", [
    spotQuestion(
      "pompeii-volcano",
      ["Which volcano buried Pompeii in AD 79?", "公元79年喷发并掩埋庞贝的是哪座火山？"],
      [
        ["Mount Vesuvius", "维苏威火山"],
        ["Mount Fuji", "富士山"],
        ["Mount Etna", "埃特纳火山"],
      ],
      0,
      ["Material from Mount Vesuvius covered the Roman city in AD 79.", "公元79年，维苏威火山喷发物覆盖了这座古罗马城市。"],
    ),
    spotQuestion(
      "pompeii-preserved",
      ["What makes Pompeii especially valuable to historians?", "庞贝古城为什么对历史研究格外重要？"],
      [
        ["It preserves streets, buildings and daily-life spaces", "它保存了街道、建筑与日常生活空间"],
        ["It contains the world's tallest tower", "它拥有世界最高塔楼"],
        ["It was never inhabited", "这里从未有人居住"],
      ],
      0,
      ["Its preserved urban spaces provide unusually complete evidence of Roman city life.", "保存下来的城市空间为认识古罗马生活提供了罕见而完整的材料。"],
    ),
  ]),

  "burj-khalifa": spotQuiz("burj-khalifa", [
    spotQuestion(
      "burj-height",
      ["About how tall is the Burj Khalifa?", "哈利法塔高度约为多少？"],
      [
        ["328 metres", "328米"],
        ["828 metres", "828米"],
        ["1,828 metres", "1828米"],
      ],
      1,
      ["The Burj Khalifa rises 828 metres above Dubai.", "哈利法塔高828米，耸立在迪拜天际线上。"],
    ),
    spotQuestion(
      "burj-shape",
      ["Which design helps the Burj Khalifa handle structure and wind?", "哈利法塔采用什么设计帮助应对结构与风力要求？"],
      [
        ["A three-wing plan with step-backs", "三翼形平面与逐级退台"],
        ["A single flat stone slab", "单块平直石板"],
        ["A floating wooden hull", "漂浮木船结构"],
      ],
      0,
      ["Its three wings and narrowing setbacks break up wind forces as the tower rises.", "三翼结构与逐级收窄的退台帮助高塔分散风力影响。"],
    ),
  ]),

  "sagrada-familia": spotQuiz("sagrada-familia", [
    spotQuestion(
      "sagrada-architect",
      ["Which architect is most closely associated with the Sagrada Família?", "哪位建筑师与圣家堂关系最密切？"],
      [
        ["Antoni Gaudí", "安东尼·高迪"],
        ["Jørn Utzon", "约恩·乌松"],
        ["I. M. Pei", "贝聿铭"],
      ],
      0,
      ["Gaudí spent much of his later career developing the church's design.", "高迪在职业生涯后期长期主持圣家堂的设计。"],
    ),
    spotQuestion(
      "sagrada-inspiration",
      ["What strongly inspired the Sagrada Família's forms?", "圣家堂的建筑形态深受什么启发？"],
      [
        ["Natural structures and light", "自然结构与光线"],
        ["Airport runways", "机场跑道"],
        ["Ancient warships", "古代战船"],
      ],
      0,
      ["Gaudí combined structure, light and forms that suggest natural growth.", "高迪把结构、光线与仿佛自然生长的形态结合起来。"],
    ),
  ]),

  "leaning-tower-of-pisa": spotQuiz("leaning-tower-of-pisa", [
    spotQuestion(
      "pisa-function",
      ["What was the Leaning Tower of Pisa built to be?", "比萨斜塔最初是什么建筑？"],
      [
        ["A bell tower", "钟楼"],
        ["A lighthouse", "灯塔"],
        ["A palace", "宫殿"],
      ],
      0,
      ["It is the freestanding bell tower of Pisa Cathedral.", "它是比萨主教座堂的独立钟楼。"],
    ),
    spotQuestion(
      "pisa-lean",
      ["Why did the tower begin to lean during construction?", "比萨斜塔为什么在施工期间就开始倾斜？"],
      [
        ["Uneven support from the foundation soil", "地基土层承载不均"],
        ["A ship struck the tower", "船只撞击塔身"],
        ["The top was designed off-centre", "塔顶故意偏心设计"],
      ],
      0,
      ["Soft ground settled unevenly beneath the foundation, causing the tilt.", "地基下方较软的土层发生不均匀沉降，导致塔体倾斜。"],
    ),
  ]),

  stonehenge: spotQuiz("stonehenge", [
    spotQuestion(
      "stonehenge-form",
      ["What is a trilithon at Stonehenge?", "巨石阵中的“三石门”由什么组成？"],
      [
        ["Two upright stones supporting one lintel", "两块竖石承托一块横石"],
        ["Three stones stacked vertically", "三块石头垂直叠放"],
        ["A circle of small pebbles", "一圈小卵石"],
      ],
      0,
      ["The two uprights and their horizontal lintel form Stonehenge's most recognizable structure.", "两块竖石与上方横梁构成巨石阵最具辨识度的结构。"],
    ),
    spotQuestion(
      "stonehenge-age",
      ["Around when did Stonehenge's main stone circle take shape?", "巨石阵主体石圈大约在何时形成？"],
      [
        ["Around 2500 BCE", "约公元前2500年"],
        ["Around AD 1500", "约公元1500年"],
        ["In the twentieth century", "20世纪"],
      ],
      0,
      ["The main stone setting dates to roughly 2500 BCE, after earlier phases at the site.", "主体石圈约形成于公元前2500年，此前遗址还经历过更早阶段。"],
    ),
  ]),

  "golden-gate-bridge": spotQuiz("golden-gate-bridge", [
    spotQuestion(
      "golden-gate-water",
      ["What does the Golden Gate Bridge cross?", "金门大桥跨越什么水域？"],
      [
        ["The strait between the Pacific and San Francisco Bay", "太平洋与旧金山湾之间的海峡"],
        ["The River Thames", "泰晤士河"],
        ["The Panama Canal", "巴拿马运河"],
      ],
      0,
      ["The bridge spans the Golden Gate strait at the entrance to San Francisco Bay.", "大桥跨越旧金山湾入口处的金门海峡。"],
    ),
    spotQuestion(
      "golden-gate-colour",
      ["Why is the bridge's International Orange colour useful?", "金门大桥的“国际橙”颜色有什么实际作用？"],
      [
        ["It improves visibility in fog", "提高海雾中的可见度"],
        ["It makes the bridge invisible at sunset", "让桥在日落时隐形"],
        ["It cools the ocean below", "降低下方海水温度"],
      ],
      0,
      ["The colour suits the landscape while helping the bridge stand out in frequent fog.", "这种颜色既与周边景观协调，也让桥体在常见海雾中更加醒目。"],
    ),
  ]),

  uluru: spotQuiz("uluru", [
    spotQuestion(
      "uluru-location",
      ["Where is Uluru?", "乌鲁鲁位于哪里？"],
      [
        ["Central Australia", "澳大利亚中部"],
        ["Northern Norway", "挪威北部"],
        ["Southern Japan", "日本南部"],
      ],
      0,
      ["Uluru rises from the red desert landscape of central Australia.", "乌鲁鲁从澳大利亚中部的红土荒原中整体升起。"],
    ),
    spotQuestion(
      "uluru-culture",
      ["For which people is Uluru an important cultural landscape?", "乌鲁鲁是哪一群体的重要文化景观？"],
      [
        ["The Aṉangu", "阿南古人"],
        ["The Inuit", "因纽特人"],
        ["The Sámi", "萨米人"],
      ],
      0,
      ["The Aṉangu are the Traditional Owners and co-manage the national park.", "阿南古人是这里的传统所有者，并共同参与国家公园管理。"],
    ),
  ]),

  "grand-prismatic-spring": spotQuiz("grand-prismatic-spring", [
    spotQuestion(
      "prismatic-park",
      ["In which national park is Grand Prismatic Spring?", "大棱镜温泉位于哪座国家公园？"],
      [
        ["Yellowstone", "黄石国家公园"],
        ["Yosemite", "优胜美地国家公园"],
        ["Grand Canyon", "大峡谷国家公园"],
      ],
      0,
      ["It is the largest hot spring in Yellowstone National Park.", "它是黄石国家公园中最大的温泉。"],
    ),
    spotQuestion(
      "prismatic-colours",
      ["What helps create the spring's coloured outer bands?", "什么因素帮助形成温泉外围的彩色色带？"],
      [
        ["Microbial communities living at different temperatures", "生活在不同温度环境中的微生物群落"],
        ["Paint added every morning", "每天早晨添加的颜料"],
        ["Reflections from city lights", "城市灯光的反射"],
      ],
      0,
      ["Water temperature influences which heat-loving microbes live in each band.", "水温影响不同色带中嗜热微生物群落的分布。"],
    ),
  ]),

  "victoria-falls": spotQuiz("victoria-falls", [
    spotQuestion(
      "victoria-river",
      ["Which river plunges over Victoria Falls?", "维多利亚瀑布位于哪条河流上？"],
      [
        ["The Zambezi", "赞比西河"],
        ["The Nile", "尼罗河"],
        ["The Amazon", "亚马孙河"],
      ],
      0,
      ["The broad Zambezi drops into a narrow basalt gorge.", "宽阔的赞比西河在这里跌入狭窄的玄武岩峡谷。"],
    ),
    spotQuestion(
      "victoria-name",
      ["What does the local name Mosi-oa-Tunya describe?", "当地名称“莫西奥图尼亚”描绘了什么？"],
      [
        ["The Smoke that Thunders", "雷鸣之烟"],
        ["The Silent Blue Lake", "寂静蓝湖"],
        ["The Endless Sand Road", "无尽沙路"],
      ],
      0,
      ["The name evokes both the waterfall's roar and the great cloud of spray.", "这个名称同时描绘了瀑布的轰鸣和远处可见的巨大水雾。"],
    ),
  ]),

  "great-barrier-reef": spotQuiz("great-barrier-reef", [
    spotQuestion(
      "reef-location",
      ["Off which coast is the Great Barrier Reef?", "大堡礁位于哪片海岸外侧？"],
      [
        ["Queensland in northeastern Australia", "澳大利亚东北部昆士兰海岸"],
        ["Western France", "法国西部海岸"],
        ["Northern Japan", "日本北部海岸"],
      ],
      0,
      ["The reef system stretches along the Queensland coast in the Coral Sea.", "这一珊瑚礁系统沿昆士兰海岸外侧的珊瑚海延伸。"],
    ),
    spotQuestion(
      "reef-system",
      ["What makes up the Great Barrier Reef?", "大堡礁由什么共同构成？"],
      [
        ["Thousands of reefs and hundreds of islands", "数千处礁体与数百座岛屿"],
        ["One solid piece of coral", "一整块实心珊瑚"],
        ["Only floating seaweed", "只有漂浮海藻"],
      ],
      0,
      ["It is the world's largest coral reef ecosystem rather than one single reef.", "它是世界上规模最大的珊瑚礁生态系统，并非一整块单一礁体。"],
    ),
  ]),

  "pointe-du-hoc": spotQuiz("pointe-du-hoc", [
    spotQuestion(
      "pointe-date",
      ["On which date did U.S. Army Rangers climb the cliffs at Pointe du Hoc?", "美国陆军游骑兵在哪一天攀上奥克角悬崖？"],
      [
        ["6 June 1944", "1944年6月6日"],
        ["11 November 1918", "1918年11月11日"],
        ["8 May 1945", "1945年5月8日"],
      ],
      0,
      ["The assault took place on D-Day during the Normandy landings.", "这次行动发生在诺曼底登陆的D日。"],
    ),
    spotQuestion(
      "pointe-memorial",
      ["What does the Pointe du Hoc memorial commemorate?", "奥克角纪念碑纪念什么？"],
      [
        ["The Rangers who took part in the assault", "参与奥克角行动的游骑兵"],
        ["The construction of a medieval castle", "一座中世纪城堡的修建"],
        ["The opening of a railway", "一条铁路的通车"],
      ],
      0,
      ["The memorial stands on a former German observation position and honours the Rangers involved.", "纪念碑建在一处原德军观察阵地上，纪念参与行动的游骑兵。"],
    ),
  ]),

  "hiroshima-peace-memorial": spotQuiz("hiroshima-peace-memorial", [
    spotQuestion(
      "hiroshima-date",
      ["On what date was the atomic bomb dropped on Hiroshima?", "原子弹在哪一天投向广岛？"],
      [
        ["6 August 1945", "1945年8月6日"],
        ["1 September 1939", "1939年9月1日"],
        ["2 September 1945", "1945年9月2日"],
      ],
      0,
      ["The bomb exploded above Hiroshima on 6 August 1945.", "1945年8月6日，原子弹在广岛上空爆炸。"],
    ),
    spotQuestion(
      "hiroshima-meaning",
      ["Why is the damaged dome preserved today?", "为什么残损的原爆圆顶馆被保存至今？"],
      [
        ["To remember the victims and encourage reflection on peace", "追念遇难者并提醒人们思考和平"],
        ["To advertise a new shopping district", "宣传新的商业街区"],
        ["To serve as an airport control tower", "作为机场控制塔"],
      ],
      0,
      ["The memorial bears witness to the consequences of war and expresses a hope for peace.", "这处纪念碑见证战争后果，并寄托对和平的愿望。"],
    ),
  ]),
};

export function getCountryQuiz(atlasName: string | undefined): QuizSet | undefined {
  return atlasName ? COUNTRY_QUIZZES[atlasName] : undefined;
}

export function getSpotQuiz(spotId: PhotoSpotId | undefined): QuizSet | undefined {
  return spotId ? SPOT_QUIZZES[spotId] : undefined;
}
