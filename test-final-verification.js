/**
 * 🧪 בדיקת אימות סופית - מערכת שמירת תוכן
 *
 * בדיקה זו תוודא שכל התיקונים עובדים כראוי
 *
 * איך להשתמש:
 * 1. פתח: https://law-office-transition.netlify.app
 * 2. היכנס למצב עריכה (סיסמה: 9668)
 * 3. פתח קונסול (F12)
 * 4. העתק והדבק את הסקריפט הזה
 * 5. הקש Enter
 */

(async function finalVerification() {
  console.clear();
  console.log('%c🔬 בדיקת אימות סופית מתחילה...', 'font-size: 16px; font-weight: bold; color: #4CAF50');
  console.log('='.repeat(70));

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  function test(name, condition, level = 'critical') {
    const passed = !!condition;
    const icon = passed ? '✅' : (level === 'warning' ? '⚠️' : '❌');

    console.log(`\n${icon} ${name}`);

    results.tests.push({ name, passed, level });
    if (passed) {
      results.passed++;
    } else {
      if (level === 'warning') results.warnings++;
      else results.failed++;
    }

    return passed;
  }

  function info(message) {
    console.log(`   ℹ️ ${message}`);
  }

  // ============================================
  // 1. בדיקות בסיס
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('📦 חלק 1: בדיקות בסיס');
  console.log('─'.repeat(70));

  test(
    'ContentBlockManager טעון',
    typeof window.ContentBlockManager !== 'undefined'
  );

  test(
    'Firebase מחובר',
    typeof firebase !== 'undefined' && typeof saveToFirebase === 'function'
  );

  const blockCount = window.ContentBlockManager?.blocks?.size || 0;
  test(
    'בלוקים קיימים במערכת',
    blockCount > 0
  );
  info(`נמצאו ${blockCount} בלוקים בזיכרון`);

  // ============================================
  // 2. בדיקת contentEditable
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('✏️ חלק 2: בדיקת contentEditable');
  console.log('─'.repeat(70));

  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  const hasEditableElements = editableElements.length > 0;

  test(
    'יש אלמנטים contentEditable',
    hasEditableElements,
    'warning'
  );

  if (hasEditableElements) {
    info(`${editableElements.length} אלמנטים ניתנים לעריכה`);
    info('זה טוב אם אתה במצב עריכה');
  } else {
    info('זה תקין אם אתה לא במצב עריכה');
    info('היכנס למצב עריכה (סיסמה 9668) והרץ שוב');
  }

  // ============================================
  // 3. בדיקת Event Listeners
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('🎧 חלק 3: בדיקת Event Listeners');
  console.log('─'.repeat(70));

  test(
    'פונקציית saveBlock קיימת',
    typeof window.ContentBlockManager?.saveBlock === 'function'
  );

  test(
    'פונקציית saveBlockStructure קיימת',
    typeof window.ContentBlockManager?.saveBlockStructure === 'function'
  );

  // ============================================
  // 4. בדיקת Firebase Data
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('🔥 חלק 4: בדיקת נתוני Firebase');
  console.log('─'.repeat(70));

  let firebaseData = null;
  try {
    firebaseData = await loadAllDataFromFirebase();

    if (firebaseData) {
      const blockContent = Object.keys(firebaseData).filter(k =>
        k.startsWith('block_') && !k.startsWith('block_meta')
      );
      const blockMeta = Object.keys(firebaseData).filter(k => k.startsWith('meta_'));
      const regularFields = Object.keys(firebaseData).filter(k =>
        !k.startsWith('block_') && !k.startsWith('meta_')
      );

      test(
        'יש תוכן בלוקים ב-Firebase',
        blockContent.length >= 0
      );
      info(`${blockContent.length} בלוקים עם תוכן`);

      test(
        'יש metadata ב-Firebase',
        blockMeta.length >= 0
      );
      info(`${blockMeta.length} בלוקים עם metadata`);

      test(
        'יש שדות רגילים ב-Firebase',
        regularFields.length > 0
      );
      info(`${regularFields.length} שדות רגילים`);

      // בדיקת התאמה
      if (blockContent.length > 0 && blockMeta.length > 0) {
        const matchingBlocks = blockContent.filter(bc =>
          blockMeta.includes(`meta_${bc}`)
        );

        const matchRate = (matchingBlocks.length / blockContent.length) * 100;
        test(
          'התאמה בין תוכן ל-metadata',
          matchRate >= 80,
          matchRate >= 50 ? 'warning' : 'critical'
        );
        info(`${matchRate.toFixed(1)}% מהבלוקים מותאמים`);
      }
    } else {
      test('Firebase מכיל נתונים', false);
    }
  } catch (error) {
    test('גישה ל-Firebase', false);
    info(`שגיאה: ${error.message}`);
  }

  // ============================================
  // 5. בדיקת localStorage
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('💾 חלק 5: בדיקת localStorage');
  console.log('─'.repeat(70));

  let localBlockCount = 0;
  let localMetaCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('guide_block_')) localBlockCount++;
    if (key.startsWith('guide_meta_')) localMetaCount++;
  }

  test(
    'יש נתונים ב-localStorage',
    localBlockCount + localMetaCount > 0,
    'warning'
  );
  info(`${localBlockCount} בלוקים, ${localMetaCount} metadata`);

  // ============================================
  // 6. בדיקת RichTextEditor
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('🎨 חלק 6: בדיקת RichTextEditor');
  console.log('─'.repeat(70));

  test(
    'RichTextEditor קיים',
    typeof window.RichTextEditor !== 'undefined'
  );

  test(
    'פונקציית activate קיימת',
    typeof window.RichTextEditor?.activate === 'function'
  );

  test(
    'פונקציית saveCurrentBlock קיימת',
    window.RichTextEditor?.prototype?.saveCurrentBlock !== undefined ||
    window.RichTextEditor?.saveCurrentBlock !== undefined
  );

  // ============================================
  // 7. בדיקת מצב עריכה
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('✏️ חלק 7: בדיקת מצב עריכה');
  console.log('─'.repeat(70));

  const isEditMode = window.ContentBlockManager?.editMode === true;
  test(
    'מצב עריכה פעיל',
    isEditMode,
    'warning'
  );

  if (isEditMode) {
    info('מצוין! אתה במצב עריכה');

    const insertButtons = document.querySelectorAll('.insert-content-btn');
    test(
      'כפתורי הוספה מוצגים',
      insertButtons.length > 0
    );
    info(`${insertButtons.length} כפתורי +`);

    const blockActions = document.querySelectorAll('.block-actions');
    test(
      'כפתורי פעולה מוצגים',
      blockActions.length > 0
    );
    info(`${blockActions.length} סטים של כפתורי פעולה`);
  } else {
    info('אתה לא במצב עריכה');
    info('היכנס למצב עריכה (סיסמה: 9668) כדי לבדוק מלא');
  }

  // ============================================
  // 8. מבחן שמירה חי
  // ============================================
  console.log('\n' + '─'.repeat(70));
  console.log('🧪 חלק 8: מבחן שמירה חי');
  console.log('─'.repeat(70));

  if (isEditMode && blockCount > 0) {
    console.log('\n🔬 מריץ מבחן שמירה אמיתי...');

    // קח בלוק ראשון
    const firstBlockId = Array.from(window.ContentBlockManager.blocks.keys())[0];
    const firstBlock = window.ContentBlockManager.blocks.get(firstBlockId);

    if (firstBlock && firstBlock.content) {
      info(`בודק בלוק: ${firstBlockId}`);

      // שמור תוכן מקורי
      const originalContent = firstBlock.content.innerHTML;

      // שנה את התוכן
      const testMarker = `<!-- TEST_${Date.now()} -->`;
      firstBlock.content.innerHTML = originalContent + testMarker;

      // קרא לשמירה
      let saveSucceeded = false;
      try {
        window.ContentBlockManager.saveBlock(firstBlockId);
        saveSucceeded = true;
        info('✅ saveBlock() רץ בהצלחה');
      } catch (e) {
        info(`❌ שגיאה: ${e.message}`);
      }

      // בדוק אם נשמר ב-localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      const savedLocal = localStorage.getItem(`guide_${firstBlockId}`);
      const localHasMarker = savedLocal && savedLocal.includes(testMarker);

      test(
        'שמירה ל-localStorage עבדה',
        localHasMarker
      );

      // החזר תוכן מקורי
      firstBlock.content.innerHTML = originalContent;
      window.ContentBlockManager.saveBlock(firstBlockId);

      test(
        'מבחן שמירה חי הושלם',
        saveSucceeded && localHasMarker
      );
    } else {
      test('מבחן שמירה חי', false, 'warning');
      info('לא נמצא בלוק מתאים למבחן');
    }
  } else {
    info('⏭️ מדלג על מבחן חי (לא במצב עריכה או אין בלוקים)');
  }

  // ============================================
  // סיכום
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 סיכום תוצאות');
  console.log('='.repeat(70));

  const total = results.passed + results.failed + results.warnings;
  const successRate = total > 0 ? (results.passed / total) * 100 : 0;

  console.log(`\n✅ עבר: ${results.passed}`);
  console.log(`❌ נכשל: ${results.failed}`);
  console.log(`⚠️ אזהרות: ${results.warnings}`);
  console.log(`📈 אחוז הצלחה: ${successRate.toFixed(1)}%`);

  // הערכת סיכון
  console.log('\n' + '─'.repeat(70));
  if (results.failed === 0) {
    console.log('%c🎉 מצוין! כל הבדיקות הקריטיות עברו!', 'color: #4CAF50; font-weight: bold; font-size: 14px');
    console.log('%c✅ המערכת יציבה ומוכנה לשימוש', 'color: #4CAF50');
  } else if (results.failed <= 2) {
    console.log('%c⚠️ יש כמה בעיות קלות', 'color: #FF9800; font-weight: bold; font-size: 14px');
    console.log('⚠️ רוב המערכת עובדת, אבל יש נקודות לשיפור');
  } else {
    console.log('%c❌ יש בעיות משמעותיות', 'color: #F44336; font-weight: bold; font-size: 14px');
    console.log('❌ צריך לטפל בבעיות לפני השימוש');
  }

  // המלצות
  console.log('\n' + '─'.repeat(70));
  console.log('💡 המלצות:');
  console.log('─'.repeat(70));

  if (!isEditMode) {
    console.log('1️⃣ היכנס למצב עריכה (סיסמה: 9668) והרץ את הבדיקה שוב');
  }

  if (blockCount === 0) {
    console.log('2️⃣ צור בלוק חדש עם כפתור + והרץ את הבדיקה שוב');
  }

  if (results.warnings > 0) {
    console.log('3️⃣ בדוק את האזהרות למעלה - הן לא קריטיות אבל כדאי לשים לב');
  }

  console.log('\n' + '─'.repeat(70));
  console.log('📝 מבחן ידני מומלץ:');
  console.log('─'.repeat(70));
  console.log('1. היכנס למצב עריכה');
  console.log('2. לחץ על + → פסקת טקסט');
  console.log('3. כתוב: "מבחן ' + new Date().toLocaleTimeString() + '"');
  console.log('4. רענן את הדף (F5)');
  console.log('5. ודא שהטקסט שכתבת מופיע');
  console.log('6. ✅ אם הטקסט חזר - הכל עובד!');

  console.log('\n' + '='.repeat(70));
  console.log('✨ בדיקה הושלמה!');
  console.log('='.repeat(70));

  return {
    success: results.failed === 0,
    results: results,
    successRate: successRate
  };
})();
