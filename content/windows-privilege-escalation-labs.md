# Windows 權限提升實作：未加引號服務路徑、Potato 與備份特權

> 取得初始存取只是攻擊鏈的起點。本篇整理數個 Windows 本地提權 lab 的手法與對應防禦。

## 背景

取得系統的初始存取權限往往只是攻擊鏈的起點，要控制整台主機或擴大戰果，攻擊者必須進行權限提升。許多 Windows 提權漏洞不是源自複雜的程式碼缺陷，而是組態失當與未落實最小權限——像是未加引號的服務路徑、不當的資料夾寫入權限，以及特權帳號未嚴加控管。

本篇環境為教育用隔離靶機（Kali 攻擊端 + Windows 靶機），工具包含 Python 3 HTTP server、Netcat、FreeRDP、MinGW、winPEAS、Seatbelt、PowerUp、SigmaPotato。

## 核心概念

### 自動化列舉（Automated Enumeration）

手動摸索耗時，自動化工具能快速定位敏感憑證、DPAPI MasterKey、已安裝軟體與組態弱點。

- winPEAS：掃描後用 `Select-String` 過濾 `Checking for DPAPI Master Keys` 區段並帶上下文，找出 MasterKey 路徑。
- Seatbelt（GhostPack）：以 `-group=all` 全面列舉，搭配 `Select-String` 搜 `DisplayVersion` 可枚舉第三方軟體版本（如 XAMPP）。

### 未加引號的服務路徑（Unquoted Service Path）

當 Windows 服務的 `ImagePath` 含空格又未加引號，且某層父目錄允許一般使用者寫入時，可被劫持。例如：

```text
ImagePath：C:\Program Files\Enterprise Apps\Current Version\GammaServ.exe
```

Windows 解析未加引號路徑時會依序嘗試 `C:\Program.exe`、`C:\Program Files\Enterprise.exe`…，若攻擊者能在可寫入的中間層放入惡意執行檔，服務啟動時就會執行它。

用 `icacls` 檢查發現中間目錄帶有 `BUILTIN\Users:(OI)(CI)(RX,W)`，代表一般使用者在此有寫入（W）權限。再用 PowerUp 的 `Write-ServiceBinary` 建立惡意服務二進位檔（新增管理員帳號），或用 MinGW 交叉編譯一支新增管理員的 C 程式放進可寫入路徑，服務重啟即觸發。

### 已知漏洞利用與特權濫用

- **核心漏洞（CVE-2023-29360）**：以低權限使用者執行公開 exploit binary，將行程權限提升至 `NT AUTHORITY\SYSTEM`，再讀取管理員桌面 flag。
- **Potato 系列（SigmaPotato）**：帳號若 `whoami /priv` 顯示 `SeImpersonatePrivilege` 為 Enabled，即可做 Token 模擬提權，攔截 SYSTEM Token 後建立管理員帳號。
- **備份特權（SeBackupPrivilege）**：具備 `SeBackupPrivilege` / `SeRestorePrivilege` 時，用 `robocopy /B`（備份模式）可繞過一般 ACL，複製出其他使用者桌面的機敏檔案。此 lab 也示範了憑證重用（Credential Reuse）橫向移動：在使用者筆記中發現被重置的預設密碼 `<redacted-password>`，據此以另一帳號登入。

## 偵測與防禦

| 攻擊面 | 防禦 | 對應 ATT&CK |
|---|---|---|
| 未加引號服務路徑 | 服務路徑一律加引號；移除中間目錄的一般使用者寫入權限 | T1574.009 |
| Token 模擬（Potato）| 審視服務帳號的 `SeImpersonatePrivilege`，非必要不授予 | T1134（Access Token Manipulation）|
| 備份特權濫用 | 嚴格控管 `SeBackupPrivilege` / `SeRestorePrivilege` | T1078 / T1222 |
| 憑證重用 | 預設密碼強制首次登入變更；密碼不寫在使用者可讀的筆記 | T1078（Valid Accounts）|
| 核心漏洞 | 及時套用安全更新 | T1068（Exploitation for Priv Esc）|

偵測面向：監看非預期的新增本機管理員帳號、服務二進位檔被改寫、`robocopy /B` 等備份模式操作，以及短時間內的 `whoami /priv` 列舉行為。

## 重點整理

- 多數 Windows 提權來自組態與權限配置，而非程式漏洞。
- 未加引號服務路徑 + 可寫入中間目錄 = 可劫持的服務二進位檔。
- `SeImpersonatePrivilege` 與 `SeBackupPrivilege` 是高價值特權，需嚴控。
- 自動化列舉工具大幅縮短攻擊者定位弱點的時間，防守方也應定期自我掃描。

## 參考資料

- [MITRE ATT&CK T1574.009 — Path Interception by Unquoted Path](https://attack.mitre.org/techniques/T1574/009/)
- [MITRE ATT&CK T1134 — Access Token Manipulation](https://attack.mitre.org/techniques/T1134/)
