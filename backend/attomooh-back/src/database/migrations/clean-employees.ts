import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script to clean employees collection and remove old/invalid data
 *
 * Run this with: npx tsx src/database/migrations/clean-employees.ts
 */

async function cleanEmployees() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const employeesCollection = db.collection('employees');
    const usersCollection = db.collection('users');

    // Drop both collections to start fresh
    console.log('🗑️  Dropping employees collection...');
    await employeesCollection
      .drop()
      .catch(() => console.log('   Collection does not exist, skipping'));

    console.log('🗑️  Dropping users collection...');
    await usersCollection
      .drop()
      .catch(() => console.log('   Collection does not exist, skipping'));

    console.log('\n✅ All old data cleaned successfully!');
    console.log(
      '📝 Next step: Restart your application to let the seeder create fresh data',
    );
  } catch (error) {
    console.error('❌ Cleaning failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

cleanEmployees();
