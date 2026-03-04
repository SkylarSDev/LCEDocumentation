/**
 * Sidebar Navigation Script
 * LCE Documentation Site
 *
 * Handles:
 * - Mobile hamburger toggle (open/close sidebar)
 * - Active page highlighting based on current URL
 * - Smooth scroll to same-page anchors
 * - Collapsible sidebar sections with sessionStorage persistence
 * - Keyboard shortcuts (Escape, Ctrl+K, /)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Breakpoint at which sidebar switches to mobile overlay mode. */
  var MOBILE_BREAKPOINT = 768;

  /** Key prefix used in sessionStorage for collapsed section state. */
  var STORAGE_PREFIX = 'lce-nav-collapsed-';

  // ---------------------------------------------------------------------------
  // DOM references (resolved after DOMContentLoaded)
  // ---------------------------------------------------------------------------

  var hamburger = null;
  var sidebar = null;
  var navLinks = [];
  var sectionTitles = [];

  // ---------------------------------------------------------------------------
  // 1. Mobile Hamburger Toggle
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the viewport width is below the mobile breakpoint.
   */
  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  /**
   * Opens the mobile sidebar by adding the .open class.
   */
  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add('open');
    }
  }

  /**
   * Closes the mobile sidebar by removing the .open class.
   */
  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove('open');
    }
  }

  /**
   * Toggles the sidebar open/closed.
   */
  function toggleSidebar() {
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }

  /**
   * Hamburger button click handler.
   */
  function onHamburgerClick(e) {
    e.stopPropagation();
    toggleSidebar();
  }

  /**
   * Close the sidebar when clicking anywhere outside it on mobile.
   */
  function onDocumentClick(e) {
    if (!isMobile()) return;
    if (!sidebar || !sidebar.classList.contains('open')) return;

    // If the click target is inside the sidebar or is the hamburger, do nothing.
    if (sidebar.contains(e.target)) return;
    if (hamburger && hamburger.contains(e.target)) return;

    closeSidebar();
  }

  /**
   * Close the sidebar when a navigation link is clicked on mobile.
   */
  function onNavLinkClick() {
    if (isMobile()) {
      closeSidebar();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Active Page Highlighting
  // ---------------------------------------------------------------------------

  /**
   * Determines the current page filename from window.location and marks the
   * matching .nav-link in the sidebar with the .active class.
   */
  function highlightActivePage() {
    // Extract the filename from the URL pathname.
    var path = window.location.pathname;
    var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    // Normalise: if empty or just "/", default to index.html
    if (!filename || filename === '' || filename === '/') {
      filename = 'index.html';
    }

    var matched = false;

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var href = link.getAttribute('href') || '';

      // Compare just the filename portion (ignore query/hash).
      var linkFile = href.split('#')[0].split('?')[0];
      linkFile = linkFile.substring(linkFile.lastIndexOf('/') + 1) || '';

      if (linkFile === filename) {
        link.classList.add('active');
        matched = true;

        // Also ensure the parent section is expanded if collapsible.
        expandParentSection(link);
      } else {
        link.classList.remove('active');
      }
    }

    // If nothing matched, try to default-highlight the index link.
    if (!matched) {
      for (var j = 0; j < navLinks.length; j++) {
        var fallbackHref = (navLinks[j].getAttribute('href') || '').split('#')[0].split('?')[0];
        var fallbackFile = fallbackHref.substring(fallbackHref.lastIndexOf('/') + 1);
        if (fallbackFile === 'index.html') {
          navLinks[j].classList.add('active');
          expandParentSection(navLinks[j]);
          break;
        }
      }
    }
  }

  /**
   * If the link is inside a collapsible section (.nav-links container below a
   * .nav-section-title), ensure that section is expanded.
   */
  function expandParentSection(linkEl) {
    var container = linkEl.closest('.nav-links');
    if (container) {
      container.classList.remove('collapsed');
      // Also update the sibling title marker.
      var title = container.previousElementSibling;
      if (title && title.classList.contains('nav-section-title')) {
        title.classList.remove('collapsed');
        saveSectionState(title, false);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Smooth Scroll to Anchors
  // ---------------------------------------------------------------------------

  /**
   * Intercepts clicks on hash-links that point to the current page and performs
   * a smooth scroll to the target element, accounting for any fixed header.
   */
  function setupSmoothScroll() {
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href*="#"]');
      if (!anchor) return;

      var href = anchor.getAttribute('href') || '';
      if (!href) return;

      // Split into page and hash parts.
      var parts = href.split('#');
      var page = parts[0];
      var hash = parts[1];

      if (!hash) return;

      // Determine whether this link targets the current page.
      var currentFile = window.location.pathname.substring(
        window.location.pathname.lastIndexOf('/') + 1
      ) || 'index.html';

      var linkFile = page.substring(page.lastIndexOf('/') + 1);

      // Same page: either empty page part, or matches current filename.
      var isSamePage = !page || linkFile === currentFile;

      if (isSamePage) {
        var target = document.getElementById(hash);
        if (target) {
          e.preventDefault();

          // Account for fixed header offset (if any).
          var headerOffset = getFixedHeaderHeight();
          var elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
          var offsetPosition = elementPosition - headerOffset - 16; // 16px breathing room

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update the URL hash without jumping.
          if (history.pushState) {
            history.pushState(null, '', '#' + hash);
          }

          // Close sidebar on mobile after navigation.
          if (isMobile()) {
            closeSidebar();
          }
        }
      }
    });
  }

  /**
   * Returns the height of the fixed header element if one exists, so we can
   * offset smooth scrolling accordingly.
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
  // 4. Collapsible Sidebar Sections
  // ---------------------------------------------------------------------------

  /**
   * Sets up click handlers on .nav-section-title elements so they toggle the
   * visibility of their adjacent .nav-links container. Collapse state is
   * persisted in sessionStorage.
   */
  function setupCollapsibleSections() {
    for (var i = 0; i < sectionTitles.length; i++) {
      var title = sectionTitles[i];

      // Restore persisted state.
      var isCollapsed = loadSectionState(title);
      if (isCollapsed) {
        title.classList.add('collapsed');
        var links = title.nextElementSibling;
        if (links && links.classList.contains('nav-links')) {
          links.classList.add('collapsed');
        }
      }

      title.addEventListener('click', onSectionTitleClick);
    }
  }

  /**
   * Click handler for a .nav-section-title. Toggles the collapsed state of
   * itself and the next sibling .nav-links container.
   */
  function onSectionTitleClick() {
    var title = this;
    var links = title.nextElementSibling;

    if (!links || !links.classList.contains('nav-links')) return;

    var nowCollapsed = !title.classList.contains('collapsed');

    title.classList.toggle('collapsed');
    links.classList.toggle('collapsed');

    saveSectionState(title, nowCollapsed);
  }

  /**
   * Generates a storage key from the section title's text content.
   */
  function getSectionKey(titleEl) {
    var text = (titleEl.textContent || titleEl.innerText || '').trim();
    return STORAGE_PREFIX + text.replace(/\s+/g, '-').toLowerCase();
  }

  /**
   * Saves collapsed state to sessionStorage.
   */
  function saveSectionState(titleEl, isCollapsed) {
    try {
      var key = getSectionKey(titleEl);
      sessionStorage.setItem(key, isCollapsed ? '1' : '0');
    } catch (e) {
      // sessionStorage may not be available in some contexts; silently ignore.
    }
  }

  /**
   * Loads collapsed state from sessionStorage. Returns true if collapsed.
   */
  function loadSectionState(titleEl) {
    try {
      var key = getSectionKey(titleEl);
      return sessionStorage.getItem(key) === '1';
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Keyboard Shortcuts
  // ---------------------------------------------------------------------------

  /**
   * Global keydown handler for navigation-related shortcuts:
   * - Escape: close mobile sidebar
   * - Ctrl+K or / (when not focused on an input): open search
   */
  function onKeyDown(e) {
    // Escape -- close mobile sidebar.
    if (e.key === 'Escape') {
      if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
        e.preventDefault();
        return;
      }
    }

    // Ctrl+K -- open search overlay (dispatch custom event for search.js).
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      dispatchOpenSearch();
      return;
    }

    // "/" key -- open search, but only if user is not typing in an input field.
    if (e.key === '/' && !isInputFocused()) {
      e.preventDefault();
      dispatchOpenSearch();
      return;
    }
  }

  /**
   * Returns true if the currently focused element is an input, textarea, or
   * contenteditable element, so we don't steal keystrokes from them.
   */
  function isInputFocused() {
    var active = document.activeElement;
    if (!active) return false;
    var tag = active.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (active.isContentEditable) return true;
    return false;
  }

  /**
   * Dispatches the 'open-search' custom event on the document so that
   * search.js can listen and open its overlay.
   */
  function dispatchOpenSearch() {
    var event;
    try {
      event = new CustomEvent('open-search');
    } catch (e) {
      // Fallback for older browsers.
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('open-search', true, true, null);
    }
    document.dispatchEvent(event);
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  function init() {
    // Resolve DOM references.
    hamburger = document.querySelector('.hamburger');
    sidebar = document.querySelector('.sidebar');
    navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    sectionTitles = Array.prototype.slice.call(document.querySelectorAll('.nav-section-title'));

    // 1. Mobile hamburger.
    if (hamburger) {
      hamburger.addEventListener('click', onHamburgerClick);
    }
    document.addEventListener('click', onDocumentClick);

    // Attach link click handlers for mobile close.
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', onNavLinkClick);
    }

    // 2. Active page highlighting.
    highlightActivePage();

    // 3. Smooth scroll.
    setupSmoothScroll();

    // 4. Collapsible sections.
    setupCollapsibleSections();

    // 5. Keyboard shortcuts.
    document.addEventListener('keydown', onKeyDown);

    // Also allow the sidebar search input to open the search overlay on focus.
    var sidebarSearchInput = document.querySelector('.sidebar .search-input, .sidebar #search-input');
    if (sidebarSearchInput) {
      sidebarSearchInput.addEventListener('focus', function (e) {
        // Prevent normal focus; open search overlay instead.
        e.target.blur();
        dispatchOpenSearch();
      });
      // Also handle click in case focus doesn't fire.
      sidebarSearchInput.addEventListener('click', function (e) {
        e.preventDefault();
        e.target.blur();
        dispatchOpenSearch();
      });
    }
  }

  // Wait for DOM to be ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
