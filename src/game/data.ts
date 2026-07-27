export type GeoPoint = readonly [longitude: number, latitude: number];

export type CountryId =
  | "portugal"
  | "spain"
  | "france"
  | "united-states"
  | "canada"
  | "mexico"
  | "brazil"
  | "united-kingdom"
  | "germany"
  | "italy"
  | "greece"
  | "morocco"
  | "algeria"
  | "tunisia"
  | "egypt"
  | "turkey"
  | "china"
  | "japan"
  | "south-korea"
  | "india"
  | "thailand"
  | "vietnam"
  | "indonesia"
  | "netherlands"
  | "switzerland"
  | "austria"
  | "poland"
  | "norway"
  | "russia"
  | "iran"
  | "saudi-arabia"
  | "pakistan"
  | "mongolia";

/**
 * Country-specific content only. Geographic geometry is owned by world-map.ts
 * and comes exclusively from world-atlas.
 */
export interface CountryDefinition {
  id: CountryId;
  name: string;
  englishName: string;
  flag: string;
  color: string;
  darkColor: string;
  accent: string;
  intro: string;
  facts: readonly string[];
  city: {
    name: string;
    point: GeoPoint;
  };
  scenery:
    | "atlantic"
    | "mediterranean"
    | "green"
    | "atlas"
    | "sahara"
    | "monsoon"
    | "tropical"
    | "highland";
}

export type PhotoSpotId =
  | "gibraltar-strait"
  | "big-ben"
  | "brandenburg-gate"
  | "colosseum"
  | "acropolis"
  | "swiss-alps"
  | "norway-fjord"
  | "giza-pyramids"
  | "hagia-sophia"
  | "great-wall"
  | "fuji-view"
  | "taj-mahal"
  | "java-volcano"
  | "moscow-domes"
  | "eiffel-tower"
  | "statue-of-liberty"
  | "machu-picchu"
  | "christ-the-redeemer"
  | "chichen-itza"
  | "petra"
  | "angkor-wat"
  | "sydney-opera-house"
  | "grand-canyon"
  | "mount-everest"
  | "niagara-falls"
  | "easter-island-moai"
  | "pompeii"
  | "burj-khalifa"
  | "sagrada-familia"
  | "leaning-tower-of-pisa"
  | "stonehenge"
  | "golden-gate-bridge"
  | "uluru"
  | "grand-prismatic-spring"
  | "victoria-falls"
  | "great-barrier-reef"
  | "pointe-du-hoc"
  | "hiroshima-peace-memorial";

export interface PhotoSpotDefinition {
  id: PhotoSpotId;
  name: string;
  kind: "wonder" | "landmark" | "natural" | "historical";
  visitMode?: "photo" | "reflection";
  atlasCountryName: string;
  accent?: number;
  point: GeoPoint;
  postcard: string;
  description: string;
  fact: string;
}

export const MAP_BOUNDS = {
  minLongitude: -180,
  maxLongitude: 180,
  minLatitude: -82,
  maxLatitude: 82,
} as const;

export const MAP_CENTER = {
  longitude: 0,
  latitude: 0,
} as const;

const BASE_MAP_SCALE = {
  x: 0.84,
  z: 0.62,
} as const;

/**
 * Gameplay distance multiplier layered over the geographic projection.
 * Keep landmark and vehicle model sizes unchanged while giving travel more room.
 */
export const WORLD_TRAVEL_SCALE = 2;

export const MAP_SCALE = {
  x: BASE_MAP_SCALE.x * WORLD_TRAVEL_SCALE,
  z: BASE_MAP_SCALE.z * WORLD_TRAVEL_SCALE,
} as const;

export const COUNTRIES: readonly CountryDefinition[] = [
  {
    id: "portugal",
    name: "葡萄牙",
    englishName: "PORTUGAL",
    flag: "🇵🇹",
    color: "#67b879",
    darkColor: "#397d56",
    accent: "#f1c54b",
    intro: "伊比利亚半岛西侧的国家，海风从大西洋一路吹进城市。",
    facts: [
      "葡萄牙面向大西洋，拥有漫长的海岸线。",
      "里斯本的山坡街道上可以看到有轨电车。",
      "蓝白瓷砖常被用于装饰建筑外墙。",
    ],
    city: {
      name: "里斯本",
      point: [-9.18, 38.78],
    },
    scenery: "atlantic",
  },
  {
    id: "spain",
    name: "西班牙",
    englishName: "SPAIN",
    flag: "🇪🇸",
    color: "#e6b54d",
    darkColor: "#b96e38",
    accent: "#e85d4f",
    intro: "欧洲西南部的国家，同时面向大西洋与地中海。",
    facts: [
      "西班牙占据伊比利亚半岛的大部分地区。",
      "从北部山地到南部海岸，地貌变化很丰富。",
      "城市广场、当代街区与海边小镇各有不同节奏。",
    ],
    city: {
      name: "加的斯",
      point: [-6.22, 36.55],
    },
    scenery: "mediterranean",
  },
  {
    id: "france",
    name: "法国",
    englishName: "FRANCE",
    flag: "🇫🇷",
    color: "#7fc589",
    darkColor: "#4d8c62",
    accent: "#8572c9",
    intro: "从比利牛斯山向北展开，在原型中以南法港口与田野登场。",
    facts: [
      "法国南部同时连接大西洋、山地与地中海。",
      "马赛是一座面向地中海的港口城市。",
      "不同地区拥有各自鲜明的建筑、食物与生活方式。",
    ],
    city: {
      name: "马赛",
      point: [5.35, 43.35],
    },
    scenery: "green",
  },
  {
    id: "united-states",
    name: "美国",
    englishName: "UNITED STATES OF AMERICA",
    flag: "🇺🇸",
    color: "#79ad77",
    darkColor: "#526f55",
    accent: "#cf604f",
    intro: "横跨北美大陆中部，山脉、平原、森林、荒漠与两洋海岸形成巨大的地貌跨度。",
    facts: [
      "落基山脉沿美国西部南北延伸，是北美洲主要山系的一部分。",
      "美国中部以大平原和密西西比河流域为主，东西两侧分别面向太平洋与大西洋。",
      "美国西南部分布着高原、峡谷和干旱荒漠，大峡谷是其中最具代表性的地貌之一。",
    ],
    city: {
      name: "华盛顿",
      point: [-77.04, 38.91],
    },
    scenery: "highland",
  },
  {
    id: "canada",
    name: "加拿大",
    englishName: "CANADA",
    flag: "🇨🇦",
    color: "#6fa589",
    darkColor: "#4b7162",
    accent: "#d45b52",
    intro: "横跨北美洲北部，太平洋山地、辽阔森林、湖泊、草原与北极地貌共同构成广阔国土。",
    facts: [
      "加拿大西部连接落基山脉和太平洋沿岸山地。",
      "加拿大拥有数量众多的湖泊，并与美国共享五大湖水系。",
      "加拿大北部延伸至北极群岛，人口主要集中在国土南部。",
    ],
    city: {
      name: "渥太华",
      point: [-75.7, 45.42],
    },
    scenery: "highland",
  },
  {
    id: "mexico",
    name: "墨西哥",
    englishName: "MEXICO",
    flag: "🇲🇽",
    color: "#b89b63",
    darkColor: "#7c6b4d",
    accent: "#c95b4d",
    intro: "连接北美洲与中美洲，高原、山脉、北部荒漠、热带森林和两侧海岸在这里交汇。",
    facts: [
      "墨西哥高原位于东西两列马德雷山脉之间。",
      "墨西哥北部较为干旱，南部和尤卡坦半岛拥有更温暖湿润的环境。",
      "墨西哥城位于中部高原盆地，是全国最大的城市。",
    ],
    city: {
      name: "墨西哥城",
      point: [-99.13, 19.43],
    },
    scenery: "atlas",
  },
  {
    id: "brazil",
    name: "巴西",
    englishName: "BRAZIL",
    flag: "🇧🇷",
    color: "#55a96d",
    darkColor: "#397650",
    accent: "#e2b746",
    intro: "占据南美洲东部广大区域，亚马孙雨林、巴西高原、漫长河流与大西洋海岸形成多样景观。",
    facts: [
      "亚马孙河及其支流覆盖巴西北部广阔的热带雨林区域。",
      "巴西高原分布在国土中部和东南部，许多大城市靠近大西洋海岸。",
      "巴西是南美洲面积最大的国家，跨越赤道和南回归线。",
    ],
    city: {
      name: "巴西利亚",
      point: [-47.88, -15.79],
    },
    scenery: "tropical",
  },
  {
    id: "united-kingdom",
    name: "英国",
    englishName: "UNITED KINGDOM",
    flag: "🇬🇧",
    color: "#79b78b",
    darkColor: "#466f65",
    accent: "#d65358",
    intro: "位于欧洲西北部的岛国，海岸、绿色丘陵与城市紧密相连。",
    facts: [
      "英国由大不列颠岛、爱尔兰岛东北部和许多小岛组成。",
      "伦敦的泰晤士河穿过城市中心。",
      "从海岸到高地，不同地区拥有差异明显的景观。",
    ],
    city: {
      name: "伦敦",
      point: [-0.13, 51.51],
    },
    scenery: "atlantic",
  },
  {
    id: "germany",
    name: "德国",
    englishName: "GERMANY",
    flag: "🇩🇪",
    color: "#77ba7b",
    darkColor: "#477c57",
    accent: "#e1ad43",
    intro: "位于欧洲中部，河流、森林、平原与城市交通在这里交汇。",
    facts: [
      "德国位于欧洲中部，与多个国家相邻。",
      "莱茵河、多瑙河等河流流经德国。",
      "德国拥有密集的铁路网络和许多不同规模的城市。",
    ],
    city: {
      name: "柏林",
      point: [13.41, 52.52],
    },
    scenery: "green",
  },
  {
    id: "italy",
    name: "意大利",
    englishName: "ITALY",
    flag: "🇮🇹",
    color: "#82bd75",
    darkColor: "#567d50",
    accent: "#d96c54",
    intro: "从阿尔卑斯山向地中海伸展，山地、城市与海岸距离很近。",
    facts: [
      "意大利半岛伸入地中海，地图轮廓常被形容为靴子。",
      "意大利北部连接阿尔卑斯山地区。",
      "罗马保存着跨越多个历史时期的建筑与城市空间。",
    ],
    city: {
      name: "罗马",
      point: [12.5, 41.9],
    },
    scenery: "mediterranean",
  },
  {
    id: "greece",
    name: "希腊",
    englishName: "GREECE",
    flag: "🇬🇷",
    color: "#8bc39b",
    darkColor: "#547f6f",
    accent: "#4f8fc0",
    intro: "山地半岛与众多岛屿面向爱琴海，陆地和海路交替出现。",
    facts: [
      "希腊拥有许多岛屿，海上旅行是地理体验的重要部分。",
      "希腊大部分地区为山地。",
      "雅典周围分布着古代遗迹与现代城市街区。",
    ],
    city: {
      name: "雅典",
      point: [23.73, 37.98],
    },
    scenery: "mediterranean",
  },
  {
    id: "morocco",
    name: "摩洛哥",
    englishName: "MOROCCO",
    flag: "🇲🇦",
    color: "#d79a58",
    darkColor: "#a45c43",
    accent: "#16836b",
    intro: "直布罗陀海峡南岸，城市、山地、海岸与干旱景观在这里相遇。",
    facts: [
      "摩洛哥同时面向大西洋与地中海。",
      "阿特拉斯山脉穿过这个国家。",
      "丹吉尔位于直布罗陀海峡附近，是重要港口城市。",
    ],
    city: {
      name: "丹吉尔",
      point: [-5.81, 35.76],
    },
    scenery: "atlas",
  },
  {
    id: "algeria",
    name: "阿尔及利亚",
    englishName: "ALGERIA",
    flag: "🇩🇿",
    color: "#d7a65a",
    darkColor: "#987149",
    accent: "#2b9f77",
    intro: "北临地中海，从白色海滨城市一路延伸到广阔的撒哈拉。",
    facts: [
      "阿尔及利亚是非洲面积很大的国家之一。",
      "北部人口与城市较集中，南部进入撒哈拉地区。",
      "阿尔及尔的白色建筑沿着地中海岸与山坡展开。",
    ],
    city: {
      name: "阿尔及尔",
      point: [3.05, 36.5],
    },
    scenery: "sahara",
  },
  {
    id: "tunisia",
    name: "突尼斯",
    englishName: "TUNISIA",
    flag: "🇹🇳",
    color: "#d7a65b",
    darkColor: "#9e754d",
    accent: "#3e8ea1",
    intro: "北临地中海，从沿海城市向南逐渐进入干旱地区。",
    facts: [
      "突尼斯位于非洲北部，海岸面向地中海。",
      "北部较湿润，向南逐渐进入撒哈拉边缘。",
      "突尼斯城附近可以看到古城、港口与现代城区。",
    ],
    city: {
      name: "突尼斯城",
      point: [10.18, 36.81],
    },
    scenery: "atlas",
  },
  {
    id: "egypt",
    name: "埃及",
    englishName: "EGYPT",
    flag: "🇪🇬",
    color: "#d9ae63",
    darkColor: "#9c7446",
    accent: "#d8c24c",
    intro: "尼罗河穿过大片干旱地区，连接南北城市并汇入地中海。",
    facts: [
      "埃及大部分地区气候干旱，人口主要集中在尼罗河沿岸和三角洲。",
      "尼罗河向北流入地中海。",
      "开罗是一座规模很大的现代城市，附近分布着著名古代遗迹。",
    ],
    city: {
      name: "开罗",
      point: [31.24, 30.04],
    },
    scenery: "sahara",
  },
  {
    id: "turkey",
    name: "土耳其",
    englishName: "TURKEY",
    flag: "🇹🇷",
    color: "#c8ae6f",
    darkColor: "#8f714d",
    accent: "#d35b50",
    intro: "横跨欧亚连接地中海与黑海，是陆路和海路交汇的天然桥梁。",
    facts: [
      "土耳其的国土横跨亚洲和欧洲。",
      "博斯普鲁斯海峡连接黑海与马尔马拉海。",
      "伊斯坦布尔分布在海峡两岸，拥有繁忙港口与城市交通。",
    ],
    city: {
      name: "伊斯坦布尔",
      point: [28.95, 41.05],
    },
    scenery: "mediterranean",
  },
  {
    id: "china",
    name: "中国",
    englishName: "CHINA",
    flag: "🇨🇳",
    color: "#83b878",
    darkColor: "#557d55",
    accent: "#d95a49",
    intro: "从高原、沙漠到季风平原与漫长海岸，地貌跨度非常丰富。",
    facts: [
      "中国地势总体西高东低，河流多向东流入海洋。",
      "长江是中国长度最长的河流。",
      "北京位于华北平原北部，是中国的首都。",
    ],
    city: {
      name: "北京",
      point: [116.41, 39.9],
    },
    scenery: "highland",
  },
  {
    id: "japan",
    name: "日本",
    englishName: "JAPAN",
    flag: "🇯🇵",
    color: "#8fc19a",
    darkColor: "#587d68",
    accent: "#dc695f",
    intro: "由狭长群岛组成，山地、城市和海岸在很短距离内不断切换。",
    facts: [
      "日本由四个主要岛屿和许多小岛组成。",
      "日本列岛多山，城市主要分布在沿海平原。",
      "东京位于本州岛东部，是规模很大的都市区域。",
    ],
    city: {
      name: "东京",
      point: [139.69, 35.68],
    },
    scenery: "monsoon",
  },
  {
    id: "south-korea",
    name: "韩国",
    englishName: "SOUTH KOREA",
    flag: "🇰🇷",
    color: "#7fbd8e",
    darkColor: "#4f7d64",
    accent: "#4c83bd",
    intro: "位于朝鲜半岛南部，山地占比较高，城市与海岸连接紧密。",
    facts: [
      "韩国三面临海，国土中分布着许多山地。",
      "首尔都市区域位于汉江沿岸。",
      "高速铁路连接多座主要城市。",
    ],
    city: {
      name: "首尔",
      point: [126.98, 37.57],
    },
    scenery: "monsoon",
  },
  {
    id: "india",
    name: "印度",
    englishName: "INDIA",
    flag: "🇮🇳",
    color: "#9bbd73",
    darkColor: "#687b4d",
    accent: "#e18c45",
    intro: "从喜马拉雅山南坡延伸到印度洋，河谷、高原与热带海岸并存。",
    facts: [
      "印度北部连接喜马拉雅山地区。",
      "恒河流域分布着广阔平原和众多城市。",
      "印度半岛向南伸入印度洋。",
    ],
    city: {
      name: "新德里",
      point: [77.21, 28.61],
    },
    scenery: "tropical",
  },
  {
    id: "thailand",
    name: "泰国",
    englishName: "THAILAND",
    flag: "🇹🇭",
    color: "#75ba82",
    darkColor: "#4b7b5b",
    accent: "#d4a746",
    intro: "从北部山地沿河谷向南延伸至热带半岛与海岛。",
    facts: [
      "泰国北部多山，中部是重要河流平原。",
      "湄南河流经曼谷附近并注入泰国湾。",
      "泰国南部是一条狭长半岛，连接多个海岸区域。",
    ],
    city: {
      name: "曼谷",
      point: [100.5, 13.75],
    },
    scenery: "tropical",
  },
  {
    id: "vietnam",
    name: "越南",
    englishName: "VIETNAM",
    flag: "🇻🇳",
    color: "#67b47b",
    darkColor: "#447852",
    accent: "#e4b84f",
    intro: "沿南海形成狭长国土，山地、河流三角洲与海岸一路相接。",
    facts: [
      "越南国土南北狭长，拥有漫长海岸线。",
      "红河三角洲位于北部，湄公河三角洲位于南部。",
      "河内位于越南北部，是越南的首都。",
    ],
    city: {
      name: "河内",
      point: [105.85, 21.03],
    },
    scenery: "tropical",
  },
  {
    id: "indonesia",
    name: "印度尼西亚",
    englishName: "INDONESIA",
    flag: "🇮🇩",
    color: "#70b487",
    darkColor: "#49775c",
    accent: "#cf6054",
    intro: "由分布在赤道附近的大量岛屿组成，海路、火山与热带森林交替出现。",
    facts: [
      "印度尼西亚由大量岛屿组成。",
      "印度尼西亚位于环太平洋火山地震带的一部分。",
      "雅加达位于爪哇岛西北部。",
    ],
    city: {
      name: "雅加达",
      point: [106.85, -6.2],
    },
    scenery: "tropical",
  },
  {
    id: "netherlands",
    name: "荷兰",
    englishName: "NETHERLANDS",
    flag: "🇳🇱",
    color: "#79b995",
    darkColor: "#4b7c68",
    accent: "#e48a49",
    intro: "面向北海的低地国家，河流、运河、堤坝与城市紧密相连。",
    facts: [
      "荷兰有相当一部分土地低于海平面。",
      "阿姆斯特丹拥有密集的运河网络。",
      "堤坝、泵站和水利工程长期参与塑造荷兰地貌。",
    ],
    city: {
      name: "阿姆斯特丹",
      point: [4.9, 52.37],
    },
    scenery: "green",
  },
  {
    id: "switzerland",
    name: "瑞士",
    englishName: "SWITZERLAND",
    flag: "🇨🇭",
    color: "#86ae78",
    darkColor: "#5d7858",
    accent: "#dc584f",
    intro: "位于欧洲中部的内陆山地国家，阿尔卑斯山、湖泊与河谷塑造了交通路线。",
    facts: [
      "瑞士位于阿尔卑斯山地区，是欧洲重要的山地交通节点。",
      "莱茵河和罗讷河都发源于瑞士附近的阿尔卑斯山区。",
      "伯尔尼位于阿勒河弯曲环绕的高地上。",
    ],
    city: {
      name: "伯尔尼",
      point: [7.45, 46.95],
    },
    scenery: "highland",
  },
  {
    id: "austria",
    name: "奥地利",
    englishName: "AUSTRIA",
    flag: "🇦🇹",
    color: "#8fba7f",
    darkColor: "#617b58",
    accent: "#cf5d55",
    intro: "从阿尔卑斯山谷向多瑙河平原展开，是中欧陆路与河路交汇的国家。",
    facts: [
      "奥地利西部和中部大部分位于阿尔卑斯山区。",
      "多瑙河自西向东流经奥地利北部和维也纳。",
      "维也纳长期以音乐、建筑和城市公共交通闻名。",
    ],
    city: {
      name: "维也纳",
      point: [16.37, 48.21],
    },
    scenery: "highland",
  },
  {
    id: "poland",
    name: "波兰",
    englishName: "POLAND",
    flag: "🇵🇱",
    color: "#8cbb82",
    darkColor: "#5c7b59",
    accent: "#db675e",
    intro: "位于欧洲平原中部，波罗的海、森林、湖区与南部山地形成清晰层次。",
    facts: [
      "波兰北部面向波罗的海，中部以平原为主。",
      "维斯瓦河自南向北流经华沙并最终汇入波罗的海。",
      "波兰南部连接喀尔巴阡山和苏台德山地区。",
    ],
    city: {
      name: "华沙",
      point: [21.01, 52.23],
    },
    scenery: "green",
  },
  {
    id: "norway",
    name: "挪威",
    englishName: "NORWAY",
    flag: "🇳🇴",
    color: "#6fa996",
    darkColor: "#4a756a",
    accent: "#d85f55",
    intro: "沿斯堪的纳维亚半岛西侧狭长延伸，峡湾、山脉与岛屿不断切分海岸。",
    facts: [
      "挪威拥有非常曲折的海岸线和大量峡湾。",
      "斯堪的纳维亚山脉贯穿挪威许多地区。",
      "奥斯陆坐落在深入陆地的奥斯陆峡湾北端。",
    ],
    city: {
      name: "奥斯陆",
      point: [10.75, 59.91],
    },
    scenery: "highland",
  },
  {
    id: "russia",
    name: "俄罗斯",
    englishName: "RUSSIA",
    flag: "🇷🇺",
    color: "#83ad91",
    darkColor: "#577665",
    accent: "#d46158",
    intro: "横跨欧洲东部与亚洲北部，森林、草原、冻土和漫长河流覆盖巨大的东西距离。",
    facts: [
      "俄罗斯横跨欧洲和亚洲，是世界上国土面积最大的国家。",
      "伏尔加河流经俄罗斯欧洲部分并注入里海。",
      "西伯利亚覆盖俄罗斯亚洲部分的广大区域。",
    ],
    city: {
      name: "莫斯科",
      point: [37.62, 55.75],
    },
    scenery: "green",
  },
  {
    id: "iran",
    name: "伊朗",
    englishName: "IRAN",
    flag: "🇮🇷",
    color: "#b69b70",
    darkColor: "#806a52",
    accent: "#cf514a",
    intro: "位于西亚高原，山脉、盆地、沙漠与里海和波斯湾两侧海岸共同塑造路线。",
    facts: [
      "伊朗大部分国土位于伊朗高原。",
      "扎格罗斯山脉沿伊朗西部和西南部延伸。",
      "德黑兰位于厄尔布尔士山脉南麓。",
    ],
    city: {
      name: "德黑兰",
      point: [51.39, 35.69],
    },
    scenery: "highland",
  },
  {
    id: "saudi-arabia",
    name: "沙特阿拉伯",
    englishName: "SAUDI ARABIA",
    flag: "🇸🇦",
    color: "#c5aa6c",
    darkColor: "#89744e",
    accent: "#4d986e",
    intro: "占据阿拉伯半岛大部，红海、波斯湾、岩石高原与广阔沙漠围成漫长旅行线。",
    facts: [
      "沙特阿拉伯占据阿拉伯半岛的大部分地区。",
      "鲁卜哈利沙漠位于阿拉伯半岛南部，是大型流动沙漠之一。",
      "利雅得位于阿拉伯半岛内部的高原地区。",
    ],
    city: {
      name: "利雅得",
      point: [46.68, 24.71],
    },
    scenery: "sahara",
  },
  {
    id: "pakistan",
    name: "巴基斯坦",
    englishName: "PAKISTAN",
    flag: "🇵🇰",
    color: "#83af78",
    darkColor: "#557650",
    accent: "#4d916b",
    intro: "从阿拉伯海岸沿印度河谷向北延伸至世界级高山，是南亚重要的地理通道。",
    facts: [
      "印度河自北向南贯穿巴基斯坦并注入阿拉伯海。",
      "巴基斯坦北部连接喀喇昆仑山和喜马拉雅山地区。",
      "伊斯兰堡位于波特瓦尔高原北缘。",
    ],
    city: {
      name: "伊斯兰堡",
      point: [73.05, 33.69],
    },
    scenery: "highland",
  },
  {
    id: "mongolia",
    name: "蒙古国",
    englishName: "MONGOLIA",
    flag: "🇲🇳",
    color: "#a9ad70",
    darkColor: "#74784f",
    accent: "#d17a48",
    intro: "位于亚洲内陆，辽阔草原、戈壁与山地让地平线成为最醒目的景观。",
    facts: [
      "蒙古国是内陆国家，北邻俄罗斯、南邻中国。",
      "戈壁分布在蒙古国南部及中国北部的部分地区。",
      "乌兰巴托位于蒙古国中北部的河谷中。",
    ],
    city: {
      name: "乌兰巴托",
      point: [106.91, 47.92],
    },
    scenery: "highland",
  },
] as const;

/**
 * 手机打卡点是一层独立的精选世界内容，不是国家配额。
 * 一个国家可以没有，也可以拥有多个；名胜直接关联世界地图国家，不受重点国家内容范围限制。
 */
export const PHOTO_SPOTS: readonly PhotoSpotDefinition[] = [
  {
    id: "gibraltar-strait",
    name: "直布罗陀海峡",
    kind: "natural",
    atlasCountryName: "Spain",
    point: [-5.62, 36.03],
    postcard: "欧洲与非洲隔海相望的蓝色海峡",
    description:
      "直布罗陀海峡夹在伊比利亚半岛南端与北非之间。向西连接大西洋，向东进入地中海，航船、海风与两岸山体共同构成这里最鲜明的景观。",
    fact: "海峡最窄处只有约十四公里，是地中海通往大西洋的门户。",
  },
  {
    id: "big-ben",
    name: "大本钟",
    kind: "landmark",
    atlasCountryName: "United Kingdom",
    point: [-0.125, 51.501],
    postcard: "泰晤士河畔的钟楼与红色巴士",
    description:
      "伊丽莎白塔矗立在英国议会大厦北端，是伦敦天际线中辨识度最高的建筑之一。哥特复兴式立面、四面钟盘和报时钟声，让它成为英国公共生活与城市记忆的象征。",
    fact: "“大本钟”最初是钟的昵称，所在钟楼现名为伊丽莎白塔。",
  },
  {
    id: "brandenburg-gate",
    name: "勃兰登堡门",
    kind: "landmark",
    atlasCountryName: "Germany",
    point: [13.378, 52.516],
    postcard: "柏林林荫道尽头的古典城门",
    description:
      "勃兰登堡门位于柏林市中心，由十二根多立克式柱构成五条通道。它曾处在城市分裂的边缘，后来又成为德国重新统一与欧洲交流的重要公共空间。",
    fact: "它从旧城门变成了德国历史与统一的重要象征。",
  },
  {
    id: "colosseum",
    name: "罗马斗兽场",
    kind: "wonder",
    atlasCountryName: "Italy",
    point: [12.492, 41.89],
    postcard: "夕阳下的椭圆形古罗马建筑",
    description:
      "罗马斗兽场以巨大的椭圆形结构容纳古代公共表演。多层拱券、环形看台和地下空间展示了罗马工程技术，也让这座建筑在近两千年后依然保持清晰轮廓。",
    fact: "这座大型圆形剧场在公元一世纪建成，可容纳数万名观众。",
  },
  {
    id: "acropolis",
    name: "雅典卫城",
    kind: "wonder",
    atlasCountryName: "Greece",
    point: [23.726, 37.972],
    postcard: "石灰岩山丘上的古典神庙",
    description:
      "雅典卫城建在城市中央的石灰岩高地上，由神庙、门廊和纪念建筑组成。沿坡而上时，帕特农神庙会逐渐占据视野，形成古典雅典最具代表性的城市景观。",
    fact: "卫城位于雅典制高点，帕特农神庙是其中最醒目的建筑。",
  },
  {
    id: "swiss-alps",
    name: "瑞士阿尔卑斯",
    kind: "natural",
    atlasCountryName: "Switzerland",
    point: [7.98, 46.58],
    postcard: "雪峰、山谷与红色列车",
    description:
      "瑞士阿尔卑斯由高耸雪峰、冰川谷地、草甸和山间聚落共同组成。铁路与缆车穿行其间，把自然地貌、工程建设和四季旅行连接成紧密的山地网络。",
    fact: "阿尔卑斯山塑造了瑞士的地貌、交通与四季旅游。",
  },
  {
    id: "norway-fjord",
    name: "挪威峡湾",
    kind: "natural",
    atlasCountryName: "Norway",
    point: [7.2, 62.1],
    postcard: "陡峭雪山之间深入陆地的蓝色海湾",
    description:
      "挪威峡湾是海水进入冰川侵蚀深谷后形成的狭长水域。陡峭岩壁从水面直接升起，瀑布、农庄和小型港口散落在有限的平缓地带，空间尺度格外鲜明。",
    fact: "许多挪威峡湾由冰川侵蚀形成，海水沿深谷进入陆地。",
  },
  {
    id: "giza-pyramids",
    name: "吉萨金字塔群",
    kind: "wonder",
    atlasCountryName: "Egypt",
    point: [31.134, 29.979],
    postcard: "沙漠边缘的金色金字塔",
    description:
      "吉萨金字塔群位于尼罗河谷与撒哈拉沙漠的交界地带。三座主要金字塔、狮身人面像和周边墓葬共同组成古埃及规模最宏大的纪念性建筑景观之一。",
    fact: "胡夫金字塔是古代世界七大奇迹中唯一大体保存至今的一处。",
  },
  {
    id: "hagia-sophia",
    name: "圣索菲亚大教堂",
    kind: "wonder",
    atlasCountryName: "Turkey",
    point: [28.98, 41.008],
    postcard: "博斯普鲁斯海峡旁的巨大穹顶",
    description:
      "圣索菲亚大教堂坐落于伊斯坦布尔历史城区，中央巨型穹顶与层叠半穹顶形成开阔内部空间。建筑在不同历史阶段承担过宗教与公共文化功能，留下多重文明痕迹。",
    fact: "这座建筑跨越不同历史时期，长期影响着穹顶建筑的发展。",
  },
  {
    id: "great-wall",
    name: "长城",
    kind: "wonder",
    atlasCountryName: "China",
    point: [116.57, 40.43],
    postcard: "沿山脊起伏的城墙与烽火台",
    description:
      "长城并不是一条在同一时期建成的连续城墙，而是由不同朝代修筑的城墙、关隘、壕堑和烽火台组成。北京北部山地的长城顺着山脊延伸，防御功能与地形关系清晰可见。",
    fact: "今天所见的长城由不同朝代、不同地段共同构成，并非一条单一城墙。",
  },
  {
    id: "fuji-view",
    name: "富士山",
    kind: "natural",
    atlasCountryName: "Japan",
    point: [138.73, 35.36],
    postcard: "湖面后方对称的火山雪峰",
    description:
      "富士山是一座轮廓近乎对称的成层火山，晴朗天气下可从关东多地远眺。山麓分布湖泊、森林和聚落，季节变化会不断改变雪线与山体色彩。",
    fact: "富士山是日本最高峰，也是一座仍被列为活火山的成层火山。",
  },
  {
    id: "taj-mahal",
    name: "泰姬陵",
    kind: "wonder",
    atlasCountryName: "India",
    point: [78.042, 27.175],
    postcard: "水池倒影中的白色穹顶建筑",
    description:
      "泰姬陵以中央陵墓为核心，花园、水渠、清真寺与入口建筑沿轴线展开。白色大理石会随日照呈现细微色彩变化，严格对称的布局则强化了建筑的宁静与纪念性。",
    fact: "泰姬陵以白色大理石和近乎对称的布局闻名。",
  },
  {
    id: "java-volcano",
    name: "爪哇火山群",
    kind: "natural",
    atlasCountryName: "Indonesia",
    point: [110.2, -7.6],
    postcard: "热带晨雾中的层叠火山",
    description:
      "爪哇岛位于活跃板块边界，火山链几乎贯穿全岛。火山灰形成肥沃土壤，人口密集的农田与城市因此靠近山体，也让自然力量与日常生活保持紧密联系。",
    fact: "印度尼西亚位于环太平洋火山带，拥有数量众多的活火山。",
  },
  {
    id: "moscow-domes",
    name: "圣瓦西里大教堂",
    kind: "landmark",
    atlasCountryName: "Russia",
    point: [37.62, 55.75],
    postcard: "红场旁色彩鲜明的洋葱形穹顶",
    description:
      "圣瓦西里大教堂位于莫斯科红场南端，由多座礼拜堂围绕中央核心组合而成。各不相同的穹顶轮廓、纹样和色彩让整体建筑既统一又富于变化。",
    fact: "这组各不相同的穹顶让建筑形成了极强的远距离识别度。",
  },
  {
    id: "eiffel-tower",
    name: "埃菲尔铁塔",
    kind: "landmark",
    atlasCountryName: "France",
    point: [2.2945, 48.8584],
    postcard: "塞纳河畔逐级收束的金属铁塔",
    description:
      "埃菲尔铁塔位于巴黎战神广场西北端。四座塔脚支撑起向上收束的镂空铁结构，观景平台与顶部天线形成清晰层级；黄昏之后，暖金色灯光让它从巴黎天际线中格外醒目。",
    fact: "铁塔为1889年巴黎世界博览会建造，高约330米，是巴黎最具辨识度的地标之一。",
  },
  {
    id: "statue-of-liberty",
    name: "自由女神像",
    kind: "landmark",
    atlasCountryName: "United States of America",
    accent: 0x4e9b85,
    point: [-74.0445, 40.6892],
    postcard: "自由岛上高举火炬的绿色身影",
    description:
      "自由女神像立于纽约港自由岛的方形基座之上。长袍、七芒冠冕与高举的火炬共同形成远距离也能辨认的轮廓，周围水面则把它与曼哈顿港湾景观连接起来。",
    fact: "这座铜像由法国赠予美国，于1886年揭幕；铜表面后来形成了今天所见的绿色铜锈。",
  },
  {
    id: "machu-picchu",
    name: "马丘比丘",
    kind: "wonder",
    atlasCountryName: "Peru",
    accent: 0x64846d,
    point: [-72.545, -13.1631],
    postcard: "安第斯云雾中沿山脊展开的梯田古城",
    description:
      "马丘比丘坐落在秘鲁安第斯山脊上，农业梯田、石砌建筑和广场顺应陡峭地势分层展开。瓦伊纳比丘峰从遗址后方升起，使城市、山体与云雾共同构成独特景观。",
    fact: "这座十五世纪的印加遗址位于海拔约2430米处，建筑石块以精密的干砌方式结合。",
  },
  {
    id: "christ-the-redeemer",
    name: "里约热内卢基督像",
    kind: "landmark",
    atlasCountryName: "Brazil",
    accent: 0x5f9b78,
    point: [-43.2105, -22.9519],
    postcard: "科尔科瓦多山顶张开双臂的巨像",
    description:
      "基督像矗立在里约热内卢科尔科瓦多山顶，伸展的双臂在薄雾和云层之间形成简洁而有力的剪影。山顶平台俯瞰城市、海湾与群山，是建筑与自然地形共同塑造的地标。",
    fact: "雕像于1931年落成，连同基座总高约38米，双臂展开约28米。",
  },
  {
    id: "chichen-itza",
    name: "奇琴伊察",
    kind: "wonder",
    atlasCountryName: "Mexico",
    accent: 0xb68a46,
    point: [-88.5678, 20.6843],
    postcard: "尤卡坦平原上层层抬升的阶梯金字塔",
    description:
      "奇琴伊察是玛雅文明的重要城市遗址，库库尔坎金字塔以方形台基、四面阶梯和顶部神庙形成鲜明轮廓。周围神庙、柱廊和球场共同展示了城市的宗教与公共空间。",
    fact: "库库尔坎金字塔的四面阶梯与顶部平台合计常被解读为对应太阳年的365天。",
  },
  {
    id: "petra",
    name: "佩特拉古城",
    kind: "wonder",
    atlasCountryName: "Jordan",
    accent: 0xb85f48,
    point: [35.4518, 30.3285],
    postcard: "红砂岩峡谷尽头显露的宝库立面",
    description:
      "佩特拉隐藏在约旦南部的砂岩山谷中。穿过狭窄蛇道后，卡兹尼神殿的柱廊、山花与岩壁一同出现；城市中还有墓室、神殿和水利设施，展现纳巴泰人对沙漠环境的利用。",
    fact: "佩特拉曾是纳巴泰王国的重要商贸中心，许多建筑直接从玫瑰色砂岩崖壁中凿出。",
  },
  {
    id: "angkor-wat",
    name: "吴哥窟",
    kind: "wonder",
    atlasCountryName: "Cambodia",
    accent: 0x7c7046,
    point: [103.867, 13.4125],
    postcard: "护城河与长堤尽头升起的五座塔",
    description:
      "吴哥窟由宽阔护城河、长堤、回廊和中央塔群沿轴线展开。五座莲花苞形高塔从层层抬升的平台上出现，周围雨林衬托出寺庙的规模，却没有遮蔽主体轮廓。",
    fact: "吴哥窟建于十二世纪，最初奉献给毗湿奴，后来成为延续至今的重要佛教场所。",
  },
  {
    id: "sydney-opera-house",
    name: "悉尼歌剧院",
    kind: "landmark",
    atlasCountryName: "Australia",
    accent: 0x3a84a5,
    point: [151.2153, -33.8568],
    postcard: "悉尼港边向同一方向展开的白色壳体",
    description:
      "悉尼歌剧院坐落在贝内朗角伸入港湾的平台上，多组白色拱壳像风帆般沿轴线展开。阶梯基座、海面与附近港湾大桥共同组成澳大利亚最著名的城市景观之一。",
    fact: "歌剧院由约恩·乌松设计，于1973年开放；屋顶由一组几何上相关的壳体构成。",
  },
  {
    id: "grand-canyon",
    name: "美国大峡谷",
    kind: "natural",
    atlasCountryName: "United States of America",
    accent: 0xb85b3f,
    point: [-111.826, 36.0403],
    postcard: "红岩高原突然裂开的巨大峡谷",
    description:
      "从南缘的沙漠景观塔一带望去，大峡谷以多层岩壁、台地和支谷向远处展开。地表颜色随岩层逐级变化，谷底科罗拉多河则在巨大的高差中形成一条细窄水线。",
    fact: "科罗拉多河及长期侵蚀共同塑造了大峡谷，裸露岩层记录了极其漫长的地质历史。",
  },
  {
    id: "mount-everest",
    name: "珠穆朗玛峰",
    kind: "natural",
    atlasCountryName: "Nepal",
    accent: 0x7893a3,
    point: [86.925, 27.9881],
    postcard: "喜马拉雅群峰之上锐利高耸的雪峰",
    description:
      "珠穆朗玛峰位于中国与尼泊尔边界，主峰从冰川谷和周边峰群中继续抬升。裸露岩脊、终年积雪与强风形成不对称而锐利的轮廓，使它与普通圆锥雪山明显不同。",
    fact: "珠穆朗玛峰海拔8848.86米，是地球上海拔最高的山峰。",
  },
  {
    id: "niagara-falls",
    name: "尼亚加拉瀑布",
    kind: "natural",
    atlasCountryName: "Canada",
    accent: 0x3b9fb9,
    point: [-79.0747, 43.0773],
    postcard: "马蹄形崖缘倾泻而下的白色水幕",
    description:
      "尼亚加拉瀑布横跨加拿大与美国边界，由马蹄瀑布、美国瀑布和新娘面纱瀑布组成。宽阔河流在弧形崖缘突然跌落，巨大水量激起持续升腾的水雾。",
    fact: "马蹄瀑布是三处瀑布中规模最大的一处，大部分崖缘位于加拿大一侧。",
  },
  {
    id: "easter-island-moai",
    name: "复活节岛摩艾石像群",
    kind: "wonder",
    atlasCountryName: "Chile",
    accent: 0x6f7669,
    point: [-109.276, -27.125],
    postcard: "阿胡汤加里基石台上一字排开的摩艾",
    description:
      "阿胡汤加里基位于复活节岛东南海岸，十五尊摩艾石像在长石台上面向岛内排列。巨大的头部、突出的眉鼻和修长躯干形成统一而各有差异的剪影，背后是火山草地与太平洋。",
    fact: "阿胡汤加里基是复活节岛规模最大的修复石台，现有十五尊重新竖立的摩艾石像。",
  },
  {
    id: "pompeii",
    name: "庞贝古城",
    kind: "wonder",
    atlasCountryName: "Italy",
    accent: 0x9d664d,
    point: [14.4849, 40.7497],
    postcard: "维苏威火山脚下重新显露的古罗马街城",
    description:
      "庞贝坐落在意大利坎帕尼亚平原，石铺街道、广场、柱廊和住宅遗迹保留了古罗马城市的空间结构。远处的维苏威火山提醒人们，这座城市曾在公元79年的喷发中被火山物质掩埋，后来又经考古工作逐步重见天日。",
    fact: "遗址保存了道路、公共建筑与日常生活空间，为认识古罗马城市生活提供了罕见而完整的材料。",
  },
  {
    id: "burj-khalifa",
    name: "哈利法塔",
    kind: "landmark",
    atlasCountryName: "United Arab Emirates",
    accent: 0x73a9bd,
    point: [55.2744, 25.1972],
    postcard: "迪拜天际线中逐级收束的银色高塔",
    description:
      "哈利法塔从三翼形基座向上生长，塔身通过一连串退台逐渐收窄，最后连接细长尖塔。周围低矮建筑与水池衬托出它的垂直尺度，也让这座现代工程地标不只是地图上的一根银色针。",
    fact: "哈利法塔高828米；三翼形平面与逐级退台共同帮助高塔应对结构和风力要求。",
  },
  {
    id: "sagrada-familia",
    name: "圣家堂",
    kind: "landmark",
    atlasCountryName: "Spain",
    accent: 0xb8885f,
    point: [2.1744, 41.4036],
    postcard: "巴塞罗那街区上方成簇升起的有机尖塔",
    description:
      "圣家堂以密集的尖塔群、雕塑般的立面和近似自然生长的几何结构构成独特轮廓。低处的教堂主体像山体基座，塔身则由粗到细向天空收束，使它在巴塞罗那规整街区上方格外醒目。",
    fact: "教堂于1882年奠基，安东尼·高迪此后长期主持设计，把结构、光线与自然形态结合在一起。",
  },
  {
    id: "leaning-tower-of-pisa",
    name: "比萨斜塔",
    kind: "landmark",
    atlasCountryName: "Italy",
    accent: 0xc8ad79,
    point: [10.3966, 43.7229],
    postcard: "奇迹广场草坪上明显倾斜的白色钟塔",
    description:
      "比萨斜塔是一座多层圆形钟楼，层层柱廊围绕塔身展开。它与主教座堂、洗礼堂和墓园共同组成奇迹广场；倾斜的塔轴与平直的周边建筑形成一眼可辨的对比。",
    fact: "钟塔在施工期间就因地基土层承载不均而开始倾斜，后来的工程长期致力于稳定塔体。",
  },
  {
    id: "stonehenge",
    name: "巨石阵",
    kind: "wonder",
    atlasCountryName: "United Kingdom",
    accent: 0x827c69,
    point: [-1.8262, 51.1789],
    postcard: "索尔兹伯里平原上由立石与横梁组成的石环",
    description:
      "巨石阵由大小不同的立石、横梁和内外环形结构组成。最具辨识度的三石门由两块竖石承托一块横石，残缺与完整结构交错排列，显示这处史前遗址曾经过多个阶段的建设与改变。",
    fact: "主体石圈大约在公元前2500年形成，部分巨石从很远的地区运到这里。",
  },
  {
    id: "golden-gate-bridge",
    name: "金门大桥",
    kind: "landmark",
    atlasCountryName: "United States of America",
    accent: 0xd85b42,
    point: [-122.4783, 37.8199],
    postcard: "橙红色悬索桥跨越多雾的金门海峡",
    description:
      "金门大桥以两座高耸桥塔支撑主缆和垂直吊索，细长桥面跨过太平洋与旧金山湾之间的海峡。国际橙色涂装在蓝灰色海水、山体和雾气之间保持清晰轮廓。",
    fact: "大桥于1937年开放，主跨约1280米；国际橙色兼顾周边景观与海雾中的可见度。",
  },
  {
    id: "uluru",
    name: "乌鲁鲁",
    kind: "natural",
    atlasCountryName: "Australia",
    accent: 0xb95638,
    point: [131.0369, -25.3444],
    postcard: "澳大利亚中部荒原上孤立延展的红色巨岩",
    description:
      "乌鲁鲁从平坦的红土荒原中整体升起，长而低的岩体、陡峭侧壁和侵蚀形成的沟槽使它不同于普通锥形山峰。这里是阿南古人的重要文化景观，旅行体验以观察地貌、聆听文化故事和尊重当地规则为核心。",
    fact: "乌鲁鲁—卡塔丘塔国家公园由阿南古人与澳大利亚公园管理机构共同管理，乌鲁鲁的文化意义与自然地貌不可分割。",
  },
  {
    id: "grand-prismatic-spring",
    name: "黄石·大棱镜温泉",
    kind: "natural",
    atlasCountryName: "United States of America",
    accent: 0x2a9fc0,
    point: [-110.8382, 44.5251],
    postcard: "蒸汽中铺开的蓝、黄、橙色同心温泉",
    description:
      "大棱镜温泉像一只巨大的彩色眼睛嵌在黄石高原：深蓝色中心向外过渡为黄色与橙色微生物带，热水沿浅色矿物地表流散。俯视时，同心色带与升腾蒸汽构成最清晰的识别特征。",
    fact: "大棱镜温泉是黄石国家公园最大的温泉，直径约61至91米，颜色变化与水温和微生物群落有关。",
  },
  {
    id: "victoria-falls",
    name: "维多利亚瀑布",
    kind: "natural",
    atlasCountryName: "Zimbabwe",
    accent: 0x429cb5,
    point: [25.8572, -17.9243],
    postcard: "赞比西河从漫长断崖跌入狭窄玄武岩峡谷",
    description:
      "宽阔的赞比西河抵达赞比亚与津巴布韦边界后，沿近乎笔直的长断崖同时跌落。水流进入狭窄深槽，巨大水雾从峡谷升起，随后河道在一系列之字形玄武岩峡谷中转向。",
    fact: "当地名称“莫西奥图尼亚”常被译作“雷鸣之烟”，描述了瀑布的轰鸣与远处可见的水雾。",
  },
  {
    id: "great-barrier-reef",
    name: "大堡礁",
    kind: "natural",
    atlasCountryName: "Australia",
    accent: 0x28a9aa,
    point: [148.8708, -20.2078],
    postcard: "昆士兰近海浅蓝水域中的礁盘、珊瑚与小岛",
    description:
      "大堡礁沿澳大利亚东北海岸外侧延伸，由大量珊瑚礁、沙洲、岛屿和深浅不同的海水组成。这个打卡点以圣灵群岛附近浅海为视觉锚点，用青绿礁盘、深蓝水道与局部珊瑚层次表现海洋景观。",
    fact: "大堡礁是世界上规模最大的珊瑚礁生态系统，由数千处独立礁体和数百座岛屿共同构成。",
  },
  {
    id: "pointe-du-hoc",
    name: "诺曼底登陆遗址·奥克角",
    kind: "historical",
    visitMode: "reflection",
    atlasCountryName: "France",
    accent: 0x66756c,
    point: [-0.9873, 49.3969],
    postcard: "诺曼底海蚀悬崖上的碉堡、弹坑与纪念碑",
    description:
      "奥克角伸入英吉利海峡，陡峭悬崖上仍保留混凝土工事和起伏的弹坑地貌。1944年6月6日，美国陆军游骑兵从崖下登陆并攀上高地；今天这里以遗址、纪念碑和安静的海岸景观讲述诺曼底登陆的历史。",
    fact: "奥克角游骑兵纪念碑建在一处德军混凝土观察阵地上，纪念参与这次行动的游骑兵。",
  },
  {
    id: "hiroshima-peace-memorial",
    name: "广岛和平纪念碑",
    kind: "historical",
    visitMode: "reflection",
    atlasCountryName: "Japan",
    accent: 0x71827a,
    point: [132.4536, 34.3955],
    postcard: "元安川畔保留下来的砖墙与钢架圆顶",
    description:
      "广岛和平纪念碑又称原爆圆顶馆。1945年8月6日原子弹在附近上空爆炸，建筑中心部分仍以残损砖墙和裸露钢架圆顶留存。今天它与和平纪念公园共同提醒人们认识战争后果，并思考和平的价值。",
    fact: "这座建筑于1915年建成，爆心约在其东南方160米处；遗址后来被保存为追念遇难者和祈愿和平的象征。",
  },
];

/** New journeys begin at the existing Marseille city anchor in southern France. */
export const START_POINT: GeoPoint = [5.35, 43.35];

export function geoToWorld(point: GeoPoint): { x: number; z: number } {
  const mercatorLatitude = latitudeToMercator(point[1]);
  return {
    x: (point[0] - MAP_CENTER.longitude) * MAP_SCALE.x,
    z: -(mercatorLatitude - MAP_CENTER.latitude) * MAP_SCALE.z,
  };
}

export function worldToGeo(x: number, z: number): GeoPoint {
  return [
    x / MAP_SCALE.x + MAP_CENTER.longitude,
    mercatorToLatitude(-z / MAP_SCALE.z + MAP_CENTER.latitude),
  ];
}

export function getCountryById(id: CountryId): CountryDefinition {
  const country = COUNTRIES.find((candidate) => candidate.id === id);
  if (!country) {
    throw new Error(`Unknown country: ${id}`);
  }
  return country;
}

export function getSeaName(point: GeoPoint): string {
  const [longitude, latitude] = point;

  if (
    latitude < MAP_BOUNDS.minLatitude + 1 ||
    latitude > MAP_BOUNDS.maxLatitude - 1 ||
    longitude < MAP_BOUNDS.minLongitude + 0.6 ||
    longitude > MAP_BOUNDS.maxLongitude - 0.6
  ) {
    return "原型边界海域";
  }

  if (latitude >= 35.5 && latitude <= 37.2 && longitude >= -6.5 && longitude <= -4.5) {
    return "直布罗陀海峡";
  }

  if (latitude >= 30 && latitude <= 47 && longitude >= -6.5 && longitude <= 37) {
    return "地中海";
  }

  if (latitude > 66) {
    return "北冰洋";
  }

  if (latitude < -55) {
    return "南冰洋";
  }

  if (
    (longitude >= 20 && longitude <= 120 && latitude <= 30) ||
    (longitude >= 95 && longitude <= 145 && latitude <= -10)
  ) {
    return "印度洋";
  }

  if (longitude <= -70 || longitude >= 145) {
    return "太平洋";
  }

  if (longitude < 20) {
    return "大西洋";
  }

  return "世界海洋";
}

function latitudeToMercator(latitude: number): number {
  const clampedLatitude = Math.max(
    MAP_BOUNDS.minLatitude,
    Math.min(MAP_BOUNDS.maxLatitude, latitude),
  );
  const radians = (clampedLatitude * Math.PI) / 180;
  return (Math.log(Math.tan(Math.PI / 4 + radians / 2)) * 180) / Math.PI;
}

function mercatorToLatitude(mercatorLatitude: number): number {
  const radians = 2 * Math.atan(Math.exp((mercatorLatitude * Math.PI) / 180)) - Math.PI / 2;
  return (radians * 180) / Math.PI;
}
