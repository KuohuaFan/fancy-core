# Fancy AI™

**專為律師事務所打造、可自行部署的 AI 智慧管理系統**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-2ea44f)](https://kuohuafan.github.io/fancy-core/)
[![License: CPAL-1.0](https://img.shields.io/badge/License-CPAL--1.0-blue.svg)](https://opensource.org/license/cpal-1-0)
[![Powered by FancyAI | SuitAI](https://kuohuafan.github.io/fancy-core/assets/fancy-badge.svg)](https://www.lawplus.com.tw/)

Fancy AI™ 把案件管理、權限治理、律所行政流程與 AI 介接整理成可自行部署、修改及擴充的律所工作台。律所可將系統與資料庫部署在自行控制的環境，並以自有帳號金鑰選擇 **Anthropic Claude、Google Gemini、OpenAI 或 Mistral AI**；在自建模式中，Fancy AI 維運方不代收模型 token 費用，也不保管律所的供應商金鑰。

> **「結構先於能力，方法定義模型。」** 工具再強，若沒有權限、資料邊界、稽核與專業覆核，對律師仍可能是風險。

## 一句話說明產品邊界

**免費開源的是工具與方法；付費的是資料與服務。**

| 層級 | 內容 | 是否開源 | 費用與邊界 |
|---|---|---:|---|
| Fancy AI Core | 案件、權限、AI 工作台、外掛 API，以及期限計算器、備忘錄、利益衝突檢查三個開發範例 | 是 | 本儲存庫追蹤程式碼依 **CPAL-1.0** 提供；可使用、修改及部署，但須遵守來源碼提供、External Deployment 與品牌標示義務。 |
| Fancy AI 律所版模組 | 工時、請款、收據、酬勞績效、掃描建檔、帳簿、報稅與進階範本 | 否 | 由 [`fancy-lawfirm`](https://github.com/KuohuaFan/fancy-lawfirm) 另行提供；僅授權律師、律所及所內人員免費自用，原始碼公開不等於開源，且不得再散布、轉授權或為第三人提供服務。 |
| 法令／裁判資料 | PingLex™、lawRef、裁判家等資料內容與 RAG 檢索 | 否 | 另行授權的付費資料服務，不隨本儲存庫散布。 |
| 導入與教育服務 | MaaS、正式環境部署、客製整合、維運與教育訓練 | 不適用 | 依需求另行提供；服務費不縮減 `fancy-core` 已依 CPAL-1.0 授予的權利。 |
| 內部部署資產 | 特定客戶設定、營運腳本、品牌素材與非通用整合 | 否 | 僅供各該部署使用；公開核心功能不依賴這些資產。 |

## 五項免費開源能力

| 能力 | 實際內容 |
|---|---|
| **1. 自建部署、遠端 LLM** | 系統、資料庫與附件可部署在律所控制的環境；AI 推論由所選遠端 LLM 提供。送入模型的提示及附件內容仍會傳至該供應商，使用者應依其條款與保密需求決定可傳送範圍。 |
| **2. 品牌客製** | 設定頁可更換律所名稱及上傳 Logo，並即時套用於登入、側欄、AI 對話及請款文件；CPAL Exhibit B 指定的 `Powered by FancyAI \| SuitAI` 標示仍須保留。 |
| **3. LLM 自由選擇、自付 token** | 自建後端支援 Claude、Gemini、OpenAI、Mistral。金鑰由部署者自行設定，模型費用直接依各供應商帳號計收。 |
| **4. AI Agent／外掛擴充** | 透過 `Fancy.registerPage(...)` 與 `Fancy.ai(...)` 擴充頁面、流程及 AI 功能；客製外掛可與核心分離，降低核心升級衝突。 |
| **5. 角色權限分層** | 內建所長、管理員、律師、法助、會計、顧問六種角色及十三項功能權限；可依律所需要調整權限矩陣。 |

十三項權限為：存案件、查卷證、PDF 標註、查法律、寫書狀、存證信函、範本庫、工作流、分層權限、行事曆、收發文、報稅及計費。後端商務路由依登入情境、功能權限與 `firmId` 資料範圍處理；所長與管理員預設具有完整權限。

## 律所版模組另行授權

[`fancy-lawfirm`](https://github.com/KuohuaFan/fancy-lawfirm) 掛在開源核心之上，以外掛形式提供，不修改核心程式碼。該儲存庫維持既有的 **律師／律所限定免費特殊授權**：原始碼公開但不是開放原始碼；律師、律所及其所內人員可免費修改自用，但不得再散布、轉授權，亦不得為第三人提供客製、部署或維運服務。

| 外掛 | 律所版功能 |
|---|---|
| `billing-scan.js` | 工時記錄、客戶請款與收據（七種收費方式）、律師酬勞績效、掃描建檔。 |
| `ledger-tax.js` | 收發與代墊帳簿、律所報稅。 |
| `templates-pro.js` | 進階範本 7 種：民事上訴狀、買賣契約、租賃契約、NDA、和解書、催告函、陳報狀。 |

完整授權及三步安裝方式請以 [`fancy-lawfirm/README.md`](https://github.com/KuohuaFan/fancy-lawfirm#readme) 與該庫 `LICENSE` 為準。這三個外掛**不是** `fancy-core` 的 CPAL Covered Code，也不由核心自動載入。

## Claude、Gemini、OpenAI、Mistral 的安置與設定

自建後端透過共用 adapter 支援四家供應商；Mistral 使用官方 Chat Completions API。[5] `provider` 可使用下表識別值。若請求未指定供應商，系統會先讀取 `LLM_PROVIDER`，未設定時才依已填入的金鑰順序選擇。

| 供應商 | `provider` | 金鑰變數 | 模型變數 | 預設模型 |
|---|---|---|---|---|
| Anthropic Claude | `anthropic` 或 `claude` | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` | `claude-sonnet-4-6` |
| Google Gemini | `google` 或 `gemini` | `GOOGLE_API_KEY` | `GOOGLE_MODEL` | `gemini-2.5-flash` |
| OpenAI | `openai` | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-4.1-mini` |
| Mistral AI | `mistral` | `MISTRAL_API_KEY` | `MISTRAL_MODEL` | `mistral-large-latest` |

### 1. 建立伺服器環境設定

先複製範本，並將 `.env` 保留在部署主機，不得提交至 Git。

```bash
cp .env.example .env
```

只使用一家供應商時，只需填入該家的金鑰；需要在介面切換多家時，可同時填入多組金鑰。`LLM_PROVIDER` 是未特別指定時的預設值。

```dotenv
LLM_PROVIDER=anthropic

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

GOOGLE_API_KEY=
GOOGLE_MODEL=gemini-2.5-flash

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-large-latest
```

### 2. 選擇啟動方式

使用 Docker 時，Compose 會把四家的供應商、金鑰及模型變數傳入應用程式容器：

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

使用 Node.js 直接啟動時，應用程式會自動讀取專案根目錄的 `.env`：

```bash
npm ci
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 3. 選擇供應商與模型

登入自建系統後，開啟「設定」，選擇 Claude、Gemini、OpenAI 或 Mistral，再選擇或輸入模型名稱並執行連線測試。前端只傳送 `provider`、`model`、訊息與輸出長度至 `/api/llm`；真正的供應商金鑰只由伺服器端 adapter 讀取。可只設定一家，也可同時設定多家；書狀與存證信函路由會在稽核資料中記錄實際使用的供應商及模型。

### 4. 單檔示範版限制

GitHub Pages／`public/standalone/index.html` 只允許 Claude 或 Gemini 使用個人測試金鑰，且金鑰僅暫存在目前分頁的 `sessionStorage`，關閉分頁即清除。基於本專案的金鑰安全政策，OpenAI 與 Mistral 不提供瀏覽器金鑰直連，必須下載後改用自建後端。未連線或未設定金鑰時，AI 功能會顯示示範輸出，其他核心功能仍可操作。

> **金鑰與卷證安全：**正式或機密案件一律應使用自建後端，將金鑰放在伺服器端秘密管理機制。四家供應商均以 API 金鑰授權請求；OpenAI 明確建議不要在瀏覽器或行動端暴露金鑰。[2] [3] [4] [5] 不要把 `.env`、API 金鑰或真實案件資料提交到 Git，也不要在 GitHub Pages 或公用電腦輸入案件機密。

## 快速開始：完整自建版

需求為 Node.js 20 以上、PostgreSQL，以及至少一家 LLM 供應商的 API 金鑰。

```bash
git clone https://github.com/KuohuaFan/fancy-core
cd fancy-core
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

開啟 `http://localhost:3000`。正式上線前請設定 TLS、備份、秘密管理、日誌保存、最小權限與事件應變流程，並依律所的保密及個資義務完成部署評估。

## 快速開始：單檔示範版

單檔版位於 `public/standalone/index.html`，可直接開啟，也可使用本機靜態伺服器：

```bash
cd public/standalone
python3 -m http.server 8080
```

再瀏覽 `http://localhost:8080`，或開啟 [Fancy AI GitHub Pages 示範站](https://kuohuafan.github.io/fancy-core/)。單檔資料主要保存在瀏覽器端，適合介面體驗、流程驗證與外掛開發；**它不是正式律所部署方案，也不應輸入真實個資、卷證、客戶秘密或有效的長期 API 金鑰。**

## 外掛開發

核心公開 `window.Fancy` API。下例新增一個頁面，並透過統一 `Fancy.ai` 契約呼叫部署者已選定的模型：

```javascript
Fancy.ready(() => {
  Fancy.registerPage({
    id: "hello-page",
    label: "自訂工具",
    icon: "spark",
    perm: "寫書狀",
    order: 9,
    view: () => `
      <section class="card">
        <button class="btn" onclick="runHelloAI()">產生待辦清單</button>
        <pre id="helloAnswer"></pre>
      </section>`,
  });
});

async function runHelloAI() {
  const result = await Fancy.ai([{ role: "user", content: "請產生待辦清單初稿" }]);
  document.getElementById("helloAnswer").textContent = result.ok ? result.text : "請檢查 LLM 設定";
}
```

完整契約請參閱 [`public/standalone/plugins/README.md`](public/standalone/plugins/README.md)。外掛若整合第三方 API，仍須自行處理授權、資料傳輸、金鑰保護及供應商條款。

## 兩項付費加值

### 1. 法令、裁判資料與 RAG

PingLex™／lawRef 特別標註的法令庫、裁判家裁判資料及 RAG 檢索屬另行授權的資料服務，不包含在本儲存庫。裁判字號應由資料來源錨定，AI 不應自行生成字號；任何引用仍須由專業人員回到原始全文覆核。

### 2. MaaS、部署與教育訓練

不熟悉部署或需要全所導入時，可另行洽詢 MaaS、正式環境部署、客製整合、教育訓練及維運支援。費用是針對資料或服務，不是限制本儲存庫已依 CPAL-1.0 授予的權利。

## API 概覽

| 路徑 | 方法 | 核心用途 |
|---|---|---|
| `/api/auth/[...nextauth]` | NextAuth handlers | 登入與工作階段 |
| `/api/cases` | `GET`、`POST` | 案件查詢與建立 |
| `/api/documents` | `GET`、`POST` | 卷證查詢與建立 |
| `/api/draft` | `POST` | AI 書狀初稿 |
| `/api/events` | `GET`、`POST`、`DELETE` | 行事曆事件 |
| `/api/ledger` | `GET`、`POST`、`DELETE` | 收發紀錄 |
| `/api/llm` | `POST` | Claude、Gemini、OpenAI、Mistral 統一代理 |
| `/api/me/permissions` | `GET` | 目前使用者有效權限 |
| `/api/notice` | `POST` | AI 存證信函初稿 |
| `/api/permissions` | `GET`、`PATCH` | 律所別權限覆寫 |
| `/api/tasks` | `GET`、`POST`、`PATCH` | 工作流任務 |

主要商務路由會先取得登入情境，並依功能執行權限與律所別資料範圍檢查；`/api/llm` 與 `/api/me/permissions` 仍要求登入，但用途分別為共用模型代理與讀取自身權限。

## 專案結構

```text
fancy-core/
├── public/standalone/       # 單檔示範版、3 個開發範例外掛與外掛 API
├── prisma/                  # PostgreSQL schema、migration 與 seed
├── src/app/api/             # Next.js API routes
├── src/lib/                 # RBAC、認證、資料庫與四供應商 LLM adapter
├── LICENSE                  # CPAL-1.0 授權聲明及 Fancy AI Exhibits
├── LICENSING.md             # 授權與標示實作說明
├── NOTICE                   # 著作權、品牌與第三方通知
└── SECURITY.md              # 安全政策
```

## CPAL-1.0 義務摘要

本儲存庫以 [Common Public Attribution License 1.0](https://opensource.org/license/cpal-1-0) 授權。[CPAL-1.0 為 OSI 核准的開放原始碼授權][1]。正式權利義務以 [`LICENSE`](LICENSE) 全文為準；以下僅為實作提示，不構成法律意見。

1. 散布 Covered Code 或修改版時，應依 CPAL-1.0 提供對應來源碼及必要通知。
2. 將修改版作為網路服務供他人使用，屬第 15 條所稱 External Deployment，應依其規定處理來源碼提供。
3. 依 Exhibit B 保留 `Powered by FancyAI | SuitAI`、指定網址及 SVG 圖形標示；本專案指定該要求亦適用於 Larger Works。
4. FancyAI、SuitAI、PingLex、lawRef 與裁判家等名稱及識別涉及商標或品牌權利；CPAL-1.0 不概括授予商標權。
5. 付費資料內容、RAG 代管、MaaS、部署顧問與教育訓練不因本儲存庫採 CPAL-1.0 而納入相同授權；但本儲存庫內已追蹤的程式碼仍依 CPAL-1.0 提供。

詳細部署、修改與標示檢查請見 [`LICENSING.md`](LICENSING.md)。

## 專業責任與隱私

所有 AI 產出的書狀、函件、摘要、法條或裁判引用僅供初稿及研究輔助，必須由律師或其他合格專業人員核對原始資料後定稿。使用者應自行評估個資、律師保密義務、資料跨境、第三方模型條款、保存期限與資安事件通報需求。

本專案按 CPAL-1.0 以「現狀」提供，不保證適合特定案件、法域、資訊安全等級或合規目的。

## 品牌標示

依 CPAL-1.0 Exhibit B，使用、修改或以 Larger Work 部署 Covered Code 時，須保留以下標示：

> **Powered by FancyAI | SuitAI**
> https://www.lawplus.com.tw/

指定圖形位於 [`public/standalone/assets/fancy-badge.svg`](public/standalone/assets/fancy-badge.svg)。律所可以自己的名稱及 Logo 作為主要品牌；上述來源標示仍須在介面指定位置清楚可見。

## References

[1]: https://opensource.org/license/cpal-1-0 "Open Source Initiative — Common Public Attribution License 1.0"
[2]: https://docs.anthropic.com/en/api/admin-api/apikeys/get-api-key "Anthropic — API key documentation"
[3]: https://ai.google.dev/gemini-api/docs/api-key "Google AI for Developers — Using Gemini API keys"
[4]: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety "OpenAI — Best practices for API key safety"
[5]: https://docs.mistral.ai/api/endpoint/chat "Mistral AI — Chat Completion API"

---

**Fancy AI™** — 工具與方法開源；資料與服務另行提供。
