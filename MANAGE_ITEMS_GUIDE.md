# 📝 מדריך: הוספה ומחיקה של פריטים (קוביות) במערכת

**תאריך:** 2026-01-17
**גרסה:** 1.0

---

## 🎯 מה זה "קוביה" (Linear Item)?

קוביה היא פריט בודד במערכת, למשל:
- עו"ד + השם שלו
- טלפון + המספר
- כתובת + הכתובת המלאה

**מבנה של קוביה:**
```html
<div class="copy-btn-container linear-item">
  <!-- אייקון -->
  <div class="linear-item-icon">
    <svg>...</svg>
  </div>

  <!-- תוכן: כותרת + ערך -->
  <div class="linear-item-content">
    <div class="linear-item-label editable" data-field="..." contenteditable="true">
      עו"ד
    </div>
    <div class="linear-item-value editable" data-field="..." contenteditable="true">
      גיא הרשקוביץ - 054-2400403
    </div>
  </div>

  <!-- כפתור העתקה -->
  <button class="copy-btn" onclick="copyToClipboard('...')">
    <svg>...</svg>
  </button>
</div>
```

---

## 🗑️ מחיקת קוביה (פריט)

### שיטה 1: מחיקה פשוטה (מומלץ למתחילים)

**צעדים:**

1. **פתח את קובץ ה-HTML הרלוונטי** (למשל: `src/tabs/general-info.html`)

2. **חפש את הקוביה שאתה רוצה למחוק** לפי הטקסט:
   ```
   Ctrl+F → חפש "עו"ד, בעל החברה"
   ```

3. **זהה את התחלת הקוביה:**
   ```html
   <div class="copy-btn-container linear-item">
   ```

4. **מצא את סוף הקוביה:**
   ```html
   </div> <!-- סוגר את copy-btn-container -->
   ```

5. **מחק את כל הבלוק** (מהתחלה עד הסוף)

6. **שמור את הקובץ**

**דוגמה - לפני:**
```html
<div class="copy-btn-container linear-item">
  <div class="linear-item-icon">
    <svg>...</svg>
  </div>
  <div class="linear-item-content">
    <div class="linear-item-label editable" data-field="general_label_7" contenteditable="true">
      עו"ד, בעל החברה
    </div>
    <div class="linear-item-value editable" data-field="general_ta_staff1" contenteditable="true">
      גיא הרשקוביץ - 054-2400403
    </div>
  </div>
  <button class="copy-btn">...</button>
</div>
```

**אחרי:**
```html
<!-- הקוביה נמחקה לגמרי -->
```

### שיטה 2: מחיקה עם סקריפט (מומלץ למתקדמים)

אם יש לך **הרבה קוביות למחוק**, אפשר להשתמש בסקריפט:

```javascript
// הדבק ב-Console (F12)

// 1. מצא את הקוביה לפי data-field
const fieldToDelete = 'general_ta_staff1'; // שם השדה
const element = document.querySelector(`[data-field="${fieldToDelete}"]`);

// 2. מצא את הקוביה ההורה (linear-item)
const linearItem = element.closest('.linear-item');

// 3. מחק את הקוביה
if (linearItem) {
  linearItem.remove();
  console.log(`✅ נמחק: ${fieldToDelete}`);
} else {
  console.log('❌ לא נמצא');
}
```

**⚠️ חשוב:** זה רק מוחק מה-DOM (זמני). כדי לשמור לצמיתות, צריך לערוך את ה-HTML.

### שיטה 3: באמצעות Git Diff (לביקורת)

אם אתה רוצה לראות בדיוק מה נמחק:

```bash
# ערוך את הקובץ (מחק את הקוביה)
# אז הרץ:
git diff src/tabs/general-info.html

# תראה:
# - <div class="linear-item">...  # שורות שנמחקו באדום
```

---

## ➕ הוספת קוביה חדשה

### שיטה 1: העתקה והדבקה (מומלץ)

**צעדים:**

1. **מצא קוביה דומה** בקובץ (למשל: עו"ד אחר)

2. **העתק את כל הבלוק:**
   ```html
   <div class="copy-btn-container linear-item">
     ...
   </div>
   ```

3. **הדבק במקום הרצוי** (אחרי קוביה אחרת)

4. **ערוך את השדות:**
   - **Label:** שנה את `data-field` ל-**שם ייחודי חדש**
   - **Value:** שנה את `data-field` ל-**שם ייחודי חדש**
   - **Text:** שנה את התוכן
   - **Copy button:** שנה את `onclick="copyToClipboard('...')"`

**דוגמה - הוספת עו"ד חדש:**

```html
<!-- 1. העתקתי קוביה קיימת -->
<div class="copy-btn-container linear-item">
  <div class="linear-item-icon">
    <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%">
      <path
        fill-rule="evenodd"
        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
        clip-rule="evenodd"
      ></path>
    </svg>
  </div>
  <div class="linear-item-content">
    <!-- 2. שיניתי את data-field לשם ייחודי -->
    <div class="linear-item-label editable"
         data-field="general_label_NEW_1"
         contenteditable="true">
      עו"ד שותף
    </div>
    <!-- 3. שיניתי את data-field + התוכן -->
    <div class="linear-item-value editable"
         data-field="general_ta_staff_NEW_1"
         contenteditable="true">
      <button class="whatsapp-btn" onclick="openWhatsApp('050-1234567')" title="פתח וואטסאפ">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>
      יוסי כהן - 050-1234567
    </div>
  </div>
  <!-- 4. שיניתי את copyToClipboard -->
  <button class="copy-btn" onclick="copyToClipboard('יוסי כהן - 050-1234567')">
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
    </svg>
  </button>
</div>
```

### שיטה 2: באמצעות Template (מומלץ למתקדמים)

צור קובץ `item-template.html` עם תבנית בסיסית:

```html
<!-- Template for new linear-item -->
<div class="copy-btn-container linear-item">
  <div class="linear-item-icon">
    <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%">
      <path
        fill-rule="evenodd"
        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
        clip-rule="evenodd"
      ></path>
    </svg>
  </div>
  <div class="linear-item-content">
    <div class="linear-item-label editable"
         data-field="{{TAB_NAME}}_label_{{INDEX}}"
         contenteditable="true">
      {{LABEL_TEXT}}
    </div>
    <div class="linear-item-value editable"
         data-field="{{TAB_NAME}}_{{SECTION}}_{{INDEX}}"
         contenteditable="true">
      {{VALUE_TEXT}}
    </div>
  </div>
  <button class="copy-btn" onclick="copyToClipboard('{{VALUE_TEXT}}')">
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
    </svg>
  </button>
</div>
```

**שימוש:**
1. העתק את ה-template
2. החלף את `{{TAB_NAME}}`, `{{INDEX}}`, `{{LABEL_TEXT}}`, `{{VALUE_TEXT}}`
3. הדבק לקובץ ה-HTML

### שיטה 3: סקריפט אוטומטי (למתקדמים)

```javascript
/**
 * הוסף קוביה חדשה באופן פרוגרמטי
 */
function addNewLinearItem(config) {
  const {
    tabName,        // 'general'
    section,        // 'ta_staff'
    index,          // 5
    labelText,      // 'עו"ד שותף'
    valueText,      // 'יוסי כהן - 050-1234567'
    insertAfter     // אלמנט לאחר ממנו להוסיף
  } = config;

  const template = `
    <div class="copy-btn-container linear-item">
      <div class="linear-item-icon">
        <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <div class="linear-item-content">
        <div class="linear-item-label editable" data-field="${tabName}_label_${index}" contenteditable="true">
          ${labelText}
        </div>
        <div class="linear-item-value editable" data-field="${tabName}_${section}_${index}" contenteditable="true">
          ${valueText}
        </div>
      </div>
      <button class="copy-btn" onclick="copyToClipboard('${valueText}')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
        </svg>
      </button>
    </div>
  `;

  // הוסף אחרי האלמנט
  insertAfter.insertAdjacentHTML('afterend', template);

  console.log(`✅ נוסף: ${tabName}_${section}_${index}`);
}

// דוגמה לשימוש:
const lastStaffItem = document.querySelector('[data-field="general_ta_staff1"]').closest('.linear-item');
addNewLinearItem({
  tabName: 'general',
  section: 'ta_staff',
  index: 5,
  labelText: 'עו"ד שותף',
  valueText: 'יוסי כהן - 050-1234567',
  insertAfter: lastStaffItem
});
```

---

## ⚠️ דברים חשובים לזכור

### 1. שמות שדות ייחודיים (data-field)

**כלל זהב:** כל `data-field` חייב להיות **ייחודי** במערכת!

**טוב:** ✅
```html
<div data-field="general_ta_staff1">...</div>
<div data-field="general_ta_staff2">...</div>
<div data-field="general_ta_staff3">...</div>
```

**רע:** ❌
```html
<div data-field="general_ta_staff1">...</div>
<div data-field="general_ta_staff1">...</div>  <!-- כפילות! -->
```

### 2. אמנת שמות

**פורמט מומלץ:** `{tab}_{section}_{element}_{index}`

**דוגמאות:**
- `general_ta_staff_5` - עובד מספר 5 במשרד ת"א
- `financial_bank_account_3` - חשבון בנק 3
- `contacts_court_tel_district_1` - בית משפט מחוזי ת"א

**Labels:**
- `general_label_10` - label מספר 10 ב-general
- `financial_label_5` - label מספר 5 ב-financial

### 3. אחרי הוספה/מחיקה - בדיקה

```javascript
// הדבק ב-Console
console.log('סך הכל שדות:', window.AutosaveManager.editableFields.size);

// בדוק שדה ספציפי
const field = window.AutosaveManager.editableFields.get('general_ta_staff_5');
console.log(field ? '✅ קיים' : '❌ לא קיים');
```

### 4. שמירה ב-Git

אחרי שינויים:

```bash
# בדוק מה השתנה
git diff src/tabs/general-info.html

# אם נראה טוב:
git add src/tabs/general-info.html
git commit -m "➕ הוספת עו"ד שותף חדש / 🗑️ מחיקת עו"ד ישן"
git push origin main
```

---

## 🎯 דוגמאות מעשיות

### דוגמה 1: מחיקת עובד

**תרחיש:** רוצים למחוק את "גיא הרשקוביץ" מרשימת העובדים

**שלבים:**
1. פתח `src/tabs/general-info.html`
2. חפש `Ctrl+F` → "גיא הרשקוביץ"
3. זהה את הבלוק:
   ```html
   <div class="copy-btn-container linear-item">  <!-- התחלה -->
     ...
     גיא הרשקוביץ
     ...
   </div>  <!-- סוף -->
   ```
4. **מחק את כל הבלוק**
5. שמור (Ctrl+S)

### דוגמה 2: הוספת טלפון חדש

**תרחיש:** רוצים להוסיף טלפון נוסף למשרד

**שלבים:**
1. פתח `src/tabs/general-info.html`
2. מצא טלפון קיים (כמו "טלפון משרד ראשי")
3. העתק את כל הבלוק
4. הדבק מתחתיו
5. ערוך:
   ```html
   <!-- לפני -->
   <div data-field="general_ta_phone1">050-1234567</div>

   <!-- אחרי -->
   <div data-field="general_ta_phone2">03-6543210</div>
   ```
6. ערוך את הטקסט: "טלפון משרד משני"
7. שמור

### דוגמה 3: שינוי סדר קוביות

**תרחיש:** רוצים שהמזכירה תופיע לפני עו"ד

**שלבים:**
1. **גזור** (Ctrl+X) את בלוק המזכירה
2. **הדבק** (Ctrl+V) **לפני** בלוק עו"ד
3. שמור

---

## 📚 תיעוד נוסף

- **אמנת שמות מלאה:** [FIELD_NAMING_MAP.md](FIELD_NAMING_MAP.md)
- **מבנה HTML:** [src/tabs/*.html](src/tabs/)
- **Autosave:** [src/js/autosave.js](src/js/autosave.js)

---

## ❓ שאלות נפוצות

### Q: האם autosave יזהה את השדה החדש אוטומטית?

**A:** כן! ✅

ברגע שיש `data-field` + `contenteditable="true"`, autosave.js יגלה אותו אוטומטית.

### Q: מה קורה לנתונים הישנים אחרי מחיקת קוביה?

**A:** הנתונים נשארים ב-Firebase!

אם תרצה למחוק גם את הנתונים:
```javascript
// Firebase Console או:
firebase.database().ref('guideData/general_ta_staff1').remove();
```

### Q: כמה קוביות אפשר להוסיף?

**A:** אין הגבלה טכנית!

אבל מומלץ לשמור על ביצועים:
- עד 50 קוביות בטאב = מעולה ⚡
- 50-100 = טוב 👍
- 100+ = עדיין עובד אבל לשקול לפצל לטאבים 🤔

### Q: איך לשנות את האייקון?

**A:** ערוך את ה-SVG ב-`<div class="linear-item-icon">`

אפשר למצוא SVG icons ב:
- [Heroicons](https://heroicons.com/)
- [Font Awesome](https://fontawesome.com/)
- [Material Icons](https://fonts.google.com/icons)

---

## 🚀 סיכום

### מחיקת קוביה:
1. פתח את קובץ ה-HTML
2. מצא את הבלוק `<div class="linear-item">...</div>`
3. מחק את כולו
4. שמור

### הוספת קוביה:
1. העתק קוביה דומה
2. הדבק במקום הרצוי
3. ערוך `data-field` לשם ייחודי
4. ערוך את התוכן
5. שמור

**זהו! פשוט ונקי! 🎉**
