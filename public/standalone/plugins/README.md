# plugins/ — 外掛（不改核心即可增刪功能）

這個資料夾裡每支 `.js` 是一個外掛。核心 `index.html` 暴露 `window.Fancy` API，外掛呼叫它來新增功能頁；**核心程式完全不用改**，所以升級核心（換 `index.html`）不會蓋掉你的客製，也不會產生 git 衝突。

**內附三個範例外掛**（皆不改核心，複製即可改成你自己的）：`example-notes.js`（備忘錄・資料型外掛）、`deadline-calculator.js`（期限/時效計算器・純確定性、零 AI）、`conflict-check.js`（利益衝突檢查・讀取核心案件資料、零 AI）。

## 加一個外掛

1. 複製 `example-notes.js` 成 `你的功能.js`，改裡面的 `id`／`label`／`view`。
2. 在 `index.html` 底部（範例那行旁）加一行：`<script src="plugins/你的功能.js"></script>`。
3. 重新整理即生效。

## 停用／移除一個外掛

移除 `index.html` 裡對應的 `<script>`，或直接刪該 `.js` 檔。核心不受影響。

## API 參考（`window.Fancy`）

- `Fancy.ready(fn)` — 等核心就緒後執行；所有註冊都包在這裡面。
- `Fancy.registerPage({ id, label, icon, perm, view, order })` — 註冊一個功能頁：
  - `id` 唯一字串；`label` 選單顯示名；`icon` 圖示 id（見下）；
  - `perm` 權限名或 `null`（填新權限名會**自動加進權限矩陣**，預設各角色可用，所長可再限制）；
  - `view()` 回傳該頁 HTML 字串；`order` 選單排序（內建頁為 0–11，數字越小越前）。
- `Fancy.unregisterPage(id)` — 移除已註冊頁。
- `Fancy.registerIcon(id, svgInner)` — 新增 SVG 圖示（`svgInner` 為 `<path>` 等內容，viewBox 固定 0 0 24 24）。
- 核心工具：`Fancy.state`（狀態物件，存資料放這裡）、`Fancy.persist()`（存檔）、`Fancy.render()`（重繪）、`Fancy.go(id)`（切頁）、`Fancy.can(perm)`（權限判斷）、`Fancy.esc(s)`（HTML 逃脫）、`Fancy.modal(title, html)`（彈窗）、`Fancy.toast(msg)`（提示）、`Fancy.field(id,label,extra)`（表單欄位）。
- AI：`await Fancy.ai(messages, system?)` → `{ ok, text }`；`messages` 為 `[{role,content}]`。自建部署會以使用者自帶金鑰呼叫。

## 可用的既有 CSS 類別

外掛的 `view()` 可直接套核心樣式：`section-h`／`card`／`list-row`（含 `.li`／`.body`／`.t`／`.m`）／`btn`（`.ghost`／`.sm`／`.soft`）／`pill`／`field`／`empty`／`icon-btn`／`tabs`／`tab`。圖示用 `<svg class="ic" viewBox="0 0 24 24"><use href="#i-xxx"/></svg>`。

## 資料存放建議

把外掛資料掛在 `Fancy.state` 底下、用有前綴的鍵（例：`Fancy.state.plugin_notes`），避免和核心或其他外掛撞名。存完呼叫 `Fancy.persist()`。
