/**
 * Notary Calculator Diagnostics
 * הדבק בקונסול הדפדפן בעמוד מחשבון הנוטריון
 */

(function runDiagnostics() {
  console.log('%c🔍 מתחיל אבחון מחשבון נוטריון', 'font-size: 16px; font-weight: bold; color: #0066ff;');
  console.log('═'.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: [],
  };

  function test(name, condition, details = '', type = 'test') {
    const passed = Boolean(condition);
    results.tests.push({ name, passed, details, type });

    if (type === 'warning') {
      console.log(`⚠️ ${name}`, details || '');
      results.warnings++;
    } else if (passed) {
      console.log(`✅ ${name}`, details || '');
      results.passed++;
    } else {
      console.error(`❌ ${name}`, details || '');
      results.failed++;
    }

    return passed;
  }

  // ============================================================================
  // SECTION 1: Script Loading
  // ============================================================================
  console.log('\n📦 בדיקה 1: טעינת סקריפטים\n');

  const ncScript = document.querySelector('script[src*="notary-calculator.js"]');
  test('סקריפט notary-calculator.js נמצא ב-DOM', ncScript !== null, ncScript ? ncScript.src : 'לא נמצא');

  test('window.NotaryCalculator קיים', typeof window.NotaryCalculator !== 'undefined');

  // ============================================================================
  // SECTION 2: DOM Elements
  // ============================================================================
  console.log('\n🎨 בדיקה 2: אלמנטי DOM\n');

  const elements = {
    'nc-btnAdd': 'כפתור הוסף שירות',
    'nc-clientName': 'שדה שם לקוח',
    'nc-serviceDate': 'שדה תאריך',
    'nc-services': 'אזור שירותים',
    'nc-modal': 'חלון modal',
    'nc-modalClose': 'כפתור סגירת modal',
    'nc-search': 'שדה חיפוש',
    'nc-list': 'רשימת שירותים',
    'nc-subtotal': 'סכום ביניים',
    'nc-vat': 'מע"מ',
    'nc-total': 'סה"כ',
    'nc-btnCopy': 'כפתור העתקה',
    'nc-btnPrint': 'כפתור הדפסה',
    'nc-btnReset': 'כפתור איפוס',
  };

  const foundElements = {};
  Object.entries(elements).forEach(([id, label]) => {
    const el = document.getElementById(id);
    foundElements[id] = el;
    test(`Element #${id} (${label})`, el !== null, el ? 'נמצא' : 'לא נמצא');
  });

  // ============================================================================
  // SECTION 3: Event Listeners
  // ============================================================================
  console.log('\n🎧 בדיקה 3: Event Listeners\n');

  function hasEventListener(element, eventType) {
    if (!element) return false;
    // Try to detect listeners (this is tricky in browsers)
    const listeners = getEventListeners ? getEventListeners(element) : null;
    if (listeners && listeners[eventType]) {
      return listeners[eventType].length > 0;
    }
    // Fallback: check if onclick exists
    return element.onclick !== null || element[`on${eventType}`] !== null;
  }

  // Check if getEventListeners is available (Chrome DevTools)
  const hasGetEventListeners = typeof getEventListeners !== 'undefined';
  if (!hasGetEventListeners) {
    test('getEventListeners זמין', false, 'זמין רק ב-Chrome DevTools. נשתמש בבדיקה חלופית', 'warning');
  }

  // Check button clicks
  const btnAdd = foundElements['nc-btnAdd'];
  if (btnAdd) {
    const hasListener = hasGetEventListeners
      ? hasEventListener(btnAdd, 'click')
      : btnAdd.onclick !== null;
    test('כפתור "הוסף שירות" יש לו click listener', hasListener);

    if (!hasListener && hasGetEventListeners) {
      const listeners = getEventListeners(btnAdd);
      console.log('Event listeners על הכפתור:', listeners);
    }
  }

  // ============================================================================
  // SECTION 4: Manual Click Test
  // ============================================================================
  console.log('\n🖱️ בדיקה 4: בדיקת לחיצה ידנית\n');

  if (btnAdd) {
    console.log('מנסה לחיצה ידנית על כפתור "הוסף שירות"...');
    try {
      btnAdd.click();
      setTimeout(() => {
        const modal = foundElements['nc-modal'];
        const isModalOpen = modal && modal.classList.contains('nc-show');
        test('Modal נפתח אחרי לחיצה', isModalOpen);

        if (!isModalOpen && modal) {
          console.log('Modal classes:', modal.className);
        }

        // Close modal if opened
        if (isModalOpen) {
          const closeBtn = foundElements['nc-modalClose'];
          if (closeBtn) closeBtn.click();
        }
      }, 200);
    } catch (error) {
      test('לחיצה על הכפתור', false, error.message);
    }
  }

  // ============================================================================
  // SECTION 5: Console Errors
  // ============================================================================
  console.log('\n🐛 בדיקה 5: שגיאות JavaScript\n');

  // This will be manually checked by user
  console.log('בדוק אם יש שגיאות אדומות למעלה בקונסול');
  console.log('אם יש - העתק אותן והדבק בתשובה');

  // ============================================================================
  // SECTION 6: Tab Loaded Event
  // ============================================================================
  console.log('\n📡 בדיקה 6: אירוע tabLoaded\n');

  // Check if we can test this
  console.log('האם ה-tab נטען? בדוק ב-Network tab אם notary-calculator.html נטען');

  // Try to trigger tabLoaded event manually
  console.log('\nמנסה לטעון את הטאב מחדש...');
  const testEvent = new CustomEvent('tabLoaded', {
    detail: { tabId: 'notary-calculator' },
  });
  document.dispatchEvent(testEvent);

  setTimeout(() => {
    test('NotaryCalculator התאתחל אחרי tabLoaded',
      typeof window.NotaryCalculator !== 'undefined',
      'בדוק אם יש הודעה "✅ NotaryCalculator initialized successfully" בקונסול'
    );
  }, 300);

  // ============================================================================
  // SECTION 7: CSS Loaded
  // ============================================================================
  console.log('\n🎨 בדיקה 7: עיצוב CSS\n');

  const calcDiv = document.querySelector('.nc-calc');
  if (calcDiv) {
    const styles = window.getComputedStyle(calcDiv);
    const hasMaxWidth = styles.maxWidth && styles.maxWidth !== 'none';
    test('CSS נטען (בדיקת max-width)', hasMaxWidth, `max-width: ${styles.maxWidth}`);

    const hasPadding = styles.padding && styles.padding !== '0px';
    test('CSS נטען (בדיקת padding)', hasPadding, `padding: ${styles.padding}`);
  } else {
    test('.nc-calc קיים', false, 'Element לא נמצא');
  }

  // ============================================================================
  // SECTION 8: Network Check
  // ============================================================================
  console.log('\n🌐 בדיקה 8: בדיקת רשת\n');

  console.log('בדוק ב-Network tab (F12 → Network):');
  console.log('1. האם notary-calculator.html נטען? (סטטוס 200)');
  console.log('2. האם notary-calculator.js נטען? (סטטוס 200)');
  console.log('3. האם notary-calculator.css נטען? (סטטוס 200)');
  console.log('4. האם יש קבצים עם סטטוס 404?');

  // ============================================================================
  // SECTION 9: Try to Access Calculator Instance
  // ============================================================================
  console.log('\n🔧 בדיקה 9: גישה ל-Instance\n');

  // Try to access the calculator
  console.log('מנסה לגשת ל-calculator instance...');

  // The instance should be in closure, but we can try
  test('NotaryCalculator class זמין', typeof window.NotaryCalculator === 'function');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  setTimeout(() => {
    console.log('\n' + '═'.repeat(60));
    console.log('%c📊 סיכום אבחון', 'font-size: 16px; font-weight: bold; color: #0066ff;');
    console.log('═'.repeat(60));
    console.log(`✅ עברו: ${results.passed}`);
    console.log(`❌ נכשלו: ${results.failed}`);
    console.log(`⚠️  אזהרות: ${results.warnings}`);
    console.log(`📈 אחוז הצלחה: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    console.log('═'.repeat(60));

    if (results.failed > 0) {
      console.log('\n%c⚠️ נמצאו בעיות!', 'font-size: 14px; color: #ef4444; font-weight: bold;');
      console.log('\n📋 בדיקות שנכשלו:');
      results.tests
        .filter(t => !t.passed && t.type !== 'warning')
        .forEach(t => {
          console.log(`  ❌ ${t.name}: ${t.details}`);
        });

      console.log('\n💡 הצעות לתיקון:');
      console.log('1. רענן את הדף (Ctrl+Shift+R)');
      console.log('2. נקה Cache (Ctrl+Shift+Delete)');
      console.log('3. בדוק ב-Network tab אם כל הקבצים נטענו');
      console.log('4. העתק את כל הפלט של הסקריפט הזה ושלח למפתח');
    } else {
      console.log('\n%c🎉 כל הבדיקות עברו!', 'font-size: 14px; color: #10b981; font-weight: bold;');
      console.log('אם הכפתורים עדיין לא עובדים, יש בעיה אחרת.');
    }

    console.log('\n🔍 מידע נוסף לדיבאג:');
    console.log('Current URL:', window.location.href);
    console.log('Tab ID:', document.querySelector('[data-tab="notary-calculator"]') ? 'נמצא' : 'לא נמצא');
    console.log('Active Tab:', document.querySelector('.tab-content.active')?.id || 'לא ידוע');

    console.log('\n📦 Scripts in page:');
    document.querySelectorAll('script[src]').forEach(script => {
      if (script.src.includes('notary')) {
        console.log('  -', script.src);
      }
    });

    console.log('\n');
    return results;
  }, 500);
})();
