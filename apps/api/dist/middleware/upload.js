"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmUpload = exports.uploadDir = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.uploadDir = process.env.UPLOAD_DIR || '/tmp/dm-images';
try {
    if (!fs_1.default.existsSync(exports.uploadDir))
        fs_1.default.mkdirSync(exports.uploadDir, { recursive: true });
}
catch (e) {
    console.warn('[upload] Could not create upload dir:', e);
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, exports.uploadDir),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});
exports.dmUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        }
        else {
            cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
        }
    },
});
