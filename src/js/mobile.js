/**
 * Mobile Responsiveness Module
 * Professional mobile UX with hamburger menu, touch gestures, and responsive layout
 */

// ============================================
// 1. MOBILE MENU MANAGER
// ============================================

class MobileMenuManager {
  constructor() {
    this.sidebar = null;
    this.overlay = null;
    this.hamburgerBtn = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createHamburgerButton();
    this.createOverlay();
    this.setupMobileLayout();
    this.setupTouchGestures();
    this.setupEventListeners();
    this.handleResize();

    window.addEventListener('resize', this.handleResize.bind(this));

    console.log('📱 Mobile features initialized');
  }

  /**
   * Create hamburger menu button
   */
  createHamburgerButton() {
    const nav = document.querySelector('nav .flex.justify-between');
    if (!nav) return;

    const hamburgerHTML = `
      <button
        id="mobile-menu-btn"
        class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="פתח תפריט ניווט"
        aria-expanded="false"
        aria-controls="mobile-sidebar"
      >
        <svg class="w-6 h-6 hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
        <svg class="w-6 h-6 close-icon hidden" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;

    // Insert at beginning of nav (right side in RTL)
    const firstChild = nav.firstElementChild;
    firstChild.insertAdjacentHTML('afterbegin', hamburgerHTML);

    this.hamburgerBtn = document.getElementById('mobile-menu-btn');
  }

  /**
   * Create overlay for mobile menu
   */
  createOverlay() {
    const overlayHTML = `
      <div
        id="mobile-overlay"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden md:hidden transition-opacity duration-300 opacity-0"
        aria-hidden="true"
      ></div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    this.overlay = document.getElementById('mobile-overlay');
  }

  /**
   * Setup mobile-responsive layout
   */
  setupMobileLayout() {
    this.sidebar = document.querySelector('aside');
    if (!this.sidebar) return;

    // Add mobile classes
    this.sidebar.classList.add('mobile-sidebar');
    this.sidebar.id = 'mobile-sidebar';

    // Add swipe indicator
    const swipeIndicator = `
      <div class="swipe-indicator md:hidden absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    `;

    this.sidebar.insertAdjacentHTML('afterbegin', swipeIndicator);
  }

  /**
   * Setup touch gestures for swipe
   */
  setupTouchGestures() {
    if (!this.sidebar) return;

    let touchStartX = 0;
    let touchEndX = 0;

    this.sidebar.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.sidebar.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, { passive: true });

    // Swipe from edge to open
    document.addEventListener('touchstart', (e) => {
      if (e.touches[0].clientX < 20 && !this.isOpen) {
        touchStartX = e.touches[0].screenX;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (touchStartX > 0 && touchStartX < 20) {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX > 50) {
          this.openMenu();
        }
        touchStartX = 0;
      }
    }, { passive: true });
  }

  /**
   * Handle swipe gesture
   */
  handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    const diff = startX - endX;

    // Swipe right to left (close)
    if (diff > swipeThreshold && this.isOpen) {
      this.closeMenu();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Hamburger button
    this.hamburgerBtn?.addEventListener('click', () => {
      this.toggleMenu();
    });

    // Overlay click
    this.overlay?.addEventListener('click', () => {
      this.closeMenu();
    });

    // Close on nav item click (mobile)
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          setTimeout(() => this.closeMenu(), 300);
        }
      });
    });

    // Close on Esc key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  /**
   * Toggle menu
   */
  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Open menu
   */
  openMenu() {
    this.isOpen = true;

    // Update sidebar
    this.sidebar?.classList.add('mobile-open');

    // Show overlay
    this.overlay?.classList.remove('hidden');
    setTimeout(() => {
      this.overlay?.classList.remove('opacity-0');
    }, 10);

    // Update hamburger icon
    const hamburgerIcon = this.hamburgerBtn?.querySelector('.hamburger-icon');
    const closeIcon = this.hamburgerBtn?.querySelector('.close-icon');
    hamburgerIcon?.classList.add('hidden');
    closeIcon?.classList.remove('hidden');

    // Update ARIA
    this.hamburgerBtn?.setAttribute('aria-expanded', 'true');
    this.overlay?.setAttribute('aria-hidden', 'false');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Announce to screen readers
    if (typeof announceToScreenReader !== 'undefined') {
      announceToScreenReader('תפריט הניווט נפתח');
    }
  }

  /**
   * Close menu
   */
  closeMenu() {
    this.isOpen = false;

    // Update sidebar
    this.sidebar?.classList.remove('mobile-open');

    // Hide overlay
    this.overlay?.classList.add('opacity-0');
    setTimeout(() => {
      this.overlay?.classList.add('hidden');
    }, 300);

    // Update hamburger icon
    const hamburgerIcon = this.hamburgerBtn?.querySelector('.hamburger-icon');
    const closeIcon = this.hamburgerBtn?.querySelector('.close-icon');
    hamburgerIcon?.classList.remove('hidden');
    closeIcon?.classList.add('hidden');

    // Update ARIA
    this.hamburgerBtn?.setAttribute('aria-expanded', 'false');
    this.overlay?.setAttribute('aria-hidden', 'true');

    // Restore body scroll
    document.body.style.overflow = '';

    // Announce to screen readers
    if (typeof announceToScreenReader !== 'undefined') {
      announceToScreenReader('תפריט הניווט נסגר');
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (window.innerWidth >= 768 && this.isOpen) {
      this.closeMenu();
    }
  }
}

// ============================================
// 2. MOBILE-OPTIMIZED INTERACTIONS
// ============================================

class MobileOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.optimizeTouchTargets();
    this.setupPullToRefresh();
    this.optimizeScrolling();
    this.setupBottomNavigation();
  }

  /**
   * Ensure all touch targets are at least 44x44px (Apple HIG)
   */
  optimizeTouchTargets() {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        button, a, .nav-tab, .copy-btn, .delete-btn {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        input, textarea, select {
          min-height: 44px;
          font-size: 16px; /* Prevents zoom on iOS */
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup pull-to-refresh gesture (optional)
   */
  setupPullToRefresh() {
    // Can be implemented if needed
  }

  /**
   * Optimize scrolling for mobile
   */
  optimizeScrolling() {
    // Smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';

    // Momentum scrolling on iOS
    document.querySelectorAll('.overflow-y-auto').forEach(el => {
      el.style.webkitOverflowScrolling = 'touch';
    });
  }

  /**
   * Setup bottom navigation for mobile
   */
  setupBottomNavigation() {
    // This could be expanded to add a bottom nav bar for quick actions
  }
}

// ============================================
// 3. RESPONSIVE UTILITIES
// ============================================

class ResponsiveUtilities {
  /**
   * Check if device is mobile
   * @returns {boolean}
   */
  static isMobile() {
    return window.innerWidth < 768;
  }

  /**
   * Check if device is tablet
   * @returns {boolean}
   */
  static isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  /**
   * Check if device is desktop
   * @returns {boolean}
   */
  static isDesktop() {
    return window.innerWidth >= 1024;
  }

  /**
   * Check if device supports touch
   * @returns {boolean}
   */
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get current breakpoint
   * @returns {string} - 'mobile', 'tablet', or 'desktop'
   */
  static getBreakpoint() {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }
}

// ============================================
// 4. INITIALIZATION
// ============================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMobile);
} else {
  initializeMobile();
}

function initializeMobile() {
  // Add mobile-specific CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Mobile Sidebar */
    @media (max-width: 768px) {
      .mobile-sidebar {
        position: fixed;
        top: 0;
        right: -100%;
        height: 100vh;
        width: 80%;
        max-width: 320px;
        z-index: 50;
        transition: right 0.3s ease-in-out;
        box-shadow: -4px 0 6px rgba(0, 0, 0, 0.1);
      }

      .mobile-sidebar.mobile-open {
        right: 0;
      }

      /* Hide stats on mobile */
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 1rem !important;
      }

      /* Stack navigation buttons vertically on very small screens */
      @media (max-width: 480px) {
        nav .flex.items-center.space-x-4 {
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }

      /* Make search full width on mobile */
      nav .max-w-lg {
        max-width: 100%;
      }

      /* Improve modals on mobile */
      [id$="-modal"] > div {
        max-width: 90vw !important;
        max-height: 90vh !important;
        overflow-y: auto;
      }

      /* Better spacing for mobile */
      .p-8 {
        padding: 1rem !important;
      }

      .p-6 {
        padding: 0.75rem !important;
      }

      /* Swipe indicator */
      .swipe-indicator {
        pointer-events: none;
      }
    }

    /* Tablet adjustments */
    @media (min-width: 768px) and (max-width: 1024px) {
      aside {
        width: 200px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Print styles */
    @media print {
      nav, aside, button, .delete-btn, .copy-btn, #mobile-overlay {
        display: none !important;
      }

      main {
        margin: 0 !important;
        padding: 1rem !important;
      }

      .editable {
        border: none !important;
        background: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // Initialize mobile features
  const mobileMenu = new MobileMenuManager();
  const mobileOptimizer = new MobileOptimizer();

  console.log(`📱 Mobile initialized - Breakpoint: ${ResponsiveUtilities.getBreakpoint()}`);
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.MobileMenuManager = MobileMenuManager;
window.Mobile optimizer = MobileOptimizer;
window.ResponsiveUtilities = ResponsiveUtilities;
