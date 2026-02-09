// ====== 统一日历模块 (日/周/月三视图) - 初中生创新版 ======
const Calendar = {
  currentView: 'day',
  currentDate: new Date(),
  today: new Date(),
  
  // 模拟数据 - 展示初中生创新功能
  mockData: {
    // 考试倒计时
    exams: [
      { name: '月考', date: '2026-02-20', daysLeft: 11 },
      { name: '开学考', date: '2026-03-03', daysLeft: 22 }
    ],
    // 作业截止
    homework: [
      { subject: '数学', title: 'P28-30练习', dueDate: '2026-02-12', color: '#3498db' },
      { subject: '英语', title: 'Unit 3背书', dueDate: '2026-02-13', color: '#e74c3c' }
    ],
    // 成就徽章
    achievements: [
      { name: '连续7天完成', icon: '🏆', date: '2026-02-15' },
      { name: '数学之星', icon: '⭐', date: '2026-02-10' }
    ]
  },
  
  init(containerId) {
    this.render();
  },
  
  // 切换视图
  switchView(view) {
    this.currentView = view;
    
    // 更新Tab状态
    document.querySelectorAll('.calendar-tab').forEach(tab => {
      tab.classList.toggle('active', tab.id === `tab-${view}`);
    });
    
    // 显示/隐藏视图容器
    document.querySelectorAll('.calendar-view').forEach(el => {
      el.style.display = 'none';
    });
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.style.display = 'block';
    
    // 重新渲染当前视图
    this.render();
  },
  
  // 主渲染入口
  render() {
    switch(this.currentView) {
      case 'day': this.renderDayView(); break;
      case 'week': this.renderWeekView(); break;
      case 'month': this.renderMonthView(); break;
    }
  },
  
  // ====== 日视图：时间轴 ======
  renderDayView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    
    // 复用现有的 renderCalendarTimeline 函数
    if (typeof renderCalendarTimeline === 'function') {
      renderCalendarTimeline();
    }
  },
  
  // ====== 周视图：7天网格 - 初中生创新版 ======
  renderWeekView() {
    const container = document.getElementById('weekCalendarContainer');
    if (!container) return;
    
    const weekStart = this.getWeekStart(this.currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // 格式化标题
    const title = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    
    // 模拟7天数据（实际项目中从 window.scheduleByDate 获取）
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = this.formatDate(date);
      
      // 模拟事件数据
      const mockEvents = this.getMockEventsForDate(dateKey);
      
      days.push({
        date,
        dateKey,
        isToday: this.isSameDay(date, this.today),
        isFuture: date > this.today,
        events: mockEvents.events,
        stats: mockEvents.stats,
        homework: this.getHomeworkForDate(dateKey),
        achievement: this.getAchievementForDate(dateKey)
      });
    }
    
    // 计算周统计
    const stats = this.calculateWeekStats(days);
    
    const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    let html = `
      <div class="week-calendar">
        <div class="week-header">
          <button class="week-nav-btn" onclick="Calendar.prevWeek()">‹</button>
          <span class="week-title">${title}</span>
          <button class="week-nav-btn" onclick="Calendar.nextWeek()">›</button>
        </div>
        
        <!-- 考试倒计时提醒 -->
        ${this.renderExamCountdown()}
        
        <div class="week-grid">
    `;
    
    days.forEach((day, i) => {
      const { date, isToday, isFuture, events, stats: dayStats, homework, achievement } = day;
      let dayClass = 'week-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      
      // 成就徽章
      const badgeHtml = achievement 
        ? `<div class="week-badge" title="${achievement.name}">${achievement.icon}</div>` 
        : '';
      
      // 学习时长柱状图
      const barHtml = dayStats 
        ? `<div class="study-bar"><div class="study-bar-fill" style="width:${Math.min(dayStats.hours * 20, 100)}%"></div></div>`
        : '';
      
      // 作业标记
      const homeworkHtml = homework 
        ? `<div class="homework-tag" style="border-color:${homework.color}">${homework.subject}</div>`
        : '';
      
      // 事件小圆点（最多显示3个）
      const eventDots = events.slice(0, 3).map(e => 
        `<span class="week-event-dot" style="background:${e.color || '#F4D03F'}" title="${e.title}"></span>`
      ).join('');
      
      html += `
        <div class="${dayClass}" onclick="Calendar.selectDay(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})">
          <span class="week-day-name">${weekDayNames[i]}</span>
          <span class="week-day-num">${date.getDate()}</span>
          ${badgeHtml}
          ${homeworkHtml}
          ${events.length > 0 ? `<div class="week-day-events">${eventDots}</div>` : ''}
          ${barHtml}
        </div>
      `;
    });
    
    html += `
        </div>
        <!-- 周统计面板 -->
        <div class="week-stats">
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.totalEvents}</div>
            <div class="week-stat-label">📅 总日程</div>
          </div>
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.completed}</div>
            <div class="week-stat-label">✅ 已完成</div>
          </div>
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.completionRate}%</div>
            <div class="week-stat-label">📈 完成率</div>
          </div>
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.studyHours}h</div>
            <div class="week-stat-label">📚 学习时长</div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  // ====== 渲染考试倒计时 ======
  renderExamCountdown() {
    const upcoming = this.mockData.exams.filter(e => {
      const examDate = new Date(e.date);
      const diff = Math.ceil((examDate - this.today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 14;
    });
    
    if (upcoming.length === 0) return '';
    
    const exam = upcoming[0];
    return `
      <div class="exam-countdown">
        <span class="exam-icon">🎯</span>
        <span class="exam-name">${exam.name}</span>
        <span class="exam-days">${exam.daysLeft}天后</span>
      </div>
    `;
  },
  
  // ====== 月视图：月历网格 - 初中生创新版 ======
  renderMonthView() {
    const container = document.getElementById('monthCalendarContainer');
    if (!container) return;
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    // 月份标题
    const title = `${year}年 ${monthNames[month]}`;
    
    // 模拟数据
    const stats = this.calculateMonthStats(year, month);
    
    let html = `
      <div class="month-calendar">
        <div class="month-header">
          <button class="month-nav-btn" onclick="Calendar.prevMonth()">‹</button>
          <span class="month-title">${title}</span>
          <button class="month-nav-btn" onclick="Calendar.nextMonth()">›</button>
        </div>
        
        <!-- 月度目标进度 -->
        ${this.renderMonthlyGoal()}
        
        <div class="weekday-header">
          <span>日</span><span>一</span><span>二</span><span>三</span>
          <span>四</span><span>五</span><span>六</span>
        </div>
        <div class="month-days">
    `;
    
    // 上月填充
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      html += `<div class="month-day other-month" data-date="${year}-${month}-${day}">${day}</div>`;
    }
    
    // 当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateKey = `${year}-${month}-${day}`;
      const date = new Date(year, month, day);
      const isToday = this.isSameDay(date, this.today);
      const isFuture = date > this.today;
      const dayEvents = this.getMockEventsForDate(dateKey);
      const homework = this.getHomeworkForDate(dateKey);
      const exam = this.getExamForDate(dateKey);
      
      let dayClass = 'month-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      if (dayEvents.events.length > 0) dayClass += ' has-event';
      if (homework) dayClass += ' has-homework';
      if (exam) dayClass += ' has-exam';
      
      // 多种指示点
      let indicators = '';
      if (exam) indicators += `<span class="day-indicator exam" title="${exam.name}">📅</span>`;
      if (homework) indicators += `<span class="day-indicator homework" style="background:${homework.color}" title="${homework.title}"></span>`;
      
      // 事件指示点（最多2个）
      const eventDots = dayEvents.events.slice(0, 2).map(e => 
        `<div class="day-event-dot" style="background:${e.color || '#F4D03F'}"></div>`
      ).join('');
      
      html += `
        <div class="${dayClass}" data-date="${dateKey}" onclick="Calendar.selectDay(${year}, ${month}, ${day})">
          <span class="day-number">${day}</span>
          ${indicators}
          ${dayEvents.events.length > 0 ? `<div class="day-events">${eventDots}</div>` : ''}
        </div>
      `;
    }
    
    // 下月填充
    const totalCells = startDayOfWeek + lastDay.getDate();
    const nextMonthDays = 42 - totalCells;
    for (let day = 1; day <= nextMonthDays; day++) {
      html += `<div class="month-day other-month" data-date="${year}-${month + 1}-${day}">${day}</div>`;
    }
    
    html += `
        </div>
        <!-- 月统计面板 -->
        <div class="month-stats">
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.activeDays}</div>
            <div class="month-stat-label">📅 有日程</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.completionRate}%</div>
            <div class="month-stat-label">✅ 完成率</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.examCount}</div>
            <div class="month-stat-label">🎯 考试</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.homeworkCount}</div>
            <div class="month-stat-label">📝 作业</div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  // ====== 渲染月度目标 ======
  renderMonthlyGoal() {
    const progress = 65; // 模拟进度
    return `
      <div class="monthly-goal">
        <div class="goal-label">📚 本月目标</div>
        <div class="goal-bar">
          <div class="goal-bar-fill" style="width: ${progress}%"></div>
        </div>
        <div class="goal-text">${progress}% 完成</div>
      </div>
    `;
  },
  
  // ====== 辅助函数 ======
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  },
  
  isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },
  
  formatDate(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  },
  
  // 获取某日模拟事件
  getMockEventsForDate(dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    
    // 基础事件（每天都有）
    const baseEvents = [
      { title: '早读', color: '#3498db', status: 'completed' },
      { title: '复盘', color: '#9b59b6', status: 'pending' }
    ];
    
    // 根据日期添加变化
    const dayEvents = [];
    
    // 周末添加运动
    const date = new Date(2026, month - 1, day);
    if (date.getDay() === 0 || date.getDay() === 6) {
      dayEvents.push({ title: '运动', color: '#2ecc71', status: 'pending' });
    }
    
    // 随机添加科目
    const subjects = ['数学', '英语', '语文', '物理', '化学'];
    if (day % 2 === 0) {
      dayEvents.push({ 
        title: subjects[day % subjects.length], 
        color: '#e74c3c', 
        status: Math.random() > 0.5 ? 'completed' : 'pending' 
      });
    }
    
    return {
      events: [...baseEvents, ...dayEvents],
      stats: {
        hours: 2 + Math.floor(Math.random() * 4),
        completed: Math.random() > 0.3
      }
    };
  },
  
  // 获取某日作业
  getHomeworkForDate(dateKey) {
    return this.mockData.homework.find(h => h.dueDate === dateKey);
  },
  
  // 获取某日考试
  getExamForDate(dateKey) {
    return this.mockData.exams.find(e => e.date === dateKey);
  },
  
  // 获取某日成就
  getAchievementForDate(dateKey) {
    return this.mockData.achievements.find(a => a.date === dateKey);
  },
  
  calculateWeekStats(days) {
    let totalEvents = 0;
    let completed = 0;
    let studyHours = 0;
    
    days.forEach(day => {
      totalEvents += day.events.length;
      completed += day.events.filter(e => e.status === 'completed').length;
      if (day.stats) studyHours += day.stats.hours;
    });
    
    const completionRate = totalEvents > 0 ? Math.round(completed / totalEvents * 100) : 0;
    
    return { totalEvents, completed, completionRate, studyHours };
  },
  
  calculateMonthStats(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let activeDays = 0;
    let examCount = this.mockData.exams.filter(e => {
      const [, eMonth] = e.date.split('-').map(Number);
      return eMonth === month + 1;
    }).length;
    let homeworkCount = this.mockData.homework.filter(h => {
      const [, hMonth] = h.dueDate.split('-').map(Number);
      return hMonth === month + 1;
    }).length;
    
    for (let day = 1; day <= lastDay; day++) {
      const events = this.getMockEventsForDate(`${year}-${month + 1}-${day}`);
      if (events.events.length > 0) activeDays++;
    }
    
    const completed = Math.floor(activeDays * 0.7);
    const completionRate = activeDays > 0 ? Math.round(completed / activeDays * 100) : 0;
    
    return { totalDays: lastDay, activeDays, completed, completionRate, examCount, homeworkCount };
  },
  
  // ====== 导航操作 ======
  prevWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.renderWeekView();
  },
  
  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.renderWeekView();
  },
  
  prevMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.renderMonthView();
  },
  
  nextMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.renderMonthView();
  },
  
  selectDay(year, month, day) {
    console.log('选择日期:', year, month + 1, day);
    // 点击日期跳转到日视图
    // this.switchView('day');
  },
  
  refresh() {
    this.render();
  }
};

// 暴露到全局
window.Calendar = Calendar;
