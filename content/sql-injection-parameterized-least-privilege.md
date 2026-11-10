# SQL Injection：Parameterized Query 修根因，Least Privilege 限範圍

> 參數化查詢處理 SQL Injection 的 root cause，最小權限只負責縮小損害範圍——兩者分工不能混為一談。

## 背景

本篇對應跨層 IoT 實驗的應用／資料層，驗證的是應用程式的資料存取邊界（Code-Data Boundary）與資料庫授權。實驗直接呼叫 data-access function 與實驗用 PostgreSQL，以產生可重現的證據。

## 核心概念

把使用者輸入用字串拼接（Raw SQL String Interpolation）塞進 SQL，使用者就有機會改變 SQL 的語意：

```text
正常輸入　　　sensor-alpha      → 回傳 1 row
注入輸入　　　' OR '1'='1       → 回傳 4 rows（條件恆真）
參數化相同輸入　　　　　　　　　　→ 回傳 0 rows
參數化正常查詢                  → 回傳 1 row
```

Parameterized Query 把 SQL Code 與 User Data 分開，讓同一個惡意字串只能被當成資料值，不會被當成 SQL 語法執行。因此參數化查詢屬於 **PREVENT**，直接處理 SQL Injection 的 root cause。

## 偵測與防禦

Least Privilege（最小權限）不會修復 SQL Injection，但能限制損害範圍（blast radius）。實驗中的唯讀角色可以讀允許的資料表，但敏感 SELECT、UPDATE、DROP 都被資料庫權限拒絕，DB 狀態維持不變：

| 檢查 | 結果 |
|---|---|
| 正常查詢 | 1 row |
| SQL Injection | 4 rows |
| 參數化 + 注入輸入 | 0 rows |
| 敏感 SELECT | DENIED |
| 未授權 UPDATE | DENIED |
| 未授權 DROP | DENIED |
| DB state | 4 → 4（未改變）|

對應 ATT&CK：SQL Injection 可對應 T1190（Exploit Public-Facing Application）；資料庫層的角色權限控制則是降低其後續影響的緩解措施。

分工要講清楚：**Parameterized Query 修根因，Least Privilege 限範圍**。只做最小權限而不做參數化，注入仍會發生、只是損害被框住；只做參數化而給應用程式過大的 DB 權限，一旦有其他漏洞就會全面失守。兩者是縱深防禦裡的不同層。

## 重點整理

- SQL Injection 的 root cause 是把使用者輸入當成 SQL 語法執行。
- 參數化查詢把 code 與 data 分開，是直接 PREVENT 的手段。
- 最小權限不修漏洞，只縮小 blast radius。
- 兩者分屬不同防禦層，不能互相取代。

## 參考資料

- [OWASP — SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [MITRE ATT&CK T1190 — Exploit Public-Facing Application](https://attack.mitre.org/techniques/T1190/)
