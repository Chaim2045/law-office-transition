/**
 * בדיקת זרימת טעינת בלוקים מ-Firebase
 * Test script to diagnose block loading flow
 */

console.log('🔍 Testing Block Load Flow');
console.log('========================================\n');

// סימולציה של נתונים ב-Firebase
const mockFirebaseData = {
  // Block content (new format)
  'block_test_123': {
    content: '<p>זהו תוכן הבלוק</p>',
    updatedAt: 1736987654321
  },

  // Block metadata
  'meta_block_test_123': JSON.stringify({
    id: 'block_test_123',
    type: 'text',
    tabId: 'legal-processes',
    createdAt: 1736987654000
  })
};

console.log('📦 Mock Firebase Data:');
console.log(JSON.stringify(mockFirebaseData, null, 2));
console.log('\n');

// בדיקה 1: האם metadata מזוהה כראוי?
console.log('✅ Test 1: Metadata Detection');
Object.keys(mockFirebaseData).forEach((key) => {
  if (key.startsWith('meta_')) {
    console.log(`   Found metadata: ${key}`);
    const blockId = key.replace('meta_', '');
    console.log(`   Block ID: ${blockId}`);

    try {
      const metadata = JSON.parse(mockFirebaseData[key]);
      console.log(`   Parsed metadata:`, metadata);
    } catch (e) {
      console.log(`   ❌ Failed to parse: ${e.message}`);
    }
  }
});
console.log('\n');

// בדיקה 2: האם block content מזוהה כראוי?
console.log('✅ Test 2: Block Content Detection');
Object.keys(mockFirebaseData).forEach((key) => {
  if (key.startsWith('block_') && !key.startsWith('block_meta')) {
    console.log(`   Found block: ${key}`);
    const data = mockFirebaseData[key];

    // Check format
    if (typeof data === 'string') {
      console.log(`   Format: OLD (string)`);
      console.log(`   Content: ${data}`);
    } else if (data && typeof data === 'object' && data.content !== undefined) {
      console.log(`   Format: NEW (object)`);
      console.log(`   Content: ${data.content}`);
      console.log(`   Timestamp: ${data.updatedAt}`);
    }
  }
});
console.log('\n');

// בדיקה 3: סימולציית תהליך הטעינה
console.log('✅ Test 3: Loading Process Simulation');

// שלב 1: טעינת metadata
console.log('Stage 1: Load Metadata & Recreate Missing Blocks');
const blocksMap = new Map(); // Simulate this.blocks

Object.keys(mockFirebaseData).forEach((key) => {
  if (key.startsWith('meta_')) {
    try {
      const metadata = JSON.parse(mockFirebaseData[key]);
      const blockId = metadata.id;

      console.log(`   Processing metadata for ${blockId}`);

      if (!blocksMap.has(blockId)) {
        console.log(`   📦 Would recreate block: ${blockId}`);
        // In real code: this.recreateBlockFromMetadata(metadata, firebaseData)
        blocksMap.set(blockId, { created: true });
      } else {
        console.log(`   ℹ️ Block already exists: ${blockId}`);
      }
    } catch (e) {
      console.log(`   ❌ Error parsing metadata: ${e.message}`);
    }
  }
});
console.log('\n');

// שלב 2: עדכון תוכן
console.log('Stage 2: Update Block Content');
Object.keys(mockFirebaseData).forEach((key) => {
  if (key.startsWith('block_') && !key.startsWith('block_meta')) {
    const blockId = key;
    const rawData = mockFirebaseData[key];

    console.log(`   Processing content for ${blockId}`);

    const block = blocksMap.get(blockId);
    if (block) {
      console.log(`   ✅ Block exists - would update innerHTML`);

      // Extract content
      let contentToSet;
      if (typeof rawData === 'string') {
        contentToSet = rawData;
      } else if (rawData && typeof rawData === 'object' && rawData.content !== undefined) {
        contentToSet = rawData.content;
      }

      console.log(`   Content to set: ${contentToSet}`);
    } else {
      console.log(`   ❌ Block doesn't exist - would skip or log warning`);
    }
  }
});
console.log('\n');

console.log('========================================');
console.log('✅ Test Complete');
console.log('\n💡 Expected Behavior:');
console.log('   1. Metadata is detected and parsed');
console.log('   2. Missing blocks are recreated');
console.log('   3. Block content is updated');
console.log('\n⚠️ Common Issues:');
console.log('   - Metadata not saved when block created');
console.log('   - Metadata in wrong format (not stringified)');
console.log('   - Block exists check failing');
console.log('   - Tab container not found during recreation');
