"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function migrate() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
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
        if (!file.endsWith('.sql'))
            continue;
        // Skip already-run migrations
        const { rows } = await pool.query('SELECT filename FROM _migrations WHERE filename = $1', [file]);
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
