/**
 * Calculator Business Logic
 * Handles all calculation logic for notary services
 */

import { NOTARY_CONFIG } from './config';
import {
  validateQuantity,
  validateWordCount,
  validateTravelHours,
  validateTravelCost,
  sanitizeNumber,
} from './validators';

/**
 * CalculatorEngine - Manages all calculation logic
 */
export default class CalculatorEngine {
  constructor() {
    this.services = [];
    this.addons = {
      nightShift: false,
      foreignLanguage: false,
      travel: {
        enabled: false,
        hours: 1,
        cost: 0,
      },
    };
  }

  /**
   * Add a service to the calculation
   * @param {Object} service - Service to add
   * @returns {boolean} Success status
   */
  addService(service) {
    try {
      // Check if service already exists (except translation which can have multiple instances)
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

      // Special handling for translation
      if (service.isTranslation) {
        newService.id = `translation_${Date.now()}`;
        newService.words = 100;
        newService.price = this.calculateTranslationPrice(100);
      }

      this.services.push(newService);
      return true;
    } catch (error) {
      console.error('Error adding service:', error);
      return false;
    }
  }

  /**
   * Remove a service from the calculation
   * @param {string} serviceId - ID of service to remove
   * @returns {boolean} Success status
   */
  removeService(serviceId) {
    try {
      const index = this.services.findIndex((s) => s.id === serviceId);
      if (index === -1) {
        return false;
      }

      this.services.splice(index, 1);
      return true;
    } catch (error) {
      console.error('Error removing service:', error);
      return false;
    }
  }

  /**
   * Update service quantity
   * @param {string} serviceId - Service ID
   * @param {number} quantity - New quantity
   * @returns {boolean} Success status
   */
  updateQuantity(serviceId, quantity) {
    try {
      const validation = validateQuantity(quantity);
      if (!validation.isValid) {
        console.warn('Invalid quantity:', validation.error);
        return false;
      }

      const service = this.services.find((s) => s.id === serviceId);
      if (!service) {
        return false;
      }

      service.qty = sanitizeNumber(quantity, 1, 1000, 1);
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }

  /**
   * Update translation word count
   * @param {string} serviceId - Service ID
   * @param {number} words - Word count
   * @returns {boolean} Success status
   */
  updateWordCount(serviceId, words) {
    try {
      const validation = validateWordCount(words);
      if (!validation.isValid) {
        console.warn('Invalid word count:', validation.error);
        return false;
      }

      const service = this.services.find((s) => s.id === serviceId);
      if (!service || !service.isTranslation) {
        return false;
      }

      const sanitizedWords = sanitizeNumber(words, 1, 100000, 100);
      service.words = sanitizedWords;
      service.price = this.calculateTranslationPrice(sanitizedWords);
      return true;
    } catch (error) {
      console.error('Error updating word count:', error);
      return false;
    }
  }

  /**
   * Calculate translation price based on word count
   * @param {number} words - Total word count
   * @returns {number} Calculated price
   */
  calculateTranslationPrice(words) {
    try {
      if (words <= 0) { return 0; }

      let price = 0;
      let remainingWords = words;

      const tiers = NOTARY_CONFIG.TRANSLATION_TIERS;

      // First 100 words: 245 NIS
      if (remainingWords <= tiers[0].maxWords) {
        return tiers[0].pricePerHundred;
      }

      price += tiers[0].pricePerHundred;
      remainingWords -= tiers[0].maxWords;

      // Next 900 words (101-1000): 193 NIS per 100 words
      const secondTierWords = Math.min(remainingWords, tiers[1].maxWords - tiers[0].maxWords);
      if (secondTierWords > 0) {
        const chunks = Math.ceil(secondTierWords / 100);
        price += chunks * tiers[1].pricePerHundred;
        remainingWords -= secondTierWords;
      }

      // Above 1000: 96 NIS per 100 words
      if (remainingWords > 0) {
        const chunks = Math.ceil(remainingWords / 100);
        price += chunks * tiers[2].pricePerHundred;
      }

      return price;
    } catch (error) {
      console.error('Error calculating translation price:', error);
      return 0;
    }
  }

  /**
   * Toggle night shift addon
   * @param {boolean} enabled - Enable/disable
   */
  toggleNightShift(enabled) {
    this.addons.nightShift = enabled;
  }

  /**
   * Toggle foreign language addon
   * @param {boolean} enabled - Enable/disable
   */
  toggleForeignLanguage(enabled) {
    this.addons.foreignLanguage = enabled;
  }

  /**
   * Toggle travel addon
   * @param {boolean} enabled - Enable/disable
   */
  toggleTravel(enabled) {
    this.addons.travel.enabled = enabled;
  }

  /**
   * Update travel hours
   * @param {number} hours - Travel hours
   * @returns {boolean} Success status
   */
  updateTravelHours(hours) {
    try {
      const validation = validateTravelHours(hours);
      if (!validation.isValid) {
        console.warn('Invalid travel hours:', validation.error);
        return false;
      }

      this.addons.travel.hours = sanitizeNumber(hours, 0.5, 24, 1);
      return true;
    } catch (error) {
      console.error('Error updating travel hours:', error);
      return false;
    }
  }

  /**
   * Update travel cost
   * @param {number} cost - Travel cost
   * @returns {boolean} Success status
   */
  updateTravelCost(cost) {
    try {
      const validation = validateTravelCost(cost);
      if (!validation.isValid) {
        console.warn('Invalid travel cost:', validation.error);
        return false;
      }

      this.addons.travel.cost = sanitizeNumber(cost, 0, 10000, 0);
      return true;
    } catch (error) {
      console.error('Error updating travel cost:', error);
      return false;
    }
  }

  /**
   * Calculate services subtotal
   * @returns {number} Services subtotal
   */
  calculateServicesTotal() {
    try {
      return this.services.reduce((sum, service) => {
        // Translation services: price already includes all words, don't multiply by qty
        if (service.isTranslation) {
          return sum + service.price;
        }
        // Regular services: multiply price by quantity
        return sum + (service.price * service.qty);
      }, 0);
    } catch (error) {
      console.error('Error calculating services total:', error);
      return 0;
    }
  }

  /**
   * Calculate addons total
   * @param {number} _servicesTotal - Services subtotal (for percentage calculations)
   * @returns {number} Addons total
   */
  calculateAddonsTotal(_servicesTotal) {
    try {
      let addonsTotal = 0;

      // Foreign language: fixed fee
      if (this.addons.foreignLanguage) {
        addonsTotal += NOTARY_CONFIG.ADDONS.FOREIGN_LANGUAGE.value;
      }

      // Travel: base price + hourly rate
      if (this.addons.travel.enabled) {
        const { basePrice, hourlyRate } = NOTARY_CONFIG.ADDONS.TRAVEL;
        addonsTotal += basePrice;

        // Additional hours beyond the first hour
        if (this.addons.travel.hours > 1) {
          const additionalHours = this.addons.travel.hours - 1;
          addonsTotal += additionalHours * 2 * hourlyRate;
        }

        // Add travel expenses
        addonsTotal += this.addons.travel.cost;
      }

      return addonsTotal;
    } catch (error) {
      console.error('Error calculating addons total:', error);
      return 0;
    }
  }

  /**
   * Calculate final totals
   * @returns {Object} Calculation results
   */
  calculate() {
    try {
      // Services subtotal
      let subtotal = this.calculateServicesTotal();

      // Add fixed addons
      subtotal += this.calculateAddonsTotal(subtotal);

      // Apply night shift percentage AFTER fixed addons
      if (this.addons.nightShift) {
        subtotal *= (1 + NOTARY_CONFIG.ADDONS.NIGHT_SHIFT.value);
      }

      // Calculate VAT
      const vat = subtotal * NOTARY_CONFIG.VAT_RATE;

      // Calculate total
      const total = subtotal + vat;

      return {
        subtotal: Math.round(subtotal),
        vat: Math.round(vat),
        total: Math.round(total),
      };
    } catch (error) {
      console.error('Error calculating totals:', error);
      return {
        subtotal: 0,
        vat: 0,
        total: 0,
      };
    }
  }

  /**
   * Reset calculator to initial state
   */
  reset() {
    this.services = [];
    this.addons = {
      nightShift: false,
      foreignLanguage: false,
      travel: {
        enabled: false,
        hours: 1,
        cost: 0,
      },
    };
  }

  /**
   * Get current state
   * @returns {Object} Current calculator state
   */
  getState() {
    return {
      services: [...this.services],
      addons: { ...this.addons },
    };
  }

  /**
   * Generate summary text for copy/export
   * @param {string} clientName - Client name
   * @param {string} date - Service date
   * @returns {string} Summary text
   */
  generateSummary(clientName, date) {
    try {
      const results = this.calculate();
      let summary = '═══ מחשבון נוטריון ═══\n\n';

      // Client info
      summary += `לקוח: ${clientName || 'לקוח'}\n`;
      summary += `תאריך: ${date || new Date().toISOString().split('T')[0]}\n\n`;

      // Services
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

      // Addons
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

      // Summary
      summary += '══ סיכום ══\n';
      summary += `לפני מע"מ: ${results.subtotal} ₪\n`;
      summary += `מע"מ (18%): ${results.vat} ₪\n`;
      summary += `סה"כ לתשלום: ${results.total} ₪`;

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'שגיאה ביצירת סיכום';
    }
  }
}
