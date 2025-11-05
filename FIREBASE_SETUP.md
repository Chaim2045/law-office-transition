# הוראות התקנה והגדרת Firebase

## מדריך שלב אחר שלב להגדרת מערכת הסיסמה

### שלב 1: יצירת פרויקט Firebase

1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ על "Add project" (הוסף פרויקט)
3. תן שם לפרויקט שלך (למשל: "law-office-transition")
4. עקוב אחרי השלבים להשלמת יצירת הפרויקט

### שלב 2: הפעלת Realtime Database

1. בתפריט הצד, לחץ על "Realtime Database"
2. לחץ על "Create Database" (צור מסד נתונים)
3. בחר מיקום (בדרך כלל "us-central1" או הקרוב אליך)
4. בחר במצב "Start in test mode" (ניתן לשנות מאוחר יותר)
5. לחץ על "Enable"

### שלב 3: קבלת פרטי התצורה

1. בתפריט הצד, לחץ על גלגל השיניים ליד "Project Overview" ובחר "Project settings"
2. גלול למטה עד לקטע "Your apps"
3. אם אין לך אפליקציית Web, לחץ על הסמל `</>` להוספת אפליקציית Web
4. תן שם לאפליקציה (למשל: "law-office-web")
5. העתק את אובייקט `firebaseConfig` שמופיע

### שלב 4: הגדרת התצורה בפרויקט

1. פתח את הקובץ `src/js/firebase-config.js`
2. החלף את הערכים ב-`firebaseConfig` בערכים שהעתקת מ-Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY', // החלף בערך האמיתי
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### שלב 5: אתחול הסיסמה ב-Firebase

לאחר הגדרת התצורה, פתח את האפליקציה בדפדפן ופתח את ה-Console (F12):

```javascript
// הרץ את הפקודה הזו פעם אחת בקונסול כדי לשמור את הסיסמה:
initializePassword();
```

**הסיסמה הנוכחית היא: `9668`**

### שלב 6: הגדרת כללי אבטחה (אופציונלי אך מומלץ)

לאבטחה טובה יותר, עדכן את כללי האבטחה של Realtime Database:

1. ב-Firebase Console, עבור ל-Realtime Database
2. לחץ על הכרטיסייה "Rules"
3. החלף את הכללים הקיימים בכללים הבאים:

```json
{
  "rules": {
    "editPassword": {
      ".read": true,
      ".write": false
    }
  }
}
```

**הסבר:** כללים אלה מאפשרים קריאה של הסיסמה (לצורך אימות) אך מונעים כתיבה דרך האפליקציה. זה מונע משינוי של הסיסמה ללא גישה ישירה ל-Firebase Console.

### שלב 7: שינוי הסיסמה (אופציונלי)

לשינוי הסיסמה בעתיד:

**אופציה 1: דרך Firebase Console**
1. היכנס ל-Firebase Console
2. עבור ל-Realtime Database
3. מצא את המפתח `editPassword`
4. ערוך את הערך לסיסמה החדשה

**אופציה 2: דרך הקוד**
```javascript
// בקונסול הדפדפן:
updatePassword('הסיסמה_החדשה_שלך');
```

## פתרון בעיות

### הסיסמה לא עובדת
- וודא שהגדרת נכון את `firebaseConfig`
- בדוק שהרצת את `initializePassword()` לפחות פעם אחת
- בדוק את ה-Console לשגיאות

### שגיאת חיבור ל-Firebase
- וודא שה-Realtime Database מופעל בפרויקט
- בדוק שכללי האבטחה מאפשרים קריאה
- וודא שה-`databaseURL` נכון

### הסיסמה מתאפסת
- בדוק את כללי האבטחה
- וודא שאף אחד לא משנה את הערך ב-Firebase Console

## אבטחה

⚠️ **חשוב:**
- אל תשתף את פרטי ה-`firebaseConfig` בפומבי
- שנה את כללי האבטחה מ-"test mode" לכללים מותאמים
- שקול להוסיף מגבלות נוספות בכללי האבטחה
- הסיסמה נשמרת בטקסט פשוט ב-Firebase - זו שיטה פשוטה אך לא הכי מאובטחת
