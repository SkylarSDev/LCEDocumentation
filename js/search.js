/**
 * Client-Side Search Script
 * LCE Documentation Site
 *
 * Handles:
 * - Pre-built search index covering all pages and major sections
 * - Term-based scoring with weighted matches (title, keywords, description)
 * - Modal overlay UI with keyboard navigation
 * - Debounced input handling
 * - Integration with nav.js via 'open-search' custom event
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Search Index
  // ---------------------------------------------------------------------------

  /**
   * Static search index. Each entry represents a page or a section within a
   * page. Fields:
   *   title       - Display title for the result
   *   page        - HTML filename to navigate to
   *   section     - Section/category label
   *   anchor      - Hash anchor within the page (empty string for page top)
   *   description - Short summary shown in results
   *   keywords    - Space-separated search terms for matching
   */
  var searchIndex = [
    // -- Index / Home --
    { title: "Home", page: "index.html", section: "Overview", anchor: "", description: "Project overview and quick links", keywords: "home overview lcemp minecraft legacy console" },

    // -- Getting Started --
    { title: "Getting Started", page: "getting-started.html", section: "Setup", anchor: "", description: "Build guide, prerequisites, and launch arguments", keywords: "build compile setup prerequisites cmake" },
    { title: "Launch Arguments", page: "getting-started.html", section: "Launch Arguments", anchor: "#launch-arguments", description: "Command-line arguments: -name, -ip, -port", keywords: "arguments cli name ip port command" },
    { title: "Required Assets", page: "getting-started.html", section: "Assets", anchor: "#required-assets", description: "Music, textures, media, and library files needed", keywords: "assets music textures media libraries" },

    // -- Architecture --
    { title: "Architecture Overview", page: "architecture.html", section: "Architecture", anchor: "", description: "High-level system architecture and module overview", keywords: "architecture modules client world structure" },
    { title: "Game Loop", page: "architecture.html", section: "Architecture", anchor: "#game-loop", description: "Minecraft init, run, tick, render cycle", keywords: "game loop tick render init run" },
    { title: "Platform Abstraction", page: "architecture.html", section: "Architecture", anchor: "#platform-abstraction", description: "Cross-platform code organization", keywords: "platform abstraction common shared" },

    // -- Rendering --
    { title: "Rendering System", page: "rendering.html", section: "Rendering", anchor: "", description: "Rendering pipeline, cameras, and chunk rendering", keywords: "rendering pipeline camera chunks" },
    { title: "GameRenderer", page: "rendering.html", section: "Rendering", anchor: "#gamerenderer", description: "Main render coordinator class", keywords: "gamerenderer render camera fov light" },
    { title: "LevelRenderer", page: "rendering.html", section: "Rendering", anchor: "#levelrenderer", description: "World and chunk rendering, frustum culling", keywords: "levelrenderer chunks frustum culling sky clouds" },
    { title: "Tesselator", page: "rendering.html", section: "Rendering", anchor: "#tesselator", description: "Geometry submission to graphics API", keywords: "tesselator vertex geometry buffer vbo" },
    { title: "Particle System", page: "rendering.html", section: "Rendering", anchor: "#particle-system", description: "ParticleEngine and 32+ particle types", keywords: "particle engine smoke flame explosion" },
    { title: "Texture System", page: "rendering.html", section: "Rendering", anchor: "#texture-system", description: "TextureManager, atlas stitching, texture packs", keywords: "texture atlas stitch pack manager" },
    { title: "Entity Renderers", page: "rendering.html", section: "Rendering", anchor: "#entity-renderers", description: "50+ entity-specific rendering classes", keywords: "entity renderer mob cow creeper pig" },

    // -- Networking --
    { title: "Networking System", page: "networking.html", section: "Networking", anchor: "", description: "Packet-based client-server networking", keywords: "networking packets client server connection" },
    { title: "Packet", page: "networking.html", section: "Networking", anchor: "#packet-base", description: "Base packet class with factory pattern", keywords: "packet base read write handle factory" },
    { title: "Entity Packets", page: "networking.html", section: "Networking", anchor: "#entity-packets", description: "AddMobPacket, MoveEntityPacket, and more", keywords: "entity packet add move remove teleport" },
    { title: "Container Packets", page: "networking.html", section: "Networking", anchor: "#container-packets", description: "Inventory and container synchronization", keywords: "container inventory packet click slot" },
    { title: "Authentication Packets", page: "networking.html", section: "Networking", anchor: "#auth-packets", description: "Login, handshake, and connection packets", keywords: "login auth handshake connect disconnect" },

    // -- World Generation --
    { title: "World Generation", page: "world-gen.html", section: "World Gen", anchor: "", description: "Biome generation, noise, and chunk pipeline", keywords: "world generation biome noise chunk" },
    { title: "Biome", page: "world-gen.html", section: "World Gen", anchor: "#biome", description: "Base biome class with 23 biome types", keywords: "biome plains desert forest jungle swamp" },
    { title: "Noise Generators", page: "world-gen.html", section: "World Gen", anchor: "#noise", description: "Perlin, Simplex, and Improved noise", keywords: "noise perlin simplex improved terrain" },

    // -- Entities --
    { title: "Entity System", page: "entities.html", section: "Entities", anchor: "", description: "Entity hierarchy, mobs, AI, and pathfinding", keywords: "entity mob ai pathfinding goal" },
    { title: "Entity", page: "entities.html", section: "Entities", anchor: "#entity-class", description: "Base entity with position, physics, collision", keywords: "entity position velocity collision physics" },
    { title: "Mob", page: "entities.html", section: "Entities", anchor: "#mob-class", description: "Living entity with health, AI, and controls", keywords: "mob health ai goal navigation" },
    { title: "Animal", page: "entities.html", section: "Entities", anchor: "#animal-class", description: "Breedable passive mobs", keywords: "animal breed passive cow pig sheep chicken" },
    { title: "Monster", page: "entities.html", section: "Entities", anchor: "#monster-class", description: "Hostile mob base class", keywords: "monster hostile creeper zombie skeleton spider" },
    { title: "Player", page: "entities.html", section: "Entities", anchor: "#player-class", description: "Player entity with inventory and abilities", keywords: "player inventory abilities food experience" },
    { title: "AI Goal System", page: "entities.html", section: "Entities", anchor: "#ai-goals", description: "41 goal types for mob behavior", keywords: "goal ai attack breed panic flee follow" },
    { title: "Pathfinding", page: "entities.html", section: "Entities", anchor: "#pathfinding", description: "A* pathfinding with PathFinder, Path, PathNavigation", keywords: "pathfinding path navigation astar node" },

    // -- Tiles & Items --
    { title: "Tiles & Items", page: "tiles-items.html", section: "Tiles & Items", anchor: "", description: "Block types, items, and tile entities", keywords: "tile block item inventory" },
    { title: "Tile", page: "tiles-items.html", section: "Tiles & Items", anchor: "#tile-class", description: "Base block class with 97 tile types", keywords: "tile block stone dirt grass wood" },
    { title: "Item", page: "tiles-items.html", section: "Tiles & Items", anchor: "#item-class", description: "Base item class with 47 item types", keywords: "item tool weapon armor food potion" },
    { title: "TileEntity", page: "tiles-items.html", section: "Tiles & Items", anchor: "#tile-entity", description: "Blocks with extra data (chests, furnaces)", keywords: "tileentity chest furnace dispenser sign" },

    // -- UI System --
    { title: "UI System", page: "ui-system.html", section: "UI", anchor: "", description: "Flash-based UI framework with scenes and controls", keywords: "ui scene control flash iggy scaleform" },
    { title: "UIScene", page: "ui-system.html", section: "UI", anchor: "#uiscene", description: "Base scene class wrapping Flash movies", keywords: "uiscene flash movie swf iggy" },
    { title: "UIControl", page: "ui-system.html", section: "UI", anchor: "#uicontrol", description: "22 control types for UI interaction", keywords: "uicontrol button slider checkbox label" },
    { title: "Menu Scenes", page: "ui-system.html", section: "UI", anchor: "#menu-scenes", description: "61 menu/screen implementations", keywords: "menu pause inventory crafting furnace" },

    // -- Audio --
    { title: "Audio System", page: "audio.html", section: "Audio", anchor: "", description: "Miles Sound System integration and music", keywords: "audio sound music miles engine" },
    { title: "SoundEngine", page: "audio.html", section: "Audio", anchor: "#soundengine", description: "Main sound system with 3D positional audio", keywords: "soundengine play stream 3d positional" },

    // -- Storage --
    { title: "Storage System", page: "storage.html", section: "Storage", anchor: "", description: "Save system, regions, chunks, and NBT", keywords: "storage save region chunk nbt" },
    { title: "LevelStorage", page: "storage.html", section: "Storage", anchor: "#levelstorage", description: "Abstract save interface with multiple implementations", keywords: "levelstorage save load directory mcregion" },
    { title: "LevelChunk", page: "storage.html", section: "Storage", anchor: "#levelchunk", description: "Chunk data with compressed tile/light storage", keywords: "levelchunk compressed tile data light" },

    // -- Gameplay --
    { title: "Gameplay Systems", page: "gameplay.html", section: "Gameplay", anchor: "", description: "Recipes, enchantments, commands, achievements", keywords: "gameplay recipe enchantment command achievement" },
    { title: "Recipes", page: "gameplay.html", section: "Gameplay", anchor: "#recipes", description: "Shaped, shapeless, furnace, and merchant recipes", keywords: "recipe crafting shaped shapeless furnace" },
    { title: "Enchantments", page: "gameplay.html", section: "Gameplay", anchor: "#enchantments", description: "15+ enchantment types and helper system", keywords: "enchantment protection damage knockback fire" },
    { title: "Commands", page: "gameplay.html", section: "Gameplay", anchor: "#commands", description: "Console commands: time, give, kill, gamemode", keywords: "command time give kill gamemode teleport" },

    // -- Platforms --
    { title: "Platform Support", page: "platforms.html", section: "Platforms", anchor: "", description: "6 platform implementations and abstractions", keywords: "platform xbox ps3 ps4 vita windows durango orbis" },
    { title: "Windows 64-bit", page: "platforms.html", section: "Platforms", anchor: "#windows", description: "DirectX 11 PC implementation", keywords: "windows pc directx dx11 keyboard mouse" },
    { title: "Xbox 360", page: "platforms.html", section: "Platforms", anchor: "#xbox-360", description: "Xbox 360 with Kinect support", keywords: "xbox 360 kinect xboxlive" },
    { title: "PlayStation 3", page: "platforms.html", section: "Platforms", anchor: "#ps3", description: "PS3 with Cell SPU support", keywords: "ps3 playstation cell spu edge" },
    { title: "PlayStation 4", page: "platforms.html", section: "Platforms", anchor: "#ps4", description: "PS4 (Orbis) implementation", keywords: "ps4 playstation orbis" },
    { title: "PlayStation Vita", page: "platforms.html", section: "Platforms", anchor: "#vita", description: "PS Vita with touch input", keywords: "vita psvita touch portable" },
    { title: "Xbox One", page: "platforms.html", section: "Platforms", anchor: "#xbox-one", description: "Xbox One (Durango) implementation", keywords: "xboxone durango modern" }
  ];

  // ---------------------------------------------------------------------------
  // 2. Search Functionality
  // ---------------------------------------------------------------------------

  /** Maximum number of results to show. */
  var MAX_RESULTS = 15;

  /** Scoring weights for different match types. */
  var SCORE_EXACT_TITLE   = 100;
  var SCORE_TITLE_CONTAINS = 50;
  var SCORE_KEYWORD_MATCH  = 30;
  var SCORE_DESC_MATCH     = 10;

  /**
   * Searches the index for entries matching the given query string.
   *
   * Matching logic:
   * - The query is lowercased and split into individual terms.
   * - Each term is tested against the entry's title, keywords, and description.
   * - Entries must match ALL terms (AND logic) to appear.
   * - A cumulative score is built from the matches for ranking.
   *
   * @param {string} query - The user's search query.
   * @returns {Array} Top results sorted by score descending. Each element:
   *   { title, page, section, anchor, description, score }
   */
  function searchDocs(query) {
    if (!query || !query.trim()) return [];

    var terms = query.toLowerCase().trim().split(/\s+/);
    var results = [];

    for (var i = 0; i < searchIndex.length; i++) {
      var entry = searchIndex[i];
      var titleLower = entry.title.toLowerCase();
      var keywordsLower = entry.keywords.toLowerCase();
      var descLower = entry.description.toLowerCase();

      var totalScore = 0;
      var allTermsMatch = true;

      for (var t = 0; t < terms.length; t++) {
        var term = terms[t];
        var termMatched = false;

        // Exact title match (title equals the term exactly).
        if (titleLower === term) {
          totalScore += SCORE_EXACT_TITLE;
          termMatched = true;
        }
        // Title contains the term.
        else if (titleLower.indexOf(term) !== -1) {
          totalScore += SCORE_TITLE_CONTAINS;
          termMatched = true;
        }

        // Keyword match.
        if (keywordsLower.indexOf(term) !== -1) {
          totalScore += SCORE_KEYWORD_MATCH;
          if (!termMatched) termMatched = true;
        }

        // Description match.
        if (descLower.indexOf(term) !== -1) {
          totalScore += SCORE_DESC_MATCH;
          if (!termMatched) termMatched = true;
        }

        if (!termMatched) {
          allTermsMatch = false;
          break;
        }
      }

      if (allTermsMatch && totalScore > 0) {
        results.push({
          title: entry.title,
          page: entry.page,
          section: entry.section,
          anchor: entry.anchor,
          description: entry.description,
          score: totalScore
        });
      }
    }

    // Sort by score descending, then alphabetically by title for ties.
    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.title.localeCompare(b.title);
    });

    return results.slice(0, MAX_RESULTS);
  }

  // ---------------------------------------------------------------------------
  // 3. Search UI
  // ---------------------------------------------------------------------------

  var overlay = null;       // The modal backdrop element
  var modal = null;         // The modal container
  var searchInput = null;   // The search <input> inside the modal
  var resultsList = null;   // The <ul> that holds result items
  var debounceTimer = null; // Timer ID for debounce
  var activeIndex = -1;     // Currently highlighted result index (keyboard nav)

  /** Debounce delay in milliseconds. */
  var DEBOUNCE_MS = 150;

  /**
   * Builds and injects the search overlay DOM elements into the page.
   * Called once on first open.
   */
  function createSearchOverlay() {
    // Backdrop
    overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Search documentation');

    // Modal container
    modal = document.createElement('div');
    modal.className = 'search-modal';

    // Header with input
    var header = document.createElement('div');
    header.className = 'search-modal-header';

    var inputWrapper = document.createElement('div');
    inputWrapper.className = 'search-input-wrapper';

    // Search icon (SVG)
    var searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="11" cy="11" r="8"></circle>' +
      '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
      '</svg>';

    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-modal-input';
    searchInput.placeholder = 'Search documentation...';
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('spellcheck', 'false');

    // Escape hint
    var escHint = document.createElement('kbd');
    escHint.className = 'search-kbd-hint';
    escHint.textContent = 'Esc';

    inputWrapper.appendChild(searchIcon);
    inputWrapper.appendChild(searchInput);
    inputWrapper.appendChild(escHint);
    header.appendChild(inputWrapper);

    // Results area
    var resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-container';

    resultsList = document.createElement('ul');
    resultsList.className = 'search-results';
    resultsList.setAttribute('role', 'listbox');

    resultsContainer.appendChild(resultsList);

    // Footer hint
    var footer = document.createElement('div');
    footer.className = 'search-modal-footer';
    footer.innerHTML =
      '<span class="search-footer-hint">' +
      '<kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate ' +
      '<kbd>Enter</kbd> to select ' +
      '<kbd>Esc</kbd> to close' +
      '</span>';

    modal.appendChild(header);
    modal.appendChild(resultsContainer);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // -- Event Listeners --

    // Close when clicking backdrop (not the modal itself).
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSearch();
      }
    });

    // Input handler with debounce.
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch();
      }, DEBOUNCE_MS);
    });

    // Keyboard navigation inside the modal.
    searchInput.addEventListener('keydown', onSearchKeyDown);
  }

  /**
   * Opens the search overlay. Creates it on first invocation.
   */
  function openSearch() {
    if (!overlay) {
      createSearchOverlay();
    }

    overlay.classList.add('visible');
    searchInput.value = '';
    activeIndex = -1;
    showHint();
    searchInput.focus();

    // Prevent body scroll while overlay is open.
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the search overlay.
   */
  function closeSearch() {
    if (!overlay) return;
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    clearTimeout(debounceTimer);
  }

  /**
   * Returns true if the search overlay is currently visible.
   */
  function isSearchOpen() {
    return overlay && overlay.classList.contains('visible');
  }

  /**
   * Runs the search with the current input value and renders results.
   */
  function performSearch() {
    var query = searchInput.value;
    activeIndex = -1;

    if (!query || !query.trim()) {
      showHint();
      return;
    }

    var results = searchDocs(query);

    if (results.length === 0) {
      showNoResults(query);
      return;
    }

    renderResults(results);
  }

  /**
   * Shows the default hint when the search input is empty.
   */
  function showHint() {
    resultsList.innerHTML =
      '<li class="search-hint">' +
      '<span class="search-hint-text">Type to search across all documentation pages.</span>' +
      '<span class="search-hint-shortcuts">' +
      'Tip: Press <kbd>Ctrl+K</kbd> or <kbd>/</kbd> anytime to open search.' +
      '</span>' +
      '</li>';
  }

  /**
   * Shows a "no results" message.
   */
  function showNoResults(query) {
    var escapedQuery = escapeHtml(query);
    resultsList.innerHTML =
      '<li class="search-no-results">' +
      'No results found for "<strong>' + escapedQuery + '</strong>".' +
      '<br><span class="search-hint-text">Try different keywords or check spelling.</span>' +
      '</li>';
  }

  /**
   * Renders search results into the results list.
   */
  function renderResults(results) {
    var html = '';

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var url = r.page + (r.anchor || '');
      var sectionBadge = '<span class="search-result-section">' + escapeHtml(r.section) + '</span>';

      html +=
        '<li class="search-result-item" data-index="' + i + '" data-url="' + escapeHtml(url) + '" role="option">' +
        '<div class="search-result-header">' +
        '<span class="search-result-title">' + highlightMatch(r.title, searchInput.value) + '</span>' +
        sectionBadge +
        '</div>' +
        '<div class="search-result-description">' + highlightMatch(r.description, searchInput.value) + '</div>' +
        '</li>';
    }

    resultsList.innerHTML = html;

    // Attach click handlers to each result.
    var items = resultsList.querySelectorAll('.search-result-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', onResultClick);
      items[j].addEventListener('mouseenter', onResultHover);
    }
  }

  /**
   * Highlights occurrences of the query terms within the given text by wrapping
   * them in <mark> tags.
   */
  function highlightMatch(text, query) {
    if (!query || !query.trim()) return escapeHtml(text);

    var terms = query.toLowerCase().trim().split(/\s+/);
    var escaped = escapeHtml(text);

    // Build a regex that matches any of the terms (escaped for regex safety).
    var regexParts = [];
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (t) regexParts.push(t);
    }
    if (regexParts.length === 0) return escaped;

    var regex = new RegExp('(' + regexParts.join('|') + ')', 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Simple HTML escaping to prevent XSS in rendered results.
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // Keyboard Navigation
  // ---------------------------------------------------------------------------

  /**
   * Handles keyboard events within the search input:
   * - ArrowDown / ArrowUp: move highlight through results
   * - Enter: navigate to highlighted result
   * - Escape: close the search overlay
   */
  function onSearchKeyDown(e) {
    var items = resultsList.querySelectorAll('.search-result-item');
    var count = items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (count === 0) return;
        activeIndex = (activeIndex + 1) % count;
        updateActiveHighlight(items);
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (count === 0) return;
        activeIndex = (activeIndex - 1 + count) % count;
        updateActiveHighlight(items);
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < count) {
          navigateToResult(items[activeIndex]);
        } else if (count > 0) {
          // If nothing is highlighted, navigate to first result.
          navigateToResult(items[0]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        closeSearch();
        break;
    }
  }

  /**
   * Updates the visual highlight on the currently active result item and
   * ensures it is scrolled into view.
   */
  function updateActiveHighlight(items) {
    for (var i = 0; i < items.length; i++) {
      if (i === activeIndex) {
        items[i].classList.add('active');
        // Scroll the item into view within the results container.
        items[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        items[i].classList.remove('active');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Result Interaction
  // ---------------------------------------------------------------------------

  /**
   * Click handler for a result item. Navigates to its page/anchor.
   */
  function onResultClick(e) {
    var item = e.currentTarget;
    navigateToResult(item);
  }

  /**
   * Hover handler: update active index so keyboard and mouse stay in sync.
   */
  function onResultHover(e) {
    var item = e.currentTarget;
    var idx = parseInt(item.getAttribute('data-index'), 10);
    if (!isNaN(idx)) {
      activeIndex = idx;
      var items = resultsList.querySelectorAll('.search-result-item');
      updateActiveHighlight(items);
    }
  }

  /**
   * Navigates to the URL specified by the result item's data-url attribute.
   * Handles same-page anchors with smooth scrolling, and cross-page navigation
   * with normal window.location assignment.
   */
  function navigateToResult(item) {
    var url = item.getAttribute('data-url');
    if (!url) return;

    closeSearch();

    // Parse the URL into page and anchor parts.
    var hashIdx = url.indexOf('#');
    var page = hashIdx === -1 ? url : url.substring(0, hashIdx);
    var anchor = hashIdx === -1 ? '' : url.substring(hashIdx + 1);

    // Determine the current page filename.
    var currentPath = window.location.pathname;
    var currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    // Normalise empty page to index.html for comparison.
    var targetFile = page.substring(page.lastIndexOf('/') + 1) || 'index.html';

    if (targetFile === currentFile && anchor) {
      // Same page -- smooth scroll to anchor.
      var target = document.getElementById(anchor);
      if (target) {
        var headerOffset = getFixedHeaderHeight();
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
        if (history.pushState) {
          history.pushState(null, '', '#' + anchor);
        }
      }
    } else {
      // Different page -- navigate.
      window.location.href = url;
    }
  }

  /**
   * Utility: get fixed header height for scroll offset (mirrors nav.js).
   */
  function getFixedHeaderHeight() {
    var header = document.querySelector('.top-bar, header.fixed, .site-header');
    if (header) {
      var style = window.getComputedStyle(header);
      if (style.position === 'fixed' || style.position === 'sticky') {
        return header.offsetHeight;
      }
    }
    return 0;
  }

  // ---------------------------------------------------------------------------
  // 4. Integration
  // ---------------------------------------------------------------------------

  /**
   * Listen for the 'open-search' custom event dispatched by nav.js (triggered
   * by Ctrl+K, /, or clicking the sidebar search input).
   */
  function setupEventListeners() {
    document.addEventListener('open-search', function () {
      openSearch();
    });

    // Also close on Escape at document level (catches cases where focus is not
    // on the search input).
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isSearchOpen()) {
        e.preventDefault();
        closeSearch();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Inject Styles
  // ---------------------------------------------------------------------------

  /**
   * Injects the CSS for the search overlay directly into the page so that
   * search.js is self-contained and does not depend on the main stylesheet
   * including these rules. If the main CSS already provides these classes,
   * the injected styles act as a fallback with the same specificity.
   */
  function injectStyles() {
    var style = document.createElement('style');
    style.setAttribute('data-search-styles', '');
    style.textContent =
      /* Overlay backdrop */
      '.search-overlay {' +
      '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
      '  background: rgba(0, 0, 0, 0.6);' +
      '  backdrop-filter: blur(4px);' +
      '  -webkit-backdrop-filter: blur(4px);' +
      '  z-index: 9999;' +
      '  display: none;' +
      '  align-items: flex-start;' +
      '  justify-content: center;' +
      '  padding-top: 10vh;' +
      '}' +
      '.search-overlay.visible {' +
      '  display: flex;' +
      '}' +

      /* Modal */
      '.search-modal {' +
      '  background: #1e1e2e;' +
      '  border: 1px solid #45475a;' +
      '  border-radius: 12px;' +
      '  width: 90%;' +
      '  max-width: 640px;' +
      '  max-height: 70vh;' +
      '  display: flex;' +
      '  flex-direction: column;' +
      '  box-shadow: 0 16px 48px rgba(0,0,0,0.4);' +
      '  overflow: hidden;' +
      '}' +

      /* Header / Input */
      '.search-modal-header {' +
      '  padding: 16px;' +
      '  border-bottom: 1px solid #313244;' +
      '}' +
      '.search-input-wrapper {' +
      '  display: flex;' +
      '  align-items: center;' +
      '  gap: 12px;' +
      '  background: #313244;' +
      '  border-radius: 8px;' +
      '  padding: 8px 12px;' +
      '}' +
      '.search-icon {' +
      '  color: #6c7086;' +
      '  flex-shrink: 0;' +
      '  display: flex;' +
      '  align-items: center;' +
      '}' +
      '.search-modal-input {' +
      '  background: transparent;' +
      '  border: none;' +
      '  outline: none;' +
      '  color: #cdd6f4;' +
      '  font-size: 16px;' +
      '  width: 100%;' +
      '  font-family: inherit;' +
      '}' +
      '.search-modal-input::placeholder {' +
      '  color: #6c7086;' +
      '}' +
      '.search-kbd-hint {' +
      '  background: #45475a;' +
      '  color: #a6adc8;' +
      '  padding: 2px 8px;' +
      '  border-radius: 4px;' +
      '  font-size: 12px;' +
      '  font-family: inherit;' +
      '  flex-shrink: 0;' +
      '  border: 1px solid #585b70;' +
      '}' +

      /* Results container */
      '.search-results-container {' +
      '  overflow-y: auto;' +
      '  flex: 1;' +
      '  min-height: 0;' +
      '}' +
      '.search-results {' +
      '  list-style: none;' +
      '  margin: 0;' +
      '  padding: 8px;' +
      '}' +

      /* Hint / No results */
      '.search-hint, .search-no-results {' +
      '  padding: 24px 16px;' +
      '  text-align: center;' +
      '  color: #a6adc8;' +
      '  font-size: 14px;' +
      '  line-height: 1.6;' +
      '}' +
      '.search-hint-text {' +
      '  display: block;' +
      '  margin-bottom: 8px;' +
      '}' +
      '.search-hint-shortcuts {' +
      '  display: block;' +
      '  font-size: 13px;' +
      '  color: #6c7086;' +
      '}' +
      '.search-hint-shortcuts kbd,' +
      '.search-no-results kbd {' +
      '  background: #45475a;' +
      '  color: #a6adc8;' +
      '  padding: 1px 6px;' +
      '  border-radius: 3px;' +
      '  font-size: 12px;' +
      '  border: 1px solid #585b70;' +
      '}' +

      /* Result items */
      '.search-result-item {' +
      '  padding: 10px 12px;' +
      '  border-radius: 8px;' +
      '  cursor: pointer;' +
      '  transition: background 0.15s;' +
      '}' +
      '.search-result-item:hover,' +
      '.search-result-item.active {' +
      '  background: #313244;' +
      '}' +
      '.search-result-header {' +
      '  display: flex;' +
      '  align-items: center;' +
      '  gap: 8px;' +
      '  margin-bottom: 4px;' +
      '}' +
      '.search-result-title {' +
      '  color: #cdd6f4;' +
      '  font-weight: 600;' +
      '  font-size: 14px;' +
      '}' +
      '.search-result-section {' +
      '  background: #45475a;' +
      '  color: #a6adc8;' +
      '  padding: 1px 8px;' +
      '  border-radius: 4px;' +
      '  font-size: 11px;' +
      '  flex-shrink: 0;' +
      '}' +
      '.search-result-description {' +
      '  color: #a6adc8;' +
      '  font-size: 13px;' +
      '  line-height: 1.4;' +
      '}' +
      '.search-result-item mark {' +
      '  background: rgba(203, 166, 247, 0.25);' +
      '  color: #cba6f7;' +
      '  border-radius: 2px;' +
      '  padding: 0 1px;' +
      '}' +

      /* Footer */
      '.search-modal-footer {' +
      '  padding: 10px 16px;' +
      '  border-top: 1px solid #313244;' +
      '  font-size: 12px;' +
      '  color: #6c7086;' +
      '}' +
      '.search-footer-hint kbd {' +
      '  background: #45475a;' +
      '  color: #a6adc8;' +
      '  padding: 1px 6px;' +
      '  border-radius: 3px;' +
      '  font-size: 11px;' +
      '  margin: 0 2px;' +
      '  border: 1px solid #585b70;' +
      '}' +

      /* Scrollbar inside results */
      '.search-results-container::-webkit-scrollbar {' +
      '  width: 6px;' +
      '}' +
      '.search-results-container::-webkit-scrollbar-track {' +
      '  background: transparent;' +
      '}' +
      '.search-results-container::-webkit-scrollbar-thumb {' +
      '  background: #45475a;' +
      '  border-radius: 3px;' +
      '}' +
      '.search-results-container::-webkit-scrollbar-thumb:hover {' +
      '  background: #585b70;' +
      '}';

    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  function init() {
    injectStyles();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
