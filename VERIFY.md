# VERIFY.md — 上線前驗收清單（給 Manus 或在電腦執行）

> 目的：在對外宣布「開源全端」之前，**實際跑一次**，確認起服務、建表、seed、登入、每條 API、AI 金鑰都真的可用。
> 本清單未通過前，對外文案請寫「開源前端 + 後端骨架」，勿稱「全端已驗證」。
> 環境需求：Docker、Docker Compose、curl、jq（選用）。

---

## A. 起服務

```bash
cd fancy
cp .env.example .env
#   編輯 .env：設定 LLM_PROVIDER，並至少填入對應的 ANTHROPIC_API_KEY、GOOGLE_API_KEY、OPENAI_API_KEY 或 MISTRAL_API_KEY；AUTH_SECRET 用 openssl rand -base64 32 產生
docker compose up -d --build
docker compose ps          # db 與 app 皆應為 running/healthy
docker compose logs -f app # 應看到 Next.js 啟動、無錯誤
```
- [ ] **A1** `db` 容器 healthy
- [ ] **A2** `app` 容器 running，log 無 error
- [ ] **A3** 瀏覽器開 `http://localhost:3000` 有畫面

## B. 建表與示範資料

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```
- [ ] **B1** migrate 成功（10 個 model：Firm/User/Permission/Case/Document/Task/LedgerEntry/CalendarEvent/Draft/Notice）
- [ ] **B2** seed 成功，無外鍵錯誤
- [ ] **B3** 驗證資料確實寫入：
```bash
docker compose exec db psql -U fancy -d fancy -c '\dt'
docker compose exec db psql -U fancy -d fancy -c 'select name, role from "User";'
docker compose exec db psql -U fancy -d fancy -c 'select count(*) from "Case";'
docker compose exec db psql -U fancy -d fancy -c 'select count(*) from "Permission";'
```
  應看到 6 位使用者（范國華/陳律師/林法助/王會計/周顧問/李管理）、案件數 > 0、權限列 > 0。

## C. 取得測試用 user id

**身分驗證已改為真正的 Auth.js（v5）**，不再接受任何身分標頭。取出各角色 email：

```bash
docker compose exec db psql -U fancy -d fancy -At -c 'select id, name, role from "User" order by role;'
```
把所長的 id 記為 `$OWNER`、律師 `$LAWYER`、會計 `$ACCT`、法助 `$PARA`：
```bash
export OWNER=<所長的 id>
export LAWYER=<陳律師的 id>
export ACCT=<王會計的 id>
export PARA=<林法助的 id>
```

- [ ] **C1** 六個角色皆存在且 id 取得成功


## C-2. 身分驗證（Auth.js）—— 【P0：上線前必過】

> 先前的 `x-user-id` 標頭模式（可偽造）**已完全移除**。
> 身分一律由伺服器端 session（JWT，經 `AUTH_SECRET` 簽章）解出，角色每次回資料庫覆核。

```bash
# 產生 AUTH_SECRET（填入 .env）
openssl rand -base64 32
```

- [ ] **S1 未登入 → 401**（且不得回傳任何資料）：
  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/cases          # 應 401
  ```
- [ ] **S2 偽造身分標頭 → 仍然 401**（這是先前的漏洞，必須確認已封死）：
  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' -H "x-user-id: demo-owner-id" localhost:3000/api/cases   # 應 401
  ```
  **若此項回 200，禁止上架。**
- [ ] **S3 正確帳密可登入**：
  ```bash
  CSRF=$(curl -s -c /tmp/c.txt localhost:3000/api/auth/csrf | python3 -c 'import sys,json;print(json.load(sys.stdin)["csrfToken"])')
  curl -s -b /tmp/c.txt -c /tmp/c.txt -X POST localhost:3000/api/auth/callback/credentials \
    -d "csrfToken=$CSRF&email=user1@demo.example&password=demo1234&redirect=false&json=true"
  curl -s -b /tmp/c.txt localhost:3000/api/auth/session      # 應回 user（含 role）
  curl -s -b /tmp/c.txt localhost:3000/api/cases | head -c 120; echo   # 應回案件
  ```
- [ ] **S4 錯誤密碼 → 無法登入**（session 為空）
- [ ] **S5 登入後 RBAC 生效**：以 `user4@demo.example`（王會計）登入 → `GET /api/cases` **應 403**（會計無「存案件」權限）
- [ ] **S6 跨所隔離**：另建一個 firm 的使用者 → 登入後看不到 demo 所的案件
- [ ] **S7 密碼未明文儲存**：
  ```bash
  docker compose exec db psql -U fancy -d fancy -At -c 'select "passwordHash" from "User" limit 1;'
  # 應為 "salt:hash" 形式的 scrypt 雜湊，不得看到 demo1234
  ```
- [ ] **S8 正式部署已改密碼**：`SEED_PASSWORD` 或各自設定強密碼，不得沿用 demo1234

## D. API 逐條測試（每條都要過）

> **所有 API 測試均須使用 Auth.js session cookie。** 先依 S3 的登入流程，分別建立 `/tmp/owner.txt`、`/tmp/lawyer.txt`、`/tmp/acct.txt`、`/tmp/para.txt`；不得再傳送 `x-user-id` 或其他可偽造身分標頭。

### D1 案件 cases（權限：存案件）
```bash
curl -s -b /tmp/owner.txt localhost:3000/api/cases | head -c 300; echo
curl -s -b /tmp/owner.txt -X POST localhost:3000/api/cases -H 'content-type: application/json' \
  -d '{"title":"驗收測試案件","type":"民事","client":"測試客戶","opponent":"測試對造"}'
```
- [ ] GET 回傳陣列；POST 回 201 且再次 GET 看得到新案件
- [ ] 改用會計的 `/tmp/acct.txt`（會計無「存案件」權限）→ **應回 403**

### D2 任務 tasks（權限：工作流）
```bash
CASE_ID=$(curl -s -b /tmp/owner.txt localhost:3000/api/cases | head -c 2000 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -b /tmp/lawyer.txt -X POST localhost:3000/api/tasks -H 'content-type: application/json' \
  -d "{\"caseId\":\"$CASE_ID\",\"title\":\"驗收任務\",\"dueDate\":\"2026-08-01\"}"
curl -s -b /tmp/lawyer.txt localhost:3000/api/tasks | head -c 300; echo
```
- [ ] POST 201、GET 看得到
- [ ] PATCH 勾選完成：`curl -s -b /tmp/lawyer.txt -X PATCH localhost:3000/api/tasks -H 'content-type: application/json' -d '{"id":"<task_id>","done":true}'` → 200

### D3 帳簿 ledger（權限：收發文）
```bash
curl -s -b /tmp/acct.txt -X POST localhost:3000/api/ledger -H 'content-type: application/json' \
  -d "{\"caseId\":\"$CASE_ID\",\"kind\":\"代墊\",\"desc\":\"驗收裁判費\",\"amount\":3300,\"date\":\"2026-07-13\"}"
curl -s -b /tmp/acct.txt localhost:3000/api/ledger | head -c 300; echo
```
- [ ] POST 201、GET 看得到、DELETE `?id=` 可刪

### D4 行事曆 events（權限：行事曆）
```bash
curl -s -b /tmp/owner.txt -X POST localhost:3000/api/events -H 'content-type: application/json' \
  -d "{\"caseId\":\"$CASE_ID\",\"title\":\"驗收開庭\",\"kind\":\"開庭\",\"date\":\"2026-08-15\"}"
curl -s -b /tmp/owner.txt "localhost:3000/api/events?from=2026-08-01&to=2026-08-31"
```
- [ ] POST 201、日期區間查詢有效

### D5 卷證 documents（權限：查卷證）
```bash
curl -s -b /tmp/para.txt -X POST localhost:3000/api/documents -H 'content-type: application/json' \
  -d "{\"caseId\":\"$CASE_ID\",\"name\":\"驗收卷證.pdf\",\"folder\":\"05_證據\"}"
curl -s -b /tmp/para.txt "localhost:3000/api/documents?caseId=$CASE_ID"
```
- [ ] POST 201、GET 依 caseId 過濾正確

### D6 權限 permissions（權限：分層權限）
```bash
curl -s -b /tmp/owner.txt localhost:3000/api/permissions
curl -s -b /tmp/owner.txt -X PATCH localhost:3000/api/permissions -H 'content-type: application/json' \
  -d '{"feature":"計費","role":"法助","allowed":true}'
# 嘗試移除所長權限（應被擋）
curl -s -b /tmp/owner.txt -X PATCH localhost:3000/api/permissions -H 'content-type: application/json' \
  -d '{"feature":"存案件","role":"所長","allowed":false}'
```
- [ ] GET 回權限矩陣；PATCH 一般角色成功
- [ ] **移除所長／管理員權限 → 應回 400「所長／管理員為最高權限，不可移除」**（這條沒過就是 RBAC 破了）
- [ ] 改用律師的 `/tmp/lawyer.txt` 呼叫 → **應回 403**

### D7 AI（llm / draft / notice）
```bash
curl -s -b /tmp/owner.txt -X POST localhost:3000/api/llm -H 'content-type: application/json' \
  -d '{"provider":"anthropic","max_tokens":32,"messages":[{"role":"user","content":"回覆兩個字：連線成功"}]}'
```
- [ ] `LLM_PROVIDER=anthropic` 且設定 `ANTHROPIC_API_KEY` → 回 Claude 回覆，`provider` 為 `anthropic`
- [ ] `LLM_PROVIDER=google` 且設定 `GOOGLE_API_KEY` → 回 Gemini 回覆，`provider` 為 `google`
- [ ] `LLM_PROVIDER=openai` 且設定 `OPENAI_API_KEY` → 回 OpenAI 回覆，`provider` 為 `openai`
- [ ] `LLM_PROVIDER=mistral` 且設定 `MISTRAL_API_KEY` → 回 Mistral 回覆，`provider` 為 `mistral`
- [ ] 四家亦可在單次請求中以 `provider` 與 `model` 覆寫預設值
- [ ] **所選供應商未設金鑰 → 回 501**（前端會自動退回示範輸出，屬正常）
- [ ] `/api/draft`、`/api/notice` 以登入 session 與有效案件測試，回應及資料庫稽核欄位均記錄實際 provider／model

### D8 未登入／跨所隔離
```bash
curl -s -i localhost:3000/api/cases | head -1            # 無 session cookie
```
- [ ] **應回 401**
- [ ] 手動在 DB 建第二個 firm 與其 user，以該使用者的 Auth.js session 呼叫 `/api/cases` → **看不到第一所的案件**（firmId 隔離成立）

## E. 前端（自建模式）

- [ ] **E1** 開 `http://localhost:3000` → 以所長登入 → 核心主頁與 3 個核心開發範例外掛齊全；不得自動載入 `fancy-lawfirm` 律所版外掛、付費裁判資料或客戶專屬資產
- [ ] **E2** 新增一件案件 → 重整頁面後仍在（代表寫進 Postgres，非只存瀏覽器）
- [ ] **E3** 設定頁「測試連線」→ 顯示「✓ 自建後端已連線」
- [ ] **E4** 以「會計」登入 → 側欄看不到「案件」（伺服器端權限生效）
- [ ] **E5** 期限計算器、備忘錄、利益衝突檢查三個核心開發範例外掛可用；`billing-scan.js`、`ledger-tax.js`、`templates-pro.js` 應只在依 `fancy-lawfirm` 特殊授權完成手動安裝後另行驗收

## F. 前端（GitHub Pages 模式，無後端）

- [ ] **F1** 開 GitHub Pages 的 demo → 可操作，資料存瀏覽器
- [ ] **F2** 設定頁可選 Claude 或 Gemini，填入自己的瀏覽器測試金鑰後按「測試連線」→ 顯示「✓ 連線成功」；畫面同時明示正式使用應改走自建後端
- [ ] **F3** 選 OpenAI 或 Mistral 時，GitHub Pages 不要求也不儲存其金鑰，並提示改用自建後端代理；自建後端可依 `LLM_PROVIDER=openai` 或 `LLM_PROVIDER=mistral` 正常回覆
- [ ] **F4** 未填金鑰時，AI 功能顯示示範輸出、其餘功能正常（不應報錯）
- [ ] **F5** 設定頁可修改律所名稱、上傳／清除 Logo，並即時套用於登入、側欄及 AI 對話標頭

---

## 驗收結論（請填）

- 執行者：__________　日期：__________
- Docker 版本：__________　Node 版本：__________
- 全部通過？ ☐ 是　☐ 否（未過項目：__________________）

**只有 A–F 全數通過，對外才可稱「開源全端、可自建」。** 若 D7 未過但其餘通過，可稱「全端可自建；AI 需自帶金鑰」。
