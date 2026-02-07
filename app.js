// ====== 数据存储 ======
const APP_KEY = 'jiankexuexue_data';

// 默认数据结构
const defaultData = {
    currentDay: 1,
    startDate: new Date().toISOString().split('T')[0],
    
    // 进度
    progress: {
        math: 30,
        english: 25,
        habits: 40
    },
    
    // 兴趣雷达数据
    interests: {
        history: 70,      // 历史人文
        engineering: 40,  // 工程制造
        music: 50,        // 音乐表达
        martial: 65,      // 体能武术
        logic: 30,        // 逻辑推理
        art: 45           // 艺术创造
    },
    
    // 每日选择记录
    dailyChoices: [],
    
    // 习惯打卡记录
    habits: {
        today: {},
        history: []
    },
    
    // 解锁的奖励
    unlockedRewards: ['青龙偃月刀'],
    
    // 成就
    achievements: []
};

// 加载数据
function loadData() {
    const saved = localStorage.getItem(APP_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return { ...defaultData };
}

// 保存数据
function saveData(data) {
    localStorage.setItem(APP_KEY, JSON.stringify(data));
}

// 全局数据
let appData = loadData();

// ====== 初始化 ======
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    drawRadarChart();
    loadHabits();
    calculateDay();
});

// 计算当前是第几天
function calculateDay() {
    const start = new Date(appData.startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    appData.currentDay = Math.min(diffDays, 14);
    document.getElementById('dayNum').textContent = appData.currentDay;
}

// 更新UI
function updateUI() {
    // 更新进度条
    document.getElementById('mathProgress').style.width = appData.progress.math + '%';
    document.getElementById('engProgress').style.width = appData.progress.english + '%';
    document.getElementById('habitsProgress').style.width = appData.progress.habits + '%';
    
    // 更新进度数值
    const statValues = document.querySelectorAll('.stat-value');
    statValues[0].textContent = appData.progress.math + '%';
    statValues[1].textContent = appData.progress.english + '%';
    statValues[2].textContent = appData.progress.habits + '%';
}

// ====== 每日选择 ======
function selectChoice(element) {
    // 移除其他选中状态
    document.querySelectorAll('.choice-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 选中当前
    element.classList.add('selected');
    
    // 记录兴趣
    const interest = element.dataset.interest;
    if (interest && appData.interests[interest] !== undefined) {
        appData.interests[interest] = Math.min(100, appData.interests[interest] + 5);
        
        // 记录选择
        appData.dailyChoices.push({
            date: new Date().toISOString(),
            interest: interest
        });
        
        saveData(appData);
        drawRadarChart();
        
        // 动画反馈
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }
}

// ====== 习惯打卡 ======
function toggleHabit(habitId) {
    const today = new Date().toISOString().split('T')[0];
    
    if (!appData.habits.today) {
        appData.habits.today = {};
    }
    
    // 切换状态
    appData.habits.today[habitId] = !appData.habits.today[habitId];
    
    // 更新UI
    const card = document.getElementById('habit-' + habitId);
    if (appData.habits.today[habitId]) {
        card.classList.add('checked');
    } else {
        card.classList.remove('checked');
    }
    
    // 计算习惯完成度
    const habitKeys = ['wake', 'piano', 'exercise', 'read', 'sleep', 'math'];
    const completed = habitKeys.filter(k => appData.habits.today[k]).length;
    appData.progress.habits = Math.round((completed / habitKeys.length) * 100);
    
    saveData(appData);
    updateUI();
}

function loadHabits() {
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否是新的一天
    if (appData.habits.lastDate !== today) {
        // 保存昨天的记录
        if (appData.habits.lastDate && Object.keys(appData.habits.today).length > 0) {
            appData.habits.history.push({
                date: appData.habits.lastDate,
                habits: { ...appData.habits.today }
            });
        }
        // 重置今天
        appData.habits.today = {};
        appData.habits.lastDate = today;
        saveData(appData);
    }
    
    // 恢复UI状态
    Object.keys(appData.habits.today).forEach(habitId => {
        if (appData.habits.today[habitId]) {
            const card = document.getElementById('habit-' + habitId);
            if (card) {
                card.classList.add('checked');
            }
        }
    });
}

// ====== 雷达图 ======
function drawRadarChart() {
    const canvas = document.getElementById('radarChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 120;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const labels = ['历史', '工程', '音乐', '武术', '逻辑', '艺术'];
    const keys = ['history', 'engineering', 'music', 'martial', 'logic', 'art'];
    const values = keys.map(k => appData.interests[k] / 100);
    const numPoints = labels.length;
    const angleStep = (Math.PI * 2) / numPoints;
    
    // 绘制背景网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let level = 1; level <= 4; level++) {
        ctx.beginPath();
        const r = (maxRadius / 4) * level;
        for (let i = 0; i <= numPoints; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // 绘制轴线
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + maxRadius * Math.cos(angle),
            centerY + maxRadius * Math.sin(angle)
        );
        ctx.stroke();
    }
    
    // 绘制数据区域
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
        const idx = i % numPoints;
        const angle = idx * angleStep - Math.PI / 2;
        const r = values[idx] * maxRadius;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // 填充渐变
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(244, 208, 63, 0.3)');
    gradient.addColorStop(1, 'rgba(244, 208, 63, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 描边
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制数据点
    ctx.fillStyle = '#f4d03f';
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const r = values[i] * maxRadius;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制标签
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px "Noto Sans SC"';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const r = maxRadius + 20;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        ctx.fillText(labels[i], x, y + 4);
    }
}

// ====== 城市切换 ======
const cityEvents = {
    shenzhen: [
        { month: '2月', day: '8', title: '三国文化展', location: '深圳博物馆', price: '免费预约' },
        { month: '2月', day: '10', title: '少年剑道体验课', location: '南山文体中心', price: '¥99/人' },
        { month: '2月', day: '15', title: '创客空间开放日', location: '柴火创客空间', price: '免费' }
    ],
    guangzhou: [
        { month: '2月', day: '6', title: '岭南历史文化展', location: '广东省博物馆', price: '免费预约' },
        { month: '2月', day: '12', title: '武术冬令营', location: '广州体育馆', price: '¥199/人' },
        { month: '2月', day: '14', title: '3D打印工作坊', location: '广州图书馆', price: '¥50/人' }
    ],
    beijing: [
        { month: '2月', day: '5', title: '故宫特展：明代兵器', location: '故宫博物院', price: '¥60' },
        { month: '2月', day: '9', title: '国家博物馆历史课', location: '国家博物馆', price: '免费预约' },
        { month: '2月', day: '16', title: '少年武术体验', location: '什刹海体校', price: '¥150/人' }
    ],
    shanghai: [
        { month: '2月', day: '7', title: '上海博物馆青铜器展', location: '上海博物馆', price: '免费预约' },
        { month: '2月', day: '11', title: 'STEM创客营', location: '上海科技馆', price: '¥120/人' },
        { month: '2月', day: '13', title: '古琴与剑文化讲座', location: '上海图书馆', price: '免费' }
    ]
};

function selectCity(city) {
    // 更新按钮状态
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新活动列表
    const eventsList = document.getElementById('eventsList');
    const events = cityEvents[city] || [];
    
    eventsList.innerHTML = events.map(e => `
        <div class="event-card">
            <div class="event-date">
                <span class="month">${e.month}</span>
                <span class="day">${e.day}</span>
            </div>
            <div class="event-details">
                <h3>${e.title}</h3>
                <p>📍 ${e.location}</p>
                <p>🎫 ${e.price}</p>
            </div>
            <button class="event-action">查看详情</button>
        </div>
    `).join('');
}

// ====== 底部导航 ======
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // TODO: 切换页面内容
    console.log('Switching to tab:', tab);
}

// ====== 工具函数 ======
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
