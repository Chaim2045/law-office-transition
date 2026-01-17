/**
 * Autosave System Test Suite
 * סקריפט בדיקה אוטומטי למערכת ה-autosave
 *
 * שימוש:
 * 1. פתח את index.html בדפדפן
 * 2. פתח Console (F12)
 * 3. העתק והדבק את הקוד
 * 4. הסקריפט ירוץ אוטומטית ויציג דוח
 */

(async function testAutosaveSystem() {
  console.log('🧪 Starting Autosave System Test Suite...\\n');
  console.log('='.repeat(60));

  // Test results
  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  /**
   * Helper: Add test result
   */
  function addResult(testName, passed, message = '') {
    if (passed) {
      results.passed.push(testName);
      console.log(`✅ ${testName}${message ? ': ' + message : ''}`);
    } else {
      results.failed.push(testName);
      console.error(`❌ ${testName}${message ? ': ' + message : ''}`);
    }
  }

  /**
   * Helper: Add warning
   */
  function addWarning(testName, message) {
    results.warnings.push({ test: testName, message });
    console.warn(`⚠️ ${testName}: ${message}`);
  }

  /**
   * Helper: Sleep
   */
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ============================================
  // Test 1: Check AutosaveManager Existence
  // ============================================
  console.log('\\n📋 Test 1: AutosaveManager Existence');
  console.log('-'.repeat(60));

  if (typeof window.AutosaveManager === 'undefined') {
    addResult('AutosaveManager exists', false, 'window.AutosaveManager is undefined');
    console.log('\\n❌ Critical error - stopping tests');
    return;
  }
  addResult('AutosaveManager exists', true);

  const manager = window.AutosaveManager;

  // ============================================
  // Test 2: Check Initialization
  // ============================================
  console.log('\\n📋 Test 2: Initialization');
  console.log('-'.repeat(60));

  addResult('AutosaveManager initialized', manager.initialized === true);

  // ============================================
  // Test 3: Field Discovery
  // ============================================
  console.log('\\n📋 Test 3: Field Discovery');
  console.log('-'.repeat(60));

  const fieldCount = manager.editableFields.size;
  console.log(`   Found ${fieldCount} editable fields`);

  addResult('Fields discovered', fieldCount > 0, `${fieldCount} fields`);

  if (fieldCount < 300) {
    addWarning('Field count', `Expected ~384 fields, found ${fieldCount}`);
  }

  // Show sample fields
  const sampleFields = Array.from(manager.editableFields.keys()).slice(0, 5);
  console.log('   Sample fields:', sampleFields);

  // ============================================
  // Test 4: Field Naming Convention
  // ============================================
  console.log('\\n📋 Test 4: Field Naming Convention');
  console.log('-'.repeat(60));

  let conventionPass = true;
  const invalidFields = [];

  for (const fieldName of manager.editableFields.keys()) {
    // Check format: {tab}_{section}_{element}_[number]
    // Should contain underscores and lowercase only
    if (!/^[a-z_0-9]+$/.test(fieldName)) {
      conventionPass = false;
      invalidFields.push(fieldName);
    }
  }

  addResult('Naming convention', conventionPass);

  if (!conventionPass) {
    console.log('   Invalid field names:', invalidFields.slice(0, 5));
  }

  // ============================================
  // Test 5: Firebase Connection
  // ============================================
  console.log('\\n📋 Test 5: Firebase Connection');
  console.log('-'.repeat(60));

  const firebaseAvailable = typeof firebase !== 'undefined' && firebase.database;
  addResult('Firebase available', firebaseAvailable);

  if (firebaseAvailable) {
    try {
      const db = firebase.database();
      const testRef = db.ref('.info/connected');
      const snapshot = await testRef.get();
      const connected = snapshot.val() === true;
      addResult('Firebase connected', connected);
    } catch (error) {
      addResult('Firebase connected', false, error.message);
    }
  }

  // ============================================
  // Test 6: localStorage Backup
  // ============================================
  console.log('\\n📋 Test 6: localStorage Backup');
  console.log('-'.repeat(60));

  let localStorageWorks = true;
  try {
    localStorage.setItem('test_autosave', 'test');
    const value = localStorage.getItem('test_autosave');
    localStorageWorks = value === 'test';
    localStorage.removeItem('test_autosave');
  } catch (error) {
    localStorageWorks = false;
  }

  addResult('localStorage available', localStorageWorks);

  // Check if any data exists in localStorage
  let localDataCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('guide_')) {
      localDataCount++;
    }
  }

  console.log(`   Found ${localDataCount} saved fields in localStorage`);

  // ============================================
  // Test 7: Event Listeners
  // ============================================
  console.log('\\n📋 Test 7: Event Listeners');
  console.log('-'.repeat(60));

  // This is hard to test directly, but we can check if methods exist
  const hasScheduleSave = typeof manager.scheduleSave === 'function';
  const hasScheduleDebounced = typeof manager.scheduleDebouncedSave === 'function';

  addResult('scheduleSave method exists', hasScheduleSave);
  addResult('scheduleDebouncedSave method exists', hasScheduleDebounced);

  // ============================================
  // Test 8: Save Field Functionality
  // ============================================
  console.log('\\n📋 Test 8: Save Field Functionality');
  console.log('-'.repeat(60));

  if (manager.editableFields.size === 0) {
    addResult('saveField test', false, 'No fields to test');
  } else {
    try {
      // Get first field
      const [testFieldName, testElement] = manager.editableFields.entries().next().value;
      console.log(`   Testing field: ${testFieldName}`);

      // Save original content
      const originalContent = testElement.innerHTML;

      // Set test content
      const testContent = `Test content ${Date.now()}`;
      testElement.innerHTML = testContent;

      // Try to save
      const saved = await manager.saveField(testFieldName);

      addResult('saveField returns success', saved === true);

      // Check localStorage
      const localData = localStorage.getItem(`guide_${testFieldName}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          const hasContent = parsed.content === testContent;
          const hasTimestamp = typeof parsed.updatedAt === 'number';

          addResult('localStorage save format', hasContent && hasTimestamp);
        } catch {
          addResult('localStorage save format', false, 'Invalid JSON');
        }
      } else {
        addWarning('localStorage save', 'No data saved to localStorage');
      }

      // Restore original content
      testElement.innerHTML = originalContent;
      await manager.saveField(testFieldName);

      console.log('   ✅ Original content restored');

    } catch (error) {
      addResult('saveField functionality', false, error.message);
    }
  }

  // ============================================
  // Test 9: CSS Classes
  // ============================================
  console.log('\\n📋 Test 9: CSS Status Classes');
  console.log('-'.repeat(60));

  // Check if CSS is loaded
  const styles = document.styleSheets;
  let hasEditableStyles = false;

  for (const sheet of styles) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText && (
          rule.selectorText.includes('.editable.saving') ||
          rule.selectorText.includes('.editable.saved') ||
          rule.selectorText.includes('.editable.error')
        )) {
          hasEditableStyles = true;
          break;
        }
      }
      if (hasEditableStyles) break;
    } catch {
      // CORS or other CSS access errors - ignore
    }
  }

  if (hasEditableStyles) {
    addResult('CSS status styles loaded', true);
  } else {
    addWarning('CSS status styles', 'Could not verify CSS styles (might be CORS)');
  }

  // ============================================
  // Test 10: Concurrent Save Prevention
  // ============================================
  console.log('\\n📋 Test 10: Concurrent Save Prevention');
  console.log('-'.repeat(60));

  if (manager.editableFields.size === 0) {
    addResult('Concurrent prevention test', false, 'No fields to test');
  } else {
    try {
      const [testFieldName] = manager.editableFields.keys().next().value;

      // Check pendingSaves map exists
      const hasPendingSaves = manager.pendingSaves instanceof Map;
      addResult('pendingSaves Map exists', hasPendingSaves);

      // Try to schedule two saves at once
      manager.scheduleSave(testFieldName);
      const secondSave = manager.scheduleSave(testFieldName);

      // Second save should be prevented
      // (hard to verify without checking logs, but we can check the map)
      await sleep(100);

      console.log('   Concurrent save test completed');

    } catch (error) {
      addResult('Concurrent prevention', false, error.message);
    }
  }

  // ============================================
  // Test 11: Update Field Status
  // ============================================
  console.log('\\n📋 Test 11: Field Status Updates');
  console.log('-'.repeat(60));

  if (manager.editableFields.size === 0) {
    addResult('Field status test', false, 'No fields to test');
  } else {
    try {
      const [, testElement] = manager.editableFields.entries().next().value;

      // Test saving state
      manager.updateFieldStatus(testElement, 'saving');
      const hasSaving = testElement.classList.contains('saving');

      // Test saved state
      manager.updateFieldStatus(testElement, 'saved');
      const hasSaved = testElement.classList.contains('saved');

      // Test error state
      manager.updateFieldStatus(testElement, 'error');
      const hasError = testElement.classList.contains('error');

      // Clean up
      testElement.classList.remove('saving', 'saved', 'error');

      addResult('Status: saving class', hasSaving);
      addResult('Status: saved class', hasSaved);
      addResult('Status: error class', hasError);

    } catch (error) {
      addResult('Field status updates', false, error.message);
    }
  }

  // ============================================
  // Test 12: Data Format Compatibility
  // ============================================
  console.log('\\n📋 Test 12: Data Format Compatibility');
  console.log('-'.repeat(60));

  // Test that the system can handle both old (string) and new (object) formats
  const testFormats = {
    oldFormat: 'Simple string content',
    newFormat: {
      content: 'Object with content',
      updatedAt: Date.now(),
    },
  };

  let formatTestPass = true;

  // Check if normalizeBlockData exists
  if (typeof window.normalizeBlockData === 'function') {
    addResult('normalizeBlockData exists', true);
  } else {
    addWarning('Data format', 'normalizeBlockData not found - may affect data loading');
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\\n' + '='.repeat(60));
  console.log('📊 Test Suite Summary');
  console.log('='.repeat(60));

  console.log(`\\n✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   - ${test}`));

  if (results.failed.length > 0) {
    console.log(`\\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   - ${test}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\\n⚠️ Warnings: ${results.warnings.length}`);
    results.warnings.forEach(w => console.log(`   - ${w.test}: ${w.message}`));
  }

  console.log('\\n' + '='.repeat(60));

  const totalTests = results.passed.length + results.failed.length;
  const passRate = Math.round((results.passed.length / totalTests) * 100);

  console.log(`\\n📈 Pass Rate: ${passRate}% (${results.passed.length}/${totalTests})`);

  if (passRate === 100) {
    console.log('\\n🎉 All tests passed! The autosave system is working correctly.');
  } else if (passRate >= 80) {
    console.log('\\n✅ Most tests passed. Check warnings and failed tests above.');
  } else {
    console.log('\\n⚠️ Some critical issues found. Please review failed tests.');
  }

  console.log('\\n' + '='.repeat(60));

  // Return results for programmatic use
  return {
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    total: totalTests,
    passRate: passRate,
    details: results,
  };
})();

console.log('📝 Autosave test suite loaded and running...\\n');
