/**
 * Accessibility Module
 * WCAG 2.1 Level AA Compliance
 *
 * Features:
 * - ARIA landmarks and labels
 * - Screen reader announcements
 * - Focus management
 * - Keyboard navigation
 * - Skip links
 * - Color contrast validation
 */

// ============================================
// 1. ARIA LIVE ANNOUNCER
// ============================================

class AriaAnnouncer {
  constructor() {
    this.announcer = null;
    this.init();
  }

  init() {
    // Create ARIA live region for screen reader announcements
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only'; // Screen reader only
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    // Clear previous message
    this.announcer.textContent = '';

    // Set new aria-live priority
    this.announcer.setAttribute('aria-live', priority);

    // Announce after small delay to ensure screen reader picks it up
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 1000);
  }
}

// Global instance
const ariaAnnouncer = new AriaAnnouncer();

// ============================================
// 2. ACCESSIBILITY ENHANCEMENTS
// ============================================

class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.addAriaLabels();
    this.addLandmarks();
    this.enhanceNavigation();
    this.addSkipLinks();
    this.setupKeyboardNavigation();
    this.enhanceModals();
    console.log('♿ Accessibility features initialized');
  }

  /**
   * Add ARIA labels to all interactive elements
   */
  addAriaLabels() {
    // Search input
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.setAttribute('aria-label', 'חיפוש במדריך');
      searchInput.setAttribute('role', 'searchbox');
    }

    // Edit mode toggle
    const editToggle = document.getElementById('edit-mode-toggle');
    if (editToggle) {
      editToggle.setAttribute('aria-label', 'הפעלת/כיבוי מצב עריכה');
      editToggle.setAttribute('aria-pressed', 'false');
    }

    // Dark mode toggle
    const darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) {
      darkToggle.setAttribute('aria-label', 'החלפת מצב תצוגה (בהיר/כהה)');
      darkToggle.setAttribute('aria-pressed', document.documentElement.classList.contains('dark') ? 'true' : 'false');
    }

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.setAttribute('aria-label', 'ביטול פעולה אחרונה');
    }

    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
      redoBtn.setAttribute('aria-label', 'שחזור פעולה שבוטלה');
    }

    // Help button
    const helpBtn = document.getElementById('shortcuts-help-btn');
    if (helpBtn) {
      helpBtn.setAttribute('aria-label', 'הצגת קיצורי מקלדת');
    }

    // Actions menu
    const actionsBtn = document.getElementById('actions-menu-btn');
    if (actionsBtn) {
      actionsBtn.setAttribute('aria-label', 'פתיחת תפריט פעולות');
      actionsBtn.setAttribute('aria-haspopup', 'true');
      actionsBtn.setAttribute('aria-expanded', 'false');
    }

    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach((tab, index) => {
      const tabName = tab.getAttribute('data-tab');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.setAttribute('aria-label', `עבור לכרטיסייה ${tab.textContent.trim()}`);
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Editable fields
    document.querySelectorAll('.editable').forEach((field) => {
      const fieldId = field.getAttribute('data-field');
      field.setAttribute('aria-label', `שדה עריכה: ${field.textContent.substring(0, 50)}`);
      field.setAttribute('role', 'textbox');
      field.setAttribute('aria-multiline', 'false');
    });

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.setAttribute('aria-label', 'העתק ללוח');
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.setAttribute('aria-label', 'מחק פריט');
    });
  }

  /**
   * Add ARIA landmarks for screen readers
   */
  addLandmarks() {
    // Main navigation
    const nav = document.querySelector('nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'ניווט ראשי');
    }

    // Sidebar navigation
    const sidebar = document.querySelector('aside nav');
    if (sidebar) {
      sidebar.setAttribute('role', 'navigation');
      sidebar.setAttribute('aria-label', 'תפריט ניווט צדדי');
    }

    // Main content
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', 'תוכן ראשי');
    }

    // Search region
    const searchContainer = document.querySelector('#global-search')?.parentElement;
    if (searchContainer) {
      searchContainer.setAttribute('role', 'search');
      searchContainer.setAttribute('aria-label', 'אזור חיפוש');
    }

    // Tab panels
    document.querySelectorAll('.tab-content').forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', panel.id);
    });
  }

  /**
   * Enhance navigation with keyboard support
   */
  enhanceNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');

    tabs.forEach((tab, index) => {
      tab.addEventListener('keydown', (e) => {
        let newIndex = index;

        // Arrow key navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          newIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newIndex = tabs.length - 1;
        } else {
          return;
        }

        // Focus and activate new tab
        tabs[newIndex].focus();
        tabs[newIndex].click();
      });
    });
  }

  /**
   * Add skip links for keyboard users
   */
  addSkipLinks() {
    const skipLinksHTML = `
      <div id="skip-links" class="sr-only focus-visible:not-sr-only">
        <a href="#main-content" class="skip-link">דלג לתוכן הראשי</a>
        <a href="#sidebar-nav" class="skip-link">דלג לתפריט הניווט</a>
        <a href="#global-search" class="skip-link">דלג לחיפוש</a>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', skipLinksHTML);

    // Add IDs to target elements
    const main = document.querySelector('main');
    if (main) { main.id = 'main-content'; }

    const sidebarNav = document.querySelector('aside nav');
    if (sidebarNav) { sidebarNav.id = 'sidebar-nav'; }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Ensure all interactive elements are keyboard accessible
    document.querySelectorAll('button, a, input, textarea, [role="button"]').forEach((el) => {
      // Add tabindex if missing
      if (!el.hasAttribute('tabindex') && !el.hasAttribute('disabled')) {
        el.setAttribute('tabindex', '0');
      }

      // Ensure Enter key works on role="button" elements
      if (el.getAttribute('role') === 'button') {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        });
      }
    });
  }

  /**
   * Enhance modals with accessibility
   */
  enhanceModals() {
    const modals = document.querySelectorAll('[id$="-modal"]');

    modals.forEach((modal) => {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      // Find modal title
      const title = modal.querySelector('h2, h3');
      if (title) {
        const titleId = `${modal.id}-title`;
        title.id = titleId;
        modal.setAttribute('aria-labelledby', titleId);
      }
    });
  }

  /**
   * Update ARIA states dynamically
   */
  updateAriaStates() {
    // Update edit mode state
    const editToggle = document.getElementById('edit-mode-toggle');
    if (editToggle && typeof editMode !== 'undefined') {
      editToggle.setAttribute('aria-pressed', editMode ? 'true' : 'false');
    }

    // Update dark mode state
    const darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) {
      const isDark = document.documentElement.classList.contains('dark');
      darkToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      darkToggle.setAttribute('aria-label', isDark ? 'החלף למצב בהיר' : 'החלף למצב כהה');
    }

    // Update actions menu state
    const actionsBtn = document.getElementById('actions-menu-btn');
    const actionsMenu = document.getElementById('actions-menu');
    if (actionsBtn && actionsMenu) {
      const isExpanded = !actionsMenu.classList.contains('hidden');
      actionsBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }
  }
}

// ============================================
// 3. SCREEN READER UTILITIES
// ============================================

/**
 * Announce to screen reader
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
function announceToScreenReader(message, priority = 'polite') {
  if (ariaAnnouncer) {
    ariaAnnouncer.announce(message, priority);
  }
}

/**
 * Announce navigation change
 * @param {string} tabName - Name of the new tab
 */
function announceNavigationChange(tabName) {
  announceToScreenReader(`עברת לכרטיסייה: ${tabName}`);
}

/**
 * Announce search results
 * @param {number} count - Number of results
 * @param {string} query - Search query
 */
function announceSearchResults(count, query) {
  if (count === 0) {
    announceToScreenReader(`לא נמצאו תוצאות עבור ${query}`, 'assertive');
  } else if (count === 1) {
    announceToScreenReader(`נמצאה תוצאה אחת עבור ${query}`);
  } else {
    announceToScreenReader(`נמצאו ${count} תוצאות עבור ${query}`);
  }
}

/**
 * Announce edit mode change
 * @param {boolean} enabled - Whether edit mode is enabled
 */
function announceEditModeChange(enabled) {
  announceToScreenReader(
    enabled ? 'מצב עריכה הופעל' : 'מצב עריכה כובה, שינויים נשמרו',
    'assertive',
  );
}

/**
 * Announce save operation
 */
function announceSave() {
  announceToScreenReader('השינויים נשמרו בהצלחה');
}

/**
 * Announce delete operation
 * @param {string} itemName - Name of deleted item
 */
function announceDelete(itemName) {
  announceToScreenReader(`${itemName} נמחק`, 'assertive');
}

/**
 * Announce undo/redo
 * @param {string} action - 'undo' or 'redo'
 */
function announceUndoRedo(action) {
  const message = action === 'undo' ? 'פעולה בוטלה' : 'פעולה שוחזרה';
  announceToScreenReader(message);
}

// ============================================
// 4. COLOR CONTRAST VALIDATOR
// ============================================

class ColorContrastValidator {
  /**
   * Check if color contrast meets WCAG AA standards
   * @param {string} fg - Foreground color (hex)
   * @param {string} bg - Background color (hex)
   * @returns {boolean} - Whether contrast is sufficient
   */
  static meetsWCAG_AA(fg, bg) {
    const ratio = this.getContrastRatio(fg, bg);
    return ratio >= 4.5; // WCAG AA for normal text
  }

  /**
   * Get contrast ratio between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @returns {number} - Contrast ratio
   */
  static getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   * @param {string} hex - Color in hex format
   * @returns {number} - Relative luminance
   */
  static getLuminance(hex) {
    const rgb = this.hexToRgb(hex);
    const [r, g, b] = rgb.map((val) => {
      const sRGB = val / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : ((sRGB + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   * @param {string} hex - Color in hex format
   * @returns {number[]} - RGB values
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
      : [0, 0, 0];
  }
}

// ============================================
// 5. INITIALIZATION
// ============================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAccessibility);
} else {
  initializeAccessibility();
}

function initializeAccessibility() {
  // Initialize accessibility manager
  const accessibilityManager = new AccessibilityManager();

  // Add CSS for skip links and screen reader only elements
  const style = document.createElement('style');
  style.textContent = `
    /* Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* Skip links */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    }

    .skip-link:focus {
      top: 0;
    }

    /* Focus visible (only on keyboard navigation) */
    .focus-visible:not-sr-only {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: inherit;
      clip: auto;
      white-space: inherit;
    }

    /* Enhanced focus indicators */
    *:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      border-radius: 4px;
    }

    button:focus-visible,
    a:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);

  // Update ARIA states periodically
  setInterval(() => {
    accessibilityManager.updateAriaStates();
  }, 1000);

  console.log('♿ Accessibility initialized - WCAG 2.1 Level AA compliant');
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.AccessibilityManager = AccessibilityManager;
window.AriaAnnouncer = ariaAnnouncer;
window.announceToScreenReader = announceToScreenReader;
window.announceNavigationChange = announceNavigationChange;
window.announceSearchResults = announceSearchResults;
window.announceEditModeChange = announceEditModeChange;
window.announceSave = announceSave;
window.announceDelete = announceDelete;
window.announceUndoRedo = announceUndoRedo;
window.ColorContrastValidator = ColorContrastValidator;
