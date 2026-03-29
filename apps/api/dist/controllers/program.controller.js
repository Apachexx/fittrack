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
exports.listPrograms = listPrograms;
exports.getProgram = getProgram;
exports.enrollProgram = enrollProgram;
exports.getActiveProgram = getActiveProgram;
exports.updateProgress = updateProgress;
exports.createProgram = createProgram;
exports.getExerciseStrengthTrend = getExerciseStrengthTrend;
exports.getCommunityPrograms = getCommunityPrograms;
exports.updateProgramVisibility = updateProgramVisibility;
const programService = __importStar(require("../services/program.service"));
async function listPrograms(req, res) {
    try {
        const { level, goal } = req.query;
        const programs = await programService.listPrograms({ level, goal });
        res.json(programs);
    }
    catch (err) {
        console.error('listPrograms error:', err);
        res.status(500).json({ error: 'Programlar alınamadı' });
    }
}
async function getProgram(req, res) {
    try {
        const program = await programService.getProgram(req.params.id);
        if (!program) {
            res.status(404).json({ error: 'Program bulunamadı' });
            return;
        }
        res.json(program);
    }
    catch (err) {
        console.error('getProgram error:', err);
        res.status(500).json({ error: 'Program alınamadı' });
    }
}
async function enrollProgram(req, res) {
    try {
        const enrollment = await programService.enrollProgram(req.params.id, req.user.id);
        if (!enrollment) {
            res.status(404).json({ error: 'Program bulunamadı' });
            return;
        }
        res.status(201).json(enrollment);
    }
    catch (err) {
        console.error('enrollProgram error:', err);
        res.status(500).json({ error: 'Programa katılınamadı' });
    }
}
async function getActiveProgram(req, res) {
    try {
        const active = await programService.getActiveProgram(req.user.id);
        res.json(active);
    }
    catch (err) {
        console.error('getActiveProgram error:', err);
        res.status(500).json({ error: 'Aktif program alınamadı' });
    }
}
async function updateProgress(req, res) {
    try {
        const { currentWeek } = req.body;
        const updated = await programService.updateEnrollmentProgress(req.user.id, req.params.id, currentWeek);
        if (!updated) {
            res.status(404).json({ error: 'Kayıt bulunamadı' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        console.error('updateProgress error:', err);
        res.status(500).json({ error: 'İlerleme güncellenemedi' });
    }
}
async function createProgram(req, res) {
    try {
        const program = await programService.createCustomProgram(req.user.id, req.body);
        if (!program) {
            res.status(500).json({ error: 'Program oluşturulamadı' });
            return;
        }
        res.status(201).json(program);
    }
    catch (err) {
        console.error('createProgram error:', err);
        res.status(500).json({ error: 'Program oluşturulamadı' });
    }
}
async function getExerciseStrengthTrend(req, res) {
    try {
        const data = await programService.getExerciseStrengthTrend(req.user.id, req.params.exerciseId);
        res.json(data);
    }
    catch (err) {
        console.error('getExerciseStrengthTrend error:', err);
        res.status(500).json({ error: 'Kuvvet trendi alınamadı' });
    }
}
async function getCommunityPrograms(_req, res) {
    try {
        const programs = await programService.getCommunityPrograms();
        res.json(programs);
    }
    catch (err) {
        console.error('getCommunityPrograms error:', err);
        res.status(500).json({ error: 'Topluluk programları alınamadı' });
    }
}
async function updateProgramVisibility(req, res) {
    try {
        const { isPublic } = req.body;
        const result = await programService.toggleProgramVisibility(req.params.id, req.user.id, !!isPublic);
        if (!result) {
            res.status(403).json({ error: 'Yetki yok veya program bulunamadı' });
            return;
        }
        res.json(result);
    }
    catch (err) {
        console.error('updateProgramVisibility error:', err);
        res.status(500).json({ error: 'Program görünürlüğü güncellenemedi' });
    }
}
