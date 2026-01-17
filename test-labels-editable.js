/**
 * בדיקה: כל ה-labels המרו לעבירים
 * תאריך: 2026-01-17
 *
 * הדבק את הקוד הזה ב-Console בדפדפן אחרי טעינת index.html
 */

(async function testLabelsEditable() {
  console.log('🧪 בדיקת Labels עבירים...\n');

  // 1. בדוק שAutosaveManager קיים
  if (typeof window.AutosaveManager === 'undefined') {
    console.error('❌ AutosaveManager לא קיים!');
    return;
  }
  console.log('✅ AutosaveManager קיים\n');

  // 2. בדוק כמה שדות נמצאו
  const totalFields = window.AutosaveManager.editableFields.size;
  console.log(`📊 סך הכל שדות שנמצאו: ${totalFields}`);
  console.log(`   צפוי: 384 (ישנים) + 166 (labels) = 550\n`);

  // 3. בדוק כמה מהם labels
  let labelCount = 0;
  for (const [fieldName, element] of window.AutosaveManager.editableFields) {
    if (fieldName.includes('_label_')) {
      labelCount++;
    }
  }
  console.log(`🏷️  שדות Labels: ${labelCount}`);
  console.log(`   צפוי: 166\n`);

  // 4. הצג דוגמאות של labels שנמצאו
  console.log('📝 דוגמאות של Labels שנמצאו:');
  let count = 0;
  for (const [fieldName, element] of window.AutosaveManager.editableFields) {
    if (fieldName.includes('_label_') && count < 10) {
      const text = element.textContent.trim().substring(0, 30);
      console.log(`   ${count + 1}. ${fieldName}: "${text}..."`);
      count++;
    }
  }

  // 5. בדוק label ספציפי שהמשתמש ציין
  console.log('\n🔍 בדיקת label ספציפי: "עו"ד, בעל החברה"');
  const targetLabel = Array.from(window.AutosaveManager.editableFields.values())
    .find(el => el.textContent.includes('עו"ד, בעל החברה'));

  if (targetLabel) {
    const fieldName = targetLabel.getAttribute('data-field');
    console.log(`   ✅ נמצא!`);
    console.log(`   📌 Field name: ${fieldName}`);
    console.log(`   📝 Content: "${targetLabel.textContent.trim()}"`);
    console.log(`   🔧 contenteditable: ${targetLabel.getAttribute('contenteditable')}`);
  } else {
    console.log(`   ❌ לא נמצא!`);
  }

  // 6. סיכום
  console.log('\n' + '='.repeat(50));
  console.log('📊 סיכום');
  console.log('='.repeat(50));

  const expectedTotal = 550;
  const expectedLabels = 166;

  if (totalFields >= expectedTotal - 20 && totalFields <= expectedTotal + 20) {
    console.log(`✅ סך הכל שדות: ${totalFields} (קרוב לצפוי)`);
  } else {
    console.log(`⚠️  סך הכל שדות: ${totalFields} (צפוי: ${expectedTotal})`);
  }

  if (labelCount >= expectedLabels - 10 && labelCount <= expectedLabels + 10) {
    console.log(`✅ Labels עבירים: ${labelCount} (קרוב לצפוי)`);
  } else {
    console.log(`⚠️  Labels עבירים: ${labelCount} (צפוי: ${expectedLabels})`);
  }

  console.log('='.repeat(50));

  if (totalFields > 500 && labelCount > 150) {
    console.log('\n🎉 כל ה-Labels המרו בהצלחה!');
    console.log('\n📝 כעת אפשר:');
    console.log('   1. לעבור למצב עריכה (כפתור "מצב עריכה")');
    console.log('   2. לערוך label (למשל: "עו"ד" → "שותף בכיר")');
    console.log('   3. לעזוב את השדה (blur)');
    console.log('   4. לראות אינדיקטור "נשמר" (✓ ירוק)');
    console.log('   5. לרענן דף ולוודא שהשינוי נשמר');
  } else {
    console.log('\n⚠️  יש בעיה! Labels לא הומרו במלואם.');
  }

})();
