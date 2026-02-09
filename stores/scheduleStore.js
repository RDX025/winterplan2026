import { logger } from '../utils/logger.js';

// 统一的日程数据管理 (Single Source of Truth)
const ScheduleStore = {
  _data: {}, // { '2026-2-10': [...events] }
  _listeners: [],

  // 初始化数据 (from localStorage or Supabase)
  init(data = {}) {
    let normalized = {};

    if (Array.isArray(data)) {
      const today = this._getTodayKey();
      normalized[today] = data;
    } else if (data && typeof data === 'object') {
      normalized = { ...data };
    }

    this._data = normalized;
    this._notify();
  },

  // 获取指定日期的日程
  getByDate(dateKey) {
    return this._data[dateKey] || [];
  },

  // 获取今日日程
  getToday() {
    return this.getByDate(this._getTodayKey());
  },

  // 设置指定日期日程
  setByDate(dateKey, events) {
    this._data[dateKey] = Array.isArray(events) ? events : [];
    this._notify();
    this.save();
  },

  // 添加/更新/删除事件
  addEvent(dateKey, event) {
    const list = this._ensureDate(dateKey);
    list.push(event);
    this._notify();
    this.save();
    return event;
  },

  updateEvent(dateKey, eventId, updates) {
    const list = this._ensureDate(dateKey);
    const idx = list.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this._notify();
      this.save();
      return list[idx];
    }
    return null;
  },

  removeEvent(dateKey, eventId) {
    const list = this._ensureDate(dateKey);
    const idx = list.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      const [removed] = list.splice(idx, 1);
      this._notify();
      this.save();
      return removed;
    }
    return null;
  },

  // 订阅数据变化
  subscribe(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  },

  // 触发变化通知
  _notify() {
    this._listeners.forEach(cb => {
      try {
        cb(this._data);
      } catch (e) {
        logger.warn('ScheduleStore listener error:', e);
      }
    });
  },

  // 持久化
  save() {
    try {
      localStorage.setItem('jkxx_schedule', JSON.stringify(this._data));
    } catch (e) {
      logger.warn('ScheduleStore 保存失败:', e);
    }
  },

  _ensureDate(dateKey) {
    if (!this._data[dateKey]) this._data[dateKey] = [];
    return this._data[dateKey];
  },

  _getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }
};

// 兼容旧的 window.scheduleByDate / window.todaySchedule
if (typeof window !== 'undefined') {
  if (!window.scheduleStore) window.scheduleStore = ScheduleStore;

  if (!Object.getOwnPropertyDescriptor(window, 'scheduleByDate')) {
    Object.defineProperty(window, 'scheduleByDate', {
      get: () => ScheduleStore._data,
      set: (val) => ScheduleStore.init(val || {})
    });
  }

  if (!Object.getOwnPropertyDescriptor(window, 'todaySchedule')) {
    Object.defineProperty(window, 'todaySchedule', {
      get: () => ScheduleStore.getToday(),
      set: (val) => {
        const today = ScheduleStore._getTodayKey();
        ScheduleStore.setByDate(today, Array.isArray(val) ? val : []);
      }
    });
  }
}

export default ScheduleStore;
