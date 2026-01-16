#!/usr/bin/env node
/**
 * סקריפט לחילוץ קובץ החפיפה מקבצי HTML
 * READ ONLY - לא מבצע שום כתיבה, רק קריאה
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 11 הטאבים שמרכיבים את קובץ החפיפה (לפי הסדר במערכת)
const HANDOVER_TABS = [
  { id: 'general-info', name: 'מידע כללי על המשרד', file: 'general-info.html' },
  { id: 'daily-management', name: 'ניהול יומי', file: 'daily-management.html' },
  { id: 'meetings-scheduling', name: 'תיאום פגישות', file: 'meetings-scheduling.html' },
  { id: 'calendar-management', name: 'ניהול יומן', file: 'calendar-management.html' },
  { id: 'legal-processes', name: 'תהליכי עבודה משפטיים', file: 'legal-processes.html' },
  { id: 'financial-management', name: 'ניהול פיננסי', file: 'financial-management.html' },
  { id: 'notary-calculator', name: 'מחשבון נוטריון', file: 'notary-calculator.html' },
  { id: 'checks-deposits', name: 'נוהל הפקדת צ\'קים', file: 'checks-deposits.html' },
  { id: 'suppliers-management', name: 'ניהול ספקים', file: 'suppliers-management.html' },
  { id: 'contacts', name: 'אנשי קשר', file: 'contacts.html' },
  { id: 'procedures', name: 'הליכים', file: 'procedures.html' }
];

/**
 * המרת HTML לטקסט נקי בפורמט Markdown
 */
function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return '';

  let text = html;

  // Remove comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove script and style tags completely
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Convert headings to markdown
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');

  // Convert lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  // Convert paragraphs and divs
  text = text.replace(/<\/?(p|div)[^>]*>/gi, '\n');

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert strong/bold
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');

  // Convert emphasis/italic
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');

  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&#x27;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Max 2 consecutive newlines
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
  text = text.replace(/^\s+/gm, ''); // Remove leading whitespace from each line
  text = text.trim();

  return text;
}

/**
 * חילוץ תוכן מקובץ HTML
 */
function extractContentFromHTML(htmlContent, tabName) {
  let content = '';

  // חילוץ כל התוכן מה-HTML
  const cleanContent = htmlToMarkdown(htmlContent);

  // סינון שורות ריקות מרובות
  const lines = cleanContent.split('\n').filter(line => {
    const trimmed = line.trim();
    // השאר רק שורות עם תוכן משמעותי
    return trimmed.length > 0 && trimmed !== '♦' && !trimmed.match(/^[♦•▪︎◆]+$/);
  });

  content = lines.join('\n');

  return content;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 מתחיל חילוץ קובץ החפיפה מקבצי HTML...\n');

  const tabsDir = path.join(__dirname, 'src', 'tabs');

  // בדיקה שהתיקייה קיימת
  if (!fs.existsSync(tabsDir)) {
    console.error(`❌ תיקייה לא נמצאה: ${tabsDir}`);
    process.exit(1);
  }

  // בניית קובץ ה-Markdown
  let markdown = '# קובץ חפיפה - מדריך מקצועי למשרד עו"ד\n\n';
  markdown += `> נוצר אוטומטית מהמערכת ב-${new Date().toLocaleDateString('he-IL')}\n`;
  markdown += `> משרד עו"ד גיא הרשקוביץ\n\n`;
  markdown += '---\n\n';

  let totalBlocks = 0;
  let tabsWithContent = 0;
  let tabsWithoutContent = [];
  const stats = {};

  console.log('📥 קורא קבצי HTML...\n');

  // עיבוד כל טאב לפי הסדר
  for (const tab of HANDOVER_TABS) {
    const filePath = path.join(tabsDir, tab.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  קובץ לא נמצא: ${tab.file}`);
      tabsWithoutContent.push(tab.name);
      continue;
    }

    try {
      const htmlContent = fs.readFileSync(filePath, 'utf8');
      const content = extractContentFromHTML(htmlContent, tab.name);

      if (content && content.trim().length > 0) {
        markdown += `## ${tab.name}\n\n`;
        markdown += `${content}\n\n`;
        markdown += '---\n\n';

        tabsWithContent++;
        stats[tab.name] = content.length;
        totalBlocks++;

        console.log(`✓ ${tab.name}: ${content.length} תווים`);
      } else {
        tabsWithoutContent.push(tab.name);
        console.log(`⚠️  ${tab.name}: ללא תוכן`);
      }
    } catch (error) {
      console.error(`❌ שגיאה בקריאת ${tab.file}: ${error.message}`);
      tabsWithoutContent.push(tab.name);
    }
  }

  // כתיבת הקובץ
  const outputPath = path.join(__dirname, 'HANDOVER_FILE.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');

  console.log(`\n✅ קובץ החפיפה נוצר בהצלחה!\n`);
  console.log(`📄 נתיב: ${outputPath}\n`);

  console.log('📊 סטטיסטיקה:');
  console.log(`   • סך הכל טאבים: ${HANDOVER_TABS.length}`);
  console.log(`   • טאבים עם תוכן: ${tabsWithContent}`);
  console.log(`   • טאבים ללא תוכן: ${tabsWithoutContent.length}\n`);

  if (tabsWithContent > 0) {
    console.log('📈 פירוט תוכן לפי טאבים:');
    for (const [tabName, charCount] of Object.entries(stats)) {
      console.log(`   ✓ ${tabName}: ${charCount} תווים`);
    }
  }

  if (tabsWithoutContent.length > 0) {
    console.log('\n⚠️  טאבים ללא תוכן:');
    tabsWithoutContent.forEach(tabName => {
      console.log(`   - ${tabName}`);
    });
  }

  console.log('\n🎯 קריטריון בחירת תוכן:');
  console.log('   ✓ כל התוכן מ-11 קבצי ה-HTML שמייצגים את טאבי החפיפה');
  console.log('   ✓ חילוץ טקסט נקי מה-HTML והמרה לפורמט Markdown');
  console.log('   ✓ שמירה על הסדר המקורי של הטאבים כפי שהם במערכת');
  console.log('   ✓ סינון אלמנטים טכניים (SVG, scripts, styles)');

  console.log('\n📝 הערות:');
  console.log('   • התוכן נלקח מקבצי HTML סטטיים בתיקיית src/tabs/');
  console.log('   • זהו תוכן ברירת המחדל או תוכן אחרון ששמור במערכת');
  console.log('   • לא בוצעה שום כתיבה ל-Firebase או שינוי בקוד');
}

// Run
main().catch(error => {
  console.error('❌ שגיאה:', error.message);
  process.exit(1);
});
