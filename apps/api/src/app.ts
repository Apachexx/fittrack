import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { requireAuth } from './middleware/auth';
import { uploadDir } from './middleware/upload';

import authRoutes from './routes/auth.routes';
import workoutRoutes from './routes/workout.routes';
import nutritionRoutes from './routes/nutrition.routes';
import programRoutes from './routes/program.routes';
import progressRoutes from './routes/progress.routes';
import chatRoutes from './routes/chat.routes';
import settingsRoutes from './routes/settings.routes';
import supplementRoutes from './routes/supplement.routes';
import { startSupplementReminderJob } from './jobs/supplementReminder';
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
// Genel limit: 500 istek / 15 dakika
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek. Lütfen biraz bekleyin.' },
  skip: (req) => req.path.startsWith('/auth/'), // auth endpoint'leri limit dışı
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Protected image serving — reads from DB (persists across Railway deploys)
app.get('/api/dm-image/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { rows } = await pool.query(
      'SELECT mime_type, data FROM dm_image_blobs WHERE id = $1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bulunamadı' });
    res.setHeader('Content-Type', rows[0].mime_type);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.setHeader('Content-Disposition', 'inline');
    res.send(rows[0].data);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Rotalar
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/supplements', supplementRoutes);

// Sağlık kontrolü
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), v: 'db-image-storage' });
});

// Deploy version endpoint — changes on every server restart (= every deploy)
// Client uses this to detect new deploys and force cache clear
const SERVER_START_VERSION = Date.now().toString();
app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ v: SERVER_START_VERSION });
});

// Hata işleyici
app.use(errorHandler);

// Production: web static dosyalarını servis et
const webDistPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  // sw.js must NEVER be cached — browser must always fetch the latest SW
  app.use('/sw.js', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    next();
  });
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
    startSupplementReminderJob();
    httpServer.listen(PORT, () => {
      console.log(`🚀 V&S API çalışıyor: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration hatası, server yine de başlatılıyor:', err);
    httpServer.listen(PORT, () => {
      console.log(`🚀 V&S API çalışıyor: http://localhost:${PORT}`);
    });
  });

export default app;
