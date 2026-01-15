/**
 * Content Editor System
 * מערכת עריכת תוכן מתקדמת עם Rich Text Editor
 *
 * תכונות:
 * - הוספת בלוקי תוכן בכל מקום
 * - עורך טקסט עשיר עם toolbar
 * - תמיכה בכותרות, פסקאות, ורשימות
 * - גרירה וסידור בלוקים
 * - שמירה ל-Firebase + localStorage
 */

/* ============================================
   1. ContentBlockManager - מנהל בלוקי התוכן
   ============================================ */

class ContentBlockManager {
  constructor() {
    this.blocks = new Map(); // Map של כל הבלוקים
    this.activeEditor = null; // העורך הפעיל כרגע
    this.blockCounter = 0; // מונה לID ייחודי
    this.editMode = false;
  }

  /**
   * אתחול המערכת
   */
  async init() {
    await this.loadExistingBlocks();
    await this.loadBlocksFromFirebase();
    this.setupEventListeners();
    this.setupRealtimeSync(); // ✅ NEW: Start realtime listener
    console.log('✅ ContentBlockManager initialized');
  }

  /**
   * Setup realtime sync with Firebase
   */
  setupRealtimeSync() {
    if (typeof window.setupRealtimeSync !== 'function') {
      console.warn('⚠️ setupRealtimeSync לא זמין');
      return;
    }

    // Setup listener with update handler
    window.setupRealtimeSync((data) => {
      this.handleRealtimeUpdate(data);
    });
  }

  /**
   * Handle realtime updates from Firebase
   * Anti-flicker: Don't update blocks currently being edited
   */
  handleRealtimeUpdate(firebaseData) {
    if (!firebaseData) return;

    // Track which blocks were updated
    const updatedBlocks = [];

    // Update each block if changed
    Object.keys(firebaseData).forEach((key) => {
      // Skip metadata
      if (key.startsWith('meta_')) return;

      // Only update content blocks
      if (key.startsWith('block_')) {
        const blockId = key;
        const newContent = firebaseData[blockId];
        const block = this.blocks.get(blockId);

        if (block && block.content) {
          const currentContent = block.content.innerHTML;

          // ✅ ANTI-FLICKER: Don't update if:
          // 1. Block is being saved right now (pendingSaves has it)
          // 2. Block is actively being edited (has focus)
          // 3. Content hasn't actually changed
          if (this.pendingSaves && this.pendingSaves.has(blockId)) {
            if (window.APP_CONFIG.enableSaveLogging) {
              console.log(`⏭️ [Realtime] Skipping ${blockId} - currently saving`);
            }
            return;
          }

          if (document.activeElement && document.activeElement.closest(`[data-block-id="${blockId}"]`)) {
            if (window.APP_CONFIG.enableSaveLogging) {
              console.log(`⏭️ [Realtime] Skipping ${blockId} - user is editing`);
            }
            return;
          }

          if (currentContent === newContent) {
            // No change, skip
            return;
          }

          // ✅ SAFE TO UPDATE
          block.content.innerHTML = newContent;
          localStorage.setItem(`guide_${blockId}`, newContent);
          updatedBlocks.push(blockId);

          // Brief highlight to show it updated
          block.element.classList.add('block-updated-remotely');
          setTimeout(() => {
            block.element.classList.remove('block-updated-remotely');
          }, 1500);
        }
      }
    });

    if (updatedBlocks.length > 0 && window.APP_CONFIG.enableSaveLogging) {
      console.log(`🔄 [Realtime] עודכנו ${updatedBlocks.length} בלוקים`);
    }
  }

  /**
   * טעינת בלוקים קיימים מה-DOM
   */
  loadExistingBlocks() {
    // מצא את כל ה-tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach((tab) => {
      const tabId = tab.id;
      // סמן את כל האלמנטים הקיימים כבלוקים
      this.markExistingElements(tab, tabId);
    });
  }

  /**
   * סימון אלמנטים קיימים כבלוקים
   */
  markExistingElements(container, tabId) {
    // מצא אלמנטים קיימים שצריך להיות ניתנים לעריכה
    const editableElements = container.querySelectorAll(
      '.editable, .linear-item, h2, h3, h4, p, ul, ol'
    );

    editableElements.forEach((element) => {
      if (!element.closest('.content-block')) {
        const wrapper = this.wrapInBlock(element, tabId);
        // הפוך את האלמנט לניתן לעריכה
        this.makeElementEditable(element, wrapper);
      }
    });
  }

  /**
   * עטיפת אלמנט קיים בבלוק
   */
  wrapInBlock(element, tabId) {
    const blockId = this.generateBlockId(tabId);
    const blockType = this.detectBlockType(element);
    const wrapper = document.createElement('div');
    wrapper.className = 'content-block';
    wrapper.setAttribute('data-block-id', blockId);
    wrapper.setAttribute('data-block-type', blockType);

    // עטוף את האלמנט
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // שמור בזיכרון
    this.blocks.set(blockId, {
      id: blockId,
      type: blockType,
      element: wrapper,
      content: element,
      tabId: tabId,
    });

    // ❌ לא שומרים metadata לבלוקים קיימים!
    // בלוקים קיימים מה-HTML לא צריכים metadata ב-Firebase
    // רק בלוקים שנוצרו על ידי המשתמש (עם +) צריכים metadata

    return wrapper;
  }

  /**
   * זיהוי סוג הבלוק
   */
  detectBlockType(element) {
    if (element.classList.contains('linear-item')) return 'styled-item';
    if (element.tagName === 'H2') return 'heading-2';
    if (element.tagName === 'H3') return 'heading-3';
    if (element.tagName === 'H4') return 'heading-4';
    if (element.tagName === 'P') return 'paragraph';
    if (element.tagName === 'UL') return 'bullet-list';
    if (element.tagName === 'OL') return 'number-list';
    return 'text';
  }

  /**
   * הפיכת אלמנט לניתן לעריכה
   */
  makeElementEditable(element, blockWrapper) {
    const blockType = blockWrapper.getAttribute('data-block-type');
    const blockId = blockWrapper.getAttribute('data-block-id');

    // הוסף data-field אם אין
    if (!element.getAttribute('data-field')) {
      element.setAttribute('data-field', blockId);
    }

    // הוסף class editable
    if (!element.classList.contains('editable')) {
      element.classList.add('editable');
    }

    // הוסף event listener לעריכה בלחיצה
    element.addEventListener('click', (e) => {
      if (this.editMode) {
        e.stopPropagation();
        if (['paragraph', 'heading-2', 'heading-3', 'heading-4'].includes(blockType)) {
          this.activateRichTextEditor(blockWrapper, element);
        }
      }
    });
  }

  /**
   * יצירת ID ייחודי לבלוק
   */
  generateBlockId(tabId) {
    this.blockCounter++;
    return `block_${tabId}_${this.blockCounter}_${Date.now()}`;
  }

  /**
   * הוספת כפתורי "הוסף תוכן" בין בלוקים
   */
  addInsertButtons() {
    if (!this.editMode) return;

    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach((tab) => {
      if (tab.classList.contains('hidden')) return;

      // הסר כפתורים קודמים
      tab.querySelectorAll('.insert-content-btn').forEach((btn) => btn.remove());

      // הוסף כפתור בתחילת הtab
      this.insertButtonBefore(tab.firstChild, tab);

      // הוסף כפתורים בין בלוקים
      const blocks = tab.querySelectorAll('.content-block');
      blocks.forEach((block) => {
        this.insertButtonAfter(block, tab);
      });
    });
  }

  /**
   * הוספת כפתור לפני אלמנט
   */
  insertButtonBefore(element, container) {
    const button = this.createInsertButton(container);
    if (element) {
      container.insertBefore(button, element);
    } else {
      container.appendChild(button);
    }
  }

  /**
   * הוספת כפתור אחרי אלמנט
   */
  insertButtonAfter(element, container) {
    const button = this.createInsertButton(container);
    if (element.nextSibling) {
      container.insertBefore(button, element.nextSibling);
    } else {
      container.appendChild(button);
    }
  }

  /**
   * יצירת כפתור הוספה
   */
  createInsertButton(container) {
    const button = document.createElement('div');
    button.className = 'insert-content-btn';
    button.innerHTML = `
      <button class="insert-btn" title="הוסף תוכן חדש">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path>
        </svg>
      </button>
      <span class="insert-label">הוסף תוכן</span>
    `;

    button.querySelector('.insert-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showContentTypeMenu(button, container);
    });

    return button;
  }

  /**
   * הצגת תפריט בחירת סוג תוכן
   */
  showContentTypeMenu(insertButton, container) {
    // הסר תפריטים קודמים
    document.querySelectorAll('.content-type-menu').forEach((m) => m.remove());

    const menu = document.createElement('div');
    menu.className = 'content-type-menu';
    menu.innerHTML = `
      <div class="content-type-menu-header">
        <span>בחר סוג תוכן</span>
        <button class="close-menu-btn">×</button>
      </div>
      <div class="content-type-options">
        <button class="content-type-option" data-type="paragraph">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="option-title">פסקת טקסט</div>
            <div class="option-desc">טקסט חופשי רגיל</div>
          </div>
        </button>

        <button class="content-type-option" data-type="heading-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
          </svg>
          <div>
            <div class="option-title">כותרת גדולה (H2)</div>
            <div class="option-desc">לכותרות ראשיות</div>
          </div>
        </button>

        <button class="content-type-option" data-type="heading-3">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V8z"></path>
          </svg>
          <div>
            <div class="option-title">כותרת בינונית (H3)</div>
            <div class="option-desc">לתת-כותרות</div>
          </div>
        </button>

        <button class="content-type-option" data-type="heading-4">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 01-2 2H4a2 2 0 01-2-2v-1z"></path>
          </svg>
          <div>
            <div class="option-title">כותרת קטנה (H4)</div>
            <div class="option-desc">לכותרות משניות</div>
          </div>
        </button>

        <button class="content-type-option" data-type="bullet-list">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 4a2 2 0 100 4 2 2 0 000-4zM3 8a2 2 0 114 0 2 2 0 01-4 0zm6-4h6a1 1 0 110 2H9a1 1 0 010-2zm0 6h6a1 1 0 110 2H9a1 1 0 110-2zm0 6h6a1 1 0 110 2H9a1 1 0 110-2zM5 14a2 2 0 100 4 2 2 0 000-4zm-2 2a2 2 0 114 0 2 2 0 01-4 0z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="option-title">רשימת תבליטים</div>
            <div class="option-desc">רשימה עם bullets</div>
          </div>
        </button>

        <button class="content-type-option" data-type="number-list">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="option-title">רשימה ממוספרת</div>
            <div class="option-desc">רשימה עם מספרים</div>
          </div>
        </button>

        <button class="content-type-option" data-type="styled-item">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8h8V6z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="option-title">פריט מעוצב</div>
            <div class="option-desc">כמו הפריטים הקיימים</div>
          </div>
        </button>
      </div>
    `;

    // מיקום התפריט
    insertButton.appendChild(menu);

    // סגירה
    menu.querySelector('.close-menu-btn').addEventListener('click', () => {
      menu.remove();
    });

    // בחירת אופציה
    menu.querySelectorAll('.content-type-option').forEach((option) => {
      option.addEventListener('click', () => {
        const type = option.getAttribute('data-type');
        this.insertNewBlock(type, insertButton, container);
        menu.remove();
      });
    });

    // סגירה בלחיצה מחוץ לתפריט
    setTimeout(() => {
      document.addEventListener(
        'click',
        (e) => {
          if (!menu.contains(e.target)) {
            menu.remove();
          }
        },
        { once: true }
      );
    }, 100);
  }

  /**
   * הכנסת בלוק חדש
   */
  insertNewBlock(type, insertButton, container) {
    const tabId = container.id;
    const blockId = this.generateBlockId(tabId);

    // יצירת הבלוק
    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'content-block content-block-editing';
    blockWrapper.setAttribute('data-block-id', blockId);
    blockWrapper.setAttribute('data-block-type', type);

    // יצירת התוכן לפי הסוג
    const content = this.createContentByType(type, blockId);
    blockWrapper.appendChild(content);

    // הוספת כפתורי פעולה
    this.addBlockActions(blockWrapper);

    // הכנס לפני כפתור ההוספה
    container.insertBefore(blockWrapper, insertButton);

    // שמור בזיכרון
    this.blocks.set(blockId, {
      id: blockId,
      type: type,
      element: blockWrapper,
      content: content,
      tabId: tabId,
    });

    // הפעל עורך אם צריך
    if (['paragraph', 'heading-2', 'heading-3', 'heading-4'].includes(type)) {
      this.activateRichTextEditor(blockWrapper, content);
    } else if (type === 'styled-item') {
      this.activateStyledItemEditor(blockWrapper, content);
    }

    // רענן כפתורי הוספה
    this.addInsertButtons();

    // שמור תוכן + מבנה ל-Firebase (via schedule to prevent concurrent saves)
    this.scheduleSave(blockId);
    this.saveBlockStructure(blockId, type, tabId);

    // ✅ Toast removed - will be added in COMMIT 3 after ACK
    // (No premature "success" messages)

    return blockWrapper;
  }

  /**
   * יצירת תוכן לפי סוג
   */
  createContentByType(type, blockId) {
    let element;

    switch (type) {
      case 'paragraph':
        element = document.createElement('p');
        element.className = 'editable rich-text-content';
        element.setAttribute('data-field', blockId);
        element.innerHTML = 'לחץ כאן להקליד טקסט...';
        break;

      case 'heading-2':
        element = document.createElement('h2');
        element.className = 'editable rich-text-content text-2xl font-bold';
        element.setAttribute('data-field', blockId);
        element.innerHTML = 'כותרת חדשה';
        break;

      case 'heading-3':
        element = document.createElement('h3');
        element.className = 'editable rich-text-content text-xl font-semibold';
        element.setAttribute('data-field', blockId);
        element.innerHTML = 'כותרת משנית';
        break;

      case 'heading-4':
        element = document.createElement('h4');
        element.className = 'editable rich-text-content text-lg font-medium';
        element.setAttribute('data-field', blockId);
        element.innerHTML = 'כותרת קטנה';
        break;

      case 'bullet-list':
        element = document.createElement('ul');
        element.className = 'rich-text-content list-disc mr-6';
        element.innerHTML = `
          <li class="editable" data-field="${blockId}_1">פריט ראשון</li>
          <li class="editable" data-field="${blockId}_2">פריט שני</li>
        `;
        break;

      case 'number-list':
        element = document.createElement('ol');
        element.className = 'rich-text-content list-decimal mr-6';
        element.innerHTML = `
          <li class="editable" data-field="${blockId}_1">פריט ראשון</li>
          <li class="editable" data-field="${blockId}_2">פריט שני</li>
        `;
        break;

      case 'styled-item':
        element = document.createElement('div');
        element.className = 'linear-item';
        element.innerHTML = `
          <div class="linear-item-icon">
            <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%;">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="linear-item-content">
            <div class="linear-item-label editable" data-field="${blockId}_label">תווית</div>
            <div class="linear-item-value editable" data-field="${blockId}_value">תוכן הפריט</div>
          </div>
        `;
        break;

      default:
        element = document.createElement('p');
        element.className = 'editable';
        element.setAttribute('data-field', blockId);
        element.innerHTML = 'תוכן חדש';
    }

    return element;
  }

  /**
   * הפעלת עורך טקסט עשיר
   */
  activateRichTextEditor(blockWrapper, content) {
    if (window.RichTextEditor) {
      window.RichTextEditor.activate(content, blockWrapper);
    }
  }

  /**
   * הפעלת עורך פריט מעוצב
   */
  activateStyledItemEditor(blockWrapper, content) {
    const editables = content.querySelectorAll('.editable');
    editables.forEach((el) => {
      el.contentEditable = true;
      el.classList.add('border-2', 'border-dashed', 'border-blue-300', 'rounded', 'px-2', 'py-1');
    });
  }

  /**
   * הוספת כפתורי פעולה לבלוק
   */
  addBlockActions(blockWrapper) {
    const actions = document.createElement('div');
    actions.className = 'block-actions';
    actions.innerHTML = `
      <button class="block-action-btn block-move-up" title="הזז למעלה">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
      <button class="block-action-btn block-move-down" title="הזז למטה">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
      <button class="block-action-btn block-delete" title="מחק בלוק">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;

    blockWrapper.appendChild(actions);

    // Event listeners
    actions.querySelector('.block-move-up').addEventListener('click', () => {
      this.moveBlockUp(blockWrapper);
    });

    actions.querySelector('.block-move-down').addEventListener('click', () => {
      this.moveBlockDown(blockWrapper);
    });

    actions.querySelector('.block-delete').addEventListener('click', async () => {
      await this.deleteBlock(blockWrapper);
    });
  }

  /**
   * הזזת בלוק למעלה
   */
  moveBlockUp(blockWrapper) {
    const prev = blockWrapper.previousElementSibling;
    if (prev && prev.classList.contains('content-block')) {
      blockWrapper.parentNode.insertBefore(blockWrapper, prev);
      this.saveBlockOrder();
    }
  }

  /**
   * הזזת בלוק למטה
   */
  moveBlockDown(blockWrapper) {
    const next = blockWrapper.nextElementSibling;
    if (next && next.classList.contains('content-block')) {
      blockWrapper.parentNode.insertBefore(next, blockWrapper);
      this.saveBlockOrder();
    }
  }

  /**
   * מחיקת בלוק
   */
  async deleteBlock(blockWrapper) {
    const blockId = blockWrapper.getAttribute('data-block-id');

    // אישור מחיקה
    const confirmed =
      typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show({
            title: 'מחיקת בלוק',
            message: 'האם אתה בטוח שברצונך למחוק בלוק זה?',
            confirmText: 'מחק',
            cancelText: 'ביטול',
            type: 'danger',
          })
        : confirm('האם למחוק בלוק זה?');

    if (confirmed) {
      blockWrapper.remove();
      this.blocks.delete(blockId);

      // מחק מה-storage (גם תוכן וגם metadata)
      localStorage.removeItem(`guide_${blockId}`);
      localStorage.removeItem(`guide_meta_${blockId}`);

      // מחק מ-Firebase (גם תוכן וגם metadata)
      if (typeof deleteFromFirebase === 'function') {
        deleteFromFirebase(blockId);
        deleteFromFirebase(`meta_${blockId}`);
      }

      // רענן כפתורים
      this.addInsertButtons();

      if (typeof showToast === 'function') {
        showToast('הבלוק נמחק בהצלחה', 'success');
      }
    }
  }

  /**
   * טעינת בלוקים מ-Firebase
   */
  async loadBlocksFromFirebase() {
    if (typeof loadAllDataFromFirebase !== 'function') {
      console.warn('⚠️ Firebase לא זמין, טוען מ-localStorage');
      this.loadBlocksFromLocalStorage();
      return;
    }

    try {
      const firebaseData = await loadAllDataFromFirebase();
      if (firebaseData) {
        console.log('✅ טוען בלוקים מ-Firebase');

        // שלב 1: יצירת בלוקים חדשים שנשמרו ב-Firebase
        Object.keys(firebaseData).forEach((key) => {
          // זיהוי מטא-דאטה של בלוקים חדשים
          if (key.startsWith('meta_')) {
            try {
              const blockId = key.replace('meta_', '');
              const metadata = JSON.parse(firebaseData[key]);

              // בדוק אם הבלוק כבר קיים
              if (!this.blocks.has(blockId)) {
                console.log(`📦 יוצר בלוק חדש מ-Firebase: ${blockId}`);
                this.recreateBlockFromMetadata(metadata, firebaseData);
              }
            } catch (e) {
              console.error('❌ שגיאה בפענוח metadata:', e);
            }
          }
        });

        // שלב 2: עדכון תוכן בלוקים קיימים
        Object.keys(firebaseData).forEach((blockId) => {
          // רק בלוקים שמתחילים ב-block_ ולא meta_
          if (blockId.startsWith('block_') && !blockId.startsWith('block_meta')) {
            const block = this.blocks.get(blockId);
            if (block && block.content) {
              block.content.innerHTML = firebaseData[blockId];
              // גם שמור ב-localStorage כגיבוי
              localStorage.setItem(`guide_${blockId}`, firebaseData[blockId]);
            }
          }
        });
      } else {
        // אם אין נתונים ב-Firebase, טען מקומי
        this.loadBlocksFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ שגיאה בטעינה מ-Firebase:', error);
      this.loadBlocksFromLocalStorage();
    }
  }

  /**
   * יצירה מחדש של בלוק מ-metadata
   */
  recreateBlockFromMetadata(metadata, firebaseData) {
    const { id: blockId, type, tabId } = metadata;

    // מצא את הcontainer (tab)
    const container = document.getElementById(tabId);
    if (!container) {
      console.warn(`⚠️ לא נמצא tab: ${tabId}`);
      return;
    }

    // יצירת הבלוק
    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'content-block';
    blockWrapper.setAttribute('data-block-id', blockId);
    blockWrapper.setAttribute('data-block-type', type);

    // יצירת התוכן
    const content = this.createContentByType(type, blockId);
    blockWrapper.appendChild(content);

    // טען את התוכן מ-Firebase
    if (firebaseData[blockId]) {
      content.innerHTML = firebaseData[blockId];
    }

    // הכנס את הבלוק בסוף הcontainer
    container.appendChild(blockWrapper);

    // שמור בזיכרון
    this.blocks.set(blockId, {
      id: blockId,
      type: type,
      element: blockWrapper,
      content: content,
      tabId: tabId,
    });

    // 🔧 FIX: הפעל את העורך גם לבלוקים שנטענו מ-Firebase
    if (['paragraph', 'heading-2', 'heading-3', 'heading-4'].includes(type)) {
      this.activateRichTextEditor(blockWrapper, content);
    } else if (type === 'styled-item') {
      this.activateStyledItemEditor(blockWrapper, content);
    }

    console.log(`✅ בלוק נוצר מחדש: ${blockId}`);
  }

  /**
   * טעינת בלוקים מ-localStorage
   */
  loadBlocksFromLocalStorage() {
    console.log('💾 טוען בלוקים מ-localStorage');
    this.blocks.forEach((block, blockId) => {
      const savedContent = localStorage.getItem(`guide_${blockId}`);
      if (savedContent && block.content) {
        block.content.innerHTML = savedContent;
      }
    });
  }

  /**
   * שמירת בלוק
   * NOTE: This function is now called via scheduleSave() which prevents
   * concurrent saves of the same block. The pendingSaves Map ensures
   * only ONE save operation per blockId can run at a time.
   *
   * @returns {Promise<boolean>} true if saved successfully, false otherwise
   */
  async saveBlock(blockId) {
    const block = this.blocks.get(blockId);
    if (!block) return false;

    const content = block.content.innerHTML;

    // Update UI: Saving state
    this.updateBlockSaveStatus(blockId, 'saving');

    // שמור מקומית (synchronous)
    localStorage.setItem(`guide_${blockId}`, content);

    // שמור ב-Firebase (asynchronous)
    if (typeof saveToFirebase === 'function') {
      const success = await saveToFirebase(blockId, content);

      if (success) {
        // ✅ SUCCESS: Update UI
        this.updateBlockSaveStatus(blockId, 'saved');
        return true;
      } else {
        // ❌ ERROR: Update UI
        this.updateBlockSaveStatus(blockId, 'error');
        return false;
      }
    }

    // No Firebase - consider it saved locally
    this.updateBlockSaveStatus(blockId, 'saved');
    return true;
  }

  /**
   * Update block save status UI
   */
  updateBlockSaveStatus(blockId, status) {
    const block = this.blocks.get(blockId);
    if (!block || !block.element) return;

    // Remove old status classes
    block.element.classList.remove('block-saving', 'block-saved', 'block-error');

    // Add new status class
    switch (status) {
      case 'saving':
        block.element.classList.add('block-saving');
        break;
      case 'saved':
        block.element.classList.add('block-saved');
        // Remove 'saved' class after 2 seconds
        setTimeout(() => {
          block.element.classList.remove('block-saved');
        }, 2000);
        break;
      case 'error':
        block.element.classList.add('block-error');
        // Show retry button or message
        this.showRetryOption(blockId);
        break;
    }
  }

  /**
   * Show retry option for failed saves
   */
  showRetryOption(blockId) {
    const block = this.blocks.get(blockId);
    if (!block || !block.element) return;

    // Check if retry button already exists
    if (block.element.querySelector('.save-retry-btn')) return;

    const retryBtn = document.createElement('button');
    retryBtn.className = 'save-retry-btn';
    retryBtn.innerHTML = '🔄 נסה שוב';
    retryBtn.title = 'שגיאה בשמירה - לחץ לנסות שוב';

    retryBtn.addEventListener('click', () => {
      retryBtn.remove();
      this.scheduleSave(blockId);
    });

    block.element.appendChild(retryBtn);
  }

  /**
   * שמירת מבנה הבלוק ל-Firebase (מטא-דאטה)
   */
  saveBlockStructure(blockId, type, tabId) {
    const blockMetadata = {
      id: blockId,
      type: type,
      tabId: tabId,
      createdAt: Date.now(),
    };

    // שמור במפתח נפרד
    localStorage.setItem(`guide_meta_${blockId}`, JSON.stringify(blockMetadata));

    if (typeof saveToFirebase === 'function') {
      saveToFirebase(`meta_${blockId}`, JSON.stringify(blockMetadata));
    }
  }

  /**
   * שמירת סדר הבלוקים
   */
  saveBlockOrder() {
    // TODO: implement if needed
    if (typeof showToast === 'function') {
      showToast('סדר הבלוקים נשמר', 'success');
    }
  }

  /**
   * הפעלת מצב עריכה
   */
  enableEditMode() {
    this.editMode = true;
    this.addInsertButtons();

    // הוסף actions לבלוקים קיימים
    const blocks = document.querySelectorAll('.content-block');
    blocks.forEach((block) => {
      if (!block.querySelector('.block-actions')) {
        this.addBlockActions(block);
      }
      block.classList.add('content-block-editable');

      // 🔧 FIX: הפעל contentEditable לבלוקים שנטענו מ-Firebase
      const blockId = block.getAttribute('data-block-id');
      const blockType = block.getAttribute('data-block-type');
      const blockData = this.blocks.get(blockId);

      if (blockData && blockData.content) {
        if (['paragraph', 'heading-2', 'heading-3', 'heading-4'].includes(blockType)) {
          // הפוך לניתן לעריכה (אבל לא להראות toolbar עד שלוחצים)
          blockData.content.contentEditable = true;

          // ✅ NEW: הוסף event listener לפתיחת עורך בלחיצה
          blockData.content.addEventListener('click', (e) => {
            if (this.editMode) {
              e.stopPropagation();
              this.activateRichTextEditor(block, blockData.content);
            }
          });
        } else if (blockType === 'styled-item') {
          // פריטים מעוצבים
          const editables = blockData.content.querySelectorAll('.editable');
          editables.forEach((el) => {
            el.contentEditable = true;

            // ✅ NEW: הוסף event listener לפתיחת עורך בלחיצה
            el.addEventListener('click', (e) => {
              if (this.editMode) {
                e.stopPropagation();
                this.activateStyledItemEditor(block, blockData.content);
              }
            });
          });
        }
      }
    });
  }

  /**
   * כיבוי מצב עריכה
   */
  disableEditMode() {
    this.editMode = false;

    // הסר כפתורי הוספה
    document.querySelectorAll('.insert-content-btn').forEach((btn) => btn.remove());

    // הסר actions
    document.querySelectorAll('.block-actions').forEach((actions) => actions.remove());

    // הסר סגנונות עריכה וכבה contentEditable
    document.querySelectorAll('.content-block').forEach((block) => {
      block.classList.remove('content-block-editable', 'content-block-editing');

      // כבה contentEditable לבלוקים שנטענו מ-Firebase
      const blockId = block.getAttribute('data-block-id');
      const blockData = this.blocks.get(blockId);

      if (blockData && blockData.content) {
        blockData.content.contentEditable = false;

        // גם לפריטים מעוצבים
        const editables = blockData.content.querySelectorAll('.editable');
        editables.forEach((el) => {
          el.contentEditable = false;
        });
      }
    });
  }

  /**
   * הגדרת event listeners
   */
  setupEventListeners() {
    // ✅ ONE SAVE PIPELINE: Unified autosave with debounce + blur
    // Track pending saves to prevent concurrent saves of same block
    this.pendingSaves = new Map(); // blockId -> Promise
    this.saveTimeouts = new Map(); // blockId -> timeoutId

    // Input handler with debounce (600ms)
    const inputHandler = (e) => {
      const target = e.target;
      if (target && target.classList && target.classList.contains('editable')) {
        const blockElement = target.closest('.content-block');
        if (blockElement) {
          const blockId = blockElement.getAttribute('data-block-id');

          // Clear existing timeout for this block
          if (this.saveTimeouts.has(blockId)) {
            clearTimeout(this.saveTimeouts.get(blockId));
          }

          // Set new debounced save
          const timeoutId = setTimeout(() => {
            this.scheduleSave(blockId);
            this.saveTimeouts.delete(blockId);
          }, 600); // 600ms debounce

          this.saveTimeouts.set(blockId, timeoutId);
        }
      }
    };

    // Blur handler - immediate save
    const blurHandler = (e) => {
      const target = e.target;
      if (target && target.classList && target.classList.contains('editable')) {
        const blockElement = target.closest('.content-block');
        if (blockElement) {
          const blockId = blockElement.getAttribute('data-block-id');

          // Clear debounce timeout
          if (this.saveTimeouts.has(blockId)) {
            clearTimeout(this.saveTimeouts.get(blockId));
            this.saveTimeouts.delete(blockId);
          }

          // Immediate save on blur
          this.scheduleSave(blockId);
        }
      }
    };

    document.addEventListener('input', inputHandler);
    document.addEventListener('blur', blurHandler, true); // capture phase

    // ❌ REMOVED: DOMSubtreeModified (deprecated & causes performance issues)
    // The above handlers (input + blur) are sufficient for reliable autosave
  }

  /**
   * Schedule a save, preventing concurrent saves of the same block
   */
  scheduleSave(blockId) {
    // ✅ Prevent concurrent save: If already saving this block, skip
    if (this.pendingSaves.has(blockId)) {
      if (window.APP_CONFIG.enableSaveLogging) {
        console.log(`⏭️ [SavePipeline] Skipping save for ${blockId} - already in progress`);
      }
      return;
    }

    // Mark as pending and save
    const savePromise = this.saveBlock(blockId).finally(() => {
      // Remove from pending when done
      this.pendingSaves.delete(blockId);
    });

    this.pendingSaves.set(blockId, savePromise);
  }
}

/* ============================================
   2. RichTextEditor - עורך טקסט עשיר
   ============================================ */

class RichTextEditor {
  constructor() {
    this.activeElement = null;
    this.toolbar = null;
  }

  /**
   * הפעלת העורך על אלמנט
   */
  async activate(element, blockWrapper) {
    const blockId = blockWrapper.getAttribute('data-block-id');

    // ✅ Try to acquire lock first
    if (typeof window.acquireLock === 'function') {
      const lockResult = await window.acquireLock(blockId);

      if (!lockResult.success) {
        // Block is locked by someone else
        const lockedBy = lockResult.lockedBy || 'משתמש אחר';
        alert(`⛔ בלוק זה נעול על ידי ${lockedBy}. נסה שוב בעוד מספר שניות.`);
        return; // Don't activate editor
      }

      // Store lock for cleanup
      this.currentLockBlockId = blockId;
    }

    this.activeElement = element;
    this.currentBlockWrapper = blockWrapper;
    element.contentEditable = true;
    element.focus();

    // הצג toolbar
    this.showToolbar(element, blockWrapper);

    // ❌ REMOVED: Duplicate event listeners
    // ContentBlockManager.setupEventListeners() already handles input/blur
    // No need for duplicate listeners here - they caused double saves

    // Selection change (for toolbar UI only, not for save)
    document.addEventListener('selectionchange', () => {
      if (this.activeElement === element) {
        this.updateToolbarState();
      }
    });
  }

  /**
   * הצגת toolbar
   */
  showToolbar(element, blockWrapper) {
    // הסר toolbar קודם
    if (this.toolbar) {
      this.toolbar.remove();
    }

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'rich-text-toolbar';
    this.toolbar.innerHTML = `
      <button class="toolbar-btn" data-command="bold" title="מודגש (Ctrl+B)">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3H5v14h6a4 4 0 000-8 3 3 0 000-6zm-1 6H6V5h4a2 2 0 110 4zm0 6H6v-4h4a3 3 0 110 6z"></path>
        </svg>
      </button>

      <button class="toolbar-btn" data-command="italic" title="נטוי (Ctrl+I)">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3h8v2h-3l-2 8h3v2H6v-2h3l2-8H8V3z"></path>
        </svg>
      </button>

      <button class="toolbar-btn" data-command="underline" title="קו תחתון (Ctrl+U)">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 3v7a4 4 0 008 0V3h-2v7a2 2 0 11-4 0V3H6zm-2 14h12v2H4v-2z"></path>
        </svg>
      </button>

      <span class="toolbar-separator"></span>

      <button class="toolbar-btn" data-command="insertUnorderedList" title="רשימת תבליטים">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
        </svg>
      </button>

      <button class="toolbar-btn" data-command="insertOrderedList" title="רשימה ממוספרת">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
        </svg>
      </button>

      <span class="toolbar-separator"></span>

      <button class="toolbar-btn toolbar-done" title="סיים עריכה">
        ✓ סיים
      </button>
    `;

    blockWrapper.insertBefore(this.toolbar, element);

    // Event listeners
    this.toolbar.querySelectorAll('.toolbar-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.getAttribute('data-command');
        if (command) {
          this.execCommand(command);
        } else if (btn.classList.contains('toolbar-done')) {
          this.deactivate();
        }
      });
    });
  }

  /**
   * ביצוע פקודת עריכה
   */
  execCommand(command) {
    document.execCommand(command, false, null);
    this.activeElement.focus();
    this.updateToolbarState();

    // 🔥 FIX: שמור מיד אחרי שינוי!
    this.saveCurrentBlock();
  }

  /**
   * שמירת הבלוק הנוכחי
   */
  saveCurrentBlock() {
    if (!this.activeElement) return;

    const blockElement = this.activeElement.closest('.content-block');
    if (blockElement) {
      const blockId = blockElement.getAttribute('data-block-id');
      if (blockId && window.ContentBlockManager) {
        // ✅ Use scheduleSave to prevent concurrent saves
        window.ContentBlockManager.scheduleSave(blockId);
      }
    }
  }

  /**
   * עדכון מצב הכפתורים
   */
  updateToolbarState() {
    if (!this.toolbar) return;

    const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
    commands.forEach((cmd) => {
      const btn = this.toolbar.querySelector(`[data-command="${cmd}"]`);
      if (btn) {
        if (document.queryCommandState(cmd)) {
          btn.classList.add('toolbar-btn-active');
        } else {
          btn.classList.remove('toolbar-btn-active');
        }
      }
    });
  }

  /**
   * כיבוי העורך
   */
  deactivate() {
    // 🔥 FIX: שמור לפני סגירה!
    this.saveCurrentBlock();

    // ✅ Release lock
    if (this.currentLockBlockId && typeof window.releaseLock === 'function') {
      window.releaseLock(this.currentLockBlockId);
      this.currentLockBlockId = null;
    }

    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }

    if (this.activeElement) {
      this.activeElement.contentEditable = false;
      this.activeElement = null;
    }
  }
}

/* ============================================
   3. אתחול גלובלי
   ============================================ */

// יצירת instances גלובליים
window.ContentBlockManager = new ContentBlockManager();
window.RichTextEditor = new RichTextEditor();

// אתחול כשה-DOM מוכן
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ContentBlockManager.init();
  });
} else {
  window.ContentBlockManager.init();
}

console.log('✅ Content Editor System loaded successfully');
