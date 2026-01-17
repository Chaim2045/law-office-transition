/**
 * סקריפט בדיקה מתקדם - תיקון בעיית שמירת תוכן
 *
 * איך להשתמש:
 * 1. פתח את האתר: https://law-office-transition.netlify.app
 * 2. פתח קונסול (F12)
 * 3. העתק והדבק את הקוד הזה
 * 4. הקש Enter
 */

(async function testContentSave() {
  console.log('🔍 בודק שמירת תוכן - בדיקה מעמיקה...\n');
  console.log('='.repeat(60));

  // ============================================
  // חלק 1: בדיקת מבנה בסיסי
  // ============================================
  console.log('\n📦 חלק 1: בדיקת מבנה בסיסי');
  console.log('-'.repeat(60));

  const hasContentBlockManager = typeof window.ContentBlockManager !== 'undefined';
  console.log(`ContentBlockManager קיים: ${hasContentBlockManager ? '✅' : '❌'}`);

  if (!hasContentBlockManager) {
    console.error('❌ ContentBlockManager לא נטען! אי אפשר להמשיך.');
    return;
  }

  const blockCount = window.ContentBlockManager.blocks.size;
  console.log(`מספר בלוקים בזיכרון: ${blockCount}`);

  // ============================================
  // חלק 2: בדיקת Firebase
  // ============================================
  console.log('\n🔥 חלק 2: בדיקת נתוני Firebase');
  console.log('-'.repeat(60));

  let firebaseData = null;
  try {
    firebaseData = await loadAllDataFromFirebase();

    if (!firebaseData) {
      console.error('❌ Firebase ריק או לא מחובר');
      return;
    }

    // ספור סוגי נתונים
    const blockContent = Object.keys(firebaseData).filter(k => k.startsWith('block_') && !k.startsWith('block_meta'));
    const blockMeta = Object.keys(firebaseData).filter(k => k.startsWith('meta_'));
    const regularFields = Object.keys(firebaseData).filter(k => !k.startsWith('block_') && !k.startsWith('meta_'));

    console.log(`\n📊 סטטיסטיקות Firebase:`);
    console.log(`   תוכן בלוקים (block_*): ${blockContent.length}`);
    console.log(`   מטא-דאטה (meta_*): ${blockMeta.length}`);
    console.log(`   שדות רגילים: ${regularFields.length}`);

    // הצג דוגמאות
    if (blockContent.length > 0) {
      console.log(`\n✅ דוגמה לתוכן בלוק:`);
      const firstBlock = blockContent[0];
      console.log(`   Key: ${firstBlock}`);
      console.log(`   Content: ${firebaseData[firstBlock].substring(0, 100)}...`);
    } else {
      console.warn(`\n⚠️ אין תוכן בלוקים ב-Firebase!`);
    }

    if (blockMeta.length > 0) {
      console.log(`\n✅ דוגמה ל-metadata:`);
      const firstMeta = blockMeta[0];
      console.log(`   Key: ${firstMeta}`);
      try {
        const parsed = JSON.parse(firebaseData[firstMeta]);
        console.log(`   Data:`, parsed);
      } catch (e) {
        console.log(`   Raw: ${firebaseData[firstMeta]}`);
      }
    } else {
      console.warn(`\n⚠️ אין metadata ב-Firebase!`);
    }

  } catch (error) {
    console.error('❌ שגיאה בטעינה מ-Firebase:', error);
    return;
  }

  // ============================================
  // חלק 3: בדיקת פונקציות שמירה
  // ============================================
  console.log('\n💾 חלק 3: בדיקת פונקציות שמירה');
  console.log('-'.repeat(60));

  const hasSaveBlock = typeof window.ContentBlockManager.saveBlock === 'function';
  const hasSaveBlockStructure = typeof window.ContentBlockManager.saveBlockStructure === 'function';

  console.log(`saveBlock() קיימת: ${hasSaveBlock ? '✅' : '❌'}`);
  console.log(`saveBlockStructure() קיימת: ${hasSaveBlockStructure ? '✅' : '❌'}`);

  // ============================================
  // חלק 4: ניטור שמירה בזמן אמת
  // ============================================
  console.log('\n🎯 חלק 4: מתקין ניטור לשמירות');
  console.log('-'.repeat(60));

  // התקן presave interceptor
  if (window.ContentBlockManager && window.ContentBlockManager.saveBlock) {
    const originalSaveBlock = window.ContentBlockManager.saveBlock.bind(window.ContentBlockManager);

    window.ContentBlockManager.saveBlock = function(blockId) {
      console.log(`\n🔔 saveBlock() נקראה!`);
      console.log(`   Block ID: ${blockId}`);

      const block = this.blocks.get(blockId);
      if (block) {
        const content = block.content.innerHTML;
        console.log(`   תוכן (50 תווים ראשונים): ${content.substring(0, 50)}...`);
        console.log(`   אורך תוכן: ${content.length} תווים`);
      } else {
        console.warn(`   ⚠️ הבלוק לא נמצא בזיכרון!`);
      }

      // קרא לפונקציה המקורית
      return originalSaveBlock(blockId);
    };

    console.log('✅ ניטור הותקן בהצלחה');
    console.log('   עכשיו כל שמירה תודפס לקונסול');
  }

  // ============================================
  // חלק 5: בדיקת מעקב אחר שינויים
  // ============================================
  console.log('\n👀 חלק 5: בדיקת event listeners');
  console.log('-'.repeat(60));

  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  console.log(`אלמנטים עם contenteditable: ${editableElements.length}`);

  // בדוק אם יש listeners
  let hasInputListeners = 0;
  editableElements.forEach(el => {
    const listeners = getEventListeners ? getEventListeners(el) : null;
    if (listeners && (listeners.input || listeners.blur)) {
      hasInputListeners++;
    }
  });

  if (getEventListeners) {
    console.log(`אלמנטים עם input/blur listeners: ${hasInputListeners}`);
  } else {
    console.log(`⚠️ לא ניתן לבדוק listeners (דפדפן לא תומך)`);
  }

  // ============================================
  // חלק 6: השוואת בלוקים בזיכרון לעומת Firebase
  // ============================================
  console.log('\n🔄 חלק 6: השוואה בין זיכרון ל-Firebase');
  console.log('-'.repeat(60));

  const blocksInMemory = Array.from(window.ContentBlockManager.blocks.keys());
  const blocksInFirebase = Object.keys(firebaseData).filter(k => k.startsWith('block_') && !k.startsWith('block_meta'));

  console.log(`בלוקים בזיכרון: ${blocksInMemory.length}`);
  console.log(`בלוקים ב-Firebase: ${blocksInFirebase.length}`);

  // בדוק אם יש בלוקים בזיכרון שלא ב-Firebase
  const missingInFirebase = blocksInMemory.filter(blockId => !blocksInFirebase.includes(blockId));
  if (missingInFirebase.length > 0) {
    console.warn(`\n⚠️ ${missingInFirebase.length} בלוקים בזיכרון אבל לא ב-Firebase:`);
    missingInFirebase.slice(0, 5).forEach(id => {
      console.log(`   - ${id}`);
    });
    if (missingInFirebase.length > 5) {
      console.log(`   ... ועוד ${missingInFirebase.length - 5}`);
    }
  } else {
    console.log(`✅ כל הבלוקים בזיכרון קיימים ב-Firebase`);
  }

  // ============================================
  // חלק 7: בדיקת localStorage
  // ============================================
  console.log('\n💾 חלק 7: בדיקת localStorage');
  console.log('-'.repeat(60));

  let localBlockCount = 0;
  let localMetaCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('guide_block_')) {
      localBlockCount++;
    }
    if (key.startsWith('guide_meta_')) {
      localMetaCount++;
    }
  }

  console.log(`תוכן בלוקים ב-localStorage: ${localBlockCount}`);
  console.log(`metadata ב-localStorage: ${localMetaCount}`);

  // ============================================
  // סיכום ומסקנות
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📋 סיכום ומסקנות');
  console.log('='.repeat(60));

  const issues = [];

  if (blockCount === 0) {
    issues.push('❌ אין בלוקים בזיכרון');
  }

  if (blocksInFirebase.length === 0) {
    issues.push('❌ אין תוכן בלוקים ב-Firebase (רק metadata)');
  }

  if (missingInFirebase.length > 0) {
    issues.push(`⚠️ ${missingInFirebase.length} בלוקים בזיכרון אבל לא נשמרו ב-Firebase`);
  }

  if (!hasSaveBlock) {
    issues.push('❌ פונקציית saveBlock() חסרה');
  }

  if (issues.length > 0) {
    console.log('\n🚨 בעיות שנמצאו:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('\n✅ לא נמצאו בעיות ברורות');
    console.log('   הבעיה עשויה להיות בתזמון או בלוגיקת השמירה');
  }

  console.log('\n📝 הוראות למבחן ידני:');
  console.log('1. ערוך תוכן בבלוק קיים (לחץ עליו ושנה טקסט)');
  console.log('2. עקוב אחר ההדפסות בקונסול - תראה "🔔 saveBlock() נקראה!"');
  console.log('3. אם אתה לא רואה הדפסה - הבעיה היא שהפונקציה לא מופעלת');
  console.log('4. אם אתה רואה הדפסה - הבעיה היא בשמירה ל-Firebase');

  console.log('\n✅ הניטור פעיל! נסה לערוך תוכן ועקוב אחר הקונסול.');

  return {
    blocksInMemory: blockCount,
    blocksInFirebase: blocksInFirebase.length,
    metadataInFirebase: Object.keys(firebaseData).filter(k => k.startsWith('meta_')).length,
    missingInFirebase: missingInFirebase.length,
    issues: issues
  };
})();
