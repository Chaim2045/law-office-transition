# 🏷️ מיפוי שמות שדות - Field Naming Map

**תאריך:** 2026-01-16
**מטרה:** מיפוי מהשמות הישנים לשמות חדשים ברורים

---

## 📐 כללי Naming Convention

### פורמט:
```
{tab}_{section}_{element}_[number]
```

### דוגמאות:
- `legal_main_title` - כותרת ראשית של טאב
- `legal_file_opening_step1` - שלב 1 בפתיחת תיק
- `general_staff_manager` - מנהל בצוות
- `contacts_primary_email` - אימייל ראשי

### כללים:
- ✅ רק אותיות אנגליות קטנות
- ✅ מקף תחתון (_) מפריד
- ✅ תיאורי וברור
- ✅ ללא מספרים מיותרים (אלא אם סדרתי)
- ✅ קיצורים רק אם ברורים (email, phone)

---

## 📋 מיפוי לפי טאבים

### 🔷 Legal Processes (תהליכים משפטיים)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `heading_legal_processes` | `legal_main_title` | כותרת ראשית |
| `heading_line_1886` | `legal_file_opening_title` | כותרת פתיחת תיק |
| `file_opening_step_1` | `legal_file_step1` | שלב 1 |
| `file_opening_step_2` | `legal_file_step2` | שלב 2 |
| `file_opening_step_3` | `legal_file_step3` | שלב 3 |
| `file_opening_step_4` | `legal_file_step4` | שלב 4 |
| `file_opening_step_5` | `legal_file_step5` | שלב 5 |
| `file_opening_step_6` | `legal_file_step6` | שלב 6 |
| `heading_line_2040` | `legal_couriers_title` | כותרת שליחויות |
| `courier_step_1` | `legal_courier_step1` | שליחות שלב 1 |
| `courier_step_2` | `legal_courier_step2` | שליחות שלב 2 |
| ... | ... | ... |

**סה"כ שדות:** 34

---

### 🔷 General Info (מידע כללי)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `heading_general_info` | `general_main_title` | כותרת ראשית |
| `heading_office_contact` | `general_contact_title` | כותרת פרטי קשר |
| `office_phone` | `general_phone` | טלפון משרד |
| `office_email` | `general_email` | אימייל משרד |
| `office_address` | `general_address` | כתובת משרד |
| `heading_specialties` | `general_specialties_title` | כותרת התמחויות |
| `specialty_1` | `general_specialty1` | התמחות 1 |
| `specialty_2` | `general_specialty2` | התמחות 2 |
| `heading_staff_roles` | `general_staff_title` | כותרת צוות |
| `ta_staff_3` | `general_staff_manager` | מנהל |
| `staff_secretary` | `general_staff_secretary` | מזכירה |
| ... | ... | ... |

**סה"כ שדות:** 28

---

### 🔷 Checks & Deposits (המחאות והפקדות)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `checks_main_heading` | `checks_main_title` | כותרת ראשית |
| `checks_intro_text` | `checks_intro` | הקדמה |
| `check_procedure_1` | `checks_procedure_step1` | הליך שלב 1 |
| `check_procedure_2` | `checks_procedure_step2` | הליך שלב 2 |
| `deposit_info` | `checks_deposit_info` | מידע הפקדות |
| ... | ... | ... |

**סה"כ שדות:** 10

---

### 🔷 Contacts (אנשי קשר)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `contacts_title` | `contacts_main_title` | כותרת ראשית |
| `contact_1_name` | `contacts_external_lawyer1_name` | עו"ד חיצוני 1 - שם |
| `contact_1_phone` | `contacts_external_lawyer1_phone` | עו"ד חיצוני 1 - טלפון |
| `contact_1_email` | `contacts_external_lawyer1_email` | עו"ד חיצוני 1 - אימייל |
| `court_1_name` | `contacts_court1_name` | בית משפט 1 - שם |
| `court_1_address` | `contacts_court1_address` | בית משפט 1 - כתובת |
| ... | ... | ... |

**סה"כ שדות:** 65

---

### 🔷 Daily Management (ניהול יומיומי)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `daily_title` | `daily_main_title` | כותרת ראשית |
| `morning_routine_1` | `daily_morning_task1` | משימת בוקר 1 |
| `morning_routine_2` | `daily_morning_task2` | משימת בוקר 2 |
| `afternoon_task_1` | `daily_afternoon_task1` | משימת אחה"צ 1 |
| ... | ... | ... |

**סה"כ שדות:** 30

---

### 🔷 Financial Management (ניהול פיננסי)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `financial_title` | `financial_main_title` | כותרת ראשית |
| `invoice_procedure_1` | `financial_invoice_step1` | הליך חשבונית 1 |
| `payment_tracking_info` | `financial_payment_tracking` | מעקב תשלומים |
| `budget_notes` | `financial_budget_notes` | הערות תקציב |
| ... | ... | ... |

**סה"כ שדות:** 46

---

### 🔷 Meetings & Scheduling (תזמון פגישות)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `meetings_title` | `meetings_main_title` | כותרת ראשית |
| `meeting_prep_1` | `meetings_prep_step1` | הכנה לפגישה 1 |
| `meeting_types_client` | `meetings_type_client` | סוג פגישה - לקוח |
| `meeting_types_court` | `meetings_type_court` | סוג פגישה - בימ"ש |
| ... | ... | ... |

**סה"כ שדות:** 82

---

### 🔷 Calendar Management (ניהול יומן)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `calendar_title` | `calendar_main_title` | כותרת ראשית |
| `calendar_tool_info` | `calendar_tool_description` | תיאור כלי |
| `calendar_sync_steps` | `calendar_sync_instructions` | הוראות סנכרון |
| ... | ... | ... |

**סה"כ שדות:** 13

---

### 🔷 Procedures (נהלים)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `procedures_title` | `procedures_main_title` | כותרת ראשית |
| `procedure_filing_1` | `procedures_filing_step1` | נוהל תיוק 1 |
| `procedure_security` | `procedures_security_protocol` | נוהל אבטחה |
| ... | ... | ... |

**סה"כ שדות:** 46

---

### 🔷 Suppliers Management (ניהול ספקים)

| ישן | חדש | תיאור |
|-----|-----|-------|
| `suppliers_title` | `suppliers_main_title` | כותרת ראשית |
| `supplier_1_name` | `suppliers_courier1_name` | שליח 1 - שם |
| `supplier_1_phone` | `suppliers_courier1_phone` | שליח 1 - טלפון |
| `supplier_printer_name` | `suppliers_printer_name` | בית דפוס - שם |
| ... | ... | ... |

**סה"כ שדות:** 30

---

## 📊 סיכום

**סה"כ שדות:** 384
**טאבים:** 11
**קונבנציה:** `{tab}_{section}_{element}_[number]`

---

## ✅ יתרונות השמות החדשים

1. **ברורים** - `legal_file_step1` vs `file_opening_step_1`
2. **עקביים** - כולם בפורמט אחיד
3. **מסודרים** - קל למיין ולחפש
4. **תיאוריים** - מבינים מה זה בלי לראות את התוכן

---

**הבא:** שלב 2.2 - עדכון קבצי HTML עם השמות החדשים
