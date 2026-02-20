// ============================
// Beauty Reserve - Main App
// ============================
(function () {
    'use strict';
    const LS_KEYS = {
        shopInfo: 'br_shopInfo', menus: 'br_menus', settings: 'br_settings',
        reservations: 'br_reservations', notificationQueue: 'br_notificationQueue',
        lastCustomer: 'br_lastCustomer', notifDismissed: 'br_notifDismissed',
        inAppNotifications: 'br_inAppNotifications', loggedInUser: 'br_loggedInUser'
    };
    const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
    const DEFAULT_SHOP = {
        name: 'Nail Salon テスト', address: '東京都新宿区西新宿3-4-5 テストビル1F',
        phone: '000-1234-5678', hours: '10:00〜20:00（最終受付 19:00）',
        holidays: '毎週火曜日', rules: 'キャンセルの際は事前にご連絡ください'
    };
    const DEFAULT_MENUS = [
        { id: 'm1', name: 'デザインネイル', description: 'トレンドのデザインを取り入れたアートネイル。', price: 8800, duration: 90, popular: true },
        { id: 'm2', name: '長さだし', description: 'スカルプチュアで理想の長さに。', price: 12000, duration: 120, popular: false },
        { id: 'm3', name: 'ワンカラー', description: 'シンプルで上品なワンカラー仕上げ。', price: 5500, duration: 60, popular: true },
        { id: 'm4', name: 'メンズネイルケア', description: '男性向けの爪のお手入れ。', price: 4500, duration: 45, popular: false },
        { id: 'm5', name: 'カラーグラデーション', description: '自然なグラデーションで指先を美しく。', price: 7500, duration: 90, popular: false }
    ];
    const DEFAULT_SETTINGS = { openTime: '10:00', closeTime: '20:00', holidays: [2], slotMinutes: 30, maxDays: 60 };

    let state = {
        currentScreen: 'top', selectedMenu: null, selectedDate: null, selectedTime: null,
        customerInfo: {}, note: '', weekStartDate: null,
        adminFilter: 'all', adminSearch: '', nextBookingData: null, lastReservation: null
    };

    const gallery = [
        { id: 'g1', title: 'オフィスシンプル', img: 'https://placehold.co/300x300/ffeeee/ff6b81?text=Simple', menuId: 'm3', desc: '肌馴染みの良いピンクベージュのワンカラー。オフィスに最適です。' },
        { id: 'g2', title: '大人ニュアンス', img: 'https://placehold.co/300x300/e0f7fa/00bcd4?text=Nuance', menuId: 'm1', desc: 'くすみカラーとゴールドを組み合わせた、トレンドのニュアンスネイル。' },
        { id: 'g3', title: '王道フレンチ', img: 'https://placehold.co/300x300/fff3e0/ff9800?text=French', menuId: 'm1', desc: '指先が綺麗に見える、ホワイトのフレンチネイル。' },
        { id: 'g4', title: '華やかアート', img: 'https://placehold.co/300x300/f3e5f5/9c27b0?text=Art', menuId: 'm1', desc: 'ストーンやパーツをふんだんに使ったゴージャスなデザイン。' },
        { id: 'g5', title: '季節の限定', img: 'https://placehold.co/300x300/e8f5e9/4caf50?text=Season', menuId: 'm1', desc: '今の季節にぴったりの限定カラーとアート。' },
        { id: 'g6', title: 'マットクール', img: 'https://placehold.co/300x300/eceff1/607d8b?text=Matte', menuId: 'm3', desc: 'マットコート仕上げのクールなワンカラー。' }
    ];

    // ── Helpers ──
    function lsGet(k) {
        try {
            return JSON.parse(localStorage.getItem(k));
        } catch { return null; }
    }
    function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { showToast('データ保存に失敗しました', 'error'); } }
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
    function $(id) { return document.getElementById(id); }
    function qs(s) { return document.querySelector(s); }
    function qsa(s) { return document.querySelectorAll(s); }
    function padZero(n) { return n < 10 ? '0' + n : '' + n; }
    function formatDate(ds) { const d = new Date(ds); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_NAMES[d.getDay()]}）`; }
    function formatPrice(n) { return '¥' + n.toLocaleString(); }
    function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
    function minToTime(m) { return padZero(Math.floor(m / 60)) + ':' + padZero(m % 60); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function dateStr(d) { return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`; }

    // ── Init Data ──
    function initData() {
        if (!lsGet(LS_KEYS.shopInfo)) lsSet(LS_KEYS.shopInfo, DEFAULT_SHOP);
        if (!lsGet(LS_KEYS.menus)) lsSet(LS_KEYS.menus, DEFAULT_MENUS);
        if (!lsGet(LS_KEYS.settings)) lsSet(LS_KEYS.settings, DEFAULT_SETTINGS);
        if (!lsGet(LS_KEYS.notificationQueue)) lsSet(LS_KEYS.notificationQueue, []);
        if (!lsGet(LS_KEYS.inAppNotifications)) lsSet(LS_KEYS.inAppNotifications, []);
        // Seed data is created on login now if needed, or we can keep initial seed
        if (!lsGet(LS_KEYS.reservations)) {
            lsSet(LS_KEYS.reservations, []); // Initialize empty
        }
    }

    function buildNotificationQueue(reservations) {
        const queue = [];
        reservations.forEach(r => {
            if (r.nextSuggestAt && r.status === 'completed') {
                const suggest = calcNextSuggestion(r);
                r.nextSuggestDateTime = suggest.dateTime; r.nextSuggestMessage = suggest.message;
                queue.push({
                    reservationId: r.reservationId, fireAt: r.nextSuggestAt, fired: false,
                    message: suggest.message, menuId: r.menuId, suggestedDate: suggest.date,
                    suggestedTime: suggest.time, customerName: r.customerName,
                    customerPhone: r.customerPhone, customerEmail: r.customerEmail
                });
            }
        });
        lsSet(LS_KEYS.notificationQueue, queue);
        lsSet(LS_KEYS.reservations, reservations);
    }

    // ── Navigation ──
    const SCREENS = ['top', 'datetime', 'info', 'note', 'confirm', 'done', 'mypage', 'admin', 'gallery'];
    const STEP_MAP = { top: 'menu', datetime: 'datetime', info: 'info', note: 'note', confirm: 'confirm', done: 'done' };

    function navigate(screen) {
        state.currentScreen = screen;
        SCREENS.forEach(s => {
            const el = $('screen-' + s);
            if (el) {
                if (s === screen) {
                    el.style.display = 'block';
                    el.classList.add('active');
                } else {
                    el.style.display = 'none';
                    el.classList.remove('active');
                }
            }
        });
        updateStepBar(screen);
        const showSteps = !['mypage', 'admin', 'gallery'].includes(screen);
        $('step-bar').classList.toggle('hidden', !showSteps);
        qs('.main-content').classList.toggle('has-steps', showSteps);
        window.scrollTo(0, 0);
    }

    function updateStepBar(screen) {
        const stepOrder = ['menu', 'datetime', 'info', 'note', 'confirm', 'done'];
        const current = STEP_MAP[screen]; if (!current) return;
        const currentIdx = stepOrder.indexOf(current);
        qsa('.step').forEach(el => {
            const idx = stepOrder.indexOf(el.dataset.step);
            el.classList.remove('active', 'completed');
            if (idx === currentIdx) el.classList.add('active');
            else if (idx < currentIdx) el.classList.add('completed');
        });
    }

    // ── Render: Top ──
    function renderTop() {
        const shop = lsGet(LS_KEYS.shopInfo); const menus = lsGet(LS_KEYS.menus);
        $('header-shop-name').textContent = shop.name;
        $('shop-name').textContent = shop.name;
        $('shop-address').textContent = shop.address;
        $('shop-phone').textContent = shop.phone;
        $('shop-hours').textContent = shop.hours;
        $('shop-holidays').textContent = shop.holidays;
        $('shop-rules').textContent = shop.rules;
        const list = $('menu-list'); list.innerHTML = '';
        menus.forEach(m => {
            const card = document.createElement('div'); card.className = 'menu-card';
            card.innerHTML = `<div class="menu-card-top"><span class="menu-name">${esc(m.name)}</span>
        ${m.popular ? '<span class="popular-badge">🔥 人気</span>' : ''}</div>
        <p class="menu-desc">${esc(m.description)}</p>
        <div class="menu-meta"><span class="menu-duration">⏱ ${m.duration}分</span><span class="menu-price">${formatPrice(m.price)}</span></div>
        <button class="btn-select-menu" data-menu-id="${m.id}">このメニューを選ぶ</button>`;
            list.appendChild(card);
        });
    }

    // ── Render: Week Grid (HPB style) ──
    function renderWeekGrid() {
        const settings = lsGet(LS_KEYS.settings);
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const menu = state.selectedMenu;
        const duration = menu.duration;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + settings.maxDays);
        const ws = state.weekStartDate;
        const openMin = timeToMin(settings.openTime);
        const closeMin = timeToMin(settings.closeTime);
        const slotMin = settings.slotMinutes;
        // Determine columns: 14 days (2 weeks like HPB)
        const numDays = 14;
        const numCols = numDays + 2; // time-left + days + time-right
        const grid = $('week-grid');
        grid.style.gridTemplateColumns = `60px repeat(${numDays}, minmax(44px, 1fr)) 60px`;
        grid.innerHTML = '';
        // Header row
        const corner = document.createElement('div'); corner.className = 'wg-corner'; corner.textContent = '';
        grid.appendChild(corner);
        const dates = [];
        for (let i = 0; i < numDays; i++) {
            const d = new Date(ws); d.setDate(d.getDate() + i); dates.push(d);
            const hdr = document.createElement('div'); hdr.className = 'wg-date-header';
            const dow = d.getDay();
            if (dow === 0) hdr.classList.add('sunday');
            if (dow === 6) hdr.classList.add('saturday');
            const isHoliday = settings.holidays.includes(dow);
            if (isHoliday) hdr.classList.add('holiday');
            // Month label on first day or when month changes
            let monthLabel = '';
            if (i === 0 || d.getDate() === 1) monthLabel = `<span class="wg-month-label">${d.getFullYear()}年<br>${d.getMonth() + 1}月</span>`;
            else monthLabel = `<span class="wg-month-label">&nbsp;</span>`;
            hdr.innerHTML = `${monthLabel}<span class="wg-date-num">${d.getDate()}</span><span class="wg-date-dow">(${DAY_NAMES[dow]})</span>`;
            grid.appendChild(hdr);
        }
        const cornerR = document.createElement('div'); cornerR.className = 'wg-corner'; cornerR.textContent = '';
        grid.appendChild(cornerR);
        // Check which columns are holidays (for spanning "休業日" text)
        const holidayCols = dates.map((d, i) => settings.holidays.includes(d.getDay()));
        // Time rows
        const timeSlots = [];
        for (let t = openMin; t < closeMin; t += slotMin) timeSlots.push(t);
        // For holiday columns, we want to show "休業日" spanning all rows in middle
        const midRow = Math.floor(timeSlots.length / 2);
        timeSlots.forEach((t, rowIdx) => {
            const timeLabel = minToTime(t);
            // Left time label
            const tl = document.createElement('div'); tl.className = 'wg-time-label'; tl.textContent = timeLabel;
            grid.appendChild(tl);
            // Date cells
            dates.forEach((d, colIdx) => {
                const cell = document.createElement('div'); cell.className = 'wg-cell';
                const ds = dateStr(d);
                const isHoliday = holidayCols[colIdx];
                const isPast = d < today;
                const isBeyond = d > maxDate;
                if (isHoliday) {
                    cell.classList.add('holiday-col');
                    if (rowIdx === midRow) {
                        cell.innerHTML = '<span class="wg-holiday-text">休業日</span>';
                    }
                } else if (isPast || isBeyond) {
                    const btn = document.createElement('button'); btn.className = 'wg-cell-btn unavailable';
                    btn.textContent = '－'; btn.disabled = true; cell.appendChild(btn);
                } else {
                    const endMin = t + duration;
                    let unavailable = endMin > closeMin;
                    if (!unavailable) {
                        const dayRes = reservations.filter(r => r.date === ds && r.status !== 'canceled');
                        for (const r of dayRes) {
                            const rS = timeToMin(r.startTime); const rE = timeToMin(r.endTime);
                            if (t < rE && endMin > rS) { unavailable = true; break; }
                        }
                    }
                    // Check if today and time already passed
                    if (ds === dateStr(today)) {
                        const now = new Date();
                        if (t <= now.getHours() * 60 + now.getMinutes()) unavailable = true;
                    }
                    const btn = document.createElement('button'); btn.className = 'wg-cell-btn';
                    if (unavailable) {
                        btn.classList.add('unavailable'); btn.textContent = '×'; btn.disabled = true;
                    } else {
                        btn.classList.add('available'); btn.textContent = '◎';
                        btn.dataset.date = ds; btn.dataset.time = timeLabel; btn.dataset.endTime = minToTime(endMin);
                        if (state.selectedDate === ds && state.selectedTime === timeLabel) btn.classList.add('selected');
                    }
                    cell.appendChild(btn);
                }
                grid.appendChild(cell);
            });
            // Right time label
            const tr = document.createElement('div'); tr.className = 'wg-time-label-right'; tr.textContent = timeLabel;
            grid.appendChild(tr);
        });
        // Nav button state
        const prevWeekEnd = new Date(ws); prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
        $('btn-prev-week').disabled = prevWeekEnd < today;
        const nextWeekStart = new Date(ws); nextWeekStart.setDate(nextWeekStart.getDate() + numDays);
        $('btn-next-week').disabled = nextWeekStart > maxDate;
    }

    // ── Render: Confirm ──
    function renderConfirm() {
        const shop = lsGet(LS_KEYS.shopInfo); const m = state.selectedMenu;
        $('confirm-shop').textContent = shop.name;
        $('confirm-menu').textContent = m.name;
        $('confirm-duration-price').textContent = `⏱ ${m.duration}分 ／ ${formatPrice(m.price)}`;
        const endTime = minToTime(timeToMin(state.selectedTime) + m.duration);
        $('confirm-datetime').textContent = `${formatDate(state.selectedDate)}　${state.selectedTime}〜${endTime}`;
        $('confirm-name').textContent = `お名前: ${state.customerInfo.name}`;
        $('confirm-phone').textContent = `電話番号: ${state.customerInfo.phone}`;
        $('confirm-email').textContent = state.customerInfo.email ? `メール: ${state.customerInfo.email}` : '';
        const gm = { female: '女性', male: '男性', other: 'その他' };
        $('confirm-gender').textContent = state.customerInfo.gender ? `性別: ${gm[state.customerInfo.gender]}` : '';
        const vm = { first: '初めて', repeat: 'リピーター' };
        $('confirm-visit').textContent = state.customerInfo.visitType ? `ご来店: ${vm[state.customerInfo.visitType]}` : '';
        $('confirm-note').textContent = state.note || 'なし';
    }

    // ── Save Reservation ──
    function saveReservation() {
        const m = state.selectedMenu;
        const endTime = minToTime(timeToMin(state.selectedTime) + m.duration);
        const endDateTime = new Date(`${state.selectedDate}T${endTime}:00`);
        const nextSuggestAt = endDateTime.getTime() + 10 * 60000;
        const reservation = {
            reservationId: uid(), menuId: m.id, menuName: m.name, durationMinutes: m.duration, price: m.price,
            date: state.selectedDate, startTime: state.selectedTime, endTime: endTime,
            customerName: state.customerInfo.name, customerPhone: state.customerInfo.phone,
            customerEmail: state.customerInfo.email || '', note: state.note, status: 'booked',
            createdAt: new Date().toISOString(), nextSuggestAt, nextSuggestDateTime: '', nextSuggestMessage: ''
        };
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const conflict = reservations.find(r =>
            r.date === reservation.date && r.status !== 'canceled' &&
            timeToMin(r.startTime) < timeToMin(reservation.endTime) && timeToMin(r.endTime) > timeToMin(reservation.startTime));
        if (conflict) { return false; }
        const suggest = calcNextSuggestion(reservation);
        reservation.nextSuggestDateTime = suggest.dateTime; reservation.nextSuggestMessage = suggest.message;
        reservations.push(reservation); lsSet(LS_KEYS.reservations, reservations);
        const queue = lsGet(LS_KEYS.notificationQueue) || [];
        queue.push({
            reservationId: reservation.reservationId, fireAt: nextSuggestAt, fired: false,
            message: suggest.message, menuId: m.id, suggestedDate: suggest.date, suggestedTime: suggest.time,
            customerName: reservation.customerName, customerPhone: reservation.customerPhone, customerEmail: reservation.customerEmail
        });
        lsSet(LS_KEYS.notificationQueue, queue);
        lsSet(LS_KEYS.lastCustomer, {
            name: reservation.customerName, phone: reservation.customerPhone,
            email: reservation.customerEmail, gender: state.customerInfo.gender, visitType: state.customerInfo.visitType
        });
        scheduleNotification(reservation.reservationId, nextSuggestAt);
        state.lastReservation = reservation;
        return true;
    }

    function renderDone() {
        const r = state.lastReservation;
        $('done-summary').innerHTML = `<strong>${esc(r.menuName)}</strong><br>
      📅 ${formatDate(r.date)}<br>🕐 ${r.startTime}〜${r.endTime}<br>
      👤 ${esc(r.customerName)}<br>📞 ${esc(r.customerPhone)}
      ${r.note ? '<br>📝 ' + esc(r.note) : ''}`;

        // Confetti
        const colors = ['#ff6b81', '#ffc107', '#2196f3', '#4caf50', '#e91e63'];
        const container = qs('.celebration-confetti');
        if (container) {
            container.innerHTML = '';
            for (let i = 0; i < 50; i++) {
                const el = document.createElement('div'); el.className = 'confetti-piece';
                el.style.left = Math.random() * 100 + '%';
                el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                el.style.animationDelay = Math.random() * 2 + 's';
                el.style.animationDuration = (Math.random() * 2 + 2) + 's';
                container.appendChild(el);
            }
        }
    }

    // ── Next Suggestion Calc ──
    function calcNextSuggestion(reservation) {
        const settings = lsGet(LS_KEYS.settings); const reservations = lsGet(LS_KEYS.reservations) || [];
        const origDate = new Date(reservation.date + 'T00:00:00');
        const origDow = origDate.getDay(); const origTimeMin = timeToMin(reservation.startTime);
        const duration = reservation.durationMinutes;
        let target = new Date(origDate); target.setMonth(target.getMonth() + 1);
        while (target.getDay() !== origDow) target.setDate(target.getDate() + 1);
        function isSlotAvailable(ds, startMin) {
            const d = new Date(ds + 'T00:00:00');
            if (settings.holidays.includes(d.getDay())) return false;
            const oMin = timeToMin(settings.openTime), cMin = timeToMin(settings.closeTime);
            if (startMin < oMin || startMin + duration > cMin) return false;
            const dayRes = reservations.filter(r => r.date === ds && r.status !== 'canceled');
            for (const r of dayRes) { const rS = timeToMin(r.startTime), rE = timeToMin(r.endTime); if (startMin < rE && (startMin + duration) > rS) return false; }
            return true;
        }
        function findSlotOnDate(ds) {
            const oMin = timeToMin(settings.openTime), cMin = timeToMin(settings.closeTime);
            if (isSlotAvailable(ds, origTimeMin)) return origTimeMin;
            for (let off = settings.slotMinutes; off < cMin - oMin; off += settings.slotMinutes) {
                if (origTimeMin - off >= oMin && isSlotAvailable(ds, origTimeMin - off)) return origTimeMin - off;
                if (origTimeMin + off + duration <= cMin && isSlotAvailable(ds, origTimeMin + off)) return origTimeMin + off;
            }
            return -1;
        }
        let ds = dateStr(target); let ft = findSlotOnDate(ds);
        if (ft >= 0) return buildSuggestion(ds, ft, reservation);
        for (let delta = 1; delta <= 6; delta++) {
            for (const dir of [-1, 1]) {
                const td = new Date(target); td.setDate(td.getDate() + delta * dir);
                const ts = dateStr(td); ft = findSlotOnDate(ts);
                if (ft >= 0) return buildSuggestion(ts, ft, reservation);
            }
        }
        for (let i = 1; i <= 14; i++) {
            const td = new Date(target); td.setDate(td.getDate() + i);
            const ts = dateStr(td); ft = findSlotOnDate(ts);
            if (ft >= 0) return buildSuggestion(ts, ft, reservation);
        }
        return buildSuggestion(ds, origTimeMin, reservation);
    }

    function buildSuggestion(ds, timeMin, reservation) {
        const d = new Date(ds + 'T00:00:00'); const ts = minToTime(timeMin);
        const msg = `ご来店ありがとうございました♪次回のご予約は${d.getMonth() + 1}月${d.getDate()}日${ts}～ならあいてます！`;
        return { date: ds, time: ts, dateTime: `${ds} ${ts}`, message: msg };
    }

    // ── ICS ──
    function generateICS(r) {
        const start = r.date.replace(/-/g, '') + 'T' + r.startTime.replace(':', '') + '00';
        const end = r.date.replace(/-/g, '') + 'T' + r.endTime.replace(':', '') + '00';
        const shop = lsGet(LS_KEYS.shopInfo);
        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BeautyReserve//JP', 'BEGIN:VEVENT',
            `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${r.menuName} - ${shop.name}`,
            `DESCRIPTION:${r.customerName}様のご予約`, `LOCATION:${shop.address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reservation.ics';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // ── MyPage ──
    function renderMypage() {
        const user = lsGet(LS_KEYS.loggedInUser);
        if (user) { showMypageContent(user); } else { showMypageLogin(); }
    }

    function showMypageLogin() {
        $('mypage-login').style.display = ''; $('mypage-content').classList.add('hidden');
        $('login-name').value = ''; $('login-phone').value = ''; $('error-login').textContent = '';
        $('btn-back-mypage').style.display = 'none';
    }

    function showMypageContent(user) {
        $('mypage-login').style.display = 'none'; $('mypage-content').classList.remove('hidden');
        $('btn-back-mypage').style.display = '';
        $('mypage-user-name').textContent = `${user.name} 様`;
        const reservations = (lsGet(LS_KEYS.reservations) || [])
            .filter(r => r.customerName === user.name && r.customerPhone.replace(/[-\s]/g, '') === user.phone.replace(/[-\s]/g, ''))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const list = $('mypage-reservation-list'); list.innerHTML = '';
        if (reservations.length === 0) {
            list.innerHTML = '<div class="mypage-empty"><p>予約履歴がありません</p></div>'; return;
        }
        const statusLabel = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };
        reservations.forEach(r => {
            const card = document.createElement('div'); card.className = 'mypage-res-card';
            card.innerHTML = `<div class="mypage-res-top"><span class="mypage-res-menu">${esc(r.menuName)}</span>
        <span class="status-badge status-${r.status}">${statusLabel[r.status]}</span></div>
        <div class="mypage-res-info">📅 ${formatDate(r.date)}　${r.startTime}〜${r.endTime}<br>
        💰 ${formatPrice(r.price)}　⏱ ${r.durationMinutes}分${r.note ? '<br>📝 ' + esc(r.note) : ''}</div>
        <div style="text-align:right;margin-top:8px;font-size:12px;color:var(--primary-color)">詳細・変更 &gt;</div>`;
            card.onclick = () => showUserResDetail(r.reservationId);
            list.appendChild(card);
        });
    }

    // ── Gallery ──
    function renderGallery() {
        const grid = $('gallery-grid'); grid.innerHTML = '';
        gallery.forEach(item => {
            const el = document.createElement('div'); el.className = 'gallery-item';
            el.innerHTML = `<img src="${item.img}" class="gallery-img"><div class="gallery-info">${item.title}</div>`;
            el.onclick = () => showGalleryDetail(item);
            grid.appendChild(el);
        });
    }

    function showGalleryDetail(item) {
        const menus = lsGet(LS_KEYS.menus);
        const menu = menus.find(m => m.id === item.menuId);
        $('modal-body').innerHTML = `
            <img src="${item.img}" style="width:100%;border-radius:8px;margin-bottom:12px">
            <h3>${item.title}</h3>
            <p style="font-size:14px;color:#666;margin-bottom:12px">${item.desc}</p>
            <div class="detail-row"><span class="detail-label">参考メニュー</span><span class="detail-value">${menu ? menu.name : '-'}</span></div>
            <div class="detail-row"><span class="detail-label">目安料金</span><span class="detail-value">${menu ? formatPrice(menu.price) : '-'}</span></div>
        `;
        const actions = $('modal-actions'); actions.innerHTML = '';
        const btn = document.createElement('button'); btn.className = 'btn-primary btn-full'; btn.textContent = 'このデザインで予約';
        btn.onclick = () => {
            $('modal-overlay').classList.add('hidden');
            state.selectedMenu = menu; state.selectedDate = null; state.selectedTime = null;
            const today = new Date(); today.setHours(0, 0, 0, 0); state.weekStartDate = new Date(today);
            $('selected-menu-summary').textContent = `💅 ${menu.name}　${formatPrice(menu.price)}`;
            renderWeekGrid(); navigate('datetime');
        };
        actions.appendChild(btn);
        $('modal-overlay').classList.remove('hidden');
    }

    // ── User Reservation Detail & Cancel/Change ──
    function showUserResDetail(resId) {
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId); if (!r) return;
        const statusLabel = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };
        $('modal-body').innerHTML = `
            <div class="detail-row"><span class="detail-label">メニュー</span><span class="detail-value">${esc(r.menuName)}</span></div>
            <div class="detail-row"><span class="detail-label">日時</span><span class="detail-value">${formatDate(r.date)} ${r.startTime}〜${r.endTime}</span></div>
            <div class="detail-row"><span class="detail-label">料金</span><span class="detail-value">${formatPrice(r.price)}</span></div>
            <div class="detail-row"><span class="detail-label">ステータス</span><span class="detail-value">${statusLabel[r.status]}</span></div>
            ${r.note ? `<div class="detail-row"><span class="detail-label">備考</span><span class="detail-value">${esc(r.note)}</span></div>` : ''}`;

        const actions = $('modal-actions'); actions.innerHTML = '';
        if (r.status === 'booked') {
            const btnChange = document.createElement('button'); btnChange.className = 'btn-modal-change'; btnChange.textContent = '予約変更';
            btnChange.onclick = () => startChangeReservation(resId);
            const btnCancel = document.createElement('button'); btnCancel.className = 'btn-modal-cancel'; btnCancel.textContent = 'キャンセル';
            btnCancel.onclick = () => cancelReservation(resId);
            actions.appendChild(btnChange); actions.appendChild(btnCancel);
        } else {
            actions.innerHTML = '<p style="width:100%;text-align:center;color:#888;font-size:12px">この予約は変更できません</p>';
        }
        $('modal-overlay').classList.remove('hidden');
    }

    function cancelReservation(resId) {
        if (!confirm('予約をキャンセルしますか？\\n※この操作は取り消せません。')) return;
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId);
        if (r) {
            r.status = 'canceled';
            // Remove from notification queue
            let queue = lsGet(LS_KEYS.notificationQueue) || []; queue = queue.filter(q => q.reservationId !== resId);
            lsSet(LS_KEYS.notificationQueue, queue);
            lsSet(LS_KEYS.reservations, reservations);
            $('modal-overlay').classList.add('hidden');
            renderMypage(); // Refresh list
        }
    }

    function startChangeReservation(resId) {
        if (!confirm('現在の予約をキャンセルして、新しい日時の予約に進みますか？')) return;
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId);
        if (r) {
            cancelReservation(resId); // Cancel current
            // Start new reservation with same info
            const menus = lsGet(LS_KEYS.menus) || [];
            const menu = menus.find(m => m.id === r.menuId);
            state.selectedMenu = menu; state.selectedDate = null; state.selectedTime = null;
            state.customerInfo = { name: r.customerName, phone: r.customerPhone, email: r.customerEmail };
            $('selected-menu-summary').textContent = `💅 ${menu.name}　${formatPrice(menu.price)}`;
            $('input-email').value = state.customerInfo.email || '';
            renderWeekGrid(); navigate('datetime');
            showToast('日時を選択し直してください', 'info');
        }
    }


    // ── Admin ──
    function renderAdmin() { renderReservationList(); renderSettingsForm(); }

    function renderReservationList() {
        const reservations = (lsGet(LS_KEYS.reservations) || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const list = $('admin-reservation-list');
        let filtered = reservations;
        if (state.adminFilter !== 'all') filtered = filtered.filter(r => r.status === state.adminFilter);
        if (state.adminSearch) {
            const q = state.adminSearch.toLowerCase();
            filtered = filtered.filter(r => r.customerName.toLowerCase().includes(q) || r.customerPhone.includes(q) || r.date.includes(q));
        }
        if (filtered.length === 0) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>予約が見つかりません</p></div>'; return; }
        list.innerHTML = '';
        const statusLabel = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };
        filtered.forEach(r => {
            const card = document.createElement('div'); card.className = 'admin-res-card'; card.dataset.resId = r.reservationId;
            card.innerHTML = `<div class="admin-res-top"><span class="admin-res-name">${esc(r.customerName)}</span>
        <span class="status-badge status-${r.status}">${statusLabel[r.status]}</span></div>
        <div class="admin-res-info">💅 ${esc(r.menuName)}<br>📅 ${formatDate(r.date)}　${r.startTime}〜${r.endTime}</div>`;
            list.appendChild(card);
        });
    }

    function renderSettingsForm() {
        const s = lsGet(LS_KEYS.settings);
        $('setting-open').value = s.openTime; $('setting-close').value = s.closeTime;
        $('setting-slot').value = s.slotMinutes; $('setting-max-days').value = s.maxDays;
        qsa('input[name="holiday"]').forEach(cb => { cb.checked = s.holidays.includes(parseInt(cb.value)); });
    }

    function showReservationDetail(resId) {
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId); if (!r) return;
        const statusLabel = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };
        $('modal-body').innerHTML = `
      <div class="detail-row"><span class="detail-label">メニュー</span><span class="detail-value">${esc(r.menuName)}</span></div>
      <div class="detail-row"><span class="detail-label">日付</span><span class="detail-value">${formatDate(r.date)}</span></div>
      <div class="detail-row"><span class="detail-label">時間</span><span class="detail-value">${r.startTime}〜${r.endTime}</span></div>
      <div class="detail-row"><span class="detail-label">所要時間</span><span class="detail-value">${r.durationMinutes}分</span></div>
      <div class="detail-row"><span class="detail-label">料金</span><span class="detail-value">${formatPrice(r.price)}</span></div>
      <div class="detail-row"><span class="detail-label">お名前</span><span class="detail-value">${esc(r.customerName)}</span></div>
      <div class="detail-row"><span class="detail-label">電話番号</span><span class="detail-value">${esc(r.customerPhone)}</span></div>
      ${r.customerEmail ? `<div class="detail-row"><span class="detail-label">メール</span><span class="detail-value">${esc(r.customerEmail)}</span></div>` : ''}
      ${r.note ? `<div class="detail-row"><span class="detail-label">備考</span><span class="detail-value">${esc(r.note)}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">ステータス</span><span class="detail-value">${statusLabel[r.status]}</span></div>
      <div class="detail-row"><span class="detail-label">予約日時</span><span class="detail-value">${new Date(r.createdAt).toLocaleString('ja-JP')}</span></div>`;
        const actions = $('modal-actions'); actions.innerHTML = '';
        if (r.status === 'booked') {
            const bc = document.createElement('button'); bc.className = 'btn-modal-complete'; bc.textContent = '来店完了';
            bc.onclick = () => updateResStatus(resId, 'completed');
            const bx = document.createElement('button'); bx.className = 'btn-modal-cancel'; bx.textContent = 'キャンセル';
            bx.onclick = () => updateResStatus(resId, 'canceled');
            actions.appendChild(bc); actions.appendChild(bx);
        } else if (r.status === 'completed') {
            const bx = document.createElement('button'); bx.className = 'btn-modal-cancel'; bx.textContent = 'キャンセルに変更';
            bx.onclick = () => updateResStatus(resId, 'canceled'); actions.appendChild(bx);
        }
        $('modal-overlay').classList.remove('hidden');
    }

    function updateResStatus(resId, newStatus) {
        const reservations = lsGet(LS_KEYS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId);
        if (r) {
            r.status = newStatus;
            if (newStatus === 'completed') {
                const endDT = new Date(`${r.date}T${r.endTime}:00`);
                r.nextSuggestAt = endDT.getTime() + 10 * 60000;
                const suggest = calcNextSuggestion(r);
                r.nextSuggestDateTime = suggest.dateTime; r.nextSuggestMessage = suggest.message;
                const queue = lsGet(LS_KEYS.notificationQueue) || [];
                queue.push({
                    reservationId: r.reservationId, fireAt: r.nextSuggestAt, fired: false,
                    message: suggest.message, menuId: r.menuId, suggestedDate: suggest.date, suggestedTime: suggest.time,
                    customerName: r.customerName, customerPhone: r.customerPhone, customerEmail: r.customerEmail
                });
                lsSet(LS_KEYS.notificationQueue, queue);
                scheduleNotification(r.reservationId, r.nextSuggestAt);
            }
            if (newStatus === 'canceled') {
                let queue = lsGet(LS_KEYS.notificationQueue) || []; queue = queue.filter(q => q.reservationId !== resId);
                lsSet(LS_KEYS.notificationQueue, queue);
            }
            lsSet(LS_KEYS.reservations, reservations);
        }
        $('modal-overlay').classList.add('hidden');
        renderReservationList();
        showToast(newStatus === 'completed' ? '来店完了にしました' : 'キャンセルしました', 'success');
    }

    // ── Notifications ──
    let notifTimers = {};
    function initNotifications() {
        if ('Notification' in window && Notification.permission === 'default' && !lsGet(LS_KEYS.notifDismissed))
            $('notification-banner').classList.remove('hidden');
        updateBellVisibility(); processNotificationQueue(); setInterval(processNotificationQueue, 30000);
    }
    function scheduleNotification(resId, fireAt) {
        const delay = fireAt - Date.now();
        if (delay <= 0) { fireNotification(resId); return; }
        if (notifTimers[resId]) clearTimeout(notifTimers[resId]);
        notifTimers[resId] = setTimeout(() => fireNotification(resId), Math.min(delay, 2147483647));
    }
    function processNotificationQueue() {
        const queue = lsGet(LS_KEYS.notificationQueue) || []; const now = Date.now(); let changed = false;
        queue.forEach(item => {
            if (!item.fired && item.fireAt <= now) { fireNotification(item.reservationId); item.fired = true; changed = true; }
            else if (!item.fired && item.fireAt > now) { scheduleNotification(item.reservationId, item.fireAt); }
        });
        if (changed) lsSet(LS_KEYS.notificationQueue, queue); updateBellVisibility();
    }
    function fireNotification(resId) {
        const queue = lsGet(LS_KEYS.notificationQueue) || [];
        const item = queue.find(q => q.reservationId === resId); if (!item) return;
        item.fired = true; lsSet(LS_KEYS.notificationQueue, queue);
        const inApp = lsGet(LS_KEYS.inAppNotifications) || [];
        if (!inApp.find(n => n.reservationId === resId)) {
            inApp.unshift({
                reservationId: resId, message: item.message, time: new Date().toISOString(),
                menuId: item.menuId, suggestedDate: item.suggestedDate, suggestedTime: item.suggestedTime,
                customerName: item.customerName, customerPhone: item.customerPhone, customerEmail: item.customerEmail, read: false
            });
            lsSet(LS_KEYS.inAppNotifications, inApp);
        }
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notif = new Notification('Beauty Reserve', { body: item.message, tag: resId });
                notif.onclick = () => { window.focus(); startRebooking(item); notif.close(); };
            } catch (e) { }
        }
        showToast(item.message, 'notification', () => startRebooking(item)); updateBellVisibility();
    }
    function updateBellVisibility() {
        const inApp = lsGet(LS_KEYS.inAppNotifications) || [];
        const unread = inApp.filter(n => !n.read).length;
        const bell = $('notification-bell'), badge = $('notification-badge');
        if (inApp.length > 0) {
            bell.classList.remove('hidden');
            if (unread > 0) { badge.classList.remove('hidden'); badge.textContent = unread; } else badge.classList.add('hidden');
        } else bell.classList.add('hidden');
        renderNotificationList();
    }
    function renderNotificationList() {
        const inApp = lsGet(LS_KEYS.inAppNotifications) || [];
        const list = $('notification-list');
        if (inApp.length === 0) { list.innerHTML = '<p class="empty-notifications">通知はありません</p>'; return; }
        list.innerHTML = '';
        inApp.forEach(n => {
            const item = document.createElement('div'); item.className = 'notification-item';
            item.innerHTML = `<div class="notification-item-message">${esc(n.message)}</div>
        <div class="notification-item-time">${new Date(n.time).toLocaleString('ja-JP')}</div>
        <span class="notification-item-action">📅 次回予約する →</span>`;
            item.onclick = () => {
                n.read = true; lsSet(LS_KEYS.inAppNotifications, inApp);
                updateBellVisibility(); $('notification-panel').classList.add('hidden'); startRebooking(n);
            };
            list.appendChild(item);
        });
    }

    // ── One-Tap Rebooking ──
    function startRebooking(nd) {
        const menus = lsGet(LS_KEYS.menus) || [];
        const menu = menus.find(m => m.id === nd.menuId);
        if (!menu) { showToast('メニューが見つかりません', 'error'); return; }
        state.selectedMenu = menu; state.selectedDate = nd.suggestedDate; state.selectedTime = nd.suggestedTime;
        state.customerInfo = { name: nd.customerName || '', phone: nd.customerPhone || '', email: nd.customerEmail || '' };
        state.note = ''; state.nextBookingData = nd;
        $('selected-menu-summary').textContent = `💅 ${menu.name}　${formatPrice(menu.price)}`;
        // Name & Phone inputs removed
        $('input-email').value = state.customerInfo.email || '';
        navigate('info'); showToast('前回の情報を復元しました。', 'success');
    }

    // ── Toast (disabled) ──
    function showToast() { }

    // ── Validation ──
    function validateInfo() {
        let valid = true;
        const email = $('input-email').value.trim(), agree = $('input-agree').checked;
        $('error-email').textContent = ''; $('error-agree').textContent = '';
        $('input-email').classList.remove('error');

        // Name & Phone are taken from logged-in user

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('error-email').textContent = '正しいメールアドレスを入力してください'; $('input-email').classList.add('error'); valid = false; }
        if (!agree) { $('error-agree').textContent = 'キャンセル規定への同意が必要です'; valid = false; }
        if (valid) {
            const user = lsGet(LS_KEYS.loggedInUser) || { name: 'ゲスト', phone: '000-0000-0000' };
            const gender = qs('input[name="gender"]:checked'); const visit = qs('input[name="visit-type"]:checked');
            state.customerInfo = { name: user.name, phone: user.phone, email, gender: gender ? gender.value : '', visitType: visit ? visit.value : '' };
        }
        return valid;
    }

    // ── Event Binding ──
    function bindEvents() {
        $('btn-home').addEventListener('click', () => { navigate('top'); renderTop(); });
        $('btn-mypage').addEventListener('click', () => { navigate('mypage'); renderMypage(); });
        $('btn-back-mypage').addEventListener('click', () => { navigate('top'); renderTop(); });
        // Login (Test Mode)
        $('btn-login').addEventListener('click', () => {
            let name = $('login-name').value.trim(), phone = $('login-phone').value.trim();
            if (!name) name = 'ゲスト';
            if (!phone) phone = '000-0000-0000';

            if (!name || !phone) { $('error-login').textContent = 'テスト用：適当な名前と電話番号を入力してください'; return; }
            $('error-login').textContent = '';
            const user = { name, phone }; lsSet(LS_KEYS.loggedInUser, user);
            let reservations = lsGet(LS_KEYS.reservations) || [];
            const userRes = reservations.filter(r => r.customerName === name && r.customerPhone.replace(/[-\s]/g, '') === phone.replace(/[-\s]/g, ''));
            if (userRes.length === 0) {
                const past = new Date(); past.setMonth(past.getMonth() - 1);
                const pastRes = {
                    reservationId: uid(), menuId: 'm1', menuName: 'デザインネイル(仮)', durationMinutes: 90, price: 8800,
                    date: dateStr(past), startTime: '10:00', endTime: '11:30',
                    customerName: name, customerPhone: phone, customerEmail: 'test@example.com',
                    note: 'テスト', status: 'completed',
                    createdAt: new Date(past.getTime() - 86400000).toISOString(),
                    nextSuggestAt: null, nextSuggestDateTime: '', nextSuggestMessage: ''
                };
                const future = new Date(); future.setDate(future.getDate() + 14);
                const futureRes = {
                    reservationId: uid(), menuId: 'm3', menuName: 'ワンカラー(仮)', durationMinutes: 60, price: 5500,
                    date: dateStr(future), startTime: '14:00', endTime: '15:00',
                    customerName: name, customerPhone: phone, customerEmail: 'test@example.com',
                    note: 'テスト', status: 'booked',
                    createdAt: new Date().toISOString(),
                    nextSuggestAt: null, nextSuggestDateTime: '', nextSuggestMessage: ''
                };
                reservations.push(pastRes, futureRes);
                lsSet(LS_KEYS.reservations, reservations);
                showToast('テスト用データを生成しました', 'success');
            } else {
                showToast('ログインしました', 'success');
            }
            // ログイン後はトップページ（メニュー一覧）へ遷移
            renderTop(); navigate('top');
        });
        $('btn-logout').addEventListener('click', () => {
            localStorage.removeItem(LS_KEYS.loggedInUser); showMypageLogin(); showToast('ログアウトしました', 'success');
        });
        // Admin (hidden, via hash)
        $('btn-back-admin').addEventListener('click', () => { navigate('top'); renderTop(); });
        // Menu selection
        $('menu-list').addEventListener('click', e => {
            const btn = e.target.closest('.btn-select-menu'); if (!btn) return;
            const menus = lsGet(LS_KEYS.menus);
            state.selectedMenu = menus.find(m => m.id === btn.dataset.menuId);
            state.selectedDate = null; state.selectedTime = null;
            const today = new Date(); today.setHours(0, 0, 0, 0); state.weekStartDate = new Date(today);
            $('selected-menu-summary').textContent = `💅 ${state.selectedMenu.name}　${formatPrice(state.selectedMenu.price)}`;
            renderWeekGrid(); navigate('datetime');
        });
        // Week nav
        $('btn-prev-week').addEventListener('click', () => {
            state.weekStartDate.setDate(state.weekStartDate.getDate() - 7); renderWeekGrid();
        });
        $('btn-next-week').addEventListener('click', () => {
            state.weekStartDate.setDate(state.weekStartDate.getDate() + 7); renderWeekGrid();
        });
        // Week grid cell click
        $('week-grid').addEventListener('click', e => {
            const btn = e.target.closest('.wg-cell-btn'); if (!btn || btn.disabled) return;
            state.selectedDate = btn.dataset.date; state.selectedTime = btn.dataset.time;
            renderWeekGrid();
            const last = lsGet(LS_KEYS.lastCustomer);
            if (last && !state.nextBookingData) {
                $('input-email').value = last.email || '';
                if (last.gender) { const g = qs(`input[name="gender"][value="${last.gender}"]`); if (g) g.checked = true; }
                if (last.visitType) { const v = qs(`input[name="visit-type"][value="${last.visitType}"]`); if (v) v.checked = true; }
            }
            navigate('info');
        });
        // Back buttons
        $('btn-back-datetime').addEventListener('click', () => { navigate('top'); renderTop(); });
        $('btn-back-info').addEventListener('click', () => { renderWeekGrid(); navigate('datetime'); });
        $('btn-back-note').addEventListener('click', () => navigate('info'));
        $('btn-back-confirm').addEventListener('click', () => navigate('note'));
        // Info next
        $('btn-info-next').addEventListener('click', () => { if (validateInfo()) navigate('note'); });
        // Note chips
        qsa('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const ta = $('input-note'), text = chip.dataset.text;
                if (chip.classList.contains('active')) ta.value = ta.value ? ta.value + '\n' + text : text;
                else ta.value = ta.value.replace(text, '').replace(/\n{2,}/g, '\n').trim();
                $('note-char-count').textContent = ta.value.length;
            });
        });
        $('input-note').addEventListener('input', () => { $('note-char-count').textContent = $('input-note').value.length; });
        $('btn-note-next').addEventListener('click', () => { state.note = $('input-note').value.trim(); renderConfirm(); navigate('confirm'); });
        // Confirm
        $('btn-confirm-submit').addEventListener('click', () => {
            if (saveReservation()) { renderDone(); navigate('done'); showToast('ご予約ありがとうございます！🎉', 'success'); }
        });
        // Done
        $('btn-back-top').addEventListener('click', () => {
            state.selectedMenu = null; state.selectedDate = null; state.selectedTime = null; state.nextBookingData = null;
            navigate('top'); renderTop();
        });
        $('btn-download-ics').addEventListener('click', () => { if (state.lastReservation) generateICS(state.lastReservation); });
        // Admin tabs
        qsa('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                qsa('.admin-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active');
                const tn = tab.dataset.tab;
                $('admin-reservations').classList.toggle('hidden', tn !== 'reservations');
                $('admin-settings').classList.toggle('hidden', tn !== 'settings');
            });
        });
        $('admin-search').addEventListener('input', e => { state.adminSearch = e.target.value; renderReservationList(); });
        qsa('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                qsa('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
                state.adminFilter = btn.dataset.filter; renderReservationList();
            });
        });
        $('admin-reservation-list').addEventListener('click', e => {
            const card = e.target.closest('.admin-res-card'); if (card) showReservationDetail(card.dataset.resId);
        });
        $('btn-close-modal').addEventListener('click', () => $('modal-overlay').classList.add('hidden'));
        $('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) $('modal-overlay').classList.add('hidden'); });
        $('btn-save-settings').addEventListener('click', () => {
            const holidays = []; qsa('input[name="holiday"]:checked').forEach(cb => holidays.push(parseInt(cb.value)));
            const settings = {
                openTime: $('setting-open').value, closeTime: $('setting-close').value,
                holidays, slotMinutes: parseInt($('setting-slot').value), maxDays: parseInt($('setting-max-days').value)
            };
            lsSet(LS_KEYS.settings, settings);
            const shop = lsGet(LS_KEYS.shopInfo);
            shop.hours = `${settings.openTime}〜${settings.closeTime}`;
            const hn = holidays.map(h => DAY_NAMES[h]).join('・');
            shop.holidays = hn ? `毎週${hn}曜日` : 'なし'; lsSet(LS_KEYS.shopInfo, shop);
            showToast('設定を保存しました', 'success');
        });

        // Gallery Events
        $('btn-to-gallery').addEventListener('click', () => { renderGallery(); navigate('gallery'); });
        $('btn-back-gallery').addEventListener('click', () => { navigate('top'); renderTop(); });
        $('btn-allow-notification').addEventListener('click', () => {
            if ('Notification' in window) Notification.requestPermission().then(p => {
                $('notification-banner').classList.add('hidden');
                if (p === 'granted') showToast('通知を許可しました 🔔', 'success');
            });
        });
        $('btn-dismiss-notification').addEventListener('click', () => {
            $('notification-banner').classList.add('hidden'); lsSet(LS_KEYS.notifDismissed, true);
        });
        $('notification-bell').addEventListener('click', () => $('notification-panel').classList.toggle('hidden'));
        $('btn-close-notifications').addEventListener('click', () => $('notification-panel').classList.add('hidden'));
        // Hash-based admin access
        window.addEventListener('hashchange', checkHash); checkHash();
    }

    function checkHash() { if (location.hash === '#admin') { navigate('admin'); renderAdmin(); } }

    // ── Boot ──
    function boot() {
        try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); }
        catch (e) { document.body.innerHTML = '<div style="padding:40px;text-align:center"><h2>⚠️ localStorage が使用できません</h2><p>ブラウザの設定をご確認ください。</p></div>'; return; }
        initData(); navigate('mypage'); renderMypage(); bindEvents(); initNotifications();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
