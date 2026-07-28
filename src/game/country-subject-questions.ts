type BilingualCopy = readonly [en: string, zhCn: string];

export interface CountrySubjectQuestionSeed {
  prompt: BilingualCopy;
  options: readonly [BilingualCopy, BilingualCopy, BilingualCopy];
  answerIndex: 0 | 1 | 2;
  explain: BilingualCopy;
}

/**
 * A deliberately broad subject mix: literature, political history, war,
 * archaeology, language, science and social change.
 */
const RAW_COUNTRY_SUBJECT_QUESTIONS = `
Algeria|Which year marked both Algerian independence and the end of more than a century of French colonial rule?|哪一年既标志着阿尔及利亚独立，也结束了一个多世纪的法国殖民统治？|1830|1830年|1962|1962年|1991|1991年|1|The 1962 Evian settlement and referendum ended the Algerian War and established an independent Algeria.|1962年的《埃维昂协议》及公投结束阿尔及利亚战争，阿尔及利亚由此独立。
Argentina|Which Argentine writer made labyrinths, mirrors and imaginary books recurring ideas in Ficciones?|哪位阿根廷作家在《虚构集》中反复书写迷宫、镜子与不存在的书？|Pablo Neruda|巴勃罗·聂鲁达|Jorge Luis Borges|豪尔赫·路易斯·博尔赫斯|Gabriel García Márquez|加西亚·马尔克斯|1|Jorge Luis Borges used philosophical puzzles and invented texts to reshape the modern short story.|博尔赫斯以哲学谜题和虚构文献重塑了现代短篇小说。
Australia|What political change occurred when six self-governing colonies united on 1 January 1901?|1901年1月1日，六个自治殖民地联合后发生了什么政治变化？|Australia became a federation|澳大利亚组成联邦|The capital moved to Sydney|首都迁往悉尼|New Zealand joined Australia|新西兰加入澳大利亚|0|The colonies federated as the Commonwealth of Australia; Melbourne served temporarily before Canberra opened as the capital.|六个殖民地组成澳大利亚联邦；堪培拉建成前，墨尔本曾暂代首都。
Brazil|Why was Brazil's national capital transferred from Rio de Janeiro to Brasília in 1960?|为什么巴西在1960年把首都从里约热内卢迁往巴西利亚？|To move the government closer to inland development|为了推动内陆发展并把政府中心向内陆转移|To escape an active volcano|为了躲避活火山|To place the capital on an international border|为了让首都位于国境线上|0|The purpose-built capital was part of a strategy to develop and integrate Brazil's vast interior.|这座规划建设的新首都是开发并整合巴西广阔内陆战略的一部分。
Canada|Who wrote the First World War poem “In Flanders Fields” after serving as a Canadian military doctor?|哪位加拿大军医在第一次世界大战期间写下诗歌《在佛兰德斯战场》？|John McCrae|约翰·麦克雷|Walt Whitman|沃尔特·惠特曼|W. B. Yeats|威廉·巴特勒·叶芝|0|John McCrae wrote the poem in 1915; its poppies became an enduring symbol of remembrance.|约翰·麦克雷于1915年写下这首诗，诗中的罂粟后来成为战争纪念的重要象征。
Chile|Who became the first Latin American author to receive the Nobel Prize in Literature?|谁是第一位获得诺贝尔文学奖的拉丁美洲作家？|Gabriela Mistral|加夫列拉·米斯特拉尔|Isabel Allende|伊莎贝尔·阿连德|Jorge Luis Borges|豪尔赫·路易斯·博尔赫斯|0|Chilean poet and educator Gabriela Mistral received the Nobel Prize in Literature in 1945.|智利诗人、教育家加夫列拉·米斯特拉尔于1945年获得诺贝尔文学奖。
China|In Journey to the West, which character protects the monk Xuanzang with a magic staff and extraordinary transformations?|《西游记》中，哪位角色手持神奇兵器、凭七十二般变化保护玄奘西行？|Zhuge Liang|诸葛亮|Sun Wukong|孙悟空|Jia Baoyu|贾宝玉|1|Sun Wukong, the Monkey King, is the rebellious and resourceful companion at the centre of the Ming novel.|孙悟空即美猴王，是这部明代小说中兼具反叛精神与机智力量的核心角色。
Egypt|Why was the Rosetta Stone crucial to the decipherment of Egyptian hieroglyphs?|罗塞塔石碑为什么成为破译古埃及象形文字的关键？|It contained the same decree in three writing systems|它用三种文字系统记录同一份法令|It listed every pharaoh in chronological order|它按年代列出所有法老|It was the oldest surviving papyrus|它是现存最古老的纸草文书|0|Greek, Demotic and hieroglyphic versions of one text allowed scholars to compare known and unknown scripts.|同一文本分别以希腊文、世俗体和象形文字写成，使学者能够对照已知与未知文字。
Ethiopia|At the Battle of Adwa in 1896, Ethiopian forces preserved their country's independence by defeating which invading army?|1896年的阿杜瓦战役中，埃塞俄比亚军队击败了哪国入侵军，维护了国家独立？|Britain|英国|Italy|意大利|Portugal|葡萄牙|1|Emperor Menelik II's victory over Italy at Adwa became a powerful symbol of African resistance to colonial conquest.|孟尼利克二世在阿杜瓦击败意大利，这场胜利成为非洲抵抗殖民征服的重要象征。
France|Who wrote Les Misérables, setting personal redemption against the poverty and political unrest of nineteenth-century France?|谁创作了《悲惨世界》，把个人救赎置于十九世纪法国的贫困与政治动荡之中？|Victor Hugo|维克多·雨果|Émile Zola|埃米尔·左拉|Albert Camus|阿尔贝·加缪|0|Victor Hugo published Les Misérables in 1862, combining social criticism with an expansive historical novel.|维克多·雨果于1862年出版《悲惨世界》，把社会批判融入宏大的历史小说。
Germany|Which innovation associated with Johannes Gutenberg transformed the reproduction of books in fifteenth-century Europe?|约翰内斯·古腾堡推动的哪项技术革新改变了十五世纪欧洲书籍复制方式？|Movable-type printing with a press|使用活字与印刷机印刷|Photography on glass plates|玻璃底片摄影|The electric telegraph|电报|0|Gutenberg's system combined movable metal type, oil-based ink and the press to produce books at unprecedented scale.|古腾堡把金属活字、油性油墨与印刷机结合，使书籍得以以前所未有的规模生产。
Greece|To whom are the Iliad and the Odyssey traditionally attributed?|《伊利亚特》和《奥德赛》传统上被认为出自谁之手？|Sophocles|索福克勒斯|Homer|荷马|Herodotus|希罗多德|1|The two foundational Greek epics are traditionally attributed to Homer, although their oral formation was complex.|这两部奠基性的希腊史诗传统上归于荷马名下，尽管其口头形成过程十分复杂。
India|Which poet became the first Asian Nobel laureate after receiving the Literature prize in 1913?|哪位诗人在1913年获得诺贝尔文学奖，成为首位亚洲诺贝尔奖得主？|Rabindranath Tagore|拉宾德拉纳特·泰戈尔|R. K. Narayan|R·K·纳拉扬|Salman Rushdie|萨尔曼·鲁西迪|0|Rabindranath Tagore received the prize for the English version of Gitanjali and his wider body of poetry.|泰戈尔凭英文版《吉檀迦利》及其诗歌成就获得该奖。
Indonesia|Why did leaders from twenty-nine Asian and African countries gather in Bandung in 1955?|1955年，二十九个亚非国家的领导人为什么在万隆集会？|To discuss decolonisation and cooperation outside Cold War blocs|讨论去殖民化及冷战阵营之外的合作|To divide Indonesia into colonies|瓜分印度尼西亚殖民地|To establish the European Economic Community|建立欧洲经济共同体|0|The Bandung Conference promoted anti-colonial solidarity and helped lay foundations for the Non-Aligned Movement.|万隆会议推动反殖民团结，并为后来不结盟运动奠定基础。
Iran|Who composed the Shahnameh, the vast epic that preserves stories of Iran's legendary and pre-Islamic past?|谁创作了宏大史诗《列王纪》，保存伊朗传说与伊斯兰时代以前的历史记忆？|Rumi|鲁米|Ferdowsi|菲尔多西|Omar Khayyam|奥马尔·海亚姆|1|Ferdowsi completed the Shahnameh around the early eleventh century, shaping Persian literary and cultural identity.|菲尔多西约在十一世纪初完成《列王纪》，深刻影响波斯文学与文化认同。
Italy|Who journeys through Hell, Purgatory and Paradise in the Divine Comedy?|《神曲》中，谁依次穿越地狱、炼狱与天堂？|Dante as the poem's pilgrim|作为诗中旅人的但丁|Marco Polo|马可·波罗|Aeneas alone|独自旅行的埃涅阿斯|0|Dante makes a version of himself the traveller, guided first by Virgil and later by Beatrice.|但丁让诗中的“自己”成为旅人，先由维吉尔引导，后来由贝雅特丽齐引导。
Japan|Which court writer is credited with The Tale of Genji, often described as one of the world's earliest novels?|哪位宫廷女作家创作了《源氏物语》，这部作品常被称为世界最早的长篇小说之一？|Sei Shōnagon|清少纳言|Murasaki Shikibu|紫式部|Yosano Akiko|与谢野晶子|1|Murasaki Shikibu wrote the work in the Heian court around the early eleventh century.|紫式部约在十一世纪初的平安时代宫廷中创作了这部作品。
Kazakhstan|Which pioneering spaceflight launched from the Baikonur Cosmodrome in 1961?|1961年，哪次航天壮举从拜科努尔航天发射场启程？|The first human journey into space|人类首次进入太空|The first Moon landing|人类首次登月|The first reusable shuttle flight|首架航天飞机飞行|0|Yuri Gagarin launched from Baikonur aboard Vostok 1 and became the first human to orbit Earth.|尤里·加加林乘“东方一号”从拜科努尔升空，成为首位绕地球飞行的人类。
Mexico|Which event began in 1910 and overturned the long rule of Porfirio Díaz?|哪场运动始于1910年，并最终推翻波菲里奥·迪亚斯的长期统治？|The Mexican Revolution|墨西哥革命|The War of the Pacific|太平洋战争|The Cuban Revolution|古巴革命|0|The Mexican Revolution became a prolonged struggle over political power, land and social reform.|墨西哥革命发展为围绕政治权力、土地与社会改革的长期斗争。
Mongolia|What happened at a great assembly in 1206 after Temüjin united many steppe groups?|铁木真统一众多草原部族后，1206年的大会上发生了什么？|He was proclaimed Chinggis Khan|他被尊为成吉思汗|The capital moved to Beijing|都城迁往北京|The Silk Road was permanently closed|丝绸之路被永久关闭|0|The title marked the foundation of a Mongol polity that rapidly expanded across Eurasia.|这一称号标志着蒙古政权的建立，此后它迅速扩展到欧亚大陆广大地区。
Morocco|Which fourteenth-century traveller from Tangier described journeys across Africa, Asia and the Indian Ocean world?|哪位十四世纪的丹吉尔旅行家记录了横跨非洲、亚洲与印度洋世界的旅程？|Ibn Battuta|伊本·白图泰|Zheng He|郑和|Marco Polo|马可·波罗|0|Ibn Battuta's journeys were recorded in the Rihla, one of the great travel narratives of the medieval world.|伊本·白图泰的旅程被整理为《游记》，成为中世纪世界重要旅行叙事。
Netherlands|In which city did Anne Frank write much of her diary while hiding from Nazi persecution?|安妮·弗兰克为躲避纳粹迫害而藏身期间，主要在哪座城市写下日记？|Rotterdam|鹿特丹|Amsterdam|阿姆斯特丹|The Hague|海牙|1|Anne Frank and seven others hid in an Amsterdam canal-house annex until their arrest in 1944.|安妮·弗兰克与另外七人藏在阿姆斯特丹一座运河屋的后楼，直到1944年被捕。
Norway|Which playwright wrote A Doll's House, whose ending challenged nineteenth-century expectations of marriage and gender?|哪位剧作家创作了《玩偶之家》，以结局挑战十九世纪关于婚姻与性别的社会期待？|August Strindberg|奥古斯特·斯特林堡|Henrik Ibsen|亨利克·易卜生|Anton Chekhov|安东·契诃夫|1|Norwegian playwright Henrik Ibsen premiered the play in 1879 and transformed modern realist drama.|挪威剧作家易卜生于1879年推出该剧，深刻改变了现代现实主义戏剧。
Pakistan|Which Bronze Age city in present-day Pakistan reveals planned streets, drainage and baked-brick construction?|位于今巴基斯坦的哪座青铜时代城市，展现了规划街道、排水系统与烧制砖建筑？|Mohenjo-daro|摩亨佐-达罗|Persepolis|波斯波利斯|Pompeii|庞贝|0|Mohenjo-daro was a major Indus civilisation city with sophisticated urban infrastructure.|摩亨佐-达罗是印度河文明的重要城市，拥有成熟的城市基础设施。
Peru|Which language served the Inca state and is still spoken by millions across the Andes?|哪种语言曾服务于印加国家，如今仍有数百万人在安第斯地区使用？|Guaraní|瓜拉尼语|Quechua|克丘亚语|Nahuatl|纳瓦特尔语|1|Quechua spread through the Inca realm and survives today in several regional varieties.|克丘亚语随印加国家扩展，今天仍以多个地方变体延续。
Poland|What happened to the Polish-Lithuanian Commonwealth after the third partition in 1795?|1795年第三次瓜分后，波兰立陶宛联邦发生了什么？|It disappeared as an independent state from Europe's map|它作为独立国家从欧洲地图上消失|It annexed all three neighbouring empires|它吞并了周边三个帝国|It became a Mediterranean republic|它成为地中海共和国|0|Russia, Prussia and Austria divided the remaining territory; Polish statehood was restored after the First World War.|俄罗斯、普鲁士和奥地利瓜分其余领土；第一次世界大战后，波兰国家地位才得以恢复。
Portugal|Who wrote The Lusiads, turning Vasco da Gama's voyage into Portugal's national epic?|谁创作了《卢济塔尼亚人之歌》，把达·伽马航行写入葡萄牙民族史诗？|Fernando Pessoa|费尔南多·佩索阿|Luís de Camões|路易斯·德·卡蒙斯|José Saramago|若泽·萨拉马戈|1|Camões combined classical epic form with Portuguese maritime expansion in the poem published in 1572.|卡蒙斯在1572年出版的诗篇中，把古典史诗形式与葡萄牙海上扩张结合起来。
Russia|Which novelist set War and Peace against Napoleon's invasion of Russia?|哪位小说家以拿破仑入侵俄国为历史背景创作《战争与和平》？|Fyodor Dostoevsky|费奥多尔·陀思妥耶夫斯基|Leo Tolstoy|列夫·托尔斯泰|Anton Chekhov|安东·契诃夫|1|Leo Tolstoy interwove family lives, military campaigns and historical argument in the vast novel.|托尔斯泰在这部长篇小说中交织家族生活、军事行动与历史思考。
Saudi Arabia|Who led the campaigns and alliances that unified the modern Kingdom of Saudi Arabia in 1932?|谁通过长期征战与联盟，在1932年统一并建立现代沙特阿拉伯王国？|King Abdulaziz Ibn Saud|阿卜杜勒阿齐兹·伊本·沙特国王|Salah al-Din|萨拉丁|Mustafa Kemal Atatürk|穆斯塔法·凯末尔·阿塔图尔克|0|Abdulaziz consolidated territories across central and western Arabia and proclaimed the kingdom in 1932.|阿卜杜勒阿齐兹整合阿拉伯半岛中部和西部领土，并于1932年宣布建立王国。
Singapore|What changed politically when Singapore separated from Malaysia on 9 August 1965?|1965年8月9日新加坡脱离马来西亚后，政治地位发生了什么变化？|It became an independent sovereign state|它成为独立主权国家|It joined Indonesia|它加入印度尼西亚|It returned to British colonial rule|它恢复英国殖民统治|0|Singapore's separation created a fully independent republic facing major economic and security challenges.|新加坡由此成为完全独立的共和国，同时面对严峻的经济与安全挑战。
South Africa|Why are the national elections of 1994 a turning point in South African history?|为什么1994年的全国选举是南非历史的重要转折点？|They were the first with citizens of all races voting nationally|这是首次由各族公民共同参加的全国选举|They restored apartheid law|它们恢复了种族隔离制度|They ended all provincial government|它们取消了所有省级政府|0|The election ended apartheid rule and brought Nelson Mandela and the African National Congress to government.|这次选举结束种族隔离统治，使纳尔逊·曼德拉与非洲人国民大会执政。
South Korea|Which ruler sponsored the creation of Hangul in the fifteenth century to make literacy more accessible?|十五世纪，哪位统治者主持创制韩文，以降低识字门槛？|King Sejong|世宗大王|Emperor Meiji|明治天皇|Kublai Khan|忽必烈|0|King Sejong's scholars designed a systematic alphabet whose letter shapes reflect speech sounds.|世宗大王主持的学者团队设计了系统化字母，其形态与发音方式相联系。
Spain|Who created Don Quixote and Sancho Panza, characters who repeatedly collide with the realities of early modern Spain?|谁塑造了堂吉诃德与桑丘·潘沙，让他们一次次与近代早期西班牙的现实碰撞？|Federico García Lorca|费德里科·加西亚·洛尔迦|Miguel de Cervantes|米格尔·德·塞万提斯|Lope de Vega|洛佩·德·维加|1|Cervantes published the novel in two parts in 1605 and 1615, transforming European prose fiction.|塞万提斯于1605年和1615年分两部出版该小说，深刻改变了欧洲散文小说。
Switzerland|Which humanitarian organisation emerged from initiatives begun in Geneva after Henry Dunant witnessed the Battle of Solferino?|亨利·杜南目睹索尔费里诺战役后在日内瓦推动的倡议，最终促成了哪个人道组织？|The International Committee of the Red Cross|红十字国际委员会|The League of Nations|国际联盟|Médecins Sans Frontières|无国界医生|0|The Red Cross movement began in Geneva in the 1860s to protect wounded soldiers and organise neutral relief.|红十字运动于十九世纪六十年代在日内瓦兴起，旨在保护伤兵并组织中立救援。
Thailand|Which statement distinguishes Thailand's modern history from that of most neighbouring Southeast Asian countries?|哪项事实使泰国近代史区别于多数东南亚邻国？|It avoided formal colonisation by a European empire|它没有被欧洲帝国正式殖民|It was governed from Madrid for three centuries|它被马德里统治了三个世纪|It became a Dutch settler colony|它成为荷兰移民殖民地|0|Siam's rulers used diplomacy and selective reform to preserve independence between British and French imperial territories.|暹罗统治者通过外交与选择性改革，在英法帝国领地之间维持了独立。
Turkey|What political transformation did Mustafa Kemal Atatürk lead in 1923 after the Ottoman Empire's collapse?|奥斯曼帝国瓦解后，穆斯塔法·凯末尔·阿塔图尔克在1923年领导了什么政治转型？|The founding of the Republic of Turkey|建立土耳其共和国|The restoration of the Byzantine Empire|恢复拜占庭帝国|The creation of the Austro-Hungarian Empire|建立奥匈帝国|0|The new republic replaced the Ottoman sultanate and launched extensive legal, educational and social reforms.|新共和国取代奥斯曼苏丹制度，并推行广泛的法律、教育与社会改革。
United Arab Emirates|What happened on 2 December 1971 when six Gulf emirates reached agreement?|1971年12月2日，六个海湾酋长国达成协议后发生了什么？|They formed the United Arab Emirates|它们组成阿拉伯联合酋长国|They became provinces of Saudi Arabia|它们成为沙特阿拉伯的省份|They dissolved every emirate|它们取消了所有酋长国|0|Six emirates formed the federation in 1971; Ras al-Khaimah joined early the following year.|六个酋长国于1971年组成联邦，哈伊马角在次年初加入。
United Kingdom|What did Magna Carta establish when King John sealed it at Runnymede in 1215?|1215年约翰王在兰尼米德签署《大宪章》时，它确立了什么重要原则？|The king was subject to law and negotiated limits|国王也受法律与协商限制约束|Parliamentary voting for every adult|所有成年人享有议会选举权|The union of England and Scotland|英格兰与苏格兰合并|0|Although written for a baronial crisis, Magna Carta became an enduring reference for limits on arbitrary rule.|《大宪章》虽源于贵族危机，却逐渐成为限制任意权力的重要历史参照。
United States of America|Which wartime measure declared enslaved people in areas rebelling against the United States to be free?|哪项战争时期的措施宣布美国叛乱地区的被奴役者获得自由？|The Emancipation Proclamation|《解放奴隶宣言》|The Monroe Doctrine|门罗主义|The Marshall Plan|马歇尔计划|0|Abraham Lincoln issued the proclamation during the Civil War; abolition nationwide later required the Thirteenth Amendment.|林肯在南北战争期间发布该宣言；在全国废除奴隶制后来还需要第十三修正案。
Vietnam|Which 1954 battle ended with a French garrison's defeat and accelerated the end of colonial rule in Indochina?|1954年哪场战役以法军据点失败告终，并加速法国在印度支那殖民统治的终结？|The Battle of Dien Bien Phu|奠边府战役|The Battle of Midway|中途岛海战|The Battle of the Somme|索姆河战役|0|The Viet Minh victory at Dien Bien Phu led into the Geneva negotiations and the end of French Indochina.|越盟在奠边府获胜，随后进入日内瓦谈判，法属印度支那由此走向终结。
`.trim();

export const COUNTRY_SUBJECT_QUESTIONS =
  parseCountrySubjectRows(RAW_COUNTRY_SUBJECT_QUESTIONS);

function parseCountrySubjectRows(
  raw: string,
): Readonly<Record<string, CountrySubjectQuestionSeed>> {
  const entries = raw.split("\n").map((line) => {
    const fields = line.split("|");
    if (fields.length !== 12) {
      throw new Error(
        `Country subject row must have 12 fields, got ${fields.length}.`,
      );
    }
    const [
      country,
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
      throw new Error(`Country subject question "${country}" has an invalid answer.`);
    }
    return [
      country,
      {
        prompt: [promptEn, promptZh],
        options: [
          [optionAEn, optionAZh],
          [optionBEn, optionBZh],
          [optionCEn, optionCZh],
        ],
        answerIndex,
        explain: [explainEn, explainZh],
      } satisfies CountrySubjectQuestionSeed,
    ] as const;
  });
  if (new Set(entries.map(([country]) => country)).size !== entries.length) {
    throw new Error("Country subject question IDs must be unique.");
  }
  return Object.fromEntries(entries);
}
