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
  | "indonesia";

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
    postcard: string;
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
      postcard: "大西洋灯塔与黄色电车",
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
      postcard: "白色海岸小城与橙树广场",
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
      postcard: "旧港帆船与薰衣草色山坡",
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
      postcard: "河畔钟楼与红色巴士",
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
      postcard: "城市大门与穿城列车",
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
      postcard: "圆形古建筑与街角喷泉",
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
      postcard: "山丘神庙与爱琴海航线",
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
      postcard: "蓝白山城与海峡渡船",
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
      postcard: "白色海滨城与沙漠方向牌",
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
      postcard: "蓝白门窗与地中海港湾",
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
      postcard: "尼罗河、城市与金色金字塔",
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
      postcard: "海峡渡船、圆顶与跨洲街道",
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
      postcard: "红色城门、长城与城市列车",
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
      postcard: "红色鸟居、城市灯光与海湾列车",
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
      postcard: "城市宫门、汉江与夜间列车",
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
      postcard: "白色穹顶、恒河平原与彩色街道",
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
      postcard: "河上小船、金色屋顶与城市轻轨",
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
      postcard: "湖畔塔楼、街道列车与红河平原",
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
      postcard: "群岛航线、火山与城市清真寺",
    },
    scenery: "tropical",
  },
] as const;

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
