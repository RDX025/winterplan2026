export const REWARDS = [
  { name: '青龙偃月刀', icon: '⚔️', condition: '新手礼包', stl: 'assets/stl/obj_1_tail.stl', unlocked: true },
  { name: '方天画戟', icon: '🔱', condition: '完成3天数学', stl: 'assets/stl/fangtian_huaji.stl', unlocked: false },
  { name: '丈八蛇矛', icon: '🔱', condition: '完成5天打卡', stl: 'assets/stl/zhangba_shemao.stl', unlocked: false },
  { name: '诸葛连弩', icon: '🏹', condition: '数学进阶挑战', stl: 'assets/stl/zhugeliannu.stl', unlocked: false }
];

export const ACHIEVEMENTS = [
  { name: '初入江湖', desc: '完成第1天', icon: '🎖️', unlocked: true },
  { name: '勤学苦练', desc: '连续3天完成所有任务', icon: '🏆', unlocked: true },
  { name: '持之以恒', desc: '完成7天打卡', icon: '🧭', unlocked: true },
  { name: '半程侠影', desc: '完成第7天', icon: '🥋', unlocked: false },
  { name: '登峰造极', desc: '完成14天打卡', icon: '🗡️', unlocked: false },
  { name: '琴剑双修', desc: '完成5次钢琴+运动', icon: '🎹', unlocked: false },
  { name: '晨光侠客', desc: '早起打卡5天', icon: '🌅', unlocked: false },
  { name: '夜行不辍', desc: '早睡打卡5天', icon: '🌙', unlocked: false },
  { name: '博览群书', desc: '阅读打卡7天', icon: '📚', unlocked: false },
  { name: '运动达人', desc: '运动打卡7天', icon: '🏃', unlocked: false }
];

export function initRewards() {
  renderRewards();
}

export function renderRewards() {
  const container = document.getElementById('rewardsGrid');
  if (!container) return;

  container.innerHTML = REWARDS.map(reward => {
    const downloadLink = reward.stl && reward.unlocked ? `
        <a class="reward-download" href="${reward.stl}" download>下载STL</a>
      ` : '';
    return `
      <div class="reward-card ${reward.unlocked ? 'unlocked' : 'locked'}">
        <div class="reward-model">${reward.unlocked ? reward.icon : '🔒'}</div>
        <span class="reward-name">${reward.name}</span>
        <span class="reward-status">${reward.unlocked ? '已解锁' : reward.condition}</span>
        ${downloadLink}
      </div>
    `;
  }).join('');
}

export function initAchievements() {
  renderAchievements();
}

export function renderAchievements() {
  const container = document.getElementById('achievementsGrid');
  if (!container) return;

  container.innerHTML = ACHIEVEMENTS.map(achievement => `
    <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <span class="achievement-name">${achievement.name}</span>
        <span class="achievement-desc">${achievement.desc}</span>
      </div>
    </div>
  `).join('');
}
