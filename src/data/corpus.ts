export interface CorpusItem {
  id: string;
  topicId: string;
  chinese: string;
  english: string;
}

export const corpusTopics = [
  { id: 'news', title: '新闻时事', description: '包含国际新闻、政治、经济等正式报道。', icon: '📰' },
  { id: 'tech', title: '科技前沿', description: '包含人工智能、互联网、前沿科技等内容。', icon: '🚀' },
  { id: 'daily', title: '日常交流', description: '包含生活、职场、社交等日常对话场景。', icon: '☕' }
];

export const corpus: CorpusItem[] = [
  {
    id: "1",
    topicId: "news",
    chinese: "他说道：\"这种攻击恰恰宣告了自身的无能……倘若良真的无足轻重，根本不值得费一字置评。如今他却被点名道姓地攻讦、讨伐——这恰恰证明他的话语刺中了要害。\"\n\n教皇良此前曾多次公开反对核武器扩散。去年六月，正值特朗普权衡是否打击伊朗核设施之际，教皇便强调：\"我们须通过相互尊重的对话与真诚的交流，去践行构建无核威胁世界的承诺，从而缔造基于正义、博爱及共同福祉的持久和平。\"",
    english: "“The attack is a declaration of impotence … If Leo were irrelevant, he wouldn’t merit a word. Instead, he is called out, named, fought: a sign that his word cuts deep,” he said.\n\nPope Leo has previously spoken out against the proliferation of nuclear weapons.\n\n“The commitment to building a safer world free from the nuclear threat must be pursued through respectful encounters and sincere dialogue to build a lasting peace, founded on justice, fraternity and the common good,” he said last June, as Trump was weighing striking Iran’s nuclear sites."
  },
  {
    id: "2",
    topicId: "news",
    chinese: "这位加州民主党人发表声明时，众议院道德调查刚刚公布，两党要求其辞职的压力也在持续累积。斯沃尔韦尔否认了指控，此前虽已暂停州长竞选活动，但要求他卸任国会议员的呼声并未因此减弱。与此同时，他还面临众议院可能启动驱逐表决的形势。\n\n斯沃尔韦尔在 X 平台发声明称：“指控才提出来没几天，就不走正当程序把人踢出国会，这说不过去。但反过来讲，让我的选民跟着我分心，耽误正事，同样不妥。所以，我决定辞去国会席位。”",
    english: "The announcement from the California Democrat comes as he faced a just-announced House ethics investigation and mounting pressure on both sides of the aisle to step down. Swalwell, who has denied the allegations, had already suspended his California gubernatorial bid — though that did not tamp down the calls that he leave his job. The congressman was also confronting the prospect of a vote on the House floor to expel him.\n\n“Expelling anyone in Congress without due process, within days of an allegation being made, is wrong,” Swalwell said in a statement posted to X. “But it’s also wrong for my constituents to have me distracted from my duties. Therefore, I plan to resign my seat in Congress.”"
  },
  {
    id: "3",
    topicId: "news",
    chinese: "伦敦电——随着美国海军封锁行动于周一生效，油价再度飙破每桶 100 美元，而一份脆弱的停火协议距到期仅剩九天，美伊两国周末在巴基斯坦举行的历史性和谈宣告破裂后，本周伊始即陷入对峙僵局。\n\n华盛顿、德黑兰以及全球各方焦虑的各国政府，眼下均无法确知一连串紧迫问题将如何收场：4 月 22 日停火期满后轰炸会否重启？美国海军在霍尔木兹海峡的军事部署具体将涉及哪些动作？伊朗核计划历经二十年国际外交围堵未果，又扛过了针对其领土发动的史上最猛烈、持续逾五周的军事打击，如今可还有任何谈拢协议的指望？",
    english: "LONDON — With a U.S. naval blockade taking effect on Monday, oil prices again surging past $100 a barrel and a fragile ceasefire set to expire in nine days, the United States and Iran began the week locked in a standoff after historic peace negotiations in Pakistan collapsed over the weekend.\n\nWashington, Tehran and anxious capitals around the world are not sure how a cascade of urgent questions will resolve: Will the bombing resume when the truce runs out on April 22? What will U.S. Navy operations in the Strait of Hormuz actually entail? And is there any conceivable path to an agreement on an Iranian nuclear program that has now survived not only two decades of international diplomacy seeking to curtail it, but also more than five weeks of the most intensive military assault ever launched against Iranian territory?"
  },
  {
    id: "4",
    topicId: "tech",
    chinese: "周五清晨，莫雷诺—伽马在 OpenAI 总部与安保人员对峙后，被旧金山警方当场逮捕。诉状所附监控画面显示，一名男子试图抡椅砸碎玻璃门闯入，随后手持一个据检方称为煤油容器的物品，与 OpenAI 安保人员发生对峙。\n\n诉状称，莫雷诺—伽马随身携有一份\"反 AI 文件\"，其中写明他计划杀害奥尔特曼，并提及人工智能将导致人类\"行将灭绝\"。据旧金山监所记录显示，这位全名为丹尼尔·亚历杭德罗·莫雷诺—伽马的男子，另面临谋杀未遂、纵火及持有破坏性装置等州级罪名指控。",
    english: "Moreno-Gama was arrested by San Francisco police at OpenAI’s headquarters Friday morning after he was confronted by security guards. Surveillance photos in the complaint show a person attempting to use a chair to smash through a glass door and then being confronted by an OpenAI security guard while holding what the government alleged was a container of kerosene.\n\nMoreno-Gama had an “anti-AI document” in his possession in which he wrote he was planning to kill Altman, the complaint alleges, and referred to humanity’s “impending extinction” by artificial intelligence. A person named Daniel Alejandro Moreno-Gama is also facing state charges including attempted murder, arson and possession of a destructive device, according to San Francisco jail records."
  },
  {
    id: "5",
    topicId: "tech",
    chinese: "在低资源地区的一线医生承担着主要的诊断责任，却往往缺乏专科医生的支持。AI 电子阴道镜辅助诊断系统能够在医生检查过程中提供实时支持。该技术由腾讯旗下觅影医疗 AI 团队研发，目前正开展临床试点。\n\n图像一经采集，结果在数秒内即可呈现，并标注出需要重点关注的区域，为医生提供第二视角的临床参考，帮助他们在核查、确诊和处置时更有把握。",
    english: "Frontline doctors in low-resource areas carry most of the diagnostic responsibility, often without specialist backup. Through Tencent’s AI-assisted colposcopy diagnostic system—developed by its Miying medical AI team and currently in clinical pilot programs—doctors receive real-time support during examinations.\n\nAs images are captured, results appear within seconds, highlighting what may need closer attention. It offers a second clinical perspective, helping doctors check, confirm, and act with greater confidence."
  },
  {
    id: "6",
    topicId: "tech",
    chinese: "广告主渴望提升创意产能，也希望用 AI 来进行提效。\n\n广告投放流程复杂，配置依赖人工。创意测试缓慢且成本高昂。受众、场景、创意与投放位置等多种变量相互作用，导致最终成效难以预估。随着广告活动规模扩大，团队只能投入越来越多时间去调整参数，用于优化策略的时间则相应减少。\n\n这些阻力会随着规模扩大而累积，对资源有限的小团队尤为不利。",
    english: "Advertisers want to boost creative output and increasingly turn to AI to improve efficiency.\n\nSetup is often manual and complicated. Creative testing is slow and costly. Performance varies widely across different audiences, contexts, creative and placements, making outcomes hard to predict. As campaigns grow, teams spend more time adjusting settings and less time improving strategy.\n\nThese frictions compound with scale, and place smaller teams at a disadvantage."
  },
  {
    id: "7",
    topicId: "tech",
    chinese: "AI 正在重塑广告系统的运行机制。\n\n数据正从结构化输入扩展为融合文本、图像与视频的多模态信号。投放流程在策划、优化与执行层面进一步自动化。\n\n创意也变得更为灵活：随着 AI 成本下降，广告能够根据受众和场景自动调整创意表达，在不增加制作投入的前提下提升广告创意和用户的匹配度。",
    english: "AI is reshaping how advertising systems work.\n\nData is evolving from structured inputs into multimodal signals that combine text, images, and video. Delivery processes are becoming more automated across planning, optimization, and execution.\n\nCreative is also becoming more flexible: as AI costs fall, ads can increasingly adjust creative to different people and contexts automatically, expanding relevance without increasing production effort."
  },
  {
    id: "8",
    topicId: "daily",
    chinese: "将野生动物当作同事来看，不仅是一种有趣的比喻，更能帮助我们理解生态系统的价值。\n\n滩涂上的白鹭，在潮坪上悠闲觅食，不留下一点碳足迹。红树林作为基础设施，充当天然海堤防风固浪，同时为鸟类提供了食物与栖息地。\n\n它不光好看，还是守护着生命律动的生态屏障。",
    english: "Framing wildlife as coworkers is not only playful, it helps us understand the importance of ecosystems.\n\nThe egrets in the mudflats? Forage across the tidal flats and leave a zero carbon footprint. The mangroves? They’re facilities – a living seawall that stabilizes land, buffers wind and water, and provides food and shelter.\n\nThis isn’t decoration. It’s infrastructure that happens to have a heartbeat."
  },
  {
    id: "9",
    topicId: "news",
    chinese: "三千多年前，古人将卜辞刻在龟甲兽骨之上，向神明和祖先询问收成、天气、战事等重大问题，并为王朝决策寻求指引。这些刻辞逐渐发展为汉字最早的形态，也是人类历史上最早的成熟书写系统之一。\n\n如今，我们将这种文字称为“甲骨文”。自 1899 年在安阳殷墟被发现以来，已有十几万片甲骨出土，其中有些流散世界各地，且仍有大量文字尚未破译。",
    english: "More than 3,000 years ago, people carved questions into animal bone and shell, seeking deities’ and ancestors’ guidance about harvests, weather, wars, and royal decisions. These inscriptions became the earliest known form of Chinese writing and among the earliest writing systems in human history.\n\nToday, we call them oracle bones. Since their discovery in 1899 in Anyang, tens of thousands of fragments have been found, many scattered around the world and only partially deciphered."
  },
  {
    id: "10",
    topicId: "tech",
    chinese: "“教育中最缺乏的一环，是参与感，”CEI 电子竞技总监 Jadd Schmeltzer 表示，“每个学生的学习方式不同，而电子竞技和游戏恰恰能激发他们的投入与热情。”\n\n这一理念构成了 CEI 三大支柱课程体系的核心，即融合游戏策略、社会情感学习与职业探索。课程旨在让“玩”变得有意义：学生不仅在游戏中锻炼团队协作与沟通技巧，也学会管理情绪，并探索屏幕之外的未来职业路径。",
    english: "“The missing piece in education is engagement,” says Jadd Schmeltzer, CEI’s Director of eSports. “Not every student learns the same way. eSports and gaming provide an opportunity for engagement.”\n\nThat philosophy is the foundation of CEI’s three-pillar curriculum, combining gaming and strategy, social-emotional learning, and career exploration. It’s a model designed to turn play into purpose. Students don’t just play – they practice teamwork and communication, learn to manage emotions, and discover future career paths that reach far beyond the screen."
  },
  {
    id: "11",
    topicId: "tech",
    chinese: "Weaver 表示，最有意义的时刻与获奖无关。“参赛的重点不在于得奖。当他们历经多日挫败终于成功调试一行代码，或是看到原型机最终组装完成，他们真正学会了学习。”\n\n他特别强调真实场景，像微信这样的平台对于学生成长至关重要。“学生能分辨什么是真实场景。这不是课堂作业，而是人们实际会使用的东西。这会促使他们更为重视。”",
    english: "Weaver said the most meaningful moments have nothing to do with awards. “It’s not about winning a prize. It’s when they debug a line of code after days of frustration, or see the prototype finally come together. That’s where the learning happens.”\n\nHe also believes real-world platforms like Weixin are key to student growth. “Students know when something is authentic. This isn’t a classroom assignment — it’s something people could actually use. That changes how seriously they take it.”"
  },
  {
    id: "12",
    topicId: "tech",
    chinese: "过去体检套餐往往千篇一律——有些人可能花钱做了不必要的检查，而有些人又漏掉至关重要的筛查。深圳的一家医院正通过 AI 改变这一局面。医院的“AI 智能体检”服务借助 DeepSeek 和腾讯混元双 AI 大模型，分析受检者的年龄、病史、生活方式和工作环境等个体信息，从而推荐最合适的检查项目。",
    english: "Health checkups have long followed a one-size-fits-all approach—some people might pay for irrelevant tests while others miss crucial screenings. At a hospital in Shenzhen, AI is changing that dynamic. The hospital's intelligent health checkup service, powered by dual AI large models including DeepSeek and Tencent's Hunyuan, analyzes each person's age, medical history, lifestyle, and work environment to recommend precisely the right tests."
  },
  {
    id: "13",
    topicId: "tech",
    chinese: "面对如今不断变化的媒体格局，创作者不再局限于单一的路径。如果一个故事能够引发共鸣，其 IP 便有扩展的潜力。无论是撰写小说，设计网络漫画，还是打造沉浸式游戏世界都有望获益。毕竟，这不仅仅是写作，更是在构建一个体系。\n\nIP 不必拘泥于静态资产——只要能够引发共鸣，就有可能在各类平台上大放异彩。对于作家而言，网络文学开辟了一个新方向，不仅有助于建立读者社区，还能铸就永续 IP，这无疑是一条令人振奋的新路径。",
    english: "In today's dynamic media landscape, creators are no longer confined to a single path. If a story resonates, its IP enables scale. Anyone crafting a novel, designing a webcomic, or building an immersive game world stands to benefit. After all, it’s not just writing — it’s building a universe.\n\nIP doesn’t have to be a static asset — if it resonates, it has the potential to flourish across a variety of platforms. For writers, web novels offer an exciting new path forward that can help build a community and lasting IP."
  },
  {
    id: "14",
    topicId: "tech",
    chinese: "试想这样的画面：你正在自己喜爱的第一人称射击（FPS）游戏中冲锋陷阵。无须手忙脚乱地按动快捷键，也不必对着人机 NPC 大喊大叫，你只需说出指令：“躲在红色卡车后面，趴下压制对面的火力。”几秒内，你的 AI 队友就能像老练的人类玩家一样精准执行命令，为你提供支持，而非碍手碍脚。",
    english: "Picture this: you’re pinned down in an intense firefight in your favorite first-person shooter (FPS) game. Instead of fumbling with hotkeys or yelling at an unresponsive NPC, you simply say: “take cover behind the red truck and lay down suppressive fire.” Within seconds, your AI companion moves with precision, executing your command like a seasoned human teammate to help rather than hinder your progress."
  }
];
