# 📋 תוכנית עבודה: ניהול תוכן המערכת

**תאריך:** 2026-01-17
**מטרה:** תוכנית שיטתית להוספה/מחיקה/עריכה של פריטים בכל אזורי המערכת

---

## 🎯 עקרונות מנחים

### 1. **עבוד בענפים (Branches)**
- כל שינוי מבני = ענף נפרד
- שם הענף: `content/{tab-name}/{action}` (למשל: `content/general-info/add-staff`)
- מזג רק אחרי בדיקה

### 2. **תעד כל שינוי**
- רשום מה הוספת/מחקת
- עדכן את FIELD_NAMING_MAP.md
- commit ברור עם הסבר

### 3. **בדוק אחרי כל שינוי**
- פתח את האתר
- ודא ש-autosave עובד
- בדוק ב-Firebase Console

### 4. **שמור גיבוי**
- לפני שינויים גדולים: `git tag backup-YYYY-MM-DD`
- ייצא נתונים מ-Firebase

---

## 📊 סקירת כל אזורי המערכת

### סיכום מהיר

| טאב | קובץ | פריטים נוכחיים | פוטנציאל לשינוי |
|-----|------|----------------|-----------------|
| מידע כללי | general-info.html | ~40 פריטים | ⭐⭐⭐ גבוה |
| תהליכים משפטיים | legal-processes.html | ~50 פריטים | ⭐⭐ בינוני |
| ניהול יומי | daily-management.html | ~35 פריטים | ⭐⭐⭐ גבוה |
| ניהול פיננסי | financial-management.html | ~60 פריטים | ⭐⭐ בינוני |
| צ'קים והפקדות | checks-deposits.html | ~15 פריטים | ⭐ נמוך |
| אנשי קשר | contacts.html | ~45 פריטים | ⭐⭐⭐ גבוה |
| נהלים ותהליכים | procedures.html | ~70 פריטים | ⭐⭐ בינוני |
| ניהול יומן | calendar-management.html | ~20 פריטים | ⭐ נמוך |
| ניהול ספקים | suppliers-management.html | ~40 פריטים | ⭐⭐⭐ גבוה |

---

## 🗺️ תוכנית עבודה שלב אחר שלב

### שלב 1: סקר והערכה (1-2 שעות)

**מטרה:** זהה מה צריך להשתנות בכל טאב

**משימות:**

1. **פתח גיליון Excel/Google Sheets:**
   ```
   טאב | פריט | פעולה | סטטוס | data-field | הערות
   -----|------|--------|--------|-----------|--------
   מידע כללי | עו"ד 4 | מחיקה | pending | general_ta_staff4 | לא רלוונטי
   מידע כללי | עו"ד שותף | הוספה | pending | general_ta_staff5 | יוסי כהן
   אנשי קשר | בית משפט חדש | הוספה | pending | contacts_court_new1 | ...
   ```

2. **עבור על כל טאב ורשום:**
   - ✅ מה נשאר
   - ➕ מה להוסיף
   - 🗑️ מה למחוק
   - ✏️ מה לערוך (רק תוכן, לא מבנה)

3. **קבע עדיפויות:**
   - **HIGH:** שינויים קריטיים (מידע שגוי, חסר)
   - **MEDIUM:** שיפורים (הוספת פריטים חדשים)
   - **LOW:** אופטימיזציה (סידור מחדש)

### שלב 2: הכנה טכנית (30 דקות)

**משימות:**

1. **גיבוי Firebase:**
   ```bash
   # פתח Firebase Console
   # Realtime Database → Export JSON
   # שמור: backups/firebase-backup-2026-01-17.json
   ```

2. **צור Git tag:**
   ```bash
   git tag backup-before-content-update-2026-01-17
   git push origin backup-before-content-update-2026-01-17
   ```

3. **צור ספריית עבודה:**
   ```bash
   mkdir -p docs/content-updates
   touch docs/content-updates/changes-log.md
   ```

### שלב 3: ביצוע שינויים - גישה מומלצת

אני ממליץ על **2 גישות** (בחר לפי העדפה):

---

#### **גישה A: טאב אחר טאב (מומלץ למתחילים)**

**עקרון:** עובדים על טאב אחד בכל פעם, מתחילה עד סוף.

**יתרונות:**
- ✅ פשוט ומסודר
- ✅ קל לעקוב
- ✅ בעיות מתגלות מהר

**תהליך:**

1. **בחר טאב ראשון** (מומלץ להתחיל עם הפשוט: checks-deposits)

2. **צור ענף:**
   ```bash
   git checkout -b content/checks-deposits/update-items
   ```

3. **פתח את הקובץ:**
   ```bash
   code src/tabs/checks-deposits.html
   ```

4. **בצע שינויים:**
   - מחק פריטים לא רלוונטיים
   - הוסף פריטים חדשים (העתק-הדבק)
   - ערוך data-field להיות ייחודי

5. **בדוק מקומית:**
   - פתח `src/index.html` בדפדפן
   - נווט לטאב "צ'קים והפקדות"
   - לחץ "מצב עריכה"
   - ודא שכל הפריטים עובדים
   - ערוך שדה → ודא ✓ Saved

6. **תעד את השינויים:**
   ```bash
   # docs/content-updates/changes-log.md

   ## Checks & Deposits (2026-01-17)

   ### Added
   - ➕ בנק חדש: בנק דיסקונט (checks_bank_discount)

   ### Removed
   - 🗑️ בנק ישן שנסגר (checks_bank_old1)

   ### Modified
   - ✏️ עדכון מספר חשבון בנק לאומי
   ```

7. **Commit:**
   ```bash
   git add src/tabs/checks-deposits.html docs/content-updates/changes-log.md
   git commit -m "📝 עדכון תוכן: צ'קים והפקדות

   - ➕ הוספת בנק דיסקונט
   - 🗑️ הסרת בנק ישן
   - ✏️ עדכון מספר חשבון

   Total: 3 changes"
   ```

8. **מזג למיין:**
   ```bash
   git checkout main
   git merge content/checks-deposits/update-items --no-edit
   git push origin main
   ```

9. **פרוס לפרודקשן:**
   ```bash
   netlify deploy --prod
   ```

10. **מחק את הענף:**
    ```bash
    git branch -d content/checks-deposits/update-items
    ```

11. **עבור לטאב הבא** וחזור על התהליך.

**סדר מומלץ לטאבים:**
1. ✅ checks-deposits (הכי פשוט - 15 פריטים)
2. ✅ calendar-management (פשוט - 20 פריטים)
3. ✅ daily-management (בינוני - 35 פריטים)
4. ✅ general-info (בינוני - 40 פריטים)
5. ✅ contacts (מורכב - 45 פריטים)
6. ✅ suppliers-management (מורכב - 40 פריטים)
7. ✅ legal-processes (מורכב - 50 פריטים)
8. ✅ financial-management (הכי מורכב - 60 פריטים)
9. ✅ procedures (הכי מורכב - 70 פריטים)

---

#### **גישה B: לפי סוג פעולה (מומלץ למתקדמים)**

**עקרון:** עושים את כל המחיקות קודם, אז כל ההוספות, אז כל העריכות.

**יתרונות:**
- ✅ מהיר יותר
- ✅ עקבי יותר
- ✅ קל יותר לכתוב סקריפטים

**תהליך:**

**שלב 1: מחיקות**

```bash
git checkout -b content/delete-obsolete-items
```

עבור על **כל** הטאבים ומחק פריטים לא רלוונטיים.

```bash
git commit -m "🗑️ מחיקת פריטים לא רלוונטיים מכל הטאבים

Deleted:
- general_ta_staff4 (עו"ד ישן)
- contacts_court_old1 (בית משפט שנסגר)
- suppliers_supplier5 (ספק שלא בשימוש)
...

Total: 15 deletions"
```

**שלב 2: הוספות**

```bash
git checkout main
git checkout -b content/add-new-items
```

עבור על **כל** הטאבים והוסף פריטים חדשים.

```bash
git commit -m "➕ הוספת פריטים חדשים לכל הטאבים

Added:
- general_ta_staff5 (עו"ד חדש)
- contacts_court_new1 (בית משפט חדש)
- suppliers_supplier6 (ספק חדש)
...

Total: 20 additions"
```

**שלב 3: עריכות תוכן**

```bash
git checkout main
git checkout -b content/update-existing-content
```

ערוך תוכן קיים (טלפונים, כתובות, וכו').

**שלב 4: מיזוג והפצה**

```bash
git checkout main
git merge content/delete-obsolete-items --no-edit
git merge content/add-new-items --no-edit
git merge content/update-existing-content --no-edit
git push origin main
netlify deploy --prod
```

---

### שלב 4: בדיקות (30 דקות)

**Checklist לבדיקה:**

```markdown
## בדיקות אחרי עדכון תוכן

### בדיקות פונקציונליות
- [ ] כל הטאבים נפתחים ללא שגיאות
- [ ] autosave עובד על כל השדות החדשים
- [ ] אין שגיאות בקונסול (F12)
- [ ] כפתורי העתקה עובדים
- [ ] כפתורי WhatsApp עובדים (אם יש)

### בדיקות נתונים
- [ ] כל data-field ייחודי (ראה סקריפט למטה)
- [ ] כל השדות מופיעים ב-AutosaveManager
- [ ] נתונים נשמרים ל-Firebase
- [ ] נתונים נשמרים ל-localStorage

### בדיקות ויזואליות
- [ ] אין תוכן חסר או שבור
- [ ] אייקונים מוצגים כראוי
- [ ] רווחים ויישור תקינים
- [ ] מצב עריכה מדגיש שדות כראוי
```

**סקריפט בדיקה:**

```javascript
// הדבק ב-Console (F12)

// 1. בדוק כפילויות ב-data-field
const dataFields = new Map();
const duplicates = [];

document.querySelectorAll('[data-field]').forEach(el => {
  const field = el.getAttribute('data-field');
  if (dataFields.has(field)) {
    duplicates.push(field);
  } else {
    dataFields.set(field, el);
  }
});

if (duplicates.length > 0) {
  console.error('❌ כפילויות נמצאו:', duplicates);
} else {
  console.log('✅ כל data-field ייחודי');
}

// 2. בדוק שכל השדות ב-AutosaveManager
const totalInDOM = dataFields.size;
const totalInManager = window.AutosaveManager.editableFields.size;

console.log(`📊 שדות ב-DOM: ${totalInDOM}`);
console.log(`📊 שדות ב-Manager: ${totalInManager}`);

if (totalInDOM === totalInManager) {
  console.log('✅ כל השדות נמצאו');
} else {
  console.warn(`⚠️ חסרים ${totalInDOM - totalInManager} שדות`);
}

// 3. רשימת שדות חדשים (אחרי תאריך מסוים)
// אפשר לבדוק ב-Firebase Console
```

### שלב 5: תיעוד (15 דקות)

**עדכן מסמכים:**

1. **FIELD_NAMING_MAP.md:**
   ```bash
   # הוסף את כל השדות החדשים
   ```

2. **README.md:**
   ```markdown
   שדות: 569 → 590 שדות editable  # עדכן את המספר
   ```

3. **docs/content-updates/CHANGELOG.md:**
   ```markdown
   ## 2026-01-17: עדכון תוכן כללי

   ### סיכום
   - ➕ 25 פריטים חדשים
   - 🗑️ 15 פריטים נמחקו
   - ✏️ 10 פריטים עודכנו

   ### פירוט לפי טאב
   ...
   ```

---

## 🛠️ כלים מסייעים

### 1. סקריפט לספירת פריטים בטאב

```bash
# כמה linear-item יש בקובץ?
grep -c 'class="linear-item"' src/tabs/general-info.html
```

### 2. סקריפט לחיפוש data-field

```bash
# מצא את כל data-field בקובץ
grep -o 'data-field="[^"]*"' src/tabs/general-info.html | sort
```

### 3. סקריפט לזיהוי כפילויות

```bash
# בדוק כפילויות של data-field
grep -o 'data-field="[^"]*"' src/tabs/general-info.html | sort | uniq -d
```

### 4. סקריפט ליצירת אינדקס הבא

```javascript
// הדבק ב-Console
// מצא את האינדקס הבא לשדה חדש

const prefix = 'general_ta_staff'; // שנה לפי הצורך
const fields = Array.from(window.AutosaveManager.editableFields.keys());
const matching = fields.filter(f => f.startsWith(prefix));

if (matching.length === 0) {
  console.log(`💡 אינדקס מומלץ: ${prefix}1`);
} else {
  const indices = matching.map(f => {
    const match = f.match(/\d+$/);
    return match ? parseInt(match[0]) : 0;
  });
  const maxIndex = Math.max(...indices);
  console.log(`💡 אינדקס מומלץ: ${prefix}${maxIndex + 1}`);
}
```

---

## 📅 לוח זמנים מוצע

### אופציה 1: עבודה מרוכזת (יום אחד)

```
09:00-11:00  שלב 1: סקר והערכה + Excel
11:00-11:30  שלב 2: הכנה טכנית (גיבויים)
11:30-13:00  עבודה על 3 טאבים פשוטים
13:00-14:00  הפסקה
14:00-16:00  עבודה על 3 טאבים בינוניים
16:00-17:00  עבודה על 3 טאבים מורכבים
17:00-17:30  בדיקות
17:30-18:00  תיעוד + deploy
```

**סה"כ: יום עבודה אחד (9 שעות)**

### אופציה 2: עבודה מפוזרת (שבוע)

```
יום א': checks-deposits + calendar-management
יום ב': daily-management + general-info
יום ג': contacts + suppliers-management
יום ד': legal-processes + financial-management
יום ה': procedures + בדיקות + תיעוד
```

**סה"כ: שבוע עבודה (1-2 שעות ביום)**

---

## ⚠️ טיפים והמלצות

### 1. **התחל מהפשוט**
- אל תתחיל עם financial-management (60 פריטים)
- התחל עם checks-deposits (15 פריטים)
- בנה ביטחון

### 2. **בדוק תכופות**
- אחרי כל טאב: פתח דפדפן ובדוק
- אל תצבור 5 טאבים לפני בדיקה

### 3. **שמור גיבויים**
- לפני כל session: `git tag`
- ייצא Firebase לפני שינויים גדולים

### 4. **תעד תוך כדי**
- אל תדחה תיעוד לסוף
- רשום הערות בזמן אמת

### 5. **אל תפחד לחזור אחורה**
```bash
# חזרה לגרסה קודמת
git checkout HEAD~1 src/tabs/general-info.html
```

### 6. **השתמש בדפוס**
- העתק פריט קיים
- אל תכתוב מאפס

---

## 🎯 Checklist סופי

אחרי שסיימת את כל השינויים:

```markdown
- [ ] כל הטאבים עודכנו
- [ ] כל data-field ייחודי
- [ ] אין שגיאות בקונסול
- [ ] autosave עובד על כל השדות
- [ ] נתונים נשמרים ל-Firebase
- [ ] תיעוד עודכן (FIELD_NAMING_MAP.md, README.md)
- [ ] CHANGELOG נכתב
- [ ] commit ברור
- [ ] push לגיט
- [ ] deploy לפרודקשן
- [ ] בדיקה באתר החי
- [ ] ענפים זמניים נמחקו
```

---

## 📞 עזרה

אם נתקלת בבעיה:

1. **בדוק את הקונסול** (F12 → Console)
2. **הרץ את סקריפט הבדיקה** למעלה
3. **בדוק את Git diff:**
   ```bash
   git diff src/tabs/general-info.html
   ```
4. **חזור לגרסה קודמת** אם צריך
5. **פנה לתמיכה** עם:
   - צילום מסך של השגיאה
   - הקוד שהוספת
   - data-field שגרם לבעיה

---

## 🚀 סיכום ההמלצה שלי

**אני ממליץ על גישה A (טאב אחר טאב):**

1. ✅ פשוט לעקוב
2. ✅ קל לזהות בעיות
3. ✅ מתאים גם למתחילים

**סדר מומלץ:**
```
checks-deposits → calendar-management → daily-management →
general-info → contacts → suppliers-management →
legal-processes → financial-management → procedures
```

**זמן צפוי:** 6-9 שעות (תלוי בכמות השינויים)

**התחל עכשיו?** אני כאן לעזור! 💪
