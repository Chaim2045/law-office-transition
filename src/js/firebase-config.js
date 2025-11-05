// Firebase Configuration
// ⚠️ חשוב: עליך להחליף את הערכים האלה בנתוני Firebase שלך מקונסולת Firebase
// לפרטים נוספים, ראה את הקובץ FIREBASE_SETUP.md

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
let database = null;
let firebaseInitialized = false;

// Check if Firebase config is real (not placeholder)
const isRealConfig = firebaseConfig.apiKey !== 'YOUR_API_KEY';

if (isRealConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error);
    console.warn('💡 האפליקציה תמשיך לעבוד עם סיסמה מקומית');
  }
} else {
  console.warn('⚠️ Firebase config uses placeholder values');
  console.warn('💡 האפליקציה תעבוד עם סיסמה מקומית בלבד');
}

// Password configuration path in Firebase
const PASSWORD_PATH = 'editPassword';
const DEFAULT_PASSWORD = '9668';
const LOCAL_PASSWORD_KEY = 'local_edit_password';

// שמירת הסיסמה ב-Firebase (הרץ את זה פעם אחת כדי לאתחל את הסיסמה)
function initializePassword() {
  if (!firebaseInitialized || !database) {
    console.warn('⚠️ Firebase לא מאותחל. משתמש בסיסמה מקומית.');
    localStorage.setItem(LOCAL_PASSWORD_KEY, DEFAULT_PASSWORD);
    return Promise.resolve(DEFAULT_PASSWORD);
  }

  return database
    .ref(PASSWORD_PATH)
    .set(DEFAULT_PASSWORD)
    .then(() => {
      console.log('✅ הסיסמה נשמרה בהצלחה ב-Firebase');
      return DEFAULT_PASSWORD;
    })
    .catch((error) => {
      console.error('❌ שגיאה בשמירת הסיסמה:', error);
      // Fallback to local storage
      localStorage.setItem(LOCAL_PASSWORD_KEY, DEFAULT_PASSWORD);
      return DEFAULT_PASSWORD;
    });
}

// קבלת הסיסמה מ-Firebase או מהאחסון המקומי
function getPasswordFromFirebase() {
  // If Firebase is not initialized, use local storage
  if (!firebaseInitialized || !database) {
    console.warn('⚠️ משתמש בסיסמה מקומית');
    const localPassword = localStorage.getItem(LOCAL_PASSWORD_KEY);
    if (!localPassword) {
      localStorage.setItem(LOCAL_PASSWORD_KEY, DEFAULT_PASSWORD);
      return Promise.resolve(DEFAULT_PASSWORD);
    }
    return Promise.resolve(localPassword);
  }

  // Try to get from Firebase
  return database
    .ref(PASSWORD_PATH)
    .get()
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log('✅ סיסמה נטענה מ-Firebase');
        return snapshot.val();
      }
      // אם הסיסמה לא קיימת, אתחל אותה
      console.log('💡 מאתחל סיסמה ב-Firebase...');
      return initializePassword();
    })
    .catch((error) => {
      console.error('❌ שגיאה בקריאת הסיסמה מ-Firebase:', error);
      // Fallback to local storage
      const localPassword = localStorage.getItem(LOCAL_PASSWORD_KEY);
      if (!localPassword) {
        localStorage.setItem(LOCAL_PASSWORD_KEY, DEFAULT_PASSWORD);
        return DEFAULT_PASSWORD;
      }
      return localPassword;
    });
}

// אימות סיסמה
async function validatePassword(inputPassword) {
  try {
    const correctPassword = await getPasswordFromFirebase();
    const isValid = inputPassword === correctPassword;

    if (isValid) {
      console.log('✅ אימות סיסמה הצליח');
    } else {
      console.warn('⚠️ סיסמה שגויה');
    }

    return isValid;
  } catch (error) {
    console.error('❌ שגיאה באימות סיסמה:', error);
    return false;
  }
}

// עדכון סיסמה (אופציונלי - למקרה שתרצה לשנות את הסיסמה בעתיד)
function updatePassword(newPassword) {
  if (!firebaseInitialized || !database) {
    console.warn('⚠️ Firebase לא מאותחל. מעדכן סיסמה מקומית בלבד.');
    localStorage.setItem(LOCAL_PASSWORD_KEY, newPassword);
    console.log('✅ הסיסמה המקומית עודכנה');
    return Promise.resolve(true);
  }

  return database
    .ref(PASSWORD_PATH)
    .set(newPassword)
    .then(() => {
      console.log('✅ הסיסמה עודכנה בהצלחה ב-Firebase');
      // Also update local storage as backup
      localStorage.setItem(LOCAL_PASSWORD_KEY, newPassword);
      return true;
    })
    .catch((error) => {
      console.error('❌ שגיאה בעדכון הסיסמה ב-Firebase:', error);
      // Fallback to local storage
      localStorage.setItem(LOCAL_PASSWORD_KEY, newPassword);
      console.log('✅ הסיסמה המקומית עודכנה (Firebase נכשל)');
      return false;
    });
}

// Initialize password on first load
if (firebaseInitialized) {
  // Check if password exists in Firebase, if not - initialize it
  getPasswordFromFirebase().then((password) => {
    if (password === DEFAULT_PASSWORD) {
      console.log(`💡 הסיסמה מוכנה לשימוש: ${DEFAULT_PASSWORD}`);
    }
  });
} else {
  // Initialize local password if Firebase is not available
  if (!localStorage.getItem(LOCAL_PASSWORD_KEY)) {
    localStorage.setItem(LOCAL_PASSWORD_KEY, DEFAULT_PASSWORD);
    console.log(`💡 סיסמה מקומית אותחלה: ${DEFAULT_PASSWORD}`);
  }
}

// Export functions to window for global access
window.validatePassword = validatePassword;
window.updatePassword = updatePassword;
window.initializePassword = initializePassword;
