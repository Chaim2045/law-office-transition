#!/usr/bin/env node
/**
 * סקריפט להפיכת כל ה-labels במערכת לעבירים (editable)
 * תאריך: 2026-01-17
 * מטרה: הוספת contenteditable="true" + data-field לכל 187 ה-labels
 */

const fs = require('fs');
const path = require('path');

class LabelTransformer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      labelsTransformed: 0,
      errors: []
    };
  }

  /**
   * יוצר שם שדה ייחודי עבור label
   * פורמט: {tab}_label_{index}
   */
  generateFieldName(tabName, index) {
    return `${tabName}_label_${index}`;
  }

  /**
   * ממיר label בודד מפורמט ישן לחדש
   */
  transformLabel(match, tabName, counter) {
    // שלוף את כל התוכן הפנימי
    const labelContent = match[1].trim();

    // צור שם שדה ייחודי
    counter.value++;
    const fieldName = this.generateFieldName(tabName, counter.value);

    // בנה את ה-HTML החדש
    const newHtml = `<div class="linear-item-label editable"
     data-field="${fieldName}"
     contenteditable="true">
  ${labelContent}
</div>`;

    return newHtml;
  }

  /**
   * מעבד קובץ HTML בודד
   */
  processFile(filePath, tabName) {
    try {
      // קרא את הקובץ
      const content = fs.readFileSync(filePath, 'utf-8');

      // counter למעקב אחרי האינדקס
      const counter = { value: 0 };

      // דפוס regex למציאת labels שעדיין לא עבירים
      // חשוב: רק labels ללא contenteditable
      const pattern = /<div class="linear-item-label">([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/div>/g;

      // החלף את כל ה-labels
      const newContent = content.replace(pattern, (match, ...args) => {
        return this.transformLabel([match, ...args], tabName, counter);
      });

      // בדוק אם היו שינויים
      if (newContent === content) {
        console.log(`   ⏭️  ${path.basename(filePath)}: לא נמצאו labels להמרה`);
        return { success: true, count: 0 };
      }

      // שמור את הקובץ המעודכן
      fs.writeFileSync(filePath, newContent, 'utf-8');

      const labelsTransformed = counter.value;
      this.stats.labelsTransformed += labelsTransformed;
      this.stats.filesProcessed++;

      console.log(`   ✅ ${path.basename(filePath)}: ${labelsTransformed} labels הומרו`);
      return { success: true, count: labelsTransformed };

    } catch (error) {
      const errorMsg = `שגיאה בעיבוד ${filePath}: ${error.message}`;
      this.stats.errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}`);
      return { success: false, count: 0 };
    }
  }

  /**
   * מריץ את הטרנספורמציה על כל הקבצים
   */
  run() {
    console.log('🚀 מתחיל המרת Labels לשדות עבירים...\n');

    // רשימת הקבצים והטאבים שלהם
    const filesConfig = [
      ['src/tabs/daily-management.html', 'daily'],
      ['src/tabs/financial-management.html', 'financial'],
      ['src/tabs/legal-processes.html', 'legal'],
      ['src/tabs/general-info.html', 'general'],
      ['src/tabs/contacts.html', 'contacts'],
      ['src/tabs/checks-deposits.html', 'checks'],
      ['src/tabs/calendar-management.html', 'calendar'],
      ['src/tabs/procedures.html', 'procedures'],
      ['src/tabs/suppliers-management.html', 'suppliers'],
    ];

    // עבור על כל קובץ
    for (const [relPath, tabName] of filesConfig) {
      const fullPath = path.join(__dirname, relPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`   ⚠️  קובץ לא נמצא: ${relPath}`);
        continue;
      }

      this.processFile(fullPath, tabName);
    }

    // הדפס סיכום
    this.printSummary();
  }

  /**
   * מדפיס סיכום של הרצת הסקריפט
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 סיכום המרת Labels');
    console.log('='.repeat(60));
    console.log(`✅ קבצים עובדו:      ${this.stats.filesProcessed}`);
    console.log(`✨ Labels הומרו:      ${this.stats.labelsTransformed}`);

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ שגיאות (${this.stats.errors.length}):`);
      for (const error of this.stats.errors) {
        console.log(`   • ${error}`);
      }
    } else {
      console.log('✅ אין שגיאות!');
    }

    console.log('='.repeat(60));

    if (this.stats.labelsTransformed > 0) {
      console.log('\n✨ ההמרה הושלמה בהצלחה!');
      console.log('\n📝 צעדים הבאים:');
      console.log('   1. הרץ את האפליקציה ובדוק שה-labels ניתנים לעריכה');
      console.log('   2. פתח Console והרץ:');
      console.log('      console.log(window.AutosaveManager.editableFields.size);');
      console.log(`      צפוי: 384 + ${this.stats.labelsTransformed} = ${384 + this.stats.labelsTransformed} שדות`);
      console.log('   3. ערוך label אחד ובדוק ש-autosave עובד');
      console.log('   4. commit + deploy');
    } else {
      console.log('\n⏭️  לא בוצעו שינויים (כל ה-labels כבר עבירים?)');
    }
  }
}

// הרץ את הטרנספורמר
const transformer = new LabelTransformer();
transformer.run();
