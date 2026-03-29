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
exports.getMessages = getMessages;
exports.getFriends = getFriends;
exports.getPendingRequests = getPendingRequests;
exports.getDMs = getDMs;
exports.getUnreadCounts = getUnreadCounts;
exports.searchUsers = searchUsers;
exports.getMe = getMe;
exports.getModerators = getModerators;
exports.getBans = getBans;
exports.unban = unban;
exports.getBannedWords = getBannedWords;
exports.addBannedWord = addBannedWord;
exports.removeBannedWord = removeBannedWord;
const chatService = __importStar(require("../services/chat.service"));
async function getMessages(req, res) {
    try {
        const msgs = await chatService.getMessages(80);
        res.json(msgs);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Mesajlar alınamadı' });
    }
}
async function getFriends(req, res) {
    try {
        const friends = await chatService.getFriends(req.user.id);
        res.json(friends);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Arkadaşlar alınamadı' });
    }
}
async function getPendingRequests(req, res) {
    try {
        const reqs = await chatService.getPendingRequests(req.user.id);
        res.json(reqs);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'İstekler alınamadı' });
    }
}
async function getDMs(req, res) {
    try {
        const msgs = await chatService.getDMs(req.user.id, req.params.userId, 60);
        res.json(msgs);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Mesajlar alınamadı' });
    }
}
async function getUnreadCounts(req, res) {
    try {
        const counts = await chatService.getUnreadCounts(req.user.id);
        res.json(counts);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Alınamadı' });
    }
}
async function searchUsers(req, res) {
    try {
        const q = req.query.q || '';
        const users = q.length >= 2
            ? await chatService.searchUsers(q, req.user.id)
            : await chatService.getAllUsers(req.user.id);
        res.json(users);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Kullanıcılar alınamadı' });
    }
}
async function getMe(req, res) {
    try {
        const [admin, mod] = await Promise.all([
            chatService.isAdmin(req.user.id),
            chatService.isModerator(req.user.id),
        ]);
        res.json({ isAdmin: admin, isModerator: mod });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Alınamadı' });
    }
}
async function getModerators(req, res) {
    try {
        if (!(await chatService.isAdmin(req.user.id))) {
            res.status(403).json({ error: 'Yetkisiz' });
            return;
        }
        const mods = await chatService.getModerators();
        res.json(mods);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Alınamadı' });
    }
}
/* ── Admin ── */
async function getBans(req, res) {
    try {
        if (!(await chatService.isAdmin(req.user.id))) {
            res.status(403).json({ error: 'Yetkisiz' });
            return;
        }
        const bans = await chatService.getBans();
        res.json(bans);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Alınamadı' });
    }
}
async function unban(req, res) {
    try {
        if (!(await chatService.isAdmin(req.user.id))) {
            res.status(403).json({ error: 'Yetkisiz' });
            return;
        }
        await chatService.unbanUser(req.params.id);
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Alınamadı' });
    }
}
async function getBannedWords(req, res) {
    try {
        if (!(await chatService.isAdmin(req.user.id))) {
            res.status(403).json({ error: 'Yetkisiz' });
            return;
        }
        const words = await chatService.getBannedWords();
        res.json(words);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Alınamadı' });
    }
}
async function addBannedWord(req, res) {
    try {
        if (!(await chatService.isAdmin(req.user.id))) {
            res.status(403).json({ error: 'Yetkisiz' });
            return;
        }
        const { word } = req.body;
        if (!word) {
            res.status(400).json({ error: 'Kelime gerekli' });
            return;
        }
        const result = await chatService.addBannedWord(word, req.user.id);
        res.status(201).json(result);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Eklenemedi' });
    }
}
async function removeBannedWord(req, res) {
    try {
        if (!(await chatService.isAdmin(req.user.id))) {
            res.status(403).json({ error: 'Yetkisiz' });
            return;
        }
        await chatService.removeBannedWord(req.params.id);
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Silinemedi' });
    }
}
