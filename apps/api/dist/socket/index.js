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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSocketServer = attachSocketServer;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chat = __importStar(require("../services/chat.service"));
function attachSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    // JWT auth
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error('token_missing'));
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.data.userId = payload.sub;
            socket.data.email = payload.email;
            next();
        }
        catch {
            next(new Error('token_invalid'));
        }
    });
    // userId → Set of socketIds (multi-tab support)
    const onlineUsers = new Map();
    function addOnline(userId, socketId) {
        if (!onlineUsers.has(userId))
            onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socketId);
    }
    function removeOnline(userId, socketId) {
        const set = onlineUsers.get(userId);
        if (!set)
            return;
        set.delete(socketId);
        if (set.size === 0)
            onlineUsers.delete(userId);
    }
    function emitToUser(targetId, event, data) {
        const sockets = onlineUsers.get(targetId);
        if (sockets)
            sockets.forEach((sid) => io.to(sid).emit(event, data));
    }
    async function broadcastOnline() {
        const ids = [...onlineUsers.keys()];
        const users = await chat.getUserNames(ids);
        io.to('public').emit('users:online', users);
    }
    io.on('connection', async (socket) => {
        const userId = socket.data.userId;
        addOnline(userId, socket.id);
        socket.join('public');
        await broadcastOnline();
        // Send current online list directly to the newly connected user
        const ids = [...onlineUsers.keys()];
        const users = await chat.getUserNames(ids);
        socket.emit('users:online', users);
        /* ── Public chat ── */
        socket.on('chat:send', async (content) => {
            if (!content?.trim())
                return;
            try {
                const banned = await chat.isUserBanned(userId);
                if (banned) {
                    socket.emit('error', { message: 'Hesabınız askıya alınmıştır.' });
                    return;
                }
                const filtered = await chat.filterContent(content.trim().slice(0, 500));
                const msg = await chat.createMessage(userId, filtered);
                io.to('public').emit('chat:message', msg);
            }
            catch (e) {
                console.error('chat:send', e);
            }
        });
        /* ── DM ── */
        socket.on('dm:send', async ({ receiverId, content, imageUrl, viewTimer }) => {
            if (!receiverId)
                return;
            if (!imageUrl && !content?.trim())
                return;
            try {
                const friends = await chat.areFriends(userId, receiverId);
                if (!friends) {
                    socket.emit('error', { message: 'Sadece arkadaşlarınıza DM atabilirsiniz.' });
                    return;
                }
                const filtered = imageUrl ? '' : await chat.filterContent(content.trim().slice(0, 1000));
                const msg = await chat.saveDM(userId, receiverId, filtered, {
                    imageUrl: imageUrl || undefined,
                    viewTimer: viewTimer ?? null,
                });
                socket.emit('dm:message', msg);
                emitToUser(receiverId, 'dm:message', msg);
            }
            catch (e) {
                console.error('dm:send', e);
            }
        });
        /* ── DM image open (start timer) ── */
        socket.on('dm:open-image', async ({ messageId }) => {
            try {
                const updated = await chat.openDMImage(messageId, userId);
                if (!updated)
                    return;
                // Notify both parties about the updated message state
                socket.emit('dm:image-opened', updated);
                emitToUser(updated.senderId, 'dm:image-opened', updated);
            }
            catch (e) {
                console.error('dm:open-image', e);
            }
        });
        socket.on('dm:read', async ({ senderId }) => {
            try {
                await chat.markDMsRead(userId, senderId);
                emitToUser(senderId, 'dm:read', { by: userId });
            }
            catch (e) {
                console.error('dm:read', e);
            }
        });
        /* ── Friends ── */
        socket.on('friend:request', async ({ addresseeId }) => {
            try {
                const f = await chat.sendFriendRequest(userId, addresseeId);
                if (!f) {
                    socket.emit('error', { message: 'Zaten arkadaşsınız veya istek gönderilmiş.' });
                    return;
                }
                socket.emit('friend:sent', f);
                emitToUser(addresseeId, 'friend:request', f);
            }
            catch (e) {
                console.error('friend:request', e);
            }
        });
        socket.on('friend:accept', async ({ friendshipId }) => {
            try {
                const f = await chat.acceptFriendRequest(friendshipId, userId);
                if (!f)
                    return;
                socket.emit('friend:accepted', f);
                emitToUser(f.requesterId, 'friend:accepted', f);
            }
            catch (e) {
                console.error('friend:accept', e);
            }
        });
        socket.on('friend:reject', async ({ friendshipId }) => {
            try {
                await chat.rejectFriendRequest(friendshipId, userId);
            }
            catch (e) {
                console.error('friend:reject', e);
            }
        });
        socket.on('friend:remove', async ({ friendId }) => {
            try {
                await chat.removeFriend(userId, friendId);
                socket.emit('friend:removed', { friendId });
                emitToUser(friendId, 'friend:removed', { friendId: userId });
            }
            catch (e) {
                console.error('friend:remove', e);
            }
        });
        /* ── Kendi mesajını sil ── */
        socket.on('msg:delete_own', async ({ messageId }) => {
            try {
                const ok = await chat.deleteOwnMessage(messageId, userId);
                if (ok)
                    io.to('public').emit('chat:deleted', { messageId });
            }
            catch (e) {
                console.error('msg:delete_own', e);
            }
        });
        /* ── Mod/Admin: mesaj sil ── */
        socket.on('admin:delete_msg', async ({ messageId }) => {
            try {
                if (!(await chat.isModerator(userId)))
                    return;
                // Mesajın sahibi admin mi? Öyleyse moderatör silemez
                const msgOwner = await chat.getMessageOwner(messageId);
                if (msgOwner && await chat.isAdmin(msgOwner) && !(await chat.isAdmin(userId)))
                    return;
                await chat.deleteMessage(messageId, userId);
                io.to('public').emit('chat:deleted', { messageId });
            }
            catch (e) {
                console.error('admin:delete_msg', e);
            }
        });
        /* ── Mod/Admin: ban ── */
        socket.on('admin:ban', async ({ targetId, reason, durationMinutes }) => {
            try {
                const callerIsAdmin = await chat.isAdmin(userId);
                const callerIsMod = await chat.isModerator(userId);
                if (!callerIsMod)
                    return;
                // Mod adminleri engelleyemez
                if (!callerIsAdmin && await chat.isAdmin(targetId))
                    return;
                // Mod sadece süreli ban yapabilir
                if (!callerIsAdmin && !durationMinutes)
                    return;
                const ban = await chat.banUser(targetId, userId, reason, durationMinutes);
                io.emit('user:banned', { userId: targetId, ban });
                const msg = `Hesabınız${durationMinutes ? ` ${durationMinutes} dakika` : ''} askıya alındı${reason ? `: ${reason}` : '.'}`;
                emitToUser(targetId, 'error', { message: msg });
            }
            catch (e) {
                console.error('admin:ban', e);
            }
        });
        socket.on('admin:unban', async ({ banId }) => {
            try {
                if (!(await chat.isModerator(userId)))
                    return;
                await chat.unbanUser(banId);
                socket.emit('admin:unbanned', { banId });
            }
            catch (e) {
                console.error('admin:unban', e);
            }
        });
        /* ── Admin only: sohbeti temizle ── */
        socket.on('admin:clear_chat', async () => {
            try {
                if (!(await chat.isAdmin(userId)))
                    return;
                await chat.clearChat(userId);
                io.to('public').emit('chat:cleared');
            }
            catch (e) {
                console.error('admin:clear_chat', e);
            }
        });
        /* ── Admin only: moderatör yap / kaldır ── */
        socket.on('admin:set_mod', async ({ targetId, value }) => {
            try {
                if (!(await chat.isAdmin(userId)))
                    return;
                await chat.setModerator(targetId, value);
                io.emit('user:mod_updated', { userId: targetId, isMod: value });
            }
            catch (e) {
                console.error('admin:set_mod', e);
            }
        });
        /* ── Get online list on demand ── */
        socket.on('get:online', async () => {
            const ids = [...onlineUsers.keys()];
            const users = await chat.getUserNames(ids);
            socket.emit('users:online', users);
        });
        /* ── Last seen ── */
        socket.on('get:last_seen', async ({ userId: targetId }) => {
            const lastSeen = await chat.getLastSeen(targetId);
            socket.emit('user:last_seen', { userId: targetId, lastSeen });
        });
        socket.on('disconnect', async () => {
            removeOnline(userId, socket.id);
            await chat.updateLastSeen(userId);
            // Broadcast last_seen to all online users
            io.to('public').emit('user:went_offline', { userId, lastSeen: new Date().toISOString() });
            broadcastOnline();
        });
    });
    return io;
}
