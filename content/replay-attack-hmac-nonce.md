# Replay Attack 防禦：HMAC、Nonce 與 Timestamp 的分工

> 重放攻擊的核心不是破解加密，而是把一份合法請求原封不動再送一次；防禦要同時處理「真實性」與「新鮮度」。

## 背景

本篇對應跨層 IoT 實驗的訊息層。重放攻擊（Replay Attack）不需要破解任何加密，它把一份原本合法的請求（Request）完整地再送一次。如果伺服器只判斷請求的格式是否正確、來源是否合法，而沒有判斷「這是不是第一次、是不是現在的請求」，就可能重複執行同一個動作。

## 核心概念

在沒有防護的情境下，重放一份合法請求會讓同一個動作被執行兩次：

```text
未防護：first request → action_count = 1
        replay        → action_count = 2

已防護：first request → action_count = 1
        exact replay  → 401，action_count 保持 1
```

防禦要靠三個控制的組合，各司其職：

| 控制 | 目的 |
|---|---|
| HMAC-SHA256 | 驗證訊息來源與內容是否遭修改（真實性 + 完整性）|
| Nonce | 保證一次性，擋掉完全相同的重放 |
| Timestamp | 限制請求可被接受的時間範圍（新鮮度）|
| Per-Device Secret | 避免整個 fleet 共用同一把金鑰 |

一個實作上的關鍵：Client 要對**實際傳送的原始 body bytes**、timestamp 與 nonce 進行簽章；Server 也必須驗證收到的 exact bytes，而不能先 parse JSON 再重新 serialize——否則位元組不同、但語意相同的訊息可能被誤判成同一則訊息，或反過來讓簽章驗證失敗。

## 偵測與防禦

- **真實性**由 HMAC 保證：攻擊者沒有 device secret 就無法產生合法的 HMAC，修改過的請求會驗章失敗。
- **新鮮度**由 Nonce + Timestamp 共同保證：Timestamp 把可接受的請求限制在一個時間窗內，Nonce 確保同一個請求在窗內也只能用一次。
- **影響範圍**由 Per-Device Secret 限制：一把金鑰外洩不會波及整個裝置群。

殘餘風險（Residual Risk）必須說清楚：

- 若 device secret 本身被竊，攻擊者可以自行製造新的合法 HMAC，重放防護對持有金鑰者無效。
- 若 nonce cache 只存在記憶體，Server 重啟後已使用的 nonce 資訊會消失，重放窗口可能重新打開。

所以重放防護並不等於解決所有身分與金鑰風險，它只負責「真實性 + 新鮮度」這一層。

## 重點整理

- 重放攻擊靠重送合法請求達成，與破解加密無關。
- HMAC 管真實性與完整性，Nonce + Timestamp 管新鮮度，三者缺一不可。
- 簽章與驗章都要針對原始 bytes，不要 parse 後重新序列化。
- 金鑰外洩與記憶體型 nonce cache 是主要殘餘風險。

## 參考資料

- [RFC 2104 — HMAC: Keyed-Hashing for Message Authentication](https://www.rfc-editor.org/rfc/rfc2104)
- [OWASP — Testing for Replay](https://owasp.org/www-project-web-security-testing-guide/)
