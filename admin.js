// ================================
// Beauty Reserve - Admin Dashboard
// ================================
(function () {
    'use strict';

    // Same localStorage keys as the customer app
    const LS = {
        shopInfo: 'br_shopInfo', menus: 'br_menus', settings: 'br_settings',
        reservations: 'br_reservations', notificationQueue: 'br_notificationQueue',
        staffs: 'br_staffs', customerNotes: 'br_customerNotes'
    };

    const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

    // Helpers
    function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
    function lsSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    function $(id) { return document.getElementById(id); }
    function qsa(s) { return document.querySelectorAll(s); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
    function padZero(n) { return n < 10 ? '0' + n : '' + n; }
    function dateStr(d) { return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`; }
    function formatDate(ds) {
        const d = new Date(ds);
        return `${d.getFullYear()}/${padZero(d.getMonth() + 1)}/${padZero(d.getDate())}（${DAY_NAMES[d.getDay()]}）`;
    }
    function formatPrice(n) { return '¥' + n.toLocaleString(); }

    // State
    let currentPage = 'dashboard';
    let resFilter = 'all';
    let resSearch = '';
    let customerSearch = '';
    let editingMenuId = null;
    let editingStaffId = null;
    let salesPeriod = 'daily';
    let salesYear = new Date().getFullYear();
    let salesMonth = new Date().getMonth() + 1; // 1-12

    // ── Navigation ──
    function navigateTo(page) {
        currentPage = page;
        qsa('.page').forEach(p => p.classList.remove('active'));
        const el = $('page-' + page);
        if (el) el.classList.add('active');

        qsa('.nav-item[data-page]').forEach(n => {
            n.classList.toggle('active', n.dataset.page === page);
        });

        // Close mobile sidebar
        $('sidebar').classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.remove('show');

        // Render page content
        switch (page) {
            case 'dashboard': renderDashboard(); break;
            case 'reservations': renderReservations(); break;
            case 'menus': renderMenus(); break;
            case 'staffs': renderStaffs(); break;
            case 'sales': renderSales(); break;
            case 'customers': renderCustomers(); break;
            case 'settings': renderSettings(); break;
        }
    }

    // ── Dashboard ──
    function renderDashboard() {
        const today = dateStr(new Date());
        const now = new Date();
        const reservations = lsGet(LS.reservations) || [];
        const menus = lsGet(LS.menus) || [];

        // Date display
        $('dashboard-date').textContent = formatDate(today);

        // KPI: Today's reservations
        const todayRes = reservations.filter(r => r.date === today && r.status !== 'canceled');
        $('kpi-today-count').textContent = todayRes.length;

        // KPI: Today's revenue
        const todayRevenue = todayRes.reduce((sum, r) => {
            const menu = menus.find(m => m.id === r.menuId);
            return sum + (menu ? menu.price : 0);
        }, 0);
        $('kpi-today-revenue').textContent = formatPrice(todayRevenue);

        // KPI: Completed this month
        const monthStr = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}`;
        const completedThisMonth = reservations.filter(r =>
            r.date.startsWith(monthStr) && r.status === 'completed'
        ).length;
        $('kpi-completed').textContent = completedThisMonth;

        // KPI: Total unique customers
        const uniqueCustomers = new Set(reservations.map(r => r.customerPhone)).size;
        $('kpi-total-customers').textContent = uniqueCustomers;

        // Upcoming reservations (next 7 days)
        const next7 = new Date(now);
        next7.setDate(next7.getDate() + 7);
        const upcoming = reservations
            .filter(r => r.date >= today && r.date <= dateStr(next7) && r.status !== 'canceled')
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            .slice(0, 10);

        const tbody = $('dashboard-upcoming-body');
        const empty = $('dashboard-empty');

        if (upcoming.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = upcoming.map(r => {
            const statusLabels = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };
            return `<tr>
                <td>${esc(formatDate(r.date))} ${esc(r.startTime)}〜${esc(r.endTime)}</td>
                <td>${esc(r.customerName)}</td>
                <td>${esc(r.menuName)}</td>
                <td><span class="badge badge-${r.status}">${statusLabels[r.status]}</span></td>
            </tr>`;
        }).join('');
    }

    // ── Reservations ──
    function renderReservations() {
        const reservations = (lsGet(LS.reservations) || []).slice()
            .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
        const menus = lsGet(LS.menus) || [];

        let filtered = reservations;
        if (resFilter !== 'all') filtered = filtered.filter(r => r.status === resFilter);
        if (resSearch) {
            const q = resSearch.toLowerCase();
            filtered = filtered.filter(r =>
                r.customerName.toLowerCase().includes(q) ||
                r.customerPhone.includes(q) ||
                r.date.includes(q) ||
                (r.menuName && r.menuName.toLowerCase().includes(q))
            );
        }

        const tbody = $('res-body');
        const empty = $('res-empty');

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        const statusLabels = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };

        tbody.innerHTML = filtered.map(r => {
            const menu = menus.find(m => m.id === r.menuId);
            const price = menu ? formatPrice(menu.price) : '-';
            let actions = '';
            if (r.status === 'booked') {
                actions = `
                    <button class="btn-sm btn-sm-success" data-action="complete" data-id="${r.reservationId}">来店完了</button>
                    <button class="btn-sm btn-sm-danger" data-action="cancel" data-id="${r.reservationId}">キャンセル</button>`;
            }
            return `<tr data-res-id="${r.reservationId}" class="res-row-clickable">
                <td>${esc(formatDate(r.date))}<br><small>${esc(r.startTime)}〜${esc(r.endTime)}</small></td>
                <td>${esc(r.customerName)}</td>
                <td>${esc(r.customerPhone)}</td>
                <td>${esc(r.menuName)}</td>
                <td>${price}</td>
                <td><span class="badge badge-${r.status}">${statusLabels[r.status]}</span></td>
                <td class="action-cell">${actions}</td>
            </tr>`;
        }).join('');
    }

    function showResDetail(resId) {
        const reservations = lsGet(LS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId);
        if (!r) return;

        const menus = lsGet(LS.menus) || [];
        const menu = menus.find(m => m.id === r.menuId);
        const statusLabels = { booked: '予約済', completed: '来店完了', canceled: 'キャンセル' };

        $('res-modal-body').innerHTML = `
            <div class="res-detail-grid">
                <div class="res-detail-item">
                    <span class="res-detail-label">お客様名</span>
                    <span class="res-detail-value">${esc(r.customerName)}</span>
                </div>
                <div class="res-detail-item">
                    <span class="res-detail-label">電話番号</span>
                    <span class="res-detail-value">${esc(r.customerPhone)}</span>
                </div>
                <div class="res-detail-item">
                    <span class="res-detail-label">メール</span>
                    <span class="res-detail-value">${esc(r.customerEmail || '-')}</span>
                </div>
                <div class="res-detail-item">
                    <span class="res-detail-label">ステータス</span>
                    <span class="res-detail-value"><span class="badge badge-${r.status}">${statusLabels[r.status]}</span></span>
                </div>
                <div class="res-detail-item">
                    <span class="res-detail-label">メニュー</span>
                    <span class="res-detail-value">${esc(r.menuName)} ${menu ? formatPrice(menu.price) : ''}</span>
                </div>
                <div class="res-detail-item">
                    <span class="res-detail-label">日時</span>
                    <span class="res-detail-value">${esc(formatDate(r.date))} ${esc(r.startTime)}〜${esc(r.endTime)}</span>
                </div>
                ${r.note ? `<div class="res-detail-item res-detail-full">
                    <span class="res-detail-label">備考</span>
                    <span class="res-detail-value">${esc(r.note)}</span>
                </div>` : ''}
                <div class="res-detail-item">
                    <span class="res-detail-label">予約日</span>
                    <span class="res-detail-value">${r.createdAt ? new Date(r.createdAt).toLocaleString('ja-JP') : '-'}</span>
                </div>
            </div>`;

        // Actions
        const actions = $('res-modal-actions');
        if (r.status === 'booked') {
            actions.innerHTML = `
                <button class="btn-secondary" id="modal-cancel-res" data-id="${r.reservationId}">キャンセル</button>
                <button class="btn-primary" id="modal-complete-res" data-id="${r.reservationId}">来店完了にする</button>`;
            $('modal-complete-res').addEventListener('click', () => {
                changeResStatus(r.reservationId, 'completed');
                $('res-modal').classList.add('hidden');
            });
            $('modal-cancel-res').addEventListener('click', () => {
                if (confirm('この予約をキャンセルしますか？')) {
                    changeResStatus(r.reservationId, 'canceled');
                    $('res-modal').classList.add('hidden');
                }
            });
        } else {
            actions.innerHTML = '<button class="btn-secondary" id="modal-close-btn">閉じる</button>';
            $('modal-close-btn').addEventListener('click', () => $('res-modal').classList.add('hidden'));
        }

        $('res-modal').classList.remove('hidden');
    }

    function changeResStatus(resId, newStatus) {
        const reservations = lsGet(LS.reservations) || [];
        const r = reservations.find(x => x.reservationId === resId);
        if (r) {
            r.status = newStatus;
            if (newStatus === 'canceled') {
                let queue = lsGet(LS.notificationQueue) || [];
                queue = queue.filter(q => q.reservationId !== resId);
                lsSet(LS.notificationQueue, queue);
            }
            lsSet(LS.reservations, reservations);
            renderReservations();
            if (currentPage === 'dashboard') renderDashboard();
        }
    }

    // ── Menus ──
    function renderMenus() {
        const menus = lsGet(LS.menus) || [];
        const grid = $('menu-grid');

        if (menus.length === 0) {
            grid.innerHTML = '<p class="empty-state">メニューがありません</p>';
            return;
        }

        grid.innerHTML = menus.map(m => `
            <div class="menu-card" data-menu-id="${m.id}">
                <div class="menu-card-header">
                    <span class="menu-card-name">${esc(m.name)}</span>
                    ${m.popular ? '<span class="popular-tag">人気</span>' : ''}
                </div>
                <p class="menu-card-desc">${esc(m.description)}</p>
                <div class="menu-card-meta">
                    <span class="menu-card-price">${formatPrice(m.price)}</span>
                    <span class="menu-card-duration">${m.duration}分</span>
                    <div class="menu-card-actions">
                        <button class="btn-sm btn-sm-info" data-action="edit-menu" data-id="${m.id}">編集</button>
                        <button class="btn-sm btn-sm-danger" data-action="delete-menu" data-id="${m.id}">削除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function openMenuModal(menuId) {
        editingMenuId = menuId || null;
        const modal = $('menu-modal');

        if (menuId) {
            const menus = lsGet(LS.menus) || [];
            const m = menus.find(x => x.id === menuId);
            if (!m) return;
            $('menu-modal-title').textContent = 'メニュー編集';
            $('menu-name').value = m.name;
            $('menu-desc').value = m.description;
            $('menu-price').value = m.price;
            $('menu-duration').value = m.duration;
            $('menu-popular').checked = m.popular;
        } else {
            $('menu-modal-title').textContent = 'メニュー追加';
            $('menu-form').reset();
        }

        modal.classList.remove('hidden');
    }

    function saveMenu() {
        const name = $('menu-name').value.trim();
        const desc = $('menu-desc').value.trim();
        const price = parseInt($('menu-price').value) || 0;
        const duration = parseInt($('menu-duration').value) || 60;
        const popular = $('menu-popular').checked;

        if (!name) { alert('メニュー名を入力してください'); return; }
        if (price <= 0) { alert('料金を正しく入力してください'); return; }

        const menus = lsGet(LS.menus) || [];

        if (editingMenuId) {
            const m = menus.find(x => x.id === editingMenuId);
            if (m) {
                m.name = name; m.description = desc; m.price = price;
                m.duration = duration; m.popular = popular;
            }
        } else {
            menus.push({ id: 'm' + uid(), name, description: desc, price, duration, popular });
        }

        lsSet(LS.menus, menus);
        $('menu-modal').classList.add('hidden');
        renderMenus();
    }

    function deleteMenu(menuId) {
        if (!confirm('このメニューを削除しますか？')) return;
        let menus = lsGet(LS.menus) || [];
        menus = menus.filter(m => m.id !== menuId);
        lsSet(LS.menus, menus);
        renderMenus();
    }

    // ── Staffs ──
    function renderStaffs() {
        const staffs = lsGet(LS.staffs) || [];
        const grid = $('staff-grid');

        if (staffs.length === 0) {
            grid.innerHTML = '<p class="empty-state">スタッフがいません</p>';
            return;
        }

        grid.innerHTML = staffs.map(s => `
            <div class="staff-card" data-staff-id="${s.id}">
                <div class="staff-card-header">
                    <img src="${esc(s.image || 'https://i.pravatar.cc/150')}" alt="${esc(s.name)}" class="staff-avatar" loading="lazy">
                    <div class="staff-info">
                        <div class="staff-name">${esc(s.name)}</div>
                        <div class="staff-fee">指名料: ${formatPrice(s.fee)}</div>
                    </div>
                </div>
                <div class="staff-desc">${esc(s.description || '')}</div>
                <div class="staff-actions">
                    <button class="btn-sm btn-sm-info" data-action="edit-staff" data-id="${s.id}">編集</button>
                    <button class="btn-sm btn-sm-danger" data-action="delete-staff" data-id="${s.id}">削除</button>
                </div>
            </div>
        `).join('');
    }

    function openStaffModal(staffId) {
        editingStaffId = staffId || null;
        const modal = $('staff-modal');

        if (staffId) {
            const staffs = lsGet(LS.staffs) || [];
            const s = staffs.find(x => x.id === staffId);
            if (!s) return;
            $('staff-modal-title').textContent = 'スタッフ編集';
            $('staff-name').value = s.name;
            $('staff-image').value = s.image;
            $('staff-fee').value = s.fee;
            $('staff-desc').value = s.description;
        } else {
            $('staff-modal-title').textContent = 'スタッフ追加';
            $('staff-form').reset();
        }

        modal.classList.remove('hidden');
    }

    function saveStaff() {
        const name = $('staff-name').value.trim();
        const image = $('staff-image').value.trim();
        const fee = parseInt($('staff-fee').value) || 0;
        const desc = $('staff-desc').value.trim();

        if (!name) { alert('スタッフ名を入力してください'); return; }

        const staffs = lsGet(LS.staffs) || [];

        if (editingStaffId) {
            const s = staffs.find(x => x.id === editingStaffId);
            if (s) {
                s.name = name; s.image = image; s.fee = fee; s.description = desc;
            }
        } else {
            staffs.push({ id: 's' + uid(), name, image, fee, description: desc });
        }

        lsSet(LS.staffs, staffs);
        $('staff-modal').classList.add('hidden');
        renderStaffs();
    }

    function deleteStaff(staffId) {
        if (!confirm('このスタッフを削除しますか？')) return;
        let staffs = lsGet(LS.staffs) || [];
        staffs = staffs.filter(s => s.id !== staffId);
        lsSet(LS.staffs, staffs);
        renderStaffs();
    }

    // ── Customers ──
    function renderCustomers() {
        const reservations = lsGet(LS.reservations) || [];
        const menus = lsGet(LS.menus) || [];

        // Aggregate by phone number
        const map = {};
        reservations.forEach(r => {
            if (!r.customerPhone) return;
            if (!map[r.customerPhone]) {
                map[r.customerPhone] = {
                    name: r.customerName,
                    phone: r.customerPhone,
                    email: r.customerEmail || '',
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: null
                };
            }
            const c = map[r.customerPhone];
            if (r.status !== 'canceled') {
                c.visits++;
                const menu = menus.find(m => m.id === r.menuId);
                if (menu) c.totalSpent += menu.price;
                if (!c.lastVisit || r.date > c.lastVisit) c.lastVisit = r.date;
            }
            // Update name/email if newer
            if (r.customerName) c.name = r.customerName;
            if (r.customerEmail) c.email = r.customerEmail;
        });

        let customers = Object.values(map).sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));

        if (customerSearch) {
            const q = customerSearch.toLowerCase();
            customers = customers.filter(c =>
                c.name.toLowerCase().includes(q) || c.phone.includes(q)
            );
        }

        const tbody = $('customer-body');
        const empty = $('customer-empty');

        if (customers.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = customers.map(c => `
            <tr class="customer-row" data-phone="${esc(c.phone)}" style="cursor: pointer;">
                <td>${esc(c.name)}</td>
                <td>${esc(c.phone)}</td>
                <td>${esc(c.email || '-')}</td>
                <td>${c.visits}回</td>
                <td>${c.lastVisit ? formatDate(c.lastVisit) : '-'}</td>
                <td>${formatPrice(c.totalSpent)}</td>
            </tr>
        `).join('');
    }

    let currentRecordPhone = null;

    function showCustomerRecord(phone) {
        currentRecordPhone = phone;
        const reservations = lsGet(LS.reservations) || [];
        const menus = lsGet(LS.menus) || [];
        const staffs = lsGet(LS.staffs) || [];
        const notesObj = lsGet(LS.customerNotes) || {};

        // 顧客の全予約を取得
        const customerRes = reservations.filter(r => r.customerPhone === phone);
        if (customerRes.length === 0) return;

        // 最新の情報でヘッダーを構築
        const latest = [...customerRes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        // 統計データ
        const validRes = customerRes.filter(r => r.status !== 'canceled');
        const visits = validRes.length;
        let totalSpent = 0;
        validRes.forEach(r => {
            const menu = menus.find(m => m.id === r.menuId);
            totalSpent += menu ? menu.price : (r.price || 0);
            if (r.staffFee) totalSpent += r.staffFee;
        });

        $('record-customer-name').textContent = latest.customerName || '名称未設定';
        $('record-customer-phone').textContent = phone;
        if (latest.customerEmail) {
            $('record-customer-email').textContent = latest.customerEmail;
            $('record-customer-email-wrap').style.display = 'inline';
        } else {
            $('record-customer-email-wrap').style.display = 'none';
        }
        $('record-visit-count').textContent = visits;
        $('record-total-spent').textContent = formatPrice(totalSpent);

        // メモの復元
        const memoInput = $('record-memo-input');
        memoInput.value = notesObj[phone] || '';
        $('record-memo-saved-msg').classList.add('hidden');

        // 履歴タイムラインの描画
        const historyList = $('record-history-list');
        historyList.innerHTML = '';

        if (customerRes.length === 0) {
            historyList.innerHTML = '<div style="color:var(--text-light);font-size:13px;">来店履歴がありません</div>';
        } else {
            // 日付の降順でソート（新しい順）
            const sortedRes = [...customerRes].sort((a, b) => {
                const da = new Date(a.date + 'T' + a.startTime);
                const db = new Date(b.date + 'T' + b.startTime);
                return db - da;
            });

            sortedRes.forEach(r => {
                const menu = menus.find(m => m.id === r.menuId);
                const menuPrice = menu ? menu.price : (r.price || 0);
                let staffFee = r.staffFee || 0;
                let totalPrice = menuPrice + staffFee;
                let staffName = '指名なし';

                if (r.staffId) {
                    const staff = staffs.find(s => s.id === r.staffId);
                    if (staff) staffName = staff.name;
                }

                const d = new Date(r.date);
                const dateStrLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${DAY_NAMES[d.getDay()]}) ${r.startTime}`;
                const statusClass = r.status === 'canceled' ? 'status-canceled' : '';
                const statusLabel = r.status === 'canceled' ? '<span style="color:var(--danger);font-size:12px;margin-left:8px;">[キャンセル]</span>' : '';

                historyList.innerHTML += `
                    <div class="history-item ${statusClass}">
                        <div class="hi-date">${dateStrLabel}${statusLabel}</div>
                        <div class="hi-menu">メニュー：${esc(r.menuName || '不明なメニュー')}</div>
                        <div class="hi-details">
                            <span>担当：${esc(staffName)}</span>
                            <span>時間：${r.durationMinutes || '-'}分</span>
                        </div>
                        <div class="hi-amount">金額：${formatPrice(totalPrice)}</div>
                    </div>
                `;
            });
        }

        $('customer-record-modal').classList.remove('hidden');
    }

    function saveCustomerNote() {
        if (!currentRecordPhone) return;
        const noteText = $('record-memo-input').value;
        const notesObj = lsGet(LS.customerNotes) || {};
        notesObj[currentRecordPhone] = noteText;
        lsSet(LS.customerNotes, notesObj);

        // 保存完了メッセージの表示アニメーション
        const msg = $('record-memo-saved-msg');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 2000);
    }
    function renderSettings() {
        const shop = lsGet(LS.shopInfo) || {};
        const settings = lsGet(LS.settings) || {};

        $('shop-name').value = shop.name || '';
        $('shop-phone').value = shop.phone || '';
        $('shop-address').value = shop.address || '';
        $('shop-rules').value = shop.rules || '';

        $('s-open').value = settings.openTime || '10:00';
        $('s-close').value = settings.closeTime || '20:00';
        $('s-slot').value = settings.slotMinutes || 30;
        $('s-max-days').value = settings.maxDays || 60;

        qsa('input[name="s-holiday"]').forEach(cb => {
            cb.checked = (settings.holidays || []).includes(parseInt(cb.value));
        });
    }

    function saveSettings() {
        // Shop info
        const shop = lsGet(LS.shopInfo) || {};
        shop.name = $('shop-name').value.trim();
        shop.phone = $('shop-phone').value.trim();
        shop.address = $('shop-address').value.trim();
        shop.rules = $('shop-rules').value.trim();

        // Settings
        const holidays = [];
        qsa('input[name="s-holiday"]:checked').forEach(cb => holidays.push(parseInt(cb.value)));

        const settings = {
            openTime: $('s-open').value,
            closeTime: $('s-close').value,
            holidays,
            slotMinutes: parseInt($('s-slot').value) || 30,
            maxDays: parseInt($('s-max-days').value) || 60
        };

        // Update hours display
        shop.hours = `${settings.openTime}〜${settings.closeTime}`;
        const hn = holidays.map(h => DAY_NAMES[h]).join('・');
        shop.holidays = hn ? `毎週${hn}曜日` : 'なし';

        lsSet(LS.shopInfo, shop);
        lsSet(LS.settings, settings);
        alert('設定を保存しました');
    }

    // ── Sales ──
    function initSalesMonthSelector() {
        const select = $('sales-month-select');
        select.innerHTML = '';
        // 2026-01 〜 2035-12 (10年分)
        for (let y = 2026; y <= 2035; y++) {
            for (let m = 1; m <= 12; m++) {
                const opt = document.createElement('option');
                opt.value = `${y}-${m}`;
                opt.textContent = `${y}年${m}月`;
                if (y === salesYear && m === salesMonth) opt.selected = true;
                select.appendChild(opt);
            }
        }
    }

    function setSalesMonth(year, month) {
        if (year < 2026) { year = 2026; month = 1; }
        if (year > 2035) { year = 2035; month = 12; }
        if (year === 2026 && month < 1) { month = 1; }
        if (year === 2035 && month > 12) { month = 12; }
        salesYear = year;
        salesMonth = month;
        $('sales-month-select').value = `${year}-${month}`;
        renderSales();
    }

    function renderSales() {
        const reservations = lsGet(LS.reservations) || [];
        const menus = lsGet(LS.menus) || [];
        // Only count completed + booked (not canceled)
        const validRes = reservations.filter(r => r.status !== 'canceled');

        // Filter by selected month
        const monthKey = `${salesYear}-${padZero(salesMonth)}`;
        const monthFiltered = validRes.filter(r => r.date.startsWith(monthKey));

        const titles = { daily: '日別売上', weekly: '週別売上', monthly: '月別売上' };
        $('sales-table-title').textContent = `${salesYear}年${salesMonth}月 ${titles[salesPeriod]}`;

        // Group reservations by period
        const groups = {};
        monthFiltered.forEach(r => {
            const menu = menus.find(m => m.id === r.menuId);
            const price = menu ? menu.price : (r.price || 0);
            let key;
            if (salesPeriod === 'daily') {
                key = r.date;
            } else if (salesPeriod === 'weekly') {
                key = getWeekKey(r.date);
            } else {
                key = r.date.substring(0, 7); // YYYY-MM
            }
            if (!groups[key]) groups[key] = { count: 0, revenue: 0 };
            groups[key].count++;
            groups[key].revenue += price;
        });

        // Sort by key descending (newest first)
        const sorted = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));

        // Calculate totals
        let totalRevenue = 0, totalCustomers = 0;
        sorted.forEach(([, v]) => { totalRevenue += v.revenue; totalCustomers += v.count; });
        const avgRevenue = sorted.length > 0 ? Math.round(totalRevenue / sorted.length) : 0;

        // Update KPI cards
        $('sales-total-revenue').textContent = formatPrice(totalRevenue);
        $('sales-total-customers').textContent = totalCustomers + '人';
        $('sales-avg-revenue').textContent = formatPrice(avgRevenue);

        const tbody = $('sales-body');
        const empty = $('sales-empty');

        if (sorted.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        let html = sorted.map(([key, v]) => {
            const label = formatPeriodLabel(key, salesPeriod);
            return `<tr>
                <td>${esc(label)}</td>
                <td>${v.count}人</td>
                <td>${formatPrice(v.revenue)}</td>
            </tr>`;
        }).join('');

        // Add total row
        html += `<tr class="sales-total-row">
            <td>合計</td>
            <td>${totalCustomers}人</td>
            <td>${formatPrice(totalRevenue)}</td>
        </tr>`;

        tbody.innerHTML = html;
    }

    function getWeekKey(dateString) {
        const d = new Date(dateString);
        // Get Monday of the week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        return dateStr(monday);
    }

    function formatPeriodLabel(key, period) {
        if (period === 'daily') {
            return formatDate(key);
        } else if (period === 'weekly') {
            const mon = new Date(key);
            const sun = new Date(mon);
            sun.setDate(sun.getDate() + 6);
            return `${mon.getMonth() + 1}/${mon.getDate()} ‒ ${sun.getMonth() + 1}/${sun.getDate()}`;
        } else {
            const [y, m] = key.split('-');
            return `${y}年${parseInt(m)}月`;
        }
    }

    // ── Events ──
    function bindEvents() {
        // Sidebar nav
        qsa('.nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => navigateTo(btn.dataset.page));
        });

        // Mobile hamburger
        $('btn-hamburger').addEventListener('click', () => {
            $('sidebar').classList.toggle('open');
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', () => {
                    $('sidebar').classList.remove('open');
                    overlay.classList.remove('show');
                });
            }
            overlay.classList.toggle('show');
        });

        // Reservation search & filter
        $('res-search').addEventListener('input', e => { resSearch = e.target.value; renderReservations(); });
        qsa('.pill[data-filter]').forEach(p => {
            p.addEventListener('click', () => {
                qsa('.pill[data-filter]').forEach(x => x.classList.remove('active'));
                p.classList.add('active');
                resFilter = p.dataset.filter;
                renderReservations();
            });
        });

        // Reservation table actions
        $('res-body').addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                if (action === 'complete') {
                    changeResStatus(id, 'completed');
                } else if (action === 'cancel') {
                    if (confirm('この予約をキャンセルしますか？')) changeResStatus(id, 'canceled');
                }
                return;
            }
            // Row click → detail
            const row = e.target.closest('tr[data-res-id]');
            if (row) showResDetail(row.dataset.resId);
        });

        // Reservation modal close
        $('btn-close-res-modal').addEventListener('click', () => $('res-modal').classList.add('hidden'));
        $('res-modal').addEventListener('click', e => { if (e.target === $('res-modal')) $('res-modal').classList.add('hidden'); });

        // Menu management
        $('btn-add-menu').addEventListener('click', () => openMenuModal(null));
        $('btn-close-menu-modal').addEventListener('click', () => $('menu-modal').classList.add('hidden'));
        $('btn-cancel-menu').addEventListener('click', () => $('menu-modal').classList.add('hidden'));
        $('menu-modal').addEventListener('click', e => { if (e.target === $('menu-modal')) $('menu-modal').classList.add('hidden'); });
        $('menu-form').addEventListener('submit', e => { e.preventDefault(); saveMenu(); });

        $('menu-grid').addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'edit-menu') openMenuModal(id);
            else if (action === 'delete-menu') deleteMenu(id);
        });

        // Staff management
        $('btn-add-staff').addEventListener('click', () => openStaffModal(null));
        $('btn-close-staff-modal').addEventListener('click', () => $('staff-modal').classList.add('hidden'));
        $('btn-cancel-staff').addEventListener('click', () => $('staff-modal').classList.add('hidden'));
        $('staff-modal').addEventListener('click', e => { if (e.target === $('staff-modal')) $('staff-modal').classList.add('hidden'); });
        $('staff-form').addEventListener('submit', e => { e.preventDefault(); saveStaff(); });

        $('staff-grid').addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'edit-staff') openStaffModal(id);
            else if (action === 'delete-staff') deleteStaff(id);
        });

        // Customer search & record
        $('customer-search').addEventListener('input', e => { customerSearch = e.target.value; renderCustomers(); });

        $('customer-body').addEventListener('click', e => {
            const row = e.target.closest('.customer-row');
            if (row && row.dataset.phone) {
                showCustomerRecord(row.dataset.phone);
            }
        });

        $('btn-close-record-modal').addEventListener('click', () => $('customer-record-modal').classList.add('hidden'));
        $('customer-record-modal').addEventListener('click', e => { if (e.target === $('customer-record-modal')) $('customer-record-modal').classList.add('hidden'); });
        $('btn-save-record-memo').addEventListener('click', saveCustomerNote);

        // Settings save
        $('btn-save-settings').addEventListener('click', saveSettings);

        // Sales period filter
        qsa('#sales-period-pills .pill').forEach(p => {
            p.addEventListener('click', () => {
                qsa('#sales-period-pills .pill').forEach(x => x.classList.remove('active'));
                p.classList.add('active');
                salesPeriod = p.dataset.period;
                renderSales();
            });
        });

        // Sales month navigation
        $('sales-prev-month').addEventListener('click', () => {
            let m = salesMonth - 1;
            let y = salesYear;
            if (m < 1) { m = 12; y--; }
            setSalesMonth(y, m);
        });

        $('sales-next-month').addEventListener('click', () => {
            let m = salesMonth + 1;
            let y = salesYear;
            if (m > 12) { m = 1; y++; }
            setSalesMonth(y, m);
        });

        $('sales-month-select').addEventListener('change', e => {
            const [y, m] = e.target.value.split('-').map(Number);
            salesYear = y;
            salesMonth = m;
            renderSales();
        });

        // Dashboard upcoming table row click
        $('dashboard-upcoming-body').addEventListener('click', e => {
            const row = e.target.closest('tr[data-res-id]');
            if (row) showResDetail(row.dataset.resId);
        });
    }

    // ── Boot ──
    function boot() {
        initSalesMonthSelector();
        bindEvents();
        navigateTo('dashboard');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
