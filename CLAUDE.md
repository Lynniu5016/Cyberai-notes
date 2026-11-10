# CyberAI Notes — AI 協作規範

> 本文件是這個專案的唯一規則來源。新增或修改任何內容前，先讀完本文件；規則與使用者當下指示衝突時，以使用者指示為準，並在回覆中說明哪條規則被覆寫。

## 1. 專案目的

CyberAI Notes 是一個靜態知識庫網站，記錄作者在資安（滲透測試、偵測與鑑識、釣魚分析）、密碼學／PKI 與 AI 應用上的學習筆記與實作紀錄。

- **讀者**：資安／資工背景的學生與工程師，具備基本程式與網路概念。
- **原則**：每篇筆記都要能「看完就能重現或理解」，資安類筆記必須同時寫攻擊原理與防禦／偵測方式。
- **部署**：GitHub Pages，純靜態，無 build step。

## 2. 架構總覽：內容與版面分離

文章內容一律寫成 Markdown，網頁只負責讀取並渲染。**新增文章 = 新增一個 `.md` 檔 + 在 `data/articles.json` 加一筆資料**，不需要、也不可以修改任何 HTML。

```
/
├── CLAUDE.md               ← 本文件
├── AGENTS.md               ← 只有一行，指向本文件（給其他 AI 工具）
├── README.md               ← 給人看的專案說明
├── index.html              ← 首頁：讀取 articles.json，渲染文章卡片與分類篩選
├── article.html            ← 文章頁模板：article.html?slug=<slug>
├── assets/
│   ├── css/style.css       ← 全站唯一樣式檔（含設計變數）
│   ├── js/site.js          ← 共用：導覽列、頁尾、資料讀取、Markdown 渲染
│   └── images/<slug>/      ← 每篇文章的圖片放在以 slug 命名的資料夾
├── content/<slug>.md       ← 文章本體
└── data/articles.json      ← 文章索引（首頁與文章頁的資料來源）
```

### 頁面版面（由上到下）

所有頁面共用同一個外框：`#site-header`（導覽列）→ `<main>` → `#site-footer`（頁尾）。以下只描述 `<main>` 的內容。

**首頁 `index.html`**

| 順序 | 區塊 | id / class | 內容 | 資料來源 |
|---|---|---|---|---|
| 1 | 標題區 | `#hero` | 網站名稱、一句話介紹、文章總數 | 固定文字 + `articles.json` 筆數 |
| 2 | 分類篩選 | `#filters` | 「全部」+ §4 四個分類按鈕，點擊後只顯示該分類 | §4 分類表 |
| 3 | 文章卡片網格 | `#article-list` | 每張 `.card`：分類 `.tag`、標題、摘要、日期、tags；整張卡片連到 `article.html?slug=<slug>` | `articles.json`，依日期新到舊 |
| 4 | 空狀態 | `.callout` | 篩選後沒有文章時顯示「這個分類還沒有文章」 | — |

卡片網格：寬度 ≥ 768px 兩欄，以下單欄。

**文章頁 `article.html?slug=<slug>`**

| 順序 | 區塊 | id / class | 內容 | 資料來源 |
|---|---|---|---|---|
| 1 | 返回連結 | `.btn` | 「← 回到所有文章」 | — |
| 2 | 文章標頭 | `#article-meta` | 分類 `.tag`、標題、日期、tags | `articles.json` 對應那筆 |
| 3 | 內文 | `#article-body` | Markdown 渲染結果（經 DOMPurify） | `content/<slug>.md` |
| 4 | 上一篇／下一篇 | `#article-nav` | 依日期排序的前後篇連結，沒有則不顯示 | `articles.json` |
| 5 | 錯誤狀態 | `.callout` | slug 不存在或讀檔失敗時顯示「找不到這篇文章」與返回連結，不可顯示空白頁 | — |

頁面 `<title>` 設為「文章標題｜CyberAI Notes」。

## 3. 檔案命名規則

| 項目 | 規則 | 正確 | 錯誤 |
|---|---|---|---|
| slug | 小寫英文、數字、連字號（kebab-case），3–60 字元 | `webauthn-passkey-flow` | `WebAuthn_Flow`、`筆記1` |
| 文章檔 | `content/<slug>.md`，檔名必須與 slug 完全一致 | `content/ct-merkle-audit-path.md` | `content/articles/ct.md` |
| 圖片 | `assets/images/<slug>/<序號>-<描述>.png`，序號兩位數 | `assets/images/ct-merkle-audit-path/01-tree.png` | `assets/img1.png` |
| 日期 | ISO 8601 `YYYY-MM-DD` | `2026-11-10` | `11/10`、`2026/11/10` |

slug 一經發布就不可更改（網址會失效）。

## 4. 文章索引格式（`data/articles.json`）

陣列中每一筆的欄位如下，**全部必填**，不可新增其他欄位：

```json
{
  "slug": "ct-merkle-audit-path",
  "title": "憑證透明度：Merkle 樹稽核路徑怎麼驗證",
  "category": "crypto",
  "tags": ["Certificate Transparency", "Merkle Tree"],
  "date": "2026-11-10",
  "summary": "一段 40–80 字的摘要，會顯示在首頁卡片上。"
}
```

- 新文章加在陣列**最後面**；排序由 `site.js` 依 `date` 由新到舊處理，不要手動排序。
- `tags` 1–4 個，沿用既有 tag 的寫法（先搜尋 `articles.json` 是否已有相同概念的 tag）。
- 修改後必須是合法 JSON（無結尾逗號）。

### 分類（固定清單）

| category 值 | 顯示名稱 | CSS class | 適用內容 |
|---|---|---|---|
| `security` | 資安攻防 | `tag--security` | 滲透、弱點、偵測、鑑識、ATT&CK |
| `crypto` | 密碼學與 PKI | `tag--crypto` | 加密機制、憑證、認證協定 |
| `ai` | AI 應用 | `tag--ai` | LLM、模型應用、AI 輔助資安 |
| `lab` | 實驗紀錄 | `tag--lab` | 課程 lab、CTF、環境建置 |

只能使用上表的值。若內容不屬於任何分類，先詢問使用者，不要自行新增（新增流程見 §8.3）。

## 5. 文章內容模板（`content/<slug>.md`）

依下列順序撰寫，`##` 標題文字必須與模板完全相同（括號註記不要寫進標題）。各段落規則：

| 段落 | 是否必填 |
|---|---|
| 背景、核心概念、重點整理、參考資料 | 必填 |
| 實作步驟 | 選填，沒有內容時整段刪除 |
| 偵測與防禦 | `security` 分類必填，其他分類選填 |

```markdown
# 文章標題（與 articles.json 的 title 相同）

> 一句話說明這篇在解決什麼問題。

## 背景
為什麼需要這個技術／這個問題從哪來。

## 核心概念
原理說明。複雜流程優先附圖（放在 assets/images/<slug>/）。

## 實作步驟
可重現的步驟，指令放在標明語言的程式碼區塊。

## 偵測與防禦
對應的偵測方式、log 來源、緩解措施；有對應 MITRE ATT&CK 技術時寫出 ID（如 T1003.001）。

## 重點整理
3–5 點條列。

## 參考資料
- [來源名稱](URL)
```

### 寫作規則

- 正體中文、台灣用語；技術名詞第一次出現時附英文原文，例如「憑證透明度（Certificate Transparency）」。
- 只用標準 Markdown，不要在 `.md` 裡寫 HTML 或 inline style。
- 程式碼區塊一律標語言（`bash`、`python`、`powershell`…）。
- 圖片必須寫 alt，路徑以網站根目錄為基準、開頭不加 `/`（文章是由根目錄的 `article.html` 渲染）：`![Merkle 樹結構](assets/images/ct-merkle-audit-path/01-tree.png)`。

## 6. 視覺風格

所有顏色、字體、間距都定義為 `assets/css/style.css` 開頭的 CSS 變數，頁面與元件只能引用變數，不可寫死色碼。

| 變數 | 用途 |
|---|---|
| `--bg` / `--surface` | 頁面背景 / 卡片與區塊背景（深色系） |
| `--text` / `--text-muted` | 主要文字 / 次要文字 |
| `--accent` | 連結、強調、焦點框 |
| `--cat-security` `--cat-crypto` `--cat-ai` `--cat-lab` | 四個分類標籤色 |
| `--font-sans` | `"Inter", "Noto Sans TC", system-ui, sans-serif` |
| `--font-mono` | `"JetBrains Mono", ui-monospace, monospace` |

- 整體：深色科技風、單欄閱讀、內文最大寬度 72ch、行高 1.75（中文長文需要比英文更寬）。
- 可用元件 class：`.card`、`.tag`、`.tag--<category>`、`.callout`、`.btn`。需要新元件時先詢問使用者。
- 必須支援手機寬度（≥ 360px）與鍵盤操作（可見的 focus 樣式）。

## 7. 技術限制

- 不使用框架、不使用 npm、不加 build step。
- 允許的外部資源只有以下三項，不可新增其他 CDN 或套件，也不可升級版本（除非使用者要求）：
  - `marked` 12.0.2（cdnjs）：Markdown 轉 HTML
  - `DOMPurify` 3.1.6（cdnjs）：渲染前淨化 HTML，**所有 Markdown 輸出都必須經過 `DOMPurify.sanitize()` 才能放進頁面**
  - Google Fonts：只載入 Inter、Noto Sans TC、JetBrains Mono（§6 字體）
- 所有站內連結、`fetch` 路徑、圖片路徑一律用相對路徑，開頭不加 `/`。GitHub Pages 的網址是 `<帳號>.github.io/<repo>/`，以 `/` 開頭的路徑會指到錯誤位置。檔名大小寫必須與引用處完全一致（GitHub Pages 區分大小寫）。
- 導覽列與頁尾只定義在 `site.js` 的 `renderHeader()` / `renderFooter()`，各 HTML 頁面只放 `<header id="site-header">` 與 `<footer id="site-footer">` 佔位。新增導覽連結時只改 `site.js` 的 `NAV_ITEMS` 陣列。
- 本機預覽必須用 HTTP server（`fetch` 在 `file://` 下無法運作）：`python3 -m http.server 8000`。

## 8. 標準作業流程

### 8.1 新增一篇文章

1. 確認分類屬於 §4 的固定清單；不確定就問使用者。
2. 依 §3 決定 slug，確認 `content/` 下沒有同名檔案。
3. 依 §5 模板建立 `content/<slug>.md`。
4. 圖片放進 `assets/images/<slug>/`。
5. 在 `data/articles.json` 陣列最後加一筆（§4 格式）。
6. 執行 §9 檢查清單，並在回覆中列出新增／修改的檔案。

### 8.2 修改既有文章

只改該篇的 `.md` 與 `articles.json` 中對應那一筆，不要順手改其他文章的用詞或格式。

### 8.3 新增分類（僅在使用者明確要求時）

同時修改三處：本文件 §4 分類表、`style.css` 的 `--cat-<name>` 變數與 `.tag--<name>`、`site.js` 的分類顯示名稱對照表。

### 8.4 新增一種頁面（例如 `about.html`）

複製 `article.html` 的 `<head>` 與 header/footer 佔位結構，只用 §6 的既有 class，並在 `NAV_ITEMS` 加入連結。完成後在 §2「頁面版面」補上這個頁面的區塊表，讓之後的修改有依據。

## 9. 完成前檢查清單

- [ ] slug、檔名、`articles.json` 三者一致
- [ ] `articles.json` 是合法 JSON，且所有欄位都有填
- [ ] 文章段落順序符合 §5；security 類有「偵測與防禦」
- [ ] 圖片路徑可讀取、都有 alt
- [ ] 沒有以 `/` 開頭的路徑；檔名大小寫與引用一致
- [ ] 在本機 server 下首頁出現新卡片，點進去可正常閱讀
- [ ] 沒有修改 `style.css` 變數、`site.js` 或其他文章（除非任務本身要求）

## 10. 禁止事項

- **不可捏造內容**：實驗結果、數據、截圖說明、指令輸出必須來自使用者提供的資料；缺少時寫一行 `> ⚠️ TODO：待補實驗結果` 並在回覆中提醒使用者。
- **資安內容安全**：
  - 惡意網址、IP、網域一律 defang（`hxxps://evil[.]example`），不可放可點擊的惡意連結。
  - 不放可直接武器化的完整 exploit 或 payload，以原理與防禦為主。
  - 不放任何真實帳密、API key、token、內部主機名稱或個人資料；範例一律用 `example.com`、`192.0.2.0/24`（RFC 5737 文件用網段）。
- 不可把文章內容直接寫進 HTML。
- 不可刪除或重新命名既有文章（slug 不可變）。

## 11. 擴充路線（這個專案接下來怎麼做）

依優先順序排列。使用者說「繼續做」或「下一步」時，從最上面尚未完成的項目開始；一次只做一項，完成後把狀態改為 ✅ 並註明日期。每項都必須遵守 §7 技術限制。

| 優先 | 功能 | 狀態 | 實作方式與限制 |
|---|---|---|---|
| 1 | 首頁、文章頁、兩篇範例文章 | ⬜ | 依 §2 頁面版面完成，作為後續功能的基礎 |
| 2 | 文章目錄（TOC） | ⬜ | 由 `site.js` 讀取內文的 `##` 標題自動產生，並替每個標題加上 id（`sec-1`、`sec-2`…），放在 `#article-meta` 與 `#article-body` 之間；標題少於 3 個時不顯示 |
| 3 | 站內搜尋 | ⬜ | 在首頁 `#filters` 加搜尋框，只比對 `articles.json` 的 title、summary、tags，不載入全文、不加套件 |
| 4 | Tag 篩選 | ⬜ | 點擊卡片上的 tag 等同篩選該 tag，網址用 `index.html#tag=<encodeURIComponent(tag)>`，可分享；讀取時要 decode 並處理不存在的 tag |
| 5 | 程式碼一鍵複製 | ⬜ | 在 `#article-body` 每個程式碼區塊右上角加複製按鈕，使用 Clipboard API |
| 6 | 系列文章 | ⬜ | `articles.json` 新增選填欄位 `series`（須先更新 §4 欄位表），文章頁底部列出同系列文章 |

新增路線項目時，加在表格最後並寫明實作方式；不要在未列入路線的情況下自行加功能。
