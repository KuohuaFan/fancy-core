/* ============================================================
   範例外掛：備忘錄（Notes）
   示範如何用 Fancy API 新增一個完整功能頁——完全不改核心 index.html。
   停用：刪掉 index.html 裡本檔的 <script>，或直接刪本檔。
   複製本檔即可做你自己的功能頁。
   ============================================================ */
Fancy.ready(function () {
  // 1) 自訂圖示（也可沿用核心既有圖示，如 i-doc）
  Fancy.registerIcon("i-memo", '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>');

  // 資料存在 Fancy.state（與核心共用同一持久層，會自動存到本裝置）
  function notes() { var s = Fancy.state; s.plugin_notes = s.plugin_notes || []; return s.plugin_notes; }

  // 2) 註冊頁面：加一個選單項 + 路由 + 畫面，一次搞定
  Fancy.registerPage({
    id: "notes",
    label: "備忘錄",
    icon: "i-memo",
    perm: null,        // 若要受分層權限控管，填一個權限名（會自動加進權限矩陣）
    order: 13.2,       // 選單位置（介於「更多功能」10 與「設定」11 之間）
    view: function () {
      var list = notes();
      var rows = list.length ? list.map(function (n) {
        return '<div class="list-row">'
          + '<div class="li"><svg class="ic" viewBox="0 0 24 24"><use href="#i-memo"/></svg></div>'
          + '<div class="body"><div class="t">' + Fancy.esc(n.title) + '</div>'
          + '<div class="m">' + Fancy.esc(n.body || "") + '</div></div>'
          + '<button class="icon-btn" onclick="__notesDel(\'' + n.id + '\')">'
          + '<svg class="ic" viewBox="0 0 24 24"><use href="#i-trash"/></svg></button>'
          + '</div>';
      }).join("")
        : '<div class="empty"><svg class="ic" viewBox="0 0 24 24"><use href="#i-memo"/></svg>'
          + '<p>還沒有備忘</p><span>按右上角新增</span></div>';
      return '<div class="section-h"><h2 class="t">備忘錄</h2>'
        + '<button class="btn" onclick="__notesAdd()"><svg class="ic" viewBox="0 0 24 24"><use href="#i-plus"/></svg>新增備忘</button></div>'
        + '<p style="font-size:13px;color:var(--gray);margin:0 0 16px;line-height:1.6">'
        + '這一頁由外掛 <b>plugins/example-notes.js</b> 新增，核心 index.html 未改動——升級核心不影響它。</p>'
        + '<div class="card">' + rows + '</div>';
    }
  });

  // 3) 事件處理器（供上面 onclick 呼叫；掛在 window 供全域存取）
  window.__notesAdd = function () {
    Fancy.modal("新增備忘",
      Fancy.field("noteTitle", "標題", 'placeholder="如：庭期提醒"')
      + '<div class="field"><label>內容</label>'
      + '<textarea id="noteBody" rows="3" style="width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;outline:none;resize:vertical"></textarea></div>'
      + '<div class="row"><button class="btn ghost" style="flex:1" onclick="this.closest(\'.modal-bg\').remove()">取消</button>'
      + '<button class="btn" style="flex:1" onclick="__notesSave(this)">儲存</button></div>');
  };
  window.__notesSave = async function (btn) {
    var t = document.getElementById("noteTitle").value.trim();
    if (!t) { Fancy.toast("請輸入標題"); return; }
    var b = document.getElementById("noteBody").value.trim();
    notes().unshift({ id: "n" + Date.now(), title: t, body: b });
    await Fancy.persist();
    btn.closest(".modal-bg").remove();
    Fancy.render();
    Fancy.toast("已新增備忘");
  };
  window.__notesDel = async function (id) {
    var s = Fancy.state;
    s.plugin_notes = (s.plugin_notes || []).filter(function (n) { return n.id !== id; });
    await Fancy.persist();
    Fancy.render();
    Fancy.toast("已刪除");
  };
});
