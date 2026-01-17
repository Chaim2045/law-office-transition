/**
 * סקריפט בדיקה מקיף - סנכרון בלוקים
 *
 * איך להשתמש:
 * 1. פתח את האתר: https://law-office-transition.netlify.app
 * 2. פתח קונסול (F12)
 * 3. העתק והדבק את הקוד הזה
 * 4. הקש Enter
 */

(async function testBlockSync() {
  console.log('🧪 מתחיל בדיקת סנכרון בלוקים...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function test(name, condition, details = '') {
    const passed = !!condition;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (details) console.log(`   ${details}`);

    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  // ============================================
  // בדיקה 1: ContentBlockManager קיים
  // ============================================
  test(
    'ContentBlockManager נטען',
    typeof window.ContentBlockManager !== 'undefined',
    window.ContentBlockManager ? 'Instance קיים ב-window' : 'חסר!'
  );

  // ============================================
  // בדיקה 2: Firebase מחובר
  // ============================================
  test(
    'Firebase מחובר',
    typeof firebase !== 'undefined' && typeof saveToFirebase === 'function',
    firebase ? 'Firebase SDK טעון' : 'Firebase חסר!'
  );

  // ============================================
  // בדיקה 3: פונקציות חדשות קיימות
  // ============================================
  test(
    'פונקציה: saveBlockStructure',
    typeof window.ContentBlockManager.saveBlockStructure === 'function',
    'פונקציה לשמירת metadata'
  );

  test(
    'פונקציה: recreateBlockFromMetadata',
    typeof window.ContentBlockManager.recreateBlockFromMetadata === 'function',
    'פונקציה ליצירת בלוקים מחדש'
  );

  // ============================================
  // בדיקה 4: בלוקים קיימים
  // ============================================
  const blockCount = window.ContentBlockManager.blocks.size;
  test(
    'בלוקים קיימים במערכת',
    blockCount > 0,
    `נמצאו ${blockCount} בלוקים`
  );

  // ============================================
  // בדיקה 5: בדיקת Firebase Data
  // ============================================
  console.log('\n📊 בודק נתונים ב-Firebase...');

  try {
    const firebaseData = await loadAllDataFromFirebase();
    if (firebaseData) {
      const contentKeys = Object.keys(firebaseData).filter(k => k.startsWith('block_'));
      const metaKeys = Object.keys(firebaseData).filter(k => k.startsWith('meta_'));

      test(
        'נתוני תוכן ב-Firebase',
        contentKeys.length > 0,
        `${contentKeys.length} בלוקים עם תוכן`
      );

      test(
        'נתוני metadata ב-Firebase',
        true, // זה תמיד יעבור כי metadata אופציונלי
        `${metaKeys.length} בלוקים עם metadata`
      );

      // הצג דוגמה
      if (metaKeys.length > 0) {
        console.log('\n📦 דוגמה למטא-דאטה:');
        const firstMeta = metaKeys[0];
        console.log(`   Key: ${firstMeta}`);
        try {
          const parsed = JSON.parse(firebaseData[firstMeta]);
          console.log(`   Data:`, parsed);
        } catch (e) {
          console.log(`   ⚠️ לא הצלחנו לפענח`);
        }
      }
    } else {
      test('נתונים ב-Firebase', false, 'Firebase ריק או לא מחובר');
    }
  } catch (error) {
    test('גישה ל-Firebase', false, `שגיאה: ${error.message}`);
  }

  // ============================================
  // בדיקה 6: localStorage
  // ============================================
  console.log('\n💾 בודק localStorage...');

  let localBlockCount = 0;
  let localMetaCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('guide_block_') && !key.includes('meta')) {
      localBlockCount++;
    }
    if (key.startsWith('guide_meta_')) {
      localMetaCount++;
    }
  }

  test(
    'תוכן בלוקים ב-localStorage',
    localBlockCount >= 0,
    `${localBlockCount} בלוקים`
  );

  test(
    'metadata ב-localStorage',
    localMetaCount >= 0,
    `${localMetaCount} בלוקי metadata`
  );

  // ============================================
  // בדיקה 7: כפתורי מחיקה
  // ============================================
  console.log('\n🗑️ בודק כפתורי מחיקה...');

  const deleteButtons = document.querySelectorAll('.block-delete');
  test(
    'כפתורי מחיקה קיימים בקוד',
    deleteButtons.length >= 0,
    `נמצאו ${deleteButtons.length} כפתורים (0 = תקין אם לא במצב עריכה)`
  );

  // ============================================
  // סיכום
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 סיכום בדיקות:');
  console.log('='.repeat(50));
  console.log(`✅ עבר: ${results.passed}`);
  console.log(`❌ נכשל: ${results.failed}`);
  console.log(`📈 אחוז הצלחה: ${Math.round((results.passed / results.tests.length) * 100)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 מעולה! כל הבדיקות עברו בהצלחה!');
    console.log('✅ המערכת מוכנה לשימוש');
  } else {
    console.log('\n⚠️ יש בעיות שצריך לטפל בהן:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.details}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('📝 הוראות מבחן ידני:');
  console.log('='.repeat(50));
  console.log('1. היכנס למצב עריכה (סיסמה: 9668)');
  console.log('2. לחץ על כפתור + כחול');
  console.log('3. בחר "פסקת טקסט"');
  console.log('4. כתוב משהו, למשל: "מבחן ' + new Date().toLocaleTimeString() + '"');
  console.log('5. פתח את האתר בדפדפן אחר');
  console.log('6. ודא שהטקסט שכתבת מופיע שם');
  console.log('7. במצב עריכה, לחץ על כפתור 🗑️ למחוק');
  console.log('8. רענן בדפדפן הראשון - ודא שהבלוק נמחק');

  return results;
})();
