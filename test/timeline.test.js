import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => mockClient
  };
});

import { createTodayTimeline, getTodayTimeline, updateTimelineStatus } from '../supabase-client.js';

function createQueryChain(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve(result))
  };
  return chain;
}

describe('timeline', () => {
  beforeEach(() => {
    mockClient.from.mockReset();
  });

  it('getTodayTimeline returns timeline items', async () => {
    const data = [{ id: 't1' }];
    mockClient.from.mockReturnValue(createQueryChain({ data, error: null }));
    const timeline = await getTodayTimeline();
    expect(timeline).toHaveLength(1);
  });

  it('createTodayTimeline inserts default items', async () => {
    let insertPayload;
    const chain = {
      insert: vi.fn(payload => {
        insertPayload = payload;
        return { select: vi.fn(() => Promise.resolve({ data: payload, error: null })) };
      })
    };
    mockClient.from.mockReturnValue(chain);

    const result = await createTodayTimeline('student-1');
    expect(insertPayload).toHaveLength(5);
    expect(insertPayload[0]).toMatchObject({ student_id: 'student-1', status: 'pending' });
    expect(result).toHaveLength(5);
  });

  it('updateTimelineStatus sets completed_at when completed', async () => {
    let updatePayload;
    const chain = {
      update: vi.fn(payload => {
        updatePayload = payload;
        return {
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: 't1', ...payload }, error: null }))
            }))
          }))
        };
      })
    };
    mockClient.from.mockReturnValue(chain);

    const result = await updateTimelineStatus('t1', 'completed');
    expect(updatePayload.status).toBe('completed');
    expect(updatePayload.completed_at).toBeTruthy();
    expect(result.id).toBe('t1');
  });
});
