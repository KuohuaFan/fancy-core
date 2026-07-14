# Fancy AI™ Core — 專為律所打造的 AI 智慧管理系統（開源核心）

[![License: CPAL-1.0](https://img.shields.io/badge/License-CPAL--1.0-C1272D.svg)](./LICENSE)

**開源**（CPAL-1.0，OSI 認可）。自建部署、自帶 LLM 金鑰、自付 token；不綁任何雲端服務。

> ⚠️ **標示義務（CPAL §14）**：散布或以網路服務提供本軟體（含修改版）時，
> 介面上**必須顯著顯示** `Powered by Fancy AI™ — PingLex™` 並連結 lawplus.com.tw。
> **網路使用（§15）**：以修改版經營網路服務者，必須公開原始碼。

## 核心包含（全部開源）

行事曆 · 案件（含卷證、AI 書狀擬稿）· 專案 · 對話記錄（AI）· 存證信函 ·
範本庫（5 種基本書狀）· 待辦任務 · **角色權限**（6 角色 × 功能矩陣）·
**設定**（品牌客製、自帶金鑰、模型選擇）· **外掛系統**

**後端**：Prisma schema（10 models）· RBAC · 9 條 API · LLM 伺服器代理 · Docker 一鍵自建

**範例外掛**（示範可擴充性）：期限計算器（§120–122，零 AI）· 利益衝突檢查（零 AI）· 備忘錄

## 律所版模組（另行授權，非開源）

工時記錄 · 客戶請款與收據（七種收費）· 律師酬勞績效 · 收發與代墊帳簿 ·
律所報稅 · 掃描建檔 · 進階範本庫（7 種契約與函文）

→ 見 **fancy-lawfirm**：對律師與律所**免費**，但不得再散布；
   **外包客製請洽 Fancy AI™**。

## 加值服務（付費）

裁判家判決資料庫（2,190 萬筆）+ lawRef 標註 · RAG 法令庫 · MaaS 與教育訓練
→ 需啟用碼；核發前查驗律師證號與事務所。

## 線上試用（免安裝 Demo）

下載前可先線上試用：**https://yourname.github.io/fancy/**

Demo 為純前端，資料只存在你的瀏覽器、AI 為示範輸出（不呼叫真實模型）。下載自建並於「設定」填入自己的 Claude 金鑰後，AI 即完整運作。

> 啟用方式（repo 擁有者）：推送後到 **Settings → Pages → Source: GitHub Actions**，`.github/workflows/deploy-pages.yml` 會自動把 `public/standalone` 發佈為上述網址。並將 README 與 `public/standalone/index.html` 內的 `yourname` 換成你的 GitHub 帳號。

- **`public/standalone/index.html`** — 可獨立運作的前端（本機持久化、內建 Fancy AI 對話與擬稿）。以瀏覽器開啟即可操作。
- **後端骨架**（Next.js + PostgreSQL + Prisma + Auth.js）— 多人（所級）帳號、伺服器強制分層權限、共用資料庫。依 `docs/SPEC-CMS-BACKEND-001.md` 由開發者／Manus 補完。

## 商業模式

工具**完全開源免費**。使用者下載後自行部署、選用自己的 LLM（Claude 等）、以自己的帳號金鑰運作，token 費用直接支付給模型供應商。作者不代管、不收軟體授權費。

收費集中於**服務**，而非軟體：

- **導入訓練** — 對不熟悉安裝／使用／版本更新者，提供 4 堂（每堂 90 分、NTD 30,000）共 **NTD 120,000** 之導入訓練。定位為「導入服務」而非「教點按鈕」：涵蓋部署、資料匯入與實務工作流建置。
- **年度維護／更新協助（訂閱制）** — 版本更新、相依升級、模型換代為持續性需求，以訂閱式維護方案提供，收入較一次性訓練穩定。
- **加值落地** — 對接既有判決資料庫、事務所資料治理、台灣 AI 基本法（2026）合規部署等難以自為之工作，另行報價。

## 功能

案件管理、卷證、待辦任務（逾期標示）、收發與代墊帳簿、報稅歸戶、行事曆（Google 同步待接）、角色權限矩陣（六角色×十二功能）、存證信函擬稿、專案與對話記錄、全螢幕沈浸式 **Fancy AI** 對話。AI 以**使用者自帶金鑰**呼叫，可自由更換 LLM。

## 快速開始（後端）

```bash
cp .env.example .env          # 填入 DATABASE_URL、你自己的 ANTHROPIC_API_KEY 等
npm install
npx prisma migrate dev        # 建表
npm run db:seed               # 灌入示範資料（需先撰寫 prisma/seed.ts）
npm run dev                   # http://localhost:3000
```

僅看前端展示：直接開 `public/standalone/index.html`。

## 架構要點

前端只負責藏 UI，**授權以伺服器為準**：每個 API route 皆先過 `src/lib/rbac.ts` 的 `requirePermission`。AI 走 `/api/draft`、`/api/notice`，由你自建的伺服器以**你自己的金鑰**呼叫，前端不接觸 key，產出留痕於 `Draft`／`Notice`。「查法律／查卷證」可自行對接你既有的判決資料庫。完整規格見 `docs/SPEC-CMS-BACKEND-001.md`；授權見 `LICENSING.md`。

## 目錄

```
prisma/schema.prisma            資料模型
src/lib/{rbac,session,prisma}.ts 權限與資料層
src/app/api/*                    REST 路由（cases/draft/notice 為樣板）
public/standalone/index.html     前端（可運作）
docs/SPEC-CMS-BACKEND-001.md     後端執行規格
```


## 自建（Docker，一鍵起服務）

```bash
cp .env.example .env          # 填入 ANTHROPIC_API_KEY（你的金鑰，只存在你的伺服器）
docker compose up -d --build  # 起 Postgres + App
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed     # 選用：載入示範資料
# 開 http://localhost:3000
```

**兩種運作模式（自動判斷）**
- **有後端**：前端呼叫 `/api/*`，資料存 Postgres、權限由伺服器把關、LLM 由伺服器持金鑰代理（金鑰不落瀏覽器）。
- **無後端**（GitHub Pages／單檔 demo）：自動退回本機儲存，功能照跑，資料只留在你的瀏覽器。

## 後端 API

| 路由 | 方法 | 權限 |
|---|---|---|
| `/api/cases` | GET, POST | 存案件 |
| `/api/tasks` | GET, POST, PATCH | 工作流 |
| `/api/ledger` | GET, POST, DELETE | 收發文 |
| `/api/events` | GET, POST, DELETE | 行事曆 |
| `/api/documents` | GET, POST | 查卷證 |
| `/api/permissions` | GET, PATCH | 分層權限 |
| `/api/draft` | POST | 寫書狀（伺服器端 LLM 代理） |
| `/api/notice` | POST | 存證信函（伺服器端 LLM 代理） |

每條路由皆經 `getCtx → requirePermission → firmId 租戶隔離`；所長／管理員權限鎖定不可移除。


## 接上你自己的 Claude API（兩種方式）

**方式一｜GitHub Pages / 單檔（最快）**
1. Fork 本專案 → Settings → Pages → Source 選「GitHub Actions」，即有你自己的網址。
2. 到 [console.anthropic.com](https://console.anthropic.com) 申請 API 金鑰（`sk-ant-…`）。
3. 開你的 Fancy → **設定 → 自帶 AI 金鑰** → 貼上金鑰 → 選模型 → **測試連線**。
   - 金鑰**只存在你這台裝置的瀏覽器**，不上傳任何伺服器；token 由你直接付給 Anthropic。
   - ⚠️ 瀏覽器直連採 Anthropic 的 `anthropic-dangerous-direct-browser-access` 模式：**請勿在公用電腦使用**，也不要把填好金鑰的裝置交給他人。

**方式二｜自建（最安全，建議正式使用）**
於伺服器 `.env` 填 `ANTHROPIC_API_KEY`，前端一律經 `/api/llm` 代理：**金鑰只在伺服器，永不進入瀏覽器**。

**未設金鑰時**：AI 功能顯示示範輸出，其餘功能（案件、工時、請款、期限計算、利益衝突檢查…）完全可用。

## 驗收

上線前請依 [`VERIFY.md`](./VERIFY.md) 實際跑一次（起服務、建表、seed、每條 API、權限與金鑰測試）。


## 授權、商標與預期使用者

**開源核心：Apache License 2.0** — 免費、可自由使用、修改、散布，**無需啟用碼**。

### 專業使用聲明（非授權條件）

本系統係為 **執業律師與律師事務所** 之案件管理需求設計。Apache-2.0 為開放原始碼授權，
依開源定義**不得限制使用對象或使用領域**，故本聲明為**專業提醒**，非授權條件：

* AI 產出之書狀、函件、契約**僅為初稿**，**須由執業律師覆核後始得使用**。
* 非法律專業人士使用本系統之輸出對外提供法律服務，**可能違反律師法等規範**，風險與責任自負。
* 本軟體按「現狀」提供，**不負任何擔保與損害賠償責任**（Apache-2.0 §7、§8）。

### 著作權標示（散布義務）

依 Apache-2.0 **§4(c)**，重製、修改或散布本軟體（含衍生作品）時，
**必須保留 [`NOTICE`](./NOTICE) 檔之著作權標示**。介面頁尾預設顯示：

```
© PingLex™ | Fancy AI™ · Apache-2.0 開源 · 關於／授權
```

部署時請保留此標示，或於「關於／授權」頁以同等顯著方式標示來源。

### 商標

**PingLex™、Fancy AI™、裁判家、lawRef** 為著作權人之商標。Apache-2.0 **不授予商標權**（§6）。
你可自由改作，但**修改版對外發布請另行命名**，不得以本品牌名義行銷、或暗示著作權人之背書。
（可註明「基於 Fancy AI™（Apache-2.0）開發」。）

## 加值服務（不在開源授權範圍）

下列須**另行取得授權與啟用碼**，並**限授權執業律師及律師事務所**：

* **裁判家判決資料庫**（2,190 萬筆）＋ **lawRef 標註**之判決檢索
* **RAG 法令／裁判資料庫**
* **MaaS（模型即服務）與教育訓練**

啟用方式：**設定 → 事務所啟用碼** 填入 PingLex 核發之碼（格式 `FANCY-XXXX-2026-XXXX`）。
核發前將查驗**律師證號與事務所資料**。

**開源核心永遠免費、無需啟用碼**；未啟用時，案件、工時、請款、期限計算、利益衝突檢查等功能完全可用。

## 事務所登錄（選填）

歡迎律所登錄使用，以便接收更新、教育訓練與加值服務資訊：
**→ 登錄表單：<請填入你的表單連結>**

登錄為**自願**、非使用條件。
