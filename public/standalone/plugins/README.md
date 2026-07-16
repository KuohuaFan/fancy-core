# plugins/ — 外掛（不改核心即可增刪功能）

這個資料夾裡每支 `.js` 是一個外掛。核心 `index.html` 暴露 `window.Fancy` API，外掛呼叫它來新增功能頁；**核心程式完全不用改**，所以升級核心（換 `index.html`）不會蓋掉你的客製，也不會產生 git 衝突。

**隨 CPAL-1.0 開源核心發布的三個開發範例**（皆不改核心，可複製後自行擴充）：`example-notes.js`（備忘錄・資料型外掛）、`deadline-calculator.js`（期限／時效計算器・純確定性、零 AI）、`conflict-check.js`（利益衝突檢查・讀取核心案件資料、零 AI）。

## Fancy AI™ 律所版模組（另行授權）

`billing-scan.js`、`ledger-tax.js`、`templates-pro.js` 不隨 `fancy-core` 發布，也不是 CPAL Covered Code。它們由 [`fancy-lawfirm`](https://github.com/KuohuaFan/fancy-lawfirm) 依既有的**律師／律所限定免費特殊授權**提供：原始碼公開但不是開放原始碼；僅授權律師、律所及所內人員免費修改自用，不得再散布、轉授權或為第三人提供客製、部署、維運服務。

取得授權後，依 `fancy-lawfirm/README.md` 將三個 `.js` 檔複製至本目錄，並在 `index.html` 尾端三個核心範例外掛之後手動加入對應 `<script>`。核心不會預設載入這些律所版外掛。

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
- AI：`await Fancy.ai(messages, system?)` → `{ ok, text }`；`messages` 為 `[{role,content}]`。自建後端支援 Claude、Gemini、OpenAI、Mistral，金鑰僅放在伺服器環境變數；GitHub Pages／單檔測試僅允許使用者自行暫存 Claude 或 Gemini 金鑰，OpenAI、Mistral 請使用自建後端代理。

## 可用的既有 CSS 類別

外掛的 `view()` 可直接套核心樣式：`section-h`／`card`／`list-row`（含 `.li`／`.body`／`.t`／`.m`）／`btn`（`.ghost`／`.sm`／`.soft`）／`pill`／`field`／`empty`／`icon-btn`／`tabs`／`tab`。圖示用 `<svg class="ic" viewBox="0 0 24 24"><use href="#i-xxx"/></svg>`。

## 資料存放建議

把外掛資料掛在 `Fancy.state` 底下、用有前綴的鍵（例：`Fancy.state.plugin_notes`），避免和核心或其他外掛撞名。存完呼叫 `Fancy.persist()`。
