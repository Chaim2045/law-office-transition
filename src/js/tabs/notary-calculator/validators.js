/**
 * Input Validation Module
 * Handles all form and data validation
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the input is valid
 * @property {string} [error] - Error message if invalid
 */

/**
 * Validate client name
 * @param {string} name - Client name
 * @returns {ValidationResult}
 */
export function validateClientName(name) {
  // Optional field, but if provided should not be empty or just whitespace
  if (name && name.trim().length === 0) {
    return {
      isValid: false,
      error: 'שם הלקוח לא יכול להיות ריק',
    };
  }

  if (name && name.length > 100) {
    return {
      isValid: false,
      error: 'שם הלקוח ארוך מדי (מקסימום 100 תווים)',
    };
  }

  return { isValid: true };
}

/**
 * Validate date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {ValidationResult}
 */
export function validateDate(date) {
  if (!date) {
    return {
      isValid: false,
      error: 'יש לבחור תאריך',
    };
  }

  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      error: 'תאריך לא תקין',
    };
  }

  // Check if date is not too far in the past (more than 10 years)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (dateObj < tenYearsAgo) {
    return {
      isValid: false,
      error: 'התאריך ישן מדי',
    };
  }

  // Check if date is not in the far future (more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (dateObj > oneYearFromNow) {
    return {
      isValid: false,
      error: 'התאריך רחוק מדי בעתיד',
    };
  }

  return { isValid: true };
}

/**
 * Validate quantity
 * @param {number|string} qty - Quantity value
 * @returns {ValidationResult}
 */
export function validateQuantity(qty) {
  const num = Number(qty);

  if (Number.isNaN(num)) {
    return {
      isValid: false,
      error: 'כמות חייבת להיות מספר',
    };
  }

  if (num < 1) {
    return {
      isValid: false,
      error: 'כמות חייבת להיות לפחות 1',
    };
  }

  if (num > 1000) {
    return {
      isValid: false,
      error: 'כמות גבוהה מדי (מקסימום 1000)',
    };
  }

  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: 'כמות חייבת להיות מספר שלם',
    };
  }

  return { isValid: true };
}

/**
 * Validate word count for translation
 * @param {number|string} words - Word count
 * @returns {ValidationResult}
 */
export function validateWordCount(words) {
  const num = Number(words);

  if (Number.isNaN(num)) {
    return {
      isValid: false,
      error: 'מספר מילים חייב להיות מספר',
    };
  }

  if (num < 1) {
    return {
      isValid: false,
      error: 'מספר מילים חייב להיות לפחות 1',
    };
  }

  if (num > 100000) {
    return {
      isValid: false,
      error: 'מספר מילים גבוה מדי (מקסימום 100,000)',
    };
  }

  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: 'מספר מילים חייב להיות מספר שלם',
    };
  }

  return { isValid: true };
}

/**
 * Validate travel hours
 * @param {number|string} hours - Travel hours
 * @returns {ValidationResult}
 */
export function validateTravelHours(hours) {
  const num = Number(hours);

  if (Number.isNaN(num)) {
    return {
      isValid: false,
      error: 'שעות נסיעה חייבות להיות מספר',
    };
  }

  if (num < 0.5) {
    return {
      isValid: false,
      error: 'שעות נסיעה חייבות להיות לפחות 0.5',
    };
  }

  if (num > 24) {
    return {
      isValid: false,
      error: 'שעות נסיעה גבוהות מדי (מקסימום 24)',
    };
  }

  // Must be a multiple of 0.5
  if ((num * 2) % 1 !== 0) {
    return {
      isValid: false,
      error: 'שעות נסיעה חייבות להיות בכפולות של 0.5',
    };
  }

  return { isValid: true };
}

/**
 * Validate travel cost
 * @param {number|string} cost - Travel cost
 * @returns {ValidationResult}
 */
export function validateTravelCost(cost) {
  const num = Number(cost);

  if (Number.isNaN(num)) {
    return {
      isValid: false,
      error: 'הוצאות נסיעה חייבות להיות מספר',
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: 'הוצאות נסיעה לא יכולות להיות שליליות',
    };
  }

  if (num > 10000) {
    return {
      isValid: false,
      error: 'הוצאות נסיעה גבוהות מדי (מקסימום 10,000)',
    };
  }

  return { isValid: true };
}

/**
 * Sanitize number input
 * @param {number|string} value - Input value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} Sanitized number
 */
export function sanitizeNumber(value, min, max, defaultValue = 0) {
  let num = Number(value);

  if (Number.isNaN(num)) {
    return defaultValue;
  }

  if (num < min) {
    return min;
  }

  if (num > max) {
    return max;
  }

  return num;
}

/**
 * Sanitize string input
 * @param {string} value - Input value
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
export function sanitizeString(value, maxLength = 1000) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().substring(0, maxLength);
}

/**
 * Format number to display (with thousands separator)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 0) {
  if (Number.isNaN(num)) {
    return '0';
  }

  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format currency (NIS)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return `${formatNumber(amount, 0)} ₪`;
}
