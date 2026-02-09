// ====== 剑客游学 - Supabase 集成版本 ======
import * as SupabaseClient from './supabase-client.js';

// 配置：是否使用Supabase（检测环境变量）
const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const HABIT_KEYS = ['wake', 'piano', 'exercise', 'read', 'spine', 'math', 'sleep'];
const CHOICE_TITLE_MAP = {
  engineering: '打印历史名剑',
  music: '学一首古风曲',
  history: '读三国故事',
  logic: '数学解谜挑战'
};

// ====== Mockup 数据 ======
const MOCKUP_STUDENT = {
  id: '11111111-1111-1111-1111-111111111111',
  name: '彦平少侠',
  title: '初入江湖',
  avatar: '🥷',
  start_date: '2026-02-02',  // 寒假开始
  end_date: '2026-02-28',    // 寒假结束
  school_date: '2026-03-02', // 正式开学
  current_day: 7
};

// 搞笑倒计时语录
const COUNTDOWN_QUOTES = [
  { days: 20, emoji: '😎', text: '时间还早，继续浪~' },
  { days: 15, emoji: '🤨', text: '假期过半，作业呢？' },
  { days: 10, emoji: '😰', text: '十天了！快醒醒！' },
  { days: 7, emoji: '😱', text: '一周倒计时！慌不慌？' },
  { days: 5, emoji: '🏃', text: '冲刺阶段！加油鸭！' },
  { days: 3, emoji: '😭', text: '三天！作业写完没？！' },
  { days: 1, emoji: '💀', text: '明天开学...祝好运' },
  { days: 0, emoji: '📚', text: '开学快乐！（并不）' }
];

const MOCKUP_PROGRESS = {
  math_progress: 45,
  english_progress: 35,
  habits_progress: 60
};

// 时间轴配置（7AM - 10PM）
const TIMELINE_START_HOUR = 7;
const TIMELINE_END_HOUR = 22;
const HOUR_HEIGHT = 60; // 每小时高度px

// 今日日程（初始为空，用户自行添加或从Supabase加载）
let todaySchedule = [];

// 拖拽状态
let draggedEvent = null;
let dragStartY = 0;
let dragStartHour = 0;

// ====== 本周精彩表现（已完成成就）======
// 数据结构预留 media_url 和 video_url 字段用于Supabase同步
const WEEKLY_ACHIEVEMENTS = [
  { 
    id: 'speech_0203',
    date: '2月3日', 
    title: 'Impromptu Speech 即兴演讲',
    category: '语言训练',
    icon: '🎤',
    score: null,
    comment: '表现自信大方，语言流畅！',
    media_url: null,  // 图片链接（Supabase storage）
    video_url: null   // 视频链接
  },
  { 
    id: 'taoli_0205',
    date: '2月5日', 
    title: '桃李未来数学思维课',
    category: '数学逻辑',
    icon: '🧮',
    score: null,
    comment: '积极参与课堂讨论，思维活跃！',
    media_url: null,
    video_url: null
  }
];

// 三国人物头像选项
const AVATAR_OPTIONS = [
  { id: 'ninja', emoji: '🥷', name: '忍者', desc: '神出鬼没' },
  { id: 'guanyu', emoji: '⚔️', name: '关羽', desc: '义薄云天' },
  { id: 'zhangfei', emoji: '🗡️', name: '张飞', desc: '勇冠三军' },
  { id: 'zhugeliang', emoji: '🪭', name: '诸葛亮', desc: '智绝天下' },
  { id: 'zhaozilong', emoji: '🐴', name: '赵子龙', desc: '七进七出' },
  { id: 'lvbu', emoji: '🔱', name: '吕布', desc: '天下无双' },
  { id: 'caocao', emoji: '👑', name: '曹操', desc: '奸雄枭雄' },
  { id: 'sunwukong', emoji: '🐵', name: '孙悟空', desc: '斗战胜佛' }
];

// 用户上传的照片
let userPhotos = [];
let selectedAvatar = 'ninja';

const MOCKUP_HABITS = {
  wake: false,
  piano: false,
  exercise: true,
  read: false,
  sleep: false,
  math: true
};

const MOCKUP_INTERESTS = {
  history: 40,
  engineering: 65,
  music: 55,
  martial: 30,
  logic: 70,
  art: 25
};

const REWARDS = [
  { name: '青龙偃月刀', icon: '⚔️', condition: '新手礼包', stl: 'assets/stl/obj_1_tail.stl', unlocked: true },
  { name: '方天画戟', icon: '🔱', condition: '完成3天数学', stl: 'assets/stl/fangtian_huaji.stl', unlocked: false },
  { name: '丈八蛇矛', icon: '🔱', condition: '完成5天打卡', stl: 'assets/stl/zhangba_shemao.stl', unlocked: false },
  { name: '诸葛连弩', icon: '🏹', condition: '数学进阶挑战', stl: 'assets/stl/zhugeliannu.stl', unlocked: false }
];

const ACHIEVEMENTS = [
  { name: '初入江湖', desc: '完成第1天', icon: '🎖️', unlocked: true },
  { name: '勤学苦练', desc: '连续3天完成所有任务', icon: '🏆', unlocked: true },
  { name: '持之以恒', desc: '完成7天打卡', icon: '🧭', unlocked: true },
  { name: '半程侠影', desc: '完成第7天', icon: '🥋', unlocked: false },
  { name: '登峰造极', desc: '完成14天打卡', icon: '🗡️', unlocked: false },
  { name: '琴剑双修', desc: '完成5次钢琴+运动', icon: '🎹', unlocked: false },
  { name: '晨光侠客', desc: '早起打卡5天', icon: '🌅', unlocked: false },
  { name: '夜行不辍', desc: '早睡打卡5天', icon: '🌙', unlocked: false },
  { name: '博览群书', desc: '阅读打卡7天', icon: '📚', unlocked: false },
  { name: '运动达人', desc: '运动打卡7天', icon: '🏃', unlocked: false }
];

// 深圳和广东省真实活动数据（2026年2-3月）
const CITY_EVENTS = {
  shenzhen: [
    // ===== 春节灯会/活动 =====
    {
      month: '2月', day: '17-23',
      title: '锦绣中华非遗灯会',
      location: '深圳锦绣中华民俗村',
      price: '¥99起',
      desc: '1500架无人机组成"2026"字样，非遗打钢花，新春巡游',
      category: '春节灯会',
      url: 'https://m.bendibao.com/'
    },
    {
      month: '2月', day: '17-23',
      title: '甘坑古镇繁花灯会',
      location: '龙岗甘坑客家小镇',
      price: '¥59起',
      desc: '11个地方特色展馆+15个年味美食展，英歌舞/侗族芦笙表演',
      category: '春节灯会',
      url: 'https://m.bendibao.com/'
    },
    {
      month: '2月', day: '17-23',
      title: '世界之窗闪光迎新季',
      location: '深圳世界之窗',
      price: '¥99起',
      desc: '千年非遗"打钢花"、飞天奇幻秀、新春大巡游',
      category: '春节灯会',
      url: 'https://m.bendibao.com/'
    },
    {
      month: '2月', day: '17-23',
      title: '欢乐港湾骑遇未境灯光秀',
      location: '宝安欢乐港湾',
      price: '免费',
      desc: '灯光水秀+马年主题，摩天轮夜景',
      category: '灯光秀',
      url: 'https://m.bendibao.com/'
    },
    {
      month: '2月', day: '19-22',
      title: '小梅沙英歌舞表演',
      location: '小梅沙海滨乐园',
      price: '¥79起',
      desc: '年初三到年初六英歌舞表演，马年主题游园会',
      category: '春节活动',
      url: 'http://sz.bendibao.com/xiuxian/202625/998081.shtm'
    },
    // ===== 博物馆展览 =====
    {
      month: '2月', day: '6', endDate: '5月6日',
      title: '梦华千年——中国古代瓷器展',
      location: '深圳望野博物馆',
      price: '免费预约',
      desc: '国家博物馆借展珍贵古代瓷器文物，展示中国陶瓷艺术千年传承',
      category: '展览'
    },
    {
      month: '2月', day: '8', endDate: '3月22日',
      title: '骥跃升腾——三彩马的世界',
      location: '深圳博物馆同心路馆',
      price: '免费免预约',
      desc: '第十五届全运会马术配套展览，展出唐代三彩马珍品42套60件',
      category: '展览'
    },
    {
      month: '2月', day: '8', endDate: '4月6日',
      title: '繁花与利剑——莫卧儿宫廷珍宝展',
      location: '深圳博物馆金田路馆',
      price: '¥78（学生¥40）',
      desc: '中国内地首展！近200件莫卧儿帝国文物，含武器、珠宝、细密画',
      category: '展览'
    },
    {
      month: '2月', day: '8', endDate: '3月8日',
      title: '临古见真——故宫古书画临摹复制技艺展',
      location: '深圳博物馆同心路馆',
      price: '免费',
      desc: '故宫101件古书画摹本，含《虢国夫人游春图》《货郎图》等名迹',
      category: '展览'
    },
    {
      month: '2月', day: '8', endDate: '5月24日',
      title: '深海绮珍——宝石珊瑚的艺术与文化',
      location: '南山博物馆三层四号展厅',
      price: '免费',
      desc: '解密宝石珊瑚生成奥秘，展示珊瑚艺术品与海洋保护',
      category: '展览'
    },
    {
      month: '2月', day: '8', endDate: '3月15日',
      title: '草原吉金——鄂尔多斯精品青铜器展',
      location: '南山博物馆二层三号展厅',
      price: '免费',
      desc: '300余件草原青铜文明精品，展示北方游牧民族的华丽篇章',
      category: '展览'
    },
    {
      month: '2月', day: '15', endDate: '3月15日',
      title: '幽默疗愈场——华君武漫画特藏展',
      location: '深圳美术馆一楼3号展厅',
      price: '免费',
      desc: '华君武先生诞辰110周年纪念，精选110件社会讽刺漫画作品',
      category: '展览'
    },
    {
      month: '3月', day: '1', endDate: '3月8日',
      title: '春风画卷——深圳美术馆馆藏作品展',
      location: '深圳美术馆（新馆）三楼',
      price: '免费',
      desc: '回顾改革开放初期深圳美术探索，涵盖油画、国画、版画、水彩',
      category: '展览'
    },
    {
      month: '2月', day: '8', endDate: '1月4日',
      title: '镜彩中国——历届全运会体育摄影精品特展',
      location: '深圳美术馆二楼6、7号展厅',
      price: '免费',
      desc: '新华社五万多张历届全运会作品精选，展示竞技体育与全民健身',
      category: '展览'
    },
    // ===== AI/科技活动 =====
    {
      month: '1月', day: '8-11',
      title: '「妙物·智趣」阿里云通义智能硬件展',
      location: '海上世界文化艺术中心',
      price: '免费',
      desc: '220+家AI企业参展，1500+件智能硬件，AI眼镜、机器狗、健康仪器体验',
      category: 'AI科技'
    },
    {
      month: '3月', day: '20-22',
      title: '2026深圳国际人形机器人及通用人工智能展览会',
      location: '深圳国际会展中心',
      price: '免费预约',
      desc: '人形机器人、AI大模型、智能穿戴设备展示与体验',
      category: 'AI科技'
    },
    {
      month: '3月', day: '20-22',
      title: '2026深圳国际AI玩具与儿童智能产品展览会',
      location: '深圳国际会展中心',
      price: '免费预约',
      desc: 'AI编程玩具、智能早教机器人、STEM教育产品展示',
      category: 'AI科技'
    },
    {
      month: '3月', day: '20-22',
      title: '2026深圳国际AI智能眼镜与智能穿戴展览会',
      location: '深圳国际会展中心',
      price: '免费预约',
      desc: 'AR/VR眼镜、智能手表、健康穿戴设备前沿展示',
      category: 'AI科技'
    },
    // ===== 武术/体育活动 =====
    {
      month: '2月', day: '每周末',
      title: '少年剑道体验课',
      location: '深圳剑友剑道俱乐部（明剑馆）',
      price: '¥150/次',
      desc: '日本剑道入门体验，七段师范亲自指导，适合8岁以上青少年',
      category: '武术体育'
    },
    {
      month: '2月', day: '每周六',
      title: '万国击剑体验课',
      location: '万国体育（南山/福田/宝安）',
      price: '¥99体验',
      desc: '花剑/重剑青少年入门，奥运冠军教练团队，含装备租借',
      category: '武术体育'
    },
    // ===== 春节活动 =====
    {
      month: '2月', day: '10-16',
      title: '福田·节日广场迎春花市',
      location: '卓悦中心节日广场',
      price: '免费',
      desc: '骐骥湾区，繁花福田！"行花街"传统年俗，全家讨"好意头"',
      category: '春节'
    },
    {
      month: '2月', day: '17-23',
      title: '节日大道非遗贺新春',
      location: '深圳节日大道（福华路）',
      price: '免费',
      desc: '初一到初七非遗主题演出，每日不重样沉浸式节庆体验',
      category: '春节'
    },
    {
      month: '1月31日', day: '-3月15日',
      title: '马年生肖艺术装置展',
      location: '深圳节日大道街区',
      price: '免费',
      desc: '"独角兽+祥瑞马"融合装置，3D打印数字盆景，科技底色东方庭院',
      category: '春节'
    },
    {
      month: '3月', day: '3',
      title: '节日大道元宵喜乐会',
      location: '卓悦中心节日广场',
      price: '免费',
      desc: '赏非遗、猜灯谜、传统灯阵、舞龙巡游，穿汉服赢花灯',
      category: '春节'
    },
    // ===== 深圳湾/万象天地 =====
    {
      month: '1月18日', day: '起',
      title: 'BAY de PONY 福马游园',
      location: '深圳湾万象城A/B/C/D区',
      price: '免费',
      desc: '小马PONY携团圆祝愿，东方意蕴与现代美学沉浸式游园',
      category: '春节'
    },
    {
      month: '2月', day: '周五-周日',
      title: '未来之梦 水景光影秀',
      location: '深圳湾万象城B区WAVE广场',
      price: '免费',
      desc: '每晚19:00/20:00/21:00三场，每场3分钟',
      category: '活动'
    },
    {
      month: '1月23日', day: '-2月28日',
      title: '兰蔻新春游园会「天马行空」',
      location: '深圳湾万象城C区水幕广场',
      price: '免费',
      desc: '不拘一梦，天马行空主题艺术装置',
      category: '春节'
    },
    // ===== 深圳书城 =====
    {
      month: '2月', day: '至3月上旬',
      title: '马踏书香趣新春',
      location: '深圳书城龙岗城',
      price: '免费',
      desc: '新春主题打卡、沉浸式书香桃源、年货展销、非遗手工体验',
      category: '书城'
    },
    {
      month: '2月', day: '8',
      title: '书城新春摄影日',
      location: '深圳书城龙岗城四楼',
      price: '免费',
      desc: '专业摄影师拍摄服务，留下独一无二的新年封面',
      category: '书城'
    },
    // ===== 海上世界/蛇口 =====
    {
      month: '2月', day: '春节期间',
      title: '海上世界灯光艺术展',
      location: '海上世界文化艺术中心',
      price: '免费',
      desc: '光影艺术装置，新春主题灯光秀',
      category: '活动'
    },
    {
      month: '2月', day: '春节期间',
      title: '蛇口招商花园城新春活动',
      location: '蛇口招商花园城',
      price: '免费',
      desc: '新春市集、舞狮表演、亲子活动',
      category: '春节'
    },
    // ===== 公园活动 =====
    {
      month: '2月', day: '春节期间',
      title: '深圳湾公园春节游园',
      location: '深圳湾公园',
      price: '免费',
      desc: '骑行、观鸟、海滨漫步，春节灯饰装点',
      category: '公园'
    },
    {
      month: '2月', day: '春节期间',
      title: '人才公园光影艺术季',
      location: '人才公园',
      price: '免费',
      desc: '光影艺术作品展示，覆盖文心广场、人才公园、深圳湾',
      category: '公园'
    },
    {
      month: '2月', day: '春节期间',
      title: '莲花山公园迎春花展',
      location: '莲花山公园',
      price: '免费',
      desc: '各类春花争艳，适合亲子踏青赏花',
      category: '公园'
    },
    // ===== 深圳城市规划馆 =====
    {
      month: '2月', day: '常设',
      title: '深圳城市规划展览',
      location: '深圳城市规划馆（市民中心东翼）',
      price: '免费预约',
      desc: '了解深圳城市发展历史与未来规划，互动多媒体展示',
      category: '展览'
    },
    // ===== 青少年比赛 =====
    {
      month: '2月', day: '报名中',
      title: '全国青少年人工智能创新挑战赛（广东赛区）',
      location: '线上初赛+深圳决赛',
      price: '免费报名',
      desc: '教育部白名单赛事，含编程创作、3D设计、智能应用等赛项',
      category: '比赛'
    },
    {
      month: '2月', day: '报名中',
      title: 'APAI亚太人工智能青少年科技创新大赛',
      location: '线上提交+现场答辩',
      price: '免费报名',
      desc: '2025-2026年度，鼓励青少年使用AI创新技术解决实际问题',
      category: '比赛'
    },
    {
      month: '2月', day: '报名中',
      title: '全国青少年人工智能辅助生成数字艺术创作者大赛',
      location: '线上提交作品',
      price: '免费报名',
      desc: '教育部白名单，AI+图像/影像/音频/文本艺术创作',
      category: '比赛'
    },
    // ===== 创客/STEM活动 =====
    {
      month: '2月', day: '每周末',
      title: '柴火创客空间开放日',
      location: '柴火创客空间（南山）',
      price: '免费',
      desc: '3D打印、激光切割、电子制作体验，适合亲子参与',
      category: '创客STEM'
    },
    // ===== 春节活动 =====
    {
      month: '2月', day: '10-16',
      title: '福田·节日广场迎春花市',
      location: '卓悦中心节日广场',
      price: '免费',
      desc: '"行花街"传统年俗，骐骥湾区繁花福田主题，适合全家行大运',
      category: '春节花市'
    },
    {
      month: '2月', day: '17-23',
      title: '节日大道非遗贺新春',
      location: '深圳节日大道（福华路）',
      price: '免费',
      desc: '初一到初七每日不同非遗演出，舞龙舞狮、英歌舞、打铁花',
      category: '春节活动'
    },
    {
      month: '3月', day: '3',
      title: '节日大道元宵喜乐会',
      location: '卓悦中心节日广场',
      price: '免费',
      desc: '赏非遗、猜灯谜、走百病祈福、汉服巡游，赢特色花灯',
      category: '春节活动'
    },
    {
      month: '1月31日', day: '-3月15日',
      title: '马年生肖艺术装置展',
      location: '深圳节日大道街区',
      price: '免费',
      desc: '独角兽+祥瑞马融合装置，3D打印数字盆景，多点打卡集福',
      category: '春节活动'
    },
    // ===== 深圳湾/万象天地 =====
    {
      month: '1月18日', day: '起',
      title: 'BAY de PONY 福马游园',
      location: '深圳湾万象城A/B/C/D区',
      price: '免费',
      desc: '沉浸式新春游园，融汇东方意蕴与现代美学',
      category: '春节活动'
    },
    {
      month: '2月', day: '周五-周日',
      title: '未来之梦 水景光影秀',
      location: '深圳湾万象城B区WAVE广场',
      price: '免费',
      desc: '19:00/20:00/21:00三场，每场3分钟水幕光影表演',
      category: '灯光秀'
    },
    {
      month: '1月23日', day: '-2月28日',
      title: '兰蔻新春游园会',
      location: '深圳湾万象城C区水幕广场',
      price: '免费',
      desc: '不拘一梦天马行空主题，水幕广场、中心河连桥灯光装置',
      category: '春节活动'
    },
    // ===== 海上世界/蛇口 =====
    {
      month: '2月', day: '春节期间',
      title: '海上世界灯光艺术展',
      location: '海上世界文化艺术中心',
      price: '免费',
      desc: 'V&A博物馆设计展+户外光影装置，面向深圳湾与香港',
      category: '灯光秀'
    },
    {
      month: '2月', day: '春节期间',
      title: '蛇口招商花园城新春活动',
      location: '蛇口招商花园城',
      price: '免费',
      desc: '新春市集、年味美食、亲子互动游戏',
      category: '春节活动'
    },
    // ===== 深圳书城 =====
    {
      month: '2月', day: '1日-3月上旬',
      title: '马踏书香趣新春',
      location: '深圳书城龙岗城',
      price: '免费',
      desc: '新春伊始马跃花开打卡、墨香驭马亲子写福字、义写春联',
      category: '书城活动'
    },
    {
      month: '2月', day: '8',
      title: '书香桃源新年摄影',
      location: '深圳书城龙岗城四楼',
      price: '免费',
      desc: '专业摄影师现场拍摄，桃花骏马场景留影，赠精美照片',
      category: '书城活动'
    },
    // ===== 公园/景区 =====
    {
      month: '2月', day: '春节期间',
      title: '锦绣中华新春灯会暨非遗中国年',
      location: '锦绣中华民俗村',
      price: '门票优惠',
      desc: '大型花灯展、非遗表演、打铁花、舞龙舞狮',
      category: '灯会'
    },
    {
      month: '2月', day: '春节期间',
      title: '世界之窗闪光迎新季',
      location: '世界之窗',
      price: '门票优惠',
      desc: '全球风情新春派对、灯光秀、跨年倒计时',
      category: '灯会'
    },
    {
      month: '2月', day: '春节期间',
      title: '甘坑古镇繁花盛宴',
      location: '甘坑古镇',
      price: '免费入园',
      desc: '客家年味、花灯长廊、非遗手作体验',
      category: '灯会'
    },
    {
      month: '2月', day: '春节期间',
      title: '欢乐海岸马年春节活动',
      location: '欢乐海岸',
      price: '免费',
      desc: '绘画素描艺术展示、现场互动、水秀表演',
      category: '春节活动'
    },
    {
      month: '2月', day: '春节期间',
      title: '小梅沙海滨乐园春节活动',
      location: '小梅沙海滨乐园',
      price: '门票优惠',
      desc: '海滨派对、沙滩游戏、新春表演',
      category: '春节活动'
    },
    {
      month: '2月', day: '春节期间',
      title: '深圳湾公园新春漫步',
      location: '深圳湾公园',
      price: '免费',
      desc: '海滨绿道骑行、观鸟、深圳湾大桥日落',
      category: '公园'
    },
    {
      month: '2月', day: '春节期间',
      title: '莲花山公园登高祈福',
      location: '莲花山公园',
      price: '免费',
      desc: '登山望福、邓小平铜像、俯瞰市民中心',
      category: '公园'
    },
    // ===== 深圳城市规划馆 =====
    {
      month: '2月', day: '常设',
      title: '深圳城市规划展',
      location: '深圳市当代艺术与城市规划馆',
      price: '免费预约',
      desc: '了解深圳40年发展历程，未来城市规划沙盘与VR体验',
      category: '展览'
    }
  ],
  // ===== 东莞 =====
  dongguan: [
    {
      month: '2月', day: '17-23',
      title: '东莞迎春花市',
      location: '东莞市中心广场',
      price: '免费',
      desc: '年宵花卉、特色年货、民俗表演，传统行花街体验',
      category: '春节'
    },
    {
      month: '2月', day: '17-23',
      title: '东莞非遗庙会',
      location: '东莞可园博物馆',
      price: '免费',
      desc: '非遗手工体验、传统技艺展示、民俗表演、美食市集',
      category: '春节'
    },
    {
      month: '2月', day: '17',
      title: '东莞烟花秀',
      location: '东江大道滨江公园',
      price: '免费',
      desc: '除夕夜烟花汇演，需提前预约观赏位置',
      category: '春节'
    },
    {
      month: '2月', day: '每周末',
      title: '龙凤山庄亲子游',
      location: '龙凤山庄影视度假村（凤岗镇）',
      price: '¥80（儿童¥50）',
      desc: 'AAAA级景区，摩天轮、卡丁车、大摆锤、婚庆主题拍摄地',
      category: '亲子'
    },
    {
      month: '2月', day: '每周末',
      title: '银瓶嘴登山探险',
      location: '银瓶山森林公园（谢岗镇）',
      price: '免费',
      desc: '东莞第一峰，海拔898米，挑战自我锻炼体能',
      category: '户外'
    },
    {
      month: '2月', day: '每天',
      title: '田园花海赏花',
      location: '清溪香市花海/寮步香氏花园',
      price: '免费',
      desc: '180亩葵花园+格桑花，亲子互动拍照打卡',
      category: '亲子'
    },
    {
      month: '3月', day: '8',
      title: '东莞科技馆STEM冬令营',
      location: '东莞科学馆',
      price: '¥200/天',
      desc: '机器人编程+科学实验+3D打印，适合10-15岁',
      category: '创客STEM'
    }
  ],
  // ===== 珠海 =====
  zhuhai: [
    {
      month: '2月', day: '每天',
      title: '珠海长隆海洋王国',
      location: '珠海横琴长隆国际海洋度假区',
      price: '¥395（儿童¥280）',
      desc: '全球最大海洋主题乐园，鲸鲨馆、企鹅馆、烟花表演，适合全家出游',
      category: '亲子',
      url: 'https://zh.chimelong.com/'
    },
    {
      month: '2月', day: '17-23',
      title: '珠海渔女灯光秀',
      location: '珠海渔女雕像/情侣路',
      price: '免费',
      desc: '春节期间灯光秀表演，每晚19:00/20:00/21:00，海滨浪漫夜景',
      category: '春节',
      url: 'https://m.zh.bendibao.com/'
    },
    {
      month: '2月', day: '每周末',
      title: '航空科普基地开放日',
      location: '珠海航空科普基地',
      price: '¥50/人',
      desc: '航空模拟器体验、无人机操控、航空知识讲座，探索蓝天奥秘',
      category: '科普',
      url: 'https://k.sina.cn/article_7879922979_1d5ae152301901m8x6.html'
    },
    {
      month: '2月', day: '每天',
      title: '外伶仃岛出海一日游',
      location: '珠海香洲港码头',
      price: '¥180/人（含船票）',
      desc: '海岛探险、海鲜大餐、观赏海豚、日落美景，网红打卡圣地',
      category: '户外',
      url: 'https://baike.baidu.com/item/外伶仃岛'
    },
    {
      month: '2月', day: '每天',
      title: '圆明新园',
      location: '珠海九洲大道',
      price: '¥100（学生¥60）',
      desc: '圆明园精华景观复原，晚间大型演出《大清盛典》，沉浸式历史体验',
      category: '亲子',
      url: 'https://zh.bendibao.com/tour/ly530/'
    },
    {
      month: '2月', day: '每天',
      title: '珠海海泉湾温泉',
      location: '珠海平沙海泉湾度假区',
      price: '¥168起',
      desc: '海洋温泉养生，多种主题温泉池，亲子水乐园，放松身心好去处',
      category: '休闲',
      url: 'https://www.hqqwy.com/'
    }
  ],
  guangdong: [
    // ===== 广州 =====
    {
      month: '1月30日', day: '-2月11日',
      title: '2026广州年货展销会（暨中外商品博览会）',
      location: '保利世贸博览馆',
      price: '免费',
      desc: '春节前最大型年货采购盛会，传统美食与文创产品',
      category: '展会'
    },
    {
      month: '2月', day: '7-9',
      title: '第二届LGMAGI黑蜻蜓动漫游戏博览会•广州站',
      location: '灵感创新展馆',
      price: '门票待定',
      desc: '动漫游戏展、Cosplay比赛、周边市集',
      category: '展会'
    },
    {
      month: '2月', day: '11',
      title: '广州白鹅潭春节烟花汇演',
      location: '白鹅潭大湾区艺术中心',
      price: '免费预约',
      desc: '2026春节烟花盛典，需提前微信预约观赏位置',
      category: '活动'
    },
    {
      month: '3月', day: '3-6',
      title: '2026华南国际口腔医疗器材展览会',
      location: '中国进出口商品交易会展馆',
      price: '专业观众免费',
      desc: '医疗科技展示，可了解牙科AI诊断等新技术',
      category: '展会'
    },
    {
      month: '3月', day: '4-6',
      title: '广州国际3D打印展览会',
      location: '中国进出口商品交易会展馆',
      price: '专业观众免费',
      desc: '3D打印技术与设备展示，含教育应用专区',
      category: '展会'
    },
    {
      month: '3月', day: '4-6',
      title: 'AI人工智能商业应用博览会',
      location: '中国进出口商品交易会展馆',
      price: '免费预约',
      desc: 'AI商业应用展示，含智能客服、AI创作等体验',
      category: 'AI科技'
    },
    {
      month: '2月', day: '22',
      title: '广州少年宫创客工作坊',
      location: '广州少年宫',
      price: '¥80/人',
      desc: '3D打印+Scratch编程+机器人制作，适合8-14岁',
      category: '创客STEM'
    },
    {
      month: '3月', day: '1',
      title: '岭南传统文化节',
      location: '广州文化公园',
      price: '免费',
      desc: '粤剧表演、醒狮、武术、广彩、广绣等非遗展示',
      category: '活动'
    },
    // ===== 佛山 =====
    {
      month: '2月', day: '15',
      title: '佛山武术文化体验日',
      location: '佛山祖庙博物馆（黄飞鸿纪念馆）',
      price: '¥30门票',
      desc: '黄飞鸿纪念馆参观+武术表演+咏春拳体验课',
      category: '武术体育'
    },
    {
      month: '3月', day: '17-20',
      title: '第49届国际龙家具展览会',
      location: '佛山市顺德前进会展中心',
      price: '专业观众免费',
      desc: '家具设计与智能制造展示，可了解CNC、激光切割技术',
      category: '展会'
    },
    // ===== 东莞 =====
    {
      month: '3月', day: '8',
      title: '东莞科技馆STEM冬令营',
      location: '东莞科学馆',
      price: '¥200/天',
      desc: '机器人编程+科学实验+3D打印，适合10-15岁',
      category: '创客STEM'
    },
    {
      month: '3月', day: '15-18',
      title: '第55届东莞国际名家具展览会',
      location: '广东现代国际展览中心',
      price: '专业观众免费',
      desc: '家具设计与智能家居展示',
      category: '展会'
    },
    // ===== 珠海/中山 =====
    {
      month: '2月', day: '每周末',
      title: '珠海航空科普基地开放日',
      location: '珠海航空科普基地',
      price: '¥50/人',
      desc: '航空模拟器体验、无人机操控、航空知识讲座',
      category: '科普'
    },
    {
      month: '3月', day: '1',
      title: '中山纪念图书馆科技阅读月',
      location: '中山纪念图书馆',
      price: '免费',
      desc: 'AI绘本阅读、机器人互动、科普讲座系列活动',
      category: '科普'
    },
    // ===== 广东省博物馆 =====
    {
      month: '2月', day: '常设',
      title: '广东省博物馆——潮州木雕艺术展',
      location: '广东省博物馆',
      price: '免费预约',
      desc: '展示潮州木雕精品，了解岭南传统工艺',
      category: '展览'
    },
    {
      month: '2月', day: '常设',
      title: '广东省博物馆——海上丝绸之路',
      location: '广东省博物馆',
      price: '免费预约',
      desc: '海上丝路历史文物，展示广东在海上贸易中的重要地位',
      category: '展览'
    }
  ]
};

// 本地状态
let localHabits = { ...MOCKUP_HABITS };
let localProgress = { ...MOCKUP_PROGRESS };
let localInterests = { ...MOCKUP_INTERESTS };
let currentTab = 'home';

// ====== 本地存储工具 ======
const STORAGE_KEYS = {
  habits: 'jkxx_habits',
  progress: 'jkxx_progress',
  interests: 'jkxx_interests',
  schedule: 'jkxx_schedule',
  habitsData: 'habitsData'
};

function saveToLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('本地存储失败:', e);
  }
}

function loadFromLocal(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.warn('本地加载失败:', e);
    return defaultValue;
  }
}

function loadAllLocalData() {
  // 加载习惯打卡状态
  const savedHabits = loadFromLocal(STORAGE_KEYS.habits, null);
  if (savedHabits) {
    Object.assign(localHabits, savedHabits);
  }
  
  // 加载进度
  const savedProgress = loadFromLocal(STORAGE_KEYS.progress, null);
  if (savedProgress) {
    Object.assign(localProgress, savedProgress);
  }
  
  // 加载兴趣分数
  const savedInterests = loadFromLocal(STORAGE_KEYS.interests, null);
  if (savedInterests) {
    Object.assign(localInterests, savedInterests);
  }
  
  // 加载今日日程
  const savedSchedule = loadFromLocal(STORAGE_KEYS.schedule, null);
  if (savedSchedule && Array.isArray(savedSchedule)) {
    todaySchedule = savedSchedule;
  }
  
  console.log('✅ 本地数据已加载');
}

function saveAllLocalData() {
  saveToLocal(STORAGE_KEYS.habits, localHabits);
  saveToLocal(STORAGE_KEYS.progress, localProgress);
  saveToLocal(STORAGE_KEYS.interests, localInterests);
  saveToLocal(STORAGE_KEYS.schedule, todaySchedule);
}

// ====== 初始化 ======
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setOfflineBadge(false);
  bindModal();
  initLandingPage();
  
  // 先从本地加载数据
  loadAllLocalData();
  
  // 尝试从Supabase加载数据（会覆盖本地）
  if (USE_SUPABASE) {
    console.log('🔌 使用 Supabase 模式');
    await loadFromSupabase();
  } else {
    console.log('📦 使用本地存储模式');
  }
  
  initDayNumber();
  initDashboard();
  initWeeklyHighlights();
  initTimeline();
  initHabits();
  initRadarChart();
  initRewards();
  initAchievements();
  initEvents();
  initProfile();
}

// 从Supabase加载数据
async function loadFromSupabase() {
  try {
    // 加载今日进度
    const progress = await SupabaseClient.getTodayProgress();
    if (progress) {
      localProgress = {
        math_progress: progress.math_progress || 0,
        english_progress: progress.english_progress || 0,
        habits_progress: progress.habits_progress || 0
      };
    }
    
    // 加载今日习惯
    const habits = await SupabaseClient.getTodayHabits();
    habits.forEach(h => {
      if (h.is_completed) {
        localHabits[h.habit_type] = true;
      }
    });
    
    // 加载兴趣分数
    const interests = await SupabaseClient.getInterests();
    if (Object.keys(interests).length > 0) {
      Object.assign(localInterests, interests);
    }
    
    // 加载今日日程
    const schedule = await SupabaseClient.getTodaySchedule();
    if (schedule && schedule.length > 0) {
      todaySchedule = schedule.map(s => ({
        id: s.id,
        event_title: s.event_title,
        event_icon: s.event_icon || '📌',
        startHour: s.start_hour,
        startMin: s.start_minute,
        endHour: s.end_hour,
        endMin: s.end_minute,
        color: s.color || '#F4D03F',
        status: s.status || 'pending'
      }));
    }
    
    // 加载精彩表现
    const achievements = await SupabaseClient.getWeeklyAchievements();
    if (achievements && achievements.length > 0) {
      // 替换本地数据
      WEEKLY_ACHIEVEMENTS.length = 0;
      achievements.forEach(a => {
        WEEKLY_ACHIEVEMENTS.push({
          id: a.id,
          date: a.achievement_date,
          title: a.title,
          category: a.category,
          icon: a.icon || '🌟',
          score: a.score,
          comment: a.comment,
          media_url: a.media_url,
          video_url: a.video_url
        });
      });
    }
    
    console.log('✅ Supabase 数据加载完成');
  } catch (err) {
    console.error('❌ Supabase 加载失败，使用本地数据:', err);
  }
}

function initDayNumber() {
  document.getElementById('dayNum').textContent = MOCKUP_STUDENT.current_day;
}

// ====== Landing Page 动画 (GSAP + Canvas粒子) ======
function initLandingPage() {
  const overlay = document.getElementById('landingOverlay');
  const canvas = document.getElementById('landingCanvas');
  const skipBtn = document.querySelector('.landing-skip');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  let width = window.innerWidth;
  let height = window.innerHeight;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  // 粒子系统
  const particles = [];
  const dustParticles = [];
  
  // 背景星尘粒子
  for (let i = 0; i < 150; i++) {
    dustParticles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  // 文字粒子采样
  const chars = ['馬', '到', '成', '功'];
  const fontSize = Math.min(220, width * 0.30);
  const centerX = width / 2;
  const startY = height * 0.12;
  const lineGap = fontSize * 1.15;

  function sampleCharacters() {
    particles.length = 0;
    
    chars.forEach((ch, charIdx) => {
      const targetY = startY + charIdx * lineGap;
      
      const off = document.createElement('canvas');
      const offCtx = off.getContext('2d');
      const size = Math.ceil(fontSize * 1.6);
      off.width = size;
      off.height = size;
      
      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, size, size);
      offCtx.font = `bold ${fontSize}px "Ma Shan Zheng", "Noto Sans SC", serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#fff';
      offCtx.fillText(ch, size / 2, size / 2);
      
      const imageData = offCtx.getImageData(0, 0, size, size);
      const step = 3;
      
      for (let x = 0; x < size; x += step) {
        for (let y = 0; y < size; y += step) {
          const idx = (y * size + x) * 4;
          if (imageData.data[idx] > 128) {
            const tx = centerX - size / 2 + x;
            const ty = targetY - size / 2 + y;
            
            particles.push({
              x: centerX + (Math.random() - 0.5) * width * 0.8,
              y: height + Math.random() * 200,
              tx: tx,
              ty: ty,
              size: 0.8 + Math.random() * 0.8,
              alpha: 0,
              delay: charIdx * 1.5,
              charIdx: charIdx,
              progress: 0
            });
          }
        }
      }
    });
    
    console.log(`粒子采样完成: ${particles.length} 个`);
  }

  // 动画状态
  let animProgress = { value: 0 };
  let isAnimating = true;

  // GSAP 主时间线
  function startAnimation() {
    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating = false;
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => overlay.remove()
        });
      }
    });

    // 背景光晕脉动
    tl.to('.landing-glow', {
      scale: 1.2,
      opacity: 0.8,
      duration: 2,
      ease: 'power2.out'
    }, 0);

    // 粒子动画进度 (8秒总时长)
    tl.to(animProgress, {
      value: 1,
      duration: 7,
      ease: 'power2.out'
    }, 0.5);

    // 文字依次显现 (纯粒子，无DOM文字)
    // GSAP只控制动画进度和光晕

    // 跳过按钮淡入
    tl.to('.landing-skip', {
      opacity: 1,
      duration: 0.5
    }, 3);
  }

  // Canvas 渲染循环
  function render() {
    if (!isAnimating) return;
    
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, width, height);
    
    // 背景光晕
    const gradient = ctx.createRadialGradient(centerX, height * 0.4, 0, centerX, height * 0.4, height * 0.5);
    gradient.addColorStop(0, 'rgba(244, 208, 63, 0.06)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 星尘粒子
    dustParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.3})`;
      ctx.fill();
    });
    
    // 文字粒子
    const now = performance.now();
    particles.forEach(p => {
      const charProgress = Math.max(0, animProgress.value - p.delay / 6);
      if (charProgress <= 0) return;
      
      const ease = 1 - Math.pow(1 - Math.min(charProgress * 1.5, 1), 3);
      
      p.x += (p.tx - p.x) * 0.08;
      p.y += (p.ty - p.y) * 0.08;
      p.alpha = Math.min(1, p.alpha + 0.03);
      
      const jitter = (1 - ease) * 3;
      const px = p.x + Math.sin(now * 0.003 + p.tx) * jitter;
      const py = p.y + Math.cos(now * 0.003 + p.ty) * jitter;
      
      // 呼吸效果：粒子聚合后大小周期性变化
      let breathScale = 1;
      if (ease > 0.9) {
        // 聚合完成后开始呼吸
        const breathPhase = Math.sin(now * 0.004 + p.tx * 0.1 + p.ty * 0.1);
        breathScale = 1 + breathPhase * 0.3; // 0.7 ~ 1.3 范围
      }
      
      ctx.beginPath();
      ctx.arc(px, py, p.size * (0.5 + ease * 0.5) * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 208, 63, ${p.alpha * 0.85})`;
      ctx.fill();
    });
    
    requestAnimationFrame(render);
  }

  // 跳过功能
  function skip() {
    isAnimating = false;
    gsap.killTweensOf('*');
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => overlay.remove()
    });
  }

  overlay.addEventListener('click', skip);
  if (skipBtn) skipBtn.addEventListener('click', skip);

  // 启动
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      sampleCharacters();
      render();
      startAnimation();
    });
  } else {
    setTimeout(() => {
      sampleCharacters();
      render();
      startAnimation();
    }, 500);
  }
}

// ====== 仪表盘 ======
function initDashboard() {
  renderProgressBars(localProgress);
  renderDateAndCountdown();
}

function renderDateAndCountdown() {
  const todayContainer = document.getElementById('todayDate');
  const countdownContainer = document.getElementById('countdownCard');
  
  if (!todayContainer || !countdownContainer) return;
  
  const today = new Date();
  const schoolDate = new Date(MOCKUP_STUDENT.school_date);
  const startDate = new Date(MOCKUP_STUDENT.start_date);
  
  // 计算今天是寒假第几天
  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((schoolDate - startDate) / (1000 * 60 * 60 * 24));
  
  // 计算距离开学还有几天
  const daysUntilSchool = Math.ceil((schoolDate - today) / (1000 * 60 * 60 * 24));
  
  // 格式化今日日期
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 ${weekDays[today.getDay()]}`;
  
  // 渲染今日日期
  todayContainer.innerHTML = `
    <div class="date-big">${today.getDate()}</div>
    <div class="date-info">
      <span class="date-month">${today.getMonth() + 1}月</span>
      <span class="date-weekday">${weekDays[today.getDay()]}</span>
    </div>
  `;
  
  // 获取搞笑语录
  let quote = COUNTDOWN_QUOTES[COUNTDOWN_QUOTES.length - 1];
  for (const q of COUNTDOWN_QUOTES) {
    if (daysUntilSchool >= q.days) {
      quote = q;
      break;
    }
  }
  
  // 渲染倒计时
  if (daysUntilSchool > 0) {
    countdownContainer.innerHTML = `
      <div class="countdown-emoji">${quote.emoji}</div>
      <div class="countdown-content">
        <div class="countdown-label">距离开学</div>
        <div class="countdown-days"><span class="countdown-num">${daysUntilSchool}</span> 天</div>
        <div class="countdown-quote">${quote.text}</div>
      </div>
    `;
  } else {
    countdownContainer.innerHTML = `
      <div class="countdown-emoji">📚</div>
      <div class="countdown-content">
        <div class="countdown-label">已开学</div>
        <div class="countdown-quote">新学期加油！</div>
      </div>
    `;
  }
  
  // 更新状态卡片中的天数
  const dayNumEl = document.getElementById('dayNum');
  if (dayNumEl) {
    dayNumEl.textContent = Math.max(1, Math.min(daysPassed, totalDays));
  }
}

function renderProgressBars(progress) {
  document.getElementById('mathProgress').style.width = progress.math_progress + '%';
  document.getElementById('engProgress').style.width = progress.english_progress + '%';
  document.getElementById('habitsProgress').style.width = progress.habits_progress + '%';

  const statValues = document.querySelectorAll('.stat-value');
  statValues[0].textContent = progress.math_progress + '%';
  statValues[1].textContent = progress.english_progress + '%';
  statValues[2].textContent = progress.habits_progress + '%';
}

// ====== 本周精彩表现 ======
function initWeeklyHighlights() {
  renderWeeklyHighlights();
}

function renderWeeklyHighlights() {
  const container = document.getElementById('highlightsList');
  if (!container) return;

  container.innerHTML = WEEKLY_ACHIEVEMENTS.map(item => {
    const scoreHtml = item.score ? `<span class="highlight-score">🎯 ${item.score}</span>` : '';
    return `
      <div class="highlight-card">
        <div class="highlight-icon">${item.icon}</div>
        <div class="highlight-content">
          <div class="highlight-header">
            <span class="highlight-date">${item.date}</span>
            <span class="highlight-category">${item.category}</span>
          </div>
          <h4 class="highlight-title">${item.title}</h4>
          ${scoreHtml}
          <p class="highlight-comment">${item.comment}</p>
        </div>
      </div>
    `;
  }).join('');
}

// ====== 日历时间轴视图 ======
function initTimeline() {
  renderCalendarTimeline();
  initTimelineTouchDrag();
}

function renderCalendarTimeline() {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  
  // 生成时间轴刻度 - 点击可添加事件
  let hoursHtml = '';
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    const isNow = new Date().getHours() === h;
    hoursHtml += `
      <div class="hour-row ${isNow ? 'current-hour' : ''}" data-hour="${h}" style="height: ${HOUR_HEIGHT}px;" onclick="addEventAtHour(${h})">
        <div class="hour-label">${h < 10 ? '0' + h : h}:00</div>
        <div class="hour-line"></div>
      </div>
    `;
  }
  
  // 当前时间指示线
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const nowPosition = (currentHour - TIMELINE_START_HOUR + currentMin / 60) * HOUR_HEIGHT;
  const nowLineHtml = (currentHour >= TIMELINE_START_HOUR && currentHour <= TIMELINE_END_HOUR) ? `
    <div class="now-indicator" style="top: ${nowPosition}px;">
      <span class="now-time">${currentHour}:${currentMin < 10 ? '0' + currentMin : currentMin}</span>
      <div class="now-line"></div>
    </div>
  ` : '';
  
  // 生成事件块 - 支持右滑删除和上下拖拽
  let eventsHtml = todaySchedule.map(item => {
    const startPos = (item.startHour - TIMELINE_START_HOUR + item.startMin / 60) * HOUR_HEIGHT;
    const duration = (item.endHour - item.startHour + (item.endMin - item.startMin) / 60) * HOUR_HEIGHT;
    const height = Math.max(duration, 40);
    const timeStr = `${item.startHour}:${item.startMin < 10 ? '0' + item.startMin : item.startMin} - ${item.endHour}:${item.endMin < 10 ? '0' + item.endMin : item.endMin}`;
    
    return `
      <div class="calendar-event-wrapper" data-id="${item.id}" style="top: ${startPos}px; height: ${height}px;">
        <div class="event-delete-bg">🗑️ 删除</div>
        <div class="event-edit-bg">✏️ 编辑</div>
        <div class="calendar-event ${item.status}" 
             data-id="${item.id}"
             style="height: 100%; background: ${item.color}20; border-left: 4px solid ${item.color};"
             ontouchstart="eventTouchStart(event, ${item.id})"
             ontouchmove="eventTouchMove(event, ${item.id})"
             ontouchend="eventTouchEnd(event, ${item.id})"
             onmousedown="mouseEventDragStart(event, ${item.id})">
          <div class="event-content">
            <span class="event-icon">${item.event_icon}</span>
            <div class="event-text" onclick="openEditEventModal(${item.id})">
              <span class="event-title">${item.event_title}</span>
              <span class="event-time">${timeStr}</span>
            </div>
            <span class="event-status-icon" onclick="toggleEventStatus(event, ${item.id})">${getStatusIcon(item.status)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // 空状态提示
  const emptyHtml = todaySchedule.length === 0 
    ? '<div class="empty-schedule">📭 暂无日程<br><small>点击右上角"添加日程"开始规划</small></div>'
    : '';
  
  container.innerHTML = `
    <div class="calendar-timeline-header">
      <span>📅 今日日程</span>
      <button class="add-event-btn" onclick="showAddEventModal()">+ 添加日程</button>
    </div>
    <div class="calendar-timeline" id="calendarTimeline">
      <div class="hours-column">
        ${hoursHtml}
      </div>
      <div class="events-column" id="eventsColumn">
        ${nowLineHtml}
        ${eventsHtml}
        ${emptyHtml}
      </div>
    </div>
  `;
}

function getStatusIcon(status) {
  if (status === 'completed') return '✅';
  if (status === 'current') return '⏳';
  return '⬜';
}

// ====== 触摸事件处理 - 右滑删除 + 左滑编辑 + 上下拖拽 ======
let touchStartX = 0;
let touchStartY = 0;
let touchStartTop = 0;
let touchCurrentEvent = null;
let touchMode = null; // 'drag' | 'swipe' | null
let isDragging = false;

window.eventTouchStart = function(event, id) {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchCurrentEvent = todaySchedule.find(e => e.id === id);
  touchMode = null;
  
  const wrapper = event.target.closest('.calendar-event-wrapper');
  if (wrapper) {
    touchStartTop = parseFloat(wrapper.style.top) || 0;
  }
};

window.eventTouchMove = function(event, id) {
  if (!touchCurrentEvent) return;
  
  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  
  const eventEl = event.target.closest('.calendar-event');
  const wrapper = event.target.closest('.calendar-event-wrapper');
  if (!eventEl || !wrapper) return;
  
  // 判断滑动方向
  if (!touchMode) {
    if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > Math.abs(deltaY)) {
      touchMode = 'swipe';
      isDragging = true;
    } else if (Math.abs(deltaY) > 15 && Math.abs(deltaY) > Math.abs(deltaX)) {
      touchMode = 'drag';
      isDragging = true;
      wrapper.classList.add('dragging');
    }
  }
  
  if (touchMode === 'swipe') {
    // 左右滑动：右滑删除，左滑编辑
    const swipeX = Math.max(-120, Math.min(deltaX, 120));
    eventEl.style.transform = `translateX(${swipeX}px)`;
    
    // 显示对应背景
    const deleteBg = wrapper.querySelector('.event-delete-bg');
    const editBg = wrapper.querySelector('.event-edit-bg');
    
    if (swipeX > 0 && deleteBg) {
      // 右滑 - 显示删除
      deleteBg.style.opacity = Math.min(swipeX / 80, 1);
      if (editBg) editBg.style.opacity = '0';
    } else if (swipeX < 0 && editBg) {
      // 左滑 - 显示编辑
      editBg.style.opacity = Math.min(Math.abs(swipeX) / 80, 1);
      if (deleteBg) deleteBg.style.opacity = '0';
    }
  } else if (touchMode === 'drag') {
    // 上下拖拽 - 移动整个wrapper
    event.preventDefault();
    const newTop = touchStartTop + deltaY;
    wrapper.style.top = newTop + 'px';
  }
};

window.eventTouchEnd = function(event, id) {
  const eventEl = document.querySelector(`.calendar-event[data-id="${id}"]`);
  const wrapper = document.querySelector(`.calendar-event-wrapper[data-id="${id}"]`);
  
  if (touchMode === 'swipe' && eventEl) {
    const transform = eventEl.style.transform || '';
    const match = transform.match(/translateX\(([-\d.]+)px\)/);
    const swipeDistance = match ? parseFloat(match[1]) : 0;
    
    if (swipeDistance > 60) {
      // 右滑删除 - 滑出动画
      eventEl.style.transform = 'translateX(150%)';
      eventEl.style.opacity = '0';
      wrapper.style.transition = 'opacity 0.3s';
      wrapper.style.opacity = '0';
      setTimeout(() => {
        deleteEvent(null, id);
      }, 300);
    } else if (swipeDistance < -60) {
      // 左滑编辑 - 打开编辑弹窗
      eventEl.style.transform = 'translateX(0)';
      const editBg = wrapper?.querySelector('.event-edit-bg');
      if (editBg) editBg.style.opacity = '0';
      isDragging = false; // 重置拖拽状态再打开弹窗
      openEditEventModal(id);
    } else {
      // 恢复位置
      eventEl.style.transform = 'translateX(0)';
      if (wrapper) {
        const deleteBg = wrapper.querySelector('.event-delete-bg');
        const editBg = wrapper.querySelector('.event-edit-bg');
        if (deleteBg) deleteBg.style.opacity = '0';
        if (editBg) editBg.style.opacity = '0';
      }
    }
  } else if (touchMode === 'drag' && wrapper && touchCurrentEvent) {
    wrapper.classList.remove('dragging');
    
    const newTop = parseFloat(wrapper.style.top) || 0;
    let newStartHour = TIMELINE_START_HOUR + newTop / HOUR_HEIGHT;
    newStartHour = Math.round(newStartHour * 2) / 2;
    newStartHour = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR - 1, newStartHour));
    
    const duration = (touchCurrentEvent.endHour - touchCurrentEvent.startHour) + (touchCurrentEvent.endMin - touchCurrentEvent.startMin) / 60;
    
    touchCurrentEvent.startHour = Math.floor(newStartHour);
    touchCurrentEvent.startMin = (newStartHour % 1) * 60;
    touchCurrentEvent.endHour = Math.floor(newStartHour + duration);
    touchCurrentEvent.endMin = ((newStartHour + duration) % 1) * 60;
    
    showToast(`📍 ${touchCurrentEvent.startHour}:${touchCurrentEvent.startMin < 10 ? '0' + touchCurrentEvent.startMin : touchCurrentEvent.startMin}`);
    renderCalendarTimeline();
  }
  
  touchCurrentEvent = null;
  touchMode = null;
  setTimeout(() => { isDragging = false; }, 50);
};

// 保留旧函数兼容
function initTimelineTouchDrag() {}
window.touchDragStart = function() {};
window.touchDragMove = function() {};
window.touchDragEnd = function() {};

// 鼠标拖拽（桌面端上下移动）
window.mouseEventDragStart = function(event, id) {
  event.preventDefault();
  
  draggedEvent = todaySchedule.find(e => e.id === id);
  if (!draggedEvent) return;
  
  isDragging = true;
  dragStartY = event.clientY;
  const wrapper = event.target.closest('.calendar-event-wrapper');
  if (wrapper) {
    touchStartTop = parseFloat(wrapper.style.top) || 0;
    wrapper.classList.add('dragging');
    
    document.addEventListener('mousemove', mouseDragMove);
    document.addEventListener('mouseup', mouseDragEnd);
  }
};

function mouseDragMove(event) {
  if (!draggedEvent) return;
  
  const deltaY = event.clientY - dragStartY;
  const newTop = touchStartTop + deltaY;
  
  const wrapper = document.querySelector(`.calendar-event-wrapper[data-id="${draggedEvent.id}"]`);
  if (wrapper) {
    wrapper.style.top = newTop + 'px';
  }
}

function mouseDragEnd(event) {
  if (!draggedEvent) return;
  
  const wrapper = document.querySelector(`.calendar-event-wrapper[data-id="${draggedEvent.id}"]`);
  if (wrapper) {
    wrapper.classList.remove('dragging');
    
    const newTop = parseFloat(wrapper.style.top) || 0;
    let newStartHour = TIMELINE_START_HOUR + newTop / HOUR_HEIGHT;
    newStartHour = Math.round(newStartHour * 2) / 2;
    newStartHour = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR - 1, newStartHour));
    
    const duration = (draggedEvent.endHour - draggedEvent.startHour) + (draggedEvent.endMin - draggedEvent.startMin) / 60;
    
    draggedEvent.startHour = Math.floor(newStartHour);
    draggedEvent.startMin = (newStartHour % 1) * 60;
    draggedEvent.endHour = Math.floor(newStartHour + duration);
    draggedEvent.endMin = ((newStartHour + duration) % 1) * 60;
    
    showToast(`📍 ${draggedEvent.startHour}:${draggedEvent.startMin < 10 ? '0' + draggedEvent.startMin : draggedEvent.startMin}`);
  }
  
  document.removeEventListener('mousemove', mouseDragMove);
  document.removeEventListener('mouseup', mouseDragEnd);
  draggedEvent = null;
  renderCalendarTimeline();
  setTimeout(() => { isDragging = false; }, 50);
}

// ====== 添加日程 ======
window.addEventAtHour = function(hour) {
  showAddEventModalWithTime(hour, 0);
};

window.showAddEventModal = function() {
  const now = new Date();
  let nextHour = now.getHours() + 1;
  if (nextHour < TIMELINE_START_HOUR) nextHour = TIMELINE_START_HOUR;
  if (nextHour > TIMELINE_END_HOUR - 1) nextHour = TIMELINE_END_HOUR - 1;
  
  showAddEventModalWithTime(nextHour, 0);
};

function showAddEventModalWithTime(hour, min) {
  const modal = document.getElementById('notifyModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');
  
  if (!modal || !titleEl || !bodyEl) return;
  
  titleEl.textContent = '📅 添加新日程';
  bodyEl.innerHTML = `
    <div class="add-event-form">
      <input type="text" id="newEventTitle" placeholder="日程标题" class="form-input">
      <div class="time-row">
        <select id="newEventStartHour" class="form-select">
          ${Array.from({length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1}, (_, i) => {
            const h = TIMELINE_START_HOUR + i;
            return `<option value="${h}" ${h === hour ? 'selected' : ''}>${h < 10 ? '0' + h : h}:00</option>`;
          }).join('')}
        </select>
        <span>→</span>
        <select id="newEventEndHour" class="form-select">
          ${Array.from({length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1}, (_, i) => {
            const h = TIMELINE_START_HOUR + i;
            return `<option value="${h}" ${h === hour + 1 ? 'selected' : ''}>${h < 10 ? '0' + h : h}:00</option>`;
          }).join('')}
        </select>
      </div>
      <div class="icon-picker">
        ${['📚', '🎯', '🎹', '🏃', '✍️', '🎮', '🍽️', '😴'].map(icon => 
          `<span class="icon-option" onclick="selectEventIcon('${icon}')">${icon}</span>`
        ).join('')}
      </div>
      <input type="hidden" id="newEventIcon" value="📚">
      <div class="color-picker">
        ${['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'].map(color => 
          `<span class="color-option" style="background:${color}" onclick="selectEventColor('${color}')"></span>`
        ).join('')}
      </div>
      <input type="hidden" id="newEventColor" value="#3498db">
      <button class="submit-btn" onclick="submitNewEvent()">✨ 添加日程</button>
    </div>
  `;
  
  closeBtn.textContent = '取消';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

window.selectEventIcon = function(icon) {
  document.getElementById('newEventIcon').value = icon;
  document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
};

window.selectEventColor = function(color) {
  document.getElementById('newEventColor').value = color;
  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
};

window.submitNewEvent = async function() {
  const title = document.getElementById('newEventTitle').value.trim();
  const startHour = parseInt(document.getElementById('newEventStartHour').value);
  const endHour = parseInt(document.getElementById('newEventEndHour').value);
  const icon = document.getElementById('newEventIcon').value;
  const color = document.getElementById('newEventColor').value;
  
  if (!title) {
    showToast('请输入日程标题');
    return;
  }
  
  if (endHour <= startHour) {
    showToast('结束时间需大于开始时间');
    return;
  }
  
  const newEvent = {
    id: Date.now(),
    startHour: startHour,
    startMin: 0,
    endHour: endHour,
    endMin: 0,
    event_title: title,
    event_subtitle: '',
    event_icon: icon,
    color: color,
    status: 'pending',
    type: 'custom',
    subtasks: []
  };
  
  todaySchedule.push(newEvent);
  
  // 关闭弹窗
  const modal = document.getElementById('notifyModal');
  modal.classList.remove('show');
  
  // 显示成功动画
  showSuccessAnimation('🎉 日程已添加！');
  
  renderCalendarTimeline();
  saveAllLocalData();
  
  // 同步到 Supabase
  if (USE_SUPABASE) {
    try {
      const saved = await SupabaseClient.saveScheduleItem(newEvent);
      // 更新本地ID为Supabase返回的UUID
      if (saved && saved.id) {
        newEvent.id = saved.id;
      }
    } catch (err) {
      console.error('日程同步失败:', err);
    }
  }
};

// ====== 编辑日程 ======
window.openEditEventModal = function(id) {
  if (isDragging) return;
  const item = todaySchedule.find(e => e.id === id);
  if (!item) return;

  const modal = document.getElementById('notifyModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');
  if (!modal || !titleEl || !bodyEl) return;

  // 生成小时滚轮数据
  const hours = Array.from({length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1}, (_, i) => TIMELINE_START_HOUR + i);
  const startOptions = hours.map(h => `<div class="wheel-item ${h === item.startHour ? 'selected' : ''}" data-value="${h}">${h < 10 ? '0' + h : h}:00</div>`).join('');
  const endOptions = hours.map(h => `<div class="wheel-item ${h === item.endHour ? 'selected' : ''}" data-value="${h}">${h < 10 ? '0' + h : h}:00</div>`).join('');

  titleEl.textContent = '✏️ 修改日程';
  bodyEl.innerHTML = `
    <div class="add-event-form">
      <input type="text" id="editEventTitle" class="form-input" value="${item.event_title}" placeholder="日程标题">
      
      <label style="display:block; margin: 16px 0 8px; font-size: 0.85rem; color: rgba(255,255,255,0.6);">开始时间</label>
      <div class="wheel-column">
        <div class="wheel-scroll" id="wheelStart" onclick="selectWheelHour('start', event)">
          ${startOptions}
        </div>
      </div>
      
      <label style="display:block; margin: 16px 0 8px; font-size: 0.85rem; color: rgba(255,255,255,0.6);">结束时间</label>
      <div class="wheel-column">
        <div class="wheel-scroll" id="wheelEnd" onclick="selectWheelHour('end', event)">
          ${endOptions}
        </div>
      </div>
      
      <input type="hidden" id="editStartHour" value="${item.startHour}">
      <input type="hidden" id="editEndHour" value="${item.endHour}">
      
      <div class="icon-picker">
        ${['📚', '🎯', '🎹', '🏃', '✍️', '🎮', '🍽️', '😴'].map(icon => 
          `<span class="icon-option ${icon === item.event_icon ? 'selected' : ''}" onclick="selectEventIcon('${icon}')">${icon}</span>`
        ).join('')}
      </div>
      <input type="hidden" id="newEventIcon" value="${item.event_icon}">
      
      <div class="color-picker">
        ${['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'].map(color => 
          `<span class="color-option ${color === item.color ? 'selected' : ''}" style="background:${color}" onclick="selectEventColor('${color}')"></span>`
        ).join('')}
      </div>
      <input type="hidden" id="newEventColor" value="${item.color}">
      
      <button class="submit-btn" style="margin-top: 20px;" onclick="submitEditEvent(${id})">✅ 保存修改</button>
    </div>
  `;

  closeBtn.textContent = '取消';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
};

// 滚轮选择时间
window.selectWheelHour = function(type, event) {
  const target = event.target.closest('.wheel-item');
  if (!target) return;
  
  const value = target.dataset.value;
  if (type === 'start') {
    document.getElementById('editStartHour').value = value;
  } else {
    document.getElementById('editEndHour').value = value;
  }
  
  // 更新选中状态
  const container = type === 'start' ? document.getElementById('wheelStart') : document.getElementById('wheelEnd');
  container.querySelectorAll('.wheel-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.value === value);
  });
};

window.submitEditEvent = async function(id) {
  const item = todaySchedule.find(e => e.id === id);
  if (!item) return;

  const title = document.getElementById('editEventTitle').value.trim();
  const startHour = parseInt(document.getElementById('editStartHour').value || item.startHour);
  const endHour = parseInt(document.getElementById('editEndHour').value || item.endHour);
  const icon = document.getElementById('newEventIcon').value;
  const color = document.getElementById('newEventColor').value;

  if (!title) {
    showToast('请输入日程标题');
    return;
  }
  if (endHour <= startHour) {
    showToast('结束时间需大于开始时间');
    return;
  }

  item.event_title = title;
  item.startHour = startHour;
  item.endHour = endHour;
  item.startMin = 0;
  item.endMin = 0;
  item.event_icon = icon;
  item.color = color;

  const modal = document.getElementById('notifyModal');
  modal.classList.remove('show');

  showSuccessAnimation('✨ 日程已更新');
  renderCalendarTimeline();
  saveAllLocalData();
  
  // 同步到 Supabase
  if (USE_SUPABASE) {
    try {
      await SupabaseClient.saveScheduleItem(item);
    } catch (err) {
      console.error('日程更新同步失败:', err);
    }
  }
};

// 删除事件
window.deleteEvent = async function(event, id) {
  if (event) event.stopPropagation();
  
  const idx = todaySchedule.findIndex(e => e.id === id);
  if (idx !== -1) {
    const item = todaySchedule[idx];
    todaySchedule.splice(idx, 1);
    showToast('🗑️ 已删除');
    renderCalendarTimeline();
    saveAllLocalData();
    
    // 同步到 Supabase
    if (USE_SUPABASE && item.id) {
      try {
        await SupabaseClient.deleteScheduleItem(item.id);
      } catch (err) {
        console.error('日程删除同步失败:', err);
      }
    }
  }
};

// 切换完成状态
window.toggleEventStatus = async function(e, id) {
  e.stopPropagation(); // 阻止冒泡
  const item = todaySchedule.find(ev => ev.id === id);
  if (!item) return;
  
  if (item.status === 'completed') {
    item.status = 'pending';
    showToast('已取消完成');
  } else {
    item.status = 'completed';
    showSuccessAnimation('✅ 任务完成！');
  }
  renderCalendarTimeline();
  saveAllLocalData();
  
  // 同步到 Supabase
  if (USE_SUPABASE) {
    try {
      await SupabaseClient.saveScheduleItem(item);
    } catch (err) {
      console.error('日程状态同步失败:', err);
    }
  }
};

// ====== 成功动画 ======
function showSuccessAnimation(message) {
  // 创建全屏动画层
  const overlay = document.createElement('div');
  overlay.className = 'success-animation-overlay';
  overlay.innerHTML = `
    <div class="success-content">
      <div class="success-icon">🎊</div>
      <div class="success-message">${message}</div>
      <div class="confetti-container" id="confettiContainer"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // 添加彩带/confetti效果
  const confettiContainer = overlay.querySelector('#confettiContainer');
  const colors = ['#f4d03f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#ff6b81'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (1 + Math.random()) + 's';
    confettiContainer.appendChild(confetti);
  }
  
  // 自动关闭
  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 300);
  }, 1500);
}

// 保留旧的拖拽函数兼容
window.handleDragStart = function(event, id) {};
window.handleDragEnd = function(event) {};
window.handleDragOver = function(event) { event.preventDefault(); };
window.handleDrop = function(event) { event.preventDefault(); };
window.showEventModal = function(id) { toggleEventStatus(id); };

window.handleTimelineClick = function handleTimelineClick(id) {
  const item = todaySchedule.find(t => t.id === id);
  if (!item) return;
  
  if (item.status === 'completed') {
    item.status = 'pending';
  } else {
    item.status = 'completed';
  }
  renderCalendarTimeline();
  showToast(item.status === 'completed' ? '✅ 已完成' : '已取消完成');
};

window.removeFromSchedule = function removeFromSchedule(event, id) {
  event.stopPropagation();
  const idx = todaySchedule.findIndex(t => t.id === id);
  if (idx !== -1 && todaySchedule[idx].type === 'activity') {
    todaySchedule.splice(idx, 1);
    renderCalendarTimeline();
    showToast('已从日程移除');
  }
};

// ====== 子任务管理 ======
window.showAddSubtask = function showAddSubtask(event, scheduleId) {
  event.stopPropagation();
  const text = prompt('输入待办事项：');
  if (text && text.trim()) {
    addSubtask(scheduleId, text.trim());
  }
};

function addSubtask(scheduleId, text) {
  const item = todaySchedule.find(t => t.id === scheduleId);
  if (!item) return;
  
  if (!item.subtasks) item.subtasks = [];
  item.subtasks.push({
    id: Date.now(),
    text: text,
    done: false
  });
  
  renderCalendarTimeline();
  showToast('✅ 待办已添加');
}

window.toggleSubtask = function toggleSubtask(event, scheduleId, subtaskId) {
  event.stopPropagation();
  const item = todaySchedule.find(t => t.id === scheduleId);
  if (!item || !item.subtasks) return;
  
  const subtask = item.subtasks.find(s => s.id === subtaskId);
  if (subtask) {
    subtask.done = !subtask.done;
    renderCalendarTimeline();
    showToast(subtask.done ? '✅ 完成' : '已取消完成');
  }
};

window.deleteSubtask = function deleteSubtask(event, scheduleId, subtaskId) {
  event.stopPropagation();
  const item = todaySchedule.find(t => t.id === scheduleId);
  if (!item || !item.subtasks) return;
  
  const idx = item.subtasks.findIndex(s => s.id === subtaskId);
  if (idx !== -1) {
    item.subtasks.splice(idx, 1);
    renderCalendarTimeline();
    showToast('已删除待办');
  }
};

// ====== 习惯打卡 ======
function initHabits() {
  HABIT_KEYS.forEach(habitType => {
    const card = document.getElementById(`habit-${habitType}`);
    if (card) {
      card.classList.toggle('checked', localHabits[habitType]);
    }
  });
}

// 习惯数据（可编辑）
let habitsData = {
  wake: { name: '早起', subtitle: '7:30前起床', icon: '🌅' },
  piano: { name: '练琴', subtitle: '30分钟', icon: '🎹' },
  exercise: { name: '运动', subtitle: '30分钟', icon: '🏃' },
  read: { name: '阅读', subtitle: '30分钟', icon: '📖' },
  spine: { name: '李医生脊椎操', subtitle: '睡前五套动作', icon: '🧘' },
  math: { name: '数学复习', subtitle: '费曼笔记法', icon: '📝' },
  sleep: { name: '早睡', subtitle: '22:00前', icon: '🌙' }
};

// 从localStorage加载习惯数据
function loadHabitsData() {
  const saved = localStorage.getItem('habitsData');
  if (saved) {
    try {
      habitsData = JSON.parse(saved);
    } catch (e) {
      console.warn('habitsData解析失败，使用默认值');
      localStorage.removeItem('habitsData');
    }
  }
}

// 保存习惯数据
function saveHabitsData() {
  localStorage.setItem('habitsData', JSON.stringify(habitsData));
}

// 渲染习惯列表
function renderHabits() {
  const grid = document.getElementById('habitsGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  Object.keys(habitsData).forEach(id => {
    const h = habitsData[id];
    const isChecked = localHabits[id];
    
    const card = document.createElement('div');
    card.className = `habit-card${isChecked ? ' checked' : ''}`;
    card.id = `habit-${id}`;
    card.onclick = () => toggleHabit(id);
    
    card.innerHTML = `
      <span class="habit-icon">${h.icon}</span>
      <div class="habit-content">
        <span class="habit-name">${h.name}</span>
        <span class="habit-subtitle">${h.subtitle}</span>
      </div>
      <div class="habit-check"></div>
      <button class="habit-edit-btn" onclick="editHabit(event, '${id}')">✏️</button>
    `;
    
    grid.appendChild(card);
  });
}

// 编辑习惯
let currentEditHabitId = null;
let selectedHabitIcon = null;

window.editHabit = function(e, id) {
  e.stopPropagation();
  currentEditHabitId = id;
  const h = habitsData[id];
  
  document.getElementById('editHabitId').value = id;
  document.getElementById('editHabitName').value = h.name;
  document.getElementById('editHabitSubtitle').value = h.subtitle;
  
  // 重置图标选择
  document.querySelectorAll('#habitIconPicker .icon-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.icon === h.icon);
    if (opt.dataset.icon === h.icon) {
      selectedHabitIcon = h.icon;
    }
  });
  
  document.getElementById('editHabitModal').classList.add('show');
};

window.closeEditHabitModal = function() {
  document.getElementById('editHabitModal').classList.remove('show');
  currentEditHabitId = null;
};

window.saveHabitEdit = function() {
  if (!currentEditHabitId) return;
  
  const name = document.getElementById('editHabitName').value.trim();
  const subtitle = document.getElementById('editHabitSubtitle').value.trim();
  
  if (!name) {
    showToast('请输入名称');
    return;
  }
  
  habitsData[currentEditHabitId].name = name;
  habitsData[currentEditHabitId].subtitle = subtitle;
  if (selectedHabitIcon) {
    habitsData[currentEditHabitId].icon = selectedHabitIcon;
  }
  
  saveHabitsData();
  renderHabits();
  showToast('✅ 习惯已更新');
  
  closeEditHabitModal();
};

// 图标选择事件
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#habitIconPicker .icon-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#habitIconPicker .icon-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedHabitIcon = opt.dataset.icon;
    });
  });
  
  loadHabitsData();
  renderHabits();
});

window.toggleHabit = async function toggleHabit(habitType) {
  localHabits[habitType] = !localHabits[habitType];
  
  const card = document.getElementById(`habit-${habitType}`);
  if (card) {
    card.classList.toggle('checked', localHabits[habitType]);
  }

  recalculateHabitsProgress();
  showToast(localHabits[habitType] ? '✅ 已打卡' : '已取消打卡');
  
  // 同步到Supabase
  if (USE_SUPABASE) {
    try {
      await SupabaseClient.toggleHabit(habitType);
    } catch (err) {
      console.error('习惯同步失败:', err);
    }
  }
};

async function recalculateHabitsProgress() {
  const completed = HABIT_KEYS.filter(k => localHabits[k]).length;
  localProgress.habits_progress = Math.round((completed / HABIT_KEYS.length) * 100);
  renderProgressBars(localProgress);
  saveAllLocalData();
  
  // 同步进度到Supabase
  if (USE_SUPABASE) {
    try {
      await SupabaseClient.updateProgress('habits', localProgress.habits_progress);
    } catch (err) {
      console.error('进度同步失败:', err);
    }
  }
}

// ====== 每日选择 ======
window.selectChoice = async function selectChoice(element) {
  document.querySelectorAll('.choice-card').forEach(card => {
    card.classList.remove('selected');
  });

  element.classList.add('selected');
  const interest = element.dataset.interest;

  if (interest && localInterests[interest] !== undefined) {
    localInterests[interest] = Math.min(100, localInterests[interest] + 10);
    drawRadarChart(localInterests);
    saveAllLocalData();
    
    // 同步到 Supabase
    if (USE_SUPABASE) {
      try {
        await SupabaseClient.updateInterest(interest, 10);
      } catch (err) {
        console.error('兴趣同步失败:', err);
      }
    }
  }

  element.style.transform = 'scale(1.05)';
  setTimeout(() => {
    element.style.transform = '';
  }, 200);

  showToast('✅ 已记录选择');
};

// ====== 兴趣雷达 ======
function initRadarChart() {
  drawRadarChart(localInterests);
}

function drawRadarChart(interests) {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = 120;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const labels = ['历史', '工程', '音乐', '武术', '逻辑', '艺术'];
  const keys = ['history', 'engineering', 'music', 'martial', 'logic', 'art'];
  const values = keys.map(k => (interests[k] || 0) / 100);
  const numPoints = labels.length;
  const angleStep = (Math.PI * 2) / numPoints;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  for (let level = 1; level <= 4; level++) {
    ctx.beginPath();
    const r = (maxRadius / 4) * level;
    for (let i = 0; i <= numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + maxRadius * Math.cos(angle),
      centerY + maxRadius * Math.sin(angle)
    );
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i <= numPoints; i++) {
    const idx = i % numPoints;
    const angle = idx * angleStep - Math.PI / 2;
    const r = values[idx] * maxRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  gradient.addColorStop(0, 'rgba(244, 208, 63, 0.3)');
  gradient.addColorStop(1, 'rgba(244, 208, 63, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = 'rgba(244, 208, 63, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f4d03f';
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = values[i] * maxRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '12px "Noto Sans SC"';
  ctx.textAlign = 'center';

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = maxRadius + 20;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    ctx.fillText(labels[i], x, y + 4);
  }
}

// ====== 奖励系统 ======
function initRewards() {
  renderRewards();
}

function renderRewards() {
  const container = document.getElementById('rewardsGrid');
  if (!container) return;

  container.innerHTML = REWARDS.map(reward => {
    const downloadLink = reward.stl && reward.unlocked ? `
        <a class="reward-download" href="${reward.stl}" download>下载STL</a>
      ` : '';
    return `
      <div class="reward-card ${reward.unlocked ? 'unlocked' : 'locked'}">
        <div class="reward-model">${reward.unlocked ? reward.icon : '🔒'}</div>
        <span class="reward-name">${reward.name}</span>
        <span class="reward-status">${reward.unlocked ? '已解锁' : reward.condition}</span>
        ${downloadLink}
      </div>
    `;
  }).join('');
}

// ====== 成就系统 ======
function initAchievements() {
  renderAchievements();
}

function renderAchievements() {
  const container = document.getElementById('achievementsGrid');
  if (!container) return;

  container.innerHTML = ACHIEVEMENTS.map(achievement => `
    <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <span class="achievement-name">${achievement.name}</span>
        <span class="achievement-desc">${achievement.desc}</span>
      </div>
    </div>
  `).join('');
}

// ====== 城市活动 ======
const CATEGORY_COLORS = {
  '展览': '#e74c3c',
  'AI科技': '#3498db',
  '武术体育': '#27ae60',
  '比赛': '#9b59b6',
  '创客STEM': '#f39c12',
  '展会': '#1abc9c',
  '活动': '#e67e22',
  '科普': '#00bcd4',
  '春节花市': '#ff6b81',
  '春节活动': '#ff4757',
  '灯光秀': '#ffa502',
  '灯会': '#ff6348',
  '书城活动': '#2ed573',
  '公园': '#7bed9f'
};

function initEvents() {
  renderEvents('shenzhen');
}

window.selectCity = function selectCity(event, city) {
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  renderEvents(city);
};

function renderEvents(city) {
  const eventsList = document.getElementById('eventsList');
  if (!eventsList) return;
  
  const events = CITY_EVENTS[city] || [];

  eventsList.innerHTML = events.map((e, idx) => {
    const categoryColor = CATEGORY_COLORS[e.category] || '#888';
    const categoryTag = e.category ? `<span class="event-category" style="background:${categoryColor}20;color:${categoryColor}">${e.category}</span>` : '';
    
    return `
    <div class="event-card">
      <div class="event-date">
        <span class="month">${e.month}</span>
        <span class="day">${e.day}</span>
      </div>
      <div class="event-details">
        ${categoryTag}
        <span class="event-title-text">${e.title}</span>
        <p class="event-desc">${e.desc}</p>
        <div class="event-meta">
          <span class="event-location">📍 ${e.location}</span>
          <span class="event-price">🎫 ${e.price}</span>
        </div>
      </div>
      <button class="event-add-btn" onclick="addEventToSchedule('${city}', ${idx})" title="添加">+</button>
    </div>
  `;
  }).join('');
}

// 添加活动到今日日程
window.addEventToSchedule = function addEventToSchedule(city, idx) {
  const event = CITY_EVENTS[city]?.[idx];
  if (!event) return;

  // 检查是否已添加
  const exists = todaySchedule.some(t => t.event_title === event.title && t.type === 'activity');
  if (exists) {
    showToast('该活动已在日程中');
    return;
  }

  const newId = Date.now();
  todaySchedule.push({
    id: newId,
    startHour: 9,
    startMin: 0,
    endHour: 10,
    endMin: 0,
    event_title: event.title,
    event_subtitle: event.location,
    event_icon: getCategoryIcon(event.category),
    status: 'pending',
    type: 'activity'
  });

  saveAllLocalData();
  renderCalendarTimeline();
  showSuccessAnimation('🎉 已添加到今日日程！');
};

function getCategoryIcon(category) {
  const icons = {
    '展览': '🖼️',
    'AI科技': '🤖',
    '武术体育': '⚔️',
    '比赛': '🏆',
    '创客STEM': '🔧',
    '展会': '🎪',
    '活动': '🎉',
    '科普': '🔬',
    '春节花市': '🌸',
    '春节活动': '🧧',
    '灯光秀': '✨',
    '灯会': '🏮',
    '书城活动': '📚',
    '公园': '🌳'
  };
  return icons[category] || '📍';
}

window.showEventDetail = function showEventDetail(title) {
  showModal('📍 活动详情', title + '\n\n请通过官方渠道预约参与');
};

// ====== 照片上传 ======
window.handlePhotoUpload = function handlePhotoUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      userPhotos.push({
        id: Date.now(),
        src: e.target.result,
        date: new Date().toLocaleDateString('zh-CN')
      });
      renderPhotoGrid();
    };
    reader.readAsDataURL(file);
  });

  showToast(`已上传 ${files.length} 张照片`);
};

function renderPhotoGrid() {
  const container = document.getElementById('photoGrid');
  if (!container) return;

  if (userPhotos.length === 0) {
    container.innerHTML = '<p class="no-photos">还没有照片，快来记录你的修炼日记吧！</p>';
    return;
  }

  container.innerHTML = userPhotos.map(photo => `
    <div class="photo-item">
      <img src="${photo.src}" alt="修炼日记" onclick="viewPhoto('${photo.id}')">
      <span class="photo-date">${photo.date}</span>
    </div>
  `).join('');
}

window.viewPhoto = function viewPhoto(id) {
  const photo = userPhotos.find(p => p.id == id);
  if (photo) {
    showModal('📸 修炼日记', '');
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
      modalBody.innerHTML = `<img src="${photo.src}" style="max-width:100%;border-radius:8px;">`;
    }
  }
};

// ====== 头像选择 ======
window.showAvatarPicker = function showAvatarPicker() {
  const picker = document.getElementById('avatarPicker');
  const grid = document.getElementById('avatarGrid');
  
  if (!picker || !grid) return;
  
  // 切换显示
  picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
  
  // 渲染头像选项
  grid.innerHTML = AVATAR_OPTIONS.map(avatar => `
    <div class="avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}" 
         onclick="selectAvatar('${avatar.id}')">
      <span class="avatar-emoji">${avatar.emoji}</span>
      <span class="avatar-name">${avatar.name}</span>
      <span class="avatar-desc">${avatar.desc}</span>
    </div>
  `).join('');
};

window.selectAvatar = function selectAvatar(avatarId) {
  selectedAvatar = avatarId;
  const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
  
  if (avatar) {
    // 更新头像显示
    const profileAvatar = document.getElementById('profileAvatar');
    const headerAvatar = document.querySelector('.user-avatar');
    const profileTitle = document.getElementById('profileTitle');
    
    if (profileAvatar) profileAvatar.textContent = avatar.emoji;
    if (headerAvatar) headerAvatar.textContent = avatar.emoji;
    if (profileTitle) profileTitle.textContent = avatar.desc;
    
    // 重新渲染选择器
    showAvatarPicker();
    showAvatarPicker();
    
    showToast(`已切换为「${avatar.name}」`);
  }
};

// ====== 个人信息 ======
function initProfile() {
  const daysEl = document.getElementById('profileDays');
  const achievementsEl = document.getElementById('profileAchievements');
  const rewardsEl = document.getElementById('profileRewards');
  
  if (daysEl) daysEl.textContent = MOCKUP_STUDENT.current_day;
  if (achievementsEl) achievementsEl.textContent = ACHIEVEMENTS.filter(a => a.unlocked).length;
  if (rewardsEl) rewardsEl.textContent = REWARDS.filter(r => r.unlocked).length;
  
  renderPhotoGrid();
  renderAvatarGrid();
}

function renderAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  if (!grid) return;
  
  grid.innerHTML = AVATAR_OPTIONS.map(avatar => `
    <div class="avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}" 
         onclick="selectAvatar('${avatar.id}')">
      <span class="avatar-emoji">${avatar.emoji}</span>
      <span class="avatar-name">${avatar.name}</span>
      <span class="avatar-desc">${avatar.desc}</span>
    </div>
  `).join('');
}

// ====== Tab 切换 ======
window.switchTab = function switchTab(event, tab) {
  currentTab = tab;
  
  // 切换导航按钮状态
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.nav-item').classList.add('active');

  // 切换内容显示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = content.dataset.tab === tab ? 'block' : 'none';
  });

  // 切换到修炼页时重绘雷达图
  if (tab === 'quests') {
    setTimeout(() => drawRadarChart(localInterests), 100);
  }
};

// ====== 工具函数 ======
window.showToast = function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 12px 24px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 3000;
    animation: fadeInUp 0.3s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

function bindModal() {
  const modal = document.getElementById('notifyModal');
  const closeBtn = document.getElementById('modalClose');
  if (!modal || !closeBtn) return;
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  });
}

function showModal(title, body) {
  const modal = document.getElementById('notifyModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.textContent = body;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function setOfflineBadge(show) {
  const badge = document.getElementById('offlineBadge');
  if (badge) {
    badge.style.display = show ? 'inline-block' : 'none';
  }
}

// ====== 寒假电影数据 ======
const WINTER_MOVIES = [
  {
    id: 'movie_1',
    title: '熊出没·年年有熊',
    date: '2月17日',
    emoji: '🐻',
    desc: '熊强三人组获得奇遇解锁属性之力，熊二头上生角威风凛凛，光头强长出浓密秀发，颠覆以往形象！',
    type: '动画/喜剧',
    rating: '⭐⭐⭐⭐⭐'
  },
  {
    id: 'movie_2',
    title: '星河入梦',
    date: '2月',
    emoji: '🌙',
    desc: '韩延执导，王鹤棣、宋茜主演。虚拟梦境系统"良梦"问世，人们可在梦中随心所欲，但危机悄然而至。中国版《盗梦空间》！',
    type: '奇幻/冒险',
    rating: '⭐⭐⭐⭐'
  },
  {
    id: 'movie_3',
    title: '惊蛰无声',
    date: '2月17日',
    emoji: '🎬',
    desc: '张艺谋执导的最新力作，大年初一上映。悬疑大片，值得期待！',
    type: '悬疑/剧情',
    rating: '⭐⭐⭐⭐⭐'
  },
  {
    id: 'movie_4',
    title: '飞驰人生3',
    date: '2月',
    emoji: '🚗',
    desc: '韩寒执导，沈腾主演。飞驰人生系列最新作，赛车手热血归来！',
    type: '喜剧/运动',
    rating: '⭐⭐⭐⭐'
  },
  {
    id: 'movie_5',
    title: '镖人：风起大漠',
    date: '2月',
    emoji: '⚔️',
    desc: '根据同名国漫改编，隋末唐初的侠客故事，仗剑天涯，快意恩仇！',
    type: '武侠/动作',
    rating: '⭐⭐⭐⭐'
  },
  {
    id: 'movie_6',
    title: '年年有余',
    date: '1月24日',
    emoji: '🐟',
    desc: '喜剧/动画/冒险，85分钟。讲述关于成长与团圆的故事，适合全家观看。',
    type: '动画/家庭',
    rating: '⭐⭐⭐⭐'
  }
];

// 渲染电影卡片
function renderMovies() {
  const container = document.getElementById('movieGrid');
  if (!container) return;
  
  container.innerHTML = WINTER_MOVIES.map(movie => `
    <div class="movie-card" onclick="addMovieToSchedule('${movie.id}')">
      <div class="movie-poster">${movie.emoji}</div>
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-date">📅 ${movie.date}</div>
        <div class="movie-desc">${movie.desc}</div>
      </div>
    </div>
  `).join('');
}

// 添加电影到日程
window.addMovieToSchedule = function(movieId) {
  const movie = WINTER_MOVIES.find(m => m.id === movieId);
  if (!movie) return;
  
  // 检查是否已添加
  const exists = todaySchedule.some(t => t.event_title === movie.title && t.type === 'activity');
  if (exists) {
    showToast('该电影已在日程中');
    return;
  }
  
  todaySchedule.push({
    id: Date.now(),
    startHour: 14,
    startMin: 0,
    endHour: 16,
    endMin: 0,
    event_title: movie.title,
    event_subtitle: `${movie.type} | ${movie.rating}`,
    event_icon: '🎬',
    status: 'pending',
    type: 'activity'
  });
  
  saveAllLocalData();
  renderCalendarTimeline();
  showSuccessAnimation('🎬 已添加观影计划！');
};

// 页面加载时渲染电影
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(renderMovies, 100);
});
