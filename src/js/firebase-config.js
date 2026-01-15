// Firebase Configuration
// ⚠️ חשוב: עליך להחליף את הערכים האלה בנתוני Firebase שלך מקונסולת Firebase
// לפרטים נוספים, ראה את הקובץ FIREBASE_SETUP.md

/* ============================================
   SAFETY FLAGS - Global Configuration
   ============================================ */
window.APP_CONFIG = {
  // Set to false to disable all Firebase writes (safe testing mode)
  enableFirebaseWrites: true,

  // Set to true to make entire app read-only
  readOnly: false,

  // Enable detailed logging for debugging
  enableSaveLogging: true,
};

/* ============================================
   LOGGER - Save Operation Instrumentation
   ============================================ */
const SaveLogger = {
  log(operation, details) {
    if (!window.APP_CONFIG.enableSaveLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = '🔧 [SaveLogger]';
    console.log(`${prefix} ${timestamp} - ${operation}`, details);
  },

  logStart(field) {
    this.log('SAVE_START', { field, timestamp: Date.now() });
    return Date.now(); // return start time for latency calculation
  },

  logSuccess(field, startTime) {
    const latency = Date.now() - startTime;
    this.log('SAVE_SUCCESS', { field, latency: `${latency}ms` });
  },

  logError(field, error, startTime) {
    const latency = Date.now() - startTime;
    this.log('SAVE_ERROR', { field, error: error.message, latency: `${latency}ms` });
  },

  logSkipped(field, reason) {
    console.warn(`⚠️ [SaveLogger] WRITE SKIPPED BY FLAG - Field: ${field}, Reason: ${reason}`);
  },
};

// Make logger globally accessible
window.SaveLogger = SaveLogger;

const firebaseConfig = {
  apiKey: 'AIzaSyC9R_eupXtdkzEMBwA1Dsc6SC_14_iUNLs',
  authDomain: 'law-office-guide.firebaseapp.com',
  databaseURL: 'https://law-office-guide-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'law-office-guide',
  storageBucket: 'law-office-guide.firebasestorage.app',
  messagingSenderId: '903121364456',
  appId: '1:903121364456:web:91d02f021ab618d3a6705d',
  measurementId: 'G-3NZXL9YB35',
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

  // ✅ SAFETY CHECK: Password writes are critical, but respect readOnly flag
  if (window.APP_CONFIG.readOnly) {
    console.warn('⚠️ [PASSWORD] Write blocked by readOnly=true');
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

  // ✅ SAFETY CHECK: Password writes respect readOnly flag
  if (window.APP_CONFIG.readOnly) {
    console.warn('⚠️ [PASSWORD] Update blocked by readOnly=true');
    localStorage.setItem(LOCAL_PASSWORD_KEY, newPassword);
    console.log('✅ הסיסמה המקומית עודכנה (readOnly mode)');
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

// שמירת נתון ל-Firebase
function saveToFirebase(field, value) {
  const startTime = SaveLogger.logStart(field);

  // ✅ SAFETY CHECK: Respect write flags
  if (!window.APP_CONFIG.enableFirebaseWrites) {
    SaveLogger.logSkipped(field, 'enableFirebaseWrites=false');
    return Promise.resolve(false);
  }

  if (window.APP_CONFIG.readOnly) {
    SaveLogger.logSkipped(field, 'readOnly=true');
    return Promise.resolve(false);
  }

  if (!firebaseInitialized || !database) {
    console.warn('⚠️ Firebase לא מאותחל. נתונים יישמרו רק מקומית.');
    return Promise.resolve(false);
  }

  return database
    .ref(`guideData/${field}`)
    .set(value)
    .then(() => {
      SaveLogger.logSuccess(field, startTime);
      return true;
    })
    .catch((error) => {
      SaveLogger.logError(field, error, startTime);
      return false;
    });
}

// טעינת נתון מ-Firebase
function loadFromFirebase(field) {
  if (!firebaseInitialized || !database) {
    return Promise.resolve(null);
  }

  return database
    .ref(`guideData/${field}`)
    .get()
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    })
    .catch((error) => {
      console.error('❌ שגיאה בטעינת נתון מ-Firebase:', error);
      return null;
    });
}

// מחיקת נתון מ-Firebase
function deleteFromFirebase(field) {
  // ✅ SAFETY CHECK: Respect write flags
  if (!window.APP_CONFIG.enableFirebaseWrites) {
    SaveLogger.logSkipped(field, 'DELETE blocked by enableFirebaseWrites=false');
    return Promise.resolve(false);
  }

  if (window.APP_CONFIG.readOnly) {
    SaveLogger.logSkipped(field, 'DELETE blocked by readOnly=true');
    return Promise.resolve(false);
  }

  if (!firebaseInitialized || !database) {
    return Promise.resolve(false);
  }

  return database
    .ref(`guideData/${field}`)
    .remove()
    .then(() => {
      console.log(`✅ נתון נמחק מ-Firebase: ${field}`);
      return true;
    })
    .catch((error) => {
      console.error('❌ שגיאה במחיקת נתון מ-Firebase:', error);
      return false;
    });
}

// טעינת כל הנתונים מ-Firebase
function loadAllDataFromFirebase() {
  if (!firebaseInitialized || !database) {
    console.warn('⚠️ Firebase לא מאותחל. טוען נתונים מקומיים בלבד.');
    return Promise.resolve(null);
  }

  return database
    .ref('guideData')
    .get()
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log('✅ כל הנתונים נטענו מ-Firebase');
        return snapshot.val();
      }
      return null;
    })
    .catch((error) => {
      console.error('❌ שגיאה בטעינת נתונים מ-Firebase:', error);
      return null;
    });
}

// Export functions to window for global access
window.validatePassword = validatePassword;
window.updatePassword = updatePassword;
window.initializePassword = initializePassword;
window.saveToFirebase = saveToFirebase;
window.loadFromFirebase = loadFromFirebase;
window.deleteFromFirebase = deleteFromFirebase;
window.loadAllDataFromFirebase = loadAllDataFromFirebase;
