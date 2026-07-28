import type { PhotoSpotId } from "./data";

type BilingualCopy = readonly [en: string, zhCn: string];

export interface LandmarkThirdQuestionSeed {
  prompt: BilingualCopy;
  options: readonly [BilingualCopy, BilingualCopy, BilingualCopy];
  answerIndex: 0 | 1 | 2;
  explain: BilingualCopy;
}

/**
 * Authored third questions for every landmark quiz.
 *
 * The compact rows keep the large bilingual content bank reviewable. Fields:
 * id | prompt EN | prompt ZH | A EN | A ZH | B EN | B ZH |
 * C EN | C ZH | answer index | explanation EN | explanation ZH
 */
const RAW_THIRD_QUESTIONS = `
gibraltar-strait|In classical tradition, what name was given to the headlands flanking the strait?|古典传说中，海峡入口两侧的山岬合称什么？|Neptune's Gate|海神之门|The Pillars of Hercules|赫拉克勒斯之柱|The Twin Peaks of Atlas|阿特拉斯双峰|1|The headlands on the European and African sides were known as the Pillars of Hercules, marking the western edge of the ancient Mediterranean world.|欧洲与非洲两侧的山岬在古典传统中被称为“赫拉克勒斯之柱”，象征古代地中海世界的西部边界。
big-ben|How many large clock faces can be seen around Elizabeth Tower?|绕着伊丽莎白塔走一圈，可以看到几面大型钟面？|Two|两面|Three|三面|Four|四面|2|The tower has one clock face on each of its four sides, making the time visible from several directions across London.|钟楼四个方向各有一面钟面，因此从伦敦不同方向都能看到时间。
brandenburg-gate|What pulls the Quadriga sculpture on top of the Brandenburg Gate?|勃兰登堡门顶部的“四马战车”雕塑由什么拉动？|Four horses|四匹马|Four lions|四头雄狮|Four eagles|四只雄鹰|0|A quadriga is a classical chariot drawn by four horses; the sculpture shows the goddess of victory driving one.|“Quadriga”指由四匹马并排牵引的古典战车，门顶雕塑中的胜利女神正驾驭这种战车。
colosseum|What was the hypogeum beneath the Colosseum arena mainly used for?|斗兽场中央表演区下方的“地下宫”主要用来做什么？|Storing the city's drinking water|储存城市饮用水|Housing passages, lifts, performers, and animals|容纳通道、升降设备、演员与动物|Burying Roman emperors|安葬罗马皇帝|1|The hypogeum was a network of rooms and passages from which lifts brought scenery, performers, and animals into the arena.|地下宫是一套房间和通道系统，工作人员可借助升降设备把布景、人员和动物送上竞技场。
acropolis|To which patron deity of Athens was the Parthenon chiefly dedicated?|帕特农神庙主要供奉雅典城的哪位守护神？|Poseidon|波塞冬|Apollo|阿波罗|Athena|雅典娜|2|The Parthenon was dedicated to Athena, the patron goddess whose name is closely linked with the city of Athens.|帕特农神庙供奉雅典娜；雅典城的名称也与这位女神相连。
swiss-alps|Which pair of major European rivers has headwaters in the Swiss Alps?|哪一对欧洲大河都在瑞士阿尔卑斯地区拥有源头？|The Rhine and the Rhône|莱茵河与罗讷河|The Thames and the Seine|泰晤士河与塞纳河|The Volga and the Don|伏尔加河与顿河|0|Alpine glaciers and snow feed several rivers; both the Rhine and the Rhône rise in the Swiss mountains.|阿尔卑斯冰川与积雪为多条河流补水，其中莱茵河和罗讷河都发源于瑞士山区。
norway-fjord|Why do waterfalls often plunge from high cliffs beside Norwegian fjords?|为什么许多挪威峡湾的陡壁上会出现高悬瀑布？|Tides lift river water to the cliff tops|海潮每天把河水抬到崖顶|Tributary glaciers left hanging valleys above the main trough|支流冰川留下的悬谷高于主峡谷|Artificial reservoirs stand above the cliffs|崖顶存在人工蓄水塔|1|Smaller tributary glaciers carved shallower valleys than the main glacier, leaving streams to fall from hanging valleys after the ice retreated.|较小支流冰川切割能力弱，留下的谷底高于主冰川深槽；冰川消退后，溪流便从悬谷跌落。
giza-pyramids|What kind of complexes were the great pyramids at Giza originally part of?|吉萨大型金字塔最初属于哪一类建筑群？|Public granaries|公共粮仓|Astronomy schools|天文学校|Royal funerary complexes for pharaohs|法老的王室墓葬建筑群|2|Each great pyramid formed the centre of a royal funerary complex that also included temples, causeways, and associated tombs.|大型金字塔是法老墓葬建筑群的核心，周围还包括神庙、堤道和其他墓葬设施。
hagia-sophia|What is best revealed by the coexistence of Christian mosaics and large Islamic calligraphic roundels inside Hagia Sophia?|建筑内并存的基督教镶嵌画与大型伊斯兰书法圆牌最能说明什么？|It has a layered history across different faiths and empires|它经历了跨越不同宗教与帝国的历史变迁|All decoration was completed in one year|所有装饰都在同一年完成|The building has never changed function|建筑从未改变过用途|0|Hagia Sophia has served in different religious roles, and its surviving decoration records those successive historical layers.|圣索菲亚先后经历教堂与清真寺等不同身份，现存装饰共同呈现了这段层叠历史。
great-wall|How did garrisons use beacon towers to send warnings quickly along the Great Wall?|古代守军如何利用沿线烽火台快速传递警报？|By sending messengers on foot between every tower|让信使逐站步行传信|By relaying smoke by day and fire by night|用白昼烟火与夜间火光接力发信号|By ringing one bell heard along the entire wall|敲钟让声音传遍整条长城|1|Neighbouring towers could see one another and relay agreed smoke and fire signals over long distances.|相邻烽火台可以观察彼此，并用烟、火等约定信号把军事信息逐段传远。
fuji-view|Beyond its physical landscape, which combination has strongly shaped Mount Fuji's cultural influence?|除了自然地貌，哪一组合也塑造了富士山长期的文化影响？|Harbour trade and shipbuilding|海港贸易与造船|Desert nomadism and oasis farming|沙漠游牧与绿洲农业|Religious pilgrimage and visual art|宗教朝圣与绘画版画|2|Mount Fuji has long drawn pilgrims and has appeared repeatedly in painting, woodblock prints, and photography.|富士山长期是朝圣对象，也反复出现在绘画、浮世绘与摄影中，成为日本重要文化象征。
taj-mahal|What was Shah Jahan's central purpose in commissioning the Taj Mahal?|沙贾汗修建泰姬陵的核心目的是什么？|To create a mausoleum for Mumtaz Mahal|为穆姆塔兹·玛哈尔建造陵墓|To build a military fortress|修建一座军事堡垒|To establish an astronomical college|建立一所天文学院|0|The Taj Mahal is the mausoleum complex commissioned by the Mughal emperor Shah Jahan for his wife Mumtaz Mahal.|泰姬陵是莫卧儿皇帝沙贾汗为妻子穆姆塔兹·玛哈尔营建的陵墓建筑群。
java-volcano|What fast-moving hazard can form when loose volcanic ash mixes with heavy rain?|火山灰与大量雨水混合后，最可能形成哪种快速下冲的灾害？|An ice avalanche|冰崩|A lahar|火山泥流|A dust storm|沙尘暴|1|Waterlogged volcanic debris can become a lahar and race down valleys, so heavy rain may remain dangerous even after an eruption.|含水火山碎屑会形成火山泥流，并可沿河谷快速移动，因此喷发结束后强降雨仍可能带来危险。
moscow-domes|What event did Ivan IV chiefly intend the cathedral to commemorate?|伊凡四世下令修建这座教堂，主要为纪念哪件事？|The founding of Saint Petersburg|圣彼得堡建城|The opening of Russia's first railway|俄国第一条铁路通车|The capture of Kazan|攻占喀山|2|The cathedral was built in the sixteenth century to commemorate victories over the Khanate of Kazan under Ivan IV.|这座教堂建于十六世纪，旨在纪念伊凡四世统治时期对喀山汗国的胜利。
eiffel-tower|Why can the Eiffel Tower's height vary slightly with the seasons?|为什么埃菲尔铁塔的高度会随季节出现很小的变化？|Its metal expands and contracts as temperature changes|金属会随温度升降而热胀冷缩|Its foundations rise and fall with the Seine's tides|地基每天随塞纳河潮汐升降|Its antenna retracts automatically in winter|塔顶天线会在冬季自动收回|0|The iron structure expands slightly when heated and contracts when cooled, producing a small but measurable change in height.|铁制结构受热会轻微膨胀，遇冷则收缩，因此极端温差可带来可测量但很小的高度变化。
statue-of-liberty|Which event is represented by the date on the tablet in the Statue of Liberty's left hand?|自由女神左手石板上的日期对应哪一事件？|The signing of the U.S. Constitution|美国宪法签署|The adoption of the Declaration of Independence|美国《独立宣言》通过|The unveiling of the statue|自由女神像揭幕|1|The tablet bears 4 July 1776 in Roman numerals, the date associated with the adoption of the Declaration of Independence.|石板以罗马数字刻着“1776年7月4日”，对应《独立宣言》通过的日期。
machu-picchu|What combination of purposes did Machu Picchu's terraces serve?|山坡上层层展开的梯田同时解决了哪些问题？|Parking chariots and training cavalry|停放战车并训练骑兵|Storing seawater and growing coral|储存海水并养殖珊瑚|Supporting crops, drainage, and erosion control|种植、排水并减缓坡面侵蚀|2|The terraces created level ground for cultivation while managing water and stabilising steep slopes.|梯田为耕作提供平面，同时分散雨水、稳定陡坡，是农业系统与山地工程的结合。
christ-the-redeemer|Which combination best describes the statue's main structure and outer surface?|这座巨像的主体结构与外表面主要采用什么组合？|Reinforced concrete clad in small soapstone pieces|钢筋混凝土主体，外覆皂石小块|A single block of carved granite|整块花岗岩直接雕成|A steel frame covered with copper sheets|钢制骨架外覆铜板|0|Reinforced concrete provides structural strength, while a mosaic of soapstone pieces creates the weather-resistant outer surface.|钢筋混凝土提供大型结构所需的强度，外覆的皂石马赛克则形成细腻耐候的表面。
chichen-itza|Around certain seasonal sunsets, what does the light-and-shadow pattern beside El Castillo's staircase resemble?|在特定季节的日落时，库库尔坎金字塔阶梯边缘的光影常让人联想到什么？|A bird spreading its wings|展翼的巨鸟|A feathered serpent undulating along the stairway|沿阶梯起伏的羽蛇|A river flowing toward the sky|一条通向天空的河流|1|Triangular shadows meet the carved serpent head at the base, creating an effect commonly associated with Kukulcan.|阶梯侧面形成的三角形阴影会与底部蛇首相连，常被解读为羽蛇神库库尔坎的形象。
petra|Through which narrow rock passage do visitors commonly approach Petra's central monuments?|游客通常穿过哪条狭长岩隙进入佩特拉核心区？|The Royal Road|帝王大道|The Rose Tunnel|玫瑰隧道|The Siq|蛇道（Siq）|2|The Siq is a narrow passage between high sandstone walls that dramatically reveals the Treasury at its far end.|蛇道是一条由高耸砂岩壁夹出的狭长通道，尽头会突然显露卡兹尼神殿立面。
angkor-wat|What do Angkor's vast reservoirs and canals show was especially important to the Khmer city?|吴哥地区庞大的水库与渠道网络说明高棉城市特别重视什么？|Storing and distributing water across seasonal changes|蓄水、分配水源与管理季节变化|Bringing seawater to an inland harbour|把海水引入内陆港口|Creating artificial glaciers|制造人工冰川|0|With highly seasonal monsoon rain, reservoirs, canals, and embankments helped manage water between wet and dry periods.|季风降雨高度集中，水库、渠道和堤道共同帮助城市在雨季与旱季之间管理水资源。
sydney-opera-house|Which statement about the interior of the Sydney Opera House is correct?|关于悉尼歌剧院内部，哪项描述正确？|The entire building contains one giant auditorium|整座建筑只有一个巨大演出厅|It contains several performance venues of different sizes and uses|它包含多个用途与规模不同的演出空间|Every white shell contains an open-air plaza|白色壳体内部全部是露天广场|1|The Opera House is a performing-arts complex with concert, opera, theatre, and other venues rather than a single hall.|悉尼歌剧院是一组演出场馆的综合体，包含音乐厅、歌剧与戏剧空间等，并非单一大厅。
grand-canyon|On the same day, how does temperature usually change when descending from the South Rim into the inner canyon?|同一天从南缘下降到峡谷内部，气温通常会怎样变化？|It becomes colder closer to the river|越往下越冷，因为更接近河流|It stays exactly the same|各处完全相同|It usually becomes warmer as elevation decreases|越往下通常越暖，因为海拔降低|2|The inner canyon lies far below the rim and is often much hotter, an important factor when planning water and hiking times.|峡谷内部海拔显著低于南缘，温度往往更高；这也是徒步者需要认真规划饮水与时段的原因。
mount-everest|Why do many climbers use supplemental oxygen near Mount Everest's summit?|许多登山者在接近峰顶时为什么使用补充氧气？|Air pressure is low, leaving less oxygen available|高海拔气压低，可利用的氧气更少|Snow absorbs all oxygen from the air|积雪会吸收空气中的全部氧气|Oxygen melts the ice beneath their boots|氧气可以融化脚下的冰|0|The oxygen percentage remains similar, but much lower air pressure means each breath delivers fewer oxygen molecules.|空气中的氧气比例并未消失，但高海拔气压大幅降低，每次呼吸能获得的氧分子更少。
niagara-falls|Under long-term natural erosion, how does the brink of Niagara Falls tend to change?|在长期自然侵蚀下，瀑布崖缘会呈现哪种变化趋势？|It steadily builds higher downstream|不断向下游堆高|It retreats upstream as rock is undercut and collapses|因岩层被掏蚀和崩落而向上游后退|It rotates around the river once a year|每年绕河流旋转一周|1|Water erodes softer layers beneath harder caprock; collapses then cause the falls to migrate upstream over time.|水流侵蚀较软岩层，失去支撑的上层岩石会崩落，使瀑布位置在漫长时间里向上游退移。
easter-island-moai|Where and from what rock were most moai carved?|复活节岛大多数摩艾石像主要在何处、用何种岩石雕成？|Coral stone from the beaches|海滩上的珊瑚石|Imported granite from another island|岛外运来的花岗岩|Volcanic tuff from the Rano Raraku quarry|拉诺拉拉库采石场的火山凝灰岩|2|Most moai were carved from volcanic tuff at Rano Raraku, where unfinished statues remain visible today.|拉诺拉拉库火山采石场是绝大多数摩艾的雕刻来源，现场至今仍能看到未完成的石像。
pompeii|How were plaster casts of some Pompeii victims created?|考古人员如何制作出部分遇难者形态的石膏模型？|By pouring plaster into voids left after bodies decomposed|向火山沉积物中遗体腐解后留下的空腔灌注石膏|By sculpting them freely from Roman paintings|根据古罗马绘画自由雕刻|By scanning bodies preserved in ice|扫描仍完整保存的冰冻遗体|0|Hardened volcanic deposits preserved body-shaped voids; filling them with plaster recorded final postures and some clothing details.|火山灰硬化后保留了遗体轮廓；向内部空腔灌注石膏，便能记录其最后姿态及衣物细节。
burj-khalifa|Which description best captures the Burj Khalifa's function?|哈利法塔最准确的功能描述是哪一项？|It is solely an observation tower|只用于观景，没有其他室内空间|It combines hotel, residential, office, and observation uses|集酒店、住宅、办公与观景等功能于一体|It is a closed television transmission tower|它是一座不对公众开放的电视发射塔|1|The Burj Khalifa is a vertically mixed-use building with hotel, residential, office, and public observation spaces.|哈利法塔是垂直混合用途建筑，不同楼层承担酒店、住宅、办公和公共观景等功能。
sagrada-familia|Why do the Nativity and Passion façades use noticeably different sculptural languages?|圣家堂的“诞生立面”与“受难立面”为何采用明显不同的雕塑语言？|They belong to two neighbouring churches|它们分别属于两座相邻教堂|One is permanent and the other is a temporary set|一面是原作，另一面只是临时布景|They express the vitality of the Nativity and the austerity of the Passion|它们分别表现基督诞生的生机与受难的肃峻|2|The richly detailed Nativity façade and the stark Passion façade use contrasting visual languages to express different religious themes.|繁茂细密的诞生立面与尖锐克制的受难立面以不同视觉语言服务各自的宗教主题。
leaning-tower-of-pisa|What was the central aim of modern engineering work on the Leaning Tower of Pisa?|现代保护工程对比萨斜塔采取的核心思路是什么？|Stabilise the foundation and reduce collapse risk while preserving the famous lean|在保留标志性倾斜的同时稳定地基、降低倒塌风险|Make it perfectly vertical and move it elsewhere|把塔完全拉直并迁往别处|Demolish it and build a visual replica|拆除原塔后建造外观相同的复制品|0|Conservation did not seek to erase the lean; measures including counterweights and soil extraction made the tower safer and more stable.|保护工作的目标不是消除全部倾斜，而是通过配重、土体处理等工程让塔体进入更安全稳定的状态。
stonehenge|Stonehenge's main axis has a famous relationship with which seasonal astronomical event?|巨石阵的轴线与哪种季节性天文现象存在著名对应关系？|The monthly full moon|每月满月|Summer-solstice sunrise and winter-solstice sunset|夏至日出与冬至日落|An annual total solar eclipse|每年都出现的日全食|1|The principal axis broadly aligns with summer-solstice sunrise and, in the opposite direction, winter-solstice sunset.|主体轴线大致对应夏至日出和反方向的冬至日落，说明季节性太阳位置对遗址具有重要意义。
golden-gate-bridge|What is the main structural job of the Golden Gate Bridge's two enormous main cables?|悬索桥的两根巨大主缆主要承担什么作用？|Guiding ships through the strait|为过往船只提供导航信号|Pumping seawater into San Francisco Bay|把海水抽入旧金山湾|Supporting the deck through suspenders and transferring loads to towers and anchorages|通过吊索承受桥面荷载，并把力量传向桥塔与锚碇|2|Vertical suspenders connect the deck to the main cables, which pass over the towers and are secured in massive anchorages.|桥面由垂直吊索连接主缆，主缆跨过桥塔并固定在两端锚碇中，形成悬索桥的主要受力体系。
uluru|What chiefly gives Uluru's surface its striking reddish-brown colour?|乌鲁鲁岩面醒目的红褐色主要来自什么？|Iron-bearing minerals oxidising at the surface|岩石中含铁矿物在表面氧化|Ochre paint applied each year|每年人工涂刷的赭石颜料|A permanent coating of red pollen|附近红色花粉长期覆盖|0|Iron-bearing minerals react with air and moisture, producing oxides that give the surface its rust-like colour.|岩石中的含铁矿物与空气和水分作用后形成氧化物，让表面呈现类似铁锈的红色。
grand-prismatic-spring|Why must visitors stay on boardwalks and designated trails around Grand Prismatic Spring?|参观大棱镜温泉时，为什么必须留在栈道和指定步道上？|To avoid disturbing large animals swimming in the spring|防止惊扰在温泉中游泳的大型动物|The crust can be thin, the water extremely hot, and the ecosystem fragile|地壳可能很薄，附近水体温度极高且生态脆弱|Everything beyond the boardwalk is private farmland|栈道之外全部属于私人农场|1|Ground in thermal areas may hide near-boiling water beneath a thin crust, and off-trail travel can also damage fragile microbial surfaces.|地热区表面看似坚实，地下却可能是接近沸点的水；偏离步道既危险，也会破坏脆弱的微生物地表。
victoria-falls|Victoria Falls lies on the border between which two countries?|维多利亚瀑布位于哪两个国家的边界？|Kenya and Tanzania|肯尼亚与坦桑尼亚|South Africa and Namibia|南非与纳米比亚|Zambia and Zimbabwe|赞比亚与津巴布韦|2|The Zambezi plunges along the Zambia–Zimbabwe border, with viewing areas accessible from both countries.|赞比西河在赞比亚与津巴布韦边界跌落，两国一侧都设有观看瀑布的区域。
great-barrier-reef|What happens to corals during heat-stress bleaching?|海水异常升温导致“珊瑚白化”时，珊瑚发生了什么？|Corals lose the symbiotic algae that provide much of their colour and energy|珊瑚排出或失去提供色彩和能量的共生藻类|Corals instantly become white rock and inevitably die|珊瑚瞬间变成白色岩石且必然死亡|Corals deliberately cover themselves with white sand|珊瑚主动覆盖白沙来降低温度|0|Heat stress disrupts the coral–algae partnership, removing colour and a major energy source; recovery is possible if conditions improve soon enough.|高温压力会破坏珊瑚与共生藻类的关系，使珊瑚失去颜色和重要能量来源；若压力及时缓解，部分珊瑚仍可能恢复。
pointe-du-hoc|Why are craters, damaged fortifications, and uneven ground preserved at Pointe du Hoc instead of being rebuilt to look new?|为什么遗址保留了弹坑、破损工事与起伏地形，而没有全部修复成新貌？|Local law forbids all vegetation growth|当地法律禁止任何植物生长|To let authentic battlefield traces help visitors understand the event and its cost|让真实的战场痕迹帮助后人理解事件及其代价|The terrain is part of a modern amusement ride|这些地形是现代游乐设施的一部分|1|Preserving physical traces lets the memorial landscape bear witness to history and supports reflection rather than cosmetic reconstruction.|保留现场痕迹能让纪念地以物证讲述历史；参观重点是理解和反思，而不是把遗址恢复成战争前的整洁景观。
hiroshima-peace-memorial|What was the Atomic Bomb Dome originally used as before the bombing?|原爆圆顶馆在爆炸发生前最初是什么建筑？|A castle watchtower|城堡瞭望塔|A central railway station|火车总站|An exhibition hall promoting regional industry|展示与推广地方产业的陈列馆|2|The building began as the Hiroshima Prefectural Commercial Exhibition Hall and later promoted regional industry before becoming a memorial.|建筑最初是广岛县物产陈列馆，后来称产业奖励馆；残存的钢架圆顶使它成为战争记忆与和平愿望的象征。
lake-baikal|Which locally endemic mammal is an emblem of Lake Baikal's ecosystem?|哪种仅生活在这一地区的哺乳动物是贝加尔湖生态的代表？|The Baikal seal|贝加尔海豹|The Amazon river dolphin|亚马孙河豚|The polar bear|北极熊|0|The Baikal seal, or nerpa, is endemic to the lake and is one of its most distinctive animal species.|贝加尔海豹又称“涅尔帕”，是生活在贝加尔湖中的特有海豹，也是深湖生态系统的重要成员。
lena-pillars|What do the limestone rocks, now far from a modern coast, indicate about the area's distant past?|这些远离现代海岸的石灰岩说明此地在远古时期曾是什么环境？|It has always been a dry desert|这里一直是干燥沙漠|The sediments formed in an ancient shallow sea|沉积物曾在古老浅海环境中形成|Every pillar came from a recent eruption|岩柱全部来自近代火山喷发|1|The limestone began as Cambrian marine sediment and was later uplifted and sculpted by freeze-thaw weathering and erosion.|柱状岩的石灰岩源自寒武纪海洋沉积，后来经抬升、冻融与侵蚀塑造成今天的塔柱轮廓。
persepolis|What do the gift-bearing delegations carved on the palace stairways chiefly express?|宫殿阶梯浮雕中，来自帝国各地、携带礼物的人群主要表达什么？|An ancient athletic contest|一场古代体育竞赛|A disaster evacuation|一次逃离城市的灾难|The breadth and diversity of the Achaemenid Empire|阿契美尼德帝国广阔而多元的疆域|2|Distinct clothing, hairstyles, and gifts identify delegations from different regions, presenting an image of imperial scale and diversity.|不同服饰、发型与贡礼区分出多个地区的使团，共同构成王权与帝国多样性的视觉叙事。
hegra|Why are the ancient inscriptions beside many Hegra tomb entrances especially valuable to archaeologists?|许多墓门旁的古代铭文为什么对考古研究特别重要？|They record owners, dates, and rules governing the tombs|它们记录墓主、年代及有关墓葬使用的规则|They are modern directions left for visitors|它们是现代游客留下的路线提示|They record only daily weather|它们只记录每日天气|0|The inscriptions act as legal and personal records, revealing Nabataean families, society, dates, and funerary rules.|铭文像刻在岩石上的法律与身份档案，帮助研究者理解纳巴泰人的家庭、社会和墓葬制度。
samarra-minaret|The ninth-century minaret chiefly bears witness to which dynasty's period of building Samarra as a capital?|这座九世纪宣礼塔最能见证哪个王朝把萨迈拉建设为都城的时期？|The Ottoman dynasty|奥斯曼王朝|The Abbasid dynasty|阿拔斯王朝|The Mughal dynasty|莫卧儿王朝|1|Samarra served as the Abbasid caliphal capital in the ninth century, when its Great Mosque and spiral minaret were built.|萨迈拉在九世纪一度是阿拔斯哈里发的都城，大清真寺及螺旋宣礼塔体现了当时宏大的城市建设。
lake-louise|In which Canadian national park is Lake Louise located?|露易丝湖位于加拿大哪座国家公园？|Jasper National Park|贾斯珀国家公园|Yoho National Park|幽鹤国家公园|Banff National Park|班夫国家公园|2|Lake Louise lies in Banff National Park, Alberta, and is one of the Canadian Rockies' best-known glacial lakes.|露易丝湖位于艾伯塔省的班夫国家公园，是加拿大落基山脉最知名的冰川湖景观之一。
teotihuacan|Which statement correctly describes the chronological relationship between Teotihuacan and the Aztecs?|关于特奥蒂瓦坎与阿兹特克文明的时间关系，哪项正确？|Teotihuacan flourished centuries before the Aztec Empire|特奥蒂瓦坎繁盛时期比阿兹特克帝国早了数百年|The Aztecs built it after Europeans arrived|这座城市是阿兹特克人在欧洲人到来后修建的|They stood on different continents and had no connection|两者分别位于不同大陆，互无关联|0|The Aztecs encountered an already ancient city and gave it the name Teotihuacan; much about its original builders remains unresolved.|阿兹特克人后来面对的已是一座古老遗址，并为它赋予“特奥蒂瓦坎”这一名称；城市原建造者的身份仍有许多未解问题。
panama-canal|What important role does Gatun Lake play in the Panama Canal system?|加通湖在巴拿马运河系统中承担什么重要作用？|It is an unrelated natural salt lake|它是与运河无关的天然咸水湖|It forms a major part of the route and supplies freshwater for lock operations|它构成大段航道，并为船闸运行提供淡水|It is used only to store retired ships|它只用于停放废弃船只|1|Ships are raised to Gatun Lake to cross much of the isthmus, and the lake also supplies water used in lockages.|船只被船闸提升到加通湖水位后穿越地峡；湖水也是船闸每次升降的重要水源。
iguazu-falls|What is the largest and most iconic horseshoe-shaped chasm in the Iguazú Falls system called?|伊瓜苏瀑布群中规模最大、最具代表性的马蹄形深槽叫什么？|Horseshoe Falls|马蹄瀑布|The Smoke that Thunders|雷鸣之烟|Devil's Throat|魔鬼咽喉|2|Devil's Throat is one of the most powerful parts of the system, where concentrated flows plunge into a deep curved chasm.|魔鬼咽喉是瀑布群中水流最集中、声势最强的区域之一，巨量水流从弧形崖缘跌入狭深峡槽。
salar-de-uyuni|Why do broad polygon patterns form across Salar de Uyuni's dry-season salt crust?|干季盐壳上为什么会出现大片多边形纹理？|Repeated evaporation and contraction crack and recrystallise the salt crust|反复蒸发和收缩使盐壳开裂、重新结晶|Local workers stamp each shape with moulds|当地人用模具逐块压制|Tree roots push the salt into a regular grid|地下树根把盐面顶成规则网格|0|As water evaporates, salt crystallises and contracts; repeated wetting and drying develops the conspicuous polygon network.|水分蒸发后，盐分结晶并发生收缩开裂；反复的湿润与干燥过程逐渐形成醒目的多边形盐纹。
torres-del-paine|Which South American camelid are travellers most likely to see on the grasslands of Torres del Paine?|在百内国家公园草原地带，旅行者最可能看到哪种南美骆驼科动物？|Alpaca|羊驼|Guanaco|原驼|Bactrian camel|双峰驼|1|Guanacos are adapted to Patagonia's open, windy grasslands and are among the park's most characteristic wild animals.|原驼适应巴塔哥尼亚开阔、多风的草原，是百内国家公园最具代表性的野生动物之一。
fish-river-canyon|In Namibia's arid climate, what hydrological pattern is typical of the Fish River on the canyon floor?|在纳米比亚干旱气候下，谷底鱼河通常呈现什么水文特征？|A constant high flow throughout the year|全年保持同样高水位|Twice-daily changes controlled by ocean tides|每天受海潮控制两次涨落|Highly seasonal flow, sometimes reduced to pools or a dry channel|水量季节性很强，部分时段只剩水潭或干河床|2|Rainfall is sparse and irregular, so the river does not maintain a strong year-round flow and may shrink to pools or dry stretches.|鱼河流域降雨少且不稳定，河流并非常年保持充沛水量，其季节性正是干旱峡谷景观的一部分。
drakensberg|Who created much of the ancient rock art preserved in Drakensberg caves and shelters?|德拉肯斯堡洞穴与岩壁中保存的大量古代岩画主要由谁创作？|The San people|桑人|Roman legions|古罗马军团|Viking sailors|维京航海者|0|The uKhahlamba–Drakensberg region preserves a rich body of San rock art depicting animals, people, and spiritual traditions.|德拉肯斯堡—乌卡兰巴地区保存了数量丰富的桑人岩画，记录动物、人物与精神文化，是自然景观之外的重要文化遗产。
lalibela|Which statement most accurately describes Lalibela's churches today?|关于今天的拉利贝拉教堂，哪项描述最准确？|They are abandoned archaeological ruins|它们只是停止使用的考古遗迹|They are both historic monuments and active places of worship|它们既是历史遗产，也是仍在使用的宗教场所|They have all been moved into an indoor museum|它们已全部迁入室内博物馆|1|Pilgrims, clergy, and local worshippers still use the churches, so visitors encounter a living religious landscape as well as a historic site.|朝圣者、神职人员与当地信众至今仍在教堂举行宗教活动，因此参观时需要尊重活态信仰空间。
great-mosque-djenne|What practical role do the rows of projecting wooden beams, called toron, play during maintenance?|墙面伸出的成排木梁“toron”在维护中有什么实际用途？|They channel rainwater into indoor pools|把雨水引入室内水池|They support a retractable metal roof|支撑可以开合的金属屋顶|They act as permanent scaffolding for replastering|充当永久脚手架，方便工匠重新抹泥|2|Earthen walls require regular replastering; the projecting beams shape the mosque's appearance and provide footholds and supports for community maintenance.|泥土建筑需要定期修补外层抹面，伸出墙体的木梁既形成独特外观，也为社区维护提供落脚与支撑。
registan|What did the name “Registan” originally mean?|“雷吉斯坦”这个名称原本是什么意思？|Sandy place|沙地|Blue dome|蓝色穹顶|Three schools|三所学校|0|Registan comes from Persian for a sandy place; the name later became attached to Samarkand's great public square.|“雷吉斯坦”源自波斯语，意为“沙地”或“沙的地方”；后来成为撒马尔罕重要公共广场的名称。
`.trim();

export const LANDMARK_THIRD_QUESTIONS =
  parseThirdQuestionRows(RAW_THIRD_QUESTIONS);

function parseThirdQuestionRows(
  raw: string,
): Readonly<Record<PhotoSpotId, LandmarkThirdQuestionSeed>> {
  const entries = raw.split("\n").map((line) => {
    const fields = line.split("|");
    if (fields.length !== 12) {
      throw new Error(
        `Landmark third-question row must have 12 fields, got ${fields.length}.`,
      );
    }
    const [
      id,
      promptEn,
      promptZh,
      optionAEn,
      optionAZh,
      optionBEn,
      optionBZh,
      optionCEn,
      optionCZh,
      rawAnswerIndex,
      explainEn,
      explainZh,
    ] = fields;
    const answerIndex = Number(rawAnswerIndex);
    if (answerIndex !== 0 && answerIndex !== 1 && answerIndex !== 2) {
      throw new Error(
        `Landmark third-question "${id}" has invalid answer index.`,
      );
    }
    const seed: LandmarkThirdQuestionSeed = {
      prompt: [promptEn, promptZh],
      options: [
        [optionAEn, optionAZh],
        [optionBEn, optionBZh],
        [optionCEn, optionCZh],
      ],
      answerIndex,
      explain: [explainEn, explainZh],
    };
    return [id as PhotoSpotId, seed] as const;
  });

  const bank = Object.fromEntries(entries) as Partial<
    Record<PhotoSpotId, LandmarkThirdQuestionSeed>
  >;
  if (Object.keys(bank).length !== entries.length) {
    throw new Error("Landmark third-question IDs must be unique.");
  }
  return bank as Readonly<Record<PhotoSpotId, LandmarkThirdQuestionSeed>>;
}
