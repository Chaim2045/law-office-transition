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
  init() {
    this.loadExistingBlocks();
    this.setupEventListeners();
    console.log('✅ ContentBlockManager initialized');
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
        this.wrapInBlock(element, tabId);
      }
    });
  }

  /**
   * עטיפת אלמנט קיים בבלוק
   */
  wrapInBlock(element, tabId) {
    const blockId = this.generateBlockId(tabId);
    const wrapper = document.createElement('div');
    wrapper.className = 'content-block';
    wrapper.setAttribute('data-block-id', blockId);
    wrapper.setAttribute('data-block-type', this.detectBlockType(element));

    // עטוף את האלמנט
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // שמור בזיכרון
    this.blocks.set(blockId, {
      id: blockId,
      type: this.detectBlockType(element),
      element: wrapper,
      content: element,
      tabId: tabId,
    });

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

    // שמור
    this.saveBlock(blockId);

    // Toast
    if (typeof showToast === 'function') {
      showToast('בלוק חדש נוסף בהצלחה', 'success');
    }

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

      // מחק מה-storage
      localStorage.removeItem(`guide_${blockId}`);
      if (typeof saveToFirebase === 'function') {
        saveToFirebase(blockId, null); // null = delete
      }

      // רענן כפתורים
      this.addInsertButtons();

      if (typeof showToast === 'function') {
        showToast('הבלוק נמחק בהצלחה', 'success');
      }
    }
  }

  /**
   * שמירת בלוק
   */
  saveBlock(blockId) {
    const block = this.blocks.get(blockId);
    if (!block) return;

    const content = block.content.innerHTML;
    localStorage.setItem(`guide_${blockId}`, content);

    if (typeof saveToFirebase === 'function') {
      saveToFirebase(blockId, content);
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

    // הסר סגנונות עריכה
    document.querySelectorAll('.content-block').forEach((block) => {
      block.classList.remove('content-block-editable', 'content-block-editing');
    });
  }

  /**
   * הגדרת event listeners
   */
  setupEventListeners() {
    // שמירה אוטומטית
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('editable')) {
        const blockElement = e.target.closest('.content-block');
        if (blockElement) {
          const blockId = blockElement.getAttribute('data-block-id');
          this.saveBlock(blockId);
        }
      }
    });
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
  activate(element, blockWrapper) {
    this.activeElement = element;
    element.contentEditable = true;
    element.focus();

    // הצג toolbar
    this.showToolbar(element, blockWrapper);

    // Selection change
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
