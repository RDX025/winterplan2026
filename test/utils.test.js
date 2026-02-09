import { describe, it, expect, vi } from 'vitest';
import { loadFromStorage, saveToStorage } from '../utils/storage.js';

describe('storage utils', () => {
  it('saves and loads JSON data', () => {
    const storage = {
      data: {},
      setItem: vi.fn(function (key, value) {
        this.data[key] = value;
      }),
      getItem: vi.fn(function (key) {
        return this.data[key] ?? null;
      })
    };

    const ok = saveToStorage(storage, 'demo', { name: 'test' });
    const loaded = loadFromStorage(storage, 'demo', null);

    expect(ok).toBe(true);
    expect(loaded).toEqual({ name: 'test' });
  });

  it('returns default value when parse fails', () => {
    const storage = {
      getItem: vi.fn(() => 'not-json')
    };

    const loaded = loadFromStorage(storage, 'broken', { fallback: true });
    expect(loaded).toEqual({ fallback: true });
  });
});
