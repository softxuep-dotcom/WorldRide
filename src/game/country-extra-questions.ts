type BilingualCopy = readonly [en: string, zhCn: string];

export interface CountryExtraQuestionSeed {
  prompt: BilingualCopy;
  options: readonly [BilingualCopy, BilingualCopy, BilingualCopy];
  answerIndex: 0 | 1 | 2;
  explain: BilingualCopy;
}

const RAW_COUNTRY_EXTRA_QUESTIONS = `
Algeria|Which ancient kingdom, ruled by Massinissa, became a major power in what is now Algeria?|马西尼萨统治的哪个古代王国，曾在今天的阿尔及利亚地区成为强国？|Numidia|努米底亚|Sumer|苏美尔|Sparta|斯巴达|0|Numidia united much of the central Maghreb after the Second Punic War.|第二次布匿战争后，努米底亚统一了马格里布中部大片地区。
Argentina|Which 1810 event in Buenos Aires began the process that led toward Argentine independence?|1810年布宜诺斯艾利斯发生的哪一事件，开启了阿根廷走向独立的进程？|The October Revolution|十月革命|The May Revolution|五月革命|The Glorious Revolution|光荣革命|1|The May Revolution removed the Spanish viceroy and created a local governing junta.|五月革命罢免西班牙总督，并建立地方执政委员会。
Australia|What are “songlines” in many Aboriginal Australian traditions?|在许多澳大利亚原住民传统中，“歌之路径”是什么？|Railways built during the gold rush|淘金热时期修建的铁路|Routes encoded through stories, songs and ancestral knowledge|通过故事、歌谣与祖先知识保存的路线|Modern pop-music charts|现代流行音乐排行榜|1|Songlines connect places, creation stories, law and practical navigation across Country.|歌之路径把地点、创世故事、规则与穿越乡土的实际导航联系起来。
Brazil|Why did the Portuguese royal court move to Rio de Janeiro in 1808?|葡萄牙王室为什么在1808年迁往里约热内卢？|Napoleon's forces invaded Portugal|拿破仑军队入侵葡萄牙|Lisbon was destroyed by a volcano|里斯本被火山摧毁|Brazil had conquered Portugal|巴西征服了葡萄牙|0|The court fled the Napoleonic invasion, making Rio the centre of the Portuguese Empire.|王室为躲避拿破仑入侵而迁移，使里约一度成为葡萄牙帝国中心。
Canada|What did the British North America Act create in 1867?|1867年的《英属北美法案》建立了什么？|The Canadian Confederation|加拿大联邦|A union with the United States|与美国合并|The abolition of every province|取消所有省份|0|Ontario, Quebec, Nova Scotia and New Brunswick formed the original federation.|安大略、魁北克、新斯科舍和新不伦瑞克组成最初的联邦。
Chile|Why is the Atacama Desert especially valuable for optical astronomy?|阿塔卡马沙漠为什么特别适合光学天文学研究？|Its dry air, high altitude and clear skies|空气干燥、海拔高且晴夜众多|Its permanent cloud cover|永久云层覆盖|Its proximity to the North Pole|靠近北极|0|Exceptionally low humidity and little light pollution provide outstanding observing conditions.|极低湿度与很少的光污染提供了优越观测条件。
China|What was the main purpose of China's imperial civil-service examinations?|中国古代科举制度的主要目的是什么？|Selecting officials through tested learning|通过考试选拔官员|Recruiting only hereditary soldiers|只招募世袭士兵|Choosing Buddhist reincarnations|寻找佛教转世者|0|The examinations linked mastery of classical texts with entry into government service.|科举把对经典的掌握与进入政府任职联系起来。
Egypt|Which city became a major centre of Hellenistic scholarship under the Ptolemies?|托勒密王朝时期，哪座城市成为希腊化学术的重要中心？|Memphis|孟斐斯|Alexandria|亚历山大|Thebes|底比斯|1|Alexandria's library and Mouseion drew scholars from across the Mediterranean world.|亚历山大图书馆与缪斯宫吸引了地中海世界各地学者。
Ethiopia|Which ancient liturgical language remains central to the Ethiopian Orthodox tradition?|哪种古代礼仪语言至今仍是埃塞俄比亚正教传统的重要组成部分？|Ge'ez|吉兹语|Latin|拉丁语|Sanskrit|梵语|0|Ge'ez is no longer an everyday spoken language but remains important in worship and manuscripts.|吉兹语已不再是日常口语，却仍用于礼拜与古代文献。
France|Why did the storming of the Bastille on 14 July 1789 become a revolutionary symbol?|1789年7月14日攻占巴士底狱为什么成为革命象征？|It challenged royal authority in Paris|它在巴黎公开挑战王权|It crowned Napoleon emperor|它为拿破仑加冕|It ended the First World War|它结束第一次世界大战|0|The fortress-prison represented royal power, and its fall energised the French Revolution.|这座堡垒监狱象征王权，它的陷落推动了法国大革命。
Germany|What did the Berlin Wall physically divide from 1961 until 1989?|柏林墙从1961年至1989年在现实空间中分隔了什么？|Berlin's eastern and western sectors|柏林的东部与西部区域|Germany and France|德国与法国|Bavaria and Austria|巴伐利亚与奥地利|0|The barrier enclosed West Berlin and became the clearest symbol of Cold War division.|这道屏障围住西柏林，成为冷战分裂最醒目的象征。
Greece|Which political practice of classical Athens gave eligible citizens a direct vote in public decisions?|古典雅典的哪种政治实践，让符合资格的公民直接参与公共决策？|Representative monarchy|代议君主制|Direct democracy|直接民主|Hereditary priesthood|世袭祭司制度|1|The assembly allowed male citizens to debate and vote, though many residents were excluded.|公民大会允许男性公民辩论和投票，但许多居民被排除在外。
India|Which war is traditionally linked to Emperor Ashoka's turn toward Buddhist ethics?|传统上，哪场战争被认为促使阿育王转向佛教伦理？|The Kalinga War|羯陵伽战争|The Crimean War|克里米亚战争|The Peloponnesian War|伯罗奔尼撒战争|0|Accounts describe the suffering after Kalinga as a catalyst for Ashoka's policy of dhamma.|记载把羯陵伽战争后的苦难视为阿育王推行“法”的重要转折。
Indonesia|Which religion shaped Borobudur's narrative reliefs and tiered pilgrimage path?|哪种宗教塑造了婆罗浮屠的叙事浮雕与层层上升的朝圣路线？|Buddhism|佛教|Shinto|神道教|Zoroastrianism|琐罗亚斯德教|0|Borobudur is a ninth-century Buddhist monument designed as a symbolic ascent.|婆罗浮屠是九世纪佛教建筑，其空间被设计成象征性的上升过程。
Iran|Which ruler founded the Achaemenid Empire and made Pasargadae an early royal centre?|哪位统治者建立阿契美尼德帝国，并把帕萨尔加德建成早期王室中心？|Cyrus the Great|居鲁士大帝|Justinian I|查士丁尼一世|Akbar|阿克巴|0|Cyrus united Persian and Median power in the sixth century BCE.|公元前六世纪，居鲁士统一波斯与米底力量。
Italy|How did Roman roads strengthen rule across a large empire?|罗马道路如何加强对庞大帝国的统治？|They moved armies, officials and messages efficiently|它们高效运送军队、官员与信息|They prevented all sea travel|它们禁止所有海上旅行|They were used only for religious parades|它们只用于宗教游行|0|Durable road networks connected provincial cities with military and administrative centres.|耐用道路网把各省城市与军事、行政中心连接起来。
Japan|What political transformation began with the Meiji Restoration of 1868?|1868年明治维新开启了什么政治转型？|Power was recentred under the emperor and rapid modernisation began|权力重新集中于天皇，并启动快速现代化|Japan became a European colony|日本成为欧洲殖民地|The shogunate expanded its rule for another century|幕府又延续统治一百年|0|The Tokugawa shogunate ended as the new government pursued institutional and industrial reform.|德川幕府结束，新政府推进制度与工业改革。
Kazakhstan|Why is the “Golden Man” from the Issyk burial mound archaeologically important?|伊塞克墓葬出土的“金人”为什么具有重要考古价值？|It reveals elite Saka craftsmanship and symbolism|它展现塞人精英的工艺与象征体系|It is a medieval European suit of armour|它是中世纪欧洲盔甲|It was worn by a twentieth-century astronaut|它属于二十世纪宇航员|0|Thousands of gold ornaments covered the ceremonial clothing of a young Saka elite.|数千件金饰覆盖一位年轻塞人贵族的礼服。
Mexico|What happened to the Mexica capital Tenochtitlan in 1521?|1521年，墨西加首都特诺奇蒂特兰发生了什么？|It fell to Spanish and allied Indigenous forces|它被西班牙人与原住民盟军攻陷|It was moved intact to Yucatán|它完整迁往尤卡坦|It defeated every invading army and remained independent|它击败所有入侵者并保持独立|0|Cortés relied heavily on Indigenous allies during the siege that ended Mexica rule.|科尔特斯在结束墨西加统治的围城战中高度依赖原住民盟军。
Mongolia|What does the term “Pax Mongolica” describe?|“蒙古和平”这一术语描述什么？|A period when Mongol rule facilitated Eurasian travel and exchange|蒙古统治促进欧亚旅行与交流的时期|A ban on Silk Road trade|对丝绸之路贸易的禁令|A treaty between Rome and Carthage|罗马与迦太基的条约|0|Imperial protection and relay networks helped merchants and envoys cross long distances.|帝国保护与驿站网络帮助商人与使者进行长距离旅行。
Morocco|In which city did the Qarawiyyin institution grow into a celebrated centre of learning?|卡鲁因学府在哪座城市发展为著名学术中心？|Fez|非斯|Casablanca|卡萨布兰卡|Agadir|阿加迪尔|0|Founded in the ninth century, Qarawiyyin became an influential mosque and teaching institution.|卡鲁因始建于九世纪，后来成为有影响力的清真寺与教学机构。
Netherlands|What was the Dutch East India Company, founded in 1602, empowered to do?|1602年成立的荷兰东印度公司被授予哪些权力？|Trade, make treaties and wage war overseas|在海外贸易、缔约与发动战争|Govern only farms inside Amsterdam|只管理阿姆斯特丹市内农场|Print books but conduct no trade|只印书而不从事贸易|0|The VOC combined commercial activity with state-like powers across Asian trade networks.|荷兰东印度公司在亚洲贸易网络中兼具商业活动与类似国家的权力。
Norway|What changed when Norway's union with Sweden ended in 1905?|1905年挪威与瑞典的联合结束后，发生了什么变化？|Norway became fully independent|挪威获得完全独立|Norway joined Denmark|挪威加入丹麦|Sweden annexed Oslo|瑞典吞并奥斯陆|0|A negotiated separation established independent Norwegian government and monarchy.|通过协商分离，挪威建立独立政府与君主制。
Pakistan|What political demand did the Lahore Resolution of 1940 advance?|1940年的《拉合尔决议》提出了什么政治诉求？|Autonomous Muslim-majority states in British India|在英属印度建立穆斯林占多数的自治国家|Restoration of the Mughal emperor|恢复莫卧儿皇帝|Union with the Soviet Union|加入苏联|0|The resolution became a key milestone in the movement that led to Pakistan's creation.|该决议成为最终促成巴基斯坦建立运动的重要里程碑。
Peru|What was an Inca quipu used to store without conventional writing?|印加“奇普”在没有常规文字的情况下用来保存什么？|Numerical and administrative information in knotted cords|以结绳保存数字与行政信息|Painted maps on ceramic plates|陶盘上的彩绘地图|Spoken messages inside shells|贝壳中的语音信息|0|Cord colour, position and knot patterns encoded quantities and categories.|绳索颜色、位置和结法共同编码数量与类别。
Poland|What was Solidarity when it emerged in Gdańsk in 1980?|1980年团结工会在格但斯克兴起时，它是什么组织？|An independent trade-union movement|独立工会运动|A royal dynasty|王室家族|A medieval military order|中世纪军事修会|0|Solidarity mobilised workers and became central to Poland's transition away from communist rule.|团结工会动员工人，并成为波兰摆脱共产主义统治转型的核心力量。
Portugal|What ended Portugal's Estado Novo dictatorship in April 1974?|1974年4月，什么事件结束了葡萄牙“新国家”独裁统治？|The Carnation Revolution|康乃馨革命|The Boxer Rebellion|义和团运动|The Boston Tea Party|波士顿倾茶事件|0|A military movement overthrew the regime with little bloodshed and opened democratic transition.|军人运动以较少流血推翻政权，开启民主转型。
Russia|What was the strategic purpose of the Trans-Siberian Railway?|西伯利亚铁路的战略目的是什么？|Linking European Russia with Siberia and the Pacific|连接欧洲俄罗斯、西伯利亚与太平洋|Connecting Moscow only to Crimea|只连接莫斯科与克里米亚|Bypassing every Russian city|绕开所有俄罗斯城市|0|The railway joined distant regions, accelerated settlement and moved goods and troops across Eurasia.|铁路连接遥远地区，推动移民，并横跨欧亚运输货物与军队。
Saudi Arabia|Why was Hegra important before the rise of Islam?|伊斯兰教兴起以前，黑格拉为什么重要？|It was a Nabataean caravan and burial centre|它是纳巴泰商队与墓葬中心|It was a Viking naval base|它是维京海军基地|It was the capital of the Aztec Empire|它是阿兹特克帝国首都|0|Hegra linked Arabian trade routes and preserves monumental rock-cut Nabataean tombs.|黑格拉连接阿拉伯贸易路线，并保存宏大的纳巴泰岩凿墓葬。
Singapore|Why did Singapore become a major trading port at the Strait of Malacca's eastern approach?|新加坡为什么在马六甲海峡东侧入口发展为重要贸易港？|Its position linked Indian Ocean and South China Sea routes|它的位置连接印度洋与南海航路|It controlled the Suez Canal|它控制苏伊士运河|It lay on the Rhine River|它位于莱茵河畔|0|Ships moving between major Asian seas naturally converged near Singapore's sheltered harbour.|往来亚洲主要海域的船只自然汇聚到新加坡的避风港附近。
South Africa|Why is Robben Island central to the history of apartheid resistance?|罗本岛为什么是南非反种族隔离历史的重要地点？|Political prisoners including Nelson Mandela were held there|包括曼德拉在内的政治犯曾被关押于此|It hosted the first diamond mine|它拥有第一座钻石矿|It was the apartheid parliament|它是种族隔离议会所在地|0|Mandela spent eighteen of his twenty-seven prison years on the island.|曼德拉二十七年牢狱生涯中有十八年在岛上度过。
South Korea|What did the 1953 armistice do in the Korean War?|1953年的停战协定对朝鲜战争产生了什么作用？|It stopped large-scale fighting without a final peace treaty|它停止大规模战斗，但没有签署最终和平条约|It reunified the peninsula|它统一了半岛|It transferred Korea to Japan|它把朝鲜半岛移交日本|0|The armistice created a military demarcation zone, but no peace treaty ended the war formally.|停战协定划定军事分界区，但没有和平条约正式结束战争。
Spain|Which dynasty built the Alhambra's most celebrated palaces in Granada?|哪个王朝在格拉纳达修建了阿尔罕布拉宫最著名的宫殿部分？|The Nasrid dynasty|纳斯里王朝|The Tudor dynasty|都铎王朝|The Tokugawa shogunate|德川幕府|0|Nasrid rulers created the intricate courts and halls during the last Muslim kingdom in Iberia.|纳斯里统治者在伊比利亚最后一个穆斯林王国时期建造了精美庭院与殿堂。
Switzerland|Which settlement confirmed Switzerland's permanent neutrality in 1815?|1815年的哪项安排确认了瑞士永久中立？|The Congress of Vienna settlement|维也纳会议安排|The Treaty of Tordesillas|《托德西利亚斯条约》|The Potsdam Agreement|波茨坦协定|0|European powers recognised Swiss neutrality as part of the post-Napoleonic order.|欧洲列强在拿破仑战争后的秩序中承认瑞士中立。
Thailand|Which city served as the capital of a powerful Siamese kingdom until its destruction in 1767?|哪座城市曾是强大暹罗王国的首都，直到1767年被毁？|Ayutthaya|大城|Phuket|普吉|Chiang Rai|清莱|0|Ayutthaya was a cosmopolitan trading capital connected to merchants from across Asia and Europe.|大城是国际化贸易都城，与亚洲和欧洲多地商人保持联系。
Turkey|Who commissioned Hagia Sophia in Constantinople in the sixth century?|六世纪，谁下令在君士坦丁堡修建圣索菲亚大教堂？|Emperor Justinian I|查士丁尼一世|Sultan Süleyman I|苏莱曼一世|Alexander the Great|亚历山大大帝|0|Justinian's architects completed the monumental church in 537.|查士丁尼的建筑师于537年完成这座宏大教堂。
United Arab Emirates|Before oil exports transformed the economy, which industry supported many Gulf coast communities?|石油出口改变经济以前，哪项产业支撑着海湾沿岸许多社区？|Pearl diving and maritime trade|采珠与海上贸易|Alpine forestry|阿尔卑斯林业|Tea plantations|茶园种植|0|Divers harvested natural pearls traded through Gulf ports to distant markets.|潜水者采集天然珍珠，经海湾港口销往远方市场。
United Kingdom|For which theatre company and playhouse did Shakespeare write and perform in London?|莎士比亚在伦敦主要为哪个剧团与剧场创作、演出？|The Lord Chamberlain's Men and the Globe|宫务大臣剧团与环球剧场|The Comédie-Française and the Louvre|法兰西喜剧院与卢浮宫|The Bolshoi and the Kremlin|莫斯科大剧院与克里姆林宫|0|His company became the King's Men, and many plays were staged at the Globe.|他的剧团后来成为国王剧团，许多作品在环球剧场上演。
United States of America|Where was the United States Constitution drafted and signed in 1787?|1787年，美国宪法在哪里起草并签署？|Philadelphia|费城|Boston|波士顿|New Orleans|新奥尔良|0|Delegates met in Philadelphia to replace the Articles of Confederation with a new federal framework.|代表们在费城集会，以新的联邦框架取代《邦联条例》。
Vietnam|Who wrote The Tale of Kiều, a verse narrative central to Vietnamese literature?|谁创作了越南文学名著、长篇叙事诗《金云翘传》？|Nguyễn Du|阮攸|Lu Xun|鲁迅|José Rizal|何塞·黎刹|0|Nguyễn Du adapted an earlier Chinese story into a Vietnamese masterpiece written in lục bát verse.|阮攸把早期中国故事改写为采用六八体诗创作的越南文学杰作。
`.trim();

export const COUNTRY_EXTRA_QUESTIONS =
  parseCountryExtraRows(RAW_COUNTRY_EXTRA_QUESTIONS);

function parseCountryExtraRows(
  raw: string,
): Readonly<Record<string, CountryExtraQuestionSeed>> {
  const entries = raw.split("\n").map((line) => {
    const fields = line.split("|");
    if (fields.length !== 12) {
      throw new Error(`Country extra row must have 12 fields, got ${fields.length}.`);
    }
    const [country, promptEn, promptZh, aEn, aZh, bEn, bZh, cEn, cZh, rawAnswer, explainEn, explainZh] = fields;
    const answerIndex = Number(rawAnswer);
    if (answerIndex !== 0 && answerIndex !== 1 && answerIndex !== 2) {
      throw new Error(`Country extra question "${country}" has an invalid answer.`);
    }
    return [country, {
      prompt: [promptEn, promptZh],
      options: [[aEn, aZh], [bEn, bZh], [cEn, cZh]],
      answerIndex,
      explain: [explainEn, explainZh],
    } satisfies CountryExtraQuestionSeed] as const;
  });
  if (new Set(entries.map(([country]) => country)).size !== entries.length) {
    throw new Error("Country extra question IDs must be unique.");
  }
  return Object.fromEntries(entries);
}
