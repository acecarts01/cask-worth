import { getSearchItems } from './search-data.js';

/**
 * Site-wide Search Component
 * Provides a UI for searching products, blogs, and info.
 */
export function initSearch() {
  const searchBtn = document.querySelector('.search-trigger') || document.querySelector('a[href="/search/"]');
  if (!searchBtn) return;

  // Create search overlay if it doesn't exist
  let overlay = document.getElementById('search-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'search-overlay';
    overlay.style = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
      display: none; flex-direction: column; align-items: center; padding: 100px 20px;
      backdrop-filter: blur(10px);
    `;
    overlay.innerHTML = `
      <div style="width: 100%; max-width: 600px; position: relative;">
        <input type="text" id="search-input" placeholder="Search products, blogs..." style="
          width: 100%; padding: 20px 60px 20px 25px; border-radius: 12px; border: 1.5px solid #c9941a;
          background: #fff; font-size: 20px; outline: none; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
        <button id="close-search" style="
          position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
          background: none; border: none; font-size: 24px; cursor: pointer; color: #666;
        ">✕</button>
        <div id="search-results" style="
          margin-top: 20px; background: #fff; border-radius: 12px; overflow: hidden;
          max-height: 400px; overflow-y: auto; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        "></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const input = document.getElementById('search-input');
  const resultsDiv = document.getElementById('search-results');
  const closeBtn = document.getElementById('close-search');

  // Toggle overlay
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    overlay.style.display = 'flex';
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  // Close on Esc
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      overlay.style.display = 'none';
    }
  });

  // Search logic
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (query.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    const items = getSearchItems();
    const filtered = items.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.category && item.category.toLowerCase().includes(query))
    ).slice(0, 8);

    if (filtered.length > 0) {
      resultsDiv.innerHTML = filtered.map(item => `
        <a href="${item.url}" style="
          display: flex; align-items: center; padding: 15px 20px; text-decoration: none;
          color: #333; border-bottom: 1px solid #eee; transition: background 0.2s;
        " onmouseover="this.style.background='#fdf8f0'" onmouseout="this.style.background='#fff'">
          <span style="font-size: 14px; color: #c9941a; background: #fdf8f0; padding: 2px 8px; border-radius: 4px; margin-right: 12px; font-weight: 700; text-transform: uppercase; font-size: 10px;">
            ${item.type}
          </span>
          <span style="font-weight: 500;">${item.title}</span>
        </a>
      `).join('');
      resultsDiv.style.display = 'block';
    } else {
      resultsDiv.innerHTML = `<div style="padding: 20px; color: #999; text-align: center;">No results found for "${input.value}"</div>`;
      resultsDiv.style.display = 'block';
    }
  });
}
