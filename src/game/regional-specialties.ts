import type { GeoPoint } from "./data";

export type RegionalSpecialtyRegion =
  | "africa"
  | "central-asia"
  | "east-asia"
  | "south-america";

export type RegionalSpecialtyCategory = "animal" | "plant" | "culture";

export interface RegionalSpecialtyDefinition {
  readonly id: string;
  readonly name: string;
  readonly region: RegionalSpecialtyRegion;
  readonly category: RegionalSpecialtyCategory;
  readonly point: GeoPoint;
}

/**
 * Regional specialties are lightweight roadside discoveries rather than
 * full landmark interactions. Their positions deliberately fill areas with
 * sparse landmark coverage while keeping clear of the large landmark stands.
 */
export const REGIONAL_SPECIALTIES: readonly RegionalSpecialtyDefinition[] = [
  {
    id: "african-elephant",
    name: "非洲象",
    region: "africa",
    category: "animal",
    point: [23.5, -21.5],
  },
  {
    id: "giraffe",
    name: "长颈鹿",
    region: "africa",
    category: "animal",
    point: [34.8, -2.4],
  },
  {
    id: "okapi",
    name: "霍加狓",
    region: "africa",
    category: "animal",
    point: [28.5, 1.5],
  },
  {
    id: "fennec-fox",
    name: "耳廓狐",
    region: "africa",
    category: "animal",
    point: [2.8, 27],
  },
  {
    id: "baobab",
    name: "猴面包树",
    region: "africa",
    category: "plant",
    point: [44.5, -20.3],
  },
  {
    id: "king-protea",
    name: "帝王花",
    region: "africa",
    category: "plant",
    point: [19.3, -33.4],
  },
  {
    id: "ethiopian-coffee",
    name: "埃塞俄比亚咖啡",
    region: "africa",
    category: "plant",
    point: [38.2, 7.7],
  },
  {
    id: "djembe",
    name: "金贝鼓",
    region: "africa",
    category: "culture",
    point: [-10.8, 10.4],
  },
  {
    id: "kente-cloth",
    name: "肯特布",
    region: "africa",
    category: "culture",
    point: [-1.8, 6.5],
  },
  {
    id: "snow-leopard",
    name: "雪豹",
    region: "central-asia",
    category: "animal",
    point: [74.2, 41.4],
  },
  {
    id: "bactrian-camel",
    name: "双峰驼",
    region: "central-asia",
    category: "animal",
    point: [65.8, 44.5],
  },
  {
    id: "golden-eagle",
    name: "金雕",
    region: "central-asia",
    category: "animal",
    point: [79, 48.5],
  },
  {
    id: "saxaul-tree",
    name: "梭梭树",
    region: "central-asia",
    category: "plant",
    point: [61.2, 42.1],
  },
  {
    id: "central-asian-yurt",
    name: "中亚毡房",
    region: "central-asia",
    category: "culture",
    point: [69, 50.3],
  },
  {
    id: "kazakh-dombra",
    name: "冬不拉",
    region: "central-asia",
    category: "culture",
    point: [51.2, 47.1],
  },
  {
    id: "giant-panda",
    name: "大熊猫",
    region: "east-asia",
    category: "animal",
    point: [103, 30.7],
  },
  {
    id: "yak",
    name: "牦牛",
    region: "east-asia",
    category: "animal",
    point: [96.3, 35],
  },
  {
    id: "red-crowned-crane",
    name: "丹顶鹤",
    region: "east-asia",
    category: "animal",
    point: [124.2, 47.2],
  },
  {
    id: "yunnan-tea",
    name: "云南茶",
    region: "east-asia",
    category: "plant",
    point: [100.3, 22.8],
  },
  {
    id: "cherry-blossom",
    name: "樱花",
    region: "east-asia",
    category: "plant",
    point: [135.5, 35.1],
  },
  {
    id: "korean-onggi",
    name: "韩国陶缸",
    region: "east-asia",
    category: "culture",
    point: [127.6, 36.3],
  },
  {
    id: "alpaca",
    name: "羊驼",
    region: "south-america",
    category: "animal",
    point: [-71, -16],
  },
  {
    id: "capybara",
    name: "水豚",
    region: "south-america",
    category: "animal",
    point: [-56.5, -17.5],
  },
  {
    id: "toco-toucan",
    name: "巨嘴鸟",
    region: "south-america",
    category: "animal",
    point: [-52.2, -4.5],
  },
  {
    id: "amazon-water-lily",
    name: "亚马孙王莲",
    region: "south-america",
    category: "plant",
    point: [-61.2, -3.1],
  },
  {
    id: "yerba-mate",
    name: "马黛茶",
    region: "south-america",
    category: "culture",
    point: [-54.6, -27],
  },
  {
    id: "andean-zampona",
    name: "安第斯排箫",
    region: "south-america",
    category: "culture",
    point: [-67.2, -17.5],
  },
  {
    id: "argan-oil",
    name: "阿甘油",
    region: "africa",
    category: "plant",
    point: [-9.5, 30.5],
  },
  {
    id: "shea-butter",
    name: "乳木果油",
    region: "africa",
    category: "plant",
    point: [-1.2, 11],
  },
  {
    id: "rooibos-tea",
    name: "路易波士茶",
    region: "africa",
    category: "plant",
    point: [21.5, -31],
  },
  {
    id: "malagasy-vanilla",
    name: "马达加斯加香草",
    region: "africa",
    category: "plant",
    point: [49.5, -15.2],
  },
  {
    id: "dromedary-camel",
    name: "单峰骆驼",
    region: "africa",
    category: "animal",
    point: [29.7, 27.8],
  },
  {
    id: "papyrus",
    name: "纸莎草",
    region: "africa",
    category: "plant",
    point: [31.25, 30.65],
  },
  {
    id: "date-palm",
    name: "椰枣",
    region: "africa",
    category: "plant",
    point: [30.8, 29.4],
  },
  {
    id: "hibiscus-tea",
    name: "洛神花茶",
    region: "africa",
    category: "culture",
    point: [32.4, 24.1],
  },
  {
    id: "uzbek-ceramics",
    name: "乌兹别克彩陶",
    region: "central-asia",
    category: "culture",
    point: [69.2, 41.3],
  },
  {
    id: "kyrgyz-shyrdak",
    name: "吉尔吉斯毡毯",
    region: "central-asia",
    category: "culture",
    point: [77, 42.7],
  },
  {
    id: "kazakh-kumis",
    name: "哈萨克马奶酒",
    region: "central-asia",
    category: "culture",
    point: [73, 48],
  },
  {
    id: "tajik-pomegranate",
    name: "塔吉克石榴",
    region: "central-asia",
    category: "plant",
    point: [71.5, 38.3],
  },
  {
    id: "ningxia-goji",
    name: "宁夏枸杞",
    region: "east-asia",
    category: "plant",
    point: [106.2, 37.5],
  },
  {
    id: "sichuan-paper-umbrella",
    name: "四川油纸伞",
    region: "east-asia",
    category: "culture",
    point: [105, 29],
  },
  {
    id: "mongolian-cashmere",
    name: "蒙古羊绒",
    region: "east-asia",
    category: "culture",
    point: [110.2, 46.6],
  },
  {
    id: "okinawan-bingata",
    name: "冲绳红型染",
    region: "east-asia",
    category: "culture",
    point: [127.7, 26.3],
  },
  {
    id: "andean-quinoa",
    name: "安第斯藜麦",
    region: "south-america",
    category: "plant",
    point: [-66, -21.5],
  },
  {
    id: "peruvian-textile",
    name: "秘鲁安第斯织物",
    region: "south-america",
    category: "culture",
    point: [-75, -11],
  },
  {
    id: "amazon-acai",
    name: "亚马孙巴西莓",
    region: "south-america",
    category: "plant",
    point: [-48.5, -1.5],
  },
  {
    id: "colombian-coffee",
    name: "哥伦比亚咖啡",
    region: "south-america",
    category: "plant",
    point: [-75.6, 4.6],
  },
] as const;
