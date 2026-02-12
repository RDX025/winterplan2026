import { logger } from '../utils/logger.js';

// ====== 统一日历模块 (日/周/月三视图) ======
// 支持真实数据同步 from Supabase + LocalStorage

const Calendar = {
  currentView: 'day',
  currentDate: new Date(),
  today: new Date(),
  
  // mockData removed
  
  init() {
    this._ensureDebugPanel();
    this._debug('Calendar.init');
    this.render();

    // 订阅 ScheduleStore 变更，实时刷新周/月视图
    if (window.scheduleStore && typeof window.scheduleStore.subscribe === 'function') {
      window.scheduleStore.subscribe(() => {
        this._debug('ScheduleStore.update', { keys: Object.keys(window.scheduleStore._data || {}).length });
        this.refresh();
      });
    } else {
      this._debug('ScheduleStore.subscribe missing');
    }
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
    
    this.render();
  },
  
  render() {
    switch(this.currentView) {
      case 'day': this.renderDayView(); break;
      case 'week': this.renderWeekView(); break;
      case 'month': this.renderMonthView(); break;
    }
  },
  
  // 日视图：时间轴
  renderDayView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    if (typeof renderCalendarTimeline === 'function') {
      renderCalendarTimeline();
    }
  },
  
  // 周视图：7天网格
  renderWeekView() {
    const container = document.getElementById('weekCalendarContainer');
    if (!container) return;
    
    // 详细调试：打印 ScheduleStore 状态
    const ss = window.scheduleStore;
    const ssData = ss ? (ss._data || {}) : {};
    const ssKeys = Object.keys(ssData);
    const ssToday = ss ? ss.getToday() : [];
    const todayKey = this.formatDate(new Date());
    
    this._debug('renderWeekView START', { 
      currentDate: this.formatDate(this.currentDate),
      todayKey: todayKey,
      scheduleStoreExists: !!ss,
      scheduleStoreKeys: ssKeys.length,
      todayEventsCount: ssToday.length,
      todayEvents: JSON.stringify(ssToday.map(e => e.event_title))
    });
    
    const weekStart = this.getWeekStart(this.currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const title = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    
    // 获取7天数据 - 使用真实数据
    const days = [];
    let totalEvents = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = this.formatDate(date);
      
      // 从真实数据获取
      const events = this.getRealEventsForDate(dateKey);
      this._debug('getRealEventsForDate', { dateKey, eventsCount: events.length });
      const stats = this.calculateDayStats(events);
      
      totalEvents += events.length;

    days.push({
        date,
        dateKey,
        isToday: this.isSameDay(date, this.today),
        isFuture: date > this.today,
        events,
        stats,
        homework: null,
        achievement: null
      });
    }

    this._debug('weekView.events', { totalEvents });
    const stats = this.calculateWeekStats(days);
    const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDebug = days.map(d => `${d.dateKey}:${d.events.length}`).join(' | ');
    
    let html = `
      <div class="week-calendar">
        <div class="week-header">
          <button class="week-nav-btn" onclick="Calendar.prevWeek()">‹</button>
          <span class="week-title">${title}</span>
          <button class="week-nav-btn" onclick="Calendar.nextWeek()">›</button>
        </div>
        <div class="week-debug" style="font-size:12px;color:#7CFF7C;margin:4px 0 8px;word-break:break-all;">
          debug: ${weekDebug}
        </div>
        <div class="week-grid">
    `;
    
    // 第一行：星期标题
    html += '<div class="week-day-header">';
    weekDayNames.forEach(name => html += `<span>${name}</span>`);
    html += '</div>';
    
    // 第二行开始：7天日期 + 事件垂直排列
    html += '<div class="week-days-row">';
    days.forEach((day, i) => {
      const { date, isToday, isFuture, events } = day;
      
      let dayClass = 'week-day-cell';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      
      // 事件垂直列表
      const eventRows = events.map(e => 
        `<div class="week-event-row" style="background:${e.color || '#F4D03F'};opacity:${e.status === 'completed' ? 0.3 : 1}">
          <span class="week-event-time">${String(e.startHour).padStart(2, '0')}:${String(e.startMin || 0).padStart(2, '0')}</span>
          <span class="week-event-title">${e.event_title}</span>
        </div>`
      ).join('');
      
      html += `
        <div class="${dayClass}" onclick="Calendar.selectDay(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})">
          <div class="week-day-header-row">
            <span class="week-day-num">${date.getDate()}</span>
          </div>
          <div class="week-events-col">
            ${eventRows || '<span class="no-events">-</span>'}
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    html += `
        </div>
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
  
  // 月视图：月历网格
  renderMonthView() {
    const container = document.getElementById('monthCalendarContainer');
    if (!container) return;
    this._debug('renderMonthView', { date: this.formatDate(this.currentDate) });
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    const title = `${year}年 ${monthNames[month]}`;
    
    const stats = this.calculateMonthStats(year, month);
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const monthKeys = window.scheduleStore ? Object.keys(window.scheduleStore._data || {}).filter(k => k.startsWith(monthPrefix)) : [];
    const monthDebugKeys = monthKeys.map(k => `${k}:${(window.scheduleStore._data[k]||[]).length}`).join(' | ');
    
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
        <div class="month-debug" style="font-size:12px;color:#7CFF7C;margin:4px 0 8px;word-break:break-all;">
          debug: ${monthDebugKeys || 'no keys'}
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
    
    let monthEvents = 0;
    // 当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = this.formatDate(date);
      const isToday = this.isSameDay(date, this.today);
      const isFuture = date > this.today;
      const dayEvents = this.getRealEventsForDate(dateKey);
      monthEvents += dayEvents.length;
      const homework = null;
      const exam = null;
      
      let dayClass = 'month-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      if (dayEvents.length > 0) dayClass += ' has-event';
      if (homework) dayClass += ' has-homework';
      if (exam) dayClass += ' has-exam';
      
      // 指示器
      let indicators = '';
      if (exam) indicators += `<span class="day-indicator exam">📅</span>`;
      if (homework) indicators += `<span class="day-indicator homework" style="background:${homework.color}"></span>`;
      
      // 事件点
      const eventDots = dayEvents.slice(0, 2).map(e => 
        `<div class="event-dot" style="background:${e.color || '#F4D03F'}"></div>`
      ).join('');
      
      html += `
        <div class="${dayClass}" onclick="Calendar.selectDay(${year}, ${month}, ${day})">
          <span class="day-number">${day}</span>
          ${indicators || (dayEvents.length > 0 ? `<div class="day-events">${eventDots}</div>` : '')}
        </div>
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
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.activeDays}</div>
            <div class="month-stat-label">📅 有日程</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.completedRate}%</div>
            <div class="month-stat-label">✅ 完成率</div>
          </div>
          <div class="month-stat-item">
            <div class="month-stat-value">${stats.examCount}</div>
            <div class="month-stat-label">🎯 考试</div>
          </div>
        </div>
      </div>
    `;
    
    this._debug('monthView.events', { monthEvents });
    container.innerHTML = html;
  },
  
  // ====== 真实数据函数 ======
  
  // 从真实数据获取某日事件
  getRealEventsForDate(dateKey) {
    // 优先使用真实数据 (ScheduleStore)
    if (window.scheduleStore) {
      const events = window.scheduleStore.getByDate(dateKey);
      if (events && events.length > 0) {
        return events.map(e => ({
          title: e.event_title,
          color: e.color || '#F4D03F',
          status: e.status
        }));
      }
    } else {
      this._debug('no scheduleStore');
    }
    
    // 无数据时返回空数组（不使用模拟数据）
    return [];
  },
  
  // 模拟日数据
  getMockDayData(dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    const date = new Date(2026, month - 1, day);
    
    const events = [
      { title: '早读', color: '#F4D03F', status: Math.random() > 0.3 ? 'completed' : 'pending' },
      { title: '复盘', color: '#9b59b6', status: 'pending' }
    ];
    
    if (date.getDay() === 0 || date.getDay() === 6) {
      events.push({ title: '运动', color: '#2ecc71', status: 'pending' });
    }
    
    const subjects = ['数学', '英语', '语文'];
    if (day % 2 === 0) {
      events.push({ 
        title: subjects[day % subjects.length], 
        color: '#e74c3c', 
        status: Math.random() > 0.4 ? 'completed' : 'pending' 
      });
    }
    
    return events;
  },
  
  // 计算日统计
  calculateDayStats(events) {
    const completed = events.filter(e => e.status === 'completed').length;
    const hours = events.length * 0.5 + Math.random() * 2;
    return { 
      hours: Math.round(hours * 10) / 10,
      completed 
    };
  },
  
  // 获取作业
  getHomeworkForDate(dateKey) {
    return null;
  },
  
  // 获取考试
  getExamForDate(dateKey) {
    return null;
  },
  
  // 获取成就
  getAchievementForDate(dateKey) {
    return null;
  },
  
  // 获取即将到来的考试
  getUpcomingExam() {
    return null;
  },
  
  // 计算周统计
  calculateWeekStats(days) {
    let totalEvents = 0;
    let completed = 0;
    let studyHours = 0;
    
    days.forEach(day => {
      totalEvents += day.events.length;
      completed += day.events.filter(e => e.status === 'completed').length;
      if (day.stats) studyHours += day.stats.hours || 0;
    });
    
    const completionRate = totalEvents > 0 ? Math.round(completed / totalEvents * 100) : 0;
    
    return { totalEvents, completed, completionRate, studyHours: Math.round(studyHours * 10) / 10 };
  },
  
  // 计算月统计
  calculateMonthStats(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let activeDays = 0;
    let completed = 0;
    let total = 0;
    
    for (let day = 1; day <= lastDay; day++) {
      const dateKey = this.formatDate(new Date(year, month, day));
      const events = this.getRealEventsForDate(dateKey);
      if (events.length > 0) activeDays++;
      total += events.length;
      completed += events.filter(e => e.status === 'completed').length;
    }
    
    const examCount = 0;
    
    const completedRate = total > 0 ? Math.round(completed / total * 100) : 0;
    
    return { totalDays: lastDay, activeDays, completed, completedRate, examCount };
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
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
  
  // 导航操作
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
    logger.log('选择日期:', year, month + 1, day);
  },
  
  refresh() {
    this._debug('Calendar.refresh', { view: this.currentView });
    this.render();
  },

  _ensureDebugPanel() {
    const section = document.getElementById('calendarSection');
    if (!section) return;
    if (section.querySelector('#calendarDebug')) return;
    const el = document.createElement('div');
    el.id = 'calendarDebug';
    el.style.cssText = 'margin-top:8px;padding:6px 8px;background:rgba(0,0,0,0.35);color:#7CFF7C;font-size:12px;border-radius:6px;font-family:monospace;';
    el.textContent = 'calendar debug ready';
    section.appendChild(el);
  },

  _debug(message, data) {
    const el = document.getElementById('calendarDebug');
    if (!el) return;
    const ts = new Date().toLocaleTimeString();
    const payload = data ? ' ' + JSON.stringify(data) : '';
    const line = `[${ts}] ${message}${payload}`;
    const lines = (el.dataset.lines ? el.dataset.lines.split('\n') : []).slice(-7);
    lines.push(line);
    el.dataset.lines = lines.join('\n');
    el.textContent = lines.join('\n');
  }
};

window.Calendar = Calendar;
