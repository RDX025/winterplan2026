import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => mockClient
  };
});

import {
  addUserPhoto,
  createOrUpdateStudent,
  deleteUserPhoto,
  getStudent,
  getTodayHabits,
  getTodayProgress,
  getUserPhotos,
  getOrCreateInterests,
  recordChoice,
  updateProgress,
  updateStudent
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
    delete: vi.fn(() => createChain(result)),
    upsert: vi.fn(() => createChain(result))
  };
}

beforeEach(() => {
  const progressRow = { math_progress: 0, english_progress: 0, habits_progress: 0 };
  mockClient.from.mockImplementation(() => createChain({ data: progressRow, error: null }));
});

describe('supabase client', () => {
  it('getTodayProgress returns progress data', async () => {
    const progress = await getTodayProgress();
    expect(progress).toHaveProperty('math_progress');
  });

  it('getOrCreateInterests returns interest map', async () => {
    const interestResult = { data: [{ interest_type: 'history', score: 10 }], error: null };
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => Promise.resolve(interestResult))
    };
    mockClient.from.mockImplementation(() => chain);

    const interests = await getOrCreateInterests();
    expect(interests).toBeTypeOf('object');
    expect(interests.history).toBe(10);
  });

  it('recordChoice writes daily choice', async () => {
    const result = await recordChoice('history', '读三国故事');
    expect(result).toBeTruthy();
  });

  it('getStudent returns student data', async () => {
    mockClient.from.mockImplementation(() =>
      createChain({ data: { id: 's1', name: 'Test' }, error: null })
    );
    const student = await getStudent('s1');
    expect(student.name).toBe('Test');
  });

  it('updateStudent updates student info', async () => {
    mockClient.from.mockImplementation(() =>
      createChain({ data: { id: 's1', name: 'Updated' }, error: null })
    );
    const updated = await updateStudent({ name: 'Updated' }, 's1');
    expect(updated.name).toBe('Updated');
  });

  it('createOrUpdateStudent upserts student', async () => {
    mockClient.from.mockImplementation(() =>
      createChain({ data: { id: 's2', name: 'User' }, error: null })
    );
    const created = await createOrUpdateStudent('s2', 'User', '🥷');
    expect(created.id).toBe('s2');
  });

  it('user photos CRUD works', async () => {
    const photosResult = { data: [{ id: 'p1', photo_data: 'data' }], error: null };
    const photosChain = {
      select: vi.fn(() => photosChain),
      eq: vi.fn(() => photosChain),
      order: vi.fn(() => Promise.resolve(photosResult))
    };
    mockClient.from.mockImplementation(() => photosChain);

    const photos = await getUserPhotos('s1');
    expect(photos).toHaveLength(1);

    mockClient.from.mockImplementation(() =>
      createChain({ data: { id: 'p2', photo_data: 'data2' }, error: null })
    );
    const added = await addUserPhoto({ src: 'data2', date: '2026-02-10' }, 's1');
    expect(added.id).toBe('p2');

    mockClient.from.mockImplementation(() => createChain({ data: null, error: null }));
    const deleted = await deleteUserPhoto('p2', 's1');
    expect(deleted).toBe(true);
  });

  it('updateProgress updates daily progress', async () => {
    mockClient.from.mockImplementation(() =>
      createChain({ data: { math_progress: 50 }, error: null })
    );
    const result = await updateProgress('math', 50, 's1');
    expect(result.math_progress).toBe(50);
  });

  it('getTodayHabits returns habits list', async () => {
    const habitsResult = { data: [{ habit_type: 'read' }], error: null };
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      then: undefined
    };
    chain.eq.mockImplementationOnce(() => chain).mockImplementationOnce(() => Promise.resolve(habitsResult));
    mockClient.from.mockImplementation(() => chain);

    const habits = await getTodayHabits('s1');
    expect(habits).toHaveLength(1);
  });
});
