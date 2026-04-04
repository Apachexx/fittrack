import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploadDir = process.env.UPLOAD_DIR || '/tmp/dm-images';
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.warn('[upload] Could not create upload dir:', e);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const dmUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
    }
  },
});
