let editMode = false;
let searchCount = 0;
let googleSheetsConfig = {
  webAppUrl: '',
  spreadsheetId: '',
  connected: false,
};
let currentAddCategory = '';
const itemCounter = {
  ta_staff: 0,
  rehovot_staff: 0,
  freelancer: 0,
  tenant: 0,
  courier: 0,
};

// DOM elements cache
const elements = {};

// Password authentication state
let isAuthenticated = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  initializeApp();
  setupEventListeners();
  updateStats();
});

function cacheElements() {
  elements.loadingOverlay = document.getElementById('loadingOverlay');
  elements.saveIndicator = document.getElementById('saveIndicator');
  elements.editToggle = document.getElementById('edit-mode-toggle');
  elements.darkToggle = document.getElementById('dark-mode-toggle');
  elements.globalSearch = document.getElementById('global-search');
  elements.actionsMenu = document.getElementById('actions-menu');
  elements.sheetsModal = document.getElementById('sheets-config-modal');
  elements.connectionIndicator = document.getElementById('connection-indicator');
  elements.connectionText = document.getElementById('connection-text');
  elements.passwordModal = document.getElementById('password-modal');
  elements.passwordInput = document.getElementById('edit-password');
  elements.passwordError = document.getElementById('password-error');
}

function initializeApp() {
  // Remove loading overlay
  setTimeout(() => {
    if (elements.loadingOverlay) {
      elements.loadingOverlay.style.display = 'none';
    }
  }, 1000);

  // Initialize dark mode
  if (
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  }

  // Show first tab
  showTab('general-info');

  // Initialize item counters
  initializeItemCounters();

  // Load saved data
  loadSavedData();

  // Load Google Sheets config
  loadGoogleSheetsConfig();
}

function initializeItemCounters() {
  // Count existing items for each category
  Object.keys(itemCounter).forEach((category) => {
    const pattern = new RegExp(`${category}_(\\d+)`);
    const fields = document.querySelectorAll(`[data-field^="${category}_"]`);
    let maxNum = 0;
    fields.forEach((field) => {
      const match = field.getAttribute('data-field').match(pattern);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    });
    itemCounter[category] = maxNum;
  });
}

function setupEventListeners() {
  // Dark mode toggle
  elements.darkToggle?.addEventListener('click', toggleDarkMode);

  // Edit mode toggle
  elements.editToggle?.addEventListener('click', toggleEditMode);

  // Undo/Redo buttons
  document.getElementById('undo-btn')?.addEventListener('click', () => {
    if (typeof KeyboardShortcuts !== 'undefined') {
      KeyboardShortcuts.undo();
    }
  });
  document.getElementById('redo-btn')?.addEventListener('click', () => {
    if (typeof KeyboardShortcuts !== 'undefined') {
      KeyboardShortcuts.redo();
    }
  });

  // Keyboard shortcuts help
  document.getElementById('shortcuts-help-btn')?.addEventListener('click', () => {
    if (typeof KeyboardShortcuts !== 'undefined') {
      KeyboardShortcuts.showHelp();
    }
  });

  // Actions menu
  document.getElementById('actions-menu-btn')?.addEventListener('click', toggleActionsMenu);
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('print-btn')?.addEventListener('click', () => window.print());
  document.getElementById('connect-sheets-btn')?.addEventListener('click', showSheetsConfig);

  // Google Sheets modal
  document.getElementById('cancel-sheets-config')?.addEventListener('click', hideSheetsConfig);
  document.getElementById('save-sheets-config')?.addEventListener('click', saveGoogleSheetsConfig);

  // Password modal
  document.getElementById('cancel-password')?.addEventListener('click', hidePasswordModal);
  document.getElementById('submit-password')?.addEventListener('click', submitPassword);

  // Password input - submit on Enter key
  elements.passwordInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitPassword();
    }
  });

  // Search
  elements.globalSearch?.addEventListener('input', debounce(performSearch, 300));

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#actions-menu-btn') && !e.target.closest('#actions-menu')) {
      elements.actionsMenu?.classList.add('hidden');
    }
  });
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.add('hidden');
  });

  // Show selected tab
  const targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.classList.remove('hidden');
  }

  // Update navigation
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.remove(
      'bg-blue-50',
      'dark:bg-blue-900/20',
      'text-blue-700',
      'dark:text-blue-300',
      'border-r-4',
      'border-blue-500'
    );
    tab.classList.add('text-gray-600', 'dark:text-gray-400');
  });

  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add(
      'bg-blue-50',
      'dark:bg-blue-900/20',
      'text-blue-700',
      'dark:text-blue-300',
      'border-r-4',
      'border-blue-500'
    );
    activeTab.classList.remove('text-gray-600', 'dark:text-gray-400');
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

function toggleEditMode() {
  // If currently not in edit mode and not authenticated, show password modal
  if (!editMode && !isAuthenticated) {
    showPasswordModal();
    return;
  }

  editMode = !editMode;
  const editables = document.querySelectorAll('.editable');
  const deleteButtons = document.querySelectorAll('.delete-btn');
  const addButtons = document.querySelectorAll('.add-btn');

  if (editMode) {
    elements.editToggle.innerHTML =
      '<svg class="w-4 h-4 inline ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>שמור שינויים';
    elements.editToggle.classList.remove(
      'from-green-600',
      'to-green-700',
      'hover:from-green-700',
      'hover:to-green-800'
    );
    elements.editToggle.classList.add(
      'from-red-600',
      'to-red-700',
      'hover:from-red-700',
      'hover:to-red-800'
    );

    // ✅ v2.1: Don't change contentEditable (always true for autosave)
    // Just add visual class 'edit-mode-active'
    editables.forEach((element) => {
      // element.contentEditable = true; // ❌ Already true in HTML
      element.classList.add('edit-mode-active'); // ✅ Visual indicator only
      element.addEventListener('input', handleEdit);
    });

    // Show delete and add buttons
    deleteButtons.forEach((btn) => (btn.style.display = 'block'));
    addButtons.forEach((btn) => (btn.style.display = 'flex'));

    // Enable Content Block Manager for advanced editing
    if (window.ContentBlockManager) {
      window.ContentBlockManager.enableEditMode();
    }

    showToast('מצב עריכה הופעל - כעת ניתן להוסיף תוכן חדש בכל מקום', 'info');
  } else {
    elements.editToggle.innerHTML =
      '<svg class="w-4 h-4 inline ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>מצב עריכה';
    elements.editToggle.classList.remove(
      'from-red-600',
      'to-red-700',
      'hover:from-red-700',
      'hover:to-red-800'
    );
    elements.editToggle.classList.add(
      'from-green-600',
      'to-green-700',
      'hover:from-green-700',
      'hover:to-green-800'
    );

    // ✅ v2.1: Don't change contentEditable (keep true for autosave)
    // Just remove visual class 'edit-mode-active'
    editables.forEach((element) => {
      // element.contentEditable = false; // ❌ Don't disable - autosave needs it
      element.classList.remove('edit-mode-active'); // ✅ Remove visual indicator
      element.removeEventListener('input', handleEdit);
    });

    // Hide delete and add buttons
    deleteButtons.forEach((btn) => (btn.style.display = 'none'));
    addButtons.forEach((btn) => (btn.style.display = 'none'));

    // Disable Content Block Manager
    if (window.ContentBlockManager) {
      window.ContentBlockManager.disableEditMode();
    }

    showToast('שינויים נשמרו', 'success');
  }

  updateStats();
}

function showPasswordModal() {
  if (elements.passwordModal) {
    elements.passwordModal.classList.remove('hidden');
    elements.passwordInput.value = '';
    elements.passwordError?.classList.add('hidden');
    setTimeout(() => {
      elements.passwordInput?.focus();
    }, 100);
  }
}

function hidePasswordModal() {
  if (elements.passwordModal) {
    elements.passwordModal.classList.add('hidden');
    elements.passwordInput.value = '';
    elements.passwordError?.classList.add('hidden');
  }
}

async function submitPassword() {
  const password = elements.passwordInput?.value;

  if (!password) {
    showToast('נא להזין סיסמה', 'warning');
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById('submit-password');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'בודק...';
  submitBtn.disabled = true;

  try {
    // Validate password with Firebase
    const isValid = await validatePassword(password);

    if (isValid) {
      isAuthenticated = true;
      hidePasswordModal();
      showToast('אימות הצליח! מפעיל מצב עריכה...', 'success');

      // Activate edit mode
      setTimeout(() => {
        editMode = false; // Reset to false so toggleEditMode will turn it on
        toggleEditMode();
      }, 500);
    } else {
      elements.passwordError?.classList.remove('hidden');
      elements.passwordInput?.classList.add('border-red-500');
      showToast('סיסמה שגויה', 'error');

      // Reset border color after animation
      setTimeout(() => {
        elements.passwordInput?.classList.remove('border-red-500');
      }, 2000);
    }
  } catch (error) {
    console.error('שגיאה באימות הסיסמה:', error);
    showToast('שגיאה בחיבור לשרת. נסה שנית.', 'error');
  } finally {
    // Restore button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    elements.passwordInput?.focus();
  }
}

function addNewItem(category, categoryName) {
  if (!editMode) {
    return;
  }

  currentAddCategory = category;
  document.getElementById('item-category').value = categoryName;
  document.getElementById('item-name').value = '';
  document.getElementById('add-item-modal').classList.remove('hidden');
  document.getElementById('item-name').focus();
}

function hideAddItemModal() {
  document.getElementById('add-item-modal').classList.add('hidden');
  currentAddCategory = '';
}

function saveNewItem() {
  const itemName = document.getElementById('item-name').value.trim();

  if (!itemName) {
    showToast('נא להזין שם פריט', 'error');
    return;
  }

  // Generate new field ID
  itemCounter[currentAddCategory]++;
  const newFieldId = `${currentAddCategory}_${itemCounter[currentAddCategory]}`;

  // Create new item element
  const newItem = createNewItemElement(newFieldId, itemName, currentAddCategory);

  // Find the add button and insert before it
  const addButton = document.querySelector(
    `[onclick="addNewItem('${currentAddCategory}', '${
      document.getElementById('item-category').value
    }')"]`
  );
  if (addButton) {
    addButton.parentNode.insertBefore(newItem, addButton);
  }

  // Save to localStorage, Firebase, and Google Sheets
  localStorage.setItem(`guide_${newFieldId}`, itemName);

  // Save to Firebase
  if (typeof saveToFirebase === 'function') {
    saveToFirebase(newFieldId, itemName);
  }

  // Save to Google Sheets
  if (googleSheetsConfig.connected) {
    saveToGoogleSheets(newFieldId, itemName);
  }

  hideAddItemModal();
  showToast(`נוסף בהצלחה: ${itemName}`, 'success');
}

function getIconForCategory(category) {
  const iconMap = {
    ta_staff:
      '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path>',
    rehovot_staff:
      '<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>',
    freelancer:
      '<path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"></path><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>',
    tenant:
      '<path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"></path>',
  };
  return (
    iconMap[category] ||
    '<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>'
  );
}

function createNewItemElement(fieldId, itemName, category) {
  const div = document.createElement('div');
  div.className = 'linear-item';
  div.setAttribute('data-category', category);

  const colorClass = getColorClass(category);
  const iconPath = getIconForCategory(category);

  div.innerHTML = `
                <div class="linear-item-icon">
                  <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%;">
                    ${iconPath}
                  </svg>
                </div>
                <div class="linear-item-content">
                  <span class="editable" data-field="${fieldId}">${itemName}</span>
                </div>
                <button class="delete-btn" onclick="deleteItem(this, '${fieldId}')" title="מחק פריט" style="display: ${
                  editMode ? 'block' : 'none'
                }; position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%);">
                    <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            `;

  // Make editable if in edit mode
  if (editMode) {
    const span = div.querySelector('.editable');
    span.contentEditable = true;
    span.classList.add(
      'border-2',
      'border-dashed',
      'border-blue-300',
      'rounded-lg',
      'px-3',
      'py-2',
      'bg-blue-50',
      'dark:bg-blue-900/20'
    );
    span.addEventListener('input', handleEdit);
  }

  return div;
}

async function deleteItem(button, fieldId) {
  if (!editMode) {
    return;
  }

  const itemElement = button.closest('.editable-item');
  const itemName = itemElement.querySelector('.editable').textContent;

  // Use modern confirmation dialog
  const confirmed =
    typeof ConfirmDialog !== 'undefined'
      ? await ConfirmDialog.show({
          title: 'מחיקת פריט',
          message: `האם אתה בטוח שברצונך למחוק את "${itemName}"? פעולה זו לא ניתנת לביטול.`,
          confirmText: 'מחק',
          cancelText: 'ביטול',
          type: 'danger',
        })
      : confirm(`האם למחוק את "${itemName}"?`);

  if (confirmed) {
    // Show loading state
    if (typeof LoadingStateManager !== 'undefined') {
      LoadingStateManager.buttonLoading(button, 'מוחק...');
    }

    // Remove from DOM
    itemElement.remove();

    // Remove from localStorage
    localStorage.removeItem(`guide_${fieldId}`);

    // Remove from Firebase
    if (typeof deleteFromFirebase === 'function') {
      deleteFromFirebase(fieldId);
    }

    // Remove from Google Sheets (send empty value)
    if (googleSheetsConfig.connected) {
      saveToGoogleSheets(fieldId, '');
    }

    showToast(`נמחק: ${itemName}`, 'success');
  }
}

function getColorClass(category) {
  const colorMap = {
    ta_staff: 'text-gray-600',
    rehovot_staff: 'text-green-600',
    freelancer: 'text-purple-600',
    tenant: 'text-orange-600',
  };
  return colorMap[category] || 'text-gray-600';
}

function handleEdit(e) {
  const field = e.target.getAttribute('data-field');
  const value = e.target.textContent;
  const oldValue = e.target.dataset.previousValue || localStorage.getItem(`guide_${field}`) || '';

  if (field) {
    // Save to history (only if value actually changed)
    if (value !== oldValue && typeof window.HistoryManager !== 'undefined') {
      window.HistoryManager.push({
        field,
        oldValue,
        newValue: value,
      });
    }

    // Update previous value
    e.target.dataset.previousValue = value;

    // Save locally
    localStorage.setItem(`guide_${field}`, value);

    // Save to Firebase
    if (typeof saveToFirebase === 'function') {
      saveToFirebase(field, value);
    }

    // Save to Google Sheets
    if (googleSheetsConfig.connected) {
      saveToGoogleSheets(field, value);
    }

    // Visual feedback
    e.target.style.borderColor = '#10b981';
    showSaveIndicator();

    setTimeout(() => {
      e.target.style.borderColor = '#3b82f6';
    }, 1000);
  }
}

// Function to restore a field value (used by undo/redo)
function restoreFieldValue(field, value) {
  const element = document.querySelector(`[data-field="${field}"]`);
  if (element) {
    element.textContent = value;
    element.dataset.previousValue = value;

    // Save to storage
    localStorage.setItem(`guide_${field}`, value);

    // Save to Firebase
    if (typeof saveToFirebase === 'function') {
      saveToFirebase(field, value);
    }

    // Save to Google Sheets
    if (googleSheetsConfig.connected) {
      saveToGoogleSheets(field, value);
    }

    // Visual feedback
    element.style.borderColor = '#10b981';
    setTimeout(() => {
      element.style.borderColor = '#3b82f6';
    }, 500);
  }
}

// Make restoreFieldValue available globally
window.restoreFieldValue = restoreFieldValue;

async function loadSavedData() {
  const editables = document.querySelectorAll('.editable');

  // Try loading from Firebase first
  if (typeof loadAllDataFromFirebase === 'function') {
    try {
      const firebaseData = await loadAllDataFromFirebase();
      if (firebaseData) {
        console.log('✅ טוען נתונים מ-Firebase');
        // Load from Firebase
        editables.forEach((element) => {
          const field = element.getAttribute('data-field');
          if (field && firebaseData[field]) {
            element.textContent = firebaseData[field];
            // Also save to localStorage as backup
            localStorage.setItem(`guide_${field}`, firebaseData[field]);
          }
        });
        return;
      }
    } catch (error) {
      console.warn('⚠️ לא הצלחנו לטעון מ-Firebase, טוען מאחסון מקומי:', error);
    }
  }

  // Fallback to localStorage
  console.log('💾 טוען נתונים מאחסון מקומי');
  editables.forEach((element) => {
    const field = element.getAttribute('data-field');
    if (field) {
      const savedValue = localStorage.getItem(`guide_${field}`);
      if (savedValue) {
        element.textContent = savedValue;
      }
    }
  });
}

function loadGoogleSheetsConfig() {
  const config = localStorage.getItem('googleSheetsConfig');
  if (config) {
    try {
      googleSheetsConfig = JSON.parse(config);
      updateConnectionStatus();
    } catch (e) {
      console.error('Error loading Google Sheets config:', e);
    }
  }
}

function saveToGoogleSheets(field, value) {
  if (!googleSheetsConfig.webAppUrl) {
    console.warn('Google Sheets not configured');
    return;
  }

  const payload = {
    field,
    value,
    timestamp: new Date().toISOString(),
    user: 'משתמש',
  };

  fetch(googleSheetsConfig.webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log('נשמר בהצלחה לגוגל שיטס');
        updateConnectionStatus(true);
      } else {
        console.error('שגיאה בשמירה:', data.error);
        updateConnectionStatus(false);
      }
    })
    .catch((error) => {
      console.error('שגיאה בחיבור לגוגל שיטס:', error);
      updateConnectionStatus(false);
    });
}

function showSheetsConfig() {
  document.getElementById('webapp-url').value = googleSheetsConfig.webAppUrl || '';
  document.getElementById('spreadsheet-id').value = googleSheetsConfig.spreadsheetId || '';
  elements.sheetsModal.classList.remove('hidden');
}

function hideSheetsConfig() {
  elements.sheetsModal.classList.add('hidden');
}

function saveGoogleSheetsConfig() {
  const webAppUrl = document.getElementById('webapp-url').value.trim();
  const spreadsheetId = document.getElementById('spreadsheet-id').value.trim();

  if (!webAppUrl) {
    showToast('נא להזין Web App URL', 'error');
    return;
  }

  googleSheetsConfig = {
    webAppUrl,
    spreadsheetId,
    connected: true,
  };

  localStorage.setItem('googleSheetsConfig', JSON.stringify(googleSheetsConfig));
  updateConnectionStatus(true);
  hideSheetsConfig();
  showToast('חיבור לגוגל שיטס נשמר בהצלחה', 'success');
}

function updateConnectionStatus(isConnected = null) {
  if (isConnected !== null) {
    googleSheetsConfig.connected = isConnected;
  }

  if (googleSheetsConfig.connected && googleSheetsConfig.webAppUrl) {
    elements.connectionIndicator.className = 'w-3 h-3 rounded-full bg-green-500 ml-2';
    elements.connectionText.textContent = 'מחובר לענן';
  } else {
    elements.connectionIndicator.className = 'w-3 h-3 rounded-full bg-green-500 ml-2';
    elements.connectionText.textContent = 'מחובר לענן';
  }
}

function showSaveIndicator() {
  if (elements.saveIndicator) {
    elements.saveIndicator.classList.add('show');
    setTimeout(() => {
      elements.saveIndicator.classList.remove('show');
    }, 2000);
  }
}

function toggleActionsMenu() {
  elements.actionsMenu?.classList.toggle('hidden');
}

function exportData() {
  const data = { fields: {}, timestamp: Date.now(), version: '1.0' };

  const editables = document.querySelectorAll('.editable');
  editables.forEach((element) => {
    const field = element.getAttribute('data-field');
    if (field) {
      data.fields[field] = element.textContent;
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guide_data_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('הנתונים יוצאו בהצלחה', 'success');
  elements.actionsMenu?.classList.add('hidden');
}

function performSearch() {
  const searchTerm = elements.globalSearch?.value.toLowerCase();
  const searchResultsIndicator = document.getElementById('search-results-container');

  // Remove existing empty state
  const existingEmptyState = document.querySelector('.search-empty-state');
  if (existingEmptyState) {
    existingEmptyState.remove();
  }

  if (!searchTerm) {
    clearSearchHighlights();
    searchCount = 0;
    updateStats();
    return;
  }

  const searchableElements = document.querySelectorAll('.editable, h2, h3, h4, p');

  clearSearchHighlights();

  if (searchTerm.length < 2) {
    searchCount = 0;
    updateStats();
    return;
  }

  let matches = 0;
  searchableElements.forEach((element) => {
    const text = element.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      matches++;
      highlightSearchTerm(element, searchTerm);
    }
  });

  searchCount = matches;
  updateStats();

  // Show empty state if no results
  if (matches === 0 && searchTerm.length >= 2) {
    showSearchEmptyState(searchTerm);
  }
}

function showSearchEmptyState(searchTerm) {
  // Find the main content area
  const mainContent = document.querySelector('main .flex-1');
  if (!mainContent) {
    return;
  }

  // Create empty state notification (floating, non-intrusive)
  const emptyStateHTML = `
    <div class="search-empty-state fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 animate-slide-up">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md border border-gray-200 dark:border-gray-700">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <svg class="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">לא נמצאו תוצאות</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
              לא נמצאו תוצאות עבור "<span class="font-semibold">${searchTerm}</span>"
            </p>
            <button onclick="document.getElementById('global-search').focus(); document.getElementById('global-search').select();" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              נסה מילות חיפוש אחרות
            </button>
          </div>
          <button onclick="this.closest('.search-empty-state').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', emptyStateHTML);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    const emptyState = document.querySelector('.search-empty-state');
    if (emptyState) {
      emptyState.classList.add('opacity-0');
      setTimeout(() => emptyState.remove(), 300);
    }
  }, 5000);
}

function clearSearchHighlights() {
  const highlightedElements = document.querySelectorAll('.search-highlight');
  highlightedElements.forEach((element) => {
    const parent = element.parentNode;
    parent.replaceChild(document.createTextNode(element.textContent), element);
    parent.normalize();
  });
}

function highlightSearchTerm(element, searchTerm) {
  const text = element.textContent;
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  element.innerHTML = '';
  parts.forEach((part) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      const span = document.createElement('span');
      span.className = 'search-highlight';
      span.textContent = part;
      element.appendChild(span);
    } else {
      element.appendChild(document.createTextNode(part));
    }
  });
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateStats() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const editStatusElement = document.getElementById('edit-status');
  if (editStatusElement) {
    editStatusElement.textContent = editMode ? 'פעיל' : 'לא פעיל';
    editStatusElement.className = editMode
      ? 'text-sm font-semibold text-green-600 dark:text-green-400'
      : 'text-sm font-semibold text-gray-900 dark:text-white';
  }

  const lastUpdateElement = document.getElementById('last-update');
  if (lastUpdateElement) {
    lastUpdateElement.textContent = timeString;
  }

  const searchResultsElement = document.getElementById('search-results');
  if (searchResultsElement) {
    searchResultsElement.textContent = searchCount;
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('הועתק ללוח בהצלחה!', 'success');
      })
      .catch(() => {
        fallbackCopy(text);
      });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showToast('הועתק ללוח', 'success');
  } catch (err) {
    showToast('שגיאה בהעתקה', 'error');
  }

  document.body.removeChild(textArea);
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `transform transition-all duration-300 ease-in-out translate-x-full opacity-0 mb-4 px-6 py-4 rounded-lg text-white font-medium shadow-lg max-w-sm ${getToastColor(
    type
  )}`;

  toast.innerHTML = `
                <div class="flex items-center">
                    ${getToastIcon(type)}
                    <span>${message}</span>
                </div>
            `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  }, 100);

  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function getToastColor(type) {
  switch (type) {
    case 'success':
      return 'bg-gradient-to-r from-green-500 to-green-600';
    case 'error':
      return 'bg-gradient-to-r from-red-500 to-red-600';
    case 'warning':
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    default:
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
  }
}

function getToastIcon(type) {
  const icons = {
    success:
      '<svg class="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>',
    error:
      '<svg class="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
    warning:
      '<svg class="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
    default:
      '<svg class="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
  };
  return icons[type] || icons.default;
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse';
  document.body.appendChild(container);
  return container;
}

function debounce(func, wait) {
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

// WhatsApp function
function openWhatsApp(phoneNumber) {
  // Remove all non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // Convert Israeli number to international format
  // Israeli numbers start with 05X-XXXXXXX (10 digits)
  // Convert to +972-5X-XXXXXXX (remove leading 0, add +972)
  let internationalPhone = cleanPhone;
  if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
    internationalPhone = `972${cleanPhone.substring(1)}`;
  }

  // Open WhatsApp (use web.whatsapp.com for desktop, wa.me for mobile)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const whatsappUrl = isMobile
    ? `https://wa.me/${internationalPhone}`
    : `https://web.whatsapp.com/send?phone=${internationalPhone}`;

  window.open(whatsappUrl, '_blank');
  showToast('פותח וואטסאפ...', 'success');
}

// Accordion toggle function for checks-deposits tab
function toggleStep(element) {
  const content = element.nextElementSibling;
  const chevron = element.querySelector('.chevron');

  content.classList.toggle('open');
  chevron.classList.toggle('open');
}

// Make functions available globally
window.showTab = showTab;
window.copyToClipboard = copyToClipboard;
window.showPasswordModal = showPasswordModal;
window.hidePasswordModal = hidePasswordModal;
window.submitPassword = submitPassword;
window.openWhatsApp = openWhatsApp;
window.toggleStep = toggleStep;

// Update stats every 30 seconds
