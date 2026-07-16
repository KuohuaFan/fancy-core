# PUSH.md — GitHub 發布與維運指南

本專案目前已發布至 **[KuohuaFan/fancy-core](https://github.com/KuohuaFan/fancy-core)**，並由 GitHub Actions 自動部署至 **[Fancy AI Core Demo](https://kuohuafan.github.io/fancy-core/)**。生產部署則保存在私有儲存庫 `KuohuaFan/fancy-ops`，以 Git submodule 引用公開核心，不複製另一份來源。

| 儲存庫 | 可見性 | 用途 | 授權 |
|---|---|---|---|
| `KuohuaFan/fancy-core` | Public | 開源核心、文件與免安裝 Demo | CPAL-1.0 |
| `KuohuaFan/fancy-lawfirm` | Private | 律所版外掛模組 | 專有免費授權 |
| `KuohuaFan/fancy-ops` | Private | 生產部署、機密設定與 lawRef overlay | 私有部署 |

## 一、更新公開核心

在 `fancy-core` 完成修改與測試後，執行：

```bash
cd fancy-core
git status --short
git add -A
git commit -m "說明本次修改"
git push origin main
```

推送 `main` 後，`.github/workflows/deploy-pages.yml` 會自動部署 `public/standalone`。應至 [Actions](https://github.com/KuohuaFan/fancy-core/actions) 確認工作流程成功，並重新開啟正式 Pages 網址驗證內容。

## 二、首次取得公開核心

```bash
git clone https://github.com/KuohuaFan/fancy-core
cd fancy-core
```

上列無後綴網址可直接供 Git clone 使用；一般瀏覽請使用 [GitHub 專案頁](https://github.com/KuohuaFan/fancy-core)。

## 三、更新私有生產部署的 submodule

`fancy-ops/app` 必須指向公開核心的正式提交。公開核心推送完成後，在 `fancy-ops` 執行：

```bash
cd fancy-ops
git submodule update --remote app
git add app
git commit -m "chore: update fancy-core submodule"
git push origin main
```

首次建立 submodule 時使用：

```bash
git submodule add https://github.com/KuohuaFan/fancy-core app
```

其他環境首次取得私有部署時，應使用 `git clone --recurse-submodules`，或在 clone 後執行 `git submodule update --init --recursive`。

## 四、推送前安全檢查

推送前必須確認沒有提交 `.env`、API 金鑰、密碼、真實客戶資料、律師個資或生產資料庫。`fancy-ops/.env.production` 僅能留在部署環境，正式密鑰應由 secret manager 注入。

公開核心的授權與介面標示不得被移除。依 CPAL-1.0，本專案介面須顯著顯示 **「Powered by FancyAI | SuitAI」**，並保留 `LICENSE`、`NOTICE` 與原始碼取得資訊。

## 五、驗收

發布完成後，應逐一核對公開核心與 Pages 可開啟、Actions 部署成功、三庫預設分支為 `main`、`fancy-ops/app` 的 gitlink 與公開核心目標提交一致，以及私有儲存庫仍維持 Private。網頁文件與維運指令中的 GitHub 儲存庫網址一律使用無後綴形式。
