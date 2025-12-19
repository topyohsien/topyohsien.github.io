// --- 資料設定 ---
const memberPeriods = [
    { start: '2025-12-18', end: '2030-12-31', members: ['智寬', '建翰', '靖凱', '宗宜', '侑憲', '桂豪', '天翔', '繹全'] }
];

const memberPhones = { '靖凱': '8623820', '侑憲': '8623804', '建翰': '8623821', '智寬': '8625050', '宗宜': '8623807', '桂豪': '8625056', '天翔': '8623819', '繹全': '8623812' };
const memberFullNames = { '靖凱': '王靖凱', '侑憲': '蔡侑憲', '建翰': '陳建翰', '智寬': '張智寬', '宗宜': '郭宗宜', '桂豪': '陳桂豪', '天翔': '鄭天翔', '繹全': '陳繹全' };

const holidays = [
    { date: '2026-01-01', name: '元旦' }, { date: '2026-02-28', name: '和平紀念日' },
    { date: '2026-04-04', name: '兒童/清明' }, { date: '2026-05-01', name: '勞動節' },
    { date: '2026-06-19', name: '端午節' }, { date: '2026-09-25', name: '中秋節' },
    { date: '2026-10-10', name: '國慶日' }
];

// --- 狀態 ---
let dutyStartDate = '2026-01-17';
let dutyStartPerson = '侑憲';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let searchName = '';

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    document.getElementById('memberManageBtn').onclick = (e) => { e.preventDefault(); openMemberModal(); };
});

function updateUI() {
    renderMonthLabel();
    renderCalendar();
    renderWeeklyDutyTable();
    updateDutyInfo();
}

function getDutyPerson(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();

    // 1. 處理週六 (基準排班)
    if (day === 6) {
        const members = getMembersByDate(dateStr);
        const start = new Date(dutyStartDate);
        let weeksDiff = Math.round((d - start) / (1000 * 60 * 60 * 24 * 7));
        const startMembers = getMembersByDate(dutyStartDate);
        let startIdx = startMembers.indexOf(dutyStartPerson);
        let idx = (startIdx + weeksDiff) % members.length;
        while (idx < 0) idx += members.length;
        return members[idx];
    }
    // 2. 處理週日 (跟隨前一天週六)
    if (day === 0) {
        let prevSat = new Date(d);
        prevSat.setDate(d.getDate() - 1);
        return getDutyPerson(formatDate(prevSat));
    }
    // 3. 處理國定假日 (跟隨該週週六)
    if (isHoliday(dateStr)) {
        let currentSat = new Date(d);
        while (currentSat.getDay() !== 6) { currentSat.setDate(currentSat.getDate() + 1); }
        // 這裡邏輯可以根據你們習慣調整，通常是跟隨當週或前週週六
        return getDutyPerson(formatDate(currentSat));
    }
    return '';
}

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
        
        if (d.getDay() === 6) td.className = 'sat';
        if (d.getDay() === 0) td.className = 'sun';
        if (isHoliday(dateStr)) td.classList.add('holiday');
        if (formatDate(new Date()) === dateStr) td.classList.add('today');
        if (searchName && getDutyPerson(dateStr) === searchName) td.classList.add('highlight');

        td.innerHTML = `<div>${date}</div>`;
        let holiday = isHoliday(dateStr);
        if (holiday) td.innerHTML += `<div style="color:red;font-size:0.7em;">${holiday.name}</div>`;
        
        let person = getDutyPerson(dateStr);
        if (person) td.innerHTML += `<span class="duty">${person}</span>`;

        row.appendChild(td);
        if ((firstDay + date) % 7 === 0) { tbody.appendChild(row); row = document.createElement('tr'); }
    }
    tbody.appendChild(row);
    table.appendChild(tbody);
}

function renderWeeklyDutyTable() {
    let now = new Date();
    while (now.getDay() !== 6) now.setDate(now.getDate() + 1); // 找下個週六

    let html = `<table class="weekly-duty-table"><thead><tr>`;
    const days = ['週六','週日','週一','週二','週三','週四','週五'];
    days.forEach(day => html += `<th>${day}</th>`);
    html += `</tr></thead><tbody><tr>`;

    for (let i = 0; i < 7; i++) {
        let d = new Date(now);
        d.setDate(now.getDate() + i);
        let ds = formatDate(d);
        let p = getDutyPerson(ds) || getDutyPerson(formatDate(now)); // 平日預設顯示週六人員
        html += `<td><div>${ds.slice(5)}</div><b>${memberFullNames[p] || p}</b><br><small>${memberPhones[p] || ''}</small></td>`;
    }
    html += `</tr></tbody></table>`;
    document.getElementById('weeklyDutyTable').innerHTML = html;
}

// --- 工具類 ---
function formatDate(date) {
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
}
function isHoliday(ds) { return holidays.find(h => h.date === ds); }
function getMembersByDate(ds) { return memberPeriods[0].members; }
function renderMonthLabel() { document.getElementById('monthLabel').textContent = `${currentYear}年 ${currentMonth}月`; }
function prevMonth() { currentMonth--; if(currentMonth<1){currentMonth=12;currentYear--;} updateUI(); }
function nextMonth() { currentMonth++; if(currentMonth>12){currentMonth=1;currentYear++;} updateUI(); }
function updateDutyInfo() { document.getElementById('dutyInfo').textContent = `${dutyStartDate} 起始：${dutyStartPerson}`; }

// --- 彈窗控制 ---
function openMemberModal() {
    const body = document.getElementById('memberListBody');
    body.innerHTML = '';
    memberPeriods[0].members.forEach((m, i) => {
        body.innerHTML += `<tr><td>${i+1}</td><td>${memberFullNames[m]||m}</td><td>${memberPhones[m]||''}</td></tr>`;
    });
    document.getElementById('memberModal').style.display = 'flex';
}
function closeMemberModal() { document.getElementById('memberModal').style.display = 'none'; }
function editDutyDate() { 
    document.getElementById('editDutyModal').style.display = 'flex'; 
    const sel = document.getElementById('editDutyPerson');
    sel.innerHTML = '';
    memberPeriods[0].members.forEach(m => sel.innerHTML += `<option value="${m}">${m}</option>`);
}
function closeEditDutyModal() { document.getElementById('editDutyModal').style.display = 'none'; }
function saveDutyDate() {
    dutyStartDate = document.getElementById('editDutyDate').value;
    dutyStartPerson = document.getElementById('editDutyPerson').value;
    closeEditDutyModal();
    updateUI();
}
function searchDuty() {
    searchName = document.getElementById('searchInput').value;
    renderCalendar();
}
