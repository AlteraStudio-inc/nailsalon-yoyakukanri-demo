// CSS Addition
const fs = require('fs');
let css = fs.readFileSync('lp.css', 'utf8');

if (!css.includes('.comparison-table')) {
    const newCss = `
/* ================================
   11. Added Content (Mobile Admin, Comparison, FAQ)
   ================================ */

/* --- Mobile Admin Showcase --- */
.mobile-admin-showcase {
    padding: 80px 0;
    background: #FFF0F2;
}
.showcase-inner {
    display: flex;
    align-items: center;
    gap: 60px;
}
.showcase-text {
    flex: 1;
}
.showcase-visual {
    flex: 1;
    display: flex;
    justify-content: center;
}
.showcase-mobile-mockup {
    width: 260px;
    height: 520px;
    background: var(--bg-gray);
    border-radius: 32px;
    box-shadow: var(--shadow-lg);
    border: 8px solid #333;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}
.mock-admin-header {
    background: #2C2C2C;
    color: #fff;
    padding: 16px;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
}
.mock-admin-body {
    padding: 16px;
    flex: 1;
    overflow-y: hidden;
}
.mock-kpi-card {
    background: #fff;
    padding: 12px;
    border-radius: var(--radius-sm);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    margin-bottom: 12px;
    border-left: 4px solid var(--primary);
}
.mock-kpi-title { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
.mock-kpi-val { font-size: 18px; font-weight: 700; color: var(--text-heading); }
.mock-list-item {
    background: #fff;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
}

/* --- Comparison Table --- */
.comparison {
    padding: 100px 0;
    background: var(--bg-white);
}
.comp-table-wrap {
    overflow-x: auto;
    background: #fff;
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    margin: 40px auto 0;
}
.comparison-table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    text-align: center;
}
.comparison-table th, .comparison-table td {
    padding: 16px;
    border: 1px solid var(--border);
    vertical-align: middle;
}
.comparison-table th {
    background: var(--bg-gray);
    font-weight: 700;
    color: var(--text-heading);
}
.comparison-table .col-our {
    background: #FFF5F6;
    border: 2px solid var(--cta);
    position: relative;
}
.comparison-table th.col-our {
    color: var(--cta);
    font-size: 18px;
    border-bottom: none;
}
.comparison-table td.col-our {
    border-top: none;
    border-bottom: 2px solid var(--cta);
}
.comparison-table tr:not(:last-child) td.col-our {
    border-bottom: 1px solid var(--border);
}

.comp-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--cta);
    color: #fff;
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 700;
    white-space: nowrap;
}
.mark-o { color: var(--cta); font-weight: 900; font-size: 20px; }
.mark-x { color: var(--text-muted); font-size: 16px; }
.mark-tri { color: #f5a623; font-weight: 700; font-size: 18px; }

/* --- Microcopies --- */
.microcopy {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 12px;
    display: inline-block;
}

@media (max-width: 768px) {
    .showcase-inner { flex-direction: column; text-align: center; }
}
`;
    fs.appendFileSync('lp.css', newCss);
    console.log('Appended new CSS styles to lp.css');
}

// HTML Addition
let html = fs.readFileSync('lp.html', 'utf8');

// 1. スマホ完結の管理画面アピール (機能紹介の末尾に追加)
const mobileAdminSection = `
            <!-- 機能4: スマホ管理画面 -->
            <div class="feature-row reverse" style="margin-top: 100px;">
                <div class="feature-content">
                    <span class="feature-number">04</span>
                    <h3 class="feature-title">パソコン不要。<br>スマホ1台で完結する管理画面</h3>
                    <p class="feature-desc">毎日の売上確認や、お客様のカルテチェックもすべて手元のスマートフォンから。直感的な操作で、機械が苦手な方でもすぐに使いこなせます。</p>
                    <ul class="feature-checks">
                        <li><span class="check">✓</span>出先からでも当日の予約状況をチェック</li>
                        <li><span class="check">✓</span>カルテのメモ作成や編集もスマホでサクサク</li>
                    </ul>
                </div>
                <div class="feature-image">
                    <div class="showcase-visual">
                        <div class="showcase-mobile-mockup">
                            <div class="mock-admin-header">
                                <span>Beauty Reserve</span>
                                <span>≡</span>
                            </div>
                            <div class="mock-admin-body">
                                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text-heading);">ダッシュボード</h4>
                                <div style="display: flex; gap: 8px;">
                                    <div class="mock-kpi-card" style="flex: 1;">
                                        <div class="mock-kpi-title">本日の予約</div>
                                        <div class="mock-kpi-val">3<span style="font-size:11px;font-weight:normal;color:#999;">件</span></div>
                                    </div>
                                    <div class="mock-kpi-card" style="flex: 1;">
                                        <div class="mock-kpi-title">売上見込</div>
                                        <div class="mock-kpi-val"><span style="font-size:11px;font-weight:normal;">¥</span>19k</div>
                                    </div>
                                </div>
                                <h4 style="font-size: 13px; margin: 16px 0 8px; color: var(--text-muted);">直近の予約</h4>
                                <div class="mock-list-item">
                                    <div><strong>10:00</strong><br><span style="color:#666;">田中 美咲 様</span></div>
                                    <div style="text-align:right;"><span style="color:var(--cta); font-weight:bold;">¥6,600</span><br><span style="color:#aaa;">未来店</span></div>
                                </div>
                                <div class="mock-list-item">
                                    <div><strong>13:00</strong><br><span style="color:#666;">佐藤 愛 様</span></div>
                                    <div style="text-align:right;"><span style="color:var(--cta); font-weight:bold;">¥8,800</span><br><span style="color:#aaa;">未来店</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

// 既存の機能紹介(03)の直後に入れる
if (!html.includes('機能4: スマホ管理画面')) {
    html = html.replace('<!-- ==================== -->\r\n    <!-- ⑤ 利用の流れ          -->', mobileAdminSection + '\r\n\r\n    <!-- ==================== -->\r\n    <!-- ⑤ 利用の流れ          -->');
    html = html.replace('<!-- ==================== -->\n    <!-- ⑤ 利用の流れ          -->', mobileAdminSection + '\n\n    <!-- ==================== -->\n    <!-- ⑤ 利用の流れ          -->');
}

// 2. 比較表の追加 (導入効果セクションの前に入れる)
const compTable = `
    <!-- ==================== -->
    <!-- ⭐ 比較表セクション      -->
    <!-- ==================== -->
    <section class="comparison" id="comparison">
        <div class="container">
            <h2 class="section-title">予約管理、どうしていますか？</h2>
            <p style="text-align:center; margin-bottom:40px; color:var(--text-body);">
                Beauty Reserveは「紙の手間」と「ポータルサイトの高コスト」の課題を同時に解決します。
            </p>
            <div class="comp-table-wrap">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th style="width: 20%; background: #fff; border:none;"></th>
                            <th style="width: 20%;">紙の台帳</th>
                            <th style="width: 20%;">LINE予約</th>
                            <th style="width: 20%;">大手ポータルサイト</th>
                            <th style="width: 20%;" class="col-our">
                                <div class="comp-badge">おすすめ!</div>
                                Beauty Reserve
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>自動受付・空枠判定</th>
                            <td><span class="mark-x">×</span><br><small style="color:#999;">電話・返信が必要</small></td>
                            <td><span class="mark-x">×</span><br><small style="color:#999;">手動での調整が必要</small></td>
                            <td><span class="mark-o">○</span></td>
                            <td class="col-our"><span class="mark-o">◎</span><br><small style="color:var(--text-heading);font-weight:bold">24時間自動</small></td>
                        </tr>
                        <tr>
                            <th>固定費・手数料</th>
                            <td><span class="mark-o">○</span><br><small style="color:#999;">無料</small></td>
                            <td><span class="mark-o">○</span><br><small style="color:#999;">無料</small></td>
                            <td><span class="mark-x">×</span><br><small style="color:#999;">高額な掲載料・手数料</small></td>
                            <td class="col-our"><span class="mark-o">◎</span><br><small style="color:var(--text-heading);font-weight:bold">0円</small></td>
                        </tr>
                        <tr>
                            <th>顧客カルテの連動</th>
                            <td><span class="mark-tri">△</span><br><small style="color:#999;">探すのが大変</small></td>
                            <td><span class="mark-x">×</span><br><small style="color:#999;">トーク履歴を遡るのみ</small></td>
                            <td><span class="mark-tri">△</span><br><small style="color:#999;">サイト側の仕様に依存</small></td>
                            <td class="col-our"><span class="mark-o">◎</span><br><small style="color:var(--text-heading);font-weight:bold">予約履歴と自動連携</small></td>
                        </tr>
                        <tr>
                            <th>リピーター専用設計</th>
                            <td><span class="mark-x">×</span></td>
                            <td><span class="mark-tri">△</span></td>
                            <td><span class="mark-x">×</span><br><small style="color:#999;">他店へ流出するリスク</small></td>
                            <td class="col-our"><span class="mark-o">◎</span><br><small style="color:var(--text-heading);font-weight:bold">自店だけの専用環境</small></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
`;

if (!html.includes('予約管理、どうしていますか？')) {
    html = html.replace('<!-- ==================== -->\r\n    <!-- ⑥ 導入効果・お客様の声 -->', compTable + '\r\n\r\n    <!-- ==================== -->\r\n    <!-- ⑥ 導入効果・お客様の声 -->');
    html = html.replace('<!-- ==================== -->\n    <!-- ⑥ 導入効果・お客様の声 -->', compTable + '\n\n    <!-- ==================== -->\n    <!-- ⑥ 導入効果・お客様の声 -->');
}

// 3. FAQの拡充
const newFaqItem1 = `
                <details class="faq-item">
                    <summary class="faq-q">データは安全に保存されますか？</summary>
                    <div class="faq-a">はい。すべての顧客データーは安全なクラウド環境に保管されます。スマホやPCが壊れてもデータが消えることはありません。</div>
                </details>`;
const newFaqItem2 = `
                <details class="faq-item">
                    <summary class="faq-q">お客様に専用アプリをインストールしてもらう必要はありますか？</summary>
                    <div class="faq-a">いいえ、不要です。Webブラウザ（SafariやChromeなど）上で動作するため、InstagramやLINEのプロフィールにURLを貼り付けるだけで、お客様はスムーズに予約画面へアクセスできます。</div>
                </details>`;

if (!html.includes('データは安全に保存されますか？')) {
    html = html.replace('</div>\r\n        </div>\r\n    </section>\r\n\r\n    <!-- ==================== -->\r\n    <!-- ⑨ 最終CTA', newFaqItem1 + newFaqItem2 + '\r\n            </div>\r\n        </div>\r\n    </section>\r\n\r\n    <!-- ==================== -->\r\n    <!-- ⑨ 最終CTA');

    // fallback for \n
    html = html.replace('</div>\n        </div>\n    </section>\n\n    <!-- ==================== -->\n    <!-- ⑨ 最終CTA', newFaqItem1 + newFaqItem2 + '\n            </div>\n        </div>\n    </section>\n\n    <!-- ==================== -->\n    <!-- ⑨ 最終CTA');
}

// 4. マイクロコピー
html = html.replace(
    '<a href="index.html" class="btn btn-white-cta btn-lg">デモを体験する →</a>',
    '<a href="admin.html" class="btn btn-white-cta btn-lg">デモを体験する →</a><br><span class="microcopy" style="color: rgba(255,255,255,0.8); margin-top:16px; font-weight: 500;">※ メールアドレス等の面倒な登録は一切不要です。<br>ボタンを押すだけですぐに操作をお試しいただけます。</span>'
);

html = html.replace(
    '<p class="final-cta-sub">登録不要、30秒でデモ画面を体験できます。</p>',
    '<p class="final-cta-sub">システムの使いやすさを、今すぐ体感してください。</p>'
);

fs.writeFileSync('lp.html', html);
console.log('Appended structural additions to lp.html');
