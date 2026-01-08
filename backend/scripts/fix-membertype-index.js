// Fix MemberType compound index to allow same type for different families
// Usage: cd backend && node scripts/fix-membertype-index.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MemberType = require('../models/MemberTypeModel');

async function fixMemberTypeIndex() {
  try {
    // Connect to MongoDB
    const DB_URI = process.env.DB.replace('<db_password>', process.env.DB_PASSWORD);
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop all existing indexes on MemberType collection
    console.log('🔄 Dropping all indexes...');
    await MemberType.collection.dropIndexes();
    console.log('✅ All indexes dropped');

    // Recreate the compound index
    console.log('🔄 Creating compound index (type + family_id)...');
    await MemberType.collection.createIndex(
      { type: 1, family_id: 1 }, 
      { unique: true }
    );
    console.log('✅ Compound index created successfully!');
    
    // Show all indexes
    const indexes = await MemberType.collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    console.log('\n✅ Fix complete! Now each family can have their own member types.');
    console.log('   Example: Family A can have "Child" and Family B can also have "Child"');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixMemberTypeIndex();
