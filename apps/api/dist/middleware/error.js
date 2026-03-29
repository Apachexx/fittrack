"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error(err);
    res.status(500).json({
        error: 'Sunucu hatası',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
}
