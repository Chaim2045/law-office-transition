/**
 * Enhanced Search System
 * Provides smart search with fuzzy matching, suggestions, and auto-navigation
 *
 * Features:
 * - Real-time search results dropdown
 * - Fuzzy matching for typos
 * - "Did you mean?" suggestions
 * - Jump to exact location with highlight
 * - Score-based result ranking
 */

class EnhancedSearch {
  constructor() {
    this.searchInput = document.getElementById('global-search');
    this.searchResults = null;
    this.currentResults = [];
    this.init();
  }

  /**
   * Initialize the enhanced search system
   */
  init() {
    this.createResultsContainer();
    this.bindEvents();
  }

  /**
   * Create the dropdown container for search results
   */
  createResultsContainer() {
    const container = document.createElement('div');
    container.id = 'enhanced-search-results';
    container.className =
      'absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto hidden z-50';

    if (this.searchInput && this.searchInput.parentElement) {
      // Make parent relative for absolute positioning
      this.searchInput.parentElement.style.position = 'relative';
      this.searchInput.parentElement.appendChild(container);
      this.searchResults = container;
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.searchInput) return;

    // Real-time search with debounce
    this.searchInput.addEventListener(
      'input',
      this.debounce(() => {
        this.performEnhancedSearch();
      }, 300),
    );

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('#global-search') &&
        !e.target.closest('#enhanced-search-results')
      ) {
        this.hideResults();
      }
    });

    // Handle keyboard shortcuts
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideResults();
        this.searchInput.blur();
      }
    });
  }

  /**
   * Perform enhanced search with fuzzy matching
   */
  performEnhancedSearch() {
    const query = this.searchInput.value.trim();

    if (query.length < 2) {
      this.hideResults();
      return;
    }

    // Get all searchable content
    const searchableItems = this.getAllSearchableItems();

    // Find matches
    const matches = this.fuzzySearch(query, searchableItems);

    if (matches.length === 0) {
      // No results - show suggestions
      this.showDidYouMean(query, searchableItems);
    } else {
      // Show results with jump buttons
      this.showResults(matches, query);
    }
  }

  /**
   * Get all searchable items from the page with context
   * @returns {Array} Array of searchable items with metadata
   */
  getAllSearchableItems() {
    const items = [];
    const tabs = document.querySelectorAll('.tab-content');

    tabs.forEach((tab) => {
      const tabName = tab.id;
      const tabTitle = this.getTabTitle(tabName);

      // Get all text elements in this tab
      const elements = tab.querySelectorAll('h2, h3, h4, p, li, .editable, td');

      elements.forEach((element) => {
        const text = element.textContent.trim();
        if (text.length > 0) {
          const context = this.getElementContext(element);

          items.push({
            text,
            element,
            tabName,
            tabTitle,
            context,
            type: element.tagName.toLowerCase(),
          });
        }
      });
    });

    return items;
  }

  /**
   * Get tab title from tab ID
   * @param {string} tabId - Tab element ID
   * @returns {string} Human-readable tab title
   */
  getTabTitle(tabId) {
    const navItems = {
      'general-info': 'מידע כללי על המשרד',
      'daily-management': 'ניהול יומי',
      'calendar-management': 'ניהול יומן',
      'legal-processes': 'תהליכי עבודה משפטיים',
      'financial-management': 'ניהול פיננסי',
      'suppliers-tenants': 'ניהול ספקים ושוכרים',
      procedures: 'נהלים שונים',
      contacts: 'אנשי קשר',
    };
    return navItems[tabId] || tabId;
  }

  /**
   * Get context (nearest heading) for an element
   * @param {HTMLElement} element - Element to find context for
   * @returns {string} Context heading text
   */
  getElementContext(element) {
    let current = element;
    while (current && current.parentElement) {
      current = current.previousElementSibling || current.parentElement;
      if (current && /^H[1-6]$/.test(current.tagName)) {
        return current.textContent.trim();
      }
    }
    return '';
  }

  /**
   * Perform fuzzy search and rank results
   * @param {string} query - Search query
   * @param {Array} items - Items to search through
   * @returns {Array} Matched items with scores
   */
  fuzzySearch(query, items) {
    const queryLower = query.toLowerCase();
    const matches = [];

    items.forEach((item) => {
      const textLower = item.text.toLowerCase();
      const contextLower = item.context.toLowerCase();

      // Exact match - highest priority
      if (textLower.includes(queryLower)) {
        matches.push({
          ...item,
          score: 100,
          matchType: 'exact',
          matchText: this.highlightMatch(item.text, query),
        });
      }
      // Context match - medium priority
      else if (contextLower.includes(queryLower)) {
        matches.push({
          ...item,
          score: 70,
          matchType: 'context',
          matchText: item.text,
        });
      }
      // Fuzzy match - lower priority
      else {
        const similarity = this.calculateSimilarity(queryLower, textLower);
        if (similarity > 0.6) {
          matches.push({
            ...item,
            score: Math.floor(similarity * 60),
            matchType: 'fuzzy',
            matchText: item.text,
          });
        }
      }
    });

    // Sort by score and limit to top 10
    return matches.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * Calculate similarity between two strings (0-1)
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 || len2 === 0) return 0;

    // Check substring match
    if (str2.includes(str1)) {
      return 0.8 + (str1.length / str2.length) * 0.2;
    }

    // Calculate character-by-character similarity
    let matches = 0;
    const minLen = Math.min(len1, len2);

    for (let i = 0; i < minLen; i += 1) {
      if (str1[i] === str2[i]) matches += 1;
    }

    return matches / Math.max(len1, len2);
  }

  /**
   * Highlight matching text in result
   * @param {string} text - Original text
   * @param {string} query - Search query
   * @returns {string} HTML with highlighted matches
   */
  highlightMatch(text, query) {
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>',
    );
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Display search results
   * @param {Array} matches - Matched items
   * @param {string} query - Original query
   */
  showResults(matches, query) {
    if (!this.searchResults) return;

    this.currentResults = matches;

    const resultsHTML = `
      <div class="p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
          <span>נמצאו ${matches.length} תוצאות עבור "${query}"</span>
          <button onclick="enhancedSearch.hideResults()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div class="space-y-2">
          ${matches.map((match, index) => this.renderResultItem(match, index)).join('')}
        </div>
      </div>
    `;

    this.searchResults.innerHTML = resultsHTML;
    this.searchResults.classList.remove('hidden');
  }

  /**
   * Render a single result item
   * @param {Object} match - Match object
   * @param {number} index - Result index
   * @returns {string} HTML for result item
   */
  renderResultItem(match, index) {
    const scoreColor =
      match.score >= 90
        ? 'text-green-600'
        : match.score >= 70
          ? 'text-blue-600'
          : 'text-yellow-600';

    const matchTypeLabel =
      match.matchType === 'exact'
        ? '🎯 התאמה מלאה'
        : match.matchType === 'context'
          ? '📍 התאמה בהקשר'
          : '🔍 התאמה חלקית';

    return `
      <div class="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer border border-transparent hover:border-blue-300 dark:hover:border-blue-600"
           onclick="enhancedSearch.jumpToResult(${index})">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs ${scoreColor} font-medium">${matchTypeLabel}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">${match.tabTitle}</span>
            </div>
            ${match.context ? `<div class="text-xs text-gray-400 dark:text-gray-500 mb-1">📂 ${match.context}</div>` : ''}
            <div class="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">${match.matchText}</div>
          </div>
          <div class="flex-shrink-0">
            <button class="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100">
              קפוץ ←
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show "Did you mean?" suggestions when no results found
   * @param {string} query - Original query
   * @param {Array} allItems - All searchable items
   */
  showDidYouMean(query, allItems) {
    if (!this.searchResults) return;

    const suggestions = this.findSimilarTerms(query, allItems);

    if (suggestions.length === 0) {
      this.searchResults.innerHTML = `
        <div class="p-6 text-center">
          <div class="text-4xl mb-3">🔍</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">לא נמצאו תוצאות</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">לא נמצאו תוצאות עבור "${query}"</p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">נסה לחפש משהו אחר או לבדוק את האיות</p>
        </div>
      `;
    } else {
      this.searchResults.innerHTML = `
        <div class="p-6">
          <div class="text-center mb-4">
            <div class="text-4xl mb-3">🤔</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">לא נמצאו תוצאות מדויקות</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">לא נמצאו תוצאות עבור "${query}"</p>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">💡 האם התכוונת ל:</p>
            <div class="space-y-2">
              ${suggestions
                .map(
                  (suggestion) => `
                <button onclick="enhancedSearch.searchForSuggestion('${this.escapeHtml(suggestion)}')"
                        class="w-full text-right px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all group">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-900 dark:text-gray-100">${suggestion}</span>
                    <span class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </button>
              `,
                )
                .join('')}
            </div>
          </div>
        </div>
      `;
    }

    this.searchResults.classList.remove('hidden');
  }

  /**
   * Find similar terms for suggestions
   * @param {string} query - Original query
   * @param {Array} items - All searchable items
   * @returns {Array} Array of suggested terms
   */
  findSimilarTerms(query, items) {
    const queryLower = query.toLowerCase();
    const uniqueTerms = new Set();

    // Extract unique terms
    items.forEach((item) => {
      const words = item.text.split(/\s+/);
      words.forEach((word) => {
        if (word.length >= 3) {
          uniqueTerms.add(word.trim());
        }
      });
    });

    // Find similar terms
    const similar = [];
    uniqueTerms.forEach((term) => {
      const termLower = term.toLowerCase();
      const similarity = this.calculateSimilarity(queryLower, termLower);

      if (
        similarity > 0.5 ||
        termLower.includes(queryLower) ||
        queryLower.includes(termLower)
      ) {
        similar.push({ term, similarity });
      }
    });

    // Sort and return top 5
    return similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map((s) => s.term);
  }

  /**
   * Search for a suggested term
   * @param {string} suggestion - Suggested search term
   */
  searchForSuggestion(suggestion) {
    this.searchInput.value = suggestion;
    this.performEnhancedSearch();
  }

  /**
   * Jump to search result location
   * @param {number} index - Result index
   */
  jumpToResult(index) {
    const result = this.currentResults[index];
    if (!result) return;

    // Switch to correct tab
    if (window.showTab) {
      window.showTab(result.tabName);
    }

    // Wait for tab to render, then scroll and highlight
    setTimeout(() => {
      const { element } = result;

      // Scroll into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Highlight element
      this.highlightElement(element);

      // Hide results
      this.hideResults();

      // Show toast notification
      if (window.showToast) {
        const preview = result.context || result.text.substring(0, 50);
        window.showToast(`נמצא: ${preview}...`, 'success');
      }
    }, 100);
  }

  /**
   * Highlight an element temporarily
   * @param {HTMLElement} element - Element to highlight
   */
  highlightElement(element) {
    // Remove existing highlights
    document.querySelectorAll('.search-highlight-jump').forEach((el) => {
      el.classList.remove('search-highlight-jump');
    });

    // Add highlight class
    element.classList.add('search-highlight-jump');

    // Remove after 3 seconds
    setTimeout(() => {
      element.classList.remove('search-highlight-jump');
    }, 3000);
  }

  /**
   * Hide search results dropdown
   */
  hideResults() {
    if (this.searchResults) {
      this.searchResults.classList.add('hidden');
    }
  }

  /**
   * Debounce helper function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize enhanced search on page load
let enhancedSearch;
document.addEventListener('DOMContentLoaded', () => {
  enhancedSearch = new EnhancedSearch();
});