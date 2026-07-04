import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to move data from 'users' collection to 'employees' collection
 *
 * Run this script with: npx tsx src/database/migrations/migrate-users-to-employees.ts
 */

interface User {
  _id: any;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  technicianStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function migrateUsersToEmployees() {
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
    const usersCollection = db.collection('users');
    const employeesCollection = db.collection('employees');

    // Get all users
    const users = (await usersCollection
      .find({})
      .toArray()) as unknown as User[];

    if (users.length === 0) {
      console.log('ℹ️  No users found to migrate');
      return;
    }

    console.log(`📋 Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if employee with same email already exists
      const existingEmployee = await employeesCollection.findOne({
        email: user.email,
      });

      if (existingEmployee) {
        console.log(
          `⏭️  Skipping user ${user.email} - already exists as employee`,
        );
        skippedCount++;
        continue;
      }

      // Generate customId based on role
      let customId: string;
      const existingEmployees = await employeesCollection.countDocuments({});
      const nextId = String(existingEmployees + 1).padStart(6, '0');
      customId = `EMP-${nextId}`;

      // Map user to employee structure
      const employee = {
        customId,
        name: user.name,
        phone: user.phone,
        jobTitle: user.role === 'ADMIN' ? 'System Administrator' : 'Technician',
        category: 'PERMANENT',
        area: null,
        address: '',
        notes: `Migrated from users collection on ${new Date().toISOString()}`,
        isActive: true,
        // Auth fields
        email: user.email,
        password: user.password,
        role: user.role,
        technicianStatus: user.technicianStatus || 'AVAILABLE',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      await employeesCollection.insertOne(employee);
      console.log(`✅ Migrated user ${user.email} to employee ${customId}`);
      migratedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total processed: ${users.length}`);

    // Ask if user wants to delete the users collection
    console.log('\n⚠️  Migration complete!');
    console.log('⚠️  To delete the old "users" collection, run:');
    console.log('   db.users.drop()');
    console.log('   in MongoDB shell or Compass');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrateUsersToEmployees();
