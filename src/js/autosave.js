/**
 * Autosave System for Static Editable Fields
 * מערכת שמירה אוטומטית לשדות editable קבועים
 *
 * מטפל בשדות עם data-field attribute שמוגדרים ב-HTML
 * (לא בלוקים דינמיים של ContentBlockManager)
 */

/* ============================================
   1. Configuration
   ============================================ */

const AUTOSAVE_CONFIG = {
  debounceDelay: 1500,        // 1.5 שניות אחרי עריכה
  blurSaveDelay: 300,         // 300ms אחרי blur
  enableLogging: true,        // לוגים בקונסול
};

/* ============================================
   2. AutosaveManager Class
   ============================================ */

class AutosaveManager {
  constructor() {
    this.editableFields = new Map();     // data-field -> element
    this.saveTimeouts = new Map();       // data-field -> timeoutId
    this.pendingSaves = new Map();       // data-field -> Promise
    this.initialized = false;
  }

  /**
   * Initialize the autosave system
   */
  async init() {
    if (this.initialized) {
      console.warn('⚠️ AutosaveManager כבר אותחל');
      return;
    }

    // Find all editable fields with data-field
    this.discoverEditableFields();

    // Load saved content from Firebase
    await this.loadAllFields();

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
    this.log('✅ AutosaveManager initialized', {
      totalFields: this.editableFields.size
    });
  }

  /**
   * Discover all editable fields in the DOM
   */
  discoverEditableFields() {
    // Find all elements with data-field attribute that are editable
    const elements = document.querySelectorAll('[data-field][contenteditable="true"]');

    elements.forEach(element => {
      const fieldName = element.getAttribute('data-field');
      if (fieldName) {
        this.editableFields.set(fieldName, element);
      }
    });

    this.log('📋 Discovered editable fields', {
      count: this.editableFields.size,
      fields: Array.from(this.editableFields.keys())
    });
  }

  /**
   * Load all fields from Firebase
   */
  async loadAllFields() {
    if (typeof loadAllDataFromFirebase !== 'function') {
      this.log('⚠️ Firebase לא זמין, טוען מ-localStorage');
      this.loadFromLocalStorage();
      return;
    }

    try {
      const firebaseData = await loadAllDataFromFirebase();

      if (firebaseData) {
        let loadedCount = 0;

        this.editableFields.forEach((element, fieldName) => {
          if (firebaseData[fieldName]) {
            // Get content from Firebase data
            let content;
            const rawData = firebaseData[fieldName];

            if (typeof rawData === 'string') {
              content = rawData;
            } else if (rawData && typeof rawData === 'object' && rawData.content !== undefined) {
              content = rawData.content;
            } else if (typeof window.normalizeBlockData === 'function') {
              const normalized = window.normalizeBlockData(rawData);
              content = normalized.content;
            } else {
              return;
            }

            // Update element
            element.innerHTML = content;

            // Save to localStorage as backup
            const localData = {
              content: content,
              updatedAt: (rawData && rawData.updatedAt) || Date.now(),
            };
            localStorage.setItem(`guide_${fieldName}`, JSON.stringify(localData));

            loadedCount++;
          }
        });

        this.log('✅ Loaded fields from Firebase', { count: loadedCount });
      } else {
        this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ Error loading from Firebase:', error);
      this.loadFromLocalStorage();
    }
  }

  /**
   * Load fields from localStorage (fallback)
   */
  loadFromLocalStorage() {
    let loadedCount = 0;

    this.editableFields.forEach((element, fieldName) => {
      const savedDataStr = localStorage.getItem(`guide_${fieldName}`);

      if (savedDataStr) {
        try {
          const savedData = JSON.parse(savedDataStr);
          if (savedData.content) {
            element.innerHTML = savedData.content;
            loadedCount++;
          }
        } catch {
          // Old format - plain string
          element.innerHTML = savedDataStr;
          loadedCount++;
        }
      }
    });

    this.log('💾 Loaded fields from localStorage', { count: loadedCount });
  }

  /**
   * Setup event listeners for autosave
   */
  setupEventListeners() {
    // Input handler with debounce
    document.addEventListener('input', (e) => {
      const target = e.target;

      if (target && target.hasAttribute('data-field') && target.hasAttribute('contenteditable')) {
        const fieldName = target.getAttribute('data-field');

        if (this.editableFields.has(fieldName)) {
          this.scheduleDebouncedSave(fieldName);
        }
      }
    });

    // Blur handler - immediate save
    document.addEventListener('blur', (e) => {
      const target = e.target;

      if (target && target.hasAttribute('data-field') && target.hasAttribute('contenteditable')) {
        const fieldName = target.getAttribute('data-field');

        if (this.editableFields.has(fieldName)) {
          // Clear debounce timeout
          if (this.saveTimeouts.has(fieldName)) {
            clearTimeout(this.saveTimeouts.get(fieldName));
            this.saveTimeouts.delete(fieldName);
          }

          // Schedule immediate save (with small delay to prevent conflicts)
          setTimeout(() => {
            this.scheduleSave(fieldName);
          }, AUTOSAVE_CONFIG.blurSaveDelay);
        }
      }
    }, true); // capture phase

    this.log('🎧 Event listeners setup complete');
  }

  /**
   * Schedule a debounced save
   */
  scheduleDebouncedSave(fieldName) {
    // Clear existing timeout
    if (this.saveTimeouts.has(fieldName)) {
      clearTimeout(this.saveTimeouts.get(fieldName));
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      this.scheduleSave(fieldName);
      this.saveTimeouts.delete(fieldName);
    }, AUTOSAVE_CONFIG.debounceDelay);

    this.saveTimeouts.set(fieldName, timeoutId);
  }

  /**
   * Schedule a save (prevents concurrent saves)
   */
  scheduleSave(fieldName) {
    // Prevent concurrent saves of the same field
    if (this.pendingSaves.has(fieldName)) {
      this.log('⏭️ Skipping save - already in progress', { field: fieldName });
      return;
    }

    // Mark as pending and save
    const savePromise = this.saveField(fieldName).finally(() => {
      this.pendingSaves.delete(fieldName);
    });

    this.pendingSaves.set(fieldName, savePromise);
  }

  /**
   * Save a field to Firebase and localStorage
   */
  async saveField(fieldName) {
    const element = this.editableFields.get(fieldName);

    if (!element) {
      console.error('❌ Field not found:', fieldName);
      return false;
    }

    const content = element.innerHTML;
    const timestamp = Date.now();

    // Update UI: saving state
    this.updateFieldStatus(element, 'saving');

    // Save to localStorage (sync)
    const localData = {
      content: content,
      updatedAt: timestamp,
    };
    localStorage.setItem(`guide_${fieldName}`, JSON.stringify(localData));

    // Save to Firebase (async)
    if (typeof saveToFirebase === 'function') {
      const success = await saveToFirebase(fieldName, content);

      if (success) {
        this.updateFieldStatus(element, 'saved');
        this.log('✅ Field saved', { field: fieldName });
        return true;
      } else {
        this.updateFieldStatus(element, 'error');
        this.log('❌ Field save failed', { field: fieldName });
        return false;
      }
    }

    // No Firebase - consider it saved locally
    this.updateFieldStatus(element, 'saved');
    return true;
  }

  /**
   * Update field save status UI
   */
  updateFieldStatus(element, status) {
    // Remove old status classes
    element.classList.remove('saving', 'saved', 'error');

    // Add new status class
    switch (status) {
      case 'saving':
        element.classList.add('saving');
        break;

      case 'saved':
        element.classList.add('saved');
        // Remove 'saved' class after 2 seconds
        setTimeout(() => {
          element.classList.remove('saved');
        }, 2000);
        break;

      case 'error':
        element.classList.add('error');
        // Show retry option
        this.showRetryOption(element);
        break;
    }
  }

  /**
   * Show retry option for failed saves
   */
  showRetryOption(element) {
    const fieldName = element.getAttribute('data-field');

    // ✅ OPTIMIZATION: Remove any existing retry button for this field
    const existingBtn = element.parentNode.querySelector(
      `.field-retry-btn[data-field="${fieldName}"]`
    );
    if (existingBtn) {
      existingBtn.remove();
    }

    const retryBtn = document.createElement('button');
    retryBtn.className = 'field-retry-btn save-retry-btn';
    retryBtn.setAttribute('data-field', fieldName); // ✅ Add identifier
    retryBtn.innerHTML = '🔄 נסה שוב';
    retryBtn.title = 'שגיאה בשמירה - לחץ לנסות שוב';

    retryBtn.addEventListener('click', () => {
      retryBtn.remove();
      this.scheduleSave(fieldName);
    });

    // Insert after element
    element.parentNode.insertBefore(retryBtn, element.nextSibling);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (retryBtn.parentNode) {
        retryBtn.remove();
      }
    }, 10000);
  }

  /**
   * Logging helper
   */
  log(message, data = {}) {
    if (AUTOSAVE_CONFIG.enableLogging && window.APP_CONFIG && window.APP_CONFIG.enableSaveLogging) {
      console.log(`📝 [AutosaveManager] ${message}`, data);
    }
  }

  /**
   * Force save all fields (for manual trigger)
   */
  async saveAll() {
    this.log('💾 Saving all fields...');

    const promises = [];
    this.editableFields.forEach((element, fieldName) => {
      promises.push(this.saveField(fieldName));
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r).length;

    this.log('✅ Saved all fields', {
      total: results.length,
      success: successCount,
      failed: results.length - successCount
    });

    return { total: results.length, success: successCount };
  }
}

/* ============================================
   3. Global Initialization
   ============================================ */

// Create global instance
window.AutosaveManager = new AutosaveManager();

// Initialize when DOM is ready and tabs are loaded
// Wait for tab-loader to finish loading tabs first
function initAutosave() {
  // Check if tabs are loaded
  const checkTabsLoaded = setInterval(() => {
    const tabs = document.querySelectorAll('.tab-content');
    const hasEditableFields = document.querySelectorAll('[data-field][contenteditable="true"]').length > 0;

    if (tabs.length > 0 && hasEditableFields) {
      clearInterval(checkTabsLoaded);

      // Small delay to ensure all DOM is ready
      setTimeout(() => {
        window.AutosaveManager.init();
      }, 500);
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkTabsLoaded);
    console.warn('⚠️ Tabs loading timeout - initializing autosave anyway');
    window.AutosaveManager.init();
  }, 10000);
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAutosave);
} else {
  initAutosave();
}

// Save all fields before page unload
window.addEventListener('beforeunload', () => {
  // Synchronous save to localStorage only (Firebase saves are async and won't complete in time)
  window.AutosaveManager.editableFields.forEach((element, fieldName) => {
    const content = element.innerHTML;
    const localData = {
      content: content,
      updatedAt: Date.now(),
    };
    localStorage.setItem(`guide_${fieldName}`, JSON.stringify(localData));
  });
});

console.log('✅ Autosave System loaded successfully');
