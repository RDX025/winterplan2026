import { logger } from '../utils/logger.js';

let deps = {};

// 获取最新本地习惯数据的辅助函数
function getLocalHabits() {
  // 优先使用 deps 中的引用
  if (deps.localHabits && typeof deps.localHabits === 'object') {
    return deps.localHabits;
  }
  // 回退到 window 上的引用
  if (typeof window.localHabits !== 'undefined') {
    return window.localHabits;
  }
  // 最后回退到默认值
  return {};
}

export const HABIT_KEYS = ['wake', 'sleep', 'spine', 'exercise', 'math', 'english', 'piano'];

export const MOCKUP_HABITS = {
  wake: false,
  sleep: false,
  spine: false,
  exercise: false,
  math: false,
  english: false,
  piano: false
};

let habitsData = {
  wake: { name: '🌅 早起', subtitle: '7:30前起床', icon: '🌅', goal: '养成自律作息' },
  sleep: { name: '🌙 早睡', subtitle: '22:00前睡觉', icon: '🌙', goal: '保证8小时睡眠' },
  spine: { name: '🧘 脊椎操', subtitle: '睡前五套动作', icon: '🧘', goal: '矫正脊椎侧弯' },
  exercise: { name: '🏃 运动', subtitle: '30分钟', icon: '🏃', goal: '增强体质' },
  math: { name: '📐 数学', subtitle: '费曼学习法', icon: '📐', goal: '巩固薄弱环节' },
  english: { name: '📖 英语', subtitle: '20个单词', icon: '📖', goal: '积累词汇量' },
  piano: { name: '🎹 钢琴', subtitle: '30分钟', icon: '🎹', goal: '提升音乐素养' }
};

let currentEditHabitId = null;
let selectedHabitIcon = null;

export function configureHabitTracker(options = {}) {
  deps = { ...deps, ...options };
}

export function initHabits() {
  const habits = getLocalHabits();
  HABIT_KEYS.forEach(habitType => {
    const card = document.getElementById(`habit-${habitType}`);
    if (card && habits) {
      const habit = habits[habitType];
      // 支持新旧两种数据结构
      const isChecked = typeof habit === 'boolean' ? habit : (habit?.completed || false);
      card.classList.toggle('checked', isChecked);
    }
  });
}

export function loadHabitsData() {
  const saved = localStorage.getItem('habitsData');
  if (saved) {
    try {
      habitsData = JSON.parse(saved);
    } catch (e) {
      logger.warn('habitsData解析失败，使用默认值');
      localStorage.removeItem('habitsData');
    }
  }
}

export function saveHabitsData() {
  localStorage.setItem('habitsData', JSON.stringify(habitsData));
}

export function renderHabits() {
  const grid = document.getElementById('habitsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  Object.keys(habitsData).forEach(id => {
    const h = habitsData[id];
    // 使用 getLocalHabits 获取最新数据
    const habits = getLocalHabits();
    const habit = habits[id];
    // 支持新旧两种数据结构
    const isChecked = typeof habit === 'boolean' ? habit : (habit?.completed || false);

    const card = document.createElement('div');
    card.className = `habit-card${isChecked ? ' checked' : ''}`;
    card.id = `habit-${id}`;
    card.onclick = () => toggleHabit(id);

    card.innerHTML = `
      <span class="habit-icon">${h.icon}</span>
      <div class="habit-content">
        <span class="habit-name">${h.name}</span>
        <span class="habit-subtitle">${h.subtitle}</span>
        <span class="habit-goal">${h.goal || ''}</span>
      </div>
      <div class="habit-check"></div>
      <button class="habit-edit-btn" onclick="editHabit(event, '${id}')">✏️</button>
    `;

    grid.appendChild(card);
  });
}

export function editHabit(e, id) {
  e.stopPropagation();
  currentEditHabitId = id;
  const h = habitsData[id];

  document.getElementById('editHabitId').value = id;
  document.getElementById('editHabitName').value = h.name;
  document.getElementById('editHabitSubtitle').value = h.subtitle;

  document.querySelectorAll('#habitIconPicker .icon-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.icon === h.icon);
    if (opt.dataset.icon === h.icon) {
      selectedHabitIcon = h.icon;
    }
  });

  document.getElementById('editHabitModal').classList.add('show');
}

export function closeEditHabitModal() {
  document.getElementById('editHabitModal').classList.remove('show');
  currentEditHabitId = null;
}

export function saveHabitEdit() {
  if (!currentEditHabitId) return;

  const name = document.getElementById('editHabitName').value.trim();
  const subtitle = document.getElementById('editHabitSubtitle').value.trim();

  if (!name) {
    if (deps.showToast) deps.showToast('请输入名称');
    return;
  }

  habitsData[currentEditHabitId].name = name;
  habitsData[currentEditHabitId].subtitle = subtitle;
  if (selectedHabitIcon) {
    habitsData[currentEditHabitId].icon = selectedHabitIcon;
  }

  saveHabitsData();
  renderHabits();
  if (deps.showToast) deps.showToast('✅ 习惯已更新');

  closeEditHabitModal();
}

export function initHabitEditor() {
  document.querySelectorAll('#habitIconPicker .icon-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#habitIconPicker .icon-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedHabitIcon = opt.dataset.icon;
    });
  });

  loadHabitsData();
  renderHabits();
}

export async function toggleHabit(habitType) {
  const habits = getLocalHabits();
  if (!habits) return;
  
  // 确保 habitType 是对象结构
  if (typeof habits[habitType] !== 'object') {
    habits[habitType] = { completedDates: [] };
  }
  
  // 获取今天的日期
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayKey = `${y}-${m}-${d}`;
  
  const habit = habits[habitType];
  const isCompleted = !habit.completed;
  
  // 切换完成状态
  habit.completed = isCompleted;
  
  // 更新已完成日期列表
  if (isCompleted) {
    if (!habit.completedDates) habit.completedDates = [];
    if (!habit.completedDates.includes(todayKey)) {
      habit.completedDates.push(todayKey);
    }
  }
  
  const card = document.getElementById(`habit-${habitType}`);
  if (card) {
    card.classList.toggle('checked', isCompleted);
  }

  recalculateHabitsProgress();
  if (deps.showToast) deps.showToast(isCompleted ? '✅ 已打卡' : '已取消打卡');
  
  // 同步刷新全局统计数据
  if (typeof window.refreshStats === 'function') {
    window.refreshStats();
  }

  if (deps.useSupabase && deps.SupabaseClient) {
    try {
      logger.log('📤 同步习惯到Supabase:', habitType, isCompleted);
      await deps.SupabaseClient.toggleHabit(habitType);
      logger.log('✅ Supabase习惯同步成功');
    } catch (err) {
      logger.error('❌ Supabase习惯同步失败:', err.message);
    }
  }
}

export async function recalculateHabitsProgress() {
  const habits = getLocalHabits();
  if (!habits || !deps.localProgress) return;
  
  // 支持新旧两种数据结构
  let completed = 0;
  for (const key of HABIT_KEYS) {
    const habit = habits[key];
    if (typeof habit === 'boolean' && habit) {
      completed++;
    } else if (typeof habit === 'object' && habit && habit.completed) {
      completed++;
    }
  }
  
  deps.localProgress.habits_progress = Math.round((completed / HABIT_KEYS.length) * 100);
  if (deps.renderProgressBars) deps.renderProgressBars(deps.localProgress);
  if (deps.saveAllLocalData) deps.saveAllLocalData();

  if (deps.useSupabase && deps.SupabaseClient) {
    try {
      await deps.SupabaseClient.updateProgress('habits', deps.localProgress.habits_progress);
    } catch (err) {
      logger.error('进度同步失败:', err);
    }
  }
}
