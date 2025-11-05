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
    localStorage.getItem('theme') === 'dark'
    || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  }

  // Show first tab
  showTab('general-info');

  // Load saved data
  loadSavedData();

  // Load Google Sheets config
  loadGoogleSheetsConfig();
}

function setupEventListeners() {
  // Dark mode toggle
  elements.darkToggle?.addEventListener('click', toggleDarkMode);

  // Edit mode toggle
  elements.editToggle?.addEventListener('click', toggleEditMode);

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
      'border-blue-500',
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
      'border-blue-500',
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
    elements.editToggle.innerHTML = '<svg class="w-4 h-4 inline ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>שמור שינויים';
    elements.editToggle.classList.remove(
      'from-green-600',
      'to-green-700',
      'hover:from-green-700',
      'hover:to-green-800',
    );
    elements.editToggle.classList.add(
      'from-red-600',
      'to-red-700',
      'hover:from-red-700',
      'hover:to-red-800',
    );

    editables.forEach((element) => {
      element.contentEditable = true;
      element.classList.add(
        'border-2',
        'border-dashed',
        'border-blue-300',
        'rounded-lg',
        'px-3',
        'py-2',
        'bg-blue-50',
        'dark:bg-blue-900/20',
      );
      element.addEventListener('input', handleEdit);
    });

    // Show delete and add buttons
    deleteButtons.forEach((btn) => (btn.style.display = 'block'));
    addButtons.forEach((btn) => (btn.style.display = 'flex'));

    showToast('מצב עריכה הופעל', 'info');
  } else {
    elements.editToggle.innerHTML = '<svg class="w-4 h-4 inline ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>מצב עריכה';
    elements.editToggle.classList.remove(
      'from-red-600',
      'to-red-700',
      'hover:from-red-700',
      'hover:to-red-800',
    );
    elements.editToggle.classList.add(
      'from-green-600',
      'to-green-700',
      'hover:from-green-700',
      'hover:to-green-800',
    );

    editables.forEach((element) => {
      element.contentEditable = false;
      element.classList.remove(
        'border-2',
        'border-dashed',
        'border-blue-300',
        'rounded-lg',
        'px-3',
        'py-2',
        'bg-blue-50',
        'dark:bg-blue-900/20',
      );
      element.removeEventListener('input', handleEdit);
    });

    // Hide delete and add buttons
    deleteButtons.forEach((btn) => (btn.style.display = 'none'));
    addButtons.forEach((btn) => (btn.style.display = 'none'));

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
    }')"]`,
  );
  if (addButton) {
    addButton.parentNode.insertBefore(newItem, addButton);
  }

  // Save to localStorage and Google Sheets
  localStorage.setItem(`guide_${newFieldId}`, itemName);
  if (googleSheetsConfig.connected) {
    saveToGoogleSheets(newFieldId, itemName);
  }

  hideAddItemModal();
  showToast(`נוסף בהצלחה: ${itemName}`, 'success');
}

function createNewItemElement(fieldId, itemName, category) {
  const div = document.createElement('div');
  div.className = 'editable-item flex items-center p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg';

  const colorClass = getColorClass(category);

  div.innerHTML = `
                <svg class="w-5 h-5 ${colorClass} ml-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                <span class="editable text-gray-700 dark:text-gray-300" data-field="${fieldId}">${itemName}</span>
                <button class="delete-btn" onclick="deleteItem(this, '${fieldId}')" title="מחק פריט" style="display: ${
  editMode ? 'block' : 'none'
}">
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
      'dark:bg-blue-900/20',
    );
    span.addEventListener('input', handleEdit);
  }

  return div;
}

function deleteItem(button, fieldId) {
  if (!editMode) {
    return;
  }

  const itemElement = button.closest('.editable-item');
  const itemName = itemElement.querySelector('.editable').textContent;

  if (confirm(`האם למחוק את "${itemName}"?`)) {
    // Remove from DOM
    itemElement.remove();

    // Remove from localStorage
    localStorage.removeItem(`guide_${fieldId}`);

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

  if (field) {
    // Save locally
    localStorage.setItem(`guide_${field}`, value);

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

function loadSavedData() {
  const editables = document.querySelectorAll('.editable');
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
    type,
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

// Make functions available globally
window.showTab = showTab;
window.copyToClipboard = copyToClipboard;
window.showPasswordModal = showPasswordModal;
window.hidePasswordModal = hidePasswordModal;
window.submitPassword = submitPassword;

// Update stats every 30 seconds
