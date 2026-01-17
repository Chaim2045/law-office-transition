/**
 * Field Names Migration Script
 * סקריפט מיגרציה חד-פעמי לשמות שדות
 *
 * מטרה: להעביר נתונים מהשמות הישנים לשמות החדשים ב-Firebase
 *
 * אזהרה: הרץ את הסקריפט רק פעם אחת!
 *
 * שימוש:
 * 1. פתח את index.html בדפדפן
 * 2. פתח Console (F12)
 * 3. העתק והדבק את כל הקוד
 * 4. הקש Enter
 * 5. הסקריפט ירוץ אוטומטית ויציג דוח
 */

(async function migrateFieldNames() {
  console.log('🚀 Starting Field Names Migration...\n');

  // Check if Firebase is initialized
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.error('❌ Firebase is not initialized!');
    return;
  }

  // Field mapping: old_name -> new_name
  const fieldMapping = {
    // Legal Processes (34 fields)
    'heading_legal_processes': 'legal_main_title',
    'heading_line_1886': 'legal_file_opening_title',
    'file_opening_step_1': 'legal_file_step1',
    'file_opening_step_2': 'legal_file_step2',
    'file_opening_step_3': 'legal_file_step3',
    'file_opening_step_4': 'legal_file_step4',
    'file_opening_step_5': 'legal_file_step5',
    'file_opening_step_6': 'legal_file_step6',
    'heading_line_2040': 'legal_couriers_title',
    'courier_step_1': 'legal_courier_step1',
    'courier_step_2': 'legal_courier_step2',
    'courier_step_3': 'legal_courier_step3',
    'courier_step_4': 'legal_courier_step4',
    'courier_notes': 'legal_courier_notes',
    'heading_line_2194': 'legal_court_filing_title',
    'court_filing_step_1': 'legal_court_step1',
    'court_filing_step_2': 'legal_court_step2',
    'court_filing_step_3': 'legal_court_step3',
    'heading_line_2346': 'legal_nethamishpat_title',
    'nethamishpat_access': 'legal_nethamishpat_access',
    'nethamishpat_password': 'legal_nethamishpat_password',
    'nethamishpat_step_1': 'legal_nethamishpat_step1',
    'nethamishpat_step_2': 'legal_nethamishpat_step2',
    'heading_line_2486': 'legal_printing_title',
    'printing_step_1': 'legal_printing_step1',
    'printing_step_2': 'legal_printing_step2',
    'printing_courier_1': 'legal_courier1',
    'printing_courier_2': 'legal_courier2',
    'printing_courier_3': 'legal_courier3',
    'heading_line_2636': 'legal_powers_title',
    'powers_step_1': 'legal_powers_step1',
    'powers_step_2': 'legal_powers_step2',
    'powers_notes': 'legal_powers_notes',
    'heading_line_2756': 'legal_misc_title',

    // General Info (28 fields) - add more mappings here
    'heading_general_info': 'general_main_title',
    'heading_office_contact': 'general_contact_title',
    'office_phone': 'general_phone',
    'office_email': 'general_email',
    'office_address': 'general_address',
    'heading_specialties': 'general_specialties_title',
    'specialty_1': 'general_specialty1',
    'specialty_2': 'general_specialty2',
    'heading_staff_roles': 'general_staff_title',
    'ta_staff_3': 'general_staff_manager',
    'staff_secretary': 'general_staff_secretary',

    // Checks & Deposits (10 fields)
    'checks_main_heading': 'checks_main_title',
    'checks_intro_text': 'checks_intro',
    'check_procedure_1': 'checks_procedure_step1',
    'check_procedure_2': 'checks_procedure_step2',
    'deposit_info': 'checks_deposit_info',

    // Add more mappings for other tabs...
    // TODO: Complete the mapping based on FIELD_NAMING_MAP.md
  };

  console.log(`📋 Field Mapping loaded: ${Object.keys(fieldMapping).length} mappings\n`);

  // Connect to Firebase
  const database = firebase.database();
  const dataRef = database.ref('guideData');

  try {
    // Read all data from Firebase
    console.log('📥 Reading data from Firebase...');
    const snapshot = await dataRef.get();

    if (!snapshot.exists()) {
      console.log('⚠️ No data found in Firebase. Nothing to migrate.');
      return;
    }

    const allData = snapshot.val();
    console.log(`✅ Found ${Object.keys(allData).length} fields in Firebase\n`);

    // Statistics
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Migrate each old field to new field
    for (const [oldName, newName] of Object.entries(fieldMapping)) {
      // Check if old field exists
      if (!allData[oldName]) {
        console.log(`⏭️ Skip: ${oldName} (not found in Firebase)`);
        skipped++;
        continue;
      }

      try {
        // Get the old data
        const oldData = allData[oldName];
        let content;

        // Handle both old format (string) and new format ({content, updatedAt})
        if (typeof oldData === 'string') {
          content = oldData;
        } else if (oldData && typeof oldData === 'object' && oldData.content !== undefined) {
          content = oldData.content;
        } else {
          console.warn(`⚠️ Skip: ${oldName} (invalid data format)`);
          skipped++;
          continue;
        }

        // Check if new field already exists
        if (allData[newName]) {
          console.log(`⏭️ Skip: ${oldName} → ${newName} (new field already exists)`);
          skipped++;
          continue;
        }

        // Save with new name
        const newData = {
          content: content,
          updatedAt: Date.now(),
        };

        await database.ref(`guideData/${newName}`).set(newData);

        console.log(`✅ Migrated: ${oldName} → ${newName}`);
        migrated++;

        // Optional: Delete old field (commented out for safety)
        // await database.ref(`guideData/${oldName}`).remove();
        // console.log(`   🗑️ Deleted old field: ${oldName}`);

      } catch (error) {
        console.error(`❌ Error migrating ${oldName}:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📝 Total mappings: ${Object.keys(fieldMapping).length}`);
    console.log('='.repeat(50));

    if (migrated > 0) {
      console.log('\n✨ Migration completed successfully!');
      console.log('💡 Tip: Refresh the page to see the migrated data.');
      console.log('\n⚠️ Note: Old field names were NOT deleted for safety.');
      console.log('   You can manually delete them after verifying the migration.');
    } else {
      console.log('\n⚠️ No fields were migrated. This could mean:');
      console.log('   1. All data already uses new field names');
      console.log('   2. No old data exists in Firebase');
      console.log('   3. New fields already exist (migration already done)');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
})();

console.log('📝 Migration script loaded. It will run automatically in a moment...\n');
