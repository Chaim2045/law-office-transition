/**
 * Tab Loader - מערכת טעינה דינמית של טאבים
 * מטעינה את תוכן הטאבים מקבצים נפרדים רק כשצריך
 */

class TabLoader {
  constructor() {
    this.loadedTabs = new Set();
    this.tabCache = new Map();
    this.currentTab = null;

    // מפת הטאבים הזמינים
    this.tabs = [
      'general-info',
      'daily-management',
      'meetings-scheduling',
      'calendar-management',
      'legal-processes',
      'financial-management',
      'notary-calculator',
      'checks-deposits',
      'suppliers-management',
      'procedures',
      'contacts',
    ];
  }

  /**
   * טוען טאב מקובץ חיצוני
   * @param {string} tabId - מזהה הטאב לטעינה
   * @returns {Promise<boolean>} - האם הטעינה הצליחה
   */
  async loadTab(tabId) {
    // אם הטאב כבר נטען, לא צריך לטעון שוב
    if (this.loadedTabs.has(tabId)) {
      console.log(`Tab ${tabId} already loaded from cache`);
      return true;
    }

    const tabContainer = document.getElementById(tabId);
    if (!tabContainer) {
      console.error(`Tab container #${tabId} not found`);
      return false;
    }

    try {
      // הצגת אינדיקציה של טעינה
      tabContainer.innerHTML = `
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">טוען תוכן...</p>
          </div>
        </div>
      `;

      // טעינת התוכן מהקובץ החיצוני
      const response = await fetch(`tabs/${tabId}.html`);

      if (!response.ok) {
        throw new Error(`Failed to load tab: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      // שמירה בקאש
      this.tabCache.set(tabId, html);

      // הכנסת התוכן לדף
      tabContainer.innerHTML = html;

      // סימון שהטאב נטען
      this.loadedTabs.add(tabId);

      // קריאה לפונקציות אתחול אם קיימות
      this.initializeTabContent(tabId);

      console.log(`Tab ${tabId} loaded successfully`);
      return true;
    } catch (error) {
      console.error(`Error loading tab ${tabId}:`, error);

      // הצגת הודעת שגיאה ידידותית
      tabContainer.innerHTML = `
        <div class="flex items-center justify-center h-64">
          <div class="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">שגיאה בטעינת התוכן</h3>
            <p class="text-red-700 dark:text-red-300 mb-4">לא ניתן לטעון את תוכן הטאב ${tabId}</p>
            <button onclick="tabLoader.loadTab('${tabId}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              נסה שוב
            </button>
          </div>
        </div>
      `;

      return false;
    }
  }

  /**
   * מאתחל תוכן טאב אחרי טעינה
   * @param {string} tabId - מזהה הטאב
   */
  initializeTabContent(tabId) {
    // קריאה לפונקציות עריכה אם זה מצב עריכה
    if (window.isEditMode && typeof window.makeEditable === 'function') {
      window.makeEditable();
    }

    // קריאה לאתחול progressive disclosure אם קיים
    if (typeof window.initializeProgressiveDisclosure === 'function') {
      window.initializeProgressiveDisclosure();
    }

    // Trigger custom event שהטאב נטען
    const event = new CustomEvent('tabLoaded', {
      detail: { tabId },
    });
    document.dispatchEvent(event);
  }

  /**
   * טוען טאב רק אם הוא עדיין לא נטען
   * @param {string} tabId - מזהה הטאב
   */
  async ensureTabLoaded(tabId) {
    if (!this.loadedTabs.has(tabId)) {
      return this.loadTab(tabId);
    }
    return true;
  }

  /**
   * טוען מראש מספר טאבים (preload)
   * @param {string[]} tabIds - מערך של מזהי טאבים
   */
  async preloadTabs(tabIds) {
    const promises = tabIds.map((tabId) => this.loadTab(tabId));
    await Promise.all(promises);
  }

  /**
   * מנקה את הקאש של טאב מסוים
   * @param {string} tabId - מזהה הטאב
   */
  clearTabCache(tabId) {
    this.loadedTabs.delete(tabId);
    this.tabCache.delete(tabId);
  }

  /**
   * מנקה את כל הקאש
   */
  clearAllCache() {
    this.loadedTabs.clear();
    this.tabCache.clear();
  }

  /**
   * מחזיר סטטיסטיקות על טאבים שנטענו
   */
  getStats() {
    return {
      totalTabs: this.tabs.length,
      loadedTabs: this.loadedTabs.size,
      cachedTabs: this.tabCache.size,
      loadedTabsList: Array.from(this.loadedTabs),
    };
  }
}

// יצירת instance גלובלי
const tabLoader = new TabLoader();

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
  console.log('TabLoader initialized');

  // טעינת הטאב הראשון (general-info) אוטומטית
  tabLoader.loadTab('general-info');

  // הוספת event listeners לכפתורי הטאבים
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', async () => {
      const tabId = button.getAttribute('data-tab');

      // טעינת הטאב אם עדיין לא נטען
      await tabLoader.ensureTabLoaded(tabId);
    });
  });
});

// Export לשימוש במודולים אחרים
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TabLoader, tabLoader };
}
