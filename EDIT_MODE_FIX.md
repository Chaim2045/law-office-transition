# 🎨 תיקון מצב עריכה - Visual-Only Edit Mode

**גרסה:** v2.1
**תאריך:** 2026-01-17
**בעיה שנפתרה:** השדות נראו תמיד במצב עריכה (borders כחולים)

---

## 🔍 מה היתה הבעיה?

### לפני התיקון (v2.0):
```html
<!-- HTML -->
<div class="editable" data-field="legal_main_title" contenteditable="true">
  תהליכים משפטיים
</div>
```

```css
/* CSS - תמיד הראה borders */
.editable[contenteditable='true'] {
  border: 2px solid blue; /* ❌ תמיד */
  background: lightblue;
}
```

**תוצאה:** כל השדות **תמיד** נראו במצב עריכה עם borders כחולים.

---

## ✅ מה התיקון?

### אחרי התיקון (v2.1):

```css
/* CSS - ברירת מחדל: ללא borders */
.editable[contenteditable='true'] {
  /* ✅ נראה רגיל - ללא borders */
}

/* רק כשמוסיפים את הקלאס 'edit-mode-active' */
.editable[contenteditable='true'].edit-mode-active {
  border: 2px solid blue; /* ✅ רק במצב עריכה */
  background: lightblue;
}
```

```javascript
// main.js - כפתור "מצב עריכה"
if (editMode) {
  // ✅ הוסף קלאס ויזואלי בלבד
  element.classList.add('edit-mode-active');
} else {
  // ✅ הסר קלאס ויזואלי
  element.classList.remove('edit-mode-active');
}
```

---

## 🎯 איך זה עובד?

### מצב רגיל (edit mode OFF):
```
┌────────────────────────┐
│ תהליכים משפטיים        │  ← נראה רגיל
│                        │  ← ללא borders
│ (אבל עדיין editable!) │  ← autosave עובד
└────────────────────────┘
```

### מצב עריכה (edit mode ON):
```
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ תהליכים משפטיים        ┃  ← border כחול
┃                        ┃  ← background בהיר
┃ + אינדיקטור עריכה     ┃  ← ויזואלי ברור
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 📊 מה השתנה?

### קבצים שעודכנו:

1. **src/css/styles.css**
   - שורות 427-462: שינוי הסטיילינג של `.editable[contenteditable='true']`
   - שורות 472-550: עדכון save states (saving/saved/error)

2. **src/js/main.js**
   - שורות 227-233: עדכון logic של editMode ON
   - שורות 261-267: עדכון logic של editMode OFF

---

## 🔧 הטכנולוגיה:

### עקרון:
- ה-`contenteditable="true"` **תמיד** קיים (ל-autosave)
- הקלאס `edit-mode-active` **נוסף/מוסר** דינמית (לויזואליזציה)

### יתרונות:
✅ autosave עובד **תמיד** (גם כש-edit mode כבוי)
✅ השדות נראים **רגילים** כשלא עורכים
✅ כפתור "מצב עריכה" **רק ויזואלי**
✅ שומר תאימות עם המערכת הישנה

---

## 🧪 בדיקה:

1. **פתח את האתר**
2. **הסתכל על השדות** - צריכים להיראות רגילים (ללא borders)
3. **לחץ על "מצב עריכה"** - צריך להופיע border כחול
4. **ערוך טקסט** - autosave צריך לעבוד (💾 saving → ✓ saved)
5. **לחץ "שמור שינויים"** - ה-borders נעלמים

---

## 📝 הערות:

- **autosave עובד תמיד** - גם כש"מצב עריכה" כבוי
- **אם תרצה לחסום עריכה ממש** - צריך רמה 2 (complex)
- **התיקון הזה הוא רמה 1** - visual-only

---

**סטטוס:** ✅ הושלם ופועל
