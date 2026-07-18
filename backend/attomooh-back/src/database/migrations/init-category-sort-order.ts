import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Initialize / normalize sortOrder for all root categories.
 *
 * Phase 1 — Converts any string sortOrder values to Number (preserving the
 *           admin's intended order).
 * Phase 2 — Assigns sequential sortOrder (1, 2, 3, …) to categories that
 *           still lack sortOrder, ordered by createdAt ascending.
 *
 * Run: npx tsx src/database/migrations/init-category-sort-order.ts
 */

async function migrateCategorySortOrder() {
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
    const categoriesCollection = db.collection('categories');

    // ── Phase 1: Convert string sortOrder to Number ──
    const stringSortDocs = await categoriesCollection
      .find({
        sortOrder: { $type: 'string' },
      })
      .project({ _id: 1, sortOrder: 1, name: 1 })
      .toArray();

    if (stringSortDocs.length > 0) {
      console.log(`🔧 Found ${stringSortDocs.length} categories with string sortOrder — converting to Number`);
      for (const doc of stringSortDocs) {
        const numericValue = parseInt(String(doc.sortOrder), 10) || 0;
        await categoriesCollection.updateOne(
          { _id: new ObjectId(doc._id) },
          { $set: { sortOrder: numericValue } },
        );
      }
      console.log('✅ String sortOrder values converted to Number');
    } else {
      console.log('✅ No string sortOrder values found');
    }

    // ── Phase 2: Assign sortOrder to roots that still lack it ──
    const rootCategories = await categoriesCollection
      .find({
        $or: [
          { level: 0, sortOrder: { $exists: false } },
          { level: 0, sortOrder: null },
          { parents: { $exists: true, $size: 0 }, sortOrder: { $exists: false } },
          { parents: { $exists: true, $size: 0 }, sortOrder: null },
        ],
      })
      .project({ _id: 1, name: 1, createdAt: 1 })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();

    const missingCount = rootCategories.length;
    console.log(`📦 Found ${missingCount} root categories missing sortOrder`);

    if (missingCount === 0) {
      console.log('ℹ️  All root categories already have sortOrder. Exiting.');
      await client.close();
      return;
    }

    // Log first 10 for preview
    const previewLimit = Math.min(missingCount, 10);
    console.log('📋 Assigning sortOrder to (first batch):');
    for (let i = 0; i < previewLimit; i++) {
      const cat = rootCategories[i];
      const name =
        (cat.name as { ar?: string })?.ar ??
        (cat.name as { en?: string })?.en ??
        cat._id.toString();
      console.log(`   ${i + 1}. ${name} (created: ${cat.createdAt?.toISOString() ?? 'N/A'})`);
    }
    if (missingCount > previewLimit) {
      console.log(`   … and ${missingCount - previewLimit} more`);
    }

    // Determine the next sortOrder to use (max existing + 1, or 1 if none exist)
    const maxExisting = await categoriesCollection
      .findOne(
        { sortOrder: { $exists: true, $type: 'number' } },
        { sort: { sortOrder: -1 }, projection: { sortOrder: 1 } },
      );
    let nextSortOrder = (maxExisting?.sortOrder ?? 0) + 1;

    let updatedCount = 0;
    for (let index = 0; index < missingCount; index++) {
      const cat = rootCategories[index];

      await categoriesCollection.updateOne(
        { _id: new ObjectId(cat._id) },
        { $set: { sortOrder: nextSortOrder } },
      );

      nextSortOrder++;
      updatedCount++;

      if (updatedCount % 10 === 0 || updatedCount === missingCount) {
        console.log(`⏳ Progress: ${updatedCount}/${missingCount} categories updated`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} root categories with sortOrder`);
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateCategorySortOrder();
