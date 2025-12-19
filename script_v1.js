/**
 * EMS 排班助手 - 邏輯核心
 */

// 1. 成員與區間設定
const memberPeriods = [
    { start: '2025-12-18', end: '2026-02-28', members: ['智寬', '建翰', '靖凱', '宗宜', '侑憲', '桂豪', '天翔', '繹全'] },
    { start: '2026-03-01', end: '2026-12-31', members: ['智寬', '建翰', '靖凱', '宗宜', '侑憲', '桂豪', '天翔', '繹全'] }
];

const memberPhones = {
    '靖凱': '8623820', '侑憲': '8623804', '建翰': '8623821', '智寬': '8625050',
    '宗宜': '8623807', '桂豪': '8625056', '天翔': '8623819', '繹全': '8623812'
};

const memberFullNames = {
    '靖凱': '王靖凱', '侑憲': '蔡侑憲', '建翰': '陳建翰', '智寬': '張智寬',
    '宗宜': '郭宗宜', '桂豪': '陳桂豪', '天翔': '鄭天翔', '繹全': '陳繹全'
};

const springFestivalDuty = {
    '2026-02-16': '抽籤', '2026-02-17': '抽籤', '2026-02-18': '抽籤',
    '2026-02-19': '抽籤', '2026-02-20': '抽籤'
};

// 2. 國定假日設定
const holidays = [
    { date: '2026-01-01', name: '元旦' },
    { date: '2026-02-28', name: '和平紀念日' },
    { date: '2026-04-04', name: '兒童節' },
    { date: '2026-04-05', name: '清明節' },
    { date: '2026-05-01', name: '勞動節' },
    { date: '2026-06-19', name: '端午節' },
    { date: '2026-09-25', name: '中秋節' },
    { date: '2026-10-10', name: '國慶日' }
];

const springFestival = ['2026-02-14','2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21'];

// 3. 狀態變數
let dutyStartDate = '2026-01-17';
let dutyStartPerson = '侑憲';
let today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth() + 1;
let searchName = '';

// 4. 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderMonthLabel();
    renderCalendar();
    fillEditDutyModal();
    updateDutyInfo();
    renderWeeklyDutyTable();
    
    document.getElementById('memberManageBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openMemberModal();
    });
});

// 5. 核心函式
function formatDate(date) {
    let y = date.getFullYear();
    let m = (date.getMonth() + 1).toString().padStart(2, '0');
    let d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMembersByDate(dateStr) {
    for (let period of memberPeriods) {
        if (dateStr >= period.start && dateStr <= period.end) return period.members;
    }
    return memberPeriods[0].members;
}

function getDutyPerson(dateStr) {
    if (springFestival.includes(dateStr)) {
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
        sat.setDate(d.getDate() - 1);
        return getDutyPerson(formatDate(sat));
    }
    const holiday = holidays.find(h => h.date === dateStr);
    if (holiday && !springFestival.includes(dateStr)) {
        let sat = new Date(d);
        while (sat.getDay() !== 6) { sat.setDate(sat.getDate() - 1); }
        return getDutyPerson(formatDate(sat));
    }
    return '';
}

// UI 渲染函式 (其餘 function 保持原本邏輯並簡化)
function renderMonthLabel() {
    document.getElementById('monthLabel').textContent = `${currentYear} 年 ${currentMonth} 月`;
}

function renderCalendar() {
    const table = document.getElementById('calendarTable');
    table.innerHTML = '';
    const days = ['日','一','二','三','四','五','六'];
    let html = '<thead><tr>' + days.map(d => `<th>${d}</th>`).join('') + '</tr></thead><tbody>';

    let firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    let totalDays = new Date(currentYear, currentMonth, 0).getDate();
    let dateCount = 1;

    for (let i = 0; i < 6; i++) {
        html += '<tr>';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay || dateCount > totalDays) {
                html += '<td></td>';
            } else {
                let d = new Date(currentYear, currentMonth - 1, dateCount);
                let dateStr = formatDate(d);
                let classes = [];
                if (j === 6) classes.push('sat');
                if (j === 0) classes.push('sun');
                if (holidays.find(h => h.date === dateStr) || springFestival.includes(dateStr)) classes.push('holiday');
                if (formatDate(new Date()) === dateStr) classes.push('today');
                if (searchName && getDutyPerson(dateStr) === searchName) classes.push('highlight');

                let person = getDutyPerson(dateStr);
                let holidayName = holidays.find(h => h.date === dateStr)?.name || (springFestival.includes(dateStr) ? '春節' : '');

                html += `<td class="${classes.join(' ')}">
                            <div>${dateCount}</div>
                            <div style="color:#c0392b;font-size:0.8em;">${holidayName}</div>
                            ${person ? `<span class="duty">${person}</span>` : ''}
                         </td>`;
                dateCount++;
            }
        }
        html += '</tr>';
        if (dateCount > totalDays) break;
    }
    html += '</tbody>';
    table.innerHTML = html;
}

// 其他互動函式... (saveDutyDate, searchDuty 等)
function prevMonth() { currentMonth--; if(currentMonth<1){currentMonth=12;currentYear--;} renderMonthLabel(); renderCalendar(); }
function nextMonth() { currentMonth++; if(currentMonth>12){currentMonth=1;currentYear++;} renderMonthLabel(); renderCalendar(); }

function searchDuty() {
    searchName = document.getElementById('searchInput').value.trim();
    renderCalendar();
    let result = [];
    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 31; d++) {
            let date = new Date(currentYear, m, d);
            if (date.getMonth() !== m) break;
            let dateStr = formatDate(date);
            if (getDutyPerson(dateStr) === searchName) result.push(dateStr);
        }
    }
    document.getElementById('searchResult').innerHTML = searchName ? `<b>${searchName} 排班日：</b><br>${result.join(', ')}` : '';
}

function openMemberModal() { document.getElementById('memberModal').style.display = 'block'; }
function closeMemberModal() { document.getElementById('memberModal').style.display = 'none'; }
function editDutyDate() { document.getElementById('editDutyModal').style.display = 'block'; }
function closeEditDutyModal() { document.getElementById('editDutyModal').style.display = 'none'; }

function fillEditDutyModal() {
    let sel = document.getElementById('editDutyPerson');
    const members = getMembersByDate(dutyStartDate);
    sel.innerHTML = members.map(m => `<option value="${m}">${m}</option>`).join('');
    sel.value = dutyStartPerson;
}

function saveDutyDate() {
    dutyStartDate = document.getElementById('editDutyDate').value;
    dutyStartPerson = document.getElementById('editDutyPerson').value;
    updateDutyInfo();
    closeEditDutyModal();
    renderCalendar();
    renderWeeklyDutyTable();
}

function updateDutyInfo() {
    document.getElementById('dutyInfo').textContent = `${dutyStartDate.replace(/-/g,'/')} ${dutyStartPerson}`;
}

function renderWeeklyDutyTable() {
    let now = new Date(); now.setHours(0,0,0,0);
    let sat = new Date(now);
    while (sat.getDay() !== 6) { sat.setDate(sat.getDate() + 1); }
    
    let html = '<div style="position:relative;"><table class="weekly-duty-table"><thead><tr>';
    let days = ['週六','週日','週一','週二','週三','週四','週五'];
    html += days.map(d => `<th>${d}</th>`).join('') + '</tr></thead><tbody><tr>';
    
    let satStr = formatDate(sat);
    let satPerson = getDutyPerson(satStr);

    for (let i = 0; i < 7; i++) {
        let d = new Date(sat); d.setDate(sat.getDate() + i);
        let ds = formatDate(d);
        let p = getDutyPerson(ds) || satPerson;
        let name = memberFullNames[p] || p;
        let phone = memberPhones[p] || '';
        html += `<td><div>${ds}</div><div style="font-weight:bold;">${name}</div><div style="color:#2980b9;">${phone}</div></td>`;
    }
    html += '</tr></tbody></table>';
    html += `<div class="notes-icon" onclick="window.open('Notes://...')"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg></div></div>`;
    document.getElementById('weeklyDutyTable').innerHTML = html;
}
