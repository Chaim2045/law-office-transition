# 📦 רשימת תלויות - Dependencies

**תאריך:** 2026-01-16
**פרויקט:** Law Office Transition Guide v1

---

## 🔥 Firebase

### Firebase Realtime Database
```html
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
```

**גרסה:** 9.22.0 (compat mode)
**שימוש:**
- אחסון תוכן
- Realtime sync
- Authentication

---

## 🎨 CSS Frameworks

### Tailwind CSS
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**גרסה:** Latest (CDN)
**שימוש:** Utility-first CSS framework
**classes עיקריים:**
- Layout: `flex`, `grid`, `items-center`
- Colors: `bg-blue-50`, `text-blue-900`, `dark:*`
- Typography: `text-4xl`, `font-bold`
- Spacing: `mb-8`, `p-4`, `gap-2`

---

## 🖋️ Fonts

### Google Fonts - Rubik
```html
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**משפחת פונט:** Rubik
**משקלים:** 300, 400, 500, 600, 700
**תמיכה:** Hebrew + Latin

---

## 🎭 Icons

### SVG Icons (Inline)
- לא משתמש ב-icon library חיצוני
- כל האייקונים הם inline SVG
- מבוססים על Heroicons design

---

## 📜 JavaScript Libraries

### אין libraries חיצוניים נוספים!

הכל vanilla JavaScript:
- Event handling
- DOM manipulation
- Firebase integration

---

## ✅ סיכום

**תלויות חיצוניות:**
1. Firebase v9.22.0 (compat)
2. Tailwind CSS (CDN)
3. Google Fonts - Rubik

**יתרונות:**
- ✅ מינימום תלויות
- ✅ כל התלויות מ-CDN מהירים
- ✅ לא צריך build process
- ✅ עובד ישירות מ-file://

**חסרונות:**
- ⚠️ תלוי ב-CDN (offline לא עובד)
- ⚠️ Tailwind JIT מ-CDN (לא אופטימלי לפרודקשן)

---

## 💡 המלצות לv2

1. **שמור:** Firebase, Rubik font
2. **שקול לשנות:** Tailwind CDN → Build process (אופציונלי)
3. **הוסף (אופציונלי):** Service Worker לoffline support
