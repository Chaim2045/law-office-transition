// Notary Calculator - Smart & Intuitive

// Service definitions from regulations
const SERVICES = {
  signature: {
    category: 'אימות חתימה',
    items: [
      { id: 'sig_first', name: 'חותם ראשון', price: 193 },
      { id: 'sig_additional', name: 'חותם נוסף', price: 75 },
      { id: 'sig_authorized', name: 'אישור סמכות חתימה', price: 75 },
      { id: 'sig_copy', name: 'העתק באותו מעמד', price: 75 },
    ],
  },
  photocopy: {
    category: 'אישור העתק צילומי',
    items: [
      { id: 'copy_first', name: 'עמוד ראשון', price: 75 },
      { id: 'copy_additional', name: 'עמוד נוסף', price: 13 },
      { id: 'copy_same_time', name: 'העתק נוסף באותו מעמד - עמוד ראשון', price: 26 },
    ],
  },
  translation: {
    category: 'אישור תרגום',
    items: [
      { id: 'trans_100', name: 'עד 100 מילים ראשונות', price: 245 },
      { id: 'trans_100_1000', name: 'כל 100 מילים (עד 1000)', price: 193 },
      { id: 'trans_above_1000', name: 'כל 100 מילים (מעל 1000)', price: 96 },
      { id: 'trans_additional', name: 'אישור נוסף באותו מעמד', price: 75 },
    ],
  },
  will: {
    category: 'אישור צוואה',
    items: [
      { id: 'will_first', name: 'חותם ראשון', price: 286 },
      { id: 'will_additional', name: 'חותם נוסף', price: 143 },
      { id: 'will_copy', name: 'אישור נוסף באותו מעמד', price: 86 },
    ],
  },
  affidavit: {
    category: 'תצהיר',
    items: [
      { id: 'aff_first', name: 'מצהיר ראשון', price: 195 },
      { id: 'aff_additional', name: 'מצהיר נוסף', price: 78 },
      { id: 'aff_copy', name: 'אישור נוסף באותו מעמד', price: 75 },
    ],
  },
  other: {
    category: 'שירותים נוספים',
    items: [
      { id: 'alive', name: 'אישור שפלוני בחיים', price: 193 },
      { id: 'protest_low', name: 'העדה של מסמך סחיר - עד 80,700 ₪', price: 1244 },
      { id: 'protest_high', name: 'העדה של מסמך סחיר - מעל 80,700 ₪', price: 2667 },
      { id: 'power_cancel', name: 'קבלת הודעת ביטול ייפוי כוח', price: 204 },
      { id: 'power_copy', name: 'העתק מאושר עם הערת ביטול', price: 72 },
      { id: 'prenup', name: 'אימות הסכם ממון', price: 435 },
      { id: 'prenup_copy', name: 'עותק הסכם ממון באותו מעמד', price: 72 },
      { id: 'other_service', name: 'פעולה אחרת', price: 315 },
    ],
  },
};

class NotaryCalculator {
  constructor() {
    this.selectedServices = [];
    this.VAT_RATE = 0.17;

    this.elements = {
      btnAddService: document.getElementById('btnAddService'),
      modal: document.getElementById('serviceModal'),
      modalClose: document.getElementById('modalClose'),
      serviceSearch: document.getElementById('serviceSearch'),
      serviceList: document.getElementById('serviceList'),
      selectedServices: document.getElementById('selectedServices'),
      emptyState: document.getElementById('emptyState'),
      addonsSection: document.getElementById('addonsSection'),
      subtotal: document.getElementById('subtotal'),
      vat: document.getElementById('vat'),
      total: document.getElementById('total'),
      btnCopy: document.getElementById('btnCopy'),
      btnPrint: document.getElementById('btnPrint'),
      btnReset: document.getElementById('btnReset'),
      clientName: document.getElementById('clientName'),
      serviceDate: document.getElementById('serviceDate'),
      addonNight: document.getElementById('addonNight'),
      addonForeign: document.getElementById('addonForeign'),
      addonTravel: document.getElementById('addonTravel'),
      travelDetails: document.getElementById('travelDetails'),
      travelHours: document.getElementById('travelHours'),
      travelCost: document.getElementById('travelCost'),
    };

    this.init();
  }

  init() {
    this.setDefaultDate();
    this.renderServiceList();
    this.bindEvents();
  }

  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    this.elements.serviceDate.value = today;
  }

  bindEvents() {
    // Modal
    this.elements.btnAddService.addEventListener('click', () => this.openModal());
    this.elements.modalClose.addEventListener('click', () => this.closeModal());
    this.elements.modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());

    // Search
    this.elements.serviceSearch.addEventListener('input', (e) => this.searchServices(e.target.value));

    // Addons
    this.elements.addonNight.addEventListener('change', () => this.calculate());
    this.elements.addonForeign.addEventListener('change', () => this.calculate());
    this.elements.addonTravel.addEventListener('change', (e) => {
      this.elements.travelDetails.style.display = e.target.checked ? 'flex' : 'none';
      this.calculate();
    });
    this.elements.travelHours.addEventListener('input', () => this.calculate());
    this.elements.travelCost.addEventListener('input', () => this.calculate());

    // Actions
    this.elements.btnCopy.addEventListener('click', () => this.copyToClipboard());
    this.elements.btnPrint.addEventListener('click', () => window.print());
    this.elements.btnReset.addEventListener('click', () => this.reset());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  openModal() {
    this.elements.modal.classList.add('active');
    this.elements.serviceSearch.value = '';
    this.elements.serviceSearch.focus();
    this.renderServiceList();
  }

  closeModal() {
    this.elements.modal.classList.remove('active');
  }

  renderServiceList(searchTerm = '') {
    const html = [];

    Object.values(SERVICES).forEach((category) => {
      const filteredItems = category.items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filteredItems.length > 0) {
        html.push(`<div class="service-category">${category.category}</div>`);
        filteredItems.forEach((item) => {
          html.push(`
            <div class="service-item" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
              <span class="service-item-title">${item.name}</span>
              <span class="service-item-price">${item.price} ₪</span>
            </div>
          `);
        });
      }
    });

    this.elements.serviceList.innerHTML = html.join('');

    // Bind click events
    this.elements.serviceList.querySelectorAll('.service-item').forEach((item) => {
      item.addEventListener('click', () => {
        this.addService({
          id: item.dataset.id,
          name: item.dataset.name,
          price: parseFloat(item.dataset.price),
        });
      });
    });
  }

  searchServices(term) {
    this.renderServiceList(term);
  }

  addService(service) {
    // Check if already exists
    const existing = this.selectedServices.find((s) => s.id === service.id);
    if (existing) {
      this.notify('השירות כבר נבחר');
      return;
    }

    this.selectedServices.push({
      ...service,
      quantity: 1,
    });

    this.closeModal();
    this.renderSelectedServices();
    this.calculate();
  }

  removeService(id) {
    this.selectedServices = this.selectedServices.filter((s) => s.id !== id);
    this.renderSelectedServices();
    this.calculate();
  }

  updateQuantity(id, quantity) {
    const service = this.selectedServices.find((s) => s.id === id);
    if (service) {
      service.quantity = Math.max(1, parseInt(quantity, 10) || 1);
      this.renderSelectedServices();
      this.calculate();
    }
  }

  renderSelectedServices() {
    if (this.selectedServices.length === 0) {
      this.elements.emptyState.style.display = 'block';
      this.elements.addonsSection.style.display = 'none';
      return;
    }

    this.elements.emptyState.style.display = 'none';
    this.elements.addonsSection.style.display = 'block';

    const html = this.selectedServices.map((service) => {
      const total = service.price * service.quantity;
      return `
        <div class="service-card">
          <div class="service-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="service-card-content">
            <div class="service-card-title">${service.name}</div>
            <div class="service-card-price">${service.price} ₪ × יחידה</div>
          </div>
          <div class="service-card-controls">
            <input
              type="number"
              class="service-card-qty"
              value="${service.quantity}"
              min="1"
              data-id="${service.id}"
            >
            <div class="service-card-total">${total.toFixed(0)} ₪</div>
            <button class="service-card-remove" data-id="${service.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Remove empty state and insert cards
    const container = this.elements.selectedServices;
    container.innerHTML = html;

    // Bind events
    container.querySelectorAll('.service-card-qty').forEach((input) => {
      input.addEventListener('input', (e) => {
        this.updateQuantity(e.target.dataset.id, e.target.value);
      });
    });

    container.querySelectorAll('.service-card-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.removeService(e.currentTarget.dataset.id);
      });
    });
  }

  calculate() {
    let subtotal = 0;

    // Services
    this.selectedServices.forEach((service) => {
      subtotal += service.price * service.quantity;
    });

    // Night addon (+50%)
    if (this.elements.addonNight.checked) {
      subtotal *= 1.5;
    }

    // Foreign language (+102)
    if (this.elements.addonForeign.checked) {
      subtotal += 102;
    }

    // Travel
    if (this.elements.addonTravel.checked) {
      const hours = parseFloat(this.elements.travelHours.value) || 1;
      const cost = parseFloat(this.elements.travelCost.value) || 0;

      let travelCharge = 630; // First hour
      if (hours > 1) {
        const halfHours = (hours - 1) * 2;
        travelCharge += halfHours * 193;
      }

      subtotal += travelCharge + cost;
    }

    // VAT
    const vat = subtotal * this.VAT_RATE;
    const total = subtotal + vat;

    this.updateSummary(subtotal, vat, total);
  }

  updateSummary(subtotal, vat, total) {
    this.elements.subtotal.textContent = `${subtotal.toFixed(0)} ₪`;
    this.elements.vat.textContent = `${vat.toFixed(0)} ₪`;
    this.elements.total.textContent = `${total.toFixed(0)} ₪`;
  }

  copyToClipboard() {
    const clientName = this.elements.clientName.value || 'לקוח';
    const date = this.elements.serviceDate.value;

    let text = '═══ מחשבון נוטריון ═══\n\n';
    text += `לקוח: ${clientName}\n`;
    text += `תאריך: ${date}\n\n`;

    if (this.selectedServices.length > 0) {
      text += '── שירותים ──\n';
      this.selectedServices.forEach((s) => {
        text += `• ${s.name} (×${s.quantity}) - ${(s.price * s.quantity).toFixed(0)} ₪\n`;
      });
      text += '\n';
    }

    const addons = [];
    if (this.elements.addonNight.checked) { addons.push('שעות לילה/שבת (+50%)'); }
    if (this.elements.addonForeign.checked) { addons.push('שפה לועזית (+102 ₪)'); }
    if (this.elements.addonTravel.checked) {
      const hours = this.elements.travelHours.value;
      const cost = this.elements.travelCost.value;
      addons.push(`נסיעה (${hours} שעות, ${cost} ₪ הוצאות)`);
    }

    if (addons.length > 0) {
      text += '── תוספות ──\n';
      addons.forEach((a) => { text += `• ${a}\n`; });
      text += '\n';
    }

    text += '══ סיכום ══\n';
    text += `לפני מע"מ: ${this.elements.subtotal.textContent}\n`;
    text += `מע"מ (17%): ${this.elements.vat.textContent}\n`;
    text += `סה"כ לתשלום: ${this.elements.total.textContent}\n\n`;
    text += 'לפי תקנות הנוטריונים (שכר שירותים), תשל"ט-1978';

    navigator.clipboard.writeText(text).then(() => {
      this.notify('הסיכום הועתק ללוח!');
    }).catch(() => {
      this.notify('שגיאה בהעתקה');
    });
  }

  reset() {
    if (!confirm('האם לאפס את כל הנתונים?')) { return; }

    this.selectedServices = [];
    this.elements.clientName.value = '';
    this.setDefaultDate();
    this.elements.addonNight.checked = false;
    this.elements.addonForeign.checked = false;
    this.elements.addonTravel.checked = false;
    this.elements.travelDetails.style.display = 'none';
    this.elements.travelHours.value = 1;
    this.elements.travelCost.value = 0;

    this.renderSelectedServices();
    this.calculate();
    this.notify('המחשבון אופס');
  }

  notify(message) {
    if (typeof showToast === 'function') {
      showToast(message);
    } else {
      console.log(message);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-new
  new NotaryCalculator();
});
