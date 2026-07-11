import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Initialize childrenOrder for all existing parent categories.
 *
 * For each parent category, finds its current children (ordered by createdAt)
 * and assigns sequential sortOrder values (0, 1, 2, …) so that the existing
 * display order is preserved after the new sorting feature is deployed.
 *
 * Run: npx tsx src/database/migrations/init-category-children-order.ts
 */

async function migrateCategoryChildrenOrder() {
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

    // 1. Fetch all non-root categories (level > 0) that have at least one parent
    const subCategories = await categoriesCollection
      .find({ level: { $gt: 0 }, parents: { $exists: true, $not: { $size: 0 } } })
      .project({ _id: 1, parents: 1, createdAt: 1 })
      .toArray();

    console.log(`📦 Found ${subCategories.length} sub-categories with parents`);

    // 2. Group sub-category IDs by parent
    const childrenByParent = new Map<string, { _id: string; createdAt: Date | undefined }[]>();

    for (const sub of subCategories) {
      for (const parentId of sub.parents) {
        const key = parentId.toString();
        if (!childrenByParent.has(key)) {
          childrenByParent.set(key, []);
        }
        childrenByParent.get(key)!.push({
          _id: sub._id.toString(),
          createdAt: sub.createdAt,
        });
      }
    }

    console.log(`📋 Processing ${childrenByParent.size} parent categories`);

    // 3. For each parent, sort children by createdAt then assign childrenOrder
    let updatedCount = 0;

    for (const [parentId, children] of childrenByParent) {
      // Sort by createdAt ascending (matching current findChildren sort), then _id as tiebreaker
      children.sort((a, b) => {
        const dateA = a.createdAt?.getTime() ?? 0;
        const dateB = b.createdAt?.getTime() ?? 0;
        if (dateA !== dateB) return dateA - dateB;
        return a._id.localeCompare(b._id);
      });

      const childrenOrder = children.map((child, index) => ({
        subCategoryId: child._id,
        sortOrder: index,
      }));

      await categoriesCollection.updateOne(
        { _id: new ObjectId(parentId) },
        { $set: { childrenOrder } },
      );

      updatedCount++;
    }

    console.log(`✅ Updated ${updatedCount} parent categories with childrenOrder`);
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateCategoryChildrenOrder();
