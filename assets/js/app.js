/* ============================================================
   首頁邏輯：文章卡片、分類篩選、搜尋、tag 篩選
   ============================================================ */

let allArticles = [];
let activeCategory = "all"; // "all" 或某個分類值
let searchTerm = "";
let activeTag = null;

const FILTER_CATEGORIES = ["all", "security", "crypto", "ai", "lab"];
const FILTER_LABELS = { all: "全部", ...CATEGORY_LABELS };

function buildFilterButtons() {
  const container = document.getElementById("filters");
  FILTER_CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = FILTER_LABELS[cat];
    btn.dataset.category = cat;
    btn.setAttribute("aria-pressed", cat === "all" ? "true" : "false");
    btn.addEventListener("click", () => {
      activeCategory = cat;
      activeTag = null; // 切分類時清除 tag 篩選
      updateFilterButtons();
      render();
    });
    container.appendChild(btn);
  });
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.setAttribute(
      "aria-pressed",
      btn.dataset.category === activeCategory ? "true" : "false"
    );
  });
}

function cardHtml(a) {
  const tags = a.tags
    .map((t) => `<span class="card__tag">#${escapeHtml(t)}</span>`)
    .join("");
  return `
    <a class="card" href="article.html?slug=${encodeURIComponent(a.slug)}">
      ${categoryTag(a.category)}
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.summary)}</p>
      <div class="card__tags">${tags}</div>
      <div class="card__meta">
        <span>${escapeHtml(a.date)}</span>
      </div>
    </a>`;
}

function filterArticles() {
  return allArticles.filter((a) => {
    if (activeCategory !== "all" && a.category !== activeCategory) return false;
    if (activeTag && !a.tags.includes(activeTag)) return false;
    if (searchTerm) {
      const haystack = (
        a.title +
        " " +
        a.summary +
        " " +
        a.tags.join(" ")
      ).toLowerCase();
      if (!haystack.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });
}

function render() {
  const list = document.getElementById("article-list");
  const empty = document.getElementById("empty-state");
  const results = filterArticles();

  if (results.length === 0) {
    list.innerHTML = "";
    empty.hidden = false;
    empty.textContent = activeTag
      ? `沒有標籤為「${activeTag}」的文章。`
      : "這個分類還沒有文章。";
  } else {
    empty.hidden = true;
    list.innerHTML = results.map(cardHtml).join("");
  }
}

/* tag 篩選：網址 index.html#tag=<encodeURIComponent(tag)>（路線 #4） */
function applyTagFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#tag=(.+)$/);
  if (match) {
    const tag = decodeURIComponent(match[1]);
    const exists = allArticles.some((a) => a.tags.includes(tag));
    activeTag = exists ? tag : null;
    activeCategory = "all";
    updateFilterButtons();
  } else {
    activeTag = null;
  }
}

async function init() {
  buildFilterButtons();
  try {
    allArticles = await loadArticles();
  } catch (err) {
    document.getElementById("article-list").innerHTML = "";
    const empty = document.getElementById("empty-state");
    empty.hidden = false;
    empty.textContent = "文章索引載入失敗，請用本機 HTTP server 開啟（見 README）。";
    document.getElementById("article-count").textContent = "載入失敗";
    return;
  }

  document.getElementById("article-count").textContent =
    `${allArticles.length} 篇筆記`;

  const search = document.getElementById("search-input");
  search.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    render();
  });

  applyTagFromHash();
  window.addEventListener("hashchange", () => {
    applyTagFromHash();
    render();
  });

  render();
}

init();
