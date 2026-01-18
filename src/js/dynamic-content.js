/**
 * Dynamic Content Management System
 * מערכת ניהול תוכן דינמית - מחיקה והוספה של פריטים
 *
 * Version: 1.0.0 (Pilot)
 * Date: 2026-01-17
 * Scope: מידע כללי בלבד (pilot)
 */

class DynamicContentManager {
  constructor() {
    this.editModeActive = false;
    this.initialized = false;
  }

  /**
   * אתחול המערכת
   */
  async init() {
    if (this.initialized) return;

    console.log('🚀 Dynamic Content Manager: Initializing...');

    // המתן לטעינת Firebase
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase not loaded!');
      return;
    }

    // האזן לאירוע tabLoaded כדי להריץ assignItemIds + loadDeletedItems + loadDynamicItems
    document.addEventListener('tabLoaded', async (event) => {
      if (event.detail.tabId === 'general-info') {
        console.log('📝 Tab general-info loaded - assigning IDs, loading dynamic items, and deleted items...');

        // טען פריטים דינמיים שנוספו (לפני assignItemIds!)
        await this.loadDynamicItems();

        // הוסף data-item-id לכל הפריטים הקיימים
        this.assignItemIds();

        // טען רשימת פריטים מחוקים והסתר אותם
        await this.loadDeletedItems();

        console.log('✅ Dynamic Content ready for general-info');
      }
    });

    this.initialized = true;
    console.log('✅ Dynamic Content Manager: Ready');
  }

  /**
   * הוסף data-item-id לכל הפריטים הקיימים (אם אין להם)
   */
  assignItemIds() {
    const generalInfoTab = document.getElementById('general-info');
    if (!generalInfoTab) return;

    const items = generalInfoTab.querySelectorAll('.linear-item');
    items.forEach(item => {
      // אם כבר יש מזהה, דלג
      if (item.getAttribute('data-item-id')) return;

      // צור מזהה ייחודי מכל השדות בפריט (לא רק הראשון!)
      const fields = item.querySelectorAll('[data-field]');
      const fieldIds = Array.from(fields)
        .map(f => f.getAttribute('data-field'))
        .filter(Boolean)
        .join('_');

      if (fieldIds) {
        item.setAttribute('data-item-id', fieldIds);
      }
    });

    console.log(`✅ Assigned IDs to ${items.length} items`);
  }

  /**
   * טעינת פריטים דינמיים שנוספו
   */
  async loadDynamicItems() {
    try {
      console.log('🔄 loadDynamicItems: Starting...');

      const snapshot = await firebase.database()
        .ref('dynamicItems')
        .once('value');

      const dynamicItems = snapshot.val() || {};
      console.log('📦 dynamicItems from Firebase:', dynamicItems);
      console.log('📦 dynamicItems type:', typeof dynamicItems);
      console.log('📦 dynamicItems keys:', Object.keys(dynamicItems));

      // בדוק אם יש פריטים דינמיים בכלל
      const itemIds = Object.keys(dynamicItems);
      if (itemIds.length === 0) {
        console.log('ℹ️ No dynamic items to load (empty object)');
        return;
      }

      // מצא את הגריד של צוות תל-אביב (זה האזור הראשון שבו מוסיפים פריטים)
      const generalInfoTab = document.getElementById('general-info');
      if (!generalInfoTab) {
        console.log('⚠️ general-info tab not found');
        return;
      }

      // מצא את הגריד הראשון (ta-staff)
      const taStaffGrid = generalInfoTab.querySelector('[data-section-id="ta-staff"]');
      if (!taStaffGrid) {
        console.log('⚠️ ta-staff section not found');
        return;
      }

      console.log(`📍 Found taStaffGrid, loading ${itemIds.length} items...`);

      // צור כל פריט דינמי
      itemIds.forEach(itemId => {
        const itemData = dynamicItems[itemId];
        console.log(`  🔨 Creating item: ${itemId}`, itemData);

        // צור את הפריט
        const newItem = this.createLinearItem({
          labelFieldId: itemData.labelFieldId,
          fieldId: itemData.fieldId,
          label: itemData.label,
          value: itemData.value,
          phone: itemData.phone
        });

        // הוסף data-item-id
        newItem.setAttribute('data-item-id', itemId);

        // הוסף ל-DOM
        taStaffGrid.appendChild(newItem);

        // צרף autosave
        this.attachAutosaveToNewItem(newItem);

        console.log(`  ✅ Loaded dynamic item: ${itemId}`);
      });

      console.log(`✅ Loaded ${itemIds.length} dynamic items successfully`);
    } catch (error) {
      console.error('❌ Error loading dynamic items:', error);
    }
  }

  /**
   * טעינת פריטים מחוקים והסתרתם
   */
  async loadDeletedItems() {
    try {
      const snapshot = await firebase.database()
        .ref('deletedItems')
        .once('value');

      const deletedItems = snapshot.val() || {};

      // הסתר כל פריט שנמחק
      Object.keys(deletedItems).forEach(itemId => {
        const item = document.querySelector(`[data-item-id="${itemId}"]`);
        if (item) {
          item.remove();
          console.log(`🗑️ Hiding deleted item: ${itemId}`);
        }
      });

      console.log(`✅ Loaded ${Object.keys(deletedItems).length} deleted items`);
    } catch (error) {
      console.error('❌ Error loading deleted items:', error);
    }
  }

  /**
   * הפעלת/כיבוי מצב עריכה דינמית
   */
  toggleDynamicEditMode(active) {
    this.editModeActive = active;

    if (active) {
      this.showDynamicControls();
    } else {
      this.hideDynamicControls();
    }
  }

  /**
   * הצגת כפתורי מחיקה והוספה
   */
  showDynamicControls() {
    console.log('📝 Showing dynamic controls...');

    // הוסף כפתורי מחיקה לפריטים קיימים
    this.addDeleteButtons();

    // הוסף כפתורי "הוסף חדש"
    this.addNewItemButtons();
  }

  /**
   * הסתרת כפתורי ניהול
   */
  hideDynamicControls() {
    console.log('🔒 Hiding dynamic controls...');

    // הסר כל כפתורי המחיקה
    document.querySelectorAll('.dynamic-delete-btn').forEach(btn => {
      btn.remove();
    });

    // הסר כל ה-wrappers של כפתורי ההוספה
    document.querySelectorAll('.dynamic-add-section').forEach(wrapper => {
      wrapper.remove();
    });
  }

  /**
   * הוספת כפתורי מחיקה לכל הפריטים
   */
  addDeleteButtons() {
    // מצא את כל הפריטים בטאב "מידע כללי"
    const generalInfoTab = document.getElementById('general-info');
    if (!generalInfoTab) return;

    const items = generalInfoTab.querySelectorAll('.linear-item');

    items.forEach((item, index) => {
      // בדוק אם כבר יש כפתור מחיקה
      if (item.querySelector('.dynamic-delete-btn')) return;

      // צור כפתור מחיקה
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'dynamic-delete-btn';
      deleteBtn.innerHTML = '❌';
      deleteBtn.title = 'מחק פריט זה';
      deleteBtn.setAttribute('data-item-index', index);

      // הוסף event listener
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteItem(item, index);
      });

      // הוסף את הכפתור לפריט
      item.style.position = 'relative';
      item.appendChild(deleteBtn);
    });

    console.log(`✅ Added delete buttons to ${items.length} items`);
  }

  /**
   * הוספת כפתורי "הוסף חדש"
   */
  addNewItemButtons() {
    // מצא את כל הסקציות בטאב "מידע כללי"
    const generalInfoTab = document.getElementById('general-info');
    if (!generalInfoTab) return;

    // מצא את כל הקטגוריות (sections) עם grid שמכיל linear-item
    const sections = generalInfoTab.querySelectorAll('.grid');

    sections.forEach((section, sectionIndex) => {
      // בדוק אם יש linear-item בסקציה (מסנן grid שלא רלוונטי)
      if (!section.querySelector('.linear-item')) return;

      // בדוק אם כבר יש wrapper של dynamic-add-section אחרי הגריד
      let wrapper = section.nextElementSibling;
      if (wrapper && wrapper.classList.contains('dynamic-add-section')) return;

      // צור wrapper
      wrapper = document.createElement('div');
      wrapper.className = 'dynamic-add-section';

      // צור כפתור הוספה
      const addBtn = document.createElement('button');
      addBtn.className = 'dynamic-add-btn';
      addBtn.textContent = 'הוסף פריט חדש';
      addBtn.setAttribute('data-section-index', sectionIndex);

      // הוסף event listener
      addBtn.addEventListener('click', () => {
        this.showAddItemModal(section, sectionIndex);
      });

      // הוסף את הכפתור ל-wrapper
      wrapper.appendChild(addBtn);

      // הוסף את ה-wrapper אחרי הגריד
      section.parentNode.insertBefore(wrapper, section.nextSibling);
    });

    console.log(`✅ Added "Add New" buttons to ${sections.length} sections`);
  }

  /**
   * מחיקת פריט
   */
  async deleteItem(itemElement, itemIndex) {
    // בקש אישור
    const confirmed = confirm('❓ האם אתה בטוח שברצונך למחוק פריט זה?\n\nהמחיקה תהיה קבועה!');

    if (!confirmed) {
      console.log('⏭️ Deletion cancelled');
      return;
    }

    try {
      console.log(`🗑️ Deleting item ${itemIndex}...`);

      // קבל את המזהה הייחודי של הפריט (צריך להיות כבר מוגדר מ-assignItemIds)
      let itemId = itemElement.getAttribute('data-item-id');
      if (!itemId) {
        // אם אין מזהה, צור אחד מכל השדות (כמו assignItemIds)
        const fields = itemElement.querySelectorAll('[data-field]');
        itemId = Array.from(fields)
          .map(f => f.getAttribute('data-field'))
          .filter(Boolean)
          .join('_');

        if (!itemId) {
          itemId = `item_${Date.now()}`;
        }
        itemElement.setAttribute('data-item-id', itemId);
      }

      // מצא את השדות עם data-field בפריט
      const fields = itemElement.querySelectorAll('[data-field]');

      // אנימציית fade out
      itemElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      itemElement.style.opacity = '0.3';
      itemElement.style.transform = 'scale(0.95)';

      // מחק מ-Firebase (אם יש data-field)
      const deletePromises = [];

      // 1. מחק את כל השדות
      fields.forEach(field => {
        const fieldName = field.getAttribute('data-field');
        if (fieldName) {
          const deletePromise = firebase.database()
            .ref(`guideData/${fieldName}`)
            .remove();
          deletePromises.push(deletePromise);
          console.log(`  🗑️ Deleting field from Firebase: ${fieldName}`);
        }
      });

      // 2. מחק מ-dynamicItems אם זה פריט דינמי
      if (itemId.includes('general_dynamic_')) {
        const deleteDynamicPromise = firebase.database()
          .ref(`dynamicItems/${itemId}`)
          .remove();
        deletePromises.push(deleteDynamicPromise);
        console.log(`  🗑️ Deleting from dynamicItems: ${itemId}`);
      }

      // 3. סמן את הפריט כמחוק
      const markDeletedPromise = firebase.database()
        .ref(`deletedItems/${itemId}`)
        .set({
          timestamp: Date.now(),
          deletedBy: 'user'
        });
      deletePromises.push(markDeletedPromise);
      console.log(`  🗑️ Marking item as deleted: ${itemId}`);

      // המתן לכל המחיקות
      await Promise.all(deletePromises);

      // המתן קצת לאנימציה
      await new Promise(resolve => setTimeout(resolve, 300));

      // הסר מה-DOM
      itemElement.remove();

      console.log(`✅ Item ${itemIndex} deleted successfully!`);

      // הצג הודעה
      this.showNotification('✅ הפריט נמחק בהצלחה!', 'success');

    } catch (error) {
      console.error('❌ Error deleting item:', error);

      // שחזר את האנימציה
      itemElement.style.opacity = '1';
      itemElement.style.transform = 'scale(1)';

      alert('❌ שגיאה! לא ניתן למחוק את הפריט.\n\nנסה שוב או רענן את הדף.');
    }
  }

  /**
   * הצגת modal להוספת פריט חדש
   */
  showAddItemModal(sectionElement, sectionIndex) {
    console.log(`➕ Opening add item modal for section ${sectionIndex}`);

    // בדוק אם כבר יש modal פתוח
    const existingModal = document.querySelector('.add-item-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // צור modal
    const modal = document.createElement('div');
    modal.className = 'add-item-modal-overlay';
    modal.innerHTML = `
      <div class="add-item-modal">
        <h3>➕ הוסף פריט חדש</h3>

        <div class="modal-field">
          <label>כותרת (למשל: עו"ד, מזכירה)</label>
          <input type="text" id="new-item-label" placeholder='לדוגמה: עו"ד' />
        </div>

        <div class="modal-field">
          <label>תוכן (שם + טלפון)</label>
          <input type="text" id="new-item-value" placeholder="לדוגמה: יוסי כהן - 050-1234567" />
        </div>

        <div class="modal-field">
          <label>טלפון לWhatsApp (אופציונלי)</label>
          <input type="tel" id="new-item-phone" placeholder="050-1234567" />
        </div>

        <div class="modal-actions">
          <button class="modal-btn modal-btn-primary" id="save-new-item">
            💾 שמור
          </button>
          <button class="modal-btn modal-btn-secondary" id="cancel-new-item">
            ❌ ביטול
          </button>
        </div>
      </div>
    `;

    // הוסף ל-body
    document.body.appendChild(modal);

    // Focus על השדה הראשון
    setTimeout(() => {
      document.getElementById('new-item-label')?.focus();
    }, 100);

    // Event listeners
    document.getElementById('save-new-item').addEventListener('click', () => {
      this.saveNewItem(sectionElement, sectionIndex);
    });

    document.getElementById('cancel-new-item').addEventListener('click', () => {
      modal.remove();
    });

    // סגירה עם ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // סגירה בלחיצה על הרקע
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * שמירת פריט חדש
   */
  async saveNewItem(sectionElement, sectionIndex) {
    // קרא ערכים מהטופס
    const label = document.getElementById('new-item-label')?.value.trim();
    const value = document.getElementById('new-item-value')?.value.trim();
    const phone = document.getElementById('new-item-phone')?.value.trim();

    // ולידציה
    if (!label || !value) {
      alert('⚠️ יש למלא לפחות את הכותרת והתוכן!');
      return;
    }

    try {
      console.log('💾 Saving new item...', { label, value, phone });

      // צור ID ייחודי
      const timestamp = Date.now();
      const fieldId = `general_dynamic_${timestamp}`;
      const labelFieldId = `${fieldId}_label`;

      // צור את הפריט החדש
      const newItem = this.createLinearItem({
        labelFieldId,
        fieldId,
        label,
        value,
        phone
      });

      // הוסף data-item-id (למחיקה עתידית)
      const itemId = `${labelFieldId}_${fieldId}`;
      newItem.setAttribute('data-item-id', itemId);

      // הוסף ל-DOM (בסוף הגריד)
      sectionElement.appendChild(newItem);

      // שמור ב-Firebase
      console.log(`💾 Saving to Firebase:
  - guideData/${labelFieldId}
  - guideData/${fieldId}
  - dynamicItems/${itemId}`);

      const savePromises = [
        // שמור את התוכן של השדות
        firebase.database().ref(`guideData/${labelFieldId}`).set({
          content: label,
          updatedAt: timestamp
        }),
        firebase.database().ref(`guideData/${fieldId}`).set({
          content: value,
          updatedAt: timestamp
        }),
        // שמור metadata של הפריט הדינמי (כדי לטעון אותו אחרי רענון!)
        firebase.database().ref(`dynamicItems/${itemId}`).set({
          labelFieldId,
          fieldId,
          label,
          value,
          phone: phone || '',
          timestamp,
          createdBy: 'user'
        })
      ];

      await Promise.all(savePromises);
      console.log(`✅ All Firebase saves completed for item ${itemId}`);

      // צרף autosave לשדות החדשים
      this.attachAutosaveToNewItem(newItem);

      // הוסף כפתור מחיקה (יוסף רק במצב עריכה)
      if (this.editModeActive) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'dynamic-delete-btn';
        deleteBtn.innerHTML = '❌';
        deleteBtn.title = 'מחק פריט זה';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteItem(newItem, -1);
        });
        newItem.appendChild(deleteBtn);
      }

      // סגור modal
      document.querySelector('.add-item-modal-overlay')?.remove();

      // הצג הודעה
      this.showNotification('✅ הפריט נוסף בהצלחה!', 'success');

      console.log('✅ New item saved successfully!');

    } catch (error) {
      console.error('❌ Error saving new item:', error);
      alert('❌ שגיאה בשמירת הפריט!\n\nנסה שוב.');
    }
  }

  /**
   * יצירת פריט HTML חדש
   */
  createLinearItem(data) {
    const { labelFieldId, fieldId, label, value, phone } = data;

    const item = document.createElement('div');
    item.className = 'copy-btn-container linear-item';
    item.style.position = 'relative';

    // אייקון ברירת מחדל
    const iconSvg = `
      <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%">
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
      </svg>
    `;

    // כפתור WhatsApp (אם יש טלפון)
    const whatsappBtn = phone ? `
      <button class="whatsapp-btn" onclick="openWhatsApp('${phone}')" title="פתח וואטסאפ">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>
    ` : '';

    item.innerHTML = `
      <div class="linear-item-icon">
        ${iconSvg}
      </div>
      <div class="linear-item-content">
        <div class="linear-item-label editable" data-field="${labelFieldId}" contenteditable="true">
          ${label}
        </div>
        <div class="linear-item-value editable" data-field="${fieldId}" contenteditable="true">
          ${whatsappBtn}
          ${value}
        </div>
      </div>
      <button class="copy-btn" onclick="copyToClipboard('${value.replace(/'/g, "\\'")}')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
        </svg>
      </button>
    `;

    return item;
  }

  /**
   * צירוף autosave לפריט חדש
   */
  attachAutosaveToNewItem(itemElement) {
    if (typeof window.AutosaveManager === 'undefined') {
      console.warn('⚠️ AutosaveManager not found');
      return;
    }

    const editableFields = itemElement.querySelectorAll('[data-field][contenteditable="true"]');

    editableFields.forEach(field => {
      const fieldName = field.getAttribute('data-field');
      if (fieldName) {
        // הוסף למפה של AutosaveManager
        window.AutosaveManager.editableFields.set(fieldName, field);

        // צרף listeners
        window.AutosaveManager.attachFieldListeners(field, fieldName);

        console.log(`  ✅ Attached autosave to: ${fieldName}`);
      }
    });
  }

  /**
   * הצגת הודעה קצרה
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `dynamic-notification dynamic-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // הצג
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // הסתר והסר
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// חשוף את המחלקה ל-window (main.js יצור instance)
window.DynamicContentManager = DynamicContentManager;

console.log('📦 Dynamic Content Manager class loaded');
