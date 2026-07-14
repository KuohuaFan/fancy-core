# PUSH.md — 上架 GitHub 步驟（給 Manus 或在電腦終端機執行）

> 目標：把**公版 `fancy`（Public）**與**私有 `fancy-ops`（Private）**推上 GitHub。
> **順序固定：先公版、後私有**（私有版以 submodule 掛公版，公版不存在就掛不上）。
> ⚠️ 手機 GitHub App 只能「建空 repo」，**不能 push 本機資料夾**；push 這步請在電腦或由 Manus 執行。

---

## 0. 前置

1. 設定你的帳號變數（之後指令都用 `$GH_USER`）：
   ```bash
   export GH_USER=你的GitHub帳號        # 例如 export GH_USER=fankuohua
   ```
2. 在 GitHub 先建**兩個空 repo**（README／.gitignore／授權三個開關都**不要勾**，保持全空）：
   - `fancy` — 可見性 **Public**
   - `fancy-ops` — 可見性 **Private**
   （手機 App：主頁右上角 `+` → 建立儲存庫；或網頁 github.com/new。）
3. 認證：HTTPS push 時 GitHub 要帳號＋密碼，**密碼要填「個人存取權杖 PAT」**（設定路徑：GitHub → Settings → Developer settings → Personal access tokens），或先跑 `gh auth login` 用瀏覽器授權。

---

## 1. 公版 `fancy`（先推）

```bash
cd fancy

# (a) 把 4 處 yourname 佔位符換成你的帳號（README×2、standalone×2）
perl -pi -e "s/yourname/$GH_USER/g" README.md public/standalone/index.html

# (b) 提交改動
git add -A && git commit -m "設定 GitHub 帳號連結"

# (c) 連到 GitHub 並推送
git remote add origin https://github.com/$GH_USER/fancy.git
git push -u origin main
```

**推完啟用 Demo：** repo → **Settings → Pages → Build and deployment → Source 選「GitHub Actions」**。
稍候 `.github/workflows/deploy-pages.yml` 會自動發佈，Demo 網址：
```
https://<你的帳號>.github.io/fancy/
```

---

## 2. 私有 `fancy-ops`（後推）

```bash
cd ../fancy-ops        # 或 cd 到 fancy-ops 資料夾

# (a) 把公版掛為 submodule（app/ 指向你剛推的公版）
git submodule add https://github.com/$GH_USER/fancy.git app
git commit -m "掛入公版 fancy 為 submodule"

# (b) 連到私有 repo 並推送
git remote add origin https://github.com/$GH_USER/fancy-ops.git
git push -u origin main
```

`.env.production` 為機密、已列入 `.gitignore`，不會被推上去（正確）。
部署時另跑 `cp .env.production.example .env.production` 填入金鑰後 `./deploy.sh`。

---

## 3. 驗證（推完檢查）

```bash
# 兩個 repo 都應顯示 origin 遠端
cd fancy && git remote -v
cd ../fancy-ops && git remote -v

# 公版佔位符應為 0（已全換成帳號）
cd ../fancy && grep -rc yourname README.md public/standalone/index.html
```
- 開 `https://github.com/<你的帳號>/fancy` 應看到 22 檔、Apache-2.0、Actions 分頁有 Pages 部署。
- 開 Demo 網址應能操作（AI 為示範輸出，屬正常；自建接自己金鑰才真跑）。
- `fancy-ops` 應為 Private，且看得到 `app` submodule 連結。

---

## 4. 疑難排解

- **push 被拒 / `fetch first` / unrelated histories**：多半是 GitHub 上的 repo 建立時勾了 README。解法：改建**全空** repo；或 `git pull --allow-unrelated-histories origin main` 合併後再 push。
- **認證失敗（Authentication failed）**：HTTPS 密碼要用 **PAT** 不是帳號密碼；或改用 `gh auth login`；或改 SSH 遠端 `git@github.com:$GH_USER/fancy.git`（需先設 SSH key）。
- **別人 clone `fancy-ops` 後 `app/` 是空的**：submodule 未初始化。請用 `git clone --recurse-submodules ...`，或 clone 後補跑 `git submodule update --init`。
- **Pages 沒出現**：確認 Settings → Pages 的 Source 是「GitHub Actions」，並到 Actions 分頁看部署是否成功。
