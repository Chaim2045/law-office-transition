#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
סקריפט להפיכת כל ה-labels במערכת לעבירים (editable)
תאריך: 2026-01-17
מטרה: הוספת contenteditable="true" + data-field לכל 187 ה-labels
"""

import re
import os
from typing import Dict, List, Tuple

class LabelTransformer:
    def __init__(self):
        self.stats = {
            'files_processed': 0,
            'labels_transformed': 0,
            'errors': []
        }

    def generate_field_name(self, tab_name: str, index: int, label_text: str) -> str:
        """
        יוצר שם שדה ייחודי עבור label
        פורמט: {tab}_label_{index}

        דוגמה: general_label_5
        """
        return f"{tab_name}_label_{index}"

    def transform_label(self, match: re.Match, tab_name: str, counter: Dict[str, int]) -> str:
        """
        ממיר label בודד מפורמט ישן לחדש

        לפני:  <div class="linear-item-label">עו"ד</div>
        אחרי:  <div class="linear-item-label editable"
                     data-field="general_label_5"
                     contenteditable="true">
                 עו"ד
               </div>
        """
        # שלוף את כל התוכן הפנימי (כולל HTML אם יש)
        label_content = match.group(1).strip()

        # צור שם שדה ייחודי
        counter['value'] += 1
        field_name = self.generate_field_name(tab_name, counter['value'], label_content)

        # בנה את ה-HTML החדש
        new_html = f'''<div class="linear-item-label editable"
     data-field="{field_name}"
     contenteditable="true">
  {label_content}
</div>'''

        return new_html

    def process_file(self, file_path: str, tab_name: str) -> Tuple[bool, int]:
        """
        מעבד קובץ HTML בודד

        Returns:
            (success: bool, labels_count: int)
        """
        try:
            # קרא את הקובץ
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # ספור כמה labels יש לפני
            original_count = len(re.findall(
                r'<div class="linear-item-label"[^>]*>',
                content
            ))

            # counter למעקב אחרי האינדקס
            counter = {'value': 0}

            # דפוס regex למציאת labels שעדיין לא עבירים
            # חשוב: רק labels ללא contenteditable (כדי לא לשכתב labels שכבר עבירים)
            pattern = r'<div class="linear-item-label">([^<]+(?:<[^>]+>[^<]*</[^>]+>)*[^<]*)</div>'

            # החלף את כל ה-labels
            new_content = re.sub(
                pattern,
                lambda m: self.transform_label(m, tab_name, counter),
                content
            )

            # בדוק אם היו שינויים
            if new_content == content:
                print(f"   ⏭️  {os.path.basename(file_path)}: לא נמצאו labels להמרה")
                return True, 0

            # שמור את הקובץ המעודכן
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            labels_transformed = counter['value']
            self.stats['labels_transformed'] += labels_transformed
            self.stats['files_processed'] += 1

            print(f"   ✅ {os.path.basename(file_path)}: {labels_transformed} labels הומרו")
            return True, labels_transformed

        except Exception as e:
            error_msg = f"שגיאה בעיבוד {file_path}: {str(e)}"
            self.stats['errors'].append(error_msg)
            print(f"   ❌ {error_msg}")
            return False, 0

    def run(self):
        """
        מריץ את הטרנספורמציה על כל הקבצים
        """
        print("🚀 מתחיל המרת Labels לשדות עבירים...\n")

        # רשימת הקבצים והטאבים שלהם
        files_config = [
            ('src/tabs/daily-management.html', 'daily'),
            ('src/tabs/financial-management.html', 'financial'),
            ('src/tabs/legal-processes.html', 'legal'),
            ('src/tabs/general-info.html', 'general'),
            ('src/tabs/contacts.html', 'contacts'),
            ('src/tabs/checks-deposits.html', 'checks'),
            ('src/tabs/calendar-management.html', 'calendar'),
            ('src/tabs/procedures.html', 'procedures'),
            ('src/tabs/suppliers-management.html', 'suppliers'),
        ]

        # עבור על כל קובץ
        for file_path, tab_name in files_config:
            full_path = os.path.join(os.path.dirname(__file__), file_path)

            if not os.path.exists(full_path):
                print(f"   ⚠️  קובץ לא נמצא: {file_path}")
                continue

            self.process_file(full_path, tab_name)

        # הדפס סיכום
        self.print_summary()

    def print_summary(self):
        """
        מדפיס סיכום של הרצת הסקריפט
        """
        print("\n" + "="*60)
        print("📊 סיכום המרת Labels")
        print("="*60)
        print(f"✅ קבצים עובדו:      {self.stats['files_processed']}")
        print(f"✨ Labels הומרו:      {self.stats['labels_transformed']}")

        if self.stats['errors']:
            print(f"\n❌ שגיאות ({len(self.stats['errors'])}):")
            for error in self.stats['errors']:
                print(f"   • {error}")
        else:
            print(f"✅ אין שגיאות!")

        print("="*60)

        if self.stats['labels_transformed'] > 0:
            print("\n✨ ההמרה הושלמה בהצלחה!")
            print("\n📝 צעדים הבאים:")
            print("   1. הרץ את האפליקציה ובדוק שה-labels ניתנים לעריכה")
            print("   2. פתח Console והרץ:")
            print("      console.log(window.AutosaveManager.editableFields.size);")
            print(f"      צפוי: 384 + {self.stats['labels_transformed']} = {384 + self.stats['labels_transformed']} שדות")
            print("   3. ערוך label אחד ובדוק ש-autosave עובד")
            print("   4. commit + deploy")
        else:
            print("\n⏭️  לא בוצעו שינויים (כל ה-labels כבר עבירים?)")

def main():
    """
    נקודת כניסה ראשית
    """
    transformer = LabelTransformer()
    transformer.run()

if __name__ == '__main__':
    main()
