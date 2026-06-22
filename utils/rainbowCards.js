// 彩虹卡数据 - 每日能量补给
const rainbowCards = [
  // 红色 - 海底轮（生存、安全感）
  { color: "red", name: "活力红", meaning: "你拥有强大的生命力和行动力，今天是采取行动的好日子。", affirmation: "我充满活力，我的身体充满能量。" },
  { color: "red", name: "热情红", meaning: "热情是你最好的武器，用它去感染身边的每一个人。", affirmation: "我以热情和积极的态度面对生活。" },
  { color: "red", name: "勇气红", meaning: "勇气不是没有恐惧，而是带着恐惧依然前行。", affirmation: "我有勇气面对一切挑战。" },
  
  // 橙色 - 脐轮（创造力、情感）
  { color: "orange", name: "创造橙", meaning: "你的创造力正在流动，让新的想法自然涌现。", affirmation: "我是一个充满创造力的人。" },
  { color: "orange", name: "喜悦橙", meaning: "快乐是一种选择，今天选择让自己开心吧。", affirmation: "我选择让喜悦充满我的生活。" },
  { color: "orange", name: "情感橙", meaning: "感受是真实的，拥抱你内心的情感流动。", affirmation: "我允许自己感受一切美好的情感。" },
  
  // 黄色 - 太阳轮（自信、力量）
  { color: "yellow", name: "自信黄", meaning: "你本自具足，相信自己的能力和价值。", affirmation: "我相信自己，我值得被爱。" },
  { color: "yellow", name: "阳光黄", meaning: "像太阳一样照亮自己，也照亮他人。", affirmation: "我散发着温暖和光芒。" },
  { color: "yellow", name: "力量黄", meaning: "内在的力量比你想象的更强大。", affirmation: "我拥有无限的力量和潜能。" },
  
  // 绿色 - 心轮（爱、治愈）
  { color: "green", name: "治愈绿", meaning: "给自己一个拥抱，伤口正在愈合。", affirmation: "我值得被治愈，我正在愈合。" },
  { color: "green", name: "爱之绿", meaning: "爱从心开始，你值得被爱，也值得爱人。", affirmation: "我充满爱，我传递爱。" },
  { color: "green", name: "平衡绿", meaning: "在给予与接受之间找到平衡。", affirmation: "我在生活中找到了平衡与和谐。" },
  
  // 蓝色 - 喉轮（沟通、表达）
  { color: "blue", name: "沟通蓝", meaning: "你的声音很重要，勇敢表达真实的自己。", affirmation: "我能够清晰真实地表达自己。" },
  { color: "blue", name: "宁静蓝", meaning: "静默也是一种力量，给自己片刻宁静。", affirmation: "我在宁静中找到力量。" },
  { color: "blue", name: "智慧蓝", meaning: "倾听内心的声音，智慧就在其中。", affirmation: "我相信自己的直觉和智慧。" },
  
  // 靛色 - 三眼轮（直觉、洞察）
  { color: "indigo", name: "直觉靛", meaning: "相信你的直觉，它是你最真实的指南针。", affirmation: "我相信自己的直觉和洞察力。" },
  { color: "indigo", name: "洞察靛", meaning: "看清事物的本质，你拥有穿透迷雾的智慧。", affirmation: "我拥有清晰的洞察力。" },
  { color: "indigo", name: "梦想靛", meaning: "梦想是未来的种子，今天开始浇灌它。", affirmation: "我敢想敢做，我的梦想正在实现。" },
  
  // 紫色 - 顶轮（灵性、连接）
  { color: "purple", name: "灵性紫", meaning: "你与宇宙相连，一切都在对的时间发生。", affirmation: "我与宇宙的能量相连。" },
  { color: "purple", name: "和平紫", meaning: "内心和平是一切的根源。", affirmation: "我的内心充满了平静与和平。" },
  { color: "purple", name: "觉醒紫", meaning: "觉醒的路上，你已经很棒了。", affirmation: "我在成长的道路上不断前进。" },
  
  // 粉色 - 心轮（自爱、接纳）
  { color: "pink", name: "自爱粉", meaning: "先学会爱自己，才能更好地爱他人。", affirmation: "我无条件地爱和接纳自己。" },
  { color: "pink", name: "接纳粉", meaning: "接纳自己的不完美，那是独特的美。", affirmation: "我接纳自己的全部，包括优点和不足。" },
  { color: "pink", name: "温柔粉", meaning: "对自己温柔一点，你已经很努力了。", affirmation: "我对自己温柔，我值得被温柔对待。" },
  
  // 金色 - 顶轮（智慧、高我）
  { color: "gold", name: "智慧金", meaning: "内在的智慧正在觉醒，指引你前行。", affirmation: "我拥有无限的智慧和知识。" },
  { color: "gold", name: "丰盛金", meaning: "宇宙的丰盛正在流向你，你值得拥有美好的一切。", affirmation: "我敞开接受宇宙的丰盛。" },
  { color: "gold", name: "神圣金", meaning: "你是独一无二的存在，有自己的使命。", affirmation: "我认识到自己的神圣价值。" },
  
  // 白色 - 顶轮（净化、合一）
  { color: "white", name: "纯净白", meaning: "让心灵得到净化，轻装前行。", affirmation: "我让负面能量流走，接受纯净。" },
  { color: "white", name: "合一白", meaning: "万物一体，你与自然、与他人相连。", affirmation: "我与一切生命和谐相连。" },
  { color: "white", name: "新生白", meaning: "每一天都是新的开始，拥抱当下的美好。", affirmation: "我拥抱每一个新的开始。" }
];

// 根据日期获取今日卡片（保证每天同一用户获得相同卡片）
function getTodayCard(userId) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = (seed + (userId ? userId.charCodeAt(0) : 0)) % rainbowCards.length;
  return rainbowCards[index];
}

// 获取随机卡片
function getRandomCard() {
  const index = Math.floor(Math.random() * rainbowCards.length);
  return rainbowCards[index];
}

// 获取所有卡片
function getAllCards() {
  return rainbowCards;
}

module.exports = {
  getTodayCard,
  getRandomCard,
  getAllCards,
  rainbowCards
};
