import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { requireAuth } from './middleware/auth';

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

// ── DM image upload ───────────────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || '/tmp/dm-images';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const dmStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const dmUpload = multer({
  storage: dmStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    // Accept any image/* or octet-stream (some mobile browsers send this)
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
    }
  },
});

// Protected image serving
app.get('/api/dm-image/:filename', requireAuth, (req: any, res: any) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Bulunamadı' });
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath);
});

// Upload endpoint — inline multer error handling
app.post('/api/chat/dm/upload', requireAuth, (req: any, res: any) => {
  console.log('[upload] hit, user:', req.user?.id, 'ct:', req.headers['content-type']);
  dmUpload.single('image')(req, res, (err: any) => {
    if (err) {
      console.error('[upload] multer error:', err.message);
      return res.status(400).json({ error: err.message || 'Dosya yüklenemedi' });
    }
    if (!req.file) {
      console.error('[upload] no file in req');
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }
    const url = `/api/dm-image/${req.file.filename}`;
    console.log('[upload] success:', url);
    res.json({ url });
  });
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
  res.json({ status: 'ok', timestamp: new Date().toISOString(), v: '7000000' });
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
