// ====== 1. 排班人員區間設定 ======
const memberPeriods = [
    { start: '2025-12-18', end: '2026-02-28', members: ['智寬', '建翰', '靖凱', '宗宜', '侑憲', '桂豪', '天翔', '繹全'] },
    { start: '2026-03-01', end: '2030-12-31', members: ['智寬', '建翰', '靖凱', '宗宜', '侑憲', '桂豪', '天翔', '繹全'] }
];

const memberPhones = { '靖凱': '8623820', '侑憲': '8623804', '建翰': '8623821', '智寬': '8625050', '宗宜': '8623807', '桂豪': '8625056', '天翔': '8623819', '繹全': '8623812' };
const memberFullNames = { '靖凱': '王靖凱', '侑憲': '蔡侑憲', '建翰': '陳建翰', '智寬': '張智寬', '宗宜': '郭宗宜', '桂豪': '陳桂豪', '天翔': '鄭天翔', '繹全': '陳繹全' };

// 春節連假抽籤設定
const springFestivalDuty = { '2026-02-16': '抽籤', '2026-02-17': '抽籤', '2026-02-18': '抽籤', '2026-02-19': '抽籤', '2026-02-20': '抽籤' };

const holidays = [
    { date: '2026-01-01', name: '元旦' }, { date: '2026-02-27', name: '補假' }, { date: '2026-02-28', name: '和平紀念日' },
    { date: '2026-04-03', name: '補假' }, { date: '2026-04-04', name: '兒童節' }, { date: '2026-04-05', name: '清明節' },
    { date: '2026-04-06', name: '補假' }, { date: '2026-05-01', name: '勞動節' }, { date: '2026-06-19', name: '端午節' },
    { date: '2026-09-25', name: '中秋節' }, { date: '2026-09-28', name: '教師節' }, { date: '2026-10-09', name: '補假' },
    { date: '2026-10-10', name: '國慶日' }, { date: '2026-10-25', name: '光復節' }, { date: '2026-10-26', name: '補假' },
    { date: '2026-12-25', name: '行憲紀念日' }
];

const springFestival = ['2026-02-14','2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21'];

// 初始設定
let dutyStartDate = '2026-01-17';
let dutyStartPerson = '侑憲';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let searchName = '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderMonthLabel();
    renderCalendar();
    renderWeeklyDutyTable();
    updateDutyInfo();
    renderMemberList();
    document.getElementById('memberManageBtn').onclick = (e) => { e.preventDefault(); openMemberModal(); };
}

// ====== 核心排班邏輯 (恢復原版) ======
function getDutyPerson(dateStr) {
    if (isSpringFestival(dateStr)) {
        if (springFestivalDuty[dateStr]) return springFestivalDuty[dateStr];
        const d = new Date(dateStr);
        if (d.getDay() >= 1 && d.getDay() <= 5) return '';
    }
    const d = new Date(dateStr);
    if (d.getDay() === 6) {
        const members = getMembersByDate(dateStr);
        const start = new Date(dutyStartDate);
        let diff = Math.round((d - start) / (1000 * 60 * 60 * 24 * 7));
        const startMembers = getMembersByDate(dutyStartDate);
        let startIdx = startMembers.indexOf(dutyStartPerson);
        if (startIdx === -1) startIdx = 0;
        let idx = (startIdx + diff) % members.length;
        if (idx < 0) idx += members.length;
        return members[idx];
    }
    if (d.getDay() === 0) {
        let sat = new Date(d);
        sat.setDate(d.getDate() - 8); // 原邏輯：週日抓 8 天前的週六
        return getDutyPerson(formatDate(sat));
    }
    if (isHoliday(dateStr) && !isSpringFestival(dateStr)) {
        let sat = new Date(d);
        while (sat.getDay() !== 6) { sat.setDate(sat.getDate() - 1); }
        return getDutyPerson(formatDate(sat));
    }
    return '';
}

// 渲染月曆
function renderCalendar() {
    const table = document.getElementById('calendarTable');
    table.innerHTML = '<thead><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead>';
    const tbody = document.createElement('tbody');
    let firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    let totalDays = new Date(currentYear, currentMonth, 0).getDate();
    let row = document.createElement('tr');

    for (let i = 0; i < firstDay; i++) row.appendChild(document.createElement('td'));

    for (let date = 1; date <= totalDays; date++) {
        let d = new Date(currentYear, currentMonth - 1, date);
        let dateStr = formatDate(d);
        let td = document.createElement('td');
        
        let type = (d.getDay() === 6) ? 'sat' : (d.getDay() === 0 ? 'sun' : '');
        if (type) td.classList.add(type);
        if (isHoliday(dateStr) || isSpringFestival(dateStr)) td.classList.add('holiday');
        if (formatDate(new Date()) === dateStr) td.classList.add('today');
        if (searchName && getDutyPerson(dateStr) === searchName) td.classList.add('highlight');

        td.innerHTML = `<div>${date}</div>`;
        let holiday = isHoliday(dateStr);
        if (holiday) td.innerHTML += `<div style="color:#c0392b;font-size:0.8em;">${holiday.name}</div>`;
        if (isSpringFestival(dateStr)) td.innerHTML += `<div style="color:#c0392b;font-size:0.8em;">春節連假</div>`;
        
        let person = getDutyPerson(dateStr);
        if (person) td.innerHTML += `<span class="duty">${person}</span>`;

        row.appendChild(td);
        if ((firstDay + date) % 7 === 0 || date === totalDays) {
            tbody.appendChild(row);
            row = document.createElement('tr');
        }
    }
    table.appendChild(tbody);
}

// 橫式週表
function renderWeeklyDutyTable() {
    let now = new Date(); now.setHours(0,0,0,0);
    let sat = new Date(now);
    while (sat.getDay() !== 6) { sat.setDate(sat.getDate() + 1); }

    let html = `<table class="weekly-duty-table"><thead><tr><th>週六</th><th>週日</th><th>週一</th><th>週二</th><th>週三</th><th>週四</th><th>週五</th></tr></thead><tbody><tr>`;
    let satPerson = getDutyPerson(formatDate(sat));

    for (let i = 0; i < 7; i++) {
        let d = new Date(sat); d.setDate(sat.getDate() + i);
        let ds = formatDate(d);
        let person = getDutyPerson(ds) || satPerson;
        let fname = memberFullNames[person] || person;
        let phone = memberPhones[person] || '';
        let type = (d.getDay() === 6) ? 'sat' : (d.getDay() === 0 ? 'sun' : '');
        if (isHoliday(ds)) type = 'holiday';
        if (formatDate(new Date()) === ds) type += ' today';
        html += `<td class="${type}"><div>${ds}</div><div>${fname}</div><div style="font-size:0.9em;color:#2980b9;">${phone}</div></td>`;
    }
    html += `</tr></tbody></table><div class="notes-icon" onclick="window.open('Notes://F12AD16/48257DB0002E2D30/EF9C1CE35692F71348256C5C0034F18C/8B6DF6C88DEC5705482580EB00219DD1')"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg></div>`;
    document.getElementById('weeklyDutyTable').innerHTML = html;
}

// 輔助函數
function formatDate(date) {
    let m = (date.getMonth() + 1).toString().padStart(2, '0');
    let d = date.getDate().toString().padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
}
function isHoliday(ds) { return holidays.find(h => h.date === ds); }
function isSpringFestival(ds) { return springFestival.includes(ds); }
function getMembersByDate(ds) {
    for (let p of memberPeriods) { if (ds >= p.start && ds <= p.end) return p.members; }
    return memberPeriods[0].members;
}
function renderMonthLabel() { document.getElementById('monthLabel').textContent = `${currentYear} 年 ${currentMonth} 月`; }
function prevMonth() { currentMonth--; if(currentMonth<1){currentMonth=12;currentYear--;} renderMonthLabel(); renderCalendar(); }
function nextMonth() { currentMonth++; if(currentMonth>12){currentMonth=1;currentYear++;} renderMonthLabel(); renderCalendar(); }
function updateDutyInfo() { document.getElementById('dutyInfo').textContent = `${dutyStartDate.replace(/-/g,'/')} ${dutyStartPerson}`; }

function searchDuty() {
    searchName = document.getElementById('searchInput').value.trim();
    renderCalendar();
    let result = [];
    for (let d = new Date(currentYear, 0, 1); d <= new Date(currentYear, 11, 31); d.setDate(d.getDate() + 1)) {
        let ds = formatDate(d);
        if (getDutyPerson(ds) === searchName) result.push(ds);
    }
    document.getElementById('searchResult').innerHTML = searchName ? (result.length ? `<b>${searchName} 排班日期：</b><br>${result.join(', ')}` : `<b>${searchName} 無排班紀錄</b>`) : '';
}

function openMemberModal() { document.getElementById('memberModal').style.display = 'flex'; }
function closeMemberModal() { document.getElementById('memberModal').style.display = 'none'; }
function renderMemberList() {
    const tbody = document.getElementById('memberListBody');
    tbody.innerHTML = '';
    memberPeriods[0].members.forEach((m, i) => {
        tbody.innerHTML += `<tr><td>No.${i+1}</td><td>${memberFullNames[m]||m}</td><td>${memberPhones[m]||''}</td></tr>`;
    });
}

function editDutyDate() {
    document.getElementById('editDutyModal').style.display = 'flex';
    document.getElementById('editDutyDate').value = dutyStartDate;
    const sel = document.getElementById('editDutyPerson');
    sel.innerHTML = '';
    getMembersByDate(dutyStartDate).forEach(m => {
        let opt = document.createElement('option'); opt.value = m; opt.textContent = m; sel.appendChild(opt);
    });
    sel.value = dutyStartPerson;
}
function closeEditDutyModal() { document.getElementById('editDutyModal').style.display = 'none'; }
function saveDutyDate() {
    dutyStartDate = document.getElementById('editDutyDate').value;
    dutyStartPerson = document.getElementById('editDutyPerson').value;
    updateDutyInfo(); closeEditDutyModal(); renderCalendar(); renderWeeklyDutyTable();
}
