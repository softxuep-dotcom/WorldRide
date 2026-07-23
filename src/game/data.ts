export type GeoPoint = readonly [longitude: number, latitude: number];

export type CountryId =
  | "portugal"
  | "spain"
  | "france"
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
  border: readonly GeoPoint[];
  additionalBorders?: readonly (readonly GeoPoint[])[];
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
  | "moscow-domes";

export interface PhotoSpotDefinition {
  id: PhotoSpotId;
  name: string;
  kind: "wonder" | "landmark" | "natural";
  countryId: CountryId;
  point: GeoPoint;
  postcard: string;
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

export const MAP_SCALE = {
  x: 0.84,
  z: 0.62,
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
    border: [
      [-9.5, 42.1],
      [-8.3, 42.15],
      [-6.95, 41.9],
      [-7.1, 40.1],
      [-7.35, 38.1],
      [-7.45, 37.2],
      [-8.75, 37.0],
      [-9.45, 38.5],
      [-9.05, 40.0],
      [-9.5, 41.0],
    ],
    city: {
      name: "里斯本",
      point: [-9.14, 38.72],
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
    border: [
      [-9.1, 42.4],
      [-8.2, 43.5],
      [-5.5, 43.75],
      [-1.75, 43.35],
      [0.8, 42.85],
      [3.2, 42.45],
      [3.1, 41.8],
      [1.6, 41.0],
      [0.15, 39.5],
      [-0.5, 37.1],
      [-2.4, 36.7],
      [-5.6, 36.0],
      [-7.4, 37.2],
      [-7.25, 39.8],
      [-6.95, 41.9],
      [-8.2, 42.05],
    ],
    city: {
      name: "加的斯",
      point: [-6.28, 36.53],
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
    border: [
      [-5.1, 48.7],
      [-1.8, 49.7],
      [1.8, 50.9],
      [4.3, 49.9],
      [7.6, 48.4],
      [7.4, 47.5],
      [6.1, 46.0],
      [7.0, 44.7],
      [6.6, 43.1],
      [4.5, 43.0],
      [3.2, 42.45],
      [0.8, 42.85],
      [-1.75, 43.35],
      [-1.8, 46.2],
      [-4.7, 47.8],
    ],
    city: {
      name: "马赛",
      point: [5.25, 43.3],
    },
    scenery: "green",
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
    border: [
      [-5.7, 50.0],
      [-4.4, 51.0],
      [-5.5, 53.5],
      [-5.0, 55.5],
      [-6.0, 57.3],
      [-3.0, 58.7],
      [-1.8, 57.5],
      [-2.1, 55.8],
      [-0.4, 54.5],
      [0.9, 52.7],
      [1.5, 51.0],
      [-1.8, 50.5],
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
    border: [
      [6.0, 47.3],
      [9.0, 47.5],
      [12.5, 47.5],
      [13.8, 48.8],
      [12.5, 50.0],
      [15.0, 51.0],
      [14.5, 53.8],
      [12.0, 54.8],
      [8.2, 54.7],
      [6.5, 53.0],
      [6.0, 50.0],
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
    border: [
      [6.8, 45.8],
      [9.4, 46.5],
      [13.5, 46.6],
      [13.6, 44.2],
      [15.8, 42.0],
      [18.5, 40.0],
      [17.3, 38.2],
      [15.3, 38.0],
      [15.2, 40.2],
      [13.0, 42.0],
      [11.5, 43.1],
      [9.5, 43.8],
      [7.5, 43.0],
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
    border: [
      [19.5, 41.5],
      [22.5, 41.7],
      [26.5, 41.0],
      [27.0, 39.0],
      [25.0, 37.0],
      [24.0, 35.0],
      [22.0, 36.0],
      [20.5, 38.0],
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
    border: [
      [-5.9, 35.9],
      [-3.9, 35.7],
      [-1.9, 35.1],
      [-1.2, 32.1],
      [-3.0, 29.1],
      [-6.4, 28.0],
      [-9.7, 29.3],
      [-10.4, 31.6],
      [-9.2, 33.5],
      [-7.0, 34.8],
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
    border: [
      [-1.9, 35.1],
      [1.0, 36.5],
      [4.0, 36.9],
      [8.6, 37.1],
      [9.3, 34.5],
      [8.4, 32.0],
      [8.6, 30.0],
      [5.5, 28.0],
      [2.0, 27.2],
      [-1.2, 28.6],
      [-1.2, 32.1],
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
    border: [
      [7.4, 37.0],
      [10.5, 37.4],
      [11.6, 35.0],
      [11.0, 33.0],
      [10.0, 30.3],
      [8.2, 31.5],
      [7.5, 34.0],
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
    border: [
      [24.8, 31.5],
      [31.2, 31.7],
      [34.8, 31.2],
      [35.0, 22.0],
      [25.0, 22.0],
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
    border: [
      [26.0, 41.5],
      [29.0, 40.5],
      [36.0, 42.0],
      [44.0, 40.0],
      [44.0, 36.0],
      [35.0, 36.0],
      [29.0, 37.0],
    ],
    city: {
      name: "伊斯坦布尔",
      point: [28.98, 41.0],
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
    border: [
      [73.0, 39.0],
      [78.0, 32.0],
      [88.0, 28.0],
      [97.0, 24.0],
      [106.0, 21.0],
      [113.0, 22.0],
      [119.0, 25.0],
      [122.0, 31.0],
      [132.0, 43.0],
      [126.0, 49.0],
      [118.0, 53.0],
      [108.0, 50.0],
      [99.0, 49.0],
      [90.0, 45.0],
      [80.0, 49.0],
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
    border: [
      [132.0, 31.0],
      [134.0, 33.0],
      [137.0, 34.0],
      [140.0, 35.0],
      [142.0, 39.0],
      [140.0, 42.0],
      [137.0, 38.0],
      [135.0, 35.0],
    ],
    additionalBorders: [
      [
        [140.0, 41.5],
        [145.0, 42.0],
        [145.5, 45.5],
        [141.0, 45.5],
      ],
      [
        [129.0, 31.0],
        [132.0, 31.0],
        [131.5, 34.0],
        [129.0, 33.0],
      ],
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
    border: [
      [126.0, 34.0],
      [129.5, 35.0],
      [129.0, 38.5],
      [127.0, 39.0],
      [125.5, 37.0],
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
    border: [
      [68.0, 23.0],
      [72.0, 20.0],
      [76.0, 8.0],
      [80.0, 9.0],
      [83.0, 16.0],
      [88.0, 22.0],
      [92.0, 27.0],
      [88.0, 28.0],
      [80.0, 34.0],
      [74.0, 32.0],
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
    border: [
      [97.0, 20.0],
      [101.0, 20.0],
      [105.0, 16.0],
      [102.0, 12.0],
      [101.0, 6.0],
      [99.0, 7.0],
      [99.0, 14.0],
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
    border: [
      [102.0, 23.0],
      [108.0, 23.0],
      [107.0, 20.0],
      [109.0, 16.0],
      [109.0, 10.0],
      [105.0, 8.0],
      [104.0, 11.0],
      [106.0, 16.0],
      [104.0, 20.0],
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
    border: [
      [95.0, 6.0],
      [106.0, 6.0],
      [105.0, -6.0],
      [99.0, -5.0],
    ],
    additionalBorders: [
      [
        [105.0, -5.0],
        [114.0, -6.0],
        [114.0, -9.0],
        [106.0, -8.0],
      ],
      [
        [108.0, 4.0],
        [117.0, 4.0],
        [119.0, -4.0],
        [109.0, -4.0],
      ],
      [
        [119.0, 2.0],
        [125.0, 2.0],
        [123.0, -6.0],
        [119.0, -4.0],
      ],
      [
        [130.0, 0.0],
        [141.0, 0.0],
        [141.0, -9.0],
        [131.0, -9.0],
      ],
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
    border: [
      [3.4, 51.2],
      [4.0, 53.5],
      [7.2, 53.4],
      [7.0, 50.8],
      [5.2, 50.7],
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
    border: [
      [5.9, 45.8],
      [7.0, 47.8],
      [9.7, 47.5],
      [10.5, 46.8],
      [9.0, 45.8],
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
    border: [
      [9.5, 46.4],
      [10.4, 47.6],
      [13.0, 48.8],
      [17.2, 48.0],
      [16.5, 46.8],
      [13.5, 46.4],
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
    border: [
      [14.1, 49.0],
      [14.2, 54.3],
      [19.0, 54.9],
      [24.2, 54.4],
      [24.1, 49.0],
      [19.0, 49.0],
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
    border: [
      [4.0, 58.0],
      [6.0, 62.0],
      [12.0, 66.0],
      [17.0, 70.0],
      [28.0, 71.2],
      [31.0, 69.0],
      [23.0, 65.0],
      [17.0, 60.0],
      [10.0, 58.0],
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
    border: [
      [27.0, 55.0],
      [30.0, 62.0],
      [24.0, 68.0],
      [42.0, 72.0],
      [75.0, 77.0],
      [120.0, 76.0],
      [160.0, 71.0],
      [180.0, 66.0],
      [180.0, 52.0],
      [155.0, 49.0],
      [135.0, 43.0],
      [115.0, 50.0],
      [95.0, 51.0],
      [80.0, 55.0],
      [65.0, 50.0],
      [50.0, 43.0],
      [37.0, 44.0],
      [30.0, 48.0],
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
    border: [
      [44.0, 39.0],
      [49.0, 40.0],
      [54.0, 38.0],
      [61.0, 37.0],
      [63.0, 31.0],
      [61.0, 25.0],
      [56.0, 25.0],
      [52.0, 27.0],
      [48.0, 29.0],
      [45.0, 33.0],
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
    border: [
      [34.5, 29.5],
      [39.0, 32.0],
      [48.0, 29.0],
      [55.5, 23.0],
      [52.0, 17.0],
      [44.0, 16.0],
      [39.0, 19.0],
      [35.0, 25.0],
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
    border: [
      [61.0, 25.0],
      [67.0, 24.0],
      [71.0, 24.0],
      [77.0, 35.0],
      [74.0, 37.0],
      [70.0, 36.0],
      [66.0, 31.0],
      [61.0, 29.0],
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
    border: [
      [87.0, 49.0],
      [90.0, 43.0],
      [105.0, 42.0],
      [120.0, 44.0],
      [120.0, 50.0],
      [110.0, 52.0],
      [98.0, 50.0],
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
 * 一个国家可以没有，也可以拥有多个；countryId 只记录它所在的地理背景。
 */
export const PHOTO_SPOTS: readonly PhotoSpotDefinition[] = [
  {
    id: "gibraltar-strait",
    name: "直布罗陀海峡",
    kind: "natural",
    countryId: "spain",
    point: [-5.62, 36.03],
    postcard: "欧洲与非洲隔海相望的蓝色海峡",
    fact: "海峡最窄处只有约十四公里，是地中海通往大西洋的门户。",
  },
  {
    id: "big-ben",
    name: "大本钟",
    kind: "landmark",
    countryId: "united-kingdom",
    point: [-0.125, 51.501],
    postcard: "泰晤士河畔的钟楼与红色巴士",
    fact: "“大本钟”最初是钟的昵称，所在钟楼现名为伊丽莎白塔。",
  },
  {
    id: "brandenburg-gate",
    name: "勃兰登堡门",
    kind: "landmark",
    countryId: "germany",
    point: [13.378, 52.516],
    postcard: "柏林林荫道尽头的古典城门",
    fact: "它从旧城门变成了德国历史与统一的重要象征。",
  },
  {
    id: "colosseum",
    name: "罗马斗兽场",
    kind: "wonder",
    countryId: "italy",
    point: [12.492, 41.89],
    postcard: "夕阳下的椭圆形古罗马建筑",
    fact: "这座大型圆形剧场在公元一世纪建成，可容纳数万名观众。",
  },
  {
    id: "acropolis",
    name: "雅典卫城",
    kind: "wonder",
    countryId: "greece",
    point: [23.726, 37.972],
    postcard: "石灰岩山丘上的古典神庙",
    fact: "卫城位于雅典制高点，帕特农神庙是其中最醒目的建筑。",
  },
  {
    id: "swiss-alps",
    name: "瑞士阿尔卑斯",
    kind: "natural",
    countryId: "switzerland",
    point: [7.98, 46.58],
    postcard: "雪峰、山谷与红色列车",
    fact: "阿尔卑斯山塑造了瑞士的地貌、交通与四季旅游。",
  },
  {
    id: "norway-fjord",
    name: "挪威峡湾",
    kind: "natural",
    countryId: "norway",
    point: [7.2, 62.1],
    postcard: "陡峭雪山之间深入陆地的蓝色海湾",
    fact: "许多挪威峡湾由冰川侵蚀形成，海水沿深谷进入陆地。",
  },
  {
    id: "giza-pyramids",
    name: "吉萨金字塔群",
    kind: "wonder",
    countryId: "egypt",
    point: [31.134, 29.979],
    postcard: "沙漠边缘的金色金字塔",
    fact: "胡夫金字塔是古代世界七大奇迹中唯一大体保存至今的一处。",
  },
  {
    id: "hagia-sophia",
    name: "圣索菲亚大教堂",
    kind: "wonder",
    countryId: "turkey",
    point: [28.98, 41.008],
    postcard: "博斯普鲁斯海峡旁的巨大穹顶",
    fact: "这座建筑跨越不同历史时期，长期影响着穹顶建筑的发展。",
  },
  {
    id: "great-wall",
    name: "长城",
    kind: "wonder",
    countryId: "china",
    point: [116.57, 40.43],
    postcard: "沿山脊起伏的城墙与烽火台",
    fact: "今天所见的长城由不同朝代、不同地段共同构成，并非一条单一城墙。",
  },
  {
    id: "fuji-view",
    name: "富士山",
    kind: "natural",
    countryId: "japan",
    point: [138.73, 35.36],
    postcard: "湖面后方对称的火山雪峰",
    fact: "富士山是日本最高峰，也是一座仍被列为活火山的成层火山。",
  },
  {
    id: "taj-mahal",
    name: "泰姬陵",
    kind: "wonder",
    countryId: "india",
    point: [78.042, 27.175],
    postcard: "水池倒影中的白色穹顶建筑",
    fact: "泰姬陵以白色大理石和近乎对称的布局闻名。",
  },
  {
    id: "java-volcano",
    name: "爪哇火山群",
    kind: "natural",
    countryId: "indonesia",
    point: [110.2, -7.6],
    postcard: "热带晨雾中的层叠火山",
    fact: "印度尼西亚位于环太平洋火山带，拥有数量众多的活火山。",
  },
  {
    id: "moscow-domes",
    name: "圣瓦西里大教堂",
    kind: "landmark",
    countryId: "russia",
    point: [37.62, 55.75],
    postcard: "红场旁色彩鲜明的洋葱形穹顶",
    fact: "这组各不相同的穹顶让建筑形成了极强的远距离识别度。",
  },
];

export const START_POINT: GeoPoint = [-5.72, 36.52];

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

export function isPointInPolygon(point: GeoPoint, polygon: readonly GeoPoint[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentX, currentY] = polygon[index];
    const [previousX, previousY] = polygon[previous];
    const crosses =
      currentY > y !== previousY > y &&
      x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

export function getCountryAtWorld(x: number, z: number): CountryDefinition | undefined {
  const geoPoint = worldToGeo(x, z);
  return COUNTRIES.find((country) => isGeoPointInCountry(geoPoint, country));
}

export function getCountryById(id: CountryId): CountryDefinition {
  const country = COUNTRIES.find((candidate) => candidate.id === id);
  if (!country) {
    throw new Error(`Unknown country: ${id}`);
  }
  return country;
}

export function getCountryBorders(
  country: CountryDefinition,
): readonly (readonly GeoPoint[])[] {
  return [country.border, ...(country.additionalBorders ?? [])];
}

export function isGeoPointInCountry(
  point: GeoPoint,
  country: CountryDefinition,
): boolean {
  return getCountryBorders(country).some((border) => isPointInPolygon(point, border));
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
