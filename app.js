// ====== 剑客游学 - Supabase 集成版本 ======
import * as SupabaseClient from './supabase-client.js';
import ScheduleStore from './stores/scheduleStore.js';
import { loadFromStorage, saveToStorage } from './utils/storage.js';
import { logger } from './utils/logger.js';
import { STORAGE_KEYS, saveToLocal, loadFromLocal } from './services/localStorage.js';
import {
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  HOUR_HEIGHT,
  configureTimeline,
  initTimeline,
  renderCalendarTimeline,
  eventTouchStart,
  eventTouchMove,
  eventTouchEnd,
  mouseEventDragStart,
  resetTimelineDragState
} from './components/Timeline.js';
import {
  HABIT_KEYS,
  MOCKUP_HABITS,
  configureHabitTracker,
  initHabits,
  initHabitEditor,
  toggleHabit,
  editHabit,
  closeEditHabitModal,
  saveHabitEdit
} from './components/HabitTracker.js';
import {
  REWARDS,
  ACHIEVEMENTS,
  initRewards,
  initAchievements
} from './components/Rewards.js';
import {
  configureCityEvents,
  initEvents,
  selectCity,
  addEventToSchedule,
  showEventDetail
} from './components/CityEvents.js';
import './components/calendar.js';

// 配置：是否使用Supabase（优先环境变量，fallback到内置配置）
let useSupabase = SupabaseClient.SUPABASE_ENABLED;

// ====== 模块方法挂载到 window (供 inline handlers 使用) ======
window.renderCalendarTimeline = renderCalendarTimeline;
window.eventTouchStart = eventTouchStart;
window.eventTouchMove = eventTouchMove;
window.eventTouchEnd = eventTouchEnd;
window.mouseEventDragStart = mouseEventDragStart;
window.toggleHabit = toggleHabit;
window.editHabit = editHabit;
window.closeEditHabitModal = closeEditHabitModal;
window.saveHabitEdit = saveHabitEdit;
window.selectCity = selectCity;
window.addEventToSchedule = addEventToSchedule;
window.showEventDetail = showEventDetail;
window.scheduleStore = ScheduleStore; // 暴露给 calendar.js 使用


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

const DEFAULT_STUDENT_ID = MOCKUP_STUDENT.id;

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

// 时间轴配置已迁移到 components/Timeline.js

// 今日日程（通过 ScheduleStore 统一管理）
const getTodaySchedule = () => ScheduleStore.getToday();
const getTodayKey = () => {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().split('T')[0];
};
const setTodaySchedule = (events) => ScheduleStore.setByDate(getTodayKey(), events);
const addTodayEvent = (event) => ScheduleStore.addEvent(getTodayKey(), event);
const updateTodayEvent = (eventId, updates, dateKey) => ScheduleStore.updateEvent(dateKey || getTodayKey(), eventId, updates);
const removeTodayEvent = (eventId, dateKey) => ScheduleStore.removeEvent(dateKey || getTodayKey(), eventId);

// 拖拽状态已迁移到 components/Timeline.js

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
let isPhotoEditMode = false;

const MOCKUP_INTERESTS = {
  history: 40,
  engineering: 65,
  music: 55,
  martial: 30,
  logic: 70,
  art: 25
};

// 深圳和广东省真实活动数据（2026年2-3月）
// 本地状态
let localHabits = { ...MOCKUP_HABITS };
let localProgress = { ...MOCKUP_PROGRESS };
let localInterests = { ...MOCKUP_INTERESTS };
let localChoice = null;
let currentTab = 'home';

// ====== 本地存储工具 ======
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
  
  // 加载今日日程（支持分组数据）
  const savedSchedule = loadFromLocal(STORAGE_KEYS.schedule, null);
  if (savedSchedule) {
    ScheduleStore.init(savedSchedule);
  }

  // 加载今日选择
  const savedChoice = loadFromLocal(STORAGE_KEYS.choice, null);
  if (savedChoice) {
    localChoice = savedChoice;
  }
  
  logger.log('✅ 本地数据已加载');
}

function saveAllLocalData() {
  saveToLocal(STORAGE_KEYS.habits, localHabits);
  saveToLocal(STORAGE_KEYS.progress, localProgress);
  saveToLocal(STORAGE_KEYS.interests, localInterests);
  // 保存完整 scheduleByDate 对象
  ScheduleStore.save();
  saveToLocal(STORAGE_KEYS.choice, localChoice);
}

// 更新 scheduleByDate (供日历三视图使用)
function updateScheduleByDate() {
  ScheduleStore.save();
}

// ====== 初始化 ======
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  
  // 事件委托：处理删除/编辑按钮点击
  document.addEventListener('click', function(e) {
    const deleteBtn = e.target.closest('.event-delete-btn');
    const editBtn = e.target.closest('.event-edit-btn');
    const statusIcon = e.target.closest('.event-status-icon');
    
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      deleteEvent(null, id);
    } else if (editBtn) {
      e.stopPropagation();
      const id = editBtn.dataset.id;
      openEditEventModal(id);
    } else if (statusIcon) {
      e.stopPropagation();
      const id = statusIcon.dataset.id;
      toggleEventStatus(id);
    }
  });
  
  // 触摸事件委托
  document.addEventListener('touchend', function(e) {
    const deleteBtn = e.target.closest('.event-delete-btn');
    const editBtn = e.target.closest('.event-edit-btn');
    const statusIcon = e.target.closest('.event-status-icon');
    
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      e.preventDefault();
      e.stopPropagation();
      deleteEvent(null, id);
    } else if (editBtn) {
      const id = editBtn.dataset.id;
      e.preventDefault();
      e.stopPropagation();
      openEditEventModal(id);
    } else if (statusIcon) {
      const id = statusIcon.dataset.id;
      e.preventDefault();
      e.stopPropagation();
      toggleEventStatus(id);
    }
  });
  
  // iOS Safari 触摸事件委托已移至 Timeline 模块
});

async function initApp() {
  setOfflineBadge(false);
  bindModal();
  initLandingPage();
  
  // 先从本地加载数据
  loadAllLocalData();

  configureTimeline({
    getTodaySchedule,
    saveAllLocalData,
    showToast,
    openEditEventModal: window.openEditEventModal,
    deleteEvent: window.deleteEvent,
    useSupabase: useSupabase,
    SupabaseClient
  });

  configureHabitTracker({
    localHabits,
    localProgress,
    renderProgressBars,
    saveAllLocalData,
    showToast,
    useSupabase: useSupabase,
    SupabaseClient
  });

  configureCityEvents({
    getTodaySchedule,
    saveAllLocalData,
    renderCalendarTimeline,
    showToast,
    showSuccessAnimation,
    showModal
  });
  
  // 尝试从Supabase加载数据（会覆盖本地）
  if (useSupabase) {
    logger.log('🔌 使用 Supabase 模式');
    // 测试连接
    const connected = await SupabaseClient.testConnection();
    if (connected) {
      logger.log('✅ Supabase连接成功，开始同步数据...');
      try {
        await loadFromSupabase();
      } catch (err) {
        logger.warn('⚠️ Supabase同步失败，降级到本地存储模式:', err?.message || err);
        useSupabase = false;
      }
    } else {
      logger.warn('⚠️ Supabase连接失败，降级到本地存储模式');
      useSupabase = false;
    }
  } else {
    logger.log('📦 使用本地存储模式');
  }

  // 本地/无数据时，预填引导模板
  ensureGuidedScheduleIfEmpty();
  
  // 数据加载完成后初始化日历
  initCalendar();
  
  initDayNumber();
  initDashboard();
  initWeeklyHighlights();
  initTimeline();
  initHabitEditor();
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
    const scheduleResult = await SupabaseClient.getTodaySchedule();
    
    // 初始化分组数据到 Store
    ScheduleStore.init(scheduleResult.byDate || {});
    
    if (scheduleResult.today && scheduleResult.today.length > 0) {
      const todayEvents = scheduleResult.today.map(s => ({
        id: s.id,
        event_title: s.event_title,
        event_icon: s.event_icon || '📌',
        startHour: s.startHour,
        startMin: s.startMin,
        endHour: s.endHour,
        endMin: s.endMin,
        color: s.color || '#F4D03F',
        status: s.status || 'pending'
      }));
      setTodaySchedule(todayEvents);
    } else {
      // 如果没有今日日程，预填引导模板
      const guidedEvents = buildGuidedEvents();
      setTodaySchedule(guidedEvents);
      // 同步到 Supabase
      if (useSupabase) {
        for (const item of guidedEvents) {
          try {
            const saved = await SupabaseClient.saveScheduleItem(item);
            if (saved && saved.id) item.id = saved.id;
          } catch (err) {
            logger.warn('引导日程同步失败:', err.message);
          }
        }
      }
    }

    // 加载今日选择
    try {
      const choice = await SupabaseClient.getTodayChoice();
      if (choice) {
        localChoice = { interest: choice.choice_type, title: choice.choice_title };
        document.querySelectorAll('.choice-card').forEach(card => {
          card.classList.toggle('selected', card.dataset.interest === choice.choice_type);
        });
      }
    } catch (e) {
      logger.warn('今日选择加载失败:', e.message);
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
    
    // 加载学生信息
    try {
      const student = await SupabaseClient.getStudent();
      if (student) {
        if (student.name) {
          MOCKUP_STUDENT.name = student.name;
          const nameEl = document.getElementById('profileName');
          if (nameEl) nameEl.textContent = student.name;
        }
        if (student.avatar) {
          selectedAvatar = student.avatar;
          MOCKUP_STUDENT.avatar = student.avatar;
          const avatar = AVATAR_OPTIONS.find(a => a.id === student.avatar);
          if (avatar) {
            const profileAvatar = document.getElementById('profileAvatar');
            const headerAvatar = document.querySelector('.user-avatar');
            if (profileAvatar) profileAvatar.textContent = avatar.emoji;
            if (headerAvatar) headerAvatar.textContent = avatar.emoji;
          }
        }
        logger.log('✅ 学生信息已加载:', student.name, student.avatar);
      }
    } catch (e) {
      logger.warn('学生信息加载失败:', e.message);
    }
    
    // 加载照片
    try {
      const photos = await SupabaseClient.getUserPhotos();
      if (photos && photos.length > 0) {
        userPhotos = photos.map(p => ({
          id: p.id,
          src: p.photo_data,
          date: p.date
        }));
        renderPhotoGrid();
        logger.log('✅ 照片已加载:', userPhotos.length, '张');
      }
    } catch (e) {
      logger.warn('照片加载失败:', e.message);
    }
    
    logger.log('✅ Supabase 数据加载完成');
  } catch (err) {
    logger.error('❌ Supabase 加载失败，使用本地数据:', err);
  }
}

function initCalendar() {
  const calendarSection = document.getElementById('calendarSection');
  
  if (calendarSection && typeof Calendar !== 'undefined') {
    Calendar.init();
    Calendar.switchView('day');
    
    // 延迟刷新以确保数据已加载
    setTimeout(() => {
      if (typeof Calendar.refresh === 'function') {
        Calendar.refresh();
      }
    }, 100);
  }
}

window.switchCalendarView = function(view) {
  if (typeof Calendar !== 'undefined') {
    Calendar.switchView(view);
  }
};

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
    
    logger.log(`粒子采样完成: ${particles.length} 个`);
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

// ====== iOS风格滚轮选择器 ======
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_COUNT = 5;
const WHEEL_RADIUS = 100;

function initIOSWheel(elementId, defaultIndex) {
  const wheel = document.getElementById(elementId);
  if (!wheel) return;
  
  const items = wheel.querySelectorAll('.ios-wheel-item');
  const totalItems = items.length;
  
  let currentIndex = defaultIndex;
  let startY = 0;
  let startIndex = 0;
  let velocity = 0;
  let lastY = 0;
  let lastTime = 0;
  let animationId = null;
  
  // 初始渲染
  renderWheel(currentIndex);
  
  // 触摸事件
  wheel.parentElement.addEventListener('touchstart', (e) => {
    cancelAnimation();
    startY = e.touches[0].clientY;
    lastY = startY;
    startIndex = currentIndex;
    lastTime = Date.now();
    velocity = 0;
  }, { passive: true });
  
  wheel.parentElement.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    const deltaY = (y - startY) / WHEEL_ITEM_HEIGHT;
    let newIndex = startIndex - deltaY;
    
    // 边界弹性
    if (newIndex < 0) {
      newIndex = newIndex * 0.3; // 弹性阻力
    } else if (newIndex > totalItems - 1) {
      newIndex = totalItems - 1 + (newIndex - totalItems + 1) * 0.3;
    }
    
    // 计算速度
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (lastY - y) / dt;
    }
    lastY = y;
    lastTime = now;
    
    currentIndex = newIndex;
    renderWheel(currentIndex);
  }, { passive: true });
  
  wheel.parentElement.addEventListener('touchend', () => {
    // 惯性滑动
    if (Math.abs(velocity) > 0.5) {
      inertiaScroll();
    } else {
      snapToIndex();
    }
  });
  
  // 鼠标事件
  let isDragging = false;
  
  wheel.parentElement.addEventListener('mousedown', (e) => {
    cancelAnimation();
    isDragging = true;
    startY = e.clientY;
    lastY = startY;
    startIndex = currentIndex;
    lastTime = Date.now();
    velocity = 0;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const y = e.clientY;
    const deltaY = (y - startY) / WHEEL_ITEM_HEIGHT;
    let newIndex = startIndex - deltaY;
    
    // 边界弹性
    if (newIndex < 0) {
      newIndex = newIndex * 0.3;
    } else if (newIndex > totalItems - 1) {
      newIndex = totalItems - 1 + (newIndex - totalItems + 1) * 0.3;
    }
    
    // 计算速度
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (lastY - y) / dt;
    }
    lastY = y;
    lastTime = now;
    
    currentIndex = newIndex;
    renderWheel(currentIndex);
  });
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    
    if (Math.abs(velocity) > 0.5) {
      inertiaScroll();
    } else {
      snapToIndex();
    }
  });
  
  function inertiaScroll() {
    const friction = 0.95;
    const minVelocity = 0.01;
    
    function animate() {
      velocity *= friction;
      currentIndex += velocity * 0.5;
      
      // 边界弹性回弹
      if (currentIndex < 0) {
        currentIndex = currentIndex * 0.8;
        velocity *= 0.5;
      } else if (currentIndex > totalItems - 1) {
        currentIndex = totalItems - 1 + (currentIndex - totalItems + 1) * 0.8;
        velocity *= 0.5;
      }
      
      renderWheel(currentIndex);
      
      if (Math.abs(velocity) > minVelocity || currentIndex < 0 || currentIndex > totalItems - 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        snapToIndex();
      }
    }
    
    animate();
  }
  
  function snapToIndex() {
    const targetIndex = Math.round(Math.max(0, Math.min(totalItems - 1, currentIndex)));
    
    // Haptic反馈
    if (Math.round(currentIndex) !== targetIndex || currentIndex !== targetIndex) {
      triggerHaptic();
    }
    
    const startIdx = currentIndex;
    const duration = 300;
    const startTime = Date.now();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 弹性缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      currentIndex = startIdx + (targetIndex - startIdx) * eased;
      
      renderWheel(currentIndex);
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        currentIndex = targetIndex;
        renderWheel(currentIndex);
        updateSelectedClass(targetIndex);
      }
    }
    
    animate();
  }
  
  function cancelAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
  
  function renderWheel(index) {
    items.forEach((item, i) => {
      const offset = i - index;
      const absOffset = Math.abs(offset);
      
      // 只显示可见范围内的项目（±3项）
      if (absOffset > 3) {
        item.style.opacity = '0';
        item.style.pointerEvents = 'none';
        return;
      }
      
      const angle = offset * 25; // 每项旋转角度
      const translateY = Math.sin(angle * Math.PI / 180) * WHEEL_RADIUS;
      const translateZ = Math.cos(angle * Math.PI / 180) * WHEEL_RADIUS - WHEEL_RADIUS;
      const opacity = Math.max(0.15, 1 - absOffset * 0.3);
      const scale = Math.max(0.75, 1 - absOffset * 0.12);
      
      // 设置3D变换，以容器中心为基准（高度140px，中心70px）
      item.style.transform = `translateY(${50 + translateY}px) translateZ(${translateZ}px) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.pointerEvents = absOffset < 1 ? 'auto' : 'none';
      const isActive = absOffset < 0.5;
      item.classList.toggle('active', isActive);
      item.classList.toggle('selected', isActive);
    });
  }
  
  function updateSelectedClass(index) {
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });
  }
  
  function triggerHaptic() {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    // iOS Safari Haptic (需要用户手势触发)
    if (window.Taptic) {
      window.Taptic.notification('success');
    }
  }
}

window.getSelectedTime = function(elementId) {
  const wheel = document.getElementById(elementId);
  if (!wheel) return { hour: 9, min: 0 };
  
  const selected = wheel.querySelector('.ios-wheel-item.selected');
  if (selected) {
    return {
      hour: parseInt(selected.dataset.hour),
      min: parseInt(selected.dataset.min)
    };
  }
  
  // 备用：从active项获取
  const active = wheel.querySelector('.ios-wheel-item.active');
  if (active) {
    return {
      hour: parseInt(active.dataset.hour),
      min: parseInt(active.dataset.min)
    };
  }
  
  return { hour: 9, min: 0 };
}

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
    date: getTodayKey(),
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
  
  addTodayEvent(newEvent);
  
  // 更新 scheduleByDate 和 localStorage
  updateScheduleByDate();
  
  // 关闭弹窗
  const modal = document.getElementById('notifyModal');
  modal.classList.remove('show');
  
  // 显示成功动画
  showSuccessAnimation('🎉 日程已添加！');
  
  renderCalendarTimeline();
  if (window.Calendar && typeof window.Calendar.refresh === 'function') window.Calendar.refresh();
  saveAllLocalData();
  
  // 同步到 Supabase
  if (useSupabase) {
    try {
      logger.log('📤 同步日程到Supabase:', newEvent.event_title);
      const saved = await SupabaseClient.saveScheduleItem(newEvent);
      logger.log('✅ Supabase保存成功:', saved);
      // 更新本地ID为Supabase返回的UUID
      if (saved && saved.id) {
        newEvent.id = saved.id;
      }
    } catch (err) {
      logger.error('❌ Supabase日程同步失败:', err.message);
    }
  }
};

// ====== 编辑日程 ======
window.openEditEventModal = function(id) {
  // 强制重置拖拽状态
  resetTimelineDragState();
  
  const item = getTodaySchedule().find(e => e.id == id);
  if (!item) {
    logger.warn('找不到日程:', id);
    return;
  }

  const modal = document.getElementById('notifyModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');
  if (!modal || !titleEl || !bodyEl) return;

  // 生成时间选项（15分钟间隔）
  const timeOptions = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeOptions.push({ hour: h, min: m, label: `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}` });
    }
  }
  
  const currentStartIdx = timeOptions.findIndex(t => t.hour === item.startHour && t.min === (item.startMin || 0));
  const currentEndIdx = timeOptions.findIndex(t => t.hour === item.endHour && t.min === (item.endMin || 0));

  titleEl.textContent = '✏️ 修改日程';
  bodyEl.innerHTML = `
    <div class="add-event-form">
      <input type="text" id="editEventTitle" class="form-input" value="${item.event_title}" placeholder="日程标题">
      
      <div class="time-picker-row">
        <div class="time-picker-col">
          <label>开始时间</label>
          <div class="ios-wheel-container">
            <div class="ios-wheel" id="wheelStart">
              ${timeOptions.map((t, i) => `<div class="ios-wheel-item ${i === currentStartIdx ? 'selected' : ''}" data-hour="${t.hour}" data-min="${t.min}">${t.label}</div>`).join('')}
            </div>
            <div class="ios-wheel-highlight"></div>
          </div>
        </div>
        <div class="time-picker-col">
          <label>结束时间</label>
          <div class="ios-wheel-container">
            <div class="ios-wheel" id="wheelEnd">
              ${timeOptions.map((t, i) => `<div class="ios-wheel-item ${i === currentEndIdx ? 'selected' : ''}" data-hour="${t.hour}" data-min="${t.min}">${t.label}</div>`).join('')}
            </div>
            <div class="ios-wheel-highlight"></div>
          </div>
        </div>
      </div>
      
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
      
      <button class="submit-btn" style="margin-top: 20px;" onclick="submitEditEvent('${id}')">✅ 保存修改</button>
    </div>
  `;

  // 初始化iOS滚轮
  setTimeout(() => {
    initIOSWheel('wheelStart', currentStartIdx >= 0 ? currentStartIdx : 0);
    initIOSWheel('wheelEnd', currentEndIdx >= 0 ? currentEndIdx : 0);
  }, 50);

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
  const item = getTodaySchedule().find(e => e.id == id);
  if (!item) {
    logger.error('找不到日程项:', id);
    showToast('日程不存在');
    return;
  }

  const title = document.getElementById('editEventTitle').value.trim();
  const start = window.getSelectedTime('wheelStart');
  const end = window.getSelectedTime('wheelEnd');
  const icon = document.getElementById('newEventIcon').value;
  const color = document.getElementById('newEventColor').value;

  logger.log('📝 保存编辑:', { title, start, end, icon, color });

  if (!title) {
    showToast('请输入日程标题');
    return;
  }
  
  // 计算总分钟数比较
  const startMins = start.hour * 60 + start.min;
  const endMins = end.hour * 60 + end.min;
  
  if (endMins <= startMins) {
    showToast('结束时间需大于开始时间');
    return;
  }

  const updates = {
    event_title: title,
    startHour: start.hour,
    startMin: start.min,
    endHour: end.hour,
    endMin: end.min,
    event_icon: icon,
    color: color
  };

  const updatedItem = updateTodayEvent(id, updates, item.date || getTodayKey()) || { ...item, ...updates };

  const modal = document.getElementById('notifyModal');
  modal.classList.remove('show');

  showSuccessAnimation('✨ 日程已更新');
  renderCalendarTimeline();
  if (window.Calendar && typeof window.Calendar.refresh === 'function') window.Calendar.refresh();
  saveAllLocalData();
  
  // 同步到 Supabase
  if (useSupabase) {
    try {
      await SupabaseClient.saveScheduleItem(updatedItem);
    } catch (err) {
      logger.error('日程更新同步失败:', err);
    }
  }
};

// 删除事件
window.deleteEvent = async function(event, id) {
  if (event) event.stopPropagation();
  
  const item = removeTodayEvent(id, null);
  if (item) {
    showToast('🗑️ 已删除');
    renderCalendarTimeline();
    if (window.Calendar && typeof window.Calendar.refresh === 'function') window.Calendar.refresh();
    saveAllLocalData();
    
    // 同步到 Supabase
    if (useSupabase && item.id) {
      try {
        await SupabaseClient.deleteScheduleItem(item.id);
      } catch (err) {
        logger.error('日程删除同步失败:', err);
      }
    }
  }
};

// 切换完成状态
window.toggleEventStatus = async function(id) {
  const item = getTodaySchedule().find(ev => ev.id == id);
  if (!item) {
    logger.warn('找不到日程:', id);
    return;
  }
  
  const newStatus = item.status === 'completed' ? 'pending' : 'completed';
  updateTodayEvent(id, { status: newStatus }, item.date || getTodayKey());
  if (newStatus === 'completed') {
    showSuccessAnimation('✅ 任务完成！');
  } else {
    showToast('已取消完成');
  }
  renderCalendarTimeline();
  if (window.Calendar && typeof window.Calendar.refresh === 'function') window.Calendar.refresh();
  saveAllLocalData();
  
  // 同步到 Supabase
  if (useSupabase) {
    try {
      await SupabaseClient.saveScheduleItem({ ...item, status: newStatus });
    } catch (err) {
      logger.error('日程状态同步失败:', err);
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
window.showEventModal = function(id) { openEditEventModal(id); };

window.handleTimelineClick = function handleTimelineClick(id) {
  const item = getTodaySchedule().find(t => t.id === id);
  if (!item) return;
  
  const newStatus = item.status === 'completed' ? 'pending' : 'completed';
  updateTodayEvent(id, { status: newStatus }, item.date || getTodayKey());
  renderCalendarTimeline();
  if (window.Calendar && typeof window.Calendar.refresh === 'function') window.Calendar.refresh();
  showToast(newStatus === 'completed' ? '✅ 已完成' : '已取消完成');
};

window.removeFromSchedule = function removeFromSchedule(event, id) {
  event.stopPropagation();
  const item = getTodaySchedule().find(t => t.id === id);
  if (item && item.type === 'activity') {
    removeTodayEvent(id);
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
  const item = getTodaySchedule().find(t => t.id === scheduleId);
  if (!item) return;
  
  const subtasks = Array.isArray(item.subtasks) ? [...item.subtasks] : [];
  subtasks.push({
    id: Date.now(),
    text: text,
    done: false
  });
  updateTodayEvent(scheduleId, { subtasks });
  
  renderCalendarTimeline();
  showToast('✅ 待办已添加');
}

window.toggleSubtask = function toggleSubtask(event, scheduleId, subtaskId) {
  event.stopPropagation();
  const item = getTodaySchedule().find(t => t.id === scheduleId);
  if (!item || !item.subtasks) return;
  
  const subtasks = item.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
  updateTodayEvent(scheduleId, { subtasks });
  renderCalendarTimeline();
  const updated = subtasks.find(s => s.id === subtaskId);
  showToast(updated && updated.done ? '✅ 完成' : '已取消完成');
};

window.deleteSubtask = function deleteSubtask(event, scheduleId, subtaskId) {
  event.stopPropagation();
  const item = getTodaySchedule().find(t => t.id === scheduleId);
  if (!item || !item.subtasks) return;
  
  const subtasks = item.subtasks.filter(s => s.id !== subtaskId);
  updateTodayEvent(scheduleId, { subtasks });
  renderCalendarTimeline();
  showToast('已删除待办');
};

// ====== 习惯打卡 ======
// ====== 每日选择 ======
window.selectChoice = async function selectChoice(element) {
  document.querySelectorAll('.choice-card').forEach(card => {
    card.classList.remove('selected');
  });

  element.classList.add('selected');
  const interest = element.dataset.interest;
  const choiceTitle = CHOICE_TITLE_MAP[interest];

  if (interest && localInterests[interest] !== undefined) {
    localInterests[interest] = Math.min(100, localInterests[interest] + 10);
    drawRadarChart(localInterests);
    localChoice = { interest, title: choiceTitle };
    saveAllLocalData();
    
    // 同步到 Supabase
    if (useSupabase) {
      try {
        await SupabaseClient.updateInterest(interest, 10);
        await SupabaseClient.recordChoice(interest, choiceTitle || '');
      } catch (err) {
        logger.error('兴趣同步失败:', err);
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
// ====== 城市活动 ======
// ====== 照片上传 ======
window.handlePhotoUpload = function handlePhotoUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = {
        id: Date.now(),
        src: e.target.result,
        date: new Date().toLocaleDateString('zh-CN')
      };
      userPhotos.push(photoData);
      renderPhotoGrid();
      
      // 同步到Supabase
      if (useSupabase) {
        try {
          const saved = await SupabaseClient.addUserPhoto(photoData);
          if (saved && saved.id) {
            photoData.id = saved.id;
          }
          logger.log('✅ 照片同步到Supabase');
        } catch (err) {
          logger.error('❌ 照片同步失败:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  });

  showToast(`已上传 ${files.length}张照片`);
};

window.togglePhotoEditMode = function() {
  isPhotoEditMode = !isPhotoEditMode;
  const btn = document.querySelector('.edit-btn');
  if (btn) btn.classList.toggle('active', isPhotoEditMode);
  renderPhotoGrid();
};

window.deletePhoto = async function(photoId) {
  const idx = userPhotos.findIndex(p => p.id == photoId);
  if (idx === -1) return;
  const photo = userPhotos[idx];
  userPhotos.splice(idx, 1);
  renderPhotoGrid();
  showToast('已删除照片');

  if (useSupabase) {
    try {
      await SupabaseClient.deleteUserPhoto(photo.id);
      logger.log('✅ 照片删除同步到Supabase');
    } catch (err) {
      logger.error('❌ 照片删除同步失败:', err.message);
    }
  }
};

function renderPhotoGrid() {
  const container = document.getElementById('photoGrid');
  if (!container) return;

  if (userPhotos.length === 0) {
    container.innerHTML = '<p class="no-photos">还没有照片，快来记录你的修炼日记吧！</p>';
    return;
  }

  container.innerHTML = userPhotos.map(photo => `
    <div class="photo-item ${isPhotoEditMode ? 'editing' : ''}">
      <img src="${photo.src}" alt="修炼日记" onclick="viewPhoto('${photo.id}')">
      <span class="photo-delete" onclick="deletePhoto('${photo.id}')">✕</span>
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

    MOCKUP_STUDENT.avatar = avatarId;
    
    // 同步到Supabase
    if (useSupabase) {
      SupabaseClient.createOrUpdateStudent(DEFAULT_STUDENT_ID, MOCKUP_STUDENT.name, avatarId)
        .then(() => logger.log('✅ 头像同步到Supabase'))
        .catch(err => logger.error('❌ 头像同步失败:', err));
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

  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = MOCKUP_STUDENT.name;

  renderPhotoGrid();
  renderAvatarGrid();
}

// 打开设置面板（修改姓名）
window.openProfileSettings = function() {
  const modal = document.getElementById('notifyModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');
  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = '⚙️ 少侠设置';
  bodyEl.innerHTML = `
    <div class="add-event-form">
      <label style="display:block; margin-bottom:8px; color:rgba(255,255,255,0.7); font-size:0.85rem;">少侠名号</label>
      <input type="text" id="profileNameInput" class="form-input" value="${MOCKUP_STUDENT.name}" maxlength="12" />
      <button class="submit-btn" style="margin-top:16px;" onclick="saveProfileSettings()">💾 保存</button>
    </div>
  `;

  closeBtn.textContent = '取消';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
};

window.saveProfileSettings = async function() {
  const input = document.getElementById('profileNameInput');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) {
    showToast('请输入少侠名号');
    return;
  }

  MOCKUP_STUDENT.name = newName;
  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = newName;

  // 同步到Supabase
  if (useSupabase) {
    try {
      await SupabaseClient.createOrUpdateStudent(DEFAULT_STUDENT_ID, newName, selectedAvatar);
      logger.log('✅ 姓名同步到Supabase');
    } catch (err) {
      logger.error('❌ 姓名同步失败:', err.message);
    }
  }

  const modal = document.getElementById('notifyModal');
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }
  showToast('✅ 名号已保存');
};

// 引导模板：每日固定任务
const GUIDED_DAY_TEMPLATE = [
  { title: '晨读/背诵', start: '07:30', end: '08:00', icon: '📖' },
  { title: '数学训练', start: '09:00', end: '10:30', icon: '🧮' },
  { title: '兴趣探索/科技', start: '14:00', end: '15:30', icon: '⚙️' },
  { title: '运动与拉伸', start: '17:00', end: '17:30', icon: '🏃' },
  { title: '复盘总结', start: '20:00', end: '20:20', icon: '📝' }
];

function buildGuidedEvents() {
  return GUIDED_DAY_TEMPLATE.map((item, idx) => {
    const [sh, sm] = item.start.split(':').map(n => parseInt(n, 10));
    const [eh, em] = item.end.split(':').map(n => parseInt(n, 10));
    return {
      id: Date.now() + idx,
      event_title: item.title,
      event_icon: item.icon,
      startHour: sh,
      startMin: sm,
      endHour: eh,
      endMin: em,
      status: 'pending',
      color: '#F4D03F'
    };
  });
}

function ensureGuidedScheduleIfEmpty() {
  if (getTodaySchedule().length === 0) {
    const guidedEvents = buildGuidedEvents();
    setTodaySchedule(guidedEvents);
    ScheduleStore.save();
  }
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
  const exists = getTodaySchedule().some(t => t.event_title === movie.title && t.type === 'activity');
  if (exists) {
    showToast('该电影已在日程中');
    return;
  }
  
  addTodayEvent({
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
