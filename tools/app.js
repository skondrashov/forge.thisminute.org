/* tools/app.js — catalog logic for the tools page.
 * Extracted from inline <script> for SPA compatibility.
 * Exposes window.__page = { init, teardown } for the router. */
(function () {
  'use strict';

  var OS_LABELS = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    web: 'Web',
    ios: 'iOS',
    android: 'Android'
  };

  var GROUP_COLORS = {
    'Code & Editors': '#22d3ee',
    'Web Development': '#6366f1',
    'Mobile & Cross-Platform': '#f472b6',
    'Data & Storage': '#818cf8',
    'AI & Machine Learning': '#a78bfa',
    'Blockchain & Web3': '#8b5cf6',
    'Scientific Computing': '#7c3aed',
    'Testing & Quality': '#34d399',
    'DevOps & Infra': '#f97316',
    'Monitoring & Observability': '#fb923c',
    'API & Integration': '#38bdf8',
    'CLI & Terminal': '#06b6d4',
    'Creative & Media': '#ec4899',
    'Design & Diagramming': '#e879f9',
    'Documents & Office': '#fbbf24',
    'System Tools': '#64748b',
    'Networking & Communication': '#f87171',
    'Security & Privacy': '#10b981',
    'Enterprise & Business': '#14b8a6',
    'Education & Learning': '#eab308',
    'Games': '#d97706',
    'Utilities': '#94a3b8'
  };

  var CATEGORY_COLORS = {};
  var PRICING_LABELS = { free: 'Free', freemium: 'Freemium', paid: 'Paid', subscription: 'Subscription' };
  var LANG_LABELS = { python: 'Python', typescript: 'TypeScript', javascript: 'JavaScript', rust: 'Rust', go: 'Go', java: 'Java', 'c++': 'C++', c: 'C', ruby: 'Ruby', swift: 'Swift' };
  var TAG_EXCLUDE = new Set(['crawl-discovered', 'idea', 'precision-tool', 'forge-infra', 'miscellaneous', 'other', 'open-source']);
  var PANEL_IDS = ['os-panel', 'pricing-panel', 'lang-panel', 'cat-filter-panel'];

  var state;

  // Shared utilities
  var U = CatalogUtils;
  var esc = U.esc;
  var tracker = U.createListenerTracker();
  var on = tracker.on;
  var focusTrap = U.createFocusTrap();

  function buildCategoryColors() {
    if (!window.TAXONOMY) return;
    function walk(node, color) {
      if (node.categories) node.categories.forEach(function (c) { CATEGORY_COLORS[c] = color; });
      (node.children || []).forEach(function (child) {
        walk(child, GROUP_COLORS[child.name] || color);
      });
    }
    walk(window.TAXONOMY, '#888');
  }

  function getCategories() {
    var m = {};
    state.data.forEach(function (e) { m[e.category] = (m[e.category] || 0) + 1; });
    return Object.entries(m).sort(function (a, b) { return b[1] - a[1]; });
  }

  function collectCategories(node) {
    if (node.categories) return node.categories.slice();
    if (node.children) {
      var cats = [];
      node.children.forEach(function (c) { cats.push.apply(cats, collectCategories(c)); });
      return cats;
    }
    return [];
  }

  function countEntries(node) {
    var cats = collectCategories(node);
    return state.data.filter(function (e) { return cats.includes(e.category) && applyCommonFilters(e); }).length;
  }

  function isLeaf(node) { return !!node.categories && !node.children; }

  function currentNode() {
    if (!state.taxonomy) return null;
    if (state.path.length === 0) return state.taxonomy;
    return state.path[state.path.length - 1];
  }

  // ---- Rendering ---- //

  function renderStats() {
    var total = state.data.length;
    var hasFilters = state.os || state.pricing || state.language || state.groupFilter || state.tag;
    if (hasFilters) {
      var filtered = state.data.filter(function (e) { return applyCommonFilters(e); }).length;
      document.getElementById('stat-entries').textContent = filtered.toLocaleString() + ' of ' + total.toLocaleString();
    } else {
      document.getElementById('stat-entries').textContent = total.toLocaleString();
    }
    document.getElementById('stat-categories').textContent = getCategories().length;
  }

  // ---- Filter panels ---- //

  function togglePanel(headerId, panelId) {
    var panel = document.getElementById(panelId);
    var header = document.getElementById(headerId);
    var opening = !panel.classList.contains('expanded');
    PANEL_IDS.forEach(function (id) {
      var p = document.getElementById(id);
      if (!p) return;
      var h = document.getElementById(id + '-header');
      p.classList.remove('expanded');
      if (h) h.setAttribute('aria-expanded', 'false');
    });
    if (opening) {
      panel.classList.add('expanded');
      header.setAttribute('aria-expanded', 'true');
      var rect = header.getBoundingClientRect();
      var body = panel.querySelector('.filter-panel-body');
      body.style.top = (rect.bottom + 4) + 'px';
    }
  }

  function closePanels(e) {
    if (!e.target.closest('.filter-panel')) {
      PANEL_IDS.forEach(function (id) {
        var p = document.getElementById(id);
        if (!p) return;
        var h = document.getElementById(id + '-header');
        p.classList.remove('expanded');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
    }
  }

  function buildTiles(container, options, activeValue, onSelect) {
    var html = '<div class="filter-tile filter-tile-all' + (!activeValue ? ' active' : '') + '" data-val="" tabindex="0"><div class="filter-tile-name">All</div></div>';
    options.forEach(function (o) {
      var active = activeValue === o.value ? ' active' : '';
      html += '<div class="filter-tile' + active + '" data-val="' + esc(o.value) + '" tabindex="0">' +
        '<div class="filter-tile-name">' + esc(o.label) + '</div>' +
        (o.count != null ? '<div class="filter-tile-count">' + o.count + '</div>' : '') +
      '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.filter-tile').forEach(function (tile) {
      tile.addEventListener('click', function () { onSelect(tile.dataset.val || null); });
      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(tile.dataset.val || null); }
      });
    });
  }

  function updateActiveLabel(labelId, value) {
    var el = document.getElementById(labelId);
    if (el) el.textContent = value || '';
  }

  function renderOSFilters() {
    var container = document.getElementById('os-tiles');
    var allOS = ['windows', 'macos', 'linux', 'web', 'ios', 'android'];
    var filtered = getFilteredExcept('os');
    var osCounts = {};
    filtered.forEach(function (e) { (e.os || []).forEach(function (o) { osCounts[o] = (osCounts[o] || 0) + 1; }); });
    var options = allOS.map(function (o) { return { value: o, label: OS_LABELS[o], count: osCounts[o] || 0 }; });
    buildTiles(container, options, state.os, function (val) {
      state.os = val;
      renderAllFilters();
      renderContent();
    });
    updateActiveLabel('os-active-label', state.os ? OS_LABELS[state.os] : '');
  }

  function renderPricingFilters() {
    var container = document.getElementById('pricing-tiles');
    var options = ['free', 'freemium', 'paid', 'subscription'];
    var filtered = getFilteredExcept('pricing');
    var pricingCounts = {};
    filtered.forEach(function (e) { if (e.pricing) pricingCounts[e.pricing] = (pricingCounts[e.pricing] || 0) + 1; });
    var opts = options.map(function (p) { return { value: p, label: PRICING_LABELS[p], count: pricingCounts[p] || 0 }; });
    buildTiles(container, opts, state.pricing, function (val) {
      state.pricing = val;
      renderAllFilters();
      renderContent();
    });
    updateActiveLabel('pricing-active-label', state.pricing ? PRICING_LABELS[state.pricing] : '');
  }

  function renderLangFilters() {
    var panel = document.getElementById('lang-panel');
    var container = document.getElementById('lang-tiles');
    var filtered = getFilteredExcept('language');
    var langCounts = {};
    filtered.forEach(function (e) {
      if (e.language) {
        var lang = e.language.toLowerCase();
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      }
    });
    var langs = Object.keys(langCounts).sort();
    var show = langs.length > 0;
    panel.style.display = show ? '' : 'none';
    if (!show) return;
    var opts = langs.map(function (l) { return { value: l, label: LANG_LABELS[l] || l, count: langCounts[l] }; });
    buildTiles(container, opts, state.language, function (val) {
      state.language = val;
      renderAllFilters();
      renderContent();
    });
    updateActiveLabel('lang-active-label', state.language ? (LANG_LABELS[state.language] || state.language) : '');
  }

  function renderCatFilter() {
    var container = document.getElementById('cat-tiles');
    var panel = document.getElementById('cat-filter-panel');
    if (!container || !panel || !state.taxonomy) return;
    var groups = (state.taxonomy.children || []);
    var opts = groups.map(function (g) {
      return { value: g.name, label: g.name, count: countEntries(g) };
    }).filter(function (o) { return o.count > 0; });
    buildTiles(container, opts, state.groupFilter, function (val) {
      state.groupFilter = val;
      if (val) {
        var group = groups.find(function (g) { return g.name === val; });
        if (group) state.path = [group]; else state.path = [];
      } else {
        state.path = [];
      }
      renderAllFilters();
      renderContent();
    });
    updateActiveLabel('cat-active-label', state.groupFilter || '');
  }

  function renderAllFilters() {
    renderOSFilters();
    renderPricingFilters();
    renderLangFilters();
    renderCatFilter();
    renderStats();
  }

  function renderTagBar(entries) {
    var bar = document.getElementById('tag-bar');
    if (!entries || entries.length === 0 || entries.length > 2000) {
      bar.innerHTML = '';
      return;
    }
    var tagCounts = {};
    entries.forEach(function (e) {
      (e.tags || []).forEach(function (t) {
        if (!TAG_EXCLUDE.has(t)) tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    var topTags = Object.entries(tagCounts)
      .filter(function (p) { return p[1] >= 2; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 12);
    if (topTags.length === 0) { bar.innerHTML = ''; return; }
    bar.innerHTML = '<span class="tag-bar-label">Tags</span>' +
      (state.tag ? '<button class="tag-chip active" data-tag="">Clear</button>' : '') +
      topTags.map(function (p) {
        var active = state.tag === p[0] ? ' active' : '';
        return '<button class="tag-chip' + active + '" data-tag="' + esc(p[0]) + '">' + esc(p[0]) + ' <span style="opacity:0.5">' + p[1] + '</span></button>';
      }).join('');
    bar.querySelectorAll('.tag-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.tag = chip.dataset.tag || null;
        renderContent();
      });
    });
  }

  function renderBreadcrumb() {
    var bc = document.getElementById('breadcrumb');
    if (state.query) { bc.innerHTML = ''; return; }
    var html = '';
    if (state.path.length === 0) {
      html = '<span class="breadcrumb-current">tools</span>';
    } else {
      html = '<button class="breadcrumb-item" data-depth="-1">tools</button>';
      state.path.forEach(function (node, i) {
        html += '<span class="breadcrumb-sep">&gt;</span>';
        if (i === state.path.length - 1) {
          html += '<span class="breadcrumb-current">' + esc(node.name) + '</span>';
        } else {
          html += '<button class="breadcrumb-item" data-depth="' + i + '">' + esc(node.name) + '</button>';
        }
      });
    }
    bc.innerHTML = html;
    bc.querySelectorAll('.breadcrumb-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var depth = parseInt(btn.dataset.depth);
        if (depth === -1) { state.path = []; } else { state.path = state.path.slice(0, depth + 1); }
        state.tag = null;
        renderBreadcrumb();
        renderContent();
        updateSortVisibility();
             });
    });
  }

  function updateSortVisibility() {
    var sortEl = document.getElementById('sort-controls');
    var node = currentNode();
    var showSort = state.query || (node && isLeaf(node));
    sortEl.classList.toggle('hidden', !showSort);
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function sortResults(results) {
    if (state.sort === 'name') {
      results.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else if (state.sort === 'category') {
      results.sort(function (a, b) { return a.category.localeCompare(b.category) || a.name.localeCompare(b.name); });
    } else if (state.sort === 'random') {
      shuffleArray(results);
    }
  }

  function applyCommonFilters(e) {
    if (state.os && !(e.os || []).includes(state.os)) return false;
    if (state.pricing && e.pricing !== state.pricing) return false;
    if (state.language && (e.language || '').toLowerCase() !== state.language) return false;
    if (state.tag && !(e.tags || []).includes(state.tag)) return false;
    return true;
  }

  function getFilteredExcept(exclude) {
    return state.data.filter(function (e) {
      if (exclude !== 'os' && state.os && !(e.os || []).includes(state.os)) return false;
      if (exclude !== 'pricing' && state.pricing && e.pricing !== state.pricing) return false;
      if (exclude !== 'language' && state.language && (e.language || '').toLowerCase() !== state.language) return false;
      if (exclude !== 'tag' && state.tag && !(e.tags || []).includes(state.tag)) return false;
      return true;
    });
  }

  function getFilteredEntries(categories) {
    var results = state.data.filter(function (e) {
      if (categories && !categories.includes(e.category)) return false;
      return applyCommonFilters(e);
    });
    sortResults(results);
    return results;
  }

  function getSearchResults() {
    var q = state.query.toLowerCase();
    var results = state.data.filter(function (e) {
      if (!applyCommonFilters(e)) return false;
      return (e.name || '').toLowerCase().includes(q) ||
             (e.description || '').toLowerCase().includes(q) ||
             (e.category || '').toLowerCase().includes(q) ||
             (e.tags || []).some(function (t) { return t.toLowerCase().includes(q); });
    });
    sortResults(results);
    return results;
  }

  var highlightText = U.highlightText;

  function renderCards(entries) {
    if (!entries.length) {
      return '<div class="grid"><div class="empty-state">No software matches your filters.</div></div>';
    }
    var q = state.query || '';
    var html = '<div class="grid">';
    entries.forEach(function (e) {
      var pClass = 'pricing-' + (e.pricing || 'free');
      var catColor = CATEGORY_COLORS[e.category] || '#888';
      var nameHtml = q ? highlightText(e.name, q) : esc(e.name);
      var descHtml = q ? highlightText(e.description, q) : esc(e.description);
      var langHtml = e.language ? ' <span class="card-lang">' + esc(e.language) + '</span>' : '';

      html += '<div class="card" data-id="' + esc(e.id) + '" style="border-left: 3px solid ' + catColor + '">' +
        '<div class="card-top">' +
          '<span class="card-name">' + nameHtml + langHtml + '</span>' +
          '<span class="card-pricing ' + pClass + '">' + esc(e.pricing) + '</span>' +
        '</div>' +
        '<div class="card-desc">' + descHtml + '</div>' +
        '<div class="card-bottom">' +
          '<div class="card-os">' + (e.os || []).map(function (o) { return '<span class="os-badge">' + (OS_LABELS[o] || o) + '</span>'; }).join('') + '</div>' +
          '<span class="card-cat">' + esc(e.category) + '</span>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderTiles(children) {
    var html = '<div class="tile-grid">';
    children.forEach(function (child, i) {
      var count = countEntries(child);
      var desc = child.description ? '<div class="tile-desc">' + esc(child.description) + '</div>' : '';
      var label = count === 1 ? 'entry' : 'entries';
      html += '<div class="tile" data-index="' + i + '">' +
        '<div class="tile-name">' + esc(child.name) + '</div>' +
        desc +
        '<div class="tile-meta">' +
          '<span class="tile-count">' + count + ' ' + label + '</span>' +
          '<span class="tile-arrow">&rarr;</span>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderContent() {
    var contentEl = document.getElementById('content');
    if (state.query) {
      var results = getSearchResults();
      contentEl.innerHTML = renderCards(results);
      bindCardClicks();
      renderTagBar(results);
      return;
    }
    var node = currentNode();
    if (!node || !node.children) {
      if (node && node.categories) {
        var entries = getFilteredEntries(node.categories);
        contentEl.innerHTML = renderCards(entries);
        bindCardClicks();
        renderTagBar(entries);
      } else {
        contentEl.innerHTML = '<div class="empty-state">Loading taxonomy...</div>';
        renderTagBar([]);
      }
      return;
    }
    contentEl.innerHTML = renderTiles(node.children);
    bindTileClicks(node.children);
    renderTagBar([]);
  }

  function bindCardClicks() {
    document.querySelectorAll('#content .card').forEach(function (c) {
      c.addEventListener('click', function () { openDetail(c.dataset.id); });
    });
  }

  function bindTileClicks(children) {
    document.querySelectorAll('#content .tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        var idx = parseInt(tile.dataset.index);
        var child = children[idx];
        state.path.push(child);
        state.tag = null;
        renderBreadcrumb();
        renderContent();
        updateSortVisibility();
               window.scrollTo({ top: document.querySelector('.breadcrumb').offsetTop - 10, behavior: 'auto' });
      });
    });
  }

  // Focus trap delegates to shared utility
  var enableFocusTrap = focusTrap.enable;
  var disableFocusTrap = focusTrap.disable;

  // ---- Detail panel ---- //

  function openDetail(id) {
    var e = state.data.find(function (x) { return x.id === id; });
    if (!e) return;
    var detail = document.getElementById('detail');
    var overlay = document.getElementById('overlay');
    var pClass = 'pricing-' + (e.pricing || 'free');
    var color = CATEGORY_COLORS[e.category] || '#888';

    var html = '<button class="detail-close" id="detail-close">&times;</button>' +
      '<div class="detail-head">' +
        '<h2>' + esc(e.name) + (e.language ? ' <span class="card-lang" style="font-size:0.6em;vertical-align:middle">' + esc(e.language) + '</span>' : '') + '</h2>' +
        '<div class="detail-head-meta">' +
          '<span class="tag" style="background:' + color + '18;color:' + color + '">' + esc(e.category) + '</span>' +
          '<span class="card-pricing ' + pClass + '">' + esc(e.pricing) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-body">';

    html += '<div class="detail-section"><h3>About</h3><p>' + esc(e.description) + '</p></div>';

    if (e.os && e.os.length) {
      html += '<div class="detail-section"><h3>Platforms</h3><div class="detail-os-list">';
      e.os.forEach(function (o) { html += '<span class="detail-os-badge">' + (OS_LABELS[o] || o) + '</span>'; });
      html += '</div></div>';
    }

    if (e.tags && e.tags.length) {
      html += '<div class="detail-section"><h3>Tags</h3><div class="detail-tags">';
      e.tags.forEach(function (t) { html += '<span class="detail-tag detail-tag-link" data-tag="' + esc(t) + '" style="cursor:pointer">' + esc(t) + '</span>'; });
      html += '</div></div>';
    }

    html += '<div class="detail-section"><h3>Links</h3><div style="display:flex;gap:0.75rem;flex-wrap:wrap">';
    if (e.url) { html += '<a class="detail-link" href="' + esc(e.url) + '" target="_blank" rel="noopener">Visit Website &rarr;</a>'; }
    if (e.source) { html += '<a class="detail-link-secondary" href="' + esc(e.source) + '" target="_blank" rel="noopener">Source Code</a>'; }
    html += '<button class="detail-copy-link" id="copy-link-btn" data-id="' + esc(e.id) + '">Copy Link</button>';
    html += '</div></div>';

    // Similar software
    var similarPool = state.data.filter(function (s) { return s.category === e.category && s.id !== e.id; });
    shuffleArray(similarPool);
    var similar = similarPool.slice(0, 4);
    if (similar.length) {
      html += '<div class="detail-section detail-similar"><h3>See Also</h3><div class="detail-similar-grid">';
      similar.forEach(function (s) {
        var sp = 'pricing-' + (s.pricing || 'free');
        html += '<div class="detail-similar-item" data-id="' + esc(s.id) + '">' +
          '<div style="min-width:0;flex:1">' +
            '<div class="detail-similar-name">' + esc(s.name) + '</div>' +
            '<div class="detail-similar-desc">' + esc(s.description) + '</div>' +
          '</div>' +
          '<span class="detail-similar-pricing card-pricing ' + sp + '">' + esc(s.pricing) + '</span>' +
        '</div>';
      });
      html += '</div></div>';
    }

    html += '</div>';
    detail.innerHTML = html;
    detail.classList.add('active');
    overlay.classList.add('active');
    history.replaceState(null, '', '#' + e.id);
    document.getElementById('detail-close').addEventListener('click', closeDetail);

    // Copy link
    document.getElementById('copy-link-btn').addEventListener('click', function (ev) {
      ev.stopPropagation();
      var btn = this;
      var url = location.origin + location.pathname + '#' + btn.dataset.id;
      navigator.clipboard.writeText(url).then(function () {
        btn.textContent = 'Copied!'; btn.classList.add('copied');
        setTimeout(function () { btn.textContent = 'Copy Link'; btn.classList.remove('copied'); }, 1500);
      }).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        btn.textContent = 'Copied!'; btn.classList.add('copied');
        setTimeout(function () { btn.textContent = 'Copy Link'; btn.classList.remove('copied'); }, 1500);
      });
    });

    // Similar items
    detail.querySelectorAll('.detail-similar-item').forEach(function (item) {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('click', function () { openDetail(item.dataset.id); detail.scrollTop = 0; });
      item.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openDetail(item.dataset.id); detail.scrollTop = 0; }
      });
    });

    // Tag click
    detail.querySelectorAll('.detail-tag-link').forEach(function (tagEl) {
      tagEl.addEventListener('click', function (ev) {
        ev.stopPropagation();
        closeDetail();
        var searchEl = document.getElementById('search');
        searchEl.value = tagEl.dataset.tag;
        state.query = tagEl.dataset.tag;
        renderBreadcrumb();
        renderContent();
        updateSortVisibility();
        var countEl = document.getElementById('search-count');
        var results = getSearchResults();
        countEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '');
        countEl.classList.add('visible');
      });
    });

    enableFocusTrap(detail);
    var closeBtn = document.getElementById('detail-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeDetail() {
    var detail = document.getElementById('detail');
    disableFocusTrap(detail);
    detail.classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    history.replaceState(null, '', location.pathname);
  }

  // ---- Mobile category panel ---- //

  // ---- Keyboard handler ---- //
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      closeDetail();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      var searchEl = document.getElementById('search');
      searchEl.focus();
      searchEl.select();
    }
  }

  // ---- Init / Teardown ---- //

  function init() {
    // Reset state
    state = {
      data: window.SOFTWARE || [],
      taxonomy: null,
      path: [],
      os: null,
      pricing: null,
      language: null,
      groupFilter: null,
      tag: null,
      query: '',
      sort: 'category'
    };
    tracker.teardown();

    buildCategoryColors();

    state.taxonomy = window.TAXONOMY || null;

    renderAllFilters();
    renderBreadcrumb();
    renderContent();
    updateSortVisibility();

    // Bind events
    var searchEl = document.getElementById('search');
    on(searchEl, 'input', function (e) {
      state.query = e.target.value;
      renderBreadcrumb();
      renderContent();
      updateSortVisibility();
      var countEl = document.getElementById('search-count');
      if (state.query) {
        var results = getSearchResults();
        countEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '');
        countEl.classList.add('visible');
      } else {
        countEl.classList.remove('visible');
      }
    });

    document.querySelectorAll('.sort-btn').forEach(function (btn) {
      on(btn, 'click', function () {
        state.sort = btn.dataset.sort;
        document.querySelectorAll('.sort-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderContent();
      });
    });

    on(document.getElementById('overlay'), 'click', closeDetail);
    on(document, 'keydown', handleKeydown);
    on(document, 'click', closePanels);

    // Panel headers
    PANEL_IDS.forEach(function (id) {
      var headerId = id + '-header';
      var el = document.getElementById(headerId);
      if (!el) return;
      on(el, 'click', function () { togglePanel(headerId, id); });
      on(el, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(headerId, id); }
      });
    });


    // Deep-link
    if (location.hash) {
      var id = location.hash.slice(1);
      if (state.data.some(function (e) { return e.id === id; })) openDetail(id);
    }

    if (window.CatalogUtils) CatalogUtils.initBackToTop();
  }

  function teardown() {
    tracker.teardown();
  }

  // Expose lifecycle
  window.__page = { init: init, teardown: teardown };

  // Auto-init on standalone load (non-SPA)
  if (window.SOFTWARE) {
    init();
  }
})();
