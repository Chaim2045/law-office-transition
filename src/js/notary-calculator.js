/**
 * Notary Calculator - Professional Implementation
 * High-Tech Standard Architecture (Facebook/Google Style)
 * Self-contained IIFE pattern - No external dependencies
 */

(function (window) {
  // ============================================================================
  // CONFIGURATION & CONSTANTS
  // ============================================================================

  const CONFIG = {
    VAT_RATE: 0.18,
    ADDONS: {
      NIGHT_SHIFT: { label: 'שעות לילה/שבת', value: 0.5, type: 'percentage' },
      FOREIGN_LANGUAGE: { label: 'שפה לועזית', value: 102, type: 'fixed' },
      TRAVEL: {
        label: 'נסיעה',
        basePrice: 204,
        hourlyRate: 102,
        type: 'variable',
      },
    },
    TRANSLATION_TIERS: [
      { maxWords: 100, pricePerHundred: 245 },
      { maxWords: 1000, pricePerHundred: 193 },
      { maxWords: Infinity, pricePerHundred: 96 },
    ],
    SERVICES: {
      signature: {
        category: 'אימות חתימה',
        items: [
          { id: 'sig_single', name: 'אימות חתימה בודדת', price: 102 },
          { id: 'sig_multi', name: 'אימות חתימות מרובות (מ-2)', price: 153 },
          { id: 'sig_thumbprint', name: 'חותם אגודל', price: 204 },
        ],
      },
      photocopy: {
        category: 'אישור צילום',
        items: [
          { id: 'copy_single', name: 'אישור צילום עד עמוד אחד', price: 51 },
          { id: 'copy_multi', name: 'אישור צילום מ-2 עמודים', price: 102 },
        ],
      },
      translation: {
        category: 'תרגום',
        items: [
          {
            id: 'translation',
            name: 'תרגום מסמך',
            price: 0,
            isTranslation: true,
          },
        ],
      },
      will: {
        category: 'צוואה',
        items: [
          { id: 'will_regular', name: 'צוואה רגילה', price: 306 },
          { id: 'will_mutual', name: 'צוואה הדדית', price: 459 },
        ],
      },
      affidavit: {
        category: 'תצהיר',
        items: [
          { id: 'affidavit_single', name: 'תצהיר עד עמוד אחד', price: 153 },
          { id: 'affidavit_multi', name: 'תצהיר מעמוד שני', price: 204 },
        ],
      },
      other: {
        category: 'שונות',
        items: [
          { id: 'inheritance', name: 'ירושה/יפוי כוח', price: 204 },
          { id: 'declaration', name: 'הצהרה', price: 153 },
          { id: 'certification', name: 'אישור נוטריוני', price: 102 },
        ],
      },
    },
  };

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const Utils = {
    formatCurrency(amount) {
      return `${Math.round(amount).toLocaleString('he-IL')} ₪`;
    },

    sanitizeNumber(value, min, max, defaultValue = 0) {
      const num = Number(value);
      if (Number.isNaN(num)) { return defaultValue; }
      if (num < min) { return min; }
      if (num > max) { return max; }
      return num;
    },

    validateQuantity(qty) {
      const num = Number(qty);
      if (Number.isNaN(num) || num < 1 || num > 1000 || !Number.isInteger(num)) {
        return { isValid: false, error: 'כמות לא תקינה' };
      }
      return { isValid: true };
    },

    validateWordCount(words) {
      const num = Number(words);
      if (Number.isNaN(num) || num < 1 || num > 100000 || !Number.isInteger(num)) {
        return { isValid: false, error: 'מספר מילים לא תקין' };
      }
      return { isValid: true };
    },

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
    },
  };

  // ============================================================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================================================

  class ToastManager {
    constructor() {
      this.container = this.createContainer();
    }

    createContainer() {
      let container = document.getElementById('nc-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'nc-toast-container';
        container.className = 'nc-toast-container';
        document.body.appendChild(container);
      }
      return container;
    }

    show(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `nc-toast nc-toast-${type}`;

      const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
      };

      toast.innerHTML = `
        <span class="nc-toast-icon">${icons[type] || icons.info}</span>
        <span class="nc-toast-message">${message}</span>
      `;

      this.container.appendChild(toast);
      setTimeout(() => toast.classList.add('nc-toast-show'), 10);

      setTimeout(() => {
        toast.classList.remove('nc-toast-show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    success(msg) {
      this.show(msg, 'success');
    }

    error(msg) {
      this.show(msg, 'error');
    }

    info(msg) {
      this.show(msg, 'info');
    }
  }

  // ============================================================================
  // CALCULATOR ENGINE
  // ============================================================================

  class CalculatorEngine {
    constructor() {
      this.services = [];
      this.addons = {
        nightShift: false,
        foreignLanguage: false,
        travel: { enabled: false, hours: 1, cost: 0 },
      };
    }

    addService(service) {
      if (!service.isTranslation && this.services.find((s) => s.id === service.id)) {
        return false;
      }

      const newService = {
        id: service.id,
        name: service.name,
        price: service.price,
        qty: 1,
        isTranslation: service.isTranslation || false,
      };

      if (service.isTranslation) {
        newService.id = `translation_${Date.now()}`;
        newService.words = 100;
        newService.price = this.calculateTranslationPrice(100);
      }

      this.services.push(newService);
      return true;
    }

    removeService(serviceId) {
      const index = this.services.findIndex((s) => s.id === serviceId);
      if (index === -1) { return false; }
      this.services.splice(index, 1);
      return true;
    }

    updateQuantity(serviceId, quantity) {
      const validation = Utils.validateQuantity(quantity);
      if (!validation.isValid) { return false; }

      const service = this.services.find((s) => s.id === serviceId);
      if (!service) { return false; }

      service.qty = Utils.sanitizeNumber(quantity, 1, 1000, 1);
      return true;
    }

    updateWordCount(serviceId, words) {
      const validation = Utils.validateWordCount(words);
      if (!validation.isValid) { return false; }

      const service = this.services.find((s) => s.id === serviceId);
      if (!service || !service.isTranslation) { return false; }

      const sanitizedWords = Utils.sanitizeNumber(words, 1, 100000, 100);
      service.words = sanitizedWords;
      service.price = this.calculateTranslationPrice(sanitizedWords);
      return true;
    }

    calculateTranslationPrice(words) {
      if (words <= 0) { return 0; }

      let price = 0;
      let remainingWords = words;
      const tiers = CONFIG.TRANSLATION_TIERS;

      // First 100 words
      if (remainingWords <= tiers[0].maxWords) {
        return tiers[0].pricePerHundred;
      }

      price += tiers[0].pricePerHundred;
      remainingWords -= tiers[0].maxWords;

      // 101-1000 words
      const secondTierWords = Math.min(remainingWords, tiers[1].maxWords - tiers[0].maxWords);
      if (secondTierWords > 0) {
        const chunks = Math.ceil(secondTierWords / 100);
        price += chunks * tiers[1].pricePerHundred;
        remainingWords -= secondTierWords;
      }

      // Above 1000 words
      if (remainingWords > 0) {
        const chunks = Math.ceil(remainingWords / 100);
        price += chunks * tiers[2].pricePerHundred;
      }

      return price;
    }

    calculateServicesTotal() {
      return this.services.reduce((sum, service) => {
        if (service.isTranslation) {
          return sum + service.price;
        }
        return sum + service.price * service.qty;
      }, 0);
    }

    calculateAddonsTotal() {
      let addonsTotal = 0;

      if (this.addons.foreignLanguage) {
        addonsTotal += CONFIG.ADDONS.FOREIGN_LANGUAGE.value;
      }

      if (this.addons.travel.enabled) {
        const { basePrice, hourlyRate } = CONFIG.ADDONS.TRAVEL;
        addonsTotal += basePrice;

        if (this.addons.travel.hours > 1) {
          const additionalHours = this.addons.travel.hours - 1;
          addonsTotal += additionalHours * 2 * hourlyRate;
        }

        addonsTotal += this.addons.travel.cost;
      }

      return addonsTotal;
    }

    calculate() {
      let subtotal = this.calculateServicesTotal();
      subtotal += this.calculateAddonsTotal();

      if (this.addons.nightShift) {
        subtotal *= 1 + CONFIG.ADDONS.NIGHT_SHIFT.value;
      }

      const vat = subtotal * CONFIG.VAT_RATE;
      const total = subtotal + vat;

      return {
        subtotal: Math.round(subtotal),
        vat: Math.round(vat),
        total: Math.round(total),
      };
    }

    reset() {
      this.services = [];
      this.addons = {
        nightShift: false,
        foreignLanguage: false,
        travel: { enabled: false, hours: 1, cost: 0 },
      };
    }

    generateSummary(clientName, date) {
      const results = this.calculate();
      let summary = '═══ מחשבון נוטריון ═══\n\n';

      summary += `לקוח: ${clientName || 'לקוח'}\n`;
      summary += `תאריך: ${date || new Date().toISOString().split('T')[0]}\n\n`;

      if (this.services.length > 0) {
        summary += '── שירותים ──\n';
        this.services.forEach((service) => {
          if (service.isTranslation) {
            summary += `• ${service.name} (${service.words} מילים) - ${service.price} ₪\n`;
          } else {
            summary += `• ${service.name} (×${service.qty}) - ${service.price * service.qty} ₪\n`;
          }
        });
        summary += '\n';
      }

      if (this.addons.nightShift || this.addons.foreignLanguage || this.addons.travel.enabled) {
        summary += '── תוספות ──\n';
        if (this.addons.nightShift) {
          summary += '• שעות לילה/שבת (+50%)\n';
        }
        if (this.addons.foreignLanguage) {
          summary += '• שפה לועזית (+102 ₪)\n';
        }
        if (this.addons.travel.enabled) {
          summary += `• נסיעה (${this.addons.travel.hours} שעות, ${this.addons.travel.cost} ₪ הוצאות)\n`;
        }
        summary += '\n';
      }

      summary += '══ סיכום ══\n';
      summary += `לפני מע"מ: ${results.subtotal} ₪\n`;
      summary += `מע"מ (18%): ${results.vat} ₪\n`;
      summary += `סה"כ לתשלום: ${results.total} ₪`;

      return summary;
    }
  }

  // ============================================================================
  // UI MANAGER
  // ============================================================================

  class UIManager {
    constructor(calculator) {
      this.calculator = calculator;
      this.toast = new ToastManager();
      this.elements = {};
      this.modalOpen = false;
    }

    init() {
      this.cacheElements();
      this.bindEvents();
      this.setDefaultDate();
      this.render();
    }

    cacheElements() {
      const ids = [
        'nc-clientName',
        'nc-serviceDate',
        'nc-btnAdd',
        'nc-services',
        'nc-addons',
        'nc-addonNight',
        'nc-addonForeign',
        'nc-addonTravel',
        'nc-travelDetails',
        'nc-travelHours',
        'nc-travelCost',
        'nc-subtotal',
        'nc-vat',
        'nc-total',
        'nc-btnCopy',
        'nc-btnPrint',
        'nc-btnReset',
        'nc-modal',
        'nc-modalClose',
        'nc-search',
        'nc-list',
      ];

      ids.forEach((id) => {
        this.elements[id] = document.getElementById(id);
      });
    }

    bindEvents() {
      if (this.elements['nc-btnAdd']) {
        this.elements['nc-btnAdd'].addEventListener('click', () => this.openModal());
      }

      if (this.elements['nc-modalClose']) {
        this.elements['nc-modalClose'].addEventListener('click', () => this.closeModal());
      }

      if (this.elements['nc-modal']) {
        this.elements['nc-modal'].querySelector('.nc-modal-overlay')?.addEventListener('click', () => this.closeModal());
      }

      if (this.elements['nc-search']) {
        this.elements['nc-search'].addEventListener(
          'input',
          Utils.debounce((e) => this.renderServicesList(e.target.value), 200),
        );
      }

      if (this.elements['nc-addonNight']) {
        this.elements['nc-addonNight'].addEventListener('change', (e) => {
          this.calculator.addons.nightShift = e.target.checked;
          this.updateSummary();
        });
      }

      if (this.elements['nc-addonForeign']) {
        this.elements['nc-addonForeign'].addEventListener('change', (e) => {
          this.calculator.addons.foreignLanguage = e.target.checked;
          this.updateSummary();
        });
      }

      if (this.elements['nc-addonTravel']) {
        this.elements['nc-addonTravel'].addEventListener('change', (e) => {
          this.calculator.addons.travel.enabled = e.target.checked;
          if (this.elements['nc-travelDetails']) {
            this.elements['nc-travelDetails'].classList.toggle('nc-show', e.target.checked);
          }
          this.updateSummary();
        });
      }

      if (this.elements['nc-travelHours']) {
        this.elements['nc-travelHours'].addEventListener('input', (e) => {
          this.calculator.addons.travel.hours = Utils.sanitizeNumber(parseFloat(e.target.value), 0.5, 24, 1);
          this.updateSummary();
        });
      }

      if (this.elements['nc-travelCost']) {
        this.elements['nc-travelCost'].addEventListener('input', (e) => {
          this.calculator.addons.travel.cost = Utils.sanitizeNumber(parseFloat(e.target.value), 0, 10000, 0);
          this.updateSummary();
        });
      }

      if (this.elements['nc-btnCopy']) {
        this.elements['nc-btnCopy'].addEventListener('click', () => this.copyToClipboard());
      }

      if (this.elements['nc-btnPrint']) {
        this.elements['nc-btnPrint'].addEventListener('click', () => window.print());
      }

      if (this.elements['nc-btnReset']) {
        this.elements['nc-btnReset'].addEventListener('click', () => this.reset());
      }

      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.openModal();
        }
        if (e.key === 'Escape' && this.modalOpen) {
          this.closeModal();
        }
      });
    }

    setDefaultDate() {
      if (this.elements['nc-serviceDate']) {
        this.elements['nc-serviceDate'].value = new Date().toISOString().split('T')[0];
      }
    }

    getAllServices() {
      const services = [];
      Object.values(CONFIG.SERVICES).forEach((category) => {
        category.items.forEach((item) => {
          services.push({ ...item, category: category.category });
        });
      });
      return services;
    }

    searchServices(term) {
      if (!term) { return this.getAllServices(); }
      const lowerTerm = term.toLowerCase();
      return this.getAllServices().filter(
        (s) => s.name.toLowerCase().includes(lowerTerm) || s.category.toLowerCase().includes(lowerTerm),
      );
    }

    renderServicesList(searchTerm = '') {
      const services = this.searchServices(searchTerm);
      const categories = {};

      services.forEach((service) => {
        if (!categories[service.category]) {
          categories[service.category] = [];
        }
        categories[service.category].push(service);
      });

      const html = [];
      Object.entries(categories).forEach(([category, items]) => {
        html.push(`<div class="nc-service-category">${category}</div>`);
        items.forEach((item) => {
          const priceLabel = item.price > 0 ? Utils.formatCurrency(item.price) : 'לפי מילים';
          html.push(`
            <div class="nc-service-item" data-service='${JSON.stringify(item)}'>
              <span class="nc-service-item-title">${item.name}</span>
              <span class="nc-service-item-price">${priceLabel}</span>
            </div>
          `);
        });
      });

      if (this.elements['nc-list']) {
        this.elements['nc-list'].innerHTML = html.join('');
        this.elements['nc-list'].querySelectorAll('.nc-service-item').forEach((el) => {
          el.addEventListener('click', () => {
            const service = JSON.parse(el.dataset.service);
            this.handleAddService(service);
          });
        });
      }
    }

    handleAddService(service) {
      if (this.calculator.addService(service)) {
        this.closeModal();
        this.render();
        this.toast.success('השירות נוסף בהצלחה');
      } else {
        this.toast.info('השירות כבר קיים ברשימה');
      }
    }

    render() {
      const services = this.calculator.services;

      if (!this.elements['nc-services']) { return; }

      if (services.length === 0) {
        this.elements['nc-services'].innerHTML = `
          <div class="nc-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <p>לא נבחרו שירותים</p>
            <span>לחץ על "הוסף שירות" כדי להתחיל</span>
          </div>
        `;

        if (this.elements['nc-addons']) {
          this.elements['nc-addons'].classList.remove('nc-show');
        }
        this.updateSummary();
        return;
      }

      if (this.elements['nc-addons']) {
        this.elements['nc-addons'].classList.add('nc-show');
      }

      const html = services
        .map((service) => {
          if (service.isTranslation) {
            return `
            <div class="nc-service-card" data-service-id="${service.id}">
              <div class="nc-service-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="nc-service-content">
                <div class="nc-service-title">${service.name}</div>
                <div class="nc-service-price">
                  <input type="number"
                         class="nc-qty-input nc-word-count-input"
                         value="${service.words}"
                         min="1"
                         data-service-id="${service.id}"
                         placeholder="מספר מילים">
                  <span>מילים</span>
                </div>
              </div>
              <div class="nc-service-controls">
                <div class="nc-service-total">${Utils.formatCurrency(service.price)}</div>
                <button class="nc-btn-remove" data-service-id="${service.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
          }

          return `
            <div class="nc-service-card" data-service-id="${service.id}">
              <div class="nc-service-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="nc-service-content">
                <div class="nc-service-title">${service.name}</div>
                <div class="nc-service-price">${Utils.formatCurrency(service.price)} × יחידה</div>
              </div>
              <div class="nc-service-controls">
                <input type="number"
                       class="nc-qty-input"
                       value="${service.qty}"
                       min="1"
                       data-service-id="${service.id}">
                <div class="nc-service-total">${Utils.formatCurrency(service.price * service.qty)}</div>
                <button class="nc-btn-remove" data-service-id="${service.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      this.elements['nc-services'].innerHTML = html;
      this.bindServiceHandlers();
      this.updateSummary();
    }

    bindServiceHandlers() {
      document.querySelectorAll('.nc-qty-input:not(.nc-word-count-input)').forEach((input) => {
        input.addEventListener('input', (e) => {
          const serviceId = e.target.dataset.serviceId;
          const qty = parseInt(e.target.value, 10);
          if (this.calculator.updateQuantity(serviceId, qty)) {
            this.render();
          }
        });
      });

      document.querySelectorAll('.nc-word-count-input').forEach((input) => {
        input.addEventListener('input', (e) => {
          const serviceId = e.target.dataset.serviceId;
          const words = parseInt(e.target.value, 10);
          if (this.calculator.updateWordCount(serviceId, words)) {
            this.render();
          }
        });
      });

      document.querySelectorAll('.nc-btn-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const serviceId = btn.dataset.serviceId;
          if (this.calculator.removeService(serviceId)) {
            this.toast.info('השירות הוסר');
            this.render();
          }
        });
      });
    }

    updateSummary() {
      const results = this.calculator.calculate();

      if (this.elements['nc-subtotal']) {
        this.elements['nc-subtotal'].textContent = Utils.formatCurrency(results.subtotal);
      }
      if (this.elements['nc-vat']) {
        this.elements['nc-vat'].textContent = Utils.formatCurrency(results.vat);
      }
      if (this.elements['nc-total']) {
        this.elements['nc-total'].textContent = Utils.formatCurrency(results.total);
      }
    }

    openModal() {
      if (this.elements['nc-modal']) {
        this.elements['nc-modal'].classList.add('nc-show');
        this.modalOpen = true;
        this.renderServicesList();
        if (this.elements['nc-search']) {
          this.elements['nc-search'].focus();
        }
      }
    }

    closeModal() {
      if (this.elements['nc-modal']) {
        this.elements['nc-modal'].classList.remove('nc-show');
        this.modalOpen = false;
        if (this.elements['nc-search']) {
          this.elements['nc-search'].value = '';
        }
      }
    }

    async copyToClipboard() {
      try {
        const clientName = this.elements['nc-clientName']?.value || '';
        const date = this.elements['nc-serviceDate']?.value || '';
        const summary = this.calculator.generateSummary(clientName, date);
        await navigator.clipboard.writeText(summary);
        this.toast.success('הסיכום הועתק ללוח');
      } catch (error) {
        console.error('Copy error:', error);
        this.toast.error('שגיאה בהעתקה');
      }
    }

    reset() {
      if (!confirm('האם לאפס את כל הנתונים?')) { return; }

      this.calculator.reset();

      if (this.elements['nc-clientName']) { this.elements['nc-clientName'].value = ''; }
      if (this.elements['nc-serviceDate']) { this.setDefaultDate(); }
      if (this.elements['nc-addonNight']) { this.elements['nc-addonNight'].checked = false; }
      if (this.elements['nc-addonForeign']) { this.elements['nc-addonForeign'].checked = false; }
      if (this.elements['nc-addonTravel']) { this.elements['nc-addonTravel'].checked = false; }
      if (this.elements['nc-travelDetails']) { this.elements['nc-travelDetails'].classList.remove('nc-show'); }

      this.render();
      this.toast.info('המחשבון אופס');
    }
  }

  // ============================================================================
  // MAIN APPLICATION
  // ============================================================================

  class NotaryCalculator {
    constructor() {
      this.calculator = new CalculatorEngine();
      this.ui = new UIManager(this.calculator);
      this.initialized = false;
    }

    init() {
      if (this.initialized) { return; }

      try {
        this.ui.init();
        this.initialized = true;
        console.log('✅ NotaryCalculator initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing NotaryCalculator:', error);
      }
    }

    destroy() {
      this.initialized = false;
    }
  }

  // ============================================================================
  // AUTO-INITIALIZE ON TAB LOAD
  // ============================================================================

  let calculatorInstance = null;

  function initializeCalculator() {
    // Check if the required elements exist
    if (!document.getElementById('nc-btnAdd')) {
      console.log('⏳ NotaryCalculator: Elements not ready yet');
      return false;
    }

    // Destroy existing instance if any
    if (calculatorInstance) {
      console.log('♻️ NotaryCalculator: Resetting previous instance');
      calculatorInstance.destroy();
    }

    calculatorInstance = new NotaryCalculator();
    calculatorInstance.init();
    console.log('🎉 NotaryCalculator ready!');
    return true;
  }

  // Listen for tabLoaded event - this is triggered when the tab HTML is loaded
  document.addEventListener('tabLoaded', (e) => {
    if (e.detail && e.detail.tabId === 'notary-calculator') {
      console.log('📡 Notary Calculator tab loaded');
      setTimeout(initializeCalculator, 50);
    }
  });

  // Export to window for debugging
  window.NotaryCalculator = NotaryCalculator;
  window.initNotaryCalculator = initializeCalculator;
}(window));
