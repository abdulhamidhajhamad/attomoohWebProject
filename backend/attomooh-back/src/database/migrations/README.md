# Database Migrations

This folder contains database migration scripts.

## migrate-users-to-employees.ts

This migration script moves all data from the `users` collection to the `employees` collection.

### Prerequisites

Make sure you have the following installed:
- Node.js
- tsx (for running TypeScript files directly)

Install tsx if you don't have it:
```bash
npm install -g tsx
```

### How to run

1. Make sure your `.env` file has the correct `MONGODB_URI`

2. Run the migration script:
```bash
npx tsx src/database/migrations/migrate-users-to-employees.ts
```

### What it does

1. Connects to MongoDB using `MONGODB_URI` from environment variables
2. Reads all documents from the `users` collection
3. For each user:
   - Checks if an employee with the same email already exists
   - If not, creates a new employee with:
     - Generated `customId` (e.g., EMP-000001)
     - All user data mapped to employee fields
     - Job title based on role (Admin → "System Administrator", Technician → "Technician")
     - Migration note in the `notes` field
4. Prints a summary of migrated and skipped users

### After migration

The script does NOT automatically delete the `users` collection. To delete it manually:

**Using MongoDB Shell:**
```javascript
use your_database_name
db.users.drop()
```

**Using MongoDB Compass:**
1. Connect to your database
2. Navigate to the `users` collection
3. Click "Drop Collection"

### Rollback

If something goes wrong, you can delete the migrated employees by running:
```javascript
db.employees.deleteMany({ notes: /Migrated from users collection/ })
```

This will delete all employees that have the migration note.
