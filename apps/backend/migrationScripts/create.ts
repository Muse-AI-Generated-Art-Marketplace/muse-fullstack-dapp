#!/usr/bin/env node
/**
 * Migration Generator
 *
 * Scaffolds a new migration file with the correct numeric prefix and boilerplate.
 *
 * Usage:
 *   npm run migrate:create <description>
 *
 * Example:
 *   npm run migrate:create add_user_email_field
 *   → creates: src/migrations/009_add_user_email_field.ts
 */

import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(__dirname, "..", "src", "migrations");

function getNextPrefix(): string {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return "001";
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_/.test(f))
    .sort();

  if (files.length === 0) return "001";

  const last = files[files.length - 1];
  const lastNum = parseInt(last.slice(0, 3), 10);
  return String(lastNum + 1).padStart(3, "0");
}

function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function generateTemplate(filename: string, description: string): string {
  const title = description
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return `/**
 * Migration: ${title}
 * Description: TODO — describe what this migration does.
 *
 * Checklist before committing:
 *   [ ] Both up() and down() are implemented
 *   [ ] Tested locally with: npm run migrate
 *   [ ] Rollback tested with: npm run migrate:rollback
 *   [ ] Status verified with:  npm run migrate:status
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // TODO: implement schema/data changes
    // Examples:
    //
    // Create a collection:
    //   await db.createCollection('mycollection');
    //
    // Add an index:
    //   await db.collection('mycollection').createIndex({ field: 1 }, { name: 'field_idx' });
    //
    // Backfill a field:
    //   await db.collection('mycollection').updateMany(
    //     { newField: { $exists: false } },
    //     { $set: { newField: 'default' } },
    //   );
    //
    // Rename a field:
    //   await db.collection('mycollection').updateMany({}, { $rename: { oldName: 'newName' } });

    console.log('${filename} up() complete.');
  },

  async down(connection: any) {
    const db = connection.db;

    // TODO: revert the changes made in up()
    // Examples:
    //
    // Drop an index:
    //   try { await db.collection('mycollection').dropIndex('field_idx'); } catch (_) {}
    //
    // Remove a backfilled field:
    //   await db.collection('mycollection').updateMany({}, { $unset: { newField: '' } });
    //
    // Drop a collection (only if safe):
    //   await db.collection('mycollection').drop();

    console.log('${filename} down() complete.');
  },
};
`;
}

function main() {
  const rawName = process.argv[2];

  if (!rawName) {
    console.error("❌ Migration name required.");
    console.error("   Usage: npm run migrate:create <description>");
    console.error("   Example: npm run migrate:create add_user_email_field");
    process.exit(1);
  }

  const description = toSnakeCase(rawName);
  if (!description) {
    console.error("❌ Invalid migration name. Use letters, numbers, and underscores only.");
    process.exit(1);
  }

  const prefix = getNextPrefix();
  const filename = `${prefix}_${description}.ts`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.error(`❌ Migration file already exists: ${filepath}`);
    process.exit(1);
  }

  fs.writeFileSync(filepath, generateTemplate(filename, description), "utf8");

  console.log(`✅ Created migration: src/migrations/${filename}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit the file: apps/backend/src/migrations/${filename}`);
  console.log(`  2. Implement up() and down()`);
  console.log(`  3. Test: npm run migrate`);
  console.log(`  4. Verify: npm run migrate:status`);
  console.log(`  5. Test rollback: npm run migrate:rollback`);
}

main();
