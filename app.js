import {
  getStudent,
  getTodayProgress,
  updateProgress,
  getTodayHabits,
  toggleHabit as toggleHabitDB,
  getOrCreateInterests,
  updateInterest,
  recordChoice,
  getTodayTimeline,
  createTodayTimeline,
  updateTimelineStatus,
  getUnlockedRewards,
  unlockReward,
  getAchievements,
  addAchievement,
  countMathCompletedDays,
  countHabitsCompletedDays,
  countHabitChecks
} from './supabase-client.js';

const HABIT_KEYS = ['wake', 'piano', 'exercise', 'read', 'sleep', 'math'];
const CHOICE_TITLE_MAP = {
  engineering: '打印历史名剑',
  music: '学一首古风曲',
  history: '读三国故事',
  logic: '数学解谜挑战'
};

const CACHE_PREFIX = 'jkx_cache_';
const QUEUE_KEY = 'jkx_action_queue';

let cachedInterests = null;
let cachedProgress = null;
let cachedCurrentDay = null;

const REWARDS = [
  {
    name: '青龙偃月刀',
    icon: '⚔️',
    condition: '新手礼包',
    stl: 'assets/stl/qinglong_yanyuedao.stl',
    check: async () => true
  },
  {
    name: '方天画戟',
    icon: '🔒',
    condition: '完成3天数学',
    stl: 'assets/stl/fangtian_huaji.stl',
    check: async () => (await countMathCompletedDays()) >= 3
  },
  {
    name: '丈八蛇矛',
    icon: '🔒',
    condition: '完成5天打卡',
    stl: 'assets/stl/zhangba_shemao.stl',
    check: async () => (await countHabitsCompletedDays()) >= 5
  },
  {
    name: '诸葛连弩',
    icon: '🔒',
    condition: '数学进阶挑战',
    stl: 'assets/stl/zhugeliannu.stl',
    check: async () => (await countMathCompletedDays()) >= 7
  }
];

const ACHIEVEMENTS = [
  { name: '初入江湖', desc: '完成第1天', icon: '🎖️', check: async () => (await getCurrentDay()) >= 1 },
  { name: '勤学苦练', desc: '连续3天完成所有任务', icon: '🏆', check: async () => (await countHabitsCompletedDays()) >= 3 },
  { name: '持之以恒', desc: '完成7天打卡', icon: '🧭', check: async () => (await countHabitsCompletedDays()) >= 7 },
  { name: '半程侠影', desc: '完成第7天', icon: '🥋', check: async () => (await getCurrentDay()) >= 7 },
  { name: '登峰造极', desc: '完成14天打卡', icon: '🗡️', check: async () => (await getCurrentDay()) >= 14 },
  { name: '琴剑双修', desc: '完成5次钢琴+运动', icon: '🎹', check: async () => (await countHabitChecks('piano')) >= 5 && (await countHabitChecks('exercise')) >= 5 },
  { name: '晨光侠客', desc: '早起打卡5天', icon: '🌅', check: async () => (await countHabitChecks('wake')) >= 5 },
  { name: '夜行不辍', desc: '早睡打卡5天', icon: '🌙', check: async () => (await countHabitChecks('sleep')) >= 5 },
  { name: '博览群书', desc: '阅读打卡7天', icon: '📚', check: async () => (await countHabitChecks('read')) >= 7 },
  { name: '运动达人', desc: '运动打卡7天', icon: '🏃', check: async () => (await countHabitChecks('exercise')) >= 7 },
  { name: '琴艺精进', desc: '练琴打卡7天', icon: '🎼', check: async () => (await countHabitChecks('piano')) >= 7 },
  { name: '数学大师', desc: '数学进度100%（累计1天）', icon: '🔥', check: async () => (await countMathCompletedDays()) >= 1 },
  { name: '数学宗师', desc: '数学进度100%累计3天', icon: '🧮', check: async () => (await countMathCompletedDays()) >= 3 },
  { name: '学习达人', desc: '习惯完成度100%累计3天', icon: '📈', check: async () => (await countHabitsCompletedDays()) >= 3 },
  { name: '坚持不懈', desc: '习惯完成度100%累计7天', icon: '🛡️', check: async () => (await countHabitsCompletedDays()) >= 7 }
];

// ====== 离线缓存 ======
function cacheSet(key, data) {
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
}

function cacheGet(key, ttlMs = 24 * 60 * 60 * 1000) {
  const raw = localStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed?.data) return null;
  if (Date.now() - parsed.ts > ttlMs) return parsed.data; // 过期仍可用作降级
  return parsed.data;
}

function enqueueAction(action) {
  const raw = localStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ ...action, id: Date.now(), attempts: action.attempts || 0 });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function syncQueue() {
  const raw = localStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  if (!queue.length) return;

  const remaining = [];
  for (const item of queue) {
    try {
      await executeQueuedAction(item);
    } catch (error) {
      const attempts = (item.attempts || 0) + 1;
      if (attempts <= 3) {
        remaining.push({ ...item, attempts });
      }
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

async function executeQueuedAction(item) {
  switch (item.type) {
    case 'toggleHabit':
      await toggleHabitDB(item.payload.habitType);
      break;
    case 'updateProgress':
      await updateProgress(item.payload.type, item.payload.value);
      break;
    case 'recordChoice':
      await recordChoice(item.payload.choiceType, item.payload.choiceTitle);
      break;
    case 'updateInterest':
      await updateInterest(item.payload.interestType, item.payload.increment);
      break;
    case 'updateTimelineStatus':
      await updateTimelineStatus(item.payload.timelineId, item.payload.status);
      break;
    default:
      break;
  }
}

async function safeRead(cacheKey, fetcher) {
  try {
    const data = await fetcher();
    cacheSet(cacheKey, data);
    return data;
  } catch (error) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

async function safeWrite(type, payload, action) {
  try {
    return await action();
  } catch (error) {
    enqueueAction({ type, payload });
    showToast('离线模式：已缓存操作');
    return null;
  }
}

window.addEventListener('online', () => {
  setOfflineBadge(false);
  syncQueue().then(() => showToast('已恢复在线，正在同步数据'));
});

window.addEventListener('offline', () => {
  setOfflineBadge(true);
  showToast('已进入离线模式');
});

// ====== 初始化 ======
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initApp();
  } catch (error) {
    console.error(error);
    showToast('加载失败，请刷新重试');
  }
});

async function initApp() {
  setOfflineBadge(!navigator.onLine);
  bindModal();
  await initDayNumber();
  await initDashboard();
  await initTimeline();
  await initHabits();
  await initRadarChart();
  await initRewards();
  await initAchievements();
}

async function initDayNumber() {
  cachedCurrentDay = await getCurrentDay();
  document.getElementById('dayNum').textContent = cachedCurrentDay;
}

async function getCurrentDay() {
  if (cachedCurrentDay) return cachedCurrentDay;
  const student = await safeRead('student', () => getStudent());
  const start = new Date(student.start_date);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  cachedCurrentDay = Math.min(diffDays, 14);
  return cachedCurrentDay;
}

// ====== 仪表盘 ======
async function initDashboard() {
  cachedProgress = await safeRead('today_progress', () => getTodayProgress());
  renderProgressBars(cachedProgress);
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

// ====== 课程时间线 ======
async function initTimeline() {
  let timeline = await safeRead('today_timeline', () => getTodayTimeline());
  if (!timeline || timeline.length === 0) {
    timeline = await createTodayTimeline();
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const computed = timeline.map(item => {
    if (item.status === 'completed') return item;
    const [h, m] = item.time.split(':').map(Number);
    const itemTime = h * 60 + m;
    const status = currentTime >= itemTime ? 'current' : 'pending';
    return { ...item, status };
  });

  renderTimeline(computed);
}

function renderTimeline(timeline) {
  const container = document.querySelector('.timeline');
  container.innerHTML = timeline.map(item => `
    <div class="timeline-item ${item.status}" data-id="${item.id}">
      <div class="time">${item.time}</div>
      <div class="event">
        <span class="event-icon">${item.event_icon || '📘'}</span>
        <div class="event-info">
          <span class="event-title">${item.event_title}</span>
          <span class="event-subtitle">${item.event_subtitle || ''}</span>
        </div>
        <span class="event-status">${getStatusIcon(item.status)}</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.timeline-item').forEach(item => {
    item.addEventListener('click', () => handleTimelineClick(item.dataset.id));
  });
}

function getStatusIcon(status) {
  if (status === 'completed') return '✅';
  if (status === 'current') return '⏳';
  return '🔒';
}

async function handleTimelineClick(timelineId) {
  if (!confirm('确认完成此任务吗？')) return;
  await safeWrite('updateTimelineStatus', { timelineId, status: 'completed' }, () => updateTimelineStatus(timelineId, 'completed'));
  await initTimeline();
  showToast('✅ 打卡成功');
}

// ====== 习惯打卡 ======
async function initHabits() {
  const habits = await safeRead('today_habits', () => getTodayHabits());
  renderHabits(habits);
}

function renderHabits(habits) {
  const completedMap = new Map();
  habits.forEach(habit => completedMap.set(habit.habit_type, habit.is_completed));

  HABIT_KEYS.forEach(habitType => {
    const card = document.getElementById(`habit-${habitType}`);
    const isCompleted = completedMap.get(habitType);
    card.classList.toggle('checked', Boolean(isCompleted));
  });
}

window.toggleHabit = async function toggleHabit(habitType) {
  const updated = await safeWrite('toggleHabit', { habitType }, () => toggleHabitDB(habitType));
  if (!updated) return;

  const card = document.getElementById(`habit-${habitType}`);
  card.classList.toggle('checked', updated.is_completed);

  await recalculateHabitsProgress();
};

async function recalculateHabitsProgress() {
  const habits = await getTodayHabits();
  const completed = habits.filter(h => h.is_completed).length;
  const progress = Math.round((completed / HABIT_KEYS.length) * 100);

  await safeWrite('updateProgress', { type: 'habits', value: progress }, () => updateProgress('habits', progress));
  cachedProgress = await getTodayProgress();
  renderProgressBars(cachedProgress);

  await refreshRewardsAndAchievements();
}

// ====== 每日选择 ======
window.selectChoice = async function selectChoice(element) {
  document.querySelectorAll('.choice-card').forEach(card => {
    card.classList.remove('selected');
  });

  element.classList.add('selected');
  const interest = element.dataset.interest;
  const choiceTitle = CHOICE_TITLE_MAP[interest];

  if (!interest || !choiceTitle) return;

  await safeWrite('recordChoice', { choiceType: interest, choiceTitle }, () => recordChoice(interest, choiceTitle));
  await safeWrite('updateInterest', { interestType: interest, increment: 5 }, () => updateInterest(interest, 5));

  cachedInterests = await getOrCreateInterests();
  drawRadarChart(cachedInterests);

  element.style.transform = 'scale(1.05)';
  setTimeout(() => {
    element.style.transform = '';
  }, 200);

  showToast('✅ 已记录选择');
};

// ====== 兴趣雷达 ======
async function initRadarChart() {
  cachedInterests = await safeRead('interests', () => getOrCreateInterests());
  drawRadarChart(cachedInterests);
}

function drawRadarChart(interests) {
  const canvas = document.getElementById('radarChart');
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
async function initRewards() {
  await ensureBaseReward();
  await refreshRewardsAndAchievements();
}

async function ensureBaseReward() {
  const rewards = await safeRead('rewards', () => getUnlockedRewards());
  const hasBase = rewards.some(r => r.reward_name === '青龙偃月刀');
  if (!hasBase) {
    await unlockReward('青龙偃月刀', '⚔️', '新手礼包');
  }
}

async function refreshRewardsAndAchievements() {
  await evaluateRewards();
  await evaluateAchievements();
  await renderRewards();
  await renderAchievements();
}

async function evaluateRewards() {
  const unlocked = await getUnlockedRewards();
  const unlockedNames = new Set(unlocked.map(r => r.reward_name));

  for (const reward of REWARDS) {
    if (unlockedNames.has(reward.name)) continue;
    const ok = await reward.check();
    if (ok) {
      await unlockReward(reward.name, reward.icon, reward.condition);
      showModal('🎉 解锁奖励', reward.name);
    }
  }
}

async function renderRewards() {
  const unlocked = await getUnlockedRewards();
  const unlockedNames = new Set(unlocked.map(r => r.reward_name));
  const container = document.querySelector('.rewards-grid');

  container.innerHTML = REWARDS.map(reward => {
    const isUnlocked = unlockedNames.has(reward.name);
    const downloadLink = reward.stl ? `
        <a class="reward-download" href="${reward.stl}" download>下载STL</a>
      ` : '';
    return `
      <div class="reward-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="reward-model">${isUnlocked ? '⚔️' : '🔒'}</div>
        <span class="reward-name">${reward.name}</span>
        <span class="reward-status">${isUnlocked ? '已解锁' : reward.condition}</span>
        ${isUnlocked ? downloadLink : ''}
      </div>
    `;
  }).join('');
}

// ====== 成就系统 ======
async function initAchievements() {
  await refreshRewardsAndAchievements();
}

async function evaluateAchievements() {
  const achieved = await getAchievements();
  const achievedNames = new Set(achieved.map(a => a.achievement_name));

  for (const achievement of ACHIEVEMENTS) {
    if (achievedNames.has(achievement.name)) continue;
    const ok = await achievement.check();
    if (ok) {
      await addAchievement(achievement.name, achievement.desc, achievement.icon);
      showModal('🏆 获得成就', achievement.name);
    }
  }
}

async function renderAchievements() {
  const achieved = await getAchievements();
  const achievedNames = new Set(achieved.map(a => a.achievement_name));
  const container = document.querySelector('.achievements-grid');

  if (!container) return;

  container.innerHTML = ACHIEVEMENTS.map(achievement => {
    const isUnlocked = achievedNames.has(achievement.name);
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <span class="achievement-name">${achievement.name}</span>
          <span class="achievement-desc">${achievement.desc}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ====== 城市切换 ======
const cityEvents = {
  shenzhen: [
    { month: '2月', day: '8', title: '三国文化展', location: '深圳博物馆', price: '免费预约' },
    { month: '2月', day: '10', title: '少年剑道体验课', location: '南山文体中心', price: '¥99/人' },
    { month: '2月', day: '15', title: '创客空间开放日', location: '柴火创客空间', price: '免费' }
  ],
  guangzhou: [
    { month: '2月', day: '6', title: '岭南历史文化展', location: '广东省博物馆', price: '免费预约' },
    { month: '2月', day: '12', title: '武术冬令营', location: '广州体育馆', price: '¥199/人' },
    { month: '2月', day: '14', title: '3D打印工作坊', location: '广州图书馆', price: '¥50/人' }
  ],
  beijing: [
    { month: '2月', day: '5', title: '故宫特展：明代兵器', location: '故宫博物院', price: '¥60' },
    { month: '2月', day: '9', title: '国家博物馆历史课', location: '国家博物馆', price: '免费预约' },
    { month: '2月', day: '16', title: '少年武术体验', location: '什刹海体校', price: '¥150/人' }
  ],
  shanghai: [
    { month: '2月', day: '7', title: '上海博物馆青铜器展', location: '上海博物馆', price: '免费预约' },
    { month: '2月', day: '11', title: 'STEM创客营', location: '上海科技馆', price: '¥120/人' },
    { month: '2月', day: '13', title: '古琴与剑文化讲座', location: '上海图书馆', price: '免费' }
  ]
};

window.selectCity = function selectCity(city) {
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  const eventsList = document.getElementById('eventsList');
  const events = cityEvents[city] || [];

  eventsList.innerHTML = events.map(e => `
    <div class="event-card">
      <div class="event-date">
        <span class="month">${e.month}</span>
        <span class="day">${e.day}</span>
      </div>
      <div class="event-details">
        <h3>${e.title}</h3>
        <p>📍 ${e.location}</p>
        <p>🎫 ${e.price}</p>
      </div>
      <button class="event-action">查看详情</button>
    </div>
  `).join('');
};

// ====== 底部导航 ======
window.switchTab = function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.nav-item').classList.add('active');

  console.log('Switching to tab:', tab);
};

// ====== 工具函数 ======
function showToast(message) {
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
        z-index: 1000;
        animation: fadeInUp 0.3s ease;
    `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

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

function setOfflineBadge(isOffline) {
  const badge = document.getElementById('offlineBadge');
  if (!badge) return;
  badge.classList.toggle('show', isOffline);
}
