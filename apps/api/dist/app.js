"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("./middleware/auth");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const workout_routes_1 = __importDefault(require("./routes/workout.routes"));
const nutrition_routes_1 = __importDefault(require("./routes/nutrition.routes"));
const program_routes_1 = __importDefault(require("./routes/program.routes"));
const progress_routes_1 = __importDefault(require("./routes/progress.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const supplement_routes_1 = __importDefault(require("./routes/supplement.routes"));
const supplementReminder_1 = require("./jobs/supplementReminder");
const error_1 = require("./middleware/error");
const socket_1 = require("./socket");
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
// Socket.io
(0, socket_1.attachSocketServer)(httpServer);
// Railway/proxy desteği
app.set('trust proxy', 1);
// Güvenlik
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Protected image serving — reads from DB (persists across Railway deploys)
app.get('/api/dm-image/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { rows } = await db_1.default.query('SELECT mime_type, data FROM dm_image_blobs WHERE id = $1', [req.params.id]);
        if (!rows[0])
            return res.status(404).json({ error: 'Bulunamadı' });
        res.setHeader('Content-Type', rows[0].mime_type);
        res.setHeader('Cache-Control', 'private, max-age=86400');
        res.setHeader('Content-Disposition', 'inline');
        res.send(rows[0].data);
    }
    catch (e) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
// Rotalar
app.use('/api/auth', auth_routes_1.default);
app.use('/api/workouts', workout_routes_1.default);
app.use('/api/nutrition', nutrition_routes_1.default);
app.use('/api/programs', program_routes_1.default);
app.use('/api/progress', progress_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/supplements', supplement_routes_1.default);
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
app.use(error_1.errorHandler);
// Production: web static dosyalarını servis et
const webDistPath = path_1.default.join(__dirname, '../../web/dist');
if (fs_1.default.existsSync(webDistPath)) {
    // sw.js must NEVER be cached — browser must always fetch the latest SW
    app.use('/sw.js', (_req, res, next) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        next();
    });
    app.use(express_1.default.static(webDistPath));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(webDistPath, 'index.html'));
    });
}
async function runMigrations() {
    let migrationsDir = path_1.default.join(__dirname, 'db', 'migrations');
    if (!fs_1.default.existsSync(migrationsDir)) {
        migrationsDir = path_1.default.join(__dirname, '..', 'src', 'db', 'migrations');
    }
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
    const files = fs_1.default.readdirSync(migrationsDir).sort().filter((f) => f.endsWith('.sql'));
    for (const file of files) {
        const { rows } = await db_1.default.query('SELECT filename FROM _migrations WHERE filename = $1', [file]);
        if (rows.length > 0)
            continue;
        const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), 'utf-8');
        await db_1.default.query(sql);
        await db_1.default.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        console.log(`✓ Migration: ${file}`);
    }
}
const PORT = process.env.PORT || 3001;
runMigrations()
    .then(() => {
    (0, supplementReminder_1.startSupplementReminderJob)();
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
exports.default = app;
