import { logger } from '../utils/logger.js';

// ====== 月历组件 ======
const MonthCalendar = {
  currentDate: new Date(),
  container: null,
  
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.render();
    this.bindEvents();
  },
  
  render() {
    if (!this.container) return;
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=周日
    
    const today = new Date();
    const todayKey = this.formatDate(today);
    
    // 月份标题
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    let html = `
      <div class="month-calendar">
        <div class="month-header">
          <button class="month-nav-btn" onclick="MonthCalendar.prevMonth()">‹</button>
          <span class="month-title">${year}年 ${monthNames[month]}</span>
          <button class="month-nav-btn" onclick="MonthCalendar.nextMonth()">›</button>
        </div>
        <div class="month-grid">
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
      html += `<div class="month-day other-month" data-date="${this.formatDate(new Date(year, month - 1, day))}">${day}</div>`;
    }
    
    // 当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day);
      const dateKey = this.formatDate(dateObj);
      const isToday = dateKey === todayKey;
      const isFuture = dateObj > today;
      const dayEvents = this.getEventsForDate(dateKey);
      
      let dayClass = 'month-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      if (dayEvents.length > 0) dayClass += ' has-events';
      
      html += `
        <div class="${dayClass}" data-date="${dateKey}" onclick="MonthCalendar.selectDate('${dateKey}')">
          <span class="day-number">${day}</span>
          ${dayEvents.length > 0 ? `<span class="day-dot" style="background:${dayEvents[0].color}"></span>` : ''}
        </div>
      `;
    }
    
    // 下月填充
    const totalCells = startDayOfWeek + lastDay.getDate();
    const nextMonthDays = 42 - totalCells;
    for (let day = 1; day <= nextMonthDays; day++) {
      html += `<div class="month-day other-month" data-date="${this.formatDate(new Date(year, month + 1, day))}">${day}</div>`;
    }
    
    html += `
          </div>
        </div>
        ${this.renderMonthStats()}
      </div>
    `;
    
    this.container.innerHTML = html;
  },
  
  getEventsForDate(dateKey) {
    if (!window.scheduleStore) return [];
    return window.scheduleStore.getByDate(dateKey) || [];
  },
  
  renderMonthStats() {
    // 周统计简化版
    return `
      <div class="month-stats">
        <span class="stat-item">📚 学习 ${this.getStudyDays()} 天</span>
        <span class="stat-item">✅ 完成 ${this.getCompletedDays()} 天</span>
      </div>
    `;
  },
  
  getStudyDays() {
    const todayKey = this.formatDate(new Date());
    return window.scheduleStore?.getByDate(todayKey)?.length || 0;
  },
  
  getCompletedDays() {
    const todayKey = this.formatDate(new Date());
    return window.scheduleStore?.getByDate(todayKey)?.filter(e => e.status === 'completed').length || 0;
  },
  
  prevMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.render();
  },
  
  nextMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.render();
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
  
  selectDate(dateKey) {
    // 点击日期跳转到当日时间轴
    logger.log('选择日期:', dateKey);
    // 可以在这里添加跳转到指定日期的逻辑
  },
  
  bindEvents() {
    // 预留扩展
  },
  
  refresh() {
    this.render();
  }
};

// 暴露到全局
window.MonthCalendar = MonthCalendar;
