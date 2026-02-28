const fs = require('fs');
let html = fs.readFileSync('lp.html', 'utf8');

// 1. Text Insertions
html = html.replace(
    '<p class=\"hero-sub\">24時間自動受付 × 顧客管理の一元化で、<br>小規模サロンの\"1人運営\"をまるごとサポートします。</p>',
    '<p class=\"hero-sub\">24時間自動受付 × 顧客管理の一元化で<br>サロンの「手間削減」と「利益改善」を強力にバックアップします。</p>'
);

html = html.replace(
    '<p class=\"feature-desc\">既存顧客は顧客管理システムと連携した専用導線から予約。名前や連絡先の再入力が不要で、お客様の負担を最小限に。\"また来たい\"を\"また来る\"に変えます。\n                    </p>',
    '<p class=\"feature-desc\">既存顧客の予約導線を分けることで、再来店時の予約負担を軽減し、スムーズな予約体験を実現します。<br>既存顧客の予約は、顧客管理システムと連携した専用導線から行うことで、スムーズな再予約と顧客情報の一元管理を実現します。</p>'
);
// Also accommodate \r\n format just in case
html = html.replace(
    '<p class=\"feature-desc\">既存顧客は顧客管理システムと連携した専用導線から予約。名前や連絡先の再入力が不要で、お客様の負担を最小限に。\"また来たい\"を\"また来る\"に変えます。\r\n                    </p>',
    '<p class=\"feature-desc\">既存顧客の予約導線を分けることで、再来店時の予約負担を軽減し、スムーズな予約体験を実現します。<br>既存顧客の予約は、顧客管理システムと連携した専用導線から行うことで、スムーズな再予約と顧客情報の一元管理を実現します。</p>'
);

// 2. Icon replacements (Problems)
const iconPhone = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--cta)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
const iconBook = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
const iconRepeat = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#50E3C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
const iconMoon = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

html = html.replace('<div class="problem-icon">📞</div>', `<div class="problem-icon">${iconPhone}</div>`);
html = html.replace('<div class="problem-icon"></div>', `<div class="problem-icon">${iconBook}</div>`);
html = html.replace('<div class="problem-icon">🔁</div>', `<div class="problem-icon">${iconRepeat}</div>`);
html = html.replace('<div class="problem-icon">🌙</div>', `<div class="problem-icon">${iconMoon}</div>`);

// 3. Icon replacements (Flows)
const iconMemo = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cta)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconGear = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
const iconParty = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

html = html.replace('<div class="step-icon">📝</div>', `<div class="step-icon">${iconMemo}</div>`);
html = html.replace('<div class="step-icon">⚙️</div>', `<div class="step-icon">${iconGear}</div>`);
html = html.replace('<div class="step-icon">🎉</div>', `<div class="step-icon">${iconParty}</div>`);

// 4. Pricing Area
const startStr = '<!-- ==================== -->\r\n    <!-- ⑦ 料金プラン          -->\r\n    <!-- ==================== -->\r\n    <section class="pricing" id="pricing">';
const backupStartStr = '<!-- ==================== -->\n    <!-- ⑦ 料金プラン          -->\n    <!-- ==================== -->\n    <section class="pricing" id="pricing">';
const endStr = '</section>';

let startIndex = html.indexOf(startStr);
if (startIndex === -1) {
    startIndex = html.indexOf(backupStartStr);
}

if (startIndex !== -1) {
    let temp = html.slice(startIndex);
    let endIndex = startIndex + temp.indexOf(endStr) + endStr.length;
    
    const newPricing = `<!-- ==================== -->
    <!-- ⑦ 料金プラン          -->
    <!-- ==================== -->
    <section class="pricing" id="pricing">
        <div class="container" style="text-align: center;">
            <h2 class="section-title">お問い合わせ</h2>
            <div class="pricing-simple" style="margin-bottom: 40px;">
                <h3 style="font-size: 24px; color: var(--cta); margin-bottom: 16px;">手数料、初期費用、サポート費用無料</h3>
                <p style="font-size: 16px; color: var(--text-body); line-height: 1.8;">
                    複雑な料金体系はありません。すべての機能をシンプルにご利用いただけます。<br>
                    まずはデモ画面をお試しいただくか、お気軽にお問い合わせください。
                </p>
            </div>
            <a href="mailto:info@example.com" class="btn btn-cta btn-lg" style="font-size: 18px;">いますぐ問い合わせる</a>
        </div>
    </section>`;
    
    html = html.slice(0, startIndex) + newPricing + html.slice(endIndex);
} else {
    console.log('Could not find pricing section.');
}

fs.writeFileSync('lp.html', html);
console.log('lp.html successfully updated.');
