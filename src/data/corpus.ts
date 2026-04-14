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
  }
];
