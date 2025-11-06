/**
 * UX Enhancements Module
 * Senior-level UX improvements for law-office-transition
 *
 * Features:
 * - Keyboard shortcuts (/, Esc, Ctrl+S, Ctrl+Z, Tab navigation)
 * - Undo/Redo mechanism with history stack
 * - Enhanced focus management
 * - Loading states
 * - Empty states
 * - Confirmation dialogs
 */

// ============================================
// 1. HISTORY MANAGEMENT (Undo/Redo)
// ============================================

class HistoryManager {
  constructor(maxSize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  /**
   * Add a new state to history
   * @param {Object} state - The state to save { field, oldValue, newValue }
   */
  push(state) {
    // Remove any future states if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push({
      ...state,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    this.updateUndoRedoButtons();
  }

  /**
   * Undo last action
   * @returns {Object|null} The state to restore
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }

    const state = this.history[this.currentIndex];
    this.currentIndex--;
    this.updateUndoRedoButtons();

    return {
      field: state.field,
      value: state.oldValue,
    };
  }

  /**
   * Redo last undone action
   * @returns {Object|null} The state to restore
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    const state = this.history[this.currentIndex];
    this.updateUndoRedoButtons();

    return {
      field: state.field,
      value: state.newValue,
    };
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
      undoBtn.classList.toggle('opacity-50', !this.canUndo());
      undoBtn.classList.toggle('cursor-not-allowed', !this.canUndo());
    }

    if (redoBtn) {
      redoBtn.disabled = !this.canRedo();
      redoBtn.classList.toggle('opacity-50', !this.canRedo());
      redoBtn.classList.toggle('cursor-not-allowed', !this.canRedo());
    }
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.updateUndoRedoButtons();
  }
}

// Global instance
const historyManager = new HistoryManager();

// ============================================
// 2. KEYBOARD SHORTCUTS
// ============================================

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.isEnabled = true;
    this.init();
  }

  init() {
    document.addEventListener('keydown', this.handleKeydown.bind(this));

    // Register default shortcuts
    this.register('/', this.focusSearch.bind(this), 'Focus search bar');
    this.register('Escape', this.handleEscape.bind(this), 'Close modals/clear search');
    this.register('ctrl+s', this.saveAll.bind(this), 'Save all changes');
    this.register('ctrl+z', this.undo.bind(this), 'Undo last change');
    this.register('ctrl+y', this.redo.bind(this), 'Redo last change');
    this.register('ctrl+shift+z', this.redo.bind(this), 'Redo last change');
    this.register('?', this.showHelp.bind(this), 'Show keyboard shortcuts');
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - The key combination (e.g., 'ctrl+s', '/')
   * @param {Function} callback - The function to call
   * @param {string} description - Description for help menu
   */
  register(key, callback, description = '') {
    this.shortcuts.set(key.toLowerCase(), { callback, description });
  }

  handleKeydown(e) {
    if (!this.isEnabled) {
      return;
    }

    // Don't trigger shortcuts when typing in input fields (except specific keys)
    const activeElement = document.activeElement;
    const isInputField = activeElement.tagName === 'INPUT'
      || activeElement.tagName === 'TEXTAREA'
      || activeElement.isContentEditable;

    // Build key combination string
    let key = e.key.toLowerCase();

    if (e.ctrlKey || e.metaKey) {
      key = `ctrl+${key}`;
    }
    if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
      key = `shift+${key}`;
    }
    if (e.ctrlKey && e.shiftKey) {
      key = `ctrl+shift+${e.key.toLowerCase()}`;
    }

    // Allow '/' and '?' even in input fields (to show help)
    if (isInputField && !['/', '?', 'escape'].includes(e.key.toLowerCase()) && !e.ctrlKey) {
      return;
    }

    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      e.preventDefault();
      shortcut.callback(e);
    }
  }

  focusSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  handleEscape() {
    // Close modals
    const modals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
    if (modals.length > 0) {
      modals.forEach((modal) => modal.classList.add('hidden'));
      return;
    }

    // Clear search
    const searchInput = document.getElementById('global-search');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.blur();
      return;
    }

    // Blur active element
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }

  saveAll(e) {
    // Only if in edit mode
    if (typeof editMode !== 'undefined' && editMode) {
      const editToggle = document.getElementById('edit-mode-toggle');
      if (editToggle) {
        editToggle.click();
        if (typeof showToast === 'function') {
          showToast('שינויים נשמרו (Ctrl+S)', 'success');
        }
      }
    } else if (typeof showToast === 'function') {
      showToast('אין שינויים לשמירה', 'info');
    }
  }

  undo() {
    const state = historyManager.undo();
    if (state && typeof window.restoreFieldValue === 'function') {
      window.restoreFieldValue(state.field, state.value);
      if (typeof showToast === 'function') {
        showToast('ביטול פעולה (Ctrl+Z)', 'info');
      }
    } else if (!state) {
      if (typeof showToast === 'function') {
        showToast('אין פעולות לביטול', 'warning');
      }
    }
  }

  redo() {
    const state = historyManager.redo();
    if (state && typeof window.restoreFieldValue === 'function') {
      window.restoreFieldValue(state.field, state.value);
      if (typeof showToast === 'function') {
        showToast('שחזור פעולה (Ctrl+Y)', 'info');
      }
    } else if (!state) {
      if (typeof showToast === 'function') {
        showToast('אין פעולות לשחזור', 'warning');
      }
    }
  }

  showHelp() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .map(
        ([
          key,
          { description },
        ]) => `<div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">${description}</span>
          <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">${key}</kbd>
        </div>`,
      )
      .join('');

    const modalHTML = `
      <div id="shortcuts-help-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">קיצורי מקלדת</h3>
              <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="p-6 max-h-96 overflow-y-auto">
            ${shortcuts}
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById('shortcuts-help-modal');
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Global instance
const keyboardShortcuts = new KeyboardShortcuts();

// ============================================
// 3. ENHANCED LOADING STATES
// ============================================

class LoadingStateManager {
  /**
   * Show loading indicator on an element
   * @param {HTMLElement|string} element - Element or element ID
   * @param {string} message - Loading message
   */
  static show(element, message = 'טוען...') {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) {
      return;
    }

    const loadingHTML = `
      <div class="loading-state absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 rounded-lg">
        <div class="text-center">
          <div class="loading-spinner mx-auto mb-2"></div>
          <div class="text-sm text-gray-600 dark:text-gray-400">${message}</div>
        </div>
      </div>
    `;

    el.style.position = 'relative';
    el.insertAdjacentHTML('beforeend', loadingHTML);
  }

  /**
   * Hide loading indicator
   * @param {HTMLElement|string} element - Element or element ID
   */
  static hide(element) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) {
      return;
    }

    const loadingState = el.querySelector('.loading-state');
    if (loadingState) {
      loadingState.remove();
    }
  }

  /**
   * Show button loading state
   * @param {HTMLElement} button - Button element
   * @param {string} loadingText - Text to show while loading
   */
  static buttonLoading(button, loadingText = 'טוען...') {
    if (!button) {
      return;
    }

    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `
      <div class="flex items-center justify-center">
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
        <span>${loadingText}</span>
      </div>
    `;
  }

  /**
   * Reset button to normal state
   * @param {HTMLElement} button - Button element
   */
  static buttonReset(button) {
    if (!button) {
      return;
    }

    button.disabled = false;
    button.textContent = button.dataset.originalText || '';
    delete button.dataset.originalText;
  }
}

// ============================================
// 4. EMPTY STATES
// ============================================

class EmptyStateManager {
  /**
   * Show empty state in a container
   * @param {HTMLElement|string} container - Container element or ID
   * @param {Object} options - Options for empty state
   */
  static show(container, options = {}) {
    const {
      icon = 'search',
      title = 'לא נמצאו תוצאות',
      message = 'נסה לשנות את מילות החיפוש',
      actionText = null,
      actionCallback = null,
    } = options;

    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) {
      return;
    }

    const icons = {
      search:
        '<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>',
      empty:
        '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>',
      error:
        '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>',
    };

    const actionHTML = actionText && actionCallback
      ? `<button onclick="${actionCallback}" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">${actionText}</button>`
      : '';

    const emptyHTML = `
      <div class="empty-state flex flex-col items-center justify-center py-16 text-center">
        <svg class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
          ${icons[icon] || icons.empty}
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-sm">${message}</p>
        ${actionHTML}
      </div>
    `;

    el.innerHTML = emptyHTML;
  }

  /**
   * Hide empty state
   * @param {HTMLElement|string} container - Container element or ID
   */
  static hide(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) {
      return;
    }

    const emptyState = el.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
  }
}

// ============================================
// 5. CONFIRMATION DIALOGS
// ============================================

class ConfirmDialog {
  /**
   * Show a confirmation dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<boolean>} - Resolves with user's choice
   */
  static async show(options = {}) {
    const {
      title = 'אישור פעולה',
      message = 'האם אתה בטוח?',
      confirmText = 'אישור',
      cancelText = 'ביטול',
      type = 'warning', // warning, danger, info
    } = options;

    return new Promise((resolve) => {
      const typeColors = {
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        danger: 'bg-red-600 hover:bg-red-700',
        info: 'bg-blue-600 hover:bg-blue-700',
      };

      const modalHTML = `
        <div id="confirm-dialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slide-up">
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">${title}</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-6">${message}</p>
              <div class="flex gap-3 justify-end">
                <button id="confirm-cancel" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  ${cancelText}
                </button>
                <button id="confirm-ok" class="px-4 py-2 ${typeColors[type]} text-white rounded-lg transition-colors">
                  ${confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('confirm-dialog');
      const okBtn = document.getElementById('confirm-ok');
      const cancelBtn = document.getElementById('confirm-cancel');

      const cleanup = () => modal.remove();

      okBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // ESC to cancel
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Focus on OK button
      setTimeout(() => okBtn.focus(), 100);
    });
  }
}

// ============================================
// 6. FOCUS MANAGEMENT
// ============================================

class FocusManager {
  constructor() {
    this.init();
  }

  init() {
    // Add visible focus indicators
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('user-is-tabbing');
    });
  }

  /**
   * Trap focus within an element (for modals)
   * @param {HTMLElement} element - Element to trap focus in
   */
  static trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    element.addEventListener('keydown', handleTab);
    firstFocusable?.focus();

    return () => element.removeEventListener('keydown', handleTab);
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUXEnhancements);
} else {
  initializeUXEnhancements();
}

function initializeUXEnhancements() {
  // Initialize focus manager
  new FocusManager();

  // Add visual focus styles
  const style = document.createElement('style');
  style.textContent = `
    /* Focus indicators - only visible when tabbing */
    body.user-is-tabbing *:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    body:not(.user-is-tabbing) *:focus {
      outline: none;
    }

    /* Smooth animations */
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  console.log('✅ UX Enhancements initialized');
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.HistoryManager = historyManager;
window.KeyboardShortcuts = keyboardShortcuts;
window.LoadingStateManager = LoadingStateManager;
window.EmptyStateManager = EmptyStateManager;
window.ConfirmDialog = ConfirmDialog;
window.FocusManager = FocusManager;
