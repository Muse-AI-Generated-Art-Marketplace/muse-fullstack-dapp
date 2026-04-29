# Database Migration System Documentation

## Overview

This document describes the enhanced database migration system for the Muse Backend. Database migrations are scripts that manage schema changes and data consistency in MongoDB, ensuring that the database evolves in a controlled and documented manner.

## Why Migrations Matter

- **Version Control**: Track all schema changes as code
- **Team Collaboration**: Ensure all team members have the same database schema
- **Reproducibility**: Create consistent dev, staging, and production environments
- **Rollback Safety**: Ability to undo schema changes if needed
- **Data Consistency**: Maintain data integrity during schema evolution
- **Concurrent Safety**: Prevent multiple processes from running migrations simultaneously
- **Integrity Verification**: Detect if migration files have been modified after execution

## Architecture

### Components

1. **Migration Service** (`src/services/migrationService.ts`)
   - Core service that manages migrations
   - Tracks executed migrations in `migrations` collection
   - Implements up/down migration logic
   - Provides migration locking to prevent concurrent execution
   - Calculates and verifies checksums for migration integrity
   - Supports batch-based rollback operations

2. **Migration Files** (`src/migrations/`)
   - Individual migration files with up/down functions
   - Named with numeric prefixes: `001_create_users_collection.ts`, etc.
   - Executed in alphabetical order

3. **Migration Runner** (`migrationScripts/run.ts`)
   - CLI tool for running migration commands
   - Called automatically on server startup
   - Can also be run manually
   - Supports dry-run mode for previewing changes

4. **Migrations Collection**
   - MongoDB collection that tracks executed migrations
   - Prevents the same migration from running twice
   - Records execution timestamp, checksum, batch number, and execution time

5. **Migration Locks Collection**
   - MongoDB collection that manages migration locks
   - Prevents concurrent migration execution
   - Automatically releases stale locks after 30 minutes

## CLI Commands

### Run Pending Migrations

```bash
npm run migrate
```

Executes all pending migrations in order.

**Dry-run mode:**
```bash
npm run migrate -- --dry-run
# or
npm run migrate -- -d
```

### Rollback Migrations

```bash
# Rollback last migration
npm run migrate:rollback

# Rollback last N migrations
npm run migrate:rollback 3

# Rollback with dry-run
npm run migrate:rollback -- --dry-run
```

### Check Migration Status

```bash
npm run migrate:status
```

Displays the status of all migrations (executed or pending), including:
- Execution status
- Batch number
- Execution time
- Checksum (first 8 characters)

### Run Specific Migration

```bash
npm run migrate:run <migration-name>
```

Example:

```bash
npm run migrate:run 001_create_users_collection
```

### Rollback to Specific Batch

```bash
npm run migrate:batch <batch-number>
```

Rolls back all migrations executed after the specified batch.

Example:

```bash
npm run migrate:batch 2
```

### Validate Migration Checksums

```bash
npm run migrate:validate
```

Verifies that executed migration files haven't been modified since execution. Returns exit code 1 if validation fails.

## Creating a New Migration

### Step 1: Create the Migration File

Create a new file in `apps/backend/src/migrations/` with a numeric prefix:

```bash
# Example: 003_add_user_email_field.ts
```

### Step 2: Implement Migration Logic

```typescript
/**
 * Migration: Add email field to User collection
 * Description: Adds optional email field for user authentication
 */

export default {
  async up(connection: any) {
    const db = connection.db;
    const usersCollection = db.collection("users");

    // Add the email field
    await usersCollection.updateMany(
      {},
      {
        $set: { email: "" },
        $setOnInsert: { emailVerified: false, lastEmailVerificationSent: null },
      },
    );

    // Create index for email lookups
    await usersCollection.createIndex({ email: 1 }, { sparse: true });
  },

  async down(connection: any) {
    const db = connection.db;
    const usersCollection = db.collection("users");

    // Remove the index
    try {
      await usersCollection.dropIndex("email_1");
    } catch (error) {
      // Index might not exist
    }

    // Remove the email fields
    await usersCollection.updateMany(
      {},
      {
        $unset: { email: "", emailVerified: "", lastEmailVerificationSent: "" },
      },
    );
  },
};
```

### Step 3: Run the Migration

```bash
npm run migrate
```

## Migration File Structure

Each migration file must export a default object with `up` and `down` functions:

```typescript
export default {
  async up(connection: any) {
    // Modify database schema or data
    const db = connection.db;
    // ... implementation
  },

  async down(connection: any) {
    // Revert the changes
    const db = connection.db;
    // ... implementation
  },
};
```

## Best Practices

### 1. Keep Migrations Small and Focused

- One logical change per migration
- Easy to understand and debug

### 2. Always Implement Down Functions

- Ensures you can rollback if needed
- Tests the reversibility of your changes

### 3. Use Meaningful Names

```
✅ 003_add_user_email_field.ts
✅ 004_create_artwork_ratings_collection.ts
❌ 003_update.ts
❌ 004_fix.ts
```

### 4. Handle Indexes Carefully

- Create indexes in `up()`
- Drop indexes in `down()`
- Use try/catch for drops (index might not exist)

### 5. Test Migrations Locally

```bash
# Run migrations
npm run migrate

# Check status
npm run migrate:status

# Rollback if needed
npm run migrate:rollback

# Validate checksums
npm run migrate:validate
```

### 6. Use Dry-Run Mode

Always use dry-run mode before executing migrations in production:

```bash
# Preview what will happen
npm run migrate -- --dry-run

# Preview rollback
npm run migrate:rollback -- --dry-run
```

### 7. Never Modify Executed Migrations

- Once a migration is executed, never modify the file
- The system will detect modifications via checksum validation
- If you need to change something, create a new migration instead

### 8. Data Migration Patterns

#### Adding a required field with default value

```typescript
await collection.updateMany(
  { fieldName: { $exists: false } },
  { $set: { fieldName: "default-value" } },
);
```

#### Renaming a field

```typescript
await collection.updateMany(
  { oldName: { $exists: true } },
  { $rename: { oldName: "newName" } },
);
```

#### Removing a field

```typescript
await collection.updateMany({}, { $unset: { fieldName: "" } });
```

## Automatic Migrations on Server Start

Migrations run automatically when the server starts:

1. **Connection**: Server connects to MongoDB
2. **Migration Check**: Service checks for pending migrations
3. **Execution**: All pending migrations run in order
4. **Startup Continue**: Once migrations complete, server finishes initialization

This ensures the database schema is always up-to-date before the API starts.

## Troubleshooting

### Migration Fails to Execute

**Error**: "Failed to execute migration"

**Solutions**:

1. Check database connection is working: `npm run migrate:status`
2. Review migration syntax and MongoDB operations
3. Check migration file name follows naming convention
4. Ensure `up()` and `down()` functions are properly defined
5. Check if another process is holding the migration lock

### Migration Not Running

**Issue**: Migration file exists but doesn't run

**Solutions**:

1. Verify file is in `src/migrations/` directory
2. Confirm file is TypeScript (`.ts` extension)
3. Check file name is in alphabetical order for intended execution
4. Restart the server
5. Check migration status: `npm run migrate:status`

### Rollback Issues

**Error**: "No executed migrations to rollback"

**Solution**: Check migration status to see which migrations have been executed:

```bash
npm run migrate:status
```

**Error**: "Cannot rollback migration - file has been modified"

**Solution**: The migration file has been modified since execution. This is a safety feature to prevent accidental data corruption. Options:
1. Restore the original migration file from version control
2. Create a new migration to fix the issue instead of rolling back

### Schema Validation Errors

**Issue**: Migration runs but encounters validation errors

**Solutions**:

1. Ensure collection schema matches in `up()` function
2. Update existing documents to match new schema before validation
3. Use `$jsonSchema` validator carefully during migrations

### Lock Issues

**Error**: "Could not acquire migration lock - another migration may be in progress"

**Solutions**:

1. Check if another migration process is running
2. If no process is running, the lock may be stale (wait 30 minutes for auto-release)
3. Manually remove the lock from the `migration_locks` collection in MongoDB

### Checksum Validation Errors

**Error**: "Migration file has been modified since execution"

**Solutions**:

1. Never modify executed migration files
2. If you need to make changes, create a new migration instead
3. Restore the original file from version control if needed

## Examples

### Example 1: Creating a New Collection

See `001_create_users_collection.ts`

### Example 2: Adding Indexes

See `002_create_artworks_collection.ts`

### Example 3: Modifying Existing Data

```typescript
export default {
  async up(connection: any) {
    const db = connection.db;
    const artworksCollection = db.collection("artworks");

    // Update all artworks to have a status field
    await artworksCollection.updateMany(
      { status: { $exists: false } },
      { $set: { status: "active" } },
    );
  },

  async down(connection: any) {
    const db = connection.db;
    const artworksCollection = db.collection("artworks");

    // Remove the status field
    await artworksCollection.updateMany({}, { $unset: { status: "" } });
  },
};
```

## Git Workflow with Migrations

1. **Create a feature branch**

   ```bash
   git checkout -b feature/add-user-ratings
   ```

2. **Create migration file**

   ```bash
   # Create 005_create_ratings_collection.ts
   ```

3. **Test locally**

   ```bash
   npm run migrate
   npm run migrate:status
   npm run migrate:rollback  # Test rollback
   npm run migrate:up         # Restore state
   ```

4. **Commit**

   ```bash
   git add apps/backend/src/migrations/
   git commit -m "feat: add database migration for ratings"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/add-user-ratings
   ```

## Migration Checklist

Before committing a migration:

- [ ] Migration file follows naming convention
- [ ] Migration file is in `src/migrations/` directory
- [ ] Both `up()` and `down()` functions implemented
- [ ] Migration tested locally with `npm run migrate`
- [ ] Rollback tested with `npm run migrate:rollback`
- [ ] Migration status verified with `npm run migrate:status`
- [ ] Checksums validated with `npm run migrate:validate`
- [ ] Dry-run tested with `npm run migrate -- --dry-run`
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling implemented for idempotent operations
- [ ] Indexes created for better query performance
- [ ] Documentation updated if schema changes affect API contracts

## Environment Variables

Migrations use the following environment variable:

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/muse`)

## References

- [MongoDB Manual - Introduction to MongoDB](https://docs.mongodb.com/manual/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Database Migrations Best Practices](https://en.wikipedia.org/wiki/Schema_migration)
