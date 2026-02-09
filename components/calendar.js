// ====== 统一日历模块 (日/周/月三视图) ======
const Calendar = {
  currentView: 'day',
  currentDate: new Date(),
  today: new Date(),
  
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
  
  // ====== 周视图：7天网格 ======
  renderWeekView() {
    const container = document.getElementById('weekCalendarContainer');
    if (!container) return;
    
    const weekStart = this.getWeekStart(this.currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // 格式化标题
    const title = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    
    // 获取7天数据
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        isToday: this.isSameDay(date, this.today),
        isFuture: date > this.today,
        events: this.getDayEvents(date)
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
        <div class="week-grid">
    `;
    
    days.forEach((day, i) => {
      const { date, isToday, isFuture, events } = day;
      let dayClass = 'week-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      
      // 事件小圆点（最多显示3个）
      const eventDots = events.slice(0, 3).map(e => 
        `<span class="week-event-dot" style="background:${e.color || '#F4D03F'}" title="${e.title}"></span>`
      ).join('');
      
      html += `
        <div class="${dayClass}" onclick="Calendar.selectDay(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})">
          <span class="week-day-name">${weekDayNames[i]}</span>
          <span class="week-day-num">${date.getDate()}</span>
          ${events.length > 0 ? `<div class="week-day-events">${eventDots}</div>` : ''}
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="week-stats">
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.totalEvents}</div>
            <div class="week-stat-label">总日程</div>
          </div>
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.completed}</div>
            <div class="week-stat-label">已完成</div>
          </div>
          <div class="week-stat-item">
            <div class="week-stat-value">${stats.completionRate}%</div>
            <div class="week-stat-label">完成率</div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  // ====== 月视图：月历网格 ======
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
    
    // 计算统计
    const stats = this.calculateMonthStats(year, month);
    
    let html = `
      <div class="month-calendar">
        <div class="month-header">
          <button class="month-nav-btn" onclick="Calendar.prevMonth()">‹</button>
          <span class="month-title">${title}</span>
          <button class="month-nav-btn" onclick="Calendar.nextMonth()">›</button>
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
      html += `<div class="month-day other-month" data-date="${year}-${month}-${day}">${day}</div>`;
    }
    
    // 当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateKey = `${year}-${month}-${day}`;
      const date = new Date(year, month, day);
      const isToday = this.isSameDay(date, this.today);
      const isFuture = date > this.today;
      const dayEvents = this.getDayEvents(date);
      
      let dayClass = 'month-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      if (dayEvents.length > 0) dayClass += ' has-event';
      
      // 事件指示点（最多2个）
      const eventDots = dayEvents.slice(0, 2).map(e => 
        `<div class="day-event-dot" style="background:${e.color || '#F4D03F'}"></div>`
      ).join('');
      
      html += `
        <div class="${dayClass}" data-date="${dateKey}" onclick="Calendar.selectDay(${year}, ${month}, ${day})">
          <span class="day-number">${day}</span>
          ${dayEvents.length > 0 ? `<div class="day-events">${eventDots}</div>` : ''}
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
        <div class="month-stats">
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.totalDays}</div>
            <div class="month-stat-label">总天数</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.activeDays}</div>
            <div class="month-stat-label">有日程</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.completedRate}%</div>
            <div class="month-stat-label">完成率</div>
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
  
  getDayEvents(date) {
    if (!window.todaySchedule || !Array.isArray(window.todaySchedule)) return [];
    // 简化：返回所有事件（实际应该按日期筛选）
    return window.todaySchedule.map(e => ({
      title: e.event_title,
      color: e.color || '#F4D03F',
      status: e.status
    }));
  },
  
  calculateWeekStats(days) {
    let totalEvents = 0;
    let completed = 0;
    
    days.forEach(day => {
      totalEvents += day.events.length;
      completed += day.events.filter(e => e.status === 'completed').length;
    });
    
    const completionRate = totalEvents > 0 ? Math.round(completed / totalEvents * 100) : 0;
    
    return { totalEvents, completed, completionRate };
  },
  
  calculateMonthStats(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let activeDays = 0;
    let completed = 0;
    let total = 0;
    
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const events = this.getDayEvents(date);
      if (events.length > 0) activeDays++;
      total += events.length;
      completed += events.filter(e => e.status === 'completed').length;
    }
    
    const completedRate = total > 0 ? Math.round(completed / total * 100) : 0;
    
    return { totalDays: lastDay, activeDays, completed, total, completedRate };
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
    // 点击日期跳转到日视图
    console.log('选择日期:', year, month + 1, day);
    // 可以在这里设置 currentDate 并切换到日视图
  },
  
  refresh() {
    this.render();
  }
};

// 暴露到全局
window.Calendar = Calendar;
