/**
 * UI Manager
 * Handles all UI rendering and interactions
 */

import { NOTARY_CONFIG, searchServices } from './config';
import { formatCurrency } from './validators';

/**
 * Toast Notification System
 */
export class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info, warning)
   * @param {number} duration - Duration in ms
   */
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠',
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }
}

/**
 * Confirmation Dialog System
 */
export class ConfirmDialog {
  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @param {string} title - Dialog title
   * @returns {Promise<boolean>} User confirmation
   */
  static show(message, title = 'אישור פעולה') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      dialog.innerHTML = `
        <div class="confirm-header">
          <h3>${title}</h3>
        </div>
        <div class="confirm-body">
          <p>${message}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary confirm-cancel">ביטול</button>
          <button class="btn btn-primary confirm-ok">אישור</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Show animation
      setTimeout(() => overlay.classList.add('show'), 10);

      const cleanup = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
      };

      dialog.querySelector('.confirm-ok').addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      dialog.querySelector('.confirm-cancel').addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });
    });
  }
}

/**
 * UI Manager - Handles all UI rendering
 */
export class UIManager {
  constructor(calculator) {
    this.calculator = calculator;
    this.toast = new ToastManager();
    this.elements = this.getElements();
  }

  /**
   * Get all DOM elements
   * @returns {Object} DOM elements
   */
  getElements() {
    const els = {};
    Object.entries(NOTARY_CONFIG.ELEMENTS).forEach(([key, id]) => {
      els[key] = document.getElementById(id);
    });
    return els;
  }

  /**
   * Initialize UI
   */
  init() {
    try {
      // Set default date
      if (this.elements.SERVICE_DATE) {
        this.elements.SERVICE_DATE.value = NOTARY_CONFIG.UI.DEFAULT_DATE();
      }

      this.render();
      this.updateSummary();
    } catch (error) {
      console.error('Error initializing UI:', error);
      this.toast.error('שגיאה באתחול הממשק');
    }
  }

  /**
   * Render services list
   */
  renderServicesList(searchTerm = '') {
    try {
      const services = searchServices(searchTerm);
      const html = [];

      // Group by category
      const categories = {};
      services.forEach((service) => {
        if (!categories[service.category]) {
          categories[service.category] = [];
        }
        categories[service.category].push(service);
      });

      Object.entries(categories).forEach(([category, items]) => {
        html.push(`<div class="service-category">${category}</div>`);
        items.forEach((item) => {
          html.push(`
            <div class="service-item" data-service='${JSON.stringify(item)}'>
              <span class="service-item-title">${item.name}</span>
              <span class="service-item-price">${item.price > 0 ? formatCurrency(item.price) : 'לפי מילים'}</span>
            </div>
          `);
        });
      });

      if (this.elements.SERVICE_LIST) {
        this.elements.SERVICE_LIST.innerHTML = html.join('');

        // Add click handlers
        this.elements.SERVICE_LIST.querySelectorAll('.service-item').forEach((el) => {
          el.addEventListener('click', () => {
            const service = JSON.parse(el.dataset.service);
            this.handleAddService(service);
          });
        });
      }
    } catch (error) {
      console.error('Error rendering services list:', error);
      this.toast.error('שגיאה בטעינת רשימת שירותים');
    }
  }

  /**
   * Render selected services
   */
  render() {
    try {
      const services = this.calculator.services;

      if (!this.elements.SERVICES_AREA) { return; }

      if (services.length === 0) {
        this.elements.SERVICES_AREA.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <p>לא נבחרו שירותים</p>
            <span>לחץ על "הוסף שירות" כדי להתחיל</span>
          </div>
        `;

        if (this.elements.ADDONS_SECTION) {
          this.elements.ADDONS_SECTION.classList.remove('show');
        }
        return;
      }

      // Show addons section
      if (this.elements.ADDONS_SECTION) {
        this.elements.ADDONS_SECTION.classList.add('show');
      }

      const html = services.map((service) => {
        if (service.isTranslation) {
          return `
            <div class="service-card" data-service-id="${service.id}">
              <div class="service-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="service-content">
                <div class="service-title">${service.name}</div>
                <div class="service-price" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                  <input type="number"
                         class="qty-input word-count-input"
                         value="${service.words}"
                         min="1"
                         data-service-id="${service.id}"
                         placeholder="מספר מילים"
                         style="width: 100px;">
                  <span style="font-size: 13px; color: var(--gray-600);">מילים</span>
                </div>
              </div>
              <div class="service-controls">
                <div class="service-total">${formatCurrency(service.price)}</div>
                <button class="btn-remove" data-service-id="${service.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div class="service-card" data-service-id="${service.id}">
            <div class="service-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="service-content">
              <div class="service-title">${service.name}</div>
              <div class="service-price">${formatCurrency(service.price)} × יחידה</div>
            </div>
            <div class="service-controls">
              <input type="number"
                     class="qty-input"
                     value="${service.qty}"
                     min="1"
                     data-service-id="${service.id}">
              <div class="service-total">${formatCurrency(service.price * service.qty)}</div>
              <button class="btn-remove" data-service-id="${service.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        `;
      });

      this.elements.SERVICES_AREA.innerHTML = html.join('');

      // Add event handlers
      this.bindServiceHandlers();
      this.updateSummary();
    } catch (error) {
      console.error('Error rendering services:', error);
      this.toast.error('שגיאה בהצגת שירותים');
    }
  }

  /**
   * Bind event handlers to service cards
   */
  bindServiceHandlers() {
    try {
      // Quantity inputs
      document.querySelectorAll('.qty-input:not(.word-count-input)').forEach((input) => {
        input.addEventListener('input', (e) => {
          const serviceId = e.target.dataset.serviceId;
          const qty = parseInt(e.target.value, 10);
          if (this.calculator.updateQuantity(serviceId, qty)) {
            this.render();
          }
        });
      });

      // Word count inputs (for translation)
      document.querySelectorAll('.word-count-input').forEach((input) => {
        input.addEventListener('input', (e) => {
          const serviceId = e.target.dataset.serviceId;
          const words = parseInt(e.target.value, 10);
          if (this.calculator.updateWordCount(serviceId, words)) {
            this.render();
          }
        });
      });

      // Remove buttons
      document.querySelectorAll('.btn-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const serviceId = btn.dataset.serviceId;
          if (this.calculator.removeService(serviceId)) {
            this.toast.info('השירות הוסר');
            this.render();
          }
        });
      });
    } catch (error) {
      console.error('Error binding service handlers:', error);
    }
  }

  /**
   * Handle adding a service
   * @param {Object} service - Service to add
   */
  handleAddService(service) {
    try {
      if (this.calculator.addService(service)) {
        this.closeModal();
        this.render();
        this.toast.success('השירות נוסף בהצלחה');
      } else {
        this.toast.warning('השירות כבר קיים ברשימה');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      this.toast.error('שגיאה בהוספת שירות');
    }
  }

  /**
   * Update summary display
   */
  updateSummary() {
    try {
      const results = this.calculator.calculate();

      if (this.elements.SUBTOTAL) {
        this.elements.SUBTOTAL.textContent = formatCurrency(results.subtotal);
      }

      if (this.elements.VAT) {
        this.elements.VAT.textContent = formatCurrency(results.vat);
      }

      if (this.elements.TOTAL) {
        this.elements.TOTAL.textContent = formatCurrency(results.total);
      }
    } catch (error) {
      console.error('Error updating summary:', error);
    }
  }

  /**
   * Open service selection modal
   */
  openModal() {
    try {
      if (this.elements.MODAL) {
        this.elements.MODAL.classList.add('show');
        this.renderServicesList();
        if (this.elements.SEARCH) {
          this.elements.SEARCH.focus();
        }
      }
    } catch (error) {
      console.error('Error opening modal:', error);
      this.toast.error('שגיאה בפתיחת חלון הבחירה');
    }
  }

  /**
   * Close service selection modal
   */
  closeModal() {
    try {
      if (this.elements.MODAL) {
        this.elements.MODAL.classList.remove('show');
        if (this.elements.SEARCH) {
          this.elements.SEARCH.value = '';
        }
      }
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }

  /**
   * Copy summary to clipboard
   */
  async copyToClipboard() {
    try {
      const clientName = this.elements.CLIENT_NAME?.value || '';
      const date = this.elements.SERVICE_DATE?.value || '';
      const summary = this.calculator.generateSummary(clientName, date);

      await navigator.clipboard.writeText(summary);
      this.toast.success('הסיכום הועתק ללוח');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.toast.error('שגיאה בהעתקה ללוח');
    }
  }

  /**
   * Print summary
   */
  print() {
    try {
      window.print();
    } catch (error) {
      console.error('Error printing:', error);
      this.toast.error('שגיאה בהדפסה');
    }
  }

  /**
   * Reset calculator
   */
  async reset() {
    try {
      const confirmed = await ConfirmDialog.show('האם לאפס את כל הנתונים?', 'איפוס מחשבון');

      if (!confirmed) { return; }

      this.calculator.reset();

      if (this.elements.CLIENT_NAME) {
        this.elements.CLIENT_NAME.value = '';
      }

      if (this.elements.SERVICE_DATE) {
        this.elements.SERVICE_DATE.value = NOTARY_CONFIG.UI.DEFAULT_DATE();
      }

      if (this.elements.ADDON_NIGHT) {
        this.elements.ADDON_NIGHT.checked = false;
      }

      if (this.elements.ADDON_FOREIGN) {
        this.elements.ADDON_FOREIGN.checked = false;
      }

      if (this.elements.ADDON_TRAVEL) {
        this.elements.ADDON_TRAVEL.checked = false;
      }

      if (this.elements.TRAVEL_DETAILS) {
        this.elements.TRAVEL_DETAILS.classList.remove('show');
      }

      this.render();
      this.toast.info('המחשבון אופס');
    } catch (error) {
      console.error('Error resetting:', error);
      this.toast.error('שגיאה באיפוס');
    }
  }
}
