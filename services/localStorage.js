export const STORAGE_KEYS = {
  habits: 'jkxx_habits',
  progress: 'jkxx_progress',
  interests: 'jkxx_interests',
  schedule: 'jkxx_schedule',
  choice: 'jkxx_choice',
  habitsData: 'habitsData'
};

export function saveToLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('本地存储失败:', e);
  }
}

export function loadFromLocal(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.warn('本地加载失败:', e);
    return defaultValue;
  }
}
