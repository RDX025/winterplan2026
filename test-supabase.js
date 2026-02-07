// Supabase 数据库测试脚本
// 用于验证 Supabase 连接和 CRUD 操作

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：请在 .env 文件中配置 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试用的学生ID
const TEST_STUDENT_ID = '11111111-1111-1111-1111-111111111111';

async function testConnection() {
  console.log('🔌 测试 Supabase 连接...\n');
  
  try {
    // 1. 测试读取学生信息
    console.log('1️⃣ 测试读取学生信息');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', TEST_STUDENT_ID)
      .single();
    
    if (studentError) {
      console.error('❌ 读取学生失败:', studentError.message);
    } else {
      console.log('✅ 学生信息:', student);
    }
    
    // 2. 测试读取今日进度
    console.log('\n2️⃣ 测试读取今日进度');
    const today = new Date().toISOString().split('T')[0];
    const { data: progress, error: progressError } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('student_id', TEST_STUDENT_ID)
      .eq('date', today)
      .single();
    
    if (progressError) {
      console.log('⚠️ 今日进度不存在，创建新记录...');
      const { data: newProgress, error: insertError } = await supabase
        .from('daily_progress')
        .insert([
          {
            student_id: TEST_STUDENT_ID,
            date: today,
            math_progress: 0,
            english_progress: 0,
            habits_progress: 0
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ 创建进度失败:', insertError.message);
      } else {
        console.log('✅ 创建进度成功:', newProgress);
      }
    } else {
      console.log('✅ 今日进度:', progress);
    }
    
    // 3. 测试更新进度
    console.log('\n3️⃣ 测试更新数学进度 +10');
    const newMathProgress = (progress?.math_progress || 0) + 10;
    const { data: updated, error: updateError } = await supabase
      .from('daily_progress')
      .update({ math_progress: newMathProgress })
      .eq('student_id', TEST_STUDENT_ID)
      .eq('date', today)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 更新进度失败:', updateError.message);
    } else {
      console.log('✅ 更新成功，新数学进度:', updated.math_progress);
    }
    
    // 4. 测试读取习惯打卡
    console.log('\n4️⃣ 测试读取今日习惯打卡');
    const { data: habits, error: habitsError } = await supabase
      .from('habit_checks')
      .select('*')
      .eq('student_id', TEST_STUDENT_ID)
      .eq('date', today);
    
    if (habitsError) {
      console.error('❌ 读取习惯失败:', habitsError.message);
    } else {
      console.log('✅ 今日习惯打卡:', habits.length, '条记录');
      habits.forEach(h => {
        console.log(`  ${h.is_completed ? '✅' : '⬜'} ${h.habit_type}`);
      });
    }
    
    // 5. 测试切换习惯打卡状态
    console.log('\n5️⃣ 测试切换"练琴"打卡状态');
    const pianoHabit = habits?.find(h => h.habit_type === 'piano');
    
    if (pianoHabit) {
      const newStatus = !pianoHabit.is_completed;
      const { data: toggledHabit, error: toggleError } = await supabase
        .from('habit_checks')
        .update({ 
          is_completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null
        })
        .eq('id', pianoHabit.id)
        .select()
        .single();
      
      if (toggleError) {
        console.error('❌ 切换失败:', toggleError.message);
      } else {
        console.log('✅ 切换成功，练琴状态:', toggledHabit.is_completed ? '已完成' : '未完成');
      }
    } else {
      console.log('⚠️ 练琴打卡记录不存在，创建新记录...');
      const { data: newHabit, error: insertHabitError } = await supabase
        .from('habit_checks')
        .insert([
          {
            student_id: TEST_STUDENT_ID,
            date: today,
            habit_type: 'piano',
            is_completed: true,
            completed_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (insertHabitError) {
        console.error('❌ 创建习惯失败:', insertHabitError.message);
      } else {
        console.log('✅ 创建成功:', newHabit);
      }
    }
    
    // 6. 测试读取兴趣雷达数据
    console.log('\n6️⃣ 测试读取兴趣雷达数据');
    const { data: interests, error: interestsError } = await supabase
      .from('interest_scores')
      .select('*')
      .eq('student_id', TEST_STUDENT_ID);
    
    if (interestsError) {
      console.error('❌ 读取兴趣失败:', interestsError.message);
    } else {
      console.log('✅ 兴趣雷达数据:');
      interests.forEach(i => {
        console.log(`  ${i.interest_type}: ${i.score}`);
      });
    }
    
    // 7. 测试记录每日选择
    console.log('\n7️⃣ 测试记录今日选择');
    const { data: choice, error: choiceError } = await supabase
      .from('daily_choices')
      .insert([
        {
          student_id: TEST_STUDENT_ID,
          date: today,
          choice_type: 'history',
          choice_title: '读三国故事（测试）'
        }
      ])
      .select()
      .single();
    
    if (choiceError) {
      console.log('⚠️ 可能已记录过:', choiceError.message);
    } else {
      console.log('✅ 记录选择成功:', choice);
    }
    
    // 8. 测试读取课程时间线
    console.log('\n8️⃣ 测试读取今日课程时间线');
    const { data: timeline, error: timelineError } = await supabase
      .from('course_timeline')
      .select('*')
      .eq('student_id', TEST_STUDENT_ID)
      .eq('date', today)
      .order('time', { ascending: true });
    
    if (timelineError) {
      console.error('❌ 读取时间线失败:', timelineError.message);
    } else {
      console.log('✅ 今日课程时间线:', timeline.length, '个任务');
      timeline.forEach(t => {
        const statusIcon = t.status === 'completed' ? '✅' : 
                          t.status === 'current' ? '⏳' : '🔒';
        console.log(`  ${statusIcon} ${t.time} - ${t.event_title}`);
      });
    }
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (err) {
    console.error('❌ 测试过程中发生错误:', err);
  }
}

// 运行测试
testConnection();
