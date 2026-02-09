import { logger } from '../utils/logger.js';

// ====== 周历组件 ======
const WeekCalendar = {
  currentDate: new Date(),
  container: null,
  
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.render();
  },
  
  render() {
    if (!this.container) return;
    
    const today = new Date();
    const weekStart = this.getWeekStart(this.currentDate);
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const title = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    
    let html = `
      <div class="week-calendar">
        <div class="week-header">
          <button class="week-nav-btn" onclick="WeekCalendar.prevWeek()">‹</button>
          <span class="week-title">${title}</span>
          <button class="week-nav-btn" onclick="WeekCalendar.nextWeek()">›</button>
        </div>
        <div class="week-grid">
    `;
    
    // 生成7天
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth();
      const isFuture = date > today;
      const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      let dayClass = 'week-day';
      if (isToday) dayClass += ' today';
      if (isFuture) dayClass += ' future';
      
      const events = this.getDayEvents(date);
      
      html += `
        <div class="${dayClass}" onclick="WeekCalendar.selectDay(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})">
          <span class="week-day-name">${weekDayNames[i]}</span>
          <span class="week-day-num">${date.getDate()}</span>
          ${events.length > 0 ? `
            <div class="week-day-events">
              ${events.slice(0, 3).map(e => `
                <span class="week-event-dot" style="background:${e.color}" title="${e.title}"></span>
              `).join('')}
              ${events.length > 3 ? `<span class="more-events">+${events.length - 3}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  },
  
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  },
  
  getDayEvents(date) {
    if (!window.todaySchedule) return [];
    
    // 简化：显示所有事件（实际应该根据日期筛选）
    return window.todaySchedule.map(e => ({
      title: e.event_title,
      color: e.color || '#F4D03F'
    }));
  },
  
  prevWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.render();
  },
  
  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.render();
  },
  
  selectDay(year, month, date) {
    logger.log('选择日期:', year, month, date);
    // 跳转到指定日期的时间轴
  },
  
  refresh() {
    this.render();
  }
};

window.WeekCalendar = WeekCalendar;
