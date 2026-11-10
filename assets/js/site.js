/* ============================================================
   CyberAI Notes — 共用腳本
   導覽列 / 頁尾 / 資料讀取 / Markdown 渲染
   依賴（固定版本，§7）：marked 12.0.2、DOMPurify 3.1.6
   ============================================================ */

/* 導覽連結：新增導覽項目只改這裡 */
const NAV_ITEMS = [
  { label: "首頁", href: "index.html" },
  { label: "技術文章", href: "index.html#articles" },
  { label: "GitHub", href: "https://github.com/", external: true },
];

/* 分類顯示名稱對照（新增分類時同步更新，§8.3） */
const CATEGORY_LABELS = {
  security: "資安攻防",
  crypto: "密碼學與 PKI",
  ai: "AI 應用",
  lab: "實驗紀錄",
};

const SITE_TITLE = "CyberAI Notes";

/* ---------- 導覽列與頁尾 ---------- */
function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;
  const links = NAV_ITEMS.map((item) => {
    const attrs = item.external ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${item.href}"${attrs}>${item.label}</a>`;
  }).join("");
  el.className = "site-header";
  el.innerHTML = `
    <div class="site-header__inner">
      <a class="site-header__brand" href="index.html">🛡️ ${SITE_TITLE}</a>
      <nav class="site-nav" aria-label="主選單">${links}</nav>
    </div>`;
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.className = "site-footer";
  el.innerHTML = `<p>© 2026 ${SITE_TITLE}．以 CLAUDE.md 規範驅動的資安與 AI 知識庫</p>`;
}

/* ---------- 資料讀取 ---------- */
async function loadArticles() {
  const res = await fetch("data/articles.json");
  if (!res.ok) throw new Error(`無法載入文章索引 (${res.status})`);
  const articles = await res.json();
  /* 依日期由新到舊排序（§4：不手動排序） */
  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

async function loadMarkdown(slug) {
  const res = await fetch(`content/${slug}.md`);
  if (!res.ok) throw new Error(`找不到文章內容 (${res.status})`);
  return res.text();
}

/* ---------- Markdown 渲染（必經 DOMPurify，§7） ---------- */
function renderMarkdown(mdText) {
  const rawHtml = marked.parse(mdText);
  return DOMPurify.sanitize(rawHtml);
}

/* ---------- 共用工具 ---------- */
function categoryTag(category) {
  const label = CATEGORY_LABELS[category] || category;
  return `<span class="tag tag--${category}">${label}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* 在所有頁面載入時渲染外框 */
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
});
