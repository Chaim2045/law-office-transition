# מדריך חפיפה מקצועי - משרד עו"ד גיא הרשקוביץ

## תיאור הפרויקט

אפליקציית ווב למדריך חפיפה מקצועי למשרד עורכי דין.

## מבנה הפרויקט

```
law-office-transition/
├── src/
│   ├── js/          # קבצי JavaScript
│   └── css/         # קבצי CSS
├── public/          # קבצים סטטיים
│   └── index.html   # קובץ HTML ראשי
├── config/          # קבצי קונפיגורציה
└── node_modules/    # חבילות npm
```

## התקנה

```bash
npm install
```

## סקריפטים זמינים

- `npm run lint` - בדיקת קוד עם ESLint
- `npm run lint:fix` - תיקון אוטומטי של בעיות ESLint
- `npm run format` - עיצוב קוד עם Prettier
- `npm run format:check` - בדיקת עיצוב בלבד
- `npm run dev` - הרצת שרת פיתוח

## הרצת הפרויקט

```bash
npm run dev
```

הפרויקט יהיה זמין בכתובת: http://localhost:3000

## מערכת הסיסמה למצב עריכה

האפליקציה כוללת מערכת אבטחה למצב עריכה:

- **סיסמה ברירת מחדל**: `9668`
- **אחסון**: הסיסמה נשמרת ב-Firebase Realtime Database
- **Fallback**: אם Firebase לא מוגדר, הסיסמה נשמרת ב-localStorage

### הגדרת Firebase

לשימוש מלא במערכת הסיסמה, יש להגדיר חיבור ל-Firebase:

1. עיין במסמך [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) להוראות מפורטות
2. עדכן את קובץ [src/js/firebase-config.js](./src/js/firebase-config.js) עם פרטי הפרויקט שלך

**הערה**: האפליקציה תעבוד גם ללא Firebase, אך הסיסמה תישמר רק במחשב המקומי.

## טכנולוגיות

- HTML5
- CSS3
- JavaScript (ES6+)
- Tailwind CSS
- Firebase
- ESLint
- Prettier

## עיצוב

הפרויקט משתמש בעיצוב מינימליסטי ומקצועי:

- **פלטת צבעים**: כחול כהה (#1e3a8a) + גוונים אפורים
- **סגנון**: לינארי, נקי וממוקד
- **אייקונים**: מינימליסטיים ומקצועיים
- **ללא**: גראדיאנטים צבעוניים, צבעים מרובים, אמוג'י

## Linting

הפרויקט משתמש ב-ESLint עם Airbnb style guide וב-Prettier לעיצוב אחיד של הקוד.

## פריסה ל-Netlify

הפרויקט מוכן לפריסה ל-Netlify עם קובץ התצורה `netlify.toml`.

### שיטת הפריסה המומלצת - דרך GitHub

1. **העלה את הפרויקט ל-GitHub**:

   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **התחבר ל-Netlify**:
   - גש ל-[netlify.com](https://netlify.com)
   - התחבר עם חשבון GitHub שלך

3. **צור אתר חדש**:
   - לחץ על "Add new site" > "Import an existing project"
   - בחר "Deploy with GitHub"
   - בחר את הריפוזיטורי שלך
   - Netlify תזהה אוטומטית את ההגדרות מ-`netlify.toml`
   - לחץ על "Deploy site"

4. **האתר יהיה זמין**:
   - Netlify תיצור לך כתובת אוטומטית: `https://your-site-name.netlify.app`
   - ניתן לשנות את שם האתר בהגדרות

### פריסה ידנית (Drag & Drop)

אם אתה לא רוצה להשתמש ב-Git:

1. גש ל-[netlify.com](https://netlify.com)
2. התחבר לחשבון
3. גרור את תיקיית `public` לאזור ה-Drop בעמוד הראשי
4. Netlify תפרוס את האתר באופן מיידי

### הגדרת Firebase ב-Netlify (אופציונלי)

אם אתה רוצה שהסיסמה תישמר ב-Firebase:

1. בממשק Netlify, עבור ל: **Site settings > Environment variables**
2. הוסף את משתני הסביבה הבאים:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_DATABASE_URL`

3. עדכן את [src/js/firebase-config.js](./src/js/firebase-config.js) לקרוא ממשתני סביבה

### עדכון אוטומטי

עם GitHub, כל `git push` יעדכן את האתר אוטומטית!

```bash
git add .
git commit -m "Update content"
git push
```

Netlify תזהה את השינוי ותפרוס מחדש תוך דקות.
