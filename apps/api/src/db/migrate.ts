import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log('Migration başlatılıyor...');

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
