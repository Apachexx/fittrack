import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.routes';
import workoutRoutes from './routes/workout.routes';
import nutritionRoutes from './routes/nutrition.routes';
import programRoutes from './routes/program.routes';
import progressRoutes from './routes/progress.routes';
import chatRoutes from './routes/chat.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/error';
import { attachSocketServer } from './socket';
import pool from './db';

const app = express();
const httpServer = http.createServer(app);

// Socket.io
attachSocketServer(httpServer);

// Railway/proxy desteği
app.set('trust proxy', 1);

// Güvenlik
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotalar
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);

// Sağlık kontrolü
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Hata işleyici
app.use(errorHandler);

// Production: web static dosyalarını servis et
const webDistPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

async function runMigrations() {
  let migrationsDir = path.join(__dirname, 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const files = fs.readdirSync(migrationsDir).sort().filter((f) => f.endsWith('.sql'));
  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT filename FROM _migrations WHERE filename = $1',
      [file]
    );
    if (rows.length > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`✓ Migration: ${file}`);
  }
}

const PORT = process.env.PORT || 3001;

runMigrations()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 FitTrack API çalışıyor: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration hatası, server yine de başlatılıyor:', err);
    httpServer.listen(PORT, () => {
      console.log(`🚀 FitTrack API çalışıyor: http://localhost:${PORT}`);
    });
  });

export default app;
