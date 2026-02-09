import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => mockClient
  };
});

import { toggleHabit } from '../supabase-client.js';

describe('habits', () => {
  beforeEach(() => {
    mockClient.from.mockReset();
  });

  it('toggles existing habit status', async () => {
    let updatePayload;
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: { id: 'h1', is_completed: false }, error: null })),
      update: vi.fn(payload => {
        updatePayload = payload;
        return {
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: 'h1', ...payload }, error: null }))
            }))
          }))
        };
      })
    };

    mockClient.from.mockReturnValue(chain);

    const result = await toggleHabit('read', 'student-1');
    expect(updatePayload.is_completed).toBe(true);
    expect(result.id).toBe('h1');
  });

  it('creates habit when none exists', async () => {
    let insertPayload;
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      insert: vi.fn(payload => {
        insertPayload = payload;
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: payload[0], error: null }))
          }))
        };
      })
    };

    mockClient.from.mockReturnValue(chain);

    const result = await toggleHabit('exercise', 'student-1');
    expect(insertPayload[0]).toMatchObject({ habit_type: 'exercise', student_id: 'student-1' });
    expect(result.habit_type).toBe('exercise');
  });
});
