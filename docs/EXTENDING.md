# EXTENDING.md — 如何增刪功能（開發者指南）

Fancy 為 Apache-2.0 授權，下載後可自由修改、增刪功能。本文說明**實際的擴充點**與**改動時如何不破壞升級能力**。

---

## 零、推薦做法：外掛系統（不改核心，升級不分岔）

前端現在內建外掛機制。**新功能不必改 `index.html`**——寫在 `public/standalone/plugins/*.js`，呼叫核心暴露的 `window.Fancy` API 註冊即可。升級核心（換 `index.html`）時，你的 `plugins/` 資料夾原封不動，git 也不會衝突。這是**首選路徑**，尤其適合你在 `fancy-ops` 維護私有功能。

最小範例（一個新功能頁）：
```js
Fancy.ready(function () {
  Fancy.registerPage({
    id: "mypage", label: "我的功能", icon: "i-ai", perm: null, order: 10.5,
    view: function () { return '<div class="section-h"><h2 class="t">我的功能</h2></div><div class="card pad">內容…</div>'; }
  });
});
```
在 `index.html` 底部加 `<script src="plugins/mypage.js"></script>` 即生效；移除該行即停用。完整 API 與現成範例見 `plugins/README.md` 與 `plugins/example-notes.js`（一個可增刪的「備忘錄」頁）。

> 何時仍需動核心（下面各節）：要改**內建**頁的行為、改資料模型、或做外掛 API 尚未涵蓋的深層調整時。單純「加／減一個功能頁」用外掛就夠了。

---

## 一、先決定你是哪一種修改者

**A. 一般下載者** — fork 公版後直接改自己的 fork。最單純：程式就是你的，隨意增刪。代價見第五節（與上游分岔）。

**B. 你自己的 `fancy-ops`（submodule 掛公版）** — **不要直接改 `app/`（submodule）目錄**，那是指向公版某個 commit 的鏡像，`git submodule update` 會覆蓋你的改動。正確做法見第五節。

---

## 二、前端：新增一個功能頁（7 步）

前端全部在 `public/standalone/index.html`。以既有的「範本庫」為現成範例，照抄其模式即可。每步都對應一處程式：

1. **（選用）加權限**：若此功能要受分層權限控管，在 `const FEATURES`（約第 449 行）加一個功能名，並在 `seedPerms()` 的 `preset` 決定各角色預設可否。不需權限則此步跳過，NAV 的 `perm` 填 `null`。
2. **加圖示**：在 SVG sprite（`<svg ... style="position:absolute">` 內）新增一個 `<symbol id="i-你的圖示" viewBox="0 0 24 24">…</symbol>`，或沿用現有 30 個之一。
3. **加選單項**：在 `const NAV=[...]`（約第 578 行）加一列 `{id:"yourpage",label:"你的功能",icon:"i-你的圖示",perm:"你的權限或null"}`。
4. **加標題**：在 `const TITLES={...}` 加 `yourpage:"你的功能"`。
5. **加路由分派**：在 `render()`（約第 622 行起）加一行 `else if(route==="yourpage") c.innerHTML=viewYourPage();`。
6. **寫頁面函式**：新增 `function viewYourPage(){ return \`…HTML 字串…\`; }`。取資料用 `S`，存資料用 `await persist()`；彈窗用 `modal(title, html)`；提示用 `toast(msg)`。
7. **（選用）加資料**：若需持久化，於 `seed()`（或 `ensureChat()` 那種向後相容補丁）初始化欄位，變更後呼叫 `persist()`。

要接 AI：仿 `draft()`／`genNotice()`／`sendChat()`——`fetch("https://api.anthropic.com/v1/messages", …)`，失敗時 fallback。自建環境以使用者「設定」頁填入的自帶金鑰運作。

## 三、前端：移除一個功能

兩種程度：

**只隱藏**（最快、最安全）：把該功能在 `NAV` 的那一列刪掉，選單就不顯示。程式仍在但使用者到不了。

**徹底移除**：刪 `NAV` 一列 + `TITLES` 一項 + `render()` 一個分支 + 對應的 `viewX()` 函式（及其專屬 helper／CSS／圖示）。移除後用瀏覽器開一次確認無 console 錯誤即可。

> 提醒：移除受權限控管的功能時，可一併從 `FEATURES` 與 `seedPerms` 拿掉該權限，權限矩陣才不會殘留空欄。

## 四、後端：新增一個「有資料」的功能

後端在 `src/`。以 `cases` 路由為樣板：

1. **資料模型**：在 `prisma/schema.prisma` 新增一個 model（記得掛 `firmId` 以維持租戶隔離）。
2. **權限**：在 `src/lib/rbac.ts` 的 `FEATURES` 與 `PRESET` 加入新功能。
3. **API 路由**：複製 `src/app/api/cases/route.ts` 成 `src/app/api/你的資源/route.ts`，改 model 名；務必保留 `getCtx → requirePermission → 帶 firmId 查詢` 三段。
4. **建表**：`npx prisma migrate dev`。
5. 前端把 `Store` 的讀寫改指向新 API。

## 五、關鍵：升級 vs 客製（改法決定你能否繼續拉更新）

直接改公版程式 = 產生一個與上游分岔的版本；日後 `git pull` 上游更新會**衝突**。三條路，按情境選：

**其一，功能是通用的 → 貢獻回上游。** 在公版改好、送 PR（或就 push 到你自己的公版），它成為共享程式碼，之後大家一起維護，你也不分岔。最推薦。

**其二，功能是你私有的、且你用 `fancy-ops`（submodule）** → submodule 模式**只適合部署層客製**（環境變數、`ops/` 品牌與 lawRef 接接），**不適合改程式碼**。若要改私有程式碼，把 `app/` 從「submodule」改成「你的**私有 fork**」：`fancy-ops` 不再掛公版，而是掛你 fork 的 `fancy-private`，再定期 `git merge upstream/main` 併入公版更新。這樣你能同時保有私有客製與上游升級，只是合併衝突要自己處理。

**其三，只是少量隱藏／換字／換色** → 盡量走「設定層」（環境變數、`DEMO_MODE`、品牌變數）或 CSS 覆蓋，不動核心邏輯，升級最無痛。

## 六、一個誠實的現況限制

目前前端是**單檔、無外掛系統**；大量客製一定會與上游分岔。若你預期要長期維護「很多」私有功能，兩個務實選項：一是如上改採**私有 fork + 定期 merge**；二是**先在公版做一個外掛/掛載點機制**（例如把 `NAV`、`render` 改為可由外部設定檔註冊頁面），讓客製與核心解耦——這是公版值得投資的下一個架構改良，我可以幫你設計。
