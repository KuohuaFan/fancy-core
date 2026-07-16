# 授權策略與定案紀錄（LICENSING）

> **最終定案：公開核心採用 Common Public Attribution License 1.0（CPAL-1.0）；律所模組與資料／服務層維持另行授權。** 正式條款以根目錄 [`LICENSE`](./LICENSE) 與 [`NOTICE`](./NOTICE) 為準。

本文件記錄決策過程，避免把早期討論中的 Apache-2.0 建議誤認為最終結論。Fancy AI 公開核心仍是可下載、自建及自備金鑰的開放原始碼軟體；最終選擇 CPAL-1.0，是為了同時保留開源性、要求網路部署的修改版提供原始碼，並確保介面持續顯示指定的來源標示。[1]

## 一、曾評估的授權選項

| 選項 | 主要效果 | 與本案需求的關係 | 結論 |
|---|---|---|---|
| MIT | 高度寬鬆，條款簡短；可作閉源衍生利用 | 無法強制保留圖形介面來源標示，也不要求 SaaS 修改版公開原始碼 | 未採用 |
| Apache License 2.0 | 寬鬆、包含明示專利授權與 NOTICE 機制 | 早期曾建議採用，但 NOTICE 保留義務不等於「介面顯著浮水印」義務，也不涵蓋網路使用回饋 | 未採用 |
| GPL-3.0 | 散布修改版時採強 copyleft | 對一般散布有保護，但純網路服務通常不因使用本身觸發原始碼提供義務 | 未採用 |
| AGPL-3.0 | 對網路互動加入原始碼提供義務 | 能處理 SaaS 修改版回饋，但不是以本案指定的圖形介面 Attribution Phrase 為核心 | 未採用 |
| CPAL-1.0 | 以 MPL 1.1 為基礎，加入 Attribution 與 External Deployment 條款 | 同時符合「真開源」、「網路部署回饋」與「介面顯著標示」三項需求 | **最終採用** |
| 全專有授權 | 可全面限制使用、修改與散布 | 不符合公開核心作為開放原始碼基礎設施的定位 | 未採用；僅保留於私有模組、資料與服務層 |

## 二、最終授權架構

| 層級 | 儲存庫／內容 | 授權方式 | 使用邊界 |
|---|---|---|---|
| 公開核心 | `fancy-core` | **CPAL-1.0** | 可使用、修改及散布；須遵守授權、來源標示與網路部署原始碼義務 |
| 律所模組 | `fancy-lawfirm` | 律所專用授權 | 僅限合格律師、律所及其內部人員依條款使用；不得轉授權或代第三人部署 |
| 生產部署 | `fancy-ops` | 私有部署 | 僅以 submodule 引用公開核心，不複製另一份核心來源 |
| 資料與服務 | 裁判家、lawRef、RAG、MaaS、教育訓練 | 另行授權／契約 | 不因公開核心採 CPAL-1.0 而自動開放 |

## 三、必要的 Attribution Phrase

依 `LICENSE` 的 EXHIBIT B，任何圖形介面版本均須顯著顯示下列文字，並連結至指定來源網址：

```text
Powered by FancyAI | SuitAI
```

該文字是本專案正式的介面浮水印與來源標示。登入畫面、應用程式固定頁尾及「關於／授權」視窗均應顯示相同文字；修改版或較大型作品不得移除、遮蔽或以較不顯著方式呈現。

## 四、網路部署與程式碼邊界

依 CPAL-1.0 的 External Deployment 條款，以本軟體或其修改版提供網路服務時，應依正式授權條款提供相應原始碼。[1] 這項義務只處理受 CPAL 覆蓋的核心及其修改，不會把獨立聚合、私有資料庫、第三方服務或未納入 Covered Code 的獨立模組自動改成 CPAL 授權；實際邊界仍應依程式耦合方式與個案事實判斷。

`fancy-ops/app` 必須維持 Git submodule，指向公開的 `fancy-core` 正式提交。私有 overlay、部署密鑰、資料庫憑證、真實客戶資料與 lawRef 授權資訊不得提交至公開核心。

## 五、發布前一致性檢查

正式發布前應確認 `LICENSE`、`NOTICE`、`README.md`、`package.json` 與 `package-lock.json` 均宣告 CPAL-1.0；公開介面三個必要位置均顯示 **Powered by FancyAI | SuitAI**；一般瀏覽連結使用不含 `.git` 的 GitHub 專案頁；clone 與 submodule 指令才使用帶 `.git` 尾碼的 URL；私有儲存庫仍為 Private；安全掃描未發現密鑰、個資或生產資料。

## References

[1]: https://opensource.org/license/cpal_1-0 "Open Source Initiative — Common Public Attribution License 1.0"
