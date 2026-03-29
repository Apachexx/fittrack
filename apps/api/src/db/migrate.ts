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
    // Running from dist/db/ — migrations are in src/db/migrations
    migrationsDir = path.join(__dirname, '..', '..', 'src', 'db', 'migrations');
  }

  const files = fs.readdirSync(migrationsDir).sort();

  console.log('Migration başlatılıyor...');
  console.log('Migrations dizini:', migrationsDir);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`  Çalıştırılıyor: ${file}`);
    await pool.query(sql);
    console.log(`  ✓ ${file}`);
  }

  await pool.end();
  console.log('Migration tamamlandı!');
}

migrate().catch((err) => {
  console.error('Migration hatası:', err);
  process.exit(1);
});
