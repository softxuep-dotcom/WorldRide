# 世界名胜 3D 模型候选清单

> 调研日期：2026-07-24  
> 来源范围：Kenney、Poly Pizza  
> 当前状态：只完成候选筛选，尚未下载或接入运行时。

## 结论

- **Poly Pizza 用于寻找具体名胜。** 当前能找到斗兽场、大本钟、埃菲尔铁塔、自由女神、金门大桥等直接对应模型。
- **Kenney 用于环境套件。** 它适合自然、城市、道路、城堡和通用模块，不适合用普通教堂或普通塔冒充具体世界名胜。
- **Poly Pizza 不是全站 CC0。** 每个模型必须单独记录许可证；CC-BY 模型接入时必须保留作者署名。
- 没有高相似度候选的名胜继续使用当前专属低模，或以后定制，不为了“用了外部模型”而降低辨识度。

## A 级：值得下载试装

| 游戏名胜 | 候选模型 | 格式 | 许可证 | 判断 |
|---|---|---|---|---|
| 罗马斗兽场 | [Colosseum · CreativeTrio](https://poly.pizza/m/83ftBPyiSf) | FBX / glTF | CC0 | 第一优先；直接对应，轮廓清楚，可替换当前开口圆柱模型 |
| 大本钟 | [BigBen · Daqian Dong](https://poly.pizza/m/8PaQZ_nLFIQ) | OBJ / glTF | CC-BY | 直接对应；需要检查钟面细节、轴向和材质数量 |
| 埃菲尔铁塔 | [SM - Eiffel Tower · Scott Marshall](https://poly.pizza/m/aIpJchqtRTg) | OBJ / glTF | CC-BY | 直接对应；镂空结构比当前几何拼装更有价值 |
| 自由女神像 | [Lady Liberty · Anna M](https://poly.pizza/m/ef9Yd09Doxh) | OBJ / glTF | CC-BY | 直接对应；需要检查远景剪影和火炬比例 |
| 金门大桥 | [Golden Gate bridge · Steren Giannini](https://poly.pizza/m/a648BwpXx-A) | OBJ / glTF | CC-BY | 直接对应；需要拆分或裁掉过长桥面，适配地图底座 |
| 雅典卫城 | [Parthenon · Nick Kramer](https://poly.pizza/m/bEWe7XrrOjG) | OBJ / glTF | CC-BY | 可作为卫城主体；需要保留当前山丘与遗址环境 |

## B 级：可作为改造素材

| 游戏名胜/场景 | 候选模型 | 格式 | 许可证 | 使用边界 |
|---|---|---|---|---|
| 吉萨金字塔群 | [Pyramid · Poly by Google](https://poly.pizza/m/c-tEGK9e49p) | OBJ / glTF | CC-BY | 只能作为单体金字塔，需组合三座并保留狮身人面像与沙漠环境 |
| 奇琴伊察 | [Mayan Temple · Steve Atkins](https://poly.pizza/m/cf3QwX0JqGN) | OBJ / glTF | CC-BY | 轮廓接近但不是精确复原，需要确认阶梯与顶部神庙比例 |
| 吴哥窟或寺庙模块 | [Temple · Quaternius](https://poly.pizza/m/CE2Mn7lh6A) | FBX / glTF | CC0 | 只可作为塔体或附属模块，不能直接把通用寺庙当成吴哥窟 |
| 圣家堂辅助试装 | [Cathedral · Bruno Oliveira](https://poly.pizza/m/fEJKTKNRAsN) | OBJ / glTF | CC-BY | 不是圣家堂，只能测试外部模型加载与材质管线，不作为最终资产 |
| 通用历史建筑模块 | [Architecture Pack 001 · CreativeTrio](https://poly.pizza/bundle/Architecture-Pack-001-ntWKh7113q) | FBX / glTF | CC0 | 含斗兽场、教堂、拱门、桥、堡垒；适合拆件和环境，不批量撒在欧洲 |

## Kenney：用于环境，不作为具体名胜

| 套件 | 内容 | 许可证 | 建议用途 |
|---|---|---|---|
| [Nature Kit](https://kenney.nl/assets/nature-kit) | 330 个树木、岩石、植被件 | CC0 | 稀疏地区的森林带、岩石群、自然环境 |
| [City Kit (Commercial)](https://www.kenney.nl/assets/city-kit-commercial) | 50 个商业与高层建筑件 | CC0 | 迪拜等非欧洲城市的手工背景组，不做随机撒点 |
| [Castle Kit](https://kenney.nl/assets/castle-kit) | 75 个城堡模块 | CC0 | 长城关隘、欧洲城堡环境的改造素材；不替代真实地标 |
| [Tower Defense Kit](https://www.kenney.nl/assets/tower-defense-kit) | 160 个城墙、塔楼与防御模块 | CC0 | 长城、城门、堡垒环境的模块化拼装 |

## 暂时不采用外部通用模型的名胜

下列名胜暂未找到足够准确、授权清楚且风格合适的免费候选，继续保留现有专属低模：

- 圣家堂
- 比萨斜塔
- 巨石阵
- 哈利法塔
- 悉尼歌剧院
- 泰姬陵
- 里约热内卢基督像
- 马丘比丘
- 佩特拉
- 吴哥窟整体
- 珠穆朗玛峰、大峡谷、尼亚加拉瀑布、维多利亚瀑布等自然景观
- 奥克角、广岛和平纪念碑等需要克制历史表达的场景

## 接入规则

1. 先下载 **Colosseum、BigBen、Eiffel Tower** 三个模型做风格试装，不批量接入。
2. 原始下载文件放入 `assets/source/`，运行时只加载清理后的 GLB。
3. 统一模型朝向、底部枢轴和世界比例，清除无用灯光、相机与空节点。
4. 使用 glTF Transform 做 `prune`、`dedup` 和 Meshopt 压缩。
5. 每个最终模型尽量复用少量材质；贴图尺寸按手机俯视画面实际需求控制。
6. 接入任何 CC-BY 模型时创建并更新 `ASSET_LICENSES.md`，记录模型名、作者、来源链接、许可证和本地文件。
7. 新模型必须与现有程序几何版进行同机截图比较；辨识度、性能或风格不更好就不替换。

