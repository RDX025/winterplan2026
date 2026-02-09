import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ScheduleStore from '../stores/scheduleStore.js';

describe('ScheduleStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T00:00:00Z'));

    if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
      const store = {};
      globalThis.localStorage = {
        getItem: key => (key in store ? store[key] : null),
        setItem: (key, value) => {
          store[key] = value;
        },
        removeItem: key => {
          delete store[key];
        },
        clear: () => {
          Object.keys(store).forEach(key => delete store[key]);
        }
      };
    }

    globalThis.localStorage.clear();
    ScheduleStore.init({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with array as today schedule', () => {
    ScheduleStore.init([{ id: '1', title: 'Math' }]);
    const today = new Date().toISOString().split('T')[0];
    expect(ScheduleStore.getByDate(today)).toHaveLength(1);
  });

  it('adds, updates, and removes events', () => {
    const dateKey = '2026-02-10';
    ScheduleStore.addEvent(dateKey, { id: 'e1', title: 'Read' });
    expect(ScheduleStore.getByDate(dateKey)).toHaveLength(1);

    const updated = ScheduleStore.updateEvent(dateKey, 'e1', { title: 'Read 30m' });
    expect(updated.title).toBe('Read 30m');

    const removed = ScheduleStore.removeEvent(dateKey, 'e1');
    expect(removed.id).toBe('e1');
    expect(ScheduleStore.getByDate(dateKey)).toHaveLength(0);
  });

  it('notifies subscribers on changes', () => {
    const spy = vi.fn();
    ScheduleStore.subscribe(spy);
    ScheduleStore.setByDate('2026-02-10', [{ id: 'e2' }]);
    expect(spy).toHaveBeenCalled();
  });
});
