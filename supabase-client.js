// Supabase 客户端工具库
// 封装所有数据库操作，供前端调用

import { createClient } from '@supabase/supabase-js';
import { logger } from './utils/logger.js';

// 初始化 Supabase 客户端（前端使用公开的 URL 和 anon key）
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 本地日期（避免 UTC 导致跨日）
const getLocalDateKey = (d = new Date()) => {
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().split('T')[0];
};

logger.log('🔧 Supabase配置检查:');
logger.log('  URL:', rawSupabaseUrl ? '✅ 已配置' : '❌ 未配置');
logger.log('  Key:', rawSupabaseKey ? '✅ 已配置' : '❌ 未配置');

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawSupabaseUrl) ? rawSupabaseUrl : '';
const supabaseKey = rawSupabaseKey && (
  rawSupabaseKey.startsWith('eyJ') ||
  rawSupabaseKey.startsWith('sb_') ||
  rawSupabaseKey.startsWith('sbp_') ||
  rawSupabaseKey.startsWith('sb_publishable_')
)
  ? rawSupabaseKey
  : '';

export const SUPABASE_ENABLED = !!(supabaseUrl && supabaseKey);
export const supabase = SUPABASE_ENABLED
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('http://localhost', 'public-anon-key');

// 默认学生 ID（演示用，生产环境应该从认证系统获取）
export const DEFAULT_STUDENT_ID = '11111111-1111-1111-1111-111111111111';

// Supabase连接测试
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('students').select('id').limit(1);
    if (error) {
      logger.error('❌ Supabase连接失败:', error.message);
      return false;
    }
    logger.log('✅ Supabase连接成功');
    return true;
  } catch (e) {
    logger.error('❌ Supabase异常:', e.message);
    return false;
  }
}

// ========== 统计 ==========
export async function getWeekStats(weekStart, weekEnd, studentId = DEFAULT_STUDENT_ID) {
  if (!SUPABASE_ENABLED) return null;
  if (!weekStart || !weekEnd) return null;
  const { data, error } = await supabase.rpc('week_stats', {
    p_student_id: studentId,
    p_week_start: weekStart,
    p_week_end: weekEnd
  });
  if (error) throw error;
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

// ========== 学生信息 ==========

export async function getStudent(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateStudent(updates, studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', studentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createOrUpdateStudent(studentId = DEFAULT_STUDENT_ID, name = '彦平少侠', avatar = '🥷') {
  const { data, error } = await supabase
    .from('students')
    .upsert({
      id: studentId,
      name: name,
      avatar: avatar,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 用户照片 ==========

export async function getUserPhotos(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('user_photos')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addUserPhoto(photoData, studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('user_photos')
    .insert([{
      student_id: studentId,
      photo_data: photoData.src,
      date: photoData.date
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteUserPhoto(photoId, studentId = DEFAULT_STUDENT_ID) {
  const { error } = await supabase
    .from('user_photos')
    .delete()
    .eq('id', photoId)
    .eq('student_id', studentId);
  
  if (error) throw error;
  return true;
}

// ========== 每日进度 ==========

export async function getTodayProgress(studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .limit(1);
  
  if (!error && Array.isArray(data) && data.length === 0) {
    // 记录不存在，创建新记录
    return await createTodayProgress(studentId);
  }
  
  if (error && error.status === 404) {
    // 表不存在或无权限，降级
    return null;
  }
  
  if (error) throw error;
  return data;
}

async function createTodayProgress(studentId) {
  const today = getLocalDateKey();
  
  const { data, error } = await supabase
    .from('daily_progress')
    .insert([{
      student_id: studentId,
      date: today,
      math_progress: 0,
      english_progress: 0,
      habits_progress: 0
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProgress(type, value, studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  const field = `${type}_progress`; // 'math_progress', 'english_progress', 'habits_progress'
  
  const { data, error } = await supabase
    .from('daily_progress')
    .update({ [field]: value })
    .eq('student_id', studentId)
    .eq('date', today)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 习惯打卡 ==========

export async function getTodayHabits(studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  
  const { data, error } = await supabase
    .from('habit_checks')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today);
  
  if (error) throw error;
  return data || [];
}

export async function toggleHabit(habitType, studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  
  // 先检查是否存在
  const { data: existing } = await supabase
    .from('habit_checks')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('habit_type', habitType)
    .single();
  
  let newStatus;
  
  if (existing) {
    // 已存在，切换状态
    newStatus = !existing.is_completed;
    const { data, error } = await supabase
      .from('habit_checks')
      .update({
        is_completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
  } else {
    // 不存在，创建新记录
    newStatus = true;
    const { data, error } = await supabase
      .from('habit_checks')
      .insert([{
        student_id: studentId,
        date: today,
        habit_type: habitType,
        is_completed: true,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
  }
  
  // 同步更新 daily_progress 表的 habits_progress
  await syncHabitsProgress(studentId, today);
  
  return { habit_type: habitType, is_completed: newStatus };
}

/**
 * 同步 habits_progress 到 daily_progress 表
 */
async function syncHabitsProgress(studentId, date, totalHabits = 7) {
  try {
    // 统计当天已完成习惯数
    const { count, error } = await supabase
      .from('habit_checks')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('is_completed', true);
    
    if (error) {
      logger.warn('统计习惯完成数失败:', error);
      return;
    }
    
    const completedCount = count || 0;
    const progress = Math.round((completedCount / totalHabits) * 100);
    
    // 更新 daily_progress
    await updateProgress('habits', progress, studentId, date);
    
    logger.log(`✅ habits_progress 已同步: ${progress}% (${completedCount}/${totalHabits})`);
  } catch (e) {
    logger.warn('同步 habits_progress 失败:', e);
  }
}

/**
 * 更新 daily_progress 的辅助函数
 */
async function updateProgress(type, value, studentId, date) {
  const table = 'daily_progress';
  const field = `${type}_progress`;
  
  // 先检查是否存在
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('student_id', studentId)
    .eq('date', date)
    .single();
  
  if (existing) {
    await supabase
      .from(table)
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from(table)
      .insert([{
        student_id: studentId,
        date: date,
        [field]: value
      }]);
  }
}

// ========== 兴趣雷达 ==========

export async function getInterests(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('interest_scores')
    .select('*')
    .eq('student_id', studentId);
  
  if (error) throw error;
  
  // 转换为对象格式 { history: 70, engineering: 40, ... }
  const interests = {};
  data.forEach(item => {
    interests[item.interest_type] = item.score;
  });
  
  return interests;
}

export async function ensureInterestScores(studentId = DEFAULT_STUDENT_ID) {
  const interestTypes = ['history', 'engineering', 'music', 'martial', 'logic', 'art'];
  const payload = interestTypes.map(type => ({
    student_id: studentId,
    interest_type: type,
    score: 0,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('interest_scores')
    .upsert(payload, { onConflict: 'student_id,interest_type' })
    .select();

  if (error) throw error;
  return data;
}

export async function getOrCreateInterests(studentId = DEFAULT_STUDENT_ID) {
  const interests = await getInterests(studentId);
  const hasAny = Object.keys(interests).length > 0;
  if (!hasAny) {
    await ensureInterestScores(studentId);
    return await getInterests(studentId);
  }
  return interests;
}

export async function updateInterest(interestType, increment, studentId = DEFAULT_STUDENT_ID) {
  const { data: current } = await supabase
    .from('interest_scores')
    .select('score')
    .eq('student_id', studentId)
    .eq('interest_type', interestType)
    .single();
  
  const newScore = Math.min(100, (current?.score || 0) + increment);
  
  const { data, error } = await supabase
    .from('interest_scores')
    .update({ 
      score: newScore,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .eq('interest_type', interestType)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 每日选择 ==========

export async function getTodayChoice(studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  const { data, error } = await supabase
    .from('daily_choices')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .limit(1);

  if (!error && Array.isArray(data) && data.length === 0) return null;
  if (error && error.status === 404) return null;
  if (error) throw error;
  return data[0] || null;
}

export async function recordChoice(choiceType, choiceTitle, studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();

  await supabase
    .from('daily_choices')
    .delete()
    .eq('student_id', studentId)
    .eq('date', today);
  
  const { data, error } = await supabase
    .from('daily_choices')
    .insert([{
      student_id: studentId,
      date: today,
      choice_type: choiceType,
      choice_title: choiceTitle
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 课程时间线 ==========

export async function getTodayTimeline(studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  
  const { data, error } = await supabase
    .from('course_timeline')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .order('time', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function createTodayTimeline(studentId = DEFAULT_STUDENT_ID) {
  const today = getLocalDateKey();
  const base = [
    { time: '08:00', event_title: '英语课', event_subtitle: '2小时', event_icon: '📖', duration_hours: 2 },
    { time: '10:00', event_title: '自由探索时间', event_subtitle: '选择你的冒险', event_icon: '🎯', duration_hours: 1 },
    { time: '14:00', event_title: '数学课', event_subtitle: '2小时', event_icon: '🧮', duration_hours: 2 },
    { time: '16:00', event_title: '兴趣发现时间', event_subtitle: '解锁新技能', event_icon: '⚔️', duration_hours: 1.5 },
    { time: '19:00', event_title: '琴剑修炼', event_subtitle: '钢琴 + 运动', event_icon: '🎹', duration_hours: 1.5 }
  ];

  const payload = base.map(item => ({
    student_id: studentId,
    date: today,
    status: 'pending',
    ...item
  }));

  const { data, error } = await supabase
    .from('course_timeline')
    .insert(payload)
    .select();

  if (error) throw error;
  return data || [];
}

export async function updateTimelineStatus(timelineId, status) {
  const { data, error } = await supabase
    .from('course_timeline')
    .update({ 
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', timelineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 奖励 ==========

export async function getUnlockedRewards(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('unlocked_rewards')
    .select('*')
    .eq('student_id', studentId)
    .order('unlocked_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function unlockReward(rewardName, rewardIcon, unlockCondition, studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('unlocked_rewards')
    .insert([{
      student_id: studentId,
      reward_name: rewardName,
      reward_icon: rewardIcon,
      unlock_condition: unlockCondition
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 成就 ==========

export async function getAchievements(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('student_id', studentId)
    .order('earned_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addAchievement(achievementName, achievementDesc, achievementIcon, studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('achievements')
    .insert([{
      student_id: studentId,
      achievement_name: achievementName,
      achievement_desc: achievementDesc,
      achievement_icon: achievementIcon
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function countMathCompletedDays(studentId = DEFAULT_STUDENT_ID) {
  const { count, error } = await supabase
    .from('daily_progress')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .gte('math_progress', 100);

  if (error) throw error;
  return count || 0;
}

export async function countHabitsCompletedDays(studentId = DEFAULT_STUDENT_ID) {
  const { count, error } = await supabase
    .from('daily_progress')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .gte('habits_progress', 100);

  if (error) throw error;
  return count || 0;
}

export async function countHabitChecks(habitType, studentId = DEFAULT_STUDENT_ID) {
  const { count, error } = await supabase
    .from('habit_checks')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('habit_type', habitType)
    .eq('is_completed', true);

  if (error) throw error;
  return count || 0;
}

// ========== 今日日程 (schedule_items表) ==========

export async function getTodaySchedule(studentId = DEFAULT_STUDENT_ID) {
  // 获取所有日期的数据，用于日/周/月三视图
  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: true })
    .order('start_hour', { ascending: true })
    .order('start_minute', { ascending: true });
  
  if (error) {
    logger.warn('schedule_items表可能不存在:', error);
    return { today: [], byDate: {} };
  }
  
  // 按日期分组存储
  const byDate = {};
  (data || []).forEach(item => {
    if (!byDate[item.date]) {
      byDate[item.date] = [];
    }
    byDate[item.date].push({
      id: item.id,
      event_title: item.event_title,
      event_icon: item.event_icon || '📌',
      startHour: item.start_hour,
      startMin: item.start_minute,
      endHour: item.end_hour,
      endMin: item.end_minute,
      color: item.color || '#F4D03F',
      status: item.status || 'pending',
      date: item.date
    });
  });
  
  // 保存到 localStorage
  localStorage.setItem('jkxx_schedule', JSON.stringify(byDate));
  
  // 返回分组数据
  const today = getLocalDateKey();
  return {
    today: byDate[today] || [],
    byDate: byDate
  };
}

export async function saveScheduleItem(item, studentId = DEFAULT_STUDENT_ID) {
  // 使用事件自身的 date 字段；仅当缺失时才降级为今天
  const itemDate = item.date || getLocalDateKey();
  
  const payload = {
    student_id: studentId,
    date: itemDate,
    event_title: item.event_title,
    event_icon: item.event_icon || '📌',
    start_hour: item.startHour,
    start_minute: item.startMin,
    end_hour: item.endHour,
    end_minute: item.endMin,
    color: item.color || '#F4D03F',
    status: item.status || 'pending'
  };
  
  if (item.id && typeof item.id === 'string' && item.id.includes('-')) {
    // UUID格式，更新
    const { data, error } = await supabase
      .from('schedule_items')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // 新增
    const { data, error } = await supabase
      .from('schedule_items')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteScheduleItem(itemId) {
  const { error } = await supabase
    .from('schedule_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
}

// ========== 精彩表现 (weekly_achievements表) ==========

export async function getWeeklyAchievements(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('weekly_achievements')
    .select('*')
    .eq('student_id', studentId)
    .order('achievement_date', { ascending: false });
  
  if (error) {
    logger.warn('weekly_achievements表可能不存在:', error);
    return [];
  }
  return data || [];
}

export async function addWeeklyAchievement(achievement, studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('weekly_achievements')
    .insert([{
      student_id: studentId,
      achievement_date: achievement.date,
      title: achievement.title,
      category: achievement.category,
      icon: achievement.icon,
      score: achievement.score,
      comment: achievement.comment,
      media_url: achievement.media_url,
      video_url: achievement.video_url
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWeeklyAchievement(id, updates) {
  const { data, error } = await supabase
    .from('weekly_achievements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
