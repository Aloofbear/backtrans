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
  }
];
