/* ============================================================
   外掛：利益衝突檢查（純確定性、零 AI；讀取核心既有案件資料）
   受任前，把擬受任之當事人／對造，比對現有案件的委任人與對造，
   找出潛在利益衝突。示範外掛如何運用核心 Fancy.state 的資料。
   別名、關係企業、控制關係等仍需人工審查。
   ============================================================ */
Fancy.ready(function () {
  Fancy.registerIcon("i-conflict", '<path d="M12 3l9 17H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>');

  function norm(s) { return (s || "").replace(/\s+/g, ""); }
  function match(a, b) { a = norm(a); b = norm(b); if (!a || !b || a === "—" || b === "—") return false; return a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0; }

  Fancy.registerPage({
    id: "conflict", label: "利益衝突檢查", icon: "i-conflict", perm: null, order: 13.3,
    view: function () {
      var n = (Fancy.state.cases || []).length;
      return `
      <div class="section-h"><h2 class="t">利益衝突檢查</h2><span class="pill on">確定性・無 AI</span></div>
      <p style="font-size:13px;color:var(--gray);margin:0 0 16px;line-height:1.6">受任前比對擬受任之當事人／對造與現有 ${n} 件案件的委任人及對造。純比對本機資料，不用 AI；<b>別名、關係企業、控制關係請另行人工審查</b>。</p>
      <div class="card pad">
        ${Fancy.field("cfClient", "擬受任之當事人", 'placeholder="委任人姓名／公司"')}
        ${Fancy.field("cfOpp", "其對造（選填）", 'placeholder="對造姓名／公司"')}
        <button class="btn" style="width:100%" onclick="__cfCheck()"><svg class="ic" viewBox="0 0 24 24"><use href="#i-conflict"/></svg>執行衝突檢查</button>
        <div id="cfResult" style="margin-top:14px"></div>
      </div>`;
    }
  });

  window.__cfCheck = function () {
    var client = (document.getElementById("cfClient").value || "").trim();
    var opp = (document.getElementById("cfOpp").value || "").trim();
    if (!client) { Fancy.toast("請輸入擬受任之當事人"); return; }
    var cases = Fancy.state.cases || [];
    var hits = [];

    cases.forEach(function (c) {
      // 高：擬受任之對造 ＝ 既有委任人 → 恐對抗自己客戶
      if (opp && match(opp, c.client))
        hits.push({ lv: "high", t: '擬受任對造「' + opp + '」與既有委任人「' + c.client + '」相符 → 恐對抗自己客戶', c: c });
      // 高：擬受任之當事人 ＝ 既有對造 → 曾/正站在其對立面
      if (match(client, c.opponent))
        hits.push({ lv: "high", t: '擬受任當事人「' + client + '」與既有案件之對造「' + c.opponent + '」相符 → 曾／正處於其對立面', c: c });
      // 提示：擬受任之當事人 ＝ 既有委任人 → 既有客戶（通常非衝突）
      if (match(client, c.client))
        hits.push({ lv: "info", t: '擬受任當事人「' + client + '」為既有委任人 → 關聯案件（通常非衝突）', c: c });
      // 提示：對造相同
      if (opp && match(opp, c.opponent))
        hits.push({ lv: "mid", t: '對造「' + opp + '」與既有案件之對造相符 → 可能為系列／關聯案件', c: c });
    });

    var box = document.getElementById("cfResult");
    if (!hits.length) {
      box.innerHTML = '<div class="card pad" style="background:#E4F1E9;border-color:#B9DCC8">'
        + '<div style="font-weight:700;color:var(--ok);font-size:14.5px">✓ 未發現明顯衝突</div>'
        + '<div style="font-size:12px;color:var(--gray);margin-top:6px;line-height:1.6">僅就本機案件之姓名比對；別名、關係企業、控制關係與過往已結案件仍請人工審查。</div></div>';
      return;
    }
    var order = { high: 0, mid: 1, info: 2 };
    hits.sort(function (a, b) { return order[a.lv] - order[b.lv]; });
    var pill = { high: '<span class="pill late">高度衝突</span>', mid: '<span class="pill hold">注意</span>', info: '<span class="pill tag">提示</span>' };
    var high = hits.filter(function (h) { return h.lv === "high"; }).length;

    box.innerHTML =
      (high ? '<div class="card pad" style="background:#FBE0DA;border-color:#EBC3B7;margin-bottom:12px"><div style="font-weight:700;color:var(--warn)">⚠ 發現 ' + high + ' 項高度衝突，受任前請審慎評估／利益迴避</div></div>' : '')
      + '<div class="card">' + hits.map(function (h) {
        return '<div class="list-row"><div class="li" style="background:' + (h.lv === "high" ? "#FBE0DA" : "#EFE9DB") + '"><svg class="ic" viewBox="0 0 24 24"><use href="#i-conflict"/></svg></div>'
          + '<div class="body"><div class="t" style="font-size:14px">' + Fancy.esc(h.t) + '</div>'
          + '<div class="m">' + pill[h.lv] + ' 案件：' + Fancy.esc(h.c.title) + '</div></div></div>';
      }).join("") + '</div>'
      + '<p style="font-size:11.5px;color:var(--gray);margin-top:10px;line-height:1.6">比對僅及於姓名字串與本機在辦案件；最終利益衝突判斷與迴避義務，依律師倫理規範與個案認定。</p>';
  };
});
