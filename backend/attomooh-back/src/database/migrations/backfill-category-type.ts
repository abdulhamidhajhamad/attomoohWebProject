import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function backfillCategoryType() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const categoriesCollection = db.collection('categories');

    const result = await categoriesCollection.updateMany(
      { categoryType: { $exists: false } },
      { $set: { categoryType: 'machine' } },
    );

    console.log(`Set categoryType: 'machine' on ${result.modifiedCount} documents`);
    console.log('Done');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backfillCategoryType();
