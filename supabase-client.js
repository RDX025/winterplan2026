// Supabase 客户端工具库
// 封装所有数据库操作，供前端调用

import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端（前端使用公开的 URL 和 anon key）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 默认学生 ID（演示用，生产环境应该从认证系统获取）
const DEFAULT_STUDENT_ID = '11111111-1111-1111-1111-111111111111';

// ========== 学生信息 ==========

export async function getStudent(studentId = DEFAULT_STUDENT_ID) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error) throw error;
  return data;
}

// ========== 每日进度 ==========

export async function getTodayProgress(studentId = DEFAULT_STUDENT_ID) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .single();
  
  if (error && error.code === 'PGRST116') {
    // 记录不存在，创建新记录
    return await createTodayProgress(studentId);
  }
  
  if (error) throw error;
  return data;
}

async function createTodayProgress(studentId) {
  const today = new Date().toISOString().split('T')[0];
  
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
  const today = new Date().toISOString().split('T')[0];
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
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('habit_checks')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today);
  
  if (error) throw error;
  return data || [];
}

export async function toggleHabit(habitType, studentId = DEFAULT_STUDENT_ID) {
  const today = new Date().toISOString().split('T')[0];
  
  // 先检查是否存在
  const { data: existing } = await supabase
    .from('habit_checks')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('habit_type', habitType)
    .single();
  
  if (existing) {
    // 已存在，切换状态
    const newStatus = !existing.is_completed;
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
    return data;
  } else {
    // 不存在，创建新记录
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
    return data;
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

export async function recordChoice(choiceType, choiceTitle, studentId = DEFAULT_STUDENT_ID) {
  const today = new Date().toISOString().split('T')[0];
  
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
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('course_timeline')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .order('time', { ascending: true });
  
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
