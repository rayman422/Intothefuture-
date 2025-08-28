/* Global client script for intothefuter */

function setupSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#' || href === '#!') return; // allow noop
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function setupNavbarScrollEffect() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  function onScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('bg-gray-950/90', 'backdrop-blur-lg', 'border-yellow-800/20');
    } else {
      nav.classList.remove('bg-gray-950/90', 'backdrop-blur-lg', 'border-yellow-800/20');
    }
  }
  window.addEventListener('scroll', onScroll);
  onScroll();
}

async function fetchJson(pathname, options) {
  const res = await fetch(pathname, options);
  if (!res.ok) {
    const maybe = await res.json().catch(() => ({}));
    const message = (maybe && maybe.error) || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return res.json();
}

function formatDate(iso) {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return iso;
  }
}

function createMainFeaturedHTML(post) {
  const emoji = post.hero_emoji || '🌿';
  const dateStr = formatDate(post.published_at);
  return `
    <article class="lg:col-span-2 bg-gray-800/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]">
      <div class="relative">
        <div class="w-full h-64 bg-gray-700 flex items-center justify-center text-5xl text-amber-400">${emoji}</div>
      </div>
      <div class="p-6 sm:p-8">
        <span class="inline-block bg-amber-500 text-gray-900 font-bold text-sm py-1 px-4 rounded-full mb-4">${post.category.toUpperCase()}</span>
        <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">${post.title}</h3>
        <p class="text-gray-400 text-sm mb-4">By ${post.author || 'Editor'} • ${dateStr} • ${post.read_time_minutes || 5} min read</p>
        <p class="text-gray-300 text-base">${post.summary || ''}</p>
        <a href="/post.html?slug=${encodeURIComponent(post.slug)}" class="inline-block mt-4 text-amber-400 hover:text-amber-300 font-semibold transition-colors duration-300">Read Full Article &rarr;</a>
      </div>
    </article>
  `;
}

function createSidebarCardHTML(post) {
  const dateStr = formatDate(post.published_at);
  return `
    <article class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:translate-x-1">
      <span class="inline-block bg-amber-500/20 text-amber-500 font-bold text-xs py-1 px-3 rounded-full mb-3">${post.category.toUpperCase()}</span>
      <h4 class="text-xl font-semibold text-white mb-2">${post.title}</h4>
      <p class="text-gray-400 text-sm">${post.summary || ''}</p>
      <span class="block mt-3 text-gray-500 text-xs">${dateStr}</span>
      <a href="/post.html?slug=${encodeURIComponent(post.slug)}" class="inline-block mt-3 text-amber-400 hover:text-amber-300 font-semibold">Read &rarr;</a>
    </article>
  `;
}

async function renderFeatured() {
  const container = document.getElementById('featured-articles');
  if (!container) return;
  container.innerHTML = `
    <div class="lg:col-span-2 bg-gray-800/30 rounded-2xl h-96 animate-pulse"></div>
    <div class="grid grid-cols-1 gap-6">
      <div class="bg-gray-800/30 rounded-2xl h-40 animate-pulse"></div>
      <div class="bg-gray-800/30 rounded-2xl h-40 animate-pulse"></div>
      <div class="bg-gray-800/30 rounded-2xl h-40 animate-pulse"></div>
    </div>`;

  try {
    const { posts } = await fetchJson('/api/posts?limit=10');
    const main = posts[0];
    const side = posts.slice(1, 4);
    const sideHtml = side.map(createSidebarCardHTML).join('');
    container.innerHTML = `${createMainFeaturedHTML(main)}<div class="grid grid-cols-1 gap-6">${sideHtml}</div>`;
  } catch (e) {
    container.innerHTML = `<div class="text-red-400">Failed to load posts: ${e.message}</div>`;
  }
}

const CATEGORY_META = {
  'Strain Reviews': { emoji: '🔬', description: 'In-depth strain analysis of effects and flavors.' },
  'Cannabis Culture': { emoji: '🍷', description: 'The sophisticated side of cannabis scenes.' },
  'Luxury Lifestyle': { emoji: '💎', description: 'Premium products, experiences, and wellness.' },
  'Science & Innovation': { emoji: '🧪', description: 'Research and technology pushing the field.' },
  'Product Reviews': { emoji: '🏆', description: 'Concentrates, edibles, accessories—tested.' },
  'Cultivation': { emoji: '🌱', description: 'Growing techniques, terroir, and craft.' }
};

function createCategoryCardHTML(name, count) {
  const meta = CATEGORY_META[name] || { emoji: '🌿', description: '' };
  return `
    <a href="#featured" class="block group bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03]">
      <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-4 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-gray-900">${meta.emoji}</div>
      <h3 class="text-xl sm:text-2xl font-bold text-white transition-colors duration-300 group-hover:text-amber-400">${name}</h3>
      <p class="mt-2 text-gray-400 text-sm">${meta.description}</p>
      <span class="inline-block mt-4 bg-gray-700 text-gray-300 text-xs font-semibold py-1 px-3 rounded-full">${count} Articles</span>
    </a>
  `;
}

async function renderCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="col-span-full h-24 bg-gray-800/30 rounded-2xl animate-pulse"></div>';
  try {
    const { categories } = await fetchJson('/api/categories');
    const counts = Object.fromEntries(categories.map((c) => [c.category, c.count]));
    const ordered = Object.keys(CATEGORY_META);
    const html = ordered
      .map((name) => createCategoryCardHTML(name, counts[name] || 0))
      .join('');
    grid.innerHTML = html;
  } catch (e) {
    grid.innerHTML = `<div class="text-red-400">Failed to load categories: ${e.message}</div>`;
  }
}

function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  const messageElement = document.getElementById('newsletter-message');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    messageElement.classList.remove('text-green-400', 'text-red-400', 'opacity-100');
    try {
      if (!email) throw new Error('Please enter your email');
      const res = await fetchJson('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      messageElement.textContent = res.message || `Thank you for subscribing, ${email}!`;
      messageElement.classList.add('text-green-400', 'opacity-100');
      form.reset();
      setTimeout(() => { messageElement.classList.remove('opacity-100'); messageElement.textContent = ''; }, 3000);
    } catch (err) {
      messageElement.textContent = err.message || 'Subscription failed';
      messageElement.classList.add('text-red-400', 'opacity-100');
    }
  });
}

async function renderPostPage() {
  const root = document.getElementById('post-root');
  if (!root) return;
  const url = new URL(window.location.href);
  const slug = url.searchParams.get('slug');
  if (!slug) {
    root.innerHTML = '<div class="text-red-400">No article specified.</div>';
    return;
  }
  try {
    const { post } = await fetchJson(`/api/posts/${encodeURIComponent(slug)}`);
    const dateStr = formatDate(post.published_at);
    root.innerHTML = `
      <article class="bg-gray-800/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
        <div class="w-full h-60 sm:h-72 bg-gray-700 flex items-center justify-center text-6xl text-amber-400">${post.hero_emoji || '🌿'}</div>
        <div class="p-6 sm:p-10">
          <span class="inline-block bg-amber-500 text-gray-900 font-bold text-xs sm:text-sm py-1 px-3 rounded-full mb-4">${post.category.toUpperCase()}</span>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-3">${post.title}</h1>
          <p class="text-gray-400 text-sm mb-8">By ${post.author || 'Editor'} • ${dateStr} • ${post.read_time_minutes || 5} min read</p>
          <div class="prose prose-invert max-w-none">
            ${post.summary ? `<p class="text-lg text-gray-300">${post.summary}</p>` : ''}
            <div class="mt-6 whitespace-pre-wrap text-gray-300 leading-8">${(post.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
          <div class="mt-10">
            <a href="/index.html#featured" class="text-amber-400 hover:text-amber-300 font-semibold">← Back to articles</a>
          </div>
        </div>
      </article>
    `;
  } catch (e) {
    root.innerHTML = `<div class="text-red-400">Failed to load article: ${e.message}</div>`;
  }
}

function init() {
  setupSmoothAnchors();
  setupNavbarScrollEffect();
  setupNewsletter();
  renderFeatured();
  renderCategories();
  renderPostPage();
}

document.addEventListener('DOMContentLoaded', init);

