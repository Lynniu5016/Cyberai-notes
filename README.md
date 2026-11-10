# CyberAI Notes

資安攻防、密碼學／PKI 與 AI 應用的學習筆記與實作紀錄。純靜態網站，內容與版面分離，以 [CLAUDE.md](./CLAUDE.md) 作為 AI 協作規範，讓新增內容可以被重複、一致地產出。

## 線上瀏覽

GitHub Pages：`https://<你的帳號>.github.io/cyberai-notes/`

## 專案特色

- **內容與版面分離**：文章寫成 Markdown（`content/<slug>.md`），索引放在 `data/articles.json`，網頁只負責讀取與渲染。新增一篇文章 = 新增一個 `.md` + 在 JSON 加一筆，完全不碰 HTML。
- **規則驅動**：`CLAUDE.md` 定義目的、架構、命名、內容模板、視覺風格、SOP 與禁止事項，AI 讀完即可一致地擴充網站。
- **零建置**：不使用框架、不需 npm、無 build step，直接部署到 GitHub Pages。
- **安全優先**：Markdown 渲染一律經 DOMPurify 淨化；惡意指標 defang；範例使用文件用網段。

## 本機預覽

`fetch` 在 `file://` 下無法運作，必須用 HTTP server：

```bash
python3 -m http.server 8000
# 瀏覽 http://localhost:8000
```

## 目錄結構

```
├── CLAUDE.md               AI 協作規範（唯一規則來源）
├── AGENTS.md               指向 CLAUDE.md
├── index.html              首頁
├── article.html            文章頁模板
├── assets/
│   ├── css/style.css       全站唯一樣式檔
│   ├── js/site.js          共用：導覽列、頁尾、資料讀取、Markdown 渲染
│   ├── js/app.js           首頁邏輯
│   └── js/article.js       文章頁邏輯
├── content/<slug>.md       文章本體
└── data/articles.json      文章索引
```

## 新增一篇文章

詳見 `CLAUDE.md` §8.1。簡述：

1. 依 §3 決定 slug。
2. 依 §5 模板建立 `content/<slug>.md`。
3. 在 `data/articles.json` 陣列最後加一筆。
4. 本機 server 確認首頁出現新卡片、點進去可正常閱讀。
