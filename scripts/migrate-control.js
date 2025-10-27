/**
 * Migration Runner for Control-Plane Database
 * Runs all SQL migration files in migrations/control/
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/arcus_control';

async function runMigrations() {
  console.log('🔄 Running control-plane migrations...\n');
  console.log(`Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

  const client = new pg.Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // Read migration files
    const migrationsDir = join(__dirname, '../migrations/control');
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetical order

    console.log(`Found ${sqlFiles.length} migration files:\n`);

    for (const file of sqlFiles) {
      const migrationName = file.replace('.sql', '');
      
      // Check if already executed
      const result = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [migrationName]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  ${migrationName} - Already executed`);
        continue;
      }

      // Read and execute migration
      const filePath = join(migrationsDir, file);
      const sql = await readFile(filePath, 'utf-8');

      console.log(`▶️  ${migrationName} - Executing...`);
      
      await client.query('BEGIN');
      
      try {
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );
        
        await client.query('COMMIT');
        console.log(`✅ ${migrationName} - Success\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${migrationName} failed: ${error.message}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runMigrations();
