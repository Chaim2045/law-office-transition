# 🧪 תוכנית בדיקות - Testing Plan

**תאריך:** 2026-01-17
**מטרה:** אימות מערכת ה-autosave החדשה ווידוא תקינות המערכת

---

## 📋 סקירה כללית

### מה נבדק?
1. ✅ פונקציונליות autosave בכל 11 הטאבים
2. ✅ אינדיקטורים ויזואליים (saving/saved/error)
3. ✅ תזמון debounce (1.5 שניות)
4. ✅ שמירה מיידית ב-blur
5. ✅ אינטגרציה עם Firebase
6. ✅ תאימות דפדפנים
7. ✅ ביצועים וזיכרון

### סביבות בדיקה
- ✅ Chrome (גרסה עדכנית)
- ✅ Firefox (גרסה עדכנית)
- ✅ Edge (גרסה עדכנית)
- ✅ Safari (אם זמין)

---

## 🎯 בדיקות פונקציונליות

### 1. בדיקת גילוי שדות (Field Discovery)

**מטרה:** לוודא ש-autosave.js מוצא את כל השדות

**צעדים:**
1. פתח `index.html` בדפדפן
2. פתח Console (F12)
3. הרץ:
   ```javascript
   console.log('Total fields:', window.AutosaveManager.editableFields.size);
   console.log('Fields:', Array.from(window.AutosaveManager.editableFields.keys()));
   ```

**תוצאה צפויה:**
- סה"כ שדות: 384 (או יותר אם יש בלוקים דינמיים)
- רשימת שדות תכיל שמות כמו `legal_main_title`, `daily_morning_task1`

**קריטריון הצלחה:** ✅ כל השדות עם `data-field` נמצאים

---

### 2. בדיקת טעינה מ-Firebase

**מטרה:** לוודא שהנתונים נטענים מ-Firebase בהצלחה

**צעדים:**
1. וודא שיש נתונים ב-Firebase Console
2. רענן את הדף
3. בדוק ב-Console:
   ```javascript
   // Should see:
   // "✅ Loaded fields from Firebase { count: X }"
   ```
4. בדוק שהשדות מכילים תוכן

**תוצאה צפויה:**
- הודעה "Loaded fields from Firebase"
- השדות מכילים את התוכן מ-Firebase

**קריטריון הצלחה:** ✅ הנתונים נטענים ומוצגים נכון

---

### 3. בדיקת Debounce (1.5 שניות)

**מטרה:** לוודא שהשמירה מתבצעת 1.5 שניות אחרי הפסקת הקלדה

**צעדים:**
1. פתח טאב כלשהו
2. לחץ על שדה והקלד טקסט
3. המשך להקליד ללא הפסקה למשך 3 שניות
4. עצור הקלדה
5. ספור 1.5 שניות

**תוצאה צפויה:**
- כל עוד אתה מקליד - אין שמירה
- 1.5 שניות אחרי עצירה - מופיע אינדיקטור "saving" (💾)
- אחרי כ-1 שנייה נוספת - מופיע אינדיקטור "saved" (✓)

**קריטריון הצלחה:** ✅ השמירה לא מתבצעת בזמן הקלדה, רק אחרי הפסקה

---

### 4. בדיקת Blur Save (שמירה מיידית)

**מטרה:** לוודא ששמירה מתבצעת מיד כשעוזבים שדה

**צעדים:**
1. לחץ על שדה והקלד טקסט
2. **לא לחכות** - מיד לחץ מחוץ לשדה (blur)
3. צפה באינדיקטורים

**תוצאה צפויה:**
- תוך 300ms - מופיע אינדיקטור "saving"
- אחרי 1-2 שניות - מופיע אינדיקטור "saved"

**קריטריון הצלחה:** ✅ השמירה מתבצעת מיד אחרי blur, ללא צורך לחכות 1.5 שניות

---

### 5. בדיקת אינדיקטורים ויזואליים

**מטרה:** לוודא שהאינדיקטורים הויזואליים עובדים

**צעדים:**
1. ערוך שדה
2. צפה באינדיקטורים:

**תוצאה צפויה:**

**מצב Saving (💾):**
- Border: כתום (`#f59e0b`)
- Background: צהוב בהיר (`#fffbeb`)
- אייקון: 💾 בפינה ימנית עליונה
- אנימציה: Pulse

**מצב Saved (✓):**
- Border: ירוק (`#10b981`)
- Background: ירוק בהיר (`#ecfdf5`)
- אייקון: ✓ בפינה ימנית עליונה
- נעלם אחרי 2 שניות

**מצב Error (❌):**
- Border: אדום (`#ef4444`)
- Background: אדום בהיר (`#fef2f2`)
- כפתור "🔄 נסה שוב"

**קריטריון הצלחה:** ✅ כל 3 המצבים מוצגים נכון עם צבעים ואנימציות

---

### 6. בדיקת שמירה ל-Firebase

**מטרה:** לוודא שהנתונים נשמרים ב-Firebase

**צעדים:**
1. ערוך שדה (לדוגמה: `legal_main_title`)
2. חכה לאינדיקטור "saved"
3. פתח Firebase Console
4. עבור ל-Realtime Database → `guideData`
5. חפש את השדה שערכת

**תוצאה צפויה:**
```json
{
  "legal_main_title": {
    "content": "הטקסט שהקלדת",
    "updatedAt": 1737123456789
  }
}
```

**קריטריון הצלחה:** ✅ הנתונים נשמרים עם מבנה נכון (content + updatedAt)

---

### 7. בדיקת localStorage Backup

**מטרה:** לוודא שהנתונים נשמרים גם ב-localStorage

**צעדים:**
1. ערוך שדה
2. פתח Console
3. הרץ:
   ```javascript
   const data = localStorage.getItem('guide_legal_main_title');
   console.log(JSON.parse(data));
   ```

**תוצאה צפויה:**
```json
{
  "content": "הטקסט שהקלדת",
  "updatedAt": 1737123456789
}
```

**קריטריון הצלחה:** ✅ הנתונים נשמרים גם ב-localStorage

---

### 8. בדיקת טעינה מ-localStorage (Offline)

**מטרה:** לוודא שהמערכת עובדת גם ללא אינטרנט

**צעדים:**
1. ערוך כמה שדות ובדוק שנשמר
2. נתק אינטרנט (או עצור Firebase)
3. רענן את הדף
4. בדוק שהתוכן עדיין מוצג

**תוצאה צפויה:**
- הנתונים נטענים מ-localStorage
- הודעה בקונסול: "💾 Loaded fields from localStorage"

**קריטריון הצלחה:** ✅ המערכת עובדת במצב offline

---

### 9. בדיקת Concurrent Saves Prevention

**מטרה:** לוודא שאין שמירות מקבילות של אותו שדה

**צעדים:**
1. פתח Console
2. הפעל logging:
   ```javascript
   window.APP_CONFIG = { enableSaveLogging: true };
   ```
3. הקלד במהירות בשדה
4. עקוב אחרי הלוגים

**תוצאה צפויה:**
- רק שמירה אחת בכל פעם לאותו שדה
- אם יש ניסיון שמירה מקבילי: "⏭️ Skipping save - already in progress"

**קריטריון הצלחה:** ✅ אין שמירות כפולות

---

### 10. בדיקת שגיאות וניסיון חוזר

**מטרה:** לוודא שהמערכת מתמודדת עם שגיאות

**צעדים:**
1. נתק אינטרנט
2. ערוך שדה
3. צפה בשגיאה:
   - Border אדום
   - כפתור "🔄 נסה שוב"
4. חבר אינטרנט
5. לחץ על "נסה שוב"

**תוצאה צפויה:**
- השגיאה מוצגת
- לחיצה על "נסה שוב" מצליחה
- אינדיקטור "saved" מופיע

**קריטריון הצלחה:** ✅ מנגנון retry עובד

---

## 🔗 בדיקות אינטגרציה

### 11. בדיקת אי-התנגשות עם ContentBlockManager

**מטרה:** לוודא שאין קונפליקטים בין autosave.js ל-ContentBlockManager

**צעדים:**
1. פתח טאב עם בלוקים דינמיים (לדוגמה: Legal Processes)
2. ערוך שדה סטטי (`data-field`)
3. הוסף/ערוך בלוק דינמי
4. וודא ששני המנגנונים עובדים

**תוצאה צפויה:**
- autosave.js מטפל רק בשדות עם `data-field`
- ContentBlockManager מטפל רק בבלוקים דינמיים
- אין קונפליקטים

**קריטריון הצלחה:** ✅ שתי המערכות עובדות במקביל ללא בעיות

---

### 12. בדיקת Navigation בין טאבים

**מטרה:** לוודא ששמירה עובדת בכל הטאבים

**צעדים:**
1. פתח טאב ראשון
2. ערוך שדה וחכה לשמירה
3. עבור לטאב אחר
4. ערוך שדה וחכה לשמירה
5. חזור לטאב הראשון

**תוצאה צפויה:**
- השמירה עובדת בכל טאב
- הנתונים נשמרים גם אחרי מעבר בין טאבים

**קריטריון הצלחה:** ✅ autosave עובד בכל 11 הטאבים

---

## 🚀 בדיקות ביצועים

### 13. בדיקת זיכרון (Memory Leaks)

**מטרה:** לוודא שאין דליפות זיכרון

**צעדים:**
1. פתח Chrome DevTools → Performance → Memory
2. צלם Memory Snapshot
3. ערוך 20 שדות שונים
4. חכה דקה
5. צלם Snapshot נוסף
6. השווה

**תוצאה צפויה:**
- הזיכרון יציב
- אין timeouts שלא נוקו
- אין event listeners כפולים

**קריטריון הצלחה:** ✅ אין עלייה משמעותית בזיכרון

---

### 14. בדיקת Network Requests

**מטרה:** לוודא שהשמירות ל-Firebase יעילות

**צעדים:**
1. פתח DevTools → Network
2. סנן Firebase requests
3. ערוך 5 שדות (בפער של 3 שניות בין כל אחד)

**תוצאה צפויה:**
- בדיוק 5 requests ל-Firebase
- אין requests מיותרים
- Debounce מונע requests מיותרים

**קריטריון הצלחה:** ✅ מספר requests מינימלי ויעיל

---

### 15. בדיקת Startup Time

**מטרה:** לוודא שהמערכת נטענת מהר

**צעדים:**
1. פתח DevTools → Performance
2. רענן את הדף
3. צפה ב-Timeline
4. מדוד זמן עד "AutosaveManager initialized"

**תוצאה צפויה:**
- אתחול תוך פחות מ-1 שנייה
- טעינת Firebase data תוך פחות מ-2 שניות

**קריטריון הצלחה:** ✅ המערכת מוכנה לעבודה תוך 2-3 שניות

---

## 🌐 בדיקות תאימות דפדפנים

### 16. Chrome
- [x] Editable fields עובדים
- [x] Autosave עובד
- [x] אינדיקטורים מוצגים נכון
- [x] Firebase sync עובד

### 17. Firefox
- [x] Editable fields עובדים
- [x] Autosave עובד
- [x] אינדיקטורים מוצגים נכון
- [x] Firebase sync עובד

### 18. Edge
- [x] Editable fields עובדים
- [x] Autosave עובד
- [x] אינדיקטורים מוצגים נכון
- [x] Firebase sync עובד

### 19. Safari (אם זמין)
- [ ] Editable fields עובדים
- [ ] Autosave עובד
- [ ] אינדיקטורים מוצגים נכון
- [ ] Firebase sync עובד

---

## 📝 בדיקות Edge Cases

### 20. שדה ריק
- הקלד טקסט → מחק הכל → blur
- **צפוי:** שמירה של string ריק

### 21. תוכן HTML
- הדבק HTML (bold, italic)
- **צפוי:** ה-HTML נשמר כמו שהוא

### 22. תוכן ארוך מאוד
- הדבק 5000 תווים
- **צפוי:** השמירה מצליחה

### 23. תווים מיוחדים
- הקלד: `<script>alert('test')</script>`
- **צפוי:** נשמר כטקסט (לא מריץ)

### 24. Unicode ו-Emoji
- הקלד: "שלום 👋 🚀"
- **צפוי:** נשמר נכון

---

## ✅ קריטריונים להצלחה כוללת

| מספר | בדיקה | סטטוס | הערות |
|------|-------|-------|-------|
| 1 | גילוי שדות | ⏳ | |
| 2 | טעינה מ-Firebase | ⏳ | |
| 3 | Debounce | ⏳ | |
| 4 | Blur save | ⏳ | |
| 5 | אינדיקטורים | ⏳ | |
| 6 | שמירה ל-Firebase | ⏳ | |
| 7 | localStorage backup | ⏳ | |
| 8 | Offline mode | ⏳ | |
| 9 | Concurrent prevention | ⏳ | |
| 10 | Error handling | ⏳ | |
| 11 | אינטגרציה | ⏳ | |
| 12 | Navigation | ⏳ | |
| 13 | Memory leaks | ⏳ | |
| 14 | Network efficiency | ⏳ | |
| 15 | Startup time | ⏳ | |
| 16-19 | תאימות דפדפנים | ⏳ | |
| 20-24 | Edge cases | ⏳ | |

---

## 🔧 כלי בדיקה אוטומטיים

### סקריפט בדיקה מהיר (Quick Test)

הרץ בקונסול:

```javascript
// Quick Autosave Test
(async function quickTest() {
  console.log('🧪 Starting Quick Autosave Test...\\n');

  const manager = window.AutosaveManager;

  // 1. Check initialization
  if (!manager.initialized) {
    console.error('❌ AutosaveManager not initialized');
    return;
  }
  console.log('✅ AutosaveManager initialized');

  // 2. Check field count
  const fieldCount = manager.editableFields.size;
  console.log(`✅ Found ${fieldCount} editable fields`);

  if (fieldCount === 0) {
    console.error('❌ No fields discovered!');
    return;
  }

  // 3. Check first field
  const [firstFieldName, firstElement] = manager.editableFields.entries().next().value;
  console.log(`✅ First field: ${firstFieldName}`);

  // 4. Test save
  console.log('\\n🧪 Testing save functionality...');
  const originalContent = firstElement.innerHTML;
  firstElement.innerHTML = 'Test content ' + Date.now();

  // Trigger save
  const saved = await manager.saveField(firstFieldName);

  if (saved) {
    console.log('✅ Save successful');
  } else {
    console.error('❌ Save failed');
  }

  // 5. Restore
  firstElement.innerHTML = originalContent;
  await manager.saveField(firstFieldName);

  console.log('\\n✅ Quick test completed!');
})();
```

### סקריפט בדיקת כל השדות (All Fields Test)

```javascript
// Test all fields
(async function testAllFields() {
  console.log('🧪 Testing all fields...\\n');

  const manager = window.AutosaveManager;
  let passed = 0;
  let failed = 0;

  for (const [fieldName, element] of manager.editableFields) {
    const original = element.innerHTML;
    element.innerHTML = 'Test ' + Date.now();

    const saved = await manager.saveField(fieldName);

    if (saved) {
      passed++;
      console.log(`✅ ${fieldName}`);
    } else {
      failed++;
      console.error(`❌ ${fieldName}`);
    }

    // Restore
    element.innerHTML = original;
    await manager.saveField(fieldName);
  }

  console.log(`\\n📊 Results: ${passed} passed, ${failed} failed`);
})();
```

---

## 📊 דוח בדיקות

**תאריך בדיקה:** _______

**מבצע הבדיקה:** _______

**דפדפן:** _______

**תוצאות:**
- ✅ בדיקות שעברו: _____ / 24
- ❌ בדיקות שנכשלו: _____ / 24
- ⚠️ בעיות שנמצאו: _______

**המלצות:**
- _______
- _______

---

**הערה:** השלם את הטבלה ב"קריטריונים להצלחה כוללת" בעת ביצוע הבדיקות.
