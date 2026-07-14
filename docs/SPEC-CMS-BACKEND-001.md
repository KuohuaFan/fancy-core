# SPEC-CMS-BACKEND-001 — Fancy AI 案件管理系統後端骨架規格

狀態：v0.1-draft｜性質：可執行規格（Manus 依此開工）｜前端：`public/standalone/index.html`（已可獨立運作之示範）

## 一、目的與範圍

將現行單檔前端（本機持久化、serverless AI）升級為**所級多租戶系統**：伺服器端帳號、伺服器強制之分層權限、共用資料庫，並將 AI 產出（書狀、存證信函）收斂為**伺服器端持金鑰**之受控引擎（Fancy AI）。本規格界定資料模型、API 契約、權限強制點、AI 介接、既有資料源整合與部署步驟。不含前端框架重寫；前端可沿用現有畫面，改以 API 取代本機 `Store`。

## 二、架構總覽

採 Next.js（App Router）+ PostgreSQL + Prisma + Auth.js 單一部署單元。擇此組合之理由有三：其一，App Router 之 route handler 使前端與 API 同倉、同型別，減少介面漂移；其二，Prisma 提供型別安全之資料層與 migration，契合「結構先於能力」之原則；其三，Auth.js 可同時支援 Email/Credentials 與 Google Workspace 登入，銜接事務所既有帳號。

分層如下：瀏覽器（現有畫面或後續 React 化）→ `middleware.ts`（登入閘）→ route handler（**逐一呼叫 `requirePermission`**）→ Prisma → PostgreSQL；AI 需求另走 `/api/draft`、`/api/notice`，由伺服器持金鑰轉呼叫。

## 三、權限模型（本系統之骨幹）

原則：**前端只負責藏 UI，授權以伺服器為準。** 現行前端之權限矩陣僅擋選單，無法擋 API；正式版所有寫入與敏感讀取一律在 route handler 內先過 `requirePermission(role, feature, overrides)`。

矩陣定義於 `src/lib/rbac.ts`：角色六（所長、管理員、律師、法助、會計、顧問），功能十二（存案件、查卷證、PDF標註、查法律、寫書狀、存證信函、範本庫、工作流、分層權限、行事曆、收發文、報稅）。`DEFAULTS` 為出廠預設，各所之調整存於 `Permission` 表，讀取後以 overrides 覆寫。所長與管理員列為 `LOCKED_ROLES`，恆具全權且不可於介面移除——此為治理設計，非技術限制。

判斷邏輯務必維持純函式，俾利單元測試與跨端一致（前端可 import 同一份 `hasPermission` 只做視覺隱藏）。

## 四、資料模型

見 `prisma/schema.prisma`。要點：以 `Firm` 為租戶根，`User`、`Case`、`Permission` 均掛 `firmId`；所有查詢**強制帶 `firmId` 條件**以達租戶隔離（Manus 實作時逐一檢查，勿遺漏）。`Case` 下含 `Document`、`Task`、`LedgerEntry`、`CalendarEvent`、`Draft`、`Notice`。金額以整數（TWD）存放避免浮點誤差。`Draft` 與 `Notice` 保留 `model` 與時間戳，供 AI 產出之可追溯性（見第七節合規）。

## 五、API 契約

REST，路徑於 `src/app/api/*`。已提供 `cases`（GET 列表／POST 新增）與 `draft`、`notice` 三支為樣板；其餘依同一樣板複製：

任務 `tasks`：GET（可 `?caseId=`）／POST 指派／PATCH 完成切換。收發文 `ledger`：GET／POST，並提供 `GET /api/ledger/summary?year=` 供報稅頁歸戶加總。行事曆 `events`：GET／POST／PATCH，PATCH 時同步 Google（見第六節）。權限 `permissions`：GET（回本所矩陣）／PUT（僅具「分層權限」者可寫，且不得改動 LOCKED_ROLES）。

每支 handler 一律：`getCtx(req)` 取脈絡 → `requirePermission(...)` → 帶 `firmId` 存取 → 回 JSON。錯誤以 `{ error }` + 對應 status（401 未登入、403 無權、404 不存在、501 未設定金鑰、502 上游錯誤）。

## 六、外部整合

**AI 引擎（Fancy AI）**：`/api/draft`、`/api/notice` 於伺服器讀 `ANTHROPIC_API_KEY`（事務所自帶金鑰）轉呼叫，前端永不接觸 key；模型由 `LLM_MODEL` 指定。此即現行前端「自帶金鑰」承諾之正式落地。

**Google 行事曆**：以 Auth.js Google provider 取得 calendar scope，於 `events` 之 POST/PATCH 後寫回並存 `gcalId`，達雙向同步。示範版按鈕保留為 OAuth 待接點。

**既有資料源**：「查法律／查卷證」不自建語料，直接對接你既有之裁判家二代 lawRef，透過 `LAWREF_MCP_URL`（對應 SPEC-LAWREF-MCP-001 之 MCP 閘道）查詢。此舉使本工作台之檢索能力等同你十餘年之判決資料資產，且維持單一事實來源。

**報稅**：`ledger/summary` 產出歸戶清單後，正式版對接財政部電子申報格式匯出，並保留歷年紀錄。

## 七、合規註記（台灣 AI 基本法）

因系統代客戶處理個資並產生法律文件，AI 產出須可追溯：`Draft`／`Notice` 已留存模型、時間、產出者。導入所級部署時，建議一併套用你既有之 COMP-AIACT-TW 自評，將「人工覆核為必要步驟」寫入 UI（現行草稿頁已標示「請律師覆核」）與服務條款。此為對外訓練／代管服務之合規賣點，亦為義務。

## 八、專案結構

```
pinglex-cms/
├─ prisma/schema.prisma          # 資料模型（本規格第四節）
├─ src/
│  ├─ middleware.ts              # 登入閘
│  ├─ lib/
│  │  ├─ rbac.ts                 # 權限矩陣 + requirePermission（骨幹）
│  │  ├─ session.ts              # getCtx / loadPerms
│  │  └─ prisma.ts               # Prisma client
│  └─ app/api/
│     ├─ cases/route.ts          # 樣板（GET/POST）
│     ├─ tasks|ledger|events/    # 依樣板複製
│     ├─ permissions/route.ts    # 矩陣讀寫（守 LOCKED_ROLES）
│     ├─ draft/route.ts          # Fancy AI：書狀
│     ├─ notice/route.ts         # Fancy AI：存證信函
│     └─ auth/[...nextauth]/     # Auth.js 進入點
├─ public/standalone/index.html  # 現行前端（可先接 API 再逐步 React 化）
└─ docs/SPEC-CMS-BACKEND-001.md
```

## 九、Manus 執行清單（順序）

一、`npm install`；建立 PostgreSQL；填 `.env`（複製 `.env.example`）。
二、`npx prisma migrate dev` 建表；撰寫 `prisma/seed.ts` 灌入示範所與六名使用者、預設 `Permission`。
三、完成 Auth.js providers 與 `callbacks.session`（注入 userId/firmId/role），並將 `session.ts::getCtx` 由讀 header 改為讀 session。
四、依 `cases` 樣板補齊 `tasks`／`ledger`（含 summary）／`events`／`permissions` 五支路由，逐支確認 `requirePermission` 與 `firmId` 隔離。
五、將前端 `Store` 之 get/set 改指向對應 API；`draft()`／`genNotice()` 改打 `/api/draft`、`/api/notice`。
六、接 Google OAuth 與物件儲存；最後接 lawRef MCP。
七、每支路由補最小整合測試（尤其權限 403 與跨租戶隔離）。

## 十、驗收準則

以法助身分呼叫 `/api/permissions` PUT 應得 403；A 所使用者查詢不得回傳 B 所任何資料；未設金鑰時 `/api/draft` 回 501 而非 500；`Draft` 於每次產出後必有一筆留痕。以上四項為最低門檻。
