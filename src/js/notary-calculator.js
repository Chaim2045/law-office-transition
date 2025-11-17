// Notary Calculator Logic
/* global showToast */

class NotaryCalculator {
  constructor() {
    this.VAT_RATE = 0.17; // 17% מע"מ לפי התקנות
    this.initEventListeners();
    this.setDefaultDate();
    this.calculate();
  }

  initEventListeners() {
    // Service checkboxes
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    serviceCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => this.calculate());
    });

    // Quantity inputs
    const quantityInputs = document.querySelectorAll('.quantity-input');
    quantityInputs.forEach((input) => {
      input.addEventListener('input', () => this.calculate());
    });

    // Addon checkboxes
    const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
    addonCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        this.handleAddonChange(e.target);
        this.calculate();
      });
    });

    // Buttons
    document.getElementById('printBtn').addEventListener('click', () => this.print());
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    document.getElementById('copyBtn').addEventListener('click', () => this.copySummary());
  }

  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('serviceDate').value = today;
  }

  handleAddonChange(checkbox) {
    const addonId = checkbox.id;

    if (addonId === 'addon_travel') {
      const travelDetails = document.querySelector('.travel-details');
      if (checkbox.checked) {
        travelDetails.classList.add('active');
      } else {
        travelDetails.classList.remove('active');
      }
    }

    if (addonId === 'addon_translation') {
      const translationDetails = document.querySelector('.translation-details');
      if (checkbox.checked) {
        translationDetails.classList.add('active');
      } else {
        translationDetails.classList.remove('active');
      }
    }
  }

  calculate() {
    let subtotal = 0;

    // Calculate services
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox:checked');
    serviceCheckboxes.forEach((checkbox) => {
      const basePrice = parseFloat(checkbox.dataset.basePrice);
      const serviceId = checkbox.id;

      // Check if there's a quantity input for this service
      const qtyInputId = serviceId.replace('service_', 'qty_');
      const qtyInput = document.getElementById(qtyInputId);

      if (qtyInput) {
        const quantity = parseInt(qtyInput.value, 10) || 1;
        subtotal += basePrice * quantity;
      } else {
        subtotal += basePrice;
      }
    });

    // Calculate addons
    subtotal = this.calculateAddons(subtotal);

    // Calculate VAT
    const vat = subtotal * this.VAT_RATE;
    const total = subtotal + vat;

    // Update display
    this.updateDisplay(subtotal, vat, total);
  }

  calculateAddons(currentSubtotal) {
    let subtotal = currentSubtotal;

    // Night/Weekend service (+50%)
    const nightAddon = document.getElementById('addon_night');
    let nightSurcharge = 0;
    if (nightAddon.checked) {
      nightSurcharge = subtotal * 0.5;
      subtotal += nightSurcharge;
    }

    // Foreign language (+102 NIS)
    const foreignAddon = document.getElementById('addon_foreign');
    if (foreignAddon.checked) {
      subtotal += 102;
    }

    // Travel
    const travelAddon = document.getElementById('addon_travel');
    if (travelAddon.checked) {
      const hours = parseFloat(document.getElementById('travel_hours').value) || 1;
      const travelCost = parseFloat(document.getElementById('travel_cost').value) || 0;

      let travelCharge = 630; // First hour
      if (hours > 1) {
        const additionalHalfHours = (hours - 1) * 2; // Convert to half-hours
        travelCharge += additionalHalfHours * 193;
      }

      subtotal += travelCharge + travelCost;
    }

    // Translation by notary (half of translation fee)
    const translationAddon = document.getElementById('addon_translation');
    if (translationAddon.checked) {
      const words = parseInt(document.getElementById('translation_words').value, 10) || 0;
      const translationFee = this.calculateTranslationFee(words);
      subtotal += translationFee * 0.5; // Half price for notary translation
    }

    return subtotal;
  }

  calculateTranslationFee(words) {
    let fee = 0;

    if (words <= 100) {
      fee = 245;
    } else if (words <= 1000) {
      fee = 245; // First 100
      const additionalHundreds = Math.ceil((words - 100) / 100);
      fee += additionalHundreds * 193;
    } else {
      fee = 245; // First 100
      fee += 9 * 193; // Next 900 (100-1000)
      const additionalHundreds = Math.ceil((words - 1000) / 100);
      fee += additionalHundreds * 96;
    }

    return fee;
  }

  updateDisplay(subtotal, vat, total) {
    document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} ₪`;
    document.getElementById('vat').textContent = `${vat.toFixed(2)} ₪`;
    document.getElementById('total').textContent = `${total.toFixed(2)} ₪`;
  }

  print() {
    window.print();
  }

  reset() {
    // Confirm reset
    if (!confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים?')) {
      return;
    }

    // Reset all checkboxes
    document.querySelectorAll('.service-checkbox, .addon-checkbox').forEach((cb) => {
      cb.checked = false;
    });

    // Reset all quantity inputs to 1
    document.querySelectorAll('.quantity-input').forEach((input) => {
      input.value = 1;
    });

    // Reset client details
    document.getElementById('clientName').value = '';
    this.setDefaultDate();

    // Hide addon details
    document.querySelector('.travel-details').classList.remove('active');
    document.querySelector('.translation-details').classList.remove('active');

    // Recalculate
    this.calculate();

    // Show notification
    if (typeof showToast === 'function') {
      showToast('המחשבון אופס בהצלחה');
    }
  }

  copySummary() {
    const clientName = document.getElementById('clientName').value || 'לקוח';
    const serviceDate = document.getElementById('serviceDate').value;
    const subtotal = document.getElementById('subtotal').textContent;
    const vat = document.getElementById('vat').textContent;
    const total = document.getElementById('total').textContent;

    // Get selected services
    const services = [];
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox:checked');
    serviceCheckboxes.forEach((checkbox) => {
      const label = checkbox.nextElementSibling.textContent;
      const price = checkbox.dataset.basePrice;
      const serviceId = checkbox.id;
      const qtyInputId = serviceId.replace('service_', 'qty_');
      const qtyInput = document.getElementById(qtyInputId);

      if (qtyInput) {
        const quantity = qtyInput.value;
        services.push(`- ${label} (x${quantity}): ${price} ₪`);
      } else {
        services.push(`- ${label}: ${price} ₪`);
      }
    });

    // Get addons
    const addons = [];
    if (document.getElementById('addon_night').checked) {
      addons.push('- תוספת שעות לילה/שבת (+50%)');
    }
    if (document.getElementById('addon_foreign').checked) {
      addons.push('- תוספת שפה לועזית (+102 ₪)');
    }
    if (document.getElementById('addon_travel').checked) {
      const hours = document.getElementById('travel_hours').value;
      const travelCost = document.getElementById('travel_cost').value;
      addons.push(`- נסיעה מחוץ למשרד: ${hours} שעות, הוצאות: ${travelCost} ₪`);
    }
    if (document.getElementById('addon_translation').checked) {
      const words = document.getElementById('translation_words').value;
      addons.push(`- תרגום ע"י נוטריון: ${words} מילים`);
    }

    // Build summary text
    let summaryText = '=== חישוב עלות שירותי נוטריון ===\n\n';
    summaryText += `לקוח: ${clientName}\n`;
    summaryText += `תאריך: ${serviceDate}\n\n`;

    if (services.length > 0) {
      summaryText += 'שירותים:\n';
      summaryText += `${services.join('\n')}\n\n`;
    }

    if (addons.length > 0) {
      summaryText += 'תוספות:\n';
      summaryText += `${addons.join('\n')}\n\n`;
    }

    summaryText += '--- סיכום ---\n';
    summaryText += `סכום לפני מע"מ: ${subtotal}\n`;
    summaryText += `מע"מ (17%): ${vat}\n`;
    summaryText += `סה"כ לתשלום: ${total}\n\n`;
    summaryText += 'מחירים לפי תקנות הנוטריונים (שכר שירותים), תשל"ט-1978';

    // Copy to clipboard
    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        if (typeof showToast === 'function') {
          showToast('הסיכום הועתק ללוח');
        } else {
          alert('הסיכום הועתק ללוח');
        }
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        alert('שגיאה בהעתקה ללוח');
      });
  }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-new
  new NotaryCalculator();
});
