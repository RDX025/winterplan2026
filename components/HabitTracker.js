import { logger } from '../utils/logger.js';

let deps = {};

export const HABIT_KEYS = ['wake', 'piano', 'exercise', 'read', 'spine', 'math', 'sleep'];

export const MOCKUP_HABITS = {
  wake: false,
  piano: false,
  exercise: true,
  read: false,
  sleep: false,
  math: true
};

let habitsData = {
  wake: { name: '早起', subtitle: '7:30前起床', icon: '🌅' },
  piano: { name: '练琴', subtitle: '30分钟', icon: '🎹' },
  exercise: { name: '运动', subtitle: '30分钟', icon: '🏃' },
  read: { name: '阅读', subtitle: '30分钟', icon: '📖' },
  spine: { name: '李医生脊椎操', subtitle: '睡前五套动作', icon: '🧘' },
  math: { name: '数学复习', subtitle: '费曼笔记法', icon: '📝' },
  sleep: { name: '早睡', subtitle: '22:00前', icon: '🌙' }
};

let currentEditHabitId = null;
let selectedHabitIcon = null;

export function configureHabitTracker(options = {}) {
  deps = { ...deps, ...options };
}

export function initHabits() {
  HABIT_KEYS.forEach(habitType => {
    const card = document.getElementById(`habit-${habitType}`);
    if (card && deps.localHabits) {
      card.classList.toggle('checked', deps.localHabits[habitType]);
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
    const isChecked = deps.localHabits ? deps.localHabits[id] : false;

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
  if (!deps.localHabits) return;
  deps.localHabits[habitType] = !deps.localHabits[habitType];

  const card = document.getElementById(`habit-${habitType}`);
  if (card) {
    card.classList.toggle('checked', deps.localHabits[habitType]);
  }

  recalculateHabitsProgress();
  if (deps.showToast) deps.showToast(deps.localHabits[habitType] ? '✅ 已打卡' : '已取消打卡');
  
  // 同步刷新全局统计数据
  if (typeof window.refreshStats === 'function') {
    window.refreshStats();
  }

  if (deps.useSupabase && deps.SupabaseClient) {
    try {
      logger.log('📤 同步习惯到Supabase:', habitType, deps.localHabits[habitType]);
      await deps.SupabaseClient.toggleHabit(habitType);
      logger.log('✅ Supabase习惯同步成功');
    } catch (err) {
      logger.error('❌ Supabase习惯同步失败:', err.message);
    }
  }
}

export async function recalculateHabitsProgress() {
  if (!deps.localHabits || !deps.localProgress) return;
  const completed = HABIT_KEYS.filter(k => deps.localHabits[k]).length;
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
