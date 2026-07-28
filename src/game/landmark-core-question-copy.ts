import type { PhotoSpotId } from "./data";

type BilingualCopy = readonly [en: string, zhCn: string];

/**
 * Individually authored prompts for the first two questions at every landmark.
 * The answer choices and explanations remain attached to their verified fact
 * records in quiz.ts; this layer replaces the old terse or repeated wording.
 */
const RAW_LANDMARK_CORE_PROMPTS = `
gibraltar-strait|A ship passing west through the Strait of Gibraltar leaves the Mediterranean for which ocean?|船只向西穿过直布罗陀海峡后，会从地中海进入哪片大洋？|At its narrowest point, the strait separates the landmasses of which two continents?|海峡最窄处隔开了哪两个大洲的大陆部分？
big-ben|Before the nickname spread to the whole landmark, what did “Big Ben” specifically name?|“大本钟”这个昵称扩展到整座地标以前，最初专指什么？|The clock tower was renamed in 2012 to honour Elizabeth II. What is its official name now?|2012年，为纪念伊丽莎白二世，这座钟楼更名为什么正式名称？
brandenburg-gate|When crowds gathered around the Brandenburg Gate as the Berlin Wall opened in 1989, which city were they in?|1989年柏林墙开放时，人群聚集在勃兰登堡门周围；这座门位于哪座城市？|Why did the Brandenburg Gate become a powerful symbol after the Cold War?|冷战结束后，勃兰登堡门为什么成为强有力的历史象征？
colosseum|The Flavian emperors built their great amphitheatre in the centre of which ancient capital?|弗拉维王朝在古代哪座都城中心修建了这座大型圆形竞技场？|Which floor plan allowed spectators to surround the Colosseum's arena with continuous tiers of seating?|哪种平面形状使观众席能够连续环绕斗兽场中央表演区？
acropolis|The Parthenon crowns a limestone citadel above which Greek city?|帕特农神庙坐落在一座石灰岩城堡山顶，俯瞰哪座希腊城市？|Which temple dominates the Acropolis and embodies the city's dedication to Athena?|哪座神庙是雅典卫城的主体，并体现城市对雅典娜的崇敬？
swiss-alps|Which combination would a traveller actually encounter while crossing the high Swiss Alps?|穿越瑞士阿尔卑斯高山区时，旅行者实际会遇到哪组景观？|Which engineering systems made steep Alpine slopes accessible without relying only on mountain roads?|哪些交通工程让陡峭阿尔卑斯山坡不再只能依赖山路抵达？
norway-fjord|What carved the deep troughs that seawater later flooded to create Norway's fjords?|是什么先切割出深谷，随后海水进入其中形成挪威峡湾？|Which cross-section best describes a classic fjord rather than an ordinary lowland bay?|哪种剖面特征最符合典型峡湾，而不是普通低地海湾？
giza-pyramids|The pyramid fields on the desert edge west of Cairo belong to which modern country?|开罗以西沙漠边缘的金字塔群位于哪个现代国家？|Why does the Great Pyramid of Khufu hold a unique place among the Seven Wonders of the ancient world?|为什么胡夫金字塔在古代世界七大奇迹中具有独一无二的地位？
hagia-sophia|In which city did Hagia Sophia successively serve Byzantine, Ottoman and modern religious histories?|圣索菲亚大教堂先后经历拜占庭、奥斯曼与现代宗教历史，它位于哪座城市？|Which structural feature creates Hagia Sophia's famously expansive central interior?|哪项结构特征形成了圣索菲亚大教堂著名的开阔中央空间？
great-wall|What strategic problem were walls, passes and beacon towers across northern China intended to address?|中国北方的城墙、关隘与烽火台主要用来应对什么战略问题？|Why is it misleading to imagine the Great Wall as one structure built at a single moment?|为什么把长城想象成某一时刻一次建成的单体建筑并不准确？
fuji-view|Which national superlative belongs to Mount Fuji's 3,776-metre summit?|海拔3776米的富士山拥有日本哪项“最高”纪录？|Geologically, how should Mount Fuji's layered cone of lava and ash be classified?|从地质上看，富士山由多层熔岩与火山灰构成的锥体属于哪类地貌？
taj-mahal|Which stone gives the Taj Mahal's central mausoleum its luminous surface and changing colour in different light?|哪种石材让泰姬陵中央陵墓呈现明亮表面，并随光线产生细微色彩变化？|Which organising principle aligns the gateway, garden, reflecting pool and mausoleum at the Taj Mahal?|哪项布局原则把泰姬陵的入口、花园、倒影池与陵墓组织在一起？
java-volcano|Which tectonic setting explains the chain of volcanoes running across Java?|哪种构造环境能够解释贯穿爪哇岛的火山链？|Why have communities continued farming close to Java's dangerous volcanic slopes?|既然火山具有危险性，为什么爪哇岛许多社区仍长期在火山坡附近耕作？
moscow-domes|At which edge of Red Square does Saint Basil's Cathedral form its famous silhouette?|圣瓦西里大教堂在红场哪一侧形成著名的城市轮廓？|Which visual feature makes Saint Basil's group of chapels recognisable even from a distant view?|哪项视觉特征让圣瓦西里大教堂的礼拜堂群从远处也容易辨认？
eiffel-tower|Which material allowed the Eiffel Tower to use a light, open lattice instead of solid masonry walls?|哪种材料使埃菲尔铁塔能够采用轻盈通透的网格，而非厚重实体墙？|For which international event was the Eiffel Tower completed as a temporary-looking entrance monument?|埃菲尔铁塔为哪场国际活动落成，并成为当时看似临时的入口纪念建筑？
statue-of-liberty|Which country presented the Statue of Liberty to the United States as a nineteenth-century republican gift?|十九世纪，哪个国家把自由女神像作为共和友谊的礼物赠予美国？|Why did the Statue of Liberty's copper skin change from brown to its present green?|自由女神像的铜质外皮为什么从棕色逐渐变成今天的绿色？
machu-picchu|Which civilisation built Machu Picchu in the fifteenth-century Andes?|哪个文明在十五世纪的安第斯山区修建了马丘比丘？|How could Inca masons make many wall joints fit tightly without using mortar?|印加工匠如何在不用砂浆的情况下，让许多墙体石块严密结合？
christ-the-redeemer|From which mountain does Christ the Redeemer overlook Rio de Janeiro's bay and city?|里约热内卢基督像从哪座山俯瞰城市与海湾？|Which simple gesture gives the statue its instantly recognisable outline against the sky?|哪种简洁姿态构成了基督像映衬天空时最易辨认的轮廓？
chichen-itza|Which civilisation made Chichén Itzá a major political and ceremonial centre in Yucatán?|哪个文明把奇琴伊察发展为尤卡坦的重要政治与礼仪中心？|Why is the total commonly associated with El Castillo's stairways and summit platform the number 365?|为什么库库尔坎金字塔的阶梯与顶部平台总数常与365这个数字联系起来？
petra|Which trading people made Petra a caravan centre between Arabia and the Mediterranean world?|哪个商贸民族把佩特拉发展为连接阿拉伯与地中海世界的商队中心？|How were Petra's monumental façades produced without first constructing freestanding walls?|佩特拉的宏大立面如何在不先修建独立墙体的情况下形成？
angkor-wat|The vast temple city of Angkor Wat stands near Siem Reap in which country?|吴哥窟这座宏大的寺庙城市位于暹粒附近，属于哪个国家？|Before its later Buddhist history, to which Hindu deity was Angkor Wat principally dedicated?|在后来成为佛教圣地以前，吴哥窟最初主要供奉哪位印度教神祇？
sydney-opera-house|Whose competition-winning design became the Sydney Opera House despite a difficult construction history?|谁的竞赛获奖方案最终成为悉尼歌剧院，尽管其建设过程充满困难？|What natural or maritime forms do the harbour-side roof shells most readily evoke?|悉尼港边成组展开的屋顶壳体最容易让人联想到哪些自然或海洋形态？
grand-canyon|Which river continues to cut through the rock at the bottom of the Grand Canyon?|哪条河流至今仍在美国大峡谷谷底切割岩石？|What can geologists read from the immense staircase of exposed rock layers in the canyon walls?|地质学家能够从峡谷壁层层裸露的岩石中读出什么？
mount-everest|Which measurement gives Mount Everest its global record among mountain summits?|哪项测量结果使珠穆朗玛峰拥有世界山峰纪录？|The summit ridge of Everest forms part of the border between which two countries?|珠穆朗玛峰的峰顶山脊构成哪两个国家之间的部分边界？
niagara-falls|How many named major waterfalls make up the Niagara Falls system rather than a single drop?|尼亚加拉瀑布并非单一水帘，而是由几处有名称的主要瀑布组成？|Which international boundary runs through part of the Niagara River and falls complex?|哪条国界穿过尼亚加拉河及瀑布群的一部分？
easter-island-moai|How many restored moai form the monumental line at Ahu Tongariki?|阿胡汤加里基石台上重新竖立的摩艾共有多少尊？|Rather than watching the ocean, where do the moai of Ahu Tongariki direct their gaze?|阿胡汤加里基的摩艾并非注视海洋，它们面向哪里？
pompeii|Which volcano's eruption buried Pompeii in AD 79?|公元79年，哪座火山喷发并掩埋了庞贝？|Why does Pompeii reveal more about ordinary Roman urban life than a collection of isolated artworks could?|为什么与孤立文物相比，庞贝更能展示普通罗马城市生活？
burj-khalifa|Which figure is closest to the full architectural height of the Burj Khalifa?|哪个数值最接近哈利法塔的完整建筑高度？|Which plan and setback strategy helps the Burj Khalifa disrupt wind forces as it rises?|哪种平面与退台策略帮助哈利法塔在升高过程中削弱风力影响？
sagrada-familia|Which architect devoted the later part of his career to the Sagrada Família's evolving design?|哪位建筑师把职业生涯后期投入圣家堂不断发展的设计？|What source inspired the branching columns, filtered light and growing forms inside the basilica?|圣家堂内部的分枝立柱、过滤光线与生长般形态主要受到什么启发？
leaning-tower-of-pisa|What role was the Leaning Tower designed to perform within Pisa's cathedral complex?|比萨斜塔最初在主教座堂建筑群中承担什么功能？|What began pulling the tower off vertical before construction had even finished?|施工尚未结束时，什么原因已经让比萨斜塔偏离垂直？
stonehenge|In a Stonehenge trilithon, how are the three massive stones arranged?|巨石阵的“三石门”中，三块巨石按照什么方式组合？|Roughly when was Stonehenge's principal stone setting erected, after earlier phases at the site?|巨石阵遗址经历更早阶段后，主体石圈大约在何时竖立？
golden-gate-bridge|Which narrow passage does the Golden Gate Bridge cross between San Francisco Bay and the Pacific?|金门大桥横跨旧金山湾与太平洋之间的哪种水域？|Why was International Orange a practical as well as aesthetic choice for the bridge?|为什么“国际橙”对金门大桥而言不仅美观，也有实际作用？
uluru|In which part of Australia does Uluru rise from the red desert plain?|乌鲁鲁从澳大利亚哪个区域的红色荒原中升起？|For which traditional owners is Uluru a living cultural landscape rather than simply a scenic rock?|对哪一传统所有者群体而言，乌鲁鲁是活态文化景观，而不仅是一块风景岩石？
grand-prismatic-spring|Which protected area contains Grand Prismatic Spring and the world's greatest concentration of geysers?|大棱镜温泉位于哪片保护地，这里还拥有全球最密集的间歇泉群？|Why do orange and yellow bands appear around the cooler margins of Grand Prismatic Spring?|为什么大棱镜温泉温度较低的外围会出现橙黄等彩色色带？
victoria-falls|Which river plunges into the narrow basalt gorges at Victoria Falls?|哪条河流在维多利亚瀑布处跌入狭窄的玄武岩峡谷？|What sensory experience is captured by the local name Mosi-oa-Tunya?|当地名称“莫西奥图尼亚”描绘了怎样的感官体验？
great-barrier-reef|Off which Australian coast does the Great Barrier Reef extend through the Coral Sea?|大堡礁沿澳大利亚哪片海岸外侧的珊瑚海延伸？|Why is it inaccurate to picture the Great Barrier Reef as one continuous block of coral?|为什么把大堡礁想象成一整块连续珊瑚并不准确？
pointe-du-hoc|On which date did US Army Rangers scale the cliffs at Pointe du Hoc during the Normandy landings?|诺曼底登陆期间，美国陆军游骑兵在哪一天攀上奥克角悬崖？|Whose assault and losses are commemorated by the monument standing above the preserved battlefield?|矗立在保留战场上方的纪念碑，纪念哪支部队的进攻与伤亡？
hiroshima-peace-memorial|On which date did the atomic bombing leave the building now known as the Atomic Bomb Dome in ruins?|哪一天的原子弹爆炸使今天称为“原爆圆顶馆”的建筑成为废墟？|Why was the damaged dome stabilised instead of demolished during Hiroshima's reconstruction?|广岛重建过程中，人们为什么选择加固残损圆顶馆，而不是将其拆除？
lake-baikal|A traveller following the Trans-Siberian route around Lake Baikal is travelling through which country?|旅行者沿西伯利亚铁路绕行贝加尔湖时，身处哪个国家？|Which record follows from Lake Baikal occupying an exceptionally deep continental rift?|贝加尔湖位于异常深的大陆裂谷中，因此拥有哪项世界纪录？
lena-pillars|The Lena River and its kilometre-long ranks of stone pillars lie in the Siberian territory of which country?|勒拿河及沿岸绵延的柱状岩群位于哪个国家的西伯利亚地区？|Which slow processes separated the limestone cliff into towers and narrow pinnacles?|哪些缓慢作用把石灰岩峭壁切割成塔柱与尖峰？
persepolis|The ceremonial terraces of Persepolis now lie within the borders of which country?|波斯波利斯的礼仪平台今天位于哪个国家境内？|Which empire received delegations in the columned palaces of Persepolis?|哪个帝国曾在波斯波利斯的柱廊宫殿中接见各地使团？
hegra|The Nabataean tombs of Hegra stand in the desert of which modern country?|纳巴泰人的黑格拉墓葬群位于哪个现代国家的沙漠中？|How did Nabataean masons create Hegra's monumental tomb fronts in the sandstone cliffs?|纳巴泰石匠如何在黑格拉的砂岩峭壁上制作宏大墓门？
samarra-minaret|The ninth-century Great Mosque and spiral minaret of Samarra stand in which modern country?|萨迈拉九世纪大清真寺与螺旋宣礼塔位于哪个现代国家？|Which feature turns the minaret itself into a visible processional path rising around the tower?|哪项结构使宣礼塔本身形成一条环绕塔身上升、清晰可见的行进路线？
lake-louise|Lake Louise lies beside the Canadian Rockies in which country?|露易丝湖坐落在加拿大落基山脉之中，属于哪个国家？|Why does glacier-fed Lake Louise often appear turquoise rather than completely clear?|冰川补给的露易丝湖为什么常呈蓝绿色，而不是完全透明？
teotihuacan|The ancient metropolis of Teotihuacan lies northeast of the capital of which modern country?|特奥蒂瓦坎古城位于哪个现代国家首都的东北方向？|Which monumental street organises Teotihuacan's pyramids, plazas and civic layout?|哪条纪念性大道组织了特奥蒂瓦坎的金字塔、广场与城市布局？
panama-canal|The canal cutting across the Central American isthmus takes its name from which country?|横穿中美洲地峡的这条运河以哪个国家命名？|How do canal locks let an ocean-going ship cross terrain higher than sea level?|运河船闸如何让远洋船只穿越高于海平面的地形？
iguazu-falls|Puerto Iguazú and the national-park walkways on the falls' southern side are in which country?|伊瓜苏瀑布南侧的伊瓜苏港与国家公园步道位于哪个国家？|Why is Iguazú better understood as a vast waterfall system than as one single curtain of water?|为什么伊瓜苏更应被理解为庞大瀑布群，而不是单一水帘？
salar-de-uyuni|The world's largest salt flat spreads across the Altiplano of which country?|世界最大的盐沼铺展在哪个国家的高原地区？|Under which seasonal condition does Salar de Uyuni become an enormous reflection of the sky?|乌尤尼盐沼在什么季节性条件下会变成映照天空的巨大镜面？
torres-del-paine|The granite towers and glacial lakes of Torres del Paine are protected in which country?|百内三塔的花岗岩峰与冰川湖泊位于哪个国家的保护区？|Which resistant rock forms the pale cores of the famous Paine towers?|哪种坚硬岩石构成了著名百内三塔浅色的核心部分？
fish-river-canyon|The long, arid Fish River Canyon cuts through the south of which African country?|漫长而干旱的鱼河大峡谷切穿哪个非洲国家南部？|Which estimate best conveys the canyon's length rather than only the distance across one viewpoint?|哪个估算最能体现鱼河大峡谷的总长度，而非某个观景点的局部宽度？
drakensberg|The Amphitheatre escarpment and Tugela Falls lie in which country?|德拉肯斯堡“圆形剧场”陡崖与图盖拉瀑布位于哪个国家？|Which waterfall descends in several leaps from near the top of the Drakensberg Amphitheatre?|哪座瀑布从德拉肯斯堡圆形剧场顶部附近分段跌落？
lalibela|The rock-hewn church complex at Lalibela remains an active pilgrimage centre in which country?|拉利贝拉岩石教堂群至今仍是哪个国家的重要朝圣中心？|How could Lalibela's churches be made below ground without assembling ordinary masonry walls?|拉利贝拉教堂如何在地下成形，而无需像普通建筑那样逐层砌墙？
great-mosque-djenne|The monumental earthen mosque at Djenné stands in which West African country?|杰内宏大的泥土清真寺位于哪个西非国家？|Which locally available building system requires the community to renew the mosque's outer surface regularly?|哪种取自当地的建筑体系，使社区必须定期修补清真寺外表面？
registan|The tiled madrasas of Registan Square form the historic centre of Samarkand in which country?|雷吉斯坦广场的彩砖伊斯兰学校构成撒马尔罕历史中心，它位于哪个国家？|What type of institution occupies each of the three monumental sides of Registan Square?|雷吉斯坦广场三面宏大建筑分别属于哪种机构？
`.trim();

export const LANDMARK_CORE_QUESTION_PROMPTS =
  parseLandmarkCorePromptRows(RAW_LANDMARK_CORE_PROMPTS);

function parseLandmarkCorePromptRows(
  raw: string,
): Readonly<Record<PhotoSpotId, readonly [BilingualCopy, BilingualCopy]>> {
  const entries = raw.split("\n").map((line) => {
    const fields = line.split("|");
    if (fields.length !== 5) {
      throw new Error(
        `Landmark core prompt row must have 5 fields, got ${fields.length}.`,
      );
    }
    const [id, firstEn, firstZh, secondEn, secondZh] = fields;
    return [
      id as PhotoSpotId,
      [
        [firstEn, firstZh],
        [secondEn, secondZh],
      ],
    ] as const;
  });
  if (new Set(entries.map(([id]) => id)).size !== entries.length) {
    throw new Error("Landmark core prompt IDs must be unique.");
  }
  return Object.fromEntries(entries) as Readonly<
    Record<PhotoSpotId, readonly [BilingualCopy, BilingualCopy]>
  >;
}
