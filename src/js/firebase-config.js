// Firebase Configuration
// ⚠️ חשוב: עליך להחליף את הערכים האלה בנתוני Firebase שלך מקונסולת Firebase
// לפרטים נוספים, ראה את הקובץ FIREBASE_SETUP.md

/* ============================================
   SAFETY FLAGS - Global Configuration
   ============================================ */

// ✅ COMMIT 12: Auto-detect safe mode based on environment
function detectSafeMode() {
  // Check hostname (localhost/127.0.0.1)
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

  // Check query parameter (?safe=1)
  const urlParams = new URLSearchParams(window.location.search);
  const hasSafeParam = urlParams.get('safe') === '1';

  // Check localStorage flag
  const hasLocalFlag = localStorage.getItem('SAFE_MODE') === '1';

  return isLocalhost || hasSafeParam || hasLocalFlag;
}

window.APP_CONFIG = {
  // ✅ COMMIT 12: Production-safe default with auto-detection
  // Default: true (production mode)
  // Auto-disabled if: localhost OR ?safe=1 OR localStorage.SAFE_MODE=1
  enableFirebaseWrites: !detectSafeMode(),

  // Set to true to make entire app read-only
  readOnly: false,

  // ✅ OPTIMIZATION: Enable logging only in development (safe mode)
  // Production: false (clean console), Development: true (debug logs)
  enableSaveLogging: detectSafeMode(),
};

// Log detected mode
if (detectSafeMode()) {
  console.warn('⚠️ SAFE MODE DETECTED - Firebase writes disabled');
  console.log('💡 Detected safe mode trigger:', {
    isLocalhost: ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname),
    hasSafeParam: new URLSearchParams(window.location.search).get('safe') === '1',
    hasLocalFlag: localStorage.getItem('SAFE_MODE') === '1',
  });
} else {
  console.log('✅ Production mode - Firebase writes enabled');
}

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

/* ============================================
   BLOCK LOCKING SYSTEM - Constants
   ============================================ */

// Lock config
const LOCK_TTL = 60000; // 60 seconds
const HEARTBEAT_INTERVAL = 20000; // 20 seconds
const LOCK_PATH = 'locks';

// Generate unique session ID
const SESSION_ID = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// Active locks and heartbeats
const activeLocks = new Map(); // blockId -> { token, heartbeatInterval }

/* ============================================
   BLOCK DATA NORMALIZATION
   ============================================ */

/**
 * ✅ COMMIT 7: Normalize block data from Firebase to unified format
 *
 * Firebase schema:
 * - NEW format: {content: string, updatedAt: timestamp}
 * - OLD format: string (backward compatible)
 *
 * @param {string|Object} val - Raw value from Firebase
 * @returns {{content: string, updatedAt: number}}
 */
function normalizeBlockData(val) {
  // Case 1: Already normalized object
  if (val && typeof val === 'object' && val.content !== undefined) {
    return {
      content: val.content || '',
      updatedAt: val.updatedAt || 0,
    };
  }

  // Case 2: Legacy string format (backward compatible)
  if (typeof val === 'string') {
    return {
      content: val,
      updatedAt: 0, // Unknown timestamp for legacy data
    };
  }

  // Case 3: Invalid/null data
  return {
    content: '',
    updatedAt: 0,
  };
}

// שמירת נתון ל-Firebase
async function saveToFirebase(field, value) {
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

  // ✅ COMMIT 13: Tightened lock enforcement - REQUIRE lock ownership
  if (field.startsWith('block_')) {
    const blockId = field;

    // ✅ REQUIRE lock ownership (fail-closed policy)
    const hasActiveLock = activeLocks.has(blockId);

    if (!hasActiveLock) {
      // No active lock in memory - check Firebase for ownership proof
      try {
        const lockRef = database.ref(`${LOCK_PATH}/${blockId}`);
        const snapshot = await lockRef.get();

        if (snapshot.exists()) {
          const lock = snapshot.val();
          const now = Date.now();

          // Check if lock expired
          if (lock.expiresAt < now) {
            const errorMsg = `⛔ Write blocked - lock expired (must re-acquire)`;
            console.error(errorMsg);
            SaveLogger.logError(field, new Error(errorMsg), startTime);
            return false;
          }

          // Check if lock is owned by another session
          if (lock.lockedBy !== SESSION_ID) {
            const errorMsg = `⛔ Write blocked - block locked by ${lock.lockedBy}`;
            console.error(errorMsg);
            SaveLogger.logError(field, new Error(errorMsg), startTime);
            return false;
          }

          // Lock is ours but not in activeLocks - allow (edge case after refresh)
          console.warn(`⚠️ Lock verified in Firebase but not in memory: ${blockId}`);
        } else {
          // ✅ COMMIT 13: No lock exists → REJECT (fail-closed)
          const errorMsg = `⛔ Write blocked - no lock acquired for ${blockId}`;
          console.error(errorMsg);
          SaveLogger.logError(field, new Error(errorMsg), startTime);
          return false;
        }
      } catch (error) {
        // ✅ COMMIT 13: On error → REJECT (fail-closed)
        const errorMsg = `⛔ Write blocked - lock check failed: ${error.message}`;
        console.error(errorMsg);
        SaveLogger.logError(field, new Error(errorMsg), startTime);
        return false;
      }
    }
    // else: We have active lock in memory - verified ownership, allow write
  }

  // ✅ COMMIT 7: Save as {content, updatedAt} object with server timestamp
  const blockData = {
    content: value,
    updatedAt: firebase.database.ServerValue.TIMESTAMP,
  };

  return database
    .ref(`guideData/${field}`)
    .set(blockData)
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
        // ✅ COMMIT 7: Parse with normalizeBlockData, return content only for backward compat
        const normalized = normalizeBlockData(snapshot.val());
        return normalized.content;
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

// טעינת כל הנתונים מ-Firebase (one-time read for initial load)
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
        const rawData = snapshot.val();

        // ✅ COMMIT 7: Normalize all block data, return content-only for backward compat
        const normalizedData = {};
        Object.keys(rawData).forEach((blockId) => {
          const normalized = normalizeBlockData(rawData[blockId]);
          normalizedData[blockId] = normalized.content; // Backward compat: return content only
        });

        return normalizedData;
      }
      return null;
    })
    .catch((error) => {
      console.error('❌ שגיאה בטעינת נתונים מ-Firebase:', error);
      return null;
    });
}

// ✅ NEW: Setup realtime listener for live updates
let realtimeListenerActive = false;
let realtimeUnsubscribe = null;

function setupRealtimeSync(onDataUpdate) {
  if (!firebaseInitialized || !database) {
    console.warn('⚠️ Firebase לא מאותחל. Realtime sync לא זמין.');
    return null;
  }

  if (realtimeListenerActive) {
    console.warn('⚠️ Realtime listener כבר פעיל');
    return realtimeUnsubscribe;
  }

  console.log('🔄 מפעיל Realtime Sync עם child_* listeners...');

  const dataRef = database.ref('guideData');

  // ✅ COMMIT 10: Use efficient child_* listeners instead of .on('value')

  // Helper function to handle individual block updates
  const handleBlockUpdate = (snapshot, eventType) => {
    if (!snapshot.exists()) return;

    const blockId = snapshot.key;
    const rawValue = snapshot.val();

    console.log(`🔄 [Realtime] ${eventType} - ${blockId}`);

    // Normalize block data
    const normalized = normalizeBlockData(rawValue);

    // Pass single-block update to callback
    if (onDataUpdate && typeof onDataUpdate === 'function') {
      const updateData = {};
      updateData[blockId] = normalized;
      onDataUpdate(updateData);
    }
  };

  // Listen to individual child events (efficient - only sends changed data)
  const childAddedListener = (snapshot) => handleBlockUpdate(snapshot, 'child_added');
  const childChangedListener = (snapshot) => handleBlockUpdate(snapshot, 'child_changed');
  const childRemovedListener = (snapshot) => {
    const blockId = snapshot.key;
    console.log(`🔄 [Realtime] child_removed - ${blockId}`);

    // Notify callback about removal
    if (onDataUpdate && typeof onDataUpdate === 'function') {
      const updateData = {};
      updateData[blockId] = null; // Signal removal
      onDataUpdate(updateData);
    }
  };

  dataRef.on('child_added', childAddedListener);
  dataRef.on('child_changed', childChangedListener);
  dataRef.on('child_removed', childRemovedListener);

  realtimeListenerActive = true;

  // Return unsubscribe function
  realtimeUnsubscribe = () => {
    dataRef.off('child_added', childAddedListener);
    dataRef.off('child_changed', childChangedListener);
    dataRef.off('child_removed', childRemovedListener);
    realtimeListenerActive = false;
    console.log('🛑 Realtime listener הופסק');
  };

  return realtimeUnsubscribe;
}

// Export for global access
window.setupRealtimeSync = setupRealtimeSync;

/* ============================================
   BLOCK LOCKING SYSTEM - Functions
   ============================================ */

/**
 * Try to acquire lock for a block
 * @returns {Promise<{success: boolean, lockedBy?: string}>}
 */
async function acquireLock(blockId) {
  if (!firebaseInitialized || !database) {
    return { success: false, error: 'Firebase not initialized' };
  }

  const lockRef = database.ref(`${LOCK_PATH}/${blockId}`);
  const now = Date.now();
  const lockToken = `${SESSION_ID}_${blockId}_${now}`;

  try {
    // Use transaction for atomic lock acquisition
    const result = await lockRef.transaction((currentLock) => {
      // If no lock exists, OR lock expired → acquire
      if (!currentLock || currentLock.expiresAt < Date.now()) {
        return {
          lockedBy: SESSION_ID,
          lockToken: lockToken,
          expiresAt: Date.now() + LOCK_TTL,
          heartbeatAt: Date.now(),
          acquiredAt: Date.now(),
        };
      }

      // Lock exists and not expired → abort transaction
      return undefined; // Abort (keeps existing value)
    });

    if (result.committed) {
      // Success! Start heartbeat
      startHeartbeat(blockId, lockToken);

      console.log(`🔒 [Lock] נעל בלוק: ${blockId}`);
      return { success: true, lockToken };
    } else {
      // Lock held by someone else
      const currentLock = result.snapshot.val();
      console.log(`⛔ [Lock] בלוק נעול על ידי: ${currentLock.lockedBy}`);
      return { success: false, lockedBy: currentLock.lockedBy };
    }
  } catch (error) {
    console.error('❌ [Lock] שגיאה בנעילה:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Release lock for a block
 */
async function releaseLock(blockId) {
  if (!firebaseInitialized || !database) {
    return false;
  }

  const lockInfo = activeLocks.get(blockId);
  if (!lockInfo) {
    return false; // No active lock
  }

  // Stop heartbeat
  if (lockInfo.heartbeatInterval) {
    clearInterval(lockInfo.heartbeatInterval);
  }

  activeLocks.delete(blockId);

  // Remove lock from Firebase
  try {
    const lockRef = database.ref(`${LOCK_PATH}/${blockId}`);
    const snapshot = await lockRef.get();

    if (snapshot.exists()) {
      const currentLock = snapshot.val();

      // Only remove if we own it
      if (currentLock.lockToken === lockInfo.token) {
        await lockRef.remove();
        console.log(`🔓 [Lock] שוחרר: ${blockId}`);
        return true;
      }
    }
  } catch (error) {
    console.error('❌ [Lock] שגיאה בשחרור:', error);
  }

  return false;
}

/**
 * Start heartbeat to keep lock alive
 */
function startHeartbeat(blockId, lockToken) {
  // Clear existing heartbeat if any
  const existing = activeLocks.get(blockId);
  if (existing && existing.heartbeatInterval) {
    clearInterval(existing.heartbeatInterval);
  }

  // Start new heartbeat
  const heartbeatInterval = setInterval(async () => {
    if (!firebaseInitialized || !database) {
      clearInterval(heartbeatInterval);
      return;
    }

    try {
      const lockRef = database.ref(`${LOCK_PATH}/${blockId}`);
      const snapshot = await lockRef.get();

      if (snapshot.exists()) {
        const currentLock = snapshot.val();

        // Only update if we still own it
        if (currentLock.lockToken === lockToken) {
          await lockRef.update({
            expiresAt: Date.now() + LOCK_TTL,
            heartbeatAt: Date.now(),
          });

          console.log(`💓 [Lock] Heartbeat: ${blockId}`);
        } else {
          // We lost the lock somehow
          console.warn(`⚠️ [Lock] אבדנו את הנעילה: ${blockId}`);
          clearInterval(heartbeatInterval);
          activeLocks.delete(blockId);
        }
      } else {
        // Lock disappeared
        clearInterval(heartbeatInterval);
        activeLocks.delete(blockId);
      }
    } catch (error) {
      console.error('❌ [Lock] שגיאה ב-heartbeat:', error);
    }
  }, HEARTBEAT_INTERVAL);

  // Store lock info
  activeLocks.set(blockId, {
    token: lockToken,
    heartbeatInterval,
  });
}

/**
 * Check if block is locked by someone else
 */
async function isBlockLocked(blockId) {
  if (!firebaseInitialized || !database) {
    return { locked: false };
  }

  try {
    const lockRef = database.ref(`${LOCK_PATH}/${blockId}`);
    const snapshot = await lockRef.get();

    if (snapshot.exists()) {
      const lock = snapshot.val();
      const now = Date.now();

      // Check if expired
      if (lock.expiresAt < now) {
        // Expired - clean it up
        await lockRef.remove();
        return { locked: false };
      }

      // Check if we own it
      if (lock.lockedBy === SESSION_ID) {
        return { locked: false, ownedByUs: true };
      }

      // Locked by someone else
      return {
        locked: true,
        lockedBy: lock.lockedBy,
        expiresAt: lock.expiresAt,
      };
    }

    return { locked: false };
  } catch (error) {
    console.error('❌ [Lock] שגיאה בבדיקת נעילה:', error);
    return { locked: false, error: error.message };
  }
}

/**
 * Clean up expired locks on startup
 * This prevents stuck locks from previous sessions
 */
async function cleanupExpiredLocks() {
  if (!firebaseInitialized || !database) {
    return;
  }

  try {
    const locksRef = database.ref(LOCK_PATH);
    const snapshot = await locksRef.get();

    if (snapshot.exists()) {
      const locks = snapshot.val();
      const now = Date.now();

      // Collect expired locks
      const expiredLockIds = Object.entries(locks)
        .filter(([, lock]) => lock.expiresAt < now)
        .map(([blockId]) => blockId);

      // Remove all expired locks in parallel
      if (expiredLockIds.length > 0) {
        await Promise.all(
          expiredLockIds.map((blockId) => {
            console.log(`🧹 [Lock] Cleaned expired lock: ${blockId}`);
            return database.ref(`${LOCK_PATH}/${blockId}`).remove();
          })
        );
        console.log(`✅ [Lock] Cleaned ${expiredLockIds.length} expired locks`);
      }
    }
  } catch (error) {
    console.error('❌ [Lock] Error cleaning locks:', error);
  }
}

// Clean up expired locks when page loads
if (firebaseInitialized) {
  cleanupExpiredLocks();
}

// Release all locks on page unload
window.addEventListener('beforeunload', () => {
  activeLocks.forEach((_lockInfo, blockId) => {
    releaseLock(blockId);
  });
});

// Export lock functions
window.acquireLock = acquireLock;
window.releaseLock = releaseLock;
window.isBlockLocked = isBlockLocked;
window.cleanupExpiredLocks = cleanupExpiredLocks;

// Export functions to window for global access
window.validatePassword = validatePassword;
window.updatePassword = updatePassword;
window.initializePassword = initializePassword;
window.normalizeBlockData = normalizeBlockData;  // ✅ COMMIT 7: Export normalizer
window.saveToFirebase = saveToFirebase;
window.loadFromFirebase = loadFromFirebase;
window.deleteFromFirebase = deleteFromFirebase;
window.loadAllDataFromFirebase = loadAllDataFromFirebase;
