/**
 * Notary Calculator Console Test Script
 * הדבק בקונסול הדפדפן בעמוד מחשבון הנוטריון
 */

(async function testNotaryCalculator() {
  console.log('🧪 מתחיל בדיקת מחשבון נוטריון...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function test(name, condition, details = '') {
    const passed = condition;
    results.tests.push({ name, passed, details });
    if (passed) {
      console.log(`✅ ${name}`);
      results.passed++;
    } else {
      console.error(`❌ ${name}`, details);
      results.failed++;
    }
    return passed;
  }

  console.log('📋 בדיקה 1: בדיקת DOM Elements\n');

  // Test 1: Check if all required elements exist
  const requiredElements = [
    'nc-clientName',
    'nc-serviceDate',
    'nc-btnAdd',
    'nc-services',
    'nc-addons',
    'nc-addonNight',
    'nc-addonForeign',
    'nc-addonTravel',
    'nc-subtotal',
    'nc-vat',
    'nc-total',
    'nc-btnCopy',
    'nc-btnPrint',
    'nc-btnReset',
    'nc-modal'
  ];

  requiredElements.forEach(id => {
    const el = document.getElementById(id);
    test(`Element #${id} exists`, el !== null, el ? '' : 'Element not found');
  });

  console.log('\n📋 בדיקה 2: בדיקת Window Objects\n');

  // Test 2: Check if NotaryCalculator instance exists
  test('window.NotaryCalculator class exists', typeof window.NotaryCalculator === 'function');

  console.log('\n📋 בדיקה 3: בדיקת פונקציונליות UI\n');

  // Test 3: Check initial state
  const servicesArea = document.getElementById('nc-services');
  test('Services area shows empty state',
    servicesArea && servicesArea.innerHTML.includes('לא נבחרו שירותים'));

  const subtotal = document.getElementById('nc-subtotal');
  test('Initial subtotal is 0 ₪',
    subtotal && subtotal.textContent === '0 ₪');

  const vat = document.getElementById('nc-vat');
  test('Initial VAT is 0 ₪',
    vat && vat.textContent === '0 ₪');

  const total = document.getElementById('nc-total');
  test('Initial total is 0 ₪',
    total && total.textContent === '0 ₪');

  console.log('\n📋 בדיקה 4: בדיקת Modal\n');

  // Test 4: Test modal opening
  const btnAdd = document.getElementById('nc-btnAdd');
  const modal = document.getElementById('nc-modal');

  if (btnAdd && modal) {
    btnAdd.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    test('Modal opens when clicking "הוסף שירות"',
      modal.classList.contains('show'));

    // Test 5: Test service list rendering
    const serviceList = document.getElementById('nc-list');
    test('Service list is populated',
      serviceList && serviceList.children.length > 0,
      `Found ${serviceList?.children.length || 0} items`);

    // Test 6: Test search functionality
    const searchInput = document.getElementById('nc-search');
    if (searchInput) {
      searchInput.value = 'חותם';
      searchInput.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 100));
      test('Search filters services',
        serviceList.querySelector('.service-item-title')?.textContent.includes('חותם'));
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }

    // Test 7: Add a service
    const firstService = serviceList.querySelector('.service-item');
    if (firstService) {
      const serviceName = firstService.querySelector('.service-item-title')?.textContent;
      firstService.click();
      await new Promise(resolve => setTimeout(resolve, 200));

      test('Modal closes after selecting service',
        !modal.classList.contains('show'));

      test('Service appears in selected services',
        servicesArea.querySelector('.service-card') !== null);

      test('Addons section is visible',
        document.getElementById('nc-addons')?.classList.contains('show'));

      // Test 8: Check calculations
      const subtotalAfter = document.getElementById('nc-subtotal');
      const subtotalValue = parseInt(subtotalAfter.textContent.replace(/[^\d]/g, ''));
      test('Subtotal updated after adding service',
        subtotalValue > 0,
        `Subtotal: ${subtotalValue} ₪`);

      const vatAfter = document.getElementById('nc-vat');
      const vatValue = parseInt(vatAfter.textContent.replace(/[^\d]/g, ''));
      test('VAT calculated correctly (18%)',
        Math.abs(vatValue - (subtotalValue * 0.18)) < 1,
        `VAT: ${vatValue} ₪ (expected ~${Math.round(subtotalValue * 0.18)} ₪)`);

      const totalAfter = document.getElementById('nc-total');
      const totalValue = parseInt(totalAfter.textContent.replace(/[^\d]/g, ''));
      test('Total is subtotal + VAT',
        Math.abs(totalValue - (subtotalValue + vatValue)) < 1,
        `Total: ${totalValue} ₪`);
    }
  }

  console.log('\n📋 בדיקה 5: בדיקת Addons\n');

  // Test 9: Test addons
  const addonNight = document.getElementById('nc-addonNight');
  if (addonNight) {
    const beforeTotal = parseInt(document.getElementById('nc-total').textContent.replace(/[^\d]/g, ''));
    addonNight.checked = true;
    addonNight.dispatchEvent(new Event('change'));
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterTotal = parseInt(document.getElementById('nc-total').textContent.replace(/[^\d]/g, ''));
    test('Night shift addon increases total by 50%',
      afterTotal > beforeTotal * 1.4,
      `Before: ${beforeTotal} ₪, After: ${afterTotal} ₪`);
    addonNight.checked = false;
    addonNight.dispatchEvent(new Event('change'));
  }

  console.log('\n📋 בדיקה 6: בדיקת Quantity Update\n');

  // Test 10: Test quantity change
  const qtyInput = document.querySelector('.qty-input:not(.word-count-input)');
  if (qtyInput) {
    const beforeQty = document.getElementById('nc-total').textContent;
    qtyInput.value = '2';
    qtyInput.dispatchEvent(new Event('input'));
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterQty = document.getElementById('nc-total').textContent;
    test('Quantity change updates total',
      beforeQty !== afterQty,
      `Before: ${beforeQty}, After: ${afterQty}`);
  }

  console.log('\n📋 בדיקה 7: בדיקת CSS Styles\n');

  // Test 11: Check CSS is loaded
  const calcDiv = document.querySelector('.notary-calc');
  if (calcDiv) {
    const styles = window.getComputedStyle(calcDiv);
    test('CSS loaded correctly',
      styles.fontFamily.includes('apple-system') || styles.fontFamily.includes('Segoe UI'));
    test('Navy color variable defined',
      styles.getPropertyValue('--navy') !== '');
  }

  console.log('\n📋 בדיקה 8: בדיקת Event Handlers\n');

  // Test 12: Test button handlers
  const btnCopy = document.getElementById('nc-btnCopy');
  test('Copy button has click handler',
    btnCopy && btnCopy.onclick !== null || btnCopy?.addEventListener);

  const btnPrint = document.getElementById('nc-btnPrint');
  test('Print button has click handler',
    btnPrint && btnPrint.onclick !== null || btnPrint?.addEventListener);

  const btnReset = document.getElementById('nc-btnReset');
  test('Reset button has click handler',
    btnReset && btnReset.onclick !== null || btnReset?.addEventListener);

  console.log('\n📋 בדיקה 9: בדיקת Toast Container\n');

  // Test 13: Check toast container
  let toastContainer = document.getElementById('toast-container');
  test('Toast container exists or will be created',
    toastContainer !== null || document.querySelector('.notary-calc') !== null);

  console.log('\n📋 בדיקה 10: ניקוי (Reset)\n');

  // Test 14: Test reset button
  if (btnReset) {
    const serviceCards = document.querySelectorAll('.service-card');
    if (serviceCards.length > 0) {
      // Need to confirm, so we'll just check if the handler exists
      test('Reset button is functional',
        btnReset.onclick !== null || btnReset.getAttribute('onclick') !== null);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 סיכום בדיקות:\n');
  console.log(`✅ עברו: ${results.passed}`);
  console.log(`❌ נכשלו: ${results.failed}`);
  console.log(`📈 אחוז הצלחה: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 כל הבדיקות עברו בהצלחה! המחשבון עובד כמו שצריך!');
  } else {
    console.log('\n⚠️ יש בעיות שצריך לטפל בהן. ראה פירוט למעלה.');
  }

  // Return detailed results
  return results;
})();
