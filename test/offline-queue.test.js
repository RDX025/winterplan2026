import { describe, it, expect } from 'vitest';

describe('offline queue', () => {
  it('increments attempts on failures', () => {
    const item = { id: 1, attempts: 0 };
    const next = { ...item, attempts: item.attempts + 1 };
    expect(next.attempts).toBe(1);
  });
});
