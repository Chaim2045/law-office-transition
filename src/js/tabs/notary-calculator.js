/**
 * Notary Calculator - Main Entry Point
 * Professional modular architecture
 */

import { NOTARY_CONFIG } from './notary-calculator/config';
import CalculatorEngine from './notary-calculator/calculator';
import { UIManager } from './notary-calculator/ui';

/**
 * NotaryCalculator - Main application class
 */
class NotaryCalculator {
  constructor() {
    this.calculator = new CalculatorEngine();
    this.ui = new UIManager(this.calculator);
    this.isInitialized = false;
  }

  /**
   * Initialize the calculator
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('NotaryCalculator already initialized');
        return;
      }

      // Bind all event handlers
      this.bindEventHandlers();

      // Initialize UI
      this.ui.init();

      this.isInitialized = true;
      console.log('✅ NotaryCalculator initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing NotaryCalculator:', error);
      this.ui?.toast?.error('שגיאה באתחול המחשבון');
    }
  }

  /**
   * Bind all event handlers
   */
  bindEventHandlers() {
    try {
      // Add service button
      this.ui.elements.BTN_ADD?.addEventListener('click', () => {
        this.ui.openModal();
      });

      // Modal close button
      this.ui.elements.MODAL_CLOSE?.addEventListener('click', () => {
        this.ui.closeModal();
      });

      // Modal overlay click
      document.querySelector('.modal-overlay')?.addEventListener('click', () => {
        this.ui.closeModal();
      });

      // Search input
      this.ui.elements.SEARCH?.addEventListener('input', (e) => {
        this.ui.renderServicesList(e.target.value);
      });

      // Addon: Night shift
      this.ui.elements.ADDON_NIGHT?.addEventListener('change', (e) => {
        this.calculator.toggleNightShift(e.target.checked);
        this.ui.updateSummary();
      });

      // Addon: Foreign language
      this.ui.elements.ADDON_FOREIGN?.addEventListener('change', (e) => {
        this.calculator.toggleForeignLanguage(e.target.checked);
        this.ui.updateSummary();
      });

      // Addon: Travel
      this.ui.elements.ADDON_TRAVEL?.addEventListener('change', (e) => {
        this.calculator.toggleTravel(e.target.checked);
        this.ui.elements.TRAVEL_DETAILS?.classList.toggle('show', e.target.checked);
        this.ui.updateSummary();
      });

      // Travel hours
      this.ui.elements.TRAVEL_HOURS?.addEventListener('input', (e) => {
        if (this.calculator.updateTravelHours(parseFloat(e.target.value))) {
          this.ui.updateSummary();
        }
      });

      // Travel cost
      this.ui.elements.TRAVEL_COST?.addEventListener('input', (e) => {
        if (this.calculator.updateTravelCost(parseFloat(e.target.value))) {
          this.ui.updateSummary();
        }
      });

      // Copy button
      this.ui.elements.BTN_COPY?.addEventListener('click', () => {
        this.ui.copyToClipboard();
      });

      // Print button
      this.ui.elements.BTN_PRINT?.addEventListener('click', () => {
        this.ui.print();
      });

      // Reset button
      this.ui.elements.BTN_RESET?.addEventListener('click', () => {
        this.ui.reset();
      });

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to open service modal
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.ui.openModal();
        }

        // ESC to close modal
        if (e.key === 'Escape') {
          this.ui.closeModal();
        }

        // Ctrl/Cmd + P to print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          this.ui.print();
        }
      });
    } catch (error) {
      console.error('Error binding event handlers:', error);
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    try {
      // Remove all event listeners
      // (In production, we'd store references and remove them properly)
      this.isInitialized = false;
      console.log('NotaryCalculator destroyed');
    } catch (error) {
      console.error('Error destroying NotaryCalculator:', error);
    }
  }
}

// Global instance
let calculatorInstance = null;

/**
 * Initialize calculator when tab is loaded
 */
document.addEventListener('tabLoaded', (e) => {
  if (e.detail.tabId === 'notary-calculator') {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Check if required elements exist
        if (!document.getElementById(NOTARY_CONFIG.ELEMENTS.BTN_ADD)) {
          console.error('❌ Required elements not found!');
          return;
        }

        // Destroy previous instance if exists
        if (calculatorInstance) {
          calculatorInstance.destroy();
        }

        // Create and initialize new instance
        calculatorInstance = new NotaryCalculator();
        calculatorInstance.init();
      } catch (error) {
        console.error('❌ Fatal error initializing NotaryCalculator:', error);
      }
    }, 100);
  }
});

// Export for debugging/testing
if (typeof window !== 'undefined') {
  window.NotaryCalculator = NotaryCalculator;
}

export default NotaryCalculator;
