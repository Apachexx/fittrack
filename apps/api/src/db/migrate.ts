import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Works both from src/ (ts-node) and dist/ (node) by searching up for the migrations dir
  let migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.join(__dirname, '..', '..', 'src', 'db', 'migrations');
  }

  // Create migration tracking table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const files = fs.readdirSync(migrationsDir).sort();
  console.log('Migration başlatılıyor...');

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;

    // Skip already-run migrations
    const { rows } = await pool.query(
      'SELECT filename FROM _migrations WHERE filename = $1',
      [file]
    );
    if (rows.length > 0) {
      console.log(`  ⏭  ${file} (zaten çalıştı)`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`  Çalıştırılıyor: ${file}`);
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`  ✓ ${file}`);
  }

  await pool.end();
  console.log('Migration tamamlandı!');
}

migrate().catch((err) => {
  console.error('Migration hatası:', err);
  process.exit(1);
});
