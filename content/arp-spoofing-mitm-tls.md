# ARP Spoofing 與 MITM：TLS 能保護什麼、不能保護什麼

> 在隔離的 Docker L2 網路中重現中間人攻擊，驗證 TLS 在被劫持的路徑上究竟保護了哪一層。

## 背景

物聯網安全不是只看裝置本身是否安全，而是一條由裝置、網路、傳輸、應用程式到資料庫構成的信任鏈。不同攻擊發生在不同的信任邊界（Trust Boundary），單一控制無法處理所有風險。

本篇對應跨層實驗中的網路層：在隔離的 Docker L2 網路建立 Victim、Gateway、Attacker 三個節點，驗證 ARP 對應被竄改後，流量是否真的經過攻擊者，以及 HTTP 與 HTTPS 在同一條 MITM 路徑上的差異。

## 核心概念

ARP（Address Resolution Protocol）的工作是把 IP 位址對應到 MAC 位址，但傳統 ARP 缺乏強式身分驗證。攻擊者可以送出偽造的 ARP Reply，讓 Victim 把 Gateway 的 IP 對應到 Attacker 的 MAC：

```text
攻擊前：10.77.0.2 → 合法 Gateway MAC
攻擊後：10.77.0.2 → Attacker MAC
```

關鍵在於攻擊者取得轉送路徑後必須開啟 IP forwarding，Victim 才能繼續與 Gateway 通訊，攻擊者也才真正形成中間人（Man-in-the-Middle）。若攻擊者不做 forwarding，結果只是服務中斷（DoS），不能稱為 MITM。

## 實作步驟

實驗在隔離的 Docker L2 網路中進行。驗證順序：feasibility gate → MITM path → DoS contrast → HTTP payload exposure → HTTPS payload protection → TLS certificate validation → regression，全部需通過。

ARP Table 的實際變化是攻擊成功最直觀的證據：

```text
攻擊前　Gateway IP 10.77.0.2 → 合法 MAC
攻擊後　同一 IP           → 被改綁到 Attacker MAC
```

在同一條 MITM 路徑上比較明文與加密流量：

```text
HTTP  capture 中測試用 token 出現 2 次
HTTPS capture 中測試用 token 出現 0 次
```

這代表 TLS 並沒有阻止 ARP Spoofing、也沒有修復被劫持的轉送路徑，但能在敵意網路路徑上保護應用層 payload 的機密性與完整性。

憑證驗證（Certificate Validation）的對照：

```text
Trusted CA   → 連線成功（exit 0）
Untrusted CA → curl rc=60，HTTP code 顯示 000
```

這裡的 `000` 不是伺服器回傳的 HTTP 狀態，而是 TLS handshake 在進入 HTTP Response 之前就因憑證驗證失敗而中止。

## 偵測與防禦

| 控制 | 作用 | 對應 ATT&CK |
|---|---|---|
| TLS + 憑證驗證 | 在敵意路徑上保護 payload 機密性與完整性 | 緩解 T1557（Adversary-in-the-Middle）|
| Dynamic ARP Inspection (DAI) | 交換器比對 DHCP Snooping 綁定，丟棄偽造 ARP | 偵測／阻擋 T1557.002 |
| 網路分段 Segmentation | 縮小同一 L2 廣播域，限制可被欺騙的範圍 | 降低影響範圍 |

偵測面向：監看同一 IP 的 MAC 對應是否短時間內改變、是否出現大量非請求式（gratuitous）ARP Reply，都是 ARP Spoofing 的指標。

要強調的是：**TLS 不防 ARP**。攻擊停止後 ARP 對應被恢復，HTTP 與 HTTPS 均可正常使用——防禦與復原不是「封鎖一切」，而是在恢復可信網路狀態後維持合法服務。

## 重點整理

- ARP 缺乏身分驗證，偽造 ARP Reply 即可讓 Victim 把 Gateway IP 綁到攻擊者 MAC。
- 真正的 MITM 需要攻擊者開啟 IP forwarding，否則只是 DoS。
- TLS 無法阻止 L2 層的攔截，但能保護被攔截流量的 payload。
- 憑證驗證失敗會在 TLS handshake 階段就中止連線，對應 `curl rc=60` 與 `HTTP 000`。
- L2 層的防禦要靠 DAI 與網路分段，而不是 TLS。

## 參考資料

- [MITRE ATT&CK T1557 — Adversary-in-the-Middle](https://attack.mitre.org/techniques/T1557/)
- [RFC 826 — An Ethernet Address Resolution Protocol](https://www.rfc-editor.org/rfc/rfc826)
