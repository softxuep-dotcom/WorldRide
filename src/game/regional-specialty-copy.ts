/**
 * Bilingual copy for regional specialties.
 *
 * Kept beside the specialty ids rather than in the locale files: each entry is
 * a self-contained record, so a translator can never desync a name from its
 * blurb the way parallel locale tables allow.
 *
 * A specialty with no entry falls back to its Chinese `name` and shows no
 * blurb, so the roadside discovery still works while copy is being written.
 */
import { localizeAuthoredText } from "../i18n/content";

export interface SpecialtyCopy {
  readonly name: string;
  /** One short sentence shown when the player stops to look. */
  readonly blurb: string;
}

type BilingualEntry = Readonly<Record<string, SpecialtyCopy>>;

const COPY: Readonly<Record<string, BilingualEntry>> = {
  "african-elephant": {
    en: { name: "African Elephant", blurb: "The largest land animal alive, with ears shaped a little like the African continent." },
    "zh-CN": { name: "非洲象", blurb: "陆地上现存最大的动物，耳朵的轮廓有点像非洲大陆。" },
  },
  giraffe: {
    en: { name: "Giraffe", blurb: "Its neck holds the same number of bones as yours — just much longer ones." },
    "zh-CN": { name: "长颈鹿", blurb: "它脖子里的骨头数量和你一样多，只是每一块都长得多。" },
  },
  okapi: {
    en: { name: "Okapi", blurb: "A forest cousin of the giraffe, hidden in the Congo rainforest with zebra-striped legs." },
    "zh-CN": { name: "霍加狓", blurb: "长颈鹿藏在刚果雨林里的近亲，腿上却有斑马一样的条纹。" },
  },
  "fennec-fox": {
    en: { name: "Fennec Fox", blurb: "Huge ears release heat, letting this tiny fox stay cool in the Sahara." },
    "zh-CN": { name: "耳廓狐", blurb: "巨大的耳朵能散热，让这只小狐狸在撒哈拉也不怕热。" },
  },
  baobab: {
    en: { name: "Baobab", blurb: "Its fat trunk stores water, so it can stand green through a long dry season." },
    "zh-CN": { name: "猴面包树", blurb: "粗壮的树干能储水，让它熬过漫长的旱季。" },
  },
  "king-protea": {
    en: { name: "King Protea", blurb: "South Africa's national flower, with a bloom as wide as a dinner plate." },
    "zh-CN": { name: "帝王花", blurb: "南非的国花，一朵花能开得像餐盘那么大。" },
  },
  "ethiopian-coffee": {
    en: { name: "Ethiopian Coffee", blurb: "Ethiopia's highlands are where coffee was first grown and shared." },
    "zh-CN": { name: "埃塞俄比亚咖啡", blurb: "埃塞俄比亚高原是咖啡最早被种植和分享的地方。" },
  },
  djembe: {
    en: { name: "Djembe Drum", blurb: "Carved from one piece of wood; a player's hand position changes the note." },
    "zh-CN": { name: "金贝鼓", blurb: "由一整块木头挖成，手拍在不同位置就能敲出不同的音。" },
  },
  "kente-cloth": {
    en: { name: "Kente Cloth", blurb: "Woven in narrow strips, its colours and patterns each carry a meaning." },
    "zh-CN": { name: "肯特布", blurb: "由一条条窄布拼成，每种颜色和花纹都有各自的含义。" },
  },

  "snow-leopard": {
    en: { name: "Snow Leopard", blurb: "Its thick tail doubles as a balance pole and a scarf on cold peaks." },
    "zh-CN": { name: "雪豹", blurb: "粗大的尾巴既能保持平衡，冷的时候还能当围巾裹住口鼻。" },
  },
  "bactrian-camel": {
    en: { name: "Bactrian Camel", blurb: "Two humps store fat, fuelling long crossings of the Gobi." },
    "zh-CN": { name: "双峰驼", blurb: "两个驼峰储存脂肪，支撑它穿越漫长的戈壁。" },
  },
  "golden-eagle": {
    en: { name: "Golden Eagle", blurb: "Steppe hunters have flown trained golden eagles for centuries." },
    "zh-CN": { name: "金雕", blurb: "草原上的猎人训练金雕捕猎，这个传统延续了好几个世纪。" },
  },
  "saxaul-tree": {
    en: { name: "Saxaul Tree", blurb: "Its roots bind loose sand, holding back the spread of the desert." },
    "zh-CN": { name: "梭梭树", blurb: "根系能固定流沙，是阻挡沙漠扩张的重要植物。" },
  },
  "central-asian-yurt": {
    en: { name: "Central Asian Yurt", blurb: "A felt home that packs onto animals and rebuilds in about an hour." },
    "zh-CN": { name: "中亚毡房", blurb: "毡子搭成的家，可以打包带走，再花约一小时重新搭好。" },
  },
  "kazakh-dombra": {
    en: { name: "Dombra", blurb: "A two-stringed lute whose tunes often retell stories of the steppe." },
    "zh-CN": { name: "冬不拉", blurb: "两根弦的弹拨乐器，曲子里常常讲着草原上的故事。" },
  },

  "giant-panda": {
    en: { name: "Giant Panda", blurb: "It eats bamboo for many hours a day, using a wrist bone like a thumb." },
    "zh-CN": { name: "大熊猫", blurb: "每天要吃很久的竹子，靠一块特殊的腕骨当作“拇指”握住竹竿。" },
  },
  yak: {
    en: { name: "Yak", blurb: "Built for thin mountain air, it carries loads where trucks cannot go." },
    "zh-CN": { name: "牦牛", blurb: "适应高原稀薄的空气，能在汽车到不了的地方驮运货物。" },
  },
  "red-crowned-crane": {
    en: { name: "Red-crowned Crane", blurb: "Pairs dance together, leaping and calling in step." },
    "zh-CN": { name: "丹顶鹤", blurb: "成对的鹤会一起跳舞，边跳跃边应和着鸣叫。" },
  },
  "yunnan-tea": {
    en: { name: "Yunnan Tea", blurb: "Some tea trees on these hills have been picked for centuries." },
    "zh-CN": { name: "云南茶", blurb: "这些山上的一些茶树，已经被采摘了好几百年。" },
  },
  "cherry-blossom": {
    en: { name: "Cherry Blossom", blurb: "The bloom sweeps north across the islands as spring warms." },
    "zh-CN": { name: "樱花", blurb: "随着春天变暖，花期像一道波浪自南向北推进。" },
  },
  "korean-onggi": {
    en: { name: "Onggi Jar", blurb: "Its clay breathes just enough air to let food ferment slowly." },
    "zh-CN": { name: "韩国陶缸", blurb: "陶土会透气，让缸里的食物缓慢发酵。" },
  },

  alpaca: {
    en: { name: "Alpaca", blurb: "Its fleece is warm yet light, spun in the Andes for thousands of years." },
    "zh-CN": { name: "羊驼", blurb: "毛既暖和又轻，在安第斯山区被纺织了几千年。" },
  },
  capybara: {
    en: { name: "Capybara", blurb: "The world's largest rodent, and a very calm swimmer." },
    "zh-CN": { name: "水豚", blurb: "世界上最大的啮齿动物，还是个非常淡定的游泳好手。" },
  },
  "toco-toucan": {
    en: { name: "Toco Toucan", blurb: "That huge bill is mostly hollow, and helps it shed heat." },
    "zh-CN": { name: "巨嘴鸟", blurb: "那只大嘴其实大部分是空心的，还能帮它散热。" },
  },
  "amazon-water-lily": {
    en: { name: "Amazon Water Lily", blurb: "Its ribbed pads can spread wider than a person is tall." },
    "zh-CN": { name: "亚马孙王莲", blurb: "叶片背面有粗壮的叶脉支撑，直径能比一个人还高。" },
  },
  "yerba-mate": {
    en: { name: "Yerba Mate", blurb: "Shared from one gourd passed around the circle, sip by sip." },
    "zh-CN": { name: "马黛茶", blurb: "大家轮流传递同一个茶壶，一人一口地分享。" },
  },
  "andean-zampona": {
    en: { name: "Zampoña Panpipes", blurb: "Two rows of cane pipes; players often interlock to finish a melody." },
    "zh-CN": { name: "安第斯排箫", blurb: "两排芦管，演奏者常常互相接力才吹完一支曲子。" },
  },
  "argan-oil": {
    en: { name: "Argan Oil", blurb: "Moroccan argan kernels are pressed into a fragrant oil used in cooking and craft." },
    "zh-CN": { name: "阿甘油", blurb: "摩洛哥人把阿甘果仁压成芳香油脂，用于烹饪和传统手艺。" },
  },
  "shea-butter": {
    en: { name: "Shea Butter", blurb: "Nuts from the shea tree are worked into a rich butter across West Africa." },
    "zh-CN": { name: "乳木果油", blurb: "西非许多地方把乳木果仁加工成滋润而耐储存的油脂。" },
  },
  "rooibos-tea": {
    en: { name: "Rooibos Tea", blurb: "This naturally caffeine-free red infusion grows only around South Africa's Cederberg." },
    "zh-CN": { name: "路易波士茶", blurb: "这种天然不含咖啡因的红茶主要生长在南非塞德伯格山区。" },
  },
  "malagasy-vanilla": {
    en: { name: "Malagasy Vanilla", blurb: "Each vanilla flower is pollinated by hand before its pod is slowly cured." },
    "zh-CN": { name: "马达加斯加香草", blurb: "每朵香草花都要人工授粉，结出的豆荚还需慢慢发酵晾制。" },
  },
  "dromedary-camel": {
    en: { name: "Dromedary Camel", blurb: "Its single hump stores fat, helping it cross the hot deserts of North Africa." },
    "zh-CN": { name: "单峰骆驼", blurb: "一个驼峰储存脂肪，帮助它穿越北非炎热的沙漠。" },
  },
  papyrus: {
    en: { name: "Papyrus", blurb: "This Nile wetland plant was made into one of the ancient world's best-known writing materials." },
    "zh-CN": { name: "纸莎草", blurb: "这种尼罗河湿地植物，曾被制成古代世界著名的书写材料。" },
  },
  "date-palm": {
    en: { name: "Date Palm", blurb: "Its shade and sweet fruit thrive beside oases and the Nile's green riverbanks." },
    "zh-CN": { name: "椰枣", blurb: "它在绿洲与尼罗河岸带来树荫，也结出香甜耐存的果实。" },
  },
  "hibiscus-tea": {
    en: { name: "Hibiscus Tea", blurb: "Ruby-red hibiscus calyces become a tart drink enjoyed throughout Egypt and the Nile Valley." },
    "zh-CN": { name: "洛神花茶", blurb: "深红花萼泡成酸甜饮料，在埃及与尼罗河谷十分常见。" },
  },
  "uzbek-ceramics": {
    en: { name: "Uzbek Ceramics", blurb: "Cobalt and turquoise patterns turn everyday bowls into bright Silk Road craft." },
    "zh-CN": { name: "乌兹别克彩陶", blurb: "钴蓝与青绿色纹样让日常陶碗带上鲜明的丝路色彩。" },
  },
  "kyrgyz-shyrdak": {
    en: { name: "Kyrgyz Shyrdak", blurb: "Contrasting felt pieces are fitted together into rugs with curling horn motifs." },
    "zh-CN": { name: "吉尔吉斯毡毯", blurb: "不同颜色的羊毛毡彼此拼合，形成卷曲的羊角纹样。" },
  },
  "kazakh-kumis": {
    en: { name: "Kazakh Kumis", blurb: "Fresh mare's milk is fermented into a lightly sparkling steppe drink." },
    "zh-CN": { name: "哈萨克马奶酒", blurb: "新鲜马奶经过发酵，成为带微微气泡的草原饮品。" },
  },
  "tajik-pomegranate": {
    en: { name: "Tajik Pomegranate", blurb: "Warm valleys produce ruby-red fruit packed with jewel-like seeds." },
    "zh-CN": { name: "塔吉克石榴", blurb: "温暖河谷孕育出红宝石般的果实，里面挤满晶亮籽粒。" },
  },
  "ningxia-goji": {
    en: { name: "Ningxia Goji", blurb: "Sun and dry air help these small berries keep their vivid red colour." },
    "zh-CN": { name: "宁夏枸杞", blurb: "充足日照和干燥空气，让这些小果实保持鲜亮红色。" },
  },
  "sichuan-paper-umbrella": {
    en: { name: "Sichuan Paper Umbrella", blurb: "Bamboo ribs and oiled paper make a light canopy painted for rain and celebration." },
    "zh-CN": { name: "四川油纸伞", blurb: "竹骨撑起刷油纸面，既能挡雨，也常绘上喜庆花纹。" },
  },
  "mongolian-cashmere": {
    en: { name: "Mongolian Cashmere", blurb: "Goats grow an exceptionally soft undercoat against the steppe's severe winter." },
    "zh-CN": { name: "蒙古羊绒", blurb: "山羊为了抵御草原严冬，长出格外柔软细密的底绒。" },
  },
  "okinawan-bingata": {
    en: { name: "Okinawan Bingata", blurb: "Stencils and resist dye create brilliant island flowers on cloth." },
    "zh-CN": { name: "冲绳红型染", blurb: "工匠用型纸和防染技法，把鲜艳的海岛花草留在布面上。" },
  },
  "andean-quinoa": {
    en: { name: "Andean Quinoa", blurb: "This hardy seed crop thrives in cold, high fields where many grains struggle." },
    "zh-CN": { name: "安第斯藜麦", blurb: "这种耐寒籽粮能在许多谷物难以生长的高海拔田地结实。" },
  },
  "peruvian-textile": {
    en: { name: "Peruvian Andean Textile", blurb: "Geometric colours carry local patterns through generations of weaving." },
    "zh-CN": { name: "秘鲁安第斯织物", blurb: "鲜明几何色块把地方纹样沿着一代代编织手艺传下去。" },
  },
  "amazon-acai": {
    en: { name: "Amazon Açaí", blurb: "Dark purple berries grow in clusters high on palms beside Amazon waterways." },
    "zh-CN": { name: "亚马孙巴西莓", blurb: "深紫色小果成串长在棕榈高处，常见于亚马孙水道两岸。" },
  },
  "colombian-coffee": {
    en: { name: "Colombian Coffee", blurb: "Mountain slopes, equatorial sun, and cool nights help coffee cherries ripen slowly." },
    "zh-CN": { name: "哥伦比亚咖啡", blurb: "山坡、赤道阳光与凉爽夜晚让咖啡果实缓慢成熟。" },
  },
};

const FALLBACK_LOCALE = "en";

export function getSpecialtyCopy(
  id: string,
  locale: string,
  fallbackName: string,
): SpecialtyCopy {
  const entry = COPY[id];
  if (!entry) {
    return { name: fallbackName, blurb: "" };
  }
  const copy =
    entry[locale] ??
    entry[FALLBACK_LOCALE] ?? { name: fallbackName, blurb: "" };
  return {
    name: localizeAuthoredText(copy.name, locale),
    blurb: localizeAuthoredText(copy.blurb, locale),
  };
}

export function getAllSpecialtyCopies(): readonly SpecialtyCopy[] {
  return Object.values(COPY).flatMap((entry) => {
    const copy = entry[FALLBACK_LOCALE];
    return copy ? [copy] : [];
  });
}
