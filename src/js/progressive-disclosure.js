/**
 * Progressive Disclosure Module
 * Collapsible categories for better information architecture
 */

// ============================================
// 1. COLLAPSIBLE CATEGORIES
// ============================================

class CollapsibleCategories {
  constructor() {
    this.categories = {
      'מידע בסיסי': ['general-info', 'contacts'],
      'ניהול שוטף': ['daily-management', 'calendar-management', 'legal-processes'],
      'פיננסים וספקים': ['financial-management', 'suppliers-management'],
      נהלים: ['procedures'],
    };
    this.expandedCategories = new Set(['מידע בסיסי']); // Default expanded
    this.init();
  }

  init() {
    this.createCollapsibleStructure();
    this.setupEventListeners();
    this.loadState();
    console.log('📂 Progressive Disclosure initialized');
  }

  /**
   * Create collapsible structure in sidebar
   */
  createCollapsibleStructure() {
    const sidebarNav = document.querySelector('aside nav');
    if (!sidebarNav) {
      return;
    }

    // Save all nav tabs
    const allTabs = Array.from(document.querySelectorAll('.nav-tab'));

    // Clear sidebar content
    const parentContainer = sidebarNav.querySelector('.space-y-2');
    if (!parentContainer) {
      return;
    }

    parentContainer.innerHTML = '';

    // Create collapsible categories
    Object.entries(this.categories).forEach(([categoryName, tabIds], index) => {
      const isExpanded = this.expandedCategories.has(categoryName);

      const categoryHTML = `
        <div class="category-group" data-category="${categoryName}">
          <button
            class="category-toggle w-full flex items-center justify-between px-4 py-3 text-right rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
            aria-expanded="${isExpanded}"
            aria-controls="category-${index}"
          >
            <div class="flex items-center space-x-3 space-x-reverse">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                ${index + 1}
              </div>
              <span class="font-semibold text-gray-900 dark:text-white">${categoryName}</span>
            </div>
            <svg class="w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
            </svg>
          </button>
          <div
            id="category-${index}"
            class="category-content space-y-1 mt-2 pr-4 ${isExpanded ? '' : 'hidden'}"
            role="region"
            aria-labelledby="category-toggle-${index}"
          >
            <!-- Tabs will be inserted here -->
          </div>
        </div>
      `;

      parentContainer.insertAdjacentHTML('beforeend', categoryHTML);

      // Insert relevant tabs
      const categoryContent = parentContainer.querySelector(`#category-${index}`);
      tabIds.forEach((tabId) => {
        const tab = allTabs.find((t) => t.getAttribute('data-tab') === tabId);
        if (tab) {
          const clonedTab = tab.cloneNode(true);
          clonedTab.classList.add('mr-4'); // Indent
          categoryContent.appendChild(clonedTab);
        }
      });
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.querySelectorAll('.category-toggle').forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        const categoryGroup = e.currentTarget.closest('.category-group');
        const categoryName = categoryGroup.getAttribute('data-category');
        this.toggleCategory(categoryName, toggle);
      });
    });

    // Re-bind tab click handlers
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (typeof showTab === 'function') {
          showTab(tabName);
        }
      });
    });
  }

  /**
   * Toggle category expansion
   */
  toggleCategory(categoryName, toggleButton) {
    const isExpanded = this.expandedCategories.has(categoryName);
    const content = toggleButton.nextElementSibling;
    const icon = toggleButton.querySelector('svg');

    if (isExpanded) {
      // Collapse
      this.expandedCategories.delete(categoryName);
      content.classList.add('hidden');
      icon.classList.remove('rotate-90');
      toggleButton.setAttribute('aria-expanded', 'false');
    } else {
      // Expand
      this.expandedCategories.add(categoryName);
      content.classList.remove('hidden');
      icon.classList.add('rotate-90');
      toggleButton.setAttribute('aria-expanded', 'true');
    }

    // Save state
    this.saveState();

    // Announce to screen readers
    if (typeof announceToScreenReader !== 'undefined') {
      announceToScreenReader(`קטגוריה ${categoryName} ${isExpanded ? 'נסגרה' : 'נפתחה'}`);
    }
  }

  /**
   * Save expanded state to localStorage
   */
  saveState() {
    localStorage.setItem('expandedCategories', JSON.stringify(Array.from(this.expandedCategories)));
  }

  /**
   * Load expanded state from localStorage
   */
  loadState() {
    const saved = localStorage.getItem('expandedCategories');
    if (saved) {
      try {
        this.expandedCategories = new Set(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load category state', e);
      }
    }
  }
}

// ============================================
// 2. SEARCH IMPROVEMENTS
// ============================================

class SearchEnhancements {
  constructor() {
    this.recentSearches = [];
    this.maxRecentSearches = 5;
    this.suggestions = [];
    this.init();
  }

  init() {
    this.loadRecentSearches();
    this.setupSearchEnhancements();
    this.buildSearchIndex();
    console.log('🔍 Search Improvements initialized');
  }

  /**
   * Build search index from content
   */
  buildSearchIndex() {
    const searchableElements = document.querySelectorAll('.editable, h2, h3, h4, p');
    const keywords = new Set();

    searchableElements.forEach((el) => {
      const text = el.textContent.toLowerCase();
      const words = text.split(/\s+/).filter((w) => w.length > 2);
      words.forEach((word) => keywords.add(word));
    });

    this.suggestions = Array.from(keywords).slice(0, 50); // Top 50 keywords
  }

  /**
   * Setup search enhancements
   */
  setupSearchEnhancements() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) {
      return;
    }

    // Create suggestions dropdown
    const suggestionsHTML = `
      <div id="search-suggestions" class="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden z-50 max-h-60 overflow-y-auto">
        <div class="p-2">
          <div id="recent-searches" class="mb-2">
            <!-- Recent searches will appear here -->
          </div>
          <div id="search-suggestions-list">
            <!-- Suggestions will appear here -->
          </div>
        </div>
      </div>
    `;

    searchInput.parentElement.style.position = 'relative';
    searchInput.parentElement.insertAdjacentHTML('beforeend', suggestionsHTML);

    this.suggestionsDropdown = document.getElementById('search-suggestions');

    // Show suggestions on focus
    searchInput.addEventListener('focus', () => {
      this.showRecentSearches();
    });

    // Hide on blur (with delay for clicks)
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.hideSuggestions();
      }, 200);
    });

    // Show suggestions as user types
    searchInput.addEventListener(
      'input',
      debounce((e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          this.showSuggestions(query);
        } else {
          this.showRecentSearches();
        }
      }, 150),
    );

    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        this.addRecentSearch(searchInput.value.trim());
        this.hideSuggestions();
      }
    });
  }

  /**
   * Show recent searches
   */
  showRecentSearches() {
    if (this.recentSearches.length === 0) {
      this.hideSuggestions();
      return;
    }

    const recentContainer = document.getElementById('recent-searches');
    if (!recentContainer) {
      return;
    }

    const recentHTML = `
      <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">חיפושים אחרונים</div>
      ${this.recentSearches
    .map(
      (search) => `
        <button
          class="w-full text-right px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
          onclick="document.getElementById('global-search').value='${search}'; document.getElementById('global-search').dispatchEvent(new Event('input'));"
        >
          <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
          </svg>
          <span class="flex-1 text-gray-700 dark:text-gray-300">${search}</span>
        </button>
      `,
    )
    .join('')}
    `;

    recentContainer.innerHTML = recentHTML;
    this.suggestionsDropdown.classList.remove('hidden');
  }

  /**
   * Show suggestions based on query
   */
  showSuggestions(query) {
    const matches = this.suggestions
      .filter((word) => word.includes(query.toLowerCase()))
      .slice(0, 5);

    if (matches.length === 0) {
      this.hideSuggestions();
      return;
    }

    const suggestionsContainer = document.getElementById('search-suggestions-list');
    if (!suggestionsContainer) {
      return;
    }

    const suggestionsHTML = `
      <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">הצעות</div>
      ${matches
    .map(
      (word) => `
        <button
          class="w-full text-right px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
          onclick="document.getElementById('global-search').value='${word}'; document.getElementById('global-search').dispatchEvent(new Event('input'));"
        >
          <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
          </svg>
          <span class="flex-1 text-gray-700 dark:text-gray-300">${word}</span>
        </button>
      `,
    )
    .join('')}
    `;

    suggestionsContainer.innerHTML = suggestionsHTML;
    this.suggestionsDropdown.classList.remove('hidden');
  }

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    this.suggestionsDropdown?.classList.add('hidden');
  }

  /**
   * Add to recent searches
   */
  addRecentSearch(query) {
    if (!query || this.recentSearches.includes(query)) {
      return;
    }

    this.recentSearches.unshift(query);
    this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches);
    this.saveRecentSearches();
  }

  /**
   * Save recent searches
   */
  saveRecentSearches() {
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  /**
   * Load recent searches
   */
  loadRecentSearches() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        this.recentSearches = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load recent searches', e);
      }
    }
  }
}

// ============================================
// 3. INITIALIZATION
// ============================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProgressiveDisclosure);
} else {
  initializeProgressiveDisclosure();
}

function initializeProgressiveDisclosure() {
  // Wait for main content to load
  setTimeout(() => {
    const categories = new CollapsibleCategories();
    const searchEnhancements = new SearchEnhancements();

    console.log('✨ Progressive Disclosure & Search Enhancements ready');
  }, 500);
}

// Helper: debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.CollapsibleCategories = CollapsibleCategories;
window.SearchEnhancements = SearchEnhancements;
