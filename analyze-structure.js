const fs = require('fs');
const path = require('path');

// קריאת קובץ ה-HTML
const htmlPath = path.join(__dirname, 'public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// מציאת כל הטאבים
const tabRegex = /<div id="([^"]+)" class="tab-content[^>]*>/g;
const tabs = [];
let match;

while ((match = tabRegex.exec(html)) !== null) {
  tabs.push(match[1]);
}

console.log('📋 **סיכום מבנה הדף**\n');
console.log(`נמצאו ${tabs.length} טאבים:\n`);

// ניתוח כל טאב
tabs.forEach((tabId, index) => {
  // מציאת תחילת וסוף הטאב
  const tabStartRegex = new RegExp(`<div id="${tabId}" class="tab-content[^>]*>`);
  const tabStart = html.search(tabStartRegex);

  let tabEnd;
  if (index < tabs.length - 1) {
    const nextTabRegex = new RegExp(`<div id="${tabs[index + 1]}" class="tab-content[^>]*>`);
    tabEnd = html.search(nextTabRegex);
  } else {
    tabEnd = html.length;
  }

  const tabContent = html.substring(tabStart, tabEnd);

  // ספירת sections
  const sectionsRegex = /<div class="linear-section">/g;
  const sectionsCount = (tabContent.match(sectionsRegex) || []).length;

  // ספירת items עם הסטייל החדש (copy-btn-container)
  const newStyleRegex = /<div class="copy-btn-container linear-item">/g;
  const newStyleCount = (tabContent.match(newStyleRegex) || []).length;

  // ספירת items עם הסטייל הישן (בלי copy-btn-container)
  const oldStyleRegex = /<div class="linear-item">(?!.*copy-btn-container)/g;
  const oldStyleCount = (tabContent.match(oldStyleRegex) || []).length;

  // ספירת items בסטייל ישן לגמרי (עם class="editable" ישירות)
  const veryOldStyleRegex = /<p class="editable"|<span class="editable"/g;
  const veryOldStyleCount = (tabContent.match(veryOldStyleRegex) || []).length;

  // קביעת סטטוס
  let status = '✅';
  let statusText = 'מושלם';

  if (oldStyleCount > 0 || veryOldStyleCount > 0) {
    status = '❌';
    statusText = 'צריך עדכון';
  } else if (newStyleCount === 0 && sectionsCount === 0) {
    status = '🔴';
    statusText = 'סטייל ישן לגמרי';
  }

  console.log(`${status} **${tabId}** - ${statusText}`);
  console.log(`   📦 Sections: ${sectionsCount}`);
  console.log(`   ✅ Items בסטייל חדש: ${newStyleCount}`);
  console.log(`   ⚠️  Items בסטייל ישן: ${oldStyleCount}`);
  console.log(`   🔴 Elements בסטייל ישן מאוד: ${veryOldStyleCount}`);
  console.log('');
});

console.log('\n📊 **סיכום כללי:**\n');

// סיכום כולל
const allSections = (html.match(/<div class="linear-section">/g) || []).length;
const allNewStyle = (html.match(/<div class="copy-btn-container linear-item">/g) || []).length;
const allOldStyle = (html.match(/<div class="linear-item">(?!.*<div class="copy-btn-container)/g) || []).length;

console.log(`📦 סה"כ Sections: ${allSections}`);
console.log(`✅ סה"כ Items בסטייל חדש: ${allNewStyle}`);
console.log(`❌ סה"כ Items שצריכים עדכון: ${allOldStyle}`);
console.log('');

// המלצה
if (allOldStyle > 50) {
  console.log('💡 **המלצה:** יש הרבה items לעדכן - כדאי לשקול סקריפט אוטומציה');
} else if (allOldStyle > 0) {
  console.log('💡 **המלצה:** ניתן לעדכן ידנית אזור אחר אזור');
} else {
  console.log('🎉 **הכל מעודכן!** כל האזורים בסטייל החדש');
}
