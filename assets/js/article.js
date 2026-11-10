/* ============================================================
   文章頁邏輯：讀取 meta 與 Markdown、上一篇／下一篇、錯誤狀態
   ============================================================ */

function showError(message) {
  document.getElementById("article-meta").innerHTML = "";
  document.getElementById("article-body").innerHTML = "";
  document.getElementById("article-nav").innerHTML = "";
  const el = document.getElementById("error-state");
  el.hidden = false;
  el.innerHTML = `${message}　<a href="index.html">回到所有文章</a>`;
  document.title = `找不到文章｜${SITE_TITLE}`;
}

function renderMeta(article) {
  const tags = article.tags
    .map(
      (t) =>
        `<a class="card__tag" href="index.html#tag=${encodeURIComponent(t)}">#${escapeHtml(t)}</a>`
    )
    .join(" ");
  document.getElementById("article-meta").innerHTML = `
    ${categoryTag(article.category)}
    <h1>${escapeHtml(article.title)}</h1>
    <div class="article__meta-row">
      <span>${escapeHtml(article.date)}</span>
      <span>${tags}</span>
    </div>`;
  document.title = `${article.title}｜${SITE_TITLE}`;
}

function renderNav(articles, index) {
  // articles 已依日期新到舊排序
  const newer = articles[index - 1]; // 較新
  const older = articles[index + 1]; // 較舊
  let html = "";
  if (older) {
    html += `<a class="prev" href="article.html?slug=${encodeURIComponent(older.slug)}">
      <small>較舊</small>${escapeHtml(older.title)}</a>`;
  } else {
    html += `<span></span>`;
  }
  if (newer) {
    html += `<a class="next" href="article.html?slug=${encodeURIComponent(newer.slug)}">
      <small>較新</small>${escapeHtml(newer.title)}</a>`;
  }
  document.getElementById("article-nav").innerHTML = html;
}

async function init() {
  const slug = getQueryParam("slug");
  if (!slug) {
    showError("沒有指定文章。");
    return;
  }

  let articles;
  try {
    articles = await loadArticles();
  } catch (err) {
    showError("文章索引載入失敗，請用本機 HTTP server 開啟（見 README）。");
    return;
  }

  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) {
    showError("找不到這篇文章。");
    return;
  }

  const article = articles[index];
  renderMeta(article);
  renderNav(articles, index);

  try {
    const md = await loadMarkdown(slug);
    document.getElementById("article-body").innerHTML = renderMarkdown(md);
  } catch (err) {
    showError("文章內容載入失敗。");
  }
}

init();
