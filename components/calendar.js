// ====== 统一日历模块 (日/周/月三视图) - iOS原生设计 + 初中生创新 ======
// 基于 Apple UI Designer 和 Mobile Design 原则优化

const Calendar = {
  currentView: 'day',
  currentDate: new Date(),
  today: new Date(),
  
  // 模拟数据 - 初中生特色
  mockData: {
    exams: [
      { name: '月考', date: '2026-02-20', daysLeft: 11 },
      { name: '开学考', date: '2026-03-03', daysLeft: 22 }
    ],
    homework: [
      { subject: '数学', title: 'P28-30练习', dueDate: '2026-02-12', color: '#007AFF' },
      { subject: '英语', title: 'Unit 3背书', dueDate: '2026-02-13', color: '#FF3B30' }
    ],
    achievements: [
      { name: '连续7天完成', icon: '🏆', date: '2026-02-15' },
      { name: '数学之星', icon: '⭐', date: '2026-02-10' }
    ]
  },
  
  // 最小触控区 (44x44px) - Mobile Design 原则
  MIN_TOUCH_SIZE: 44,
  
  init() {
    this.render();
  },
  
  // 切换视图 - 流畅过渡动画
  switchView(view) {
    const oldView = this.currentView;
    this.currentView = view;
    
    // 更新Tab状态
    document.querySelectorAll('.calendar-tab').forEach(tab => {
      tab.classList.toggle('active', tab.id === `tab-${view}`);
    });
    
    // 显示/隐藏视图容器 + 动画
    document.querySelectorAll('.calendar-view').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all 0.25s ease';
    });
    
    setTimeout(() => {
      document.querySelectorAll('.calendar-view').forEach(el => {
        el.style.display = 'none';
      });
      const viewEl = document.getElementById(`view-${view}`);
      if (viewEl) {
        viewEl.style.display = 'block';
        // 强制重绘
        viewEl.offsetHeight;
        viewEl.style.opacity = '1';
        viewEl.style.transform = 'translateY(0)';
      }
    }, 25);
    
    this.render();
  },
  
  render() {
    switch(this.currentView) {
      case 'day': this.renderDayView(); break;
      case 'week': this.renderWeekView(); break;
      case 'month': this.renderMonthView(); break;
    }
  },
  
  // 日视图：复用现有时间轴
  renderDayView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    if (typeof renderCalendarTimeline === 'function') {
      renderCalendarTimeline();
    }
  },
  
  // 周视图 - iOS原生设计 + 初中生创新
  renderWeekView() {
    const container = document.getElementById('weekCalendarContainer');
    if (!container) return;
    
    const weekStart = this.getWeekStart(this.currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const title = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    
    // 获取7天数据
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = this.formatDate(date);
      
      days.push({
        date,
        dateKey,
        isToday: this.isSameDay(date, this.today),
        isFuture: date > this.today,
        ...this.getMockDayData(dateKey)
      });
    }
    
    const stats = this.calculateWeekStats(days);
    const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    // 考试倒计时（距离最近的一次）
    const upcomingExam = this.getUpcomingExam();
    
    let html = `
      <div class="week-calendar">
        ${upcomingExam ? `
          <div class="week-countdown">
            <div class="countdown-icon">🎯</div>
            <div class="countdown-info">
              <div class="countdown-label">${upcomingExam.name}</div>
              <div class="countdown-days">${upcomingExam.daysLeft}天后</div>
            </div>
          </div>
        ` : ''}
        
        <div class="week-header">
          <button class="week-nav-btn" onclick="Calendar.prevWeek()" aria-label="上一周">‹</button>
          <span class="week-title">${title}</span>
          <button class="week-nav-btn" onclick="Calendar.nextWeek()" aria-label="下一周">›</button>
        </div>
        
        <div class="week-grid">
    `;
    
    days.forEach((day, i) => {
      const { date, isToday, isFuture, events, stats: dayStats, homework, achievement } = day;
      
      // 构建班级名称
      let dayClass = 'week-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      
      // 成就徽章
      const badgeHtml = achievement ? `
        <div class="week-badge" aria-label="${achievement.name}">${achievement.icon}</div>
      ` : '';
      
      // 作业标签
      const homeworkHtml = homework ? `
        <div class="week-homework" style="--hw-color: ${homework.color}">
          ${homework.subject}
        </div>
      ` : '';
      
      // 学习时长进度条
      const progressHtml = dayStats ? `
        <div class="week-progress" aria-label="今日学习${dayStats.hours}小时">
          <div class="week-progress-bar">
            <div class="week-progress-fill" style="width: ${Math.min(dayStats.hours * 16.67, 100)}%"></div>
          </div>
        </div>
      ` : '';
      
      // 事件点
      const dotsHtml = events.length > 0 ? `
        <div class="week-events">
          ${events.slice(0, 4).map(e => `
            <span class="event-dot" style="background: ${e.color}" title="${e.title}"></span>
          `).join('')}
        </div>
      ` : '';
      
      html += `
        <button class="${dayClass}" 
                onclick="Calendar.selectDay(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})"
                aria-label="${weekDayNames[i]} ${date.getDate()}日，${events.length}个日程">
          <span class="week-day-name">${weekDayNames[i]}</span>
          <span class="week-day-num">${date.getDate()}</span>
          ${badgeHtml}
          ${homeworkHtml}
          ${dotsHtml}
          ${progressHtml}
        </button>
      `;
    });
    
    // 周统计
    html += `
        </div>
        <div class="week-stats">
          <div class="stat-item">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">日程</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">完成</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.completion}%</div>
            <div class="stat-label">完成率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.hours}h</div>
            <div class="stat-label">学习</div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  // 月视图 - 清晰层级 + 响应式
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
    
    const title = `${year}年 ${monthNames[month]}`;
    const stats = this.calculateMonthStats(year, month);
    
    // 月度目标进度
    const monthlyProgress = 65;
    
    let html = `
      <div class="month-calendar">
        <div class="month-header">
          <button class="month-nav-btn" onclick="Calendar.prevMonth()" aria-label="上个月">‹</button>
          <span class="month-title">${title}</span>
          <button class="month-nav-btn" onclick="Calendar.nextMonth()" aria-label="下个月">›</button>
        </div>
        
        <!-- 月度目标 - iOS进度环风格 -->
        <div class="month-goal">
          <div class="goal-ring">
            <svg viewBox="0 0 36 36">
              <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="ring-fill" stroke-dasharray="${monthlyProgress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <span class="ring-text">${monthlyProgress}%</span>
          </div>
          <div class="goal-info">
            <div class="goal-title">本月目标</div>
            <div class="goal-stats">${stats.days}天 · ${stats.exams}考试 · ${stats.homework}作业</div>
          </div>
        </div>
        
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
      html += `<div class="month-day other-month">${day}</div>`;
    }
    
    // 当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateKey = `${year}-${month + 1}-${day}`;
      const date = new Date(year, month, day);
      const isToday = this.isSameDay(date, this.today);
      const isFuture = date > this.today;
      const { events, homework, exam } = this.getMockDayData(dateKey);
      
      let dayClass = 'month-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      if (events.length > 0) dayClass += ' has-events';
      if (homework) dayClass += ' has-homework';
      if (exam) dayClass += ' has-exam';
      
      // 指示器
      let indicators = '';
      if (exam) indicators += '<span class="day-dot exam" aria-label="考试日"></span>';
      if (homework) indicators += `<span class="day-dot homework" style="background: ${homework.color}" aria-label="${homework.title}"></span>`;
      
      // 事件点
      const dots = events.slice(0, 2).map(e => 
        `<span class="day-dot" style="background: ${e.color}"></span>`
      ).join('');
      
      html += `
        <button class="${dayClass}" 
                onclick="Calendar.selectDay(${year}, ${month}, ${day})"
                aria-label="${month + 1}月${day}日，${events.length}个日程">
          <span class="day-num">${day}</span>
          ${indicators || dots ? `<div class="day-indicators">${indicators || dots}</div>` : ''}
        </button>
      `;
    }
    
    // 下月填充
    const totalCells = startDayOfWeek + lastDay.getDate();
    const nextMonthDays = 42 - totalCells;
    for (let day = 1; day <= nextMonthDays; day++) {
      html += `<div class="month-day other-month">${day}</div>`;
    }
    
    html += `
        </div>
        <div class="month-stats">
          <div class="stat-item">
            <div class="stat-value">${stats.active}</div>
            <div class="stat-label">有日程</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.completion}%</div>
            <div class="stat-label">完成率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.exams}</div>
            <div class="stat-label">考试</div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
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
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },
  
  getMockDayData(dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    const date = new Date(2026, month - 1, day);
    
    // 基础事件
    const events = [
      { title: '早读', color: '#007AFF', status: Math.random() > 0.3 ? 'completed' : 'pending' },
      { title: '复盘', color: '#5856D6', status: 'pending' }
    ];
    
    // 周末加运动
    if (date.getDay() === 0 || date.getDay() === 6) {
      events.push({ title: '运动', color: '#34C759', status: 'pending' });
    }
    
    // 随机科目
    const subjects = ['数学', '英语', '语文'];
    if (day % 2 === 0) {
      events.push({ 
        title: subjects[day % subjects.length], 
        color: '#FF9500', 
        status: Math.random() > 0.4 ? 'completed' : 'pending' 
      });
    }
    
    return {
      events,
      stats: { hours: 2 + Math.floor(Math.random() * 4) },
      homework: null,
      exam: null
    };
  },
  
  getHomeworkForDate(dateKey) {
    return this.mockData.homework.find(h => h.dueDate === dateKey);
  },
  
  getExamForDate(dateKey) {
    return this.mockData.exams.find(e => e.date === dateKey);
  },
  
  getUpcomingExam() {
    return this.mockData.exams[0];
  },
  
  calculateWeekStats(days) {
    let total = 0, completed = 0, hours = 0;
    days.forEach(d => {
      total += d.events.length;
      completed += d.events.filter(e => e.status === 'completed').length;
      if (d.stats) hours += d.stats.hours;
    });
    return { total, completed, completion: total ? Math.round(completed/total*100) : 0, hours };
  },
  
  calculateMonthStats(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let active = 0;
    
    for (let d = 1; d <= lastDay; d++) {
      const data = this.getMockDayData(`${year}-${month + 1}-${d}`);
      if (data.events.length > 0) active++;
    }
    
    const exams = this.mockData.exams.filter(e => {
      const [, m] = e.date.split('-').map(Number);
      return m === month + 1;
    }).length;
    
    const homework = this.mockData.homework.filter(h => {
      const [, m] = h.dueDate.split('-').map(Number);
      return m === month + 1;
    }).length;
    
    return { days: lastDay, active, completion: 65, exams, homework };
  },
  
  // 导航
  prevWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.renderWeekView();
  },
  
  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.renderWeekView();
  },
  
  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.renderMonthView();
  },
  
  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.renderMonthView();
  },
  
  selectDay(year, month, day) {
    console.log('选择日期:', year, month + 1, day);
  },
  
  refresh() {
    this.render();
  }
};

window.Calendar = Calendar;
