import { logger } from '../utils/logger.js';

let deps = {};

export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 22;
export const HOUR_HEIGHT = 60;

export function configureTimeline(options = {}) {
  deps = { ...deps, ...options };
}

export function initTimeline() {
  renderCalendarTimeline();
  initTimelineTouchDrag();
}

export function renderCalendarTimeline() {
  const container = document.getElementById('timelineContainer');
  if (!container) return;

  const todaySchedule = deps.getTodaySchedule ? deps.getTodaySchedule() : [];

  let hoursHtml = '';
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    const isNow = new Date().getHours() === h;
    hoursHtml += `
      <div class="hour-row ${isNow ? 'current-hour' : ''}" data-hour="${h}" style="height: ${HOUR_HEIGHT}px;" onclick="addEventAtHour(${h})">
        <div class="hour-label">${h < 10 ? '0' + h : h}:00</div>
        <div class="hour-line"></div>
      </div>
    `;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const nowPosition = (currentHour - TIMELINE_START_HOUR + currentMin / 60) * HOUR_HEIGHT;
  const nowLineHtml = (currentHour >= TIMELINE_START_HOUR && currentHour <= TIMELINE_END_HOUR) ? `
    <div class="now-indicator" style="top: ${nowPosition}px;">
      <span class="now-time">${currentHour}:${currentMin < 10 ? '0' + currentMin : currentMin}</span>
      <div class="now-line"></div>
    </div>
  ` : '';

  let eventsHtml = todaySchedule.map(item => {
    const startPos = (item.startHour - TIMELINE_START_HOUR + item.startMin / 60) * HOUR_HEIGHT;
    const duration = (item.endHour - item.startHour + (item.endMin - item.startMin) / 60) * HOUR_HEIGHT;
    const height = Math.max(duration, 40);
    const timeStr = `${item.startHour}:${item.startMin < 10 ? '0' + item.startMin : item.startMin} - ${item.endHour}:${item.endMin < 10 ? '0' + item.endMin : item.endMin}`;

    return `
      <div class="calendar-event-wrapper" data-id="${item.id}" style="top: ${startPos}px; height: ${height}px;">
        <div class="event-delete-bg">🗑️ 删除</div>
        <div class="event-edit-bg">✏️ 编辑</div>
        <div class="calendar-event ${item.status}" 
             data-id="${item.id}"
             style="height: 100%; background: ${item.color}20; border-left: 4px solid ${item.color};">
          <div class="event-content" onclick="openEditEventModal('${item.id}')">
            <span class="event-icon">${item.event_icon}</span>
            <div class="event-text">
              <span class="event-title">${item.event_title}</span>
              <span class="event-time">${timeStr}</span>
            </div>
            <span class="event-status-icon" data-id="${item.id}">${getStatusIcon(item.status)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const emptyHtml = todaySchedule.length === 0 
    ? '<div class="empty-schedule">📭 暂无日程<br><small>点击右上角"添加日程"开始规划</small></div>'
    : '';

  container.innerHTML = `
    <div class="calendar-timeline-header">
      <span>📅 今日日程</span>
      <button class="add-event-btn" onclick="showAddEventModal()">+ 添加日程</button>
    </div>
    <div class="calendar-timeline" id="calendarTimeline">
      <div class="hours-column">
        ${hoursHtml}
      </div>
      <div class="events-column" id="eventsColumn">
        ${nowLineHtml}
        ${eventsHtml}
        ${emptyHtml}
      </div>
    </div>
  `;
}

export function getStatusIcon(status) {
  if (status === 'completed') return '✅';
  if (status === 'current') return '⏳';
  return '⬜';
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTop = 0;
let touchCurrentEvent = null;
let touchMode = null;
let isDragging = false;
let longPressTimer = null;
let isLongPress = false;
let draggedEvent = null;
let dragStartY = 0;

export function resetTimelineDragState() {
  isDragging = false;
  touchMode = null;
  isLongPress = false;
  touchCurrentEvent = null;
}

export function initTimelineTouchDrag() {
  document.addEventListener('touchstart', function(e) {
    const calendarEvent = e.target.closest('.calendar-event');
    if (calendarEvent) {
      const id = calendarEvent.dataset.id;
      if (id) eventTouchStart(e, id);
    }
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    const calendarEvent = e.target.closest('.calendar-event');
    if (calendarEvent && touchCurrentEvent) {
      const id = calendarEvent.dataset.id;
      if (id) eventTouchMove(e, id);
    }
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    const calendarEvent = e.target.closest('.calendar-event');
    if (calendarEvent && touchCurrentEvent) {
      const id = calendarEvent.dataset.id;
      if (id) eventTouchEnd(e, id);
    }
  }, { passive: false });
}

export function eventTouchStart(event, id) {
  if (event.target.closest('.event-status-icon')) {
    return;
  }

  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;

  const todaySchedule = deps.getTodaySchedule ? deps.getTodaySchedule() : [];
  touchCurrentEvent = todaySchedule.find(e => e.id === id);
  touchMode = null;
  isLongPress = false;

  const wrapper = event.target.closest('.calendar-event-wrapper');
  if (wrapper) {
    touchStartTop = parseFloat(wrapper.style.top) || 0;

    longPressTimer = setTimeout(() => {
      isLongPress = true;
      touchMode = 'drag';
      isDragging = true;
      wrapper.classList.add('dragging');

      if (navigator.vibrate) navigator.vibrate(50);
      if (deps.showToast) deps.showToast('📍 拖拽调整时间');
    }, 300);
  }
}

export function eventTouchMove(event, id) {
  if (!touchCurrentEvent) return;

  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  const eventEl = event.target.closest('.calendar-event');
  const wrapper = event.target.closest('.calendar-event-wrapper');
  if (!eventEl || !wrapper) return;

  if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  if (!touchMode && !isLongPress) {
    if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > Math.abs(deltaY)) {
      touchMode = 'swipe';
      isDragging = true;
    } else if (Math.abs(deltaY) > 15 && Math.abs(deltaY) > Math.abs(deltaX)) {
      touchMode = 'drag';
      isDragging = true;
      wrapper.classList.add('dragging');
    }
  }

  if (isLongPress && touchMode === 'drag') {
    event.preventDefault();
    const newTop = touchStartTop + deltaY;
    wrapper.style.top = newTop + 'px';
    return;
  }

  if (touchMode === 'swipe') {
    const swipeX = Math.max(-120, Math.min(deltaX, 120));
    eventEl.style.transform = `translateX(${swipeX}px)`;

    const deleteBg = wrapper.querySelector('.event-delete-bg');
    const editBg = wrapper.querySelector('.event-edit-bg');

    wrapper.classList.remove('showing-delete', 'showing-edit');

    if (swipeX > 0 && deleteBg) {
      deleteBg.style.opacity = Math.min(swipeX / 60, 1);
      if (editBg) editBg.style.opacity = '0';
      if (swipeX > 40) {
        wrapper.classList.add('showing-delete');
      }
    } else if (swipeX < 0 && editBg) {
      editBg.style.opacity = Math.min(Math.abs(swipeX) / 60, 1);
      if (deleteBg) deleteBg.style.opacity = '0';
      if (Math.abs(swipeX) > 40) {
        wrapper.classList.add('showing-edit');
      }
    } else {
      if (deleteBg) deleteBg.style.opacity = '0';
      if (editBg) editBg.style.opacity = '0';
    }
  } else if (touchMode === 'drag') {
    event.preventDefault();
    const newTop = touchStartTop + deltaY;
    wrapper.style.top = newTop + 'px';
  }
}

export function eventTouchEnd(event, id) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (event.target.closest('.event-status-icon')) {
    isLongPress = false;
    return;
  }

  const eventEl = document.querySelector(`.calendar-event[data-id="${id}"]`);
  const wrapper = document.querySelector(`.calendar-event-wrapper[data-id="${id}"]`);

  if (wrapper) {
    wrapper.classList.remove('showing-delete', 'showing-edit', 'dragging');
  }

  if (wrapper) {
    const deleteBg = wrapper.querySelector('.event-delete-bg');
    const editBg = wrapper.querySelector('.event-edit-bg');
    if (deleteBg) deleteBg.style.opacity = '0';
    if (editBg) editBg.style.opacity = '0';
  }

  if (touchMode === 'swipe' && eventEl) {
    const transform = eventEl.style.transform || '';
    const match = transform.match(/translateX\(([-\d.]+)px\)/);
    const swipeDistance = match ? parseFloat(match[1]) : 0;

    if (swipeDistance > 60) {
      eventEl.style.transform = 'translateX(150%)';
      eventEl.style.opacity = '0';
      setTimeout(() => {
        if (deps.deleteEvent) deps.deleteEvent(null, id);
      }, 200);
      isLongPress = false;
      return;
    } else if (swipeDistance < -60) {
      eventEl.style.transform = 'translateX(0)';
      isDragging = false;
      isLongPress = false;
      touchMode = null;
      setTimeout(() => {
        if (deps.openEditEventModal) deps.openEditEventModal(id);
      }, 100);
      return;
    } else {
      eventEl.style.transform = 'translateX(0)';
    }
  } else if (touchMode === 'drag' && wrapper && touchCurrentEvent) {
    wrapper.classList.remove('dragging');

    const newTop = parseFloat(wrapper.style.top) || 0;
    let newStartHour = TIMELINE_START_HOUR + newTop / HOUR_HEIGHT;
    newStartHour = Math.round(newStartHour * 2) / 2;
    newStartHour = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR - 1, newStartHour));

    const duration = (touchCurrentEvent.endHour - touchCurrentEvent.startHour) + (touchCurrentEvent.endMin - touchCurrentEvent.startMin) / 60;

    touchCurrentEvent.startHour = Math.floor(newStartHour);
    touchCurrentEvent.startMin = (newStartHour % 1) * 60;
    touchCurrentEvent.endHour = Math.floor(newStartHour + duration);
    touchCurrentEvent.endMin = ((newStartHour + duration) % 1) * 60;

    if (deps.showToast) {
      deps.showToast(`📍 ${touchCurrentEvent.startHour}:${touchCurrentEvent.startMin < 10 ? '0' + touchCurrentEvent.startMin : touchCurrentEvent.startMin}`);
    }
    renderCalendarTimeline();

    if (deps.saveAllLocalData) deps.saveAllLocalData();
    if (deps.useSupabase && deps.SupabaseClient && touchCurrentEvent.id) {
      deps.SupabaseClient.saveScheduleItem(touchCurrentEvent).catch(err => logger.warn('拖拽同步失败:', err.message));
    }
  }

  touchCurrentEvent = null;
  touchMode = null;
  isLongPress = false;
  setTimeout(() => { isDragging = false; }, 50);
}

export function mouseEventDragStart(event, id) {
  event.preventDefault();

  const todaySchedule = deps.getTodaySchedule ? deps.getTodaySchedule() : [];
  draggedEvent = todaySchedule.find(e => e.id === id);
  if (!draggedEvent) return;

  isDragging = true;
  dragStartY = event.clientY;
  const wrapper = event.target.closest('.calendar-event-wrapper');
  if (wrapper) {
    touchStartTop = parseFloat(wrapper.style.top) || 0;
    wrapper.classList.add('dragging');

    document.addEventListener('mousemove', mouseDragMove);
    document.addEventListener('mouseup', mouseDragEnd);
  }
}

function mouseDragMove(event) {
  if (!draggedEvent) return;

  const deltaY = event.clientY - dragStartY;
  const newTop = touchStartTop + deltaY;

  const wrapper = document.querySelector(`.calendar-event-wrapper[data-id="${draggedEvent.id}"]`);
  if (wrapper) {
    wrapper.style.top = newTop + 'px';
  }
}

function mouseDragEnd() {
  if (!draggedEvent) return;

  const wrapper = document.querySelector(`.calendar-event-wrapper[data-id="${draggedEvent.id}"]`);
  if (wrapper) {
    wrapper.classList.remove('dragging');

    const newTop = parseFloat(wrapper.style.top) || 0;
    let newStartHour = TIMELINE_START_HOUR + newTop / HOUR_HEIGHT;
    newStartHour = Math.round(newStartHour * 2) / 2;
    newStartHour = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR - 1, newStartHour));

    const duration = (draggedEvent.endHour - draggedEvent.startHour) + (draggedEvent.endMin - draggedEvent.startMin) / 60;

    draggedEvent.startHour = Math.floor(newStartHour);
    draggedEvent.startMin = (newStartHour % 1) * 60;
    draggedEvent.endHour = Math.floor(newStartHour + duration);
    draggedEvent.endMin = ((newStartHour + duration) % 1) * 60;

    if (deps.showToast) {
      deps.showToast(`📍 ${draggedEvent.startHour}:${draggedEvent.startMin < 10 ? '0' + draggedEvent.startMin : draggedEvent.startMin}`);
    }

    if (deps.saveAllLocalData) deps.saveAllLocalData();
    if (deps.useSupabase && deps.SupabaseClient && draggedEvent.id) {
      deps.SupabaseClient.saveScheduleItem(draggedEvent).catch(err => logger.warn('拖拽同步失败:', err.message));
    }
  }

  document.removeEventListener('mousemove', mouseDragMove);
  document.removeEventListener('mouseup', mouseDragEnd);
  draggedEvent = null;
  renderCalendarTimeline();
  setTimeout(() => { isDragging = false; }, 50);
}
