import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockFrom;
let mockClient;

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => mockClient
  };
});

import {
  getTodayProgress,
  getOrCreateInterests,
  recordChoice
} from '../supabase-client.js';

function createChain(result) {
  return {
    select: vi.fn(() => createChain(result)),
    eq: vi.fn(() => createChain(result)),
    gte: vi.fn(() => createChain(result)),
    order: vi.fn(() => createChain(result)),
    single: vi.fn(() => Promise.resolve(result)),
    insert: vi.fn(() => createChain(result)),
    update: vi.fn(() => createChain(result)),
    delete: vi.fn(() => createChain(result))
  };
}

beforeEach(() => {
  const progressRow = { math_progress: 0, english_progress: 0, habits_progress: 0 };
  mockFrom = vi.fn(() => createChain({ data: progressRow, error: null }));
  mockClient = { from: mockFrom };
});

describe('supabase client', () => {
  it('getTodayProgress returns progress data', async () => {
    const progress = await getTodayProgress();
    expect(progress).toHaveProperty('math_progress');
  });

  it('getOrCreateInterests returns interest map', async () => {
    const interests = await getOrCreateInterests();
    expect(interests).toBeTypeOf('object');
  });

  it('recordChoice writes daily choice', async () => {
    const result = await recordChoice('history', '读三国故事');
    expect(result).toBeTruthy();
  });
});
