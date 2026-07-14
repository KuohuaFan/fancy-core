/* ============================================================
   外掛：期限/時效計算器（純確定性、零 AI）
   體現「該用計算而非模型」——期日、上訴期間、消滅時效是確定性日期運算，
   不交給 LLM（避免幻覺）。使用者選期間與計算規則，工具透明地做算術。
   停用：移除 index.html 裡本檔的 <script>，或刪本檔。
   ============================================================ */
Fancy.ready(function () {
  Fancy.registerIcon("i-calc", '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h4M8 15h2M12 15h4"/>');

  // ---- 確定性日期運算 ----
  function parseD(v) { return new Date(v + "T00:00:00"); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) { var x = new Date(d); var day = x.getDate(); x.setMonth(x.getMonth() + n); if (x.getDate() < day) x.setDate(0); return x; } // 無相當日→該月末日
  function nextWorkday(d) { var x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; }
  function fmt(d) { var w = "日一二三四五六"[d.getDay()]; return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "（週" + w + "）"; }

  Fancy.registerPage({
    id: "deadline", label: "期限計算器", icon: "i-calc", perm: null, order: 13.1,
    view: function () {
      return `
      <div class="section-h"><h2 class="t">期限計算器</h2><span class="pill on">確定性・無 AI</span></div>
      <p style="font-size:13px;color:var(--gray);margin:0 0 16px;line-height:1.6">期日與時效為確定性運算，本工具透明計算，不用 AI。<b>期間種類與末日認定仍請依個案與現行法覆核</b>；國定假日順延請另行確認。</p>

      <div class="card pad" style="margin-bottom:16px">
        <div class="card-h" style="margin:-4px -4px 12px;border:none;padding:0;font-size:15px">一、期間到期日</div>
        ${Fancy.field("dcStart", "起算日（如判決送達日）", 'type="date"')}
        <div class="field"><label>期間</label>
          <div style="display:flex;gap:8px">
            <input id="dcNum" type="number" min="1" value="20" style="flex:1;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;outline:none">
            <select id="dcUnit" style="width:88px;padding:10px;border:1.5px solid var(--line);border-radius:10px"><option>日</option><option>月</option><option>年</option></select>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
            <button class="tab" onclick="__dcSet(20)">民事上訴 20日</button>
            <button class="tab" onclick="__dcSet(20)">刑事上訴 20日</button>
            <button class="tab" onclick="__dcSet(10)">抗告 10日</button>
            <button class="tab" onclick="__dcSet(14)">14日</button>
            <button class="tab" onclick="__dcSet(30)">30日</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin:6px 0 14px;font-size:13.5px">
          <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="dcNoFirst" checked> 始日不算入（翌日起算・民法§120 II）</label>
          <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="dcRoll" checked> 末日遇六日／例假順延（民法§122）</label>
        </div>
        <button class="btn" style="width:100%" onclick="__dcCalc()"><svg class="ic" viewBox="0 0 24 24"><use href="#i-calc"/></svg>計算到期日</button>
        <div id="dcResult" style="margin-top:14px"></div>
      </div>

      <div class="card pad">
        <div class="card-h" style="margin:-4px -4px 12px;border:none;padding:0;font-size:15px">二、消滅時效屆滿</div>
        ${Fancy.field("slStart", "起算日（請求權可行使時・民法§128）", 'type="date"')}
        <div class="field"><label>時效期間</label>
          <select id="slPreset" style="width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px">
            <option value="15">一般請求權 15 年（§125）</option>
            <option value="5">定期給付（利息/租金等）5 年（§126）</option>
            <option value="2">短期 2 年（§127：律師報酬、承攬報酬、商品代價等）</option>
            <option value="2">侵權損害賠償 2 年（自知悉・§197 I）</option>
            <option value="10">侵權損害賠償 10 年（自行為時・§197 I）</option>
            <option value="custom">自訂（年）</option>
          </select>
        </div>
        <div class="field" id="slCustomWrap" style="display:none"><label>自訂年數</label><input id="slCustom" type="number" min="1" value="3" style="width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;outline:none"></div>
        <button class="btn" style="width:100%" onclick="__slCalc()"><svg class="ic" viewBox="0 0 24 24"><use href="#i-calc"/></svg>計算屆滿日</button>
        <div id="slResult" style="margin-top:14px"></div>
      </div>`;
    }
  });

  // ---- 處理器 ----
  window.__dcSet = function (n) { document.getElementById("dcNum").value = n; document.getElementById("dcUnit").value = "日"; };

  window.__dcCalc = function () {
    var sv = document.getElementById("dcStart").value;
    if (!sv) { Fancy.toast("請選起算日"); return; }
    var n = parseInt(document.getElementById("dcNum").value, 10);
    if (!n || n < 1) { Fancy.toast("請輸入期間"); return; }
    var unit = document.getElementById("dcUnit").value;
    var noFirst = document.getElementById("dcNoFirst").checked;
    var roll = document.getElementById("dcRoll").checked;
    var start = parseD(sv), due, note;

    if (unit === "日") {
      due = addDays(start, noFirst ? n : n - 1);
      note = "起算日 " + fmt(start) + "，" + (noFirst ? "始日不算入、翌日起算（§120 II）" : "始日算入、當日起算") + "，計 " + n + " 日。";
    } else {
      var months = unit === "年" ? n * 12 : n;
      var corr = addMonths(start, months);               // 相當日
      due = corr;
      var prev = addDays(corr, -1);                       // §121 II：相當日之前一日
      note = "起算日 " + fmt(start) + "，計 " + n + " " + unit + "。相當日 " + fmt(corr) + "；依民法§121 II，期間末日為<b>相當日之前一日</b>＝ " + fmt(prev) + "（是否適用§120始日認定請個案確認）。";
    }
    var rolled = false;
    if (roll) { var nd = nextWorkday(due); if (nd.getTime() !== due.getTime()) { due = nd; rolled = true; } }

    document.getElementById("dcResult").innerHTML =
      '<div class="card pad" style="background:#fff">'
      + '<div style="font-size:12.5px;color:var(--gray);font-weight:700">到期日</div>'
      + '<div style="font-family:var(--serif);font-weight:900;font-size:26px;margin:4px 0 8px;color:var(--wine)">' + fmt(due) + '</div>'
      + '<div style="font-size:12.5px;color:var(--gray);line-height:1.7">' + note
      + (rolled ? '<br>末日為例假，已依§122順延至次一工作日（<b>國定假日請另行確認</b>）。' : '')
      + '<br>※ 本計算為輔助，實際期間種類與末日仍請覆核。</div></div>';
  };

  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "slPreset") {
      document.getElementById("slCustomWrap").style.display = e.target.value === "custom" ? "block" : "none";
    }
  });

  window.__slCalc = function () {
    var sv = document.getElementById("slStart").value;
    if (!sv) { Fancy.toast("請選起算日"); return; }
    var pv = document.getElementById("slPreset").value;
    var years = pv === "custom" ? parseInt(document.getElementById("slCustom").value, 10) : parseInt(pv, 10);
    if (!years || years < 1) { Fancy.toast("請輸入年數"); return; }
    var start = parseD(sv);
    var corr = addMonths(start, years * 12);
    var prev = addDays(corr, -1);
    document.getElementById("slResult").innerHTML =
      '<div class="card pad" style="background:#fff">'
      + '<div style="font-size:12.5px;color:var(--gray);font-weight:700">時效屆滿（相當日）</div>'
      + '<div style="font-family:var(--serif);font-weight:900;font-size:26px;margin:4px 0 8px;color:var(--wine)">' + fmt(corr) + '</div>'
      + '<div style="font-size:12.5px;color:var(--gray);line-height:1.7">起算日 ' + fmt(start) + '，時效 ' + years + ' 年。'
      + '依民法§120-122，末日認定（相當日之前一日 ' + fmt(prev) + '、例假順延）與是否有中斷／不完成事由，請個案確認。侵權 2 年與 10 年起算點不同（知悉／行為時），請以對應起算日分別計算。</div></div>';
  };
});
