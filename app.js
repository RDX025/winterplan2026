// ====== 纯前端 Mockup 版本 - 不依赖 Supabase ======

const HABIT_KEYS = ['wake', 'piano', 'exercise', 'read', 'sleep', 'math'];
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
  start_date: '2026-02-01',
  current_day: 7
};

const MOCKUP_PROGRESS = {
  math_progress: 45,
  english_progress: 35,
  habits_progress: 60
};

// 今日日程（可动态添加活动）
let todaySchedule = [
  { id: 1, time: '08:00', event_title: '英语课', event_subtitle: '2小时', event_icon: '📖', status: 'completed', type: 'fixed' },
  { id: 2, time: '10:00', event_title: '自由探索时间', event_subtitle: '选择你的冒险', event_icon: '🎯', status: 'current', type: 'fixed' },
  { id: 3, time: '14:00', event_title: '数学课', event_subtitle: '2小时', event_icon: '🧮', status: 'pending', type: 'fixed' },
  { id: 4, time: '16:00', event_title: '兴趣发现时间', event_subtitle: '解锁新技能', event_icon: '⚔️', status: 'pending', type: 'fixed' },
  { id: 5, time: '19:00', event_title: '琴剑修炼', event_subtitle: '钢琴 + 运动', event_icon: '🎹', status: 'pending', type: 'fixed' }
];

// ====== 本周精彩表现（已完成成就）======
const WEEKLY_ACHIEVEMENTS = [
  { 
    date: '2月3日', 
    title: 'Impromptu Speech 即兴演讲',
    category: '音乐表达',
    icon: '🎤',
    score: null,
    comment: '表现自信大方，语言流畅！',
    photo: null
  },
  { 
    date: '2月5日', 
    title: '桃李未来数学思维课',
    category: '数学逻辑',
    icon: '🧮',
    score: null,
    comment: '积极参与课堂讨论，思维活跃！',
    photo: null
  },
  { 
    date: '2月6日', 
    title: 'Beach 英语测试',
    category: '英语能力',
    icon: '📝',
    score: '84/90',
    comment: '太棒了！接近满分！',
    photo: null
  }
];

// 用户上传的照片
let userPhotos = [];

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

// ====== 初始化 ======
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setOfflineBadge(false);
  bindModal();
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

function initDayNumber() {
  document.getElementById('dayNum').textContent = MOCKUP_STUDENT.current_day;
}

// ====== 仪表盘 ======
function initDashboard() {
  renderProgressBars(localProgress);
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

// ====== 课程时间线 ======
function initTimeline() {
  renderTimeline(todaySchedule);
}

function renderTimeline(timeline) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  
  container.innerHTML = timeline.map(item => {
    const isActivity = item.type === 'activity';
    const deleteBtn = isActivity ? `<button class="timeline-delete" onclick="removeFromSchedule(event, ${item.id})">✕</button>` : '';
    return `
    <div class="timeline-item ${item.status} ${isActivity ? 'activity' : ''}" data-id="${item.id}" onclick="handleTimelineClick(${item.id})">
      <div class="time">${item.time}</div>
      <div class="event">
        <span class="event-icon">${item.event_icon || '📘'}</span>
        <div class="event-info">
          <span class="event-title">${item.event_title}</span>
          <span class="event-subtitle">${item.event_subtitle || ''}</span>
        </div>
        <span class="event-status">${getStatusIcon(item.status)}</span>
        ${deleteBtn}
      </div>
    </div>
  `;
  }).join('');
}

function getStatusIcon(status) {
  if (status === 'completed') return '✅';
  if (status === 'current') return '⏳';
  return '⬜';
}

window.handleTimelineClick = function handleTimelineClick(id) {
  const item = todaySchedule.find(t => t.id === id);
  if (!item) return;
  
  if (item.status === 'completed') {
    showToast('已完成该任务');
  } else if (item.status === 'current' || item.status === 'pending') {
    item.status = 'completed';
    renderTimeline(todaySchedule);
    showToast('✅ 打卡成功');
  }
};

window.removeFromSchedule = function removeFromSchedule(event, id) {
  event.stopPropagation();
  const idx = todaySchedule.findIndex(t => t.id === id);
  if (idx !== -1 && todaySchedule[idx].type === 'activity') {
    todaySchedule.splice(idx, 1);
    renderTimeline(todaySchedule);
    showToast('已从日程移除');
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

window.toggleHabit = function toggleHabit(habitType) {
  localHabits[habitType] = !localHabits[habitType];
  
  const card = document.getElementById(`habit-${habitType}`);
  if (card) {
    card.classList.toggle('checked', localHabits[habitType]);
  }

  recalculateHabitsProgress();
  showToast(localHabits[habitType] ? '✅ 已打卡' : '已取消打卡');
};

function recalculateHabitsProgress() {
  const completed = HABIT_KEYS.filter(k => localHabits[k]).length;
  localProgress.habits_progress = Math.round((completed / HABIT_KEYS.length) * 100);
  renderProgressBars(localProgress);
}

// ====== 每日选择 ======
window.selectChoice = function selectChoice(element) {
  document.querySelectorAll('.choice-card').forEach(card => {
    card.classList.remove('selected');
  });

  element.classList.add('selected');
  const interest = element.dataset.interest;

  if (interest && localInterests[interest] !== undefined) {
    localInterests[interest] = Math.min(100, localInterests[interest] + 10);
    drawRadarChart(localInterests);
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
    const categoryTag = e.category ? `<span class="event-category" style="background:${categoryColor}">${e.category}</span>` : '';
    const eventId = `${city}_${idx}`;
    return `
    <div class="event-card">
      <div class="event-date">
        <span class="month">${e.month}</span>
        <span class="day">${e.day}</span>
      </div>
      <div class="event-details">
        ${categoryTag}
        <h3>${e.title}</h3>
        <p>📍 ${e.location}</p>
        <p>🎫 ${e.price}</p>
        <p class="event-desc">${e.desc}</p>
      </div>
      <div class="event-actions">
        <button class="event-action add-schedule" onclick="addEventToSchedule('${city}', ${idx})">📅 加入日程</button>
      </div>
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
    time: '待定',
    event_title: event.title,
    event_subtitle: event.location,
    event_icon: getCategoryIcon(event.category),
    status: 'pending',
    type: 'activity'
  });

  renderTimeline(todaySchedule);
  showToast('✅ 已添加到今日日程');
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

// ====== 个人信息 ======
function initProfile() {
  const daysEl = document.getElementById('profileDays');
  const achievementsEl = document.getElementById('profileAchievements');
  const rewardsEl = document.getElementById('profileRewards');
  
  if (daysEl) daysEl.textContent = MOCKUP_STUDENT.current_day;
  if (achievementsEl) achievementsEl.textContent = ACHIEVEMENTS.filter(a => a.unlocked).length;
  if (rewardsEl) rewardsEl.textContent = REWARDS.filter(r => r.unlocked).length;
  
  renderPhotoGrid();
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
