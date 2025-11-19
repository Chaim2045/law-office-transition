/**
 * Notary Calculator Configuration
 * All services, prices, and settings
 */

export const NOTARY_CONFIG = {
  // Tax rates
  VAT_RATE: 0.18,

  // Addons
  ADDONS: {
    NIGHT_SHIFT: {
      id: 'night_shift',
      name: 'שעות לילה/שבת',
      icon: '🌙',
      type: 'percentage',
      value: 0.5, // 50% increase
    },
    FOREIGN_LANGUAGE: {
      id: 'foreign_language',
      name: 'שפה לועזית',
      icon: '🌍',
      type: 'fixed',
      value: 102,
    },
    TRAVEL: {
      id: 'travel',
      name: 'נסיעה',
      icon: '🚗',
      type: 'custom',
      basePrice: 630,
      hourlyRate: 193,
      includesFirstHour: true,
    },
  },

  // Translation pricing tiers
  TRANSLATION_TIERS: [
    { maxWords: 100, pricePerHundred: 245 },
    { maxWords: 1000, pricePerHundred: 193 },
    { maxWords: Infinity, pricePerHundred: 96 },
  ],

  // Services by category
  SERVICES: {
    signature: {
      category: 'אימות חתימה',
      icon: '✍️',
      items: [
        {
          id: 'sig_first',
          name: 'חותם ראשון',
          price: 193,
          description: 'אימות חתימה ראשונה במסמך',
        },
        {
          id: 'sig_additional',
          name: 'חותם נוסף',
          price: 75,
          description: 'אימות חתימה נוספת באותו מסמך',
        },
        {
          id: 'sig_authorized',
          name: 'אישור סמכות חתימה',
          price: 75,
          description: 'אישור על סמכות החתימה',
        },
        {
          id: 'sig_copy',
          name: 'העתק באותו מעמד',
          price: 75,
          description: 'העתק נוסף באותו מעמד',
        },
      ],
    },

    photocopy: {
      category: 'אישור העתק צילומי',
      icon: '📄',
      items: [
        {
          id: 'copy_first',
          name: 'עמוד ראשון',
          price: 75,
          description: 'אישור העתק צילומי - עמוד ראשון',
        },
        {
          id: 'copy_additional',
          name: 'עמוד נוסף',
          price: 13,
          description: 'אישור העתק צילומי - עמוד נוסף',
        },
        {
          id: 'copy_same_time',
          name: 'העתק נוסף - עמוד ראשון',
          price: 26,
          description: 'העתק נוסף באותו מעמד',
        },
      ],
    },

    translation: {
      category: 'אישור תרגום',
      icon: '🌐',
      items: [
        {
          id: 'translation',
          name: 'תרגום',
          price: 0, // Calculated based on word count
          description: 'אישור תרגום לפי מספר מילים',
          isTranslation: true,
        },
      ],
    },

    will: {
      category: 'אישור צוואה',
      icon: '📜',
      items: [
        {
          id: 'will_first',
          name: 'חותם ראשון',
          price: 286,
          description: 'אישור צוואה - חותם ראשון',
        },
        {
          id: 'will_additional',
          name: 'חותם נוסף',
          price: 143,
          description: 'אישור צוואה - חותם נוסף',
        },
      ],
    },

    affidavit: {
      category: 'תצהיר',
      icon: '📋',
      items: [
        {
          id: 'aff_first',
          name: 'מצהיר ראשון',
          price: 195,
          description: 'תצהיר - מצהיר ראשון',
        },
        {
          id: 'aff_additional',
          name: 'מצהיר נוסף',
          price: 78,
          description: 'תצהיר - מצהיר נוסף',
        },
      ],
    },

    other: {
      category: 'שירותים נוספים',
      icon: '⚖️',
      items: [
        {
          id: 'alive',
          name: 'אישור שפלוני בחיים',
          price: 193,
          description: 'אישור על כך שאדם מסוים בחיים',
        },
        {
          id: 'protest_low',
          name: 'העדה - עד 80,700 ₪',
          price: 1244,
          description: 'העדה על שטר עד 80,700 ₪',
        },
        {
          id: 'protest_high',
          name: 'העדה - מעל 80,700 ₪',
          price: 2667,
          description: 'העדה על שטר מעל 80,700 ₪',
        },
        {
          id: 'prenup',
          name: 'אימות הסכם ממון',
          price: 435,
          description: 'אימות הסכם ממון',
        },
        {
          id: 'other_service',
          name: 'פעולה אחרת',
          price: 315,
          description: 'פעולה נוטריונית אחרת',
        },
      ],
    },
  },

  // UI Settings
  UI: {
    DEFAULT_DATE: () => new Date().toISOString().split('T')[0],
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    MODAL_BLUR: 4,
  },

  // Element IDs
  ELEMENTS: {
    CLIENT_NAME: 'nc-clientName',
    SERVICE_DATE: 'nc-serviceDate',
    BTN_ADD: 'nc-btnAdd',
    SERVICES_AREA: 'nc-services',
    ADDONS_SECTION: 'nc-addons',
    ADDON_NIGHT: 'nc-addonNight',
    ADDON_FOREIGN: 'nc-addonForeign',
    ADDON_TRAVEL: 'nc-addonTravel',
    TRAVEL_DETAILS: 'nc-travelDetails',
    TRAVEL_HOURS: 'nc-travelHours',
    TRAVEL_COST: 'nc-travelCost',
    SUBTOTAL: 'nc-subtotal',
    VAT: 'nc-vat',
    TOTAL: 'nc-total',
    BTN_COPY: 'nc-btnCopy',
    BTN_PRINT: 'nc-btnPrint',
    BTN_RESET: 'nc-btnReset',
    MODAL: 'nc-modal',
    MODAL_CLOSE: 'nc-modalClose',
    SEARCH: 'nc-search',
    SERVICE_LIST: 'nc-list',
  },
};

/**
 * Get all services as a flat array
 * @returns {Array} All services
 */
export function getAllServices() {
  const services = [];
  Object.values(NOTARY_CONFIG.SERVICES).forEach((category) => {
    category.items.forEach((item) => {
      services.push({
        ...item,
        category: category.category,
        icon: category.icon,
      });
    });
  });
  return services;
}

/**
 * Get service by ID
 * @param {string} id - Service ID
 * @returns {Object|null} Service or null if not found
 */
export function getServiceById(id) {
  const services = getAllServices();
  return services.find((s) => s.id === id) || null;
}

/**
 * Search services by term
 * @param {string} term - Search term
 * @returns {Array} Matching services
 */
export function searchServices(term) {
  if (!term) { return getAllServices(); }
  const lowerTerm = term.toLowerCase();
  return getAllServices().filter((service) => service.name.toLowerCase().includes(lowerTerm)
    || service.category.toLowerCase().includes(lowerTerm));
}
