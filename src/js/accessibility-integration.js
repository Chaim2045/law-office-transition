/**
 * Accessibility Integration
 * Connects accessibility features to existing functions
 */

// Wrap existing showTab function
if (typeof showTab !== 'undefined') {
  const originalShowTab = window.showTab;
  window.showTab = function (tabName) {
    originalShowTab(tabName);

    // Update ARIA
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.setAttribute(
        'aria-selected',
        tab.getAttribute('data-tab') === tabName ? 'true' : 'false',
      );
    });

    // Announce to screen readers
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab && typeof announceNavigationChange !== 'undefined') {
      announceNavigationChange(activeTab.textContent.trim());
    }
  };
}

// Wrap performSearch to announce results
if (typeof window.performSearch !== 'undefined') {
  // Will be wrapped after page load
  setTimeout(() => {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        setTimeout(() => {
          const count = typeof searchCount !== 'undefined' ? searchCount : 0;
          const query = searchInput.value;
          if (query.length >= 2 && typeof announceSearchResults !== 'undefined') {
            announceSearchResults(count, query);
          }
        }, 500);
      });
    }
  }, 1000);
}

// Wrap toggleEditMode
if (typeof window.toggleEditMode !== 'undefined') {
  setTimeout(() => {
    const editToggle = document.getElementById('edit-mode-toggle');
    if (editToggle) {
      editToggle.addEventListener('click', () => {
        setTimeout(() => {
          if (typeof editMode !== 'undefined' && typeof announceEditModeChange !== 'undefined') {
            announceEditModeChange(editMode);
          }
        }, 100);
      });
    }
  }, 1000);
}

// Wrap Undo/Redo
if (typeof KeyboardShortcuts !== 'undefined') {
  const originalUndo = KeyboardShortcuts.undo;
  const originalRedo = KeyboardShortcuts.redo;

  KeyboardShortcuts.undo = function () {
    originalUndo.call(this);
    if (typeof announceUndoRedo !== 'undefined') {
      announceUndoRedo('undo');
    }
  };

  KeyboardShortcuts.redo = function () {
    originalRedo.call(this);
    if (typeof announceUndoRedo !== 'undefined') {
      announceUndoRedo('redo');
    }
  };
}

console.log('♿ Accessibility integration loaded');
