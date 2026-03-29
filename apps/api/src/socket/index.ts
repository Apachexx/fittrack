import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import * as chat from '../services/chat.service';

export function attachSocketServer(httpServer: http.Server) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT auth
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('token_missing'));
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        sub: string; email: string;
      };
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('token_invalid'));
    }
  });

  // userId → Set of socketIds (multi-tab support)
  const onlineUsers = new Map<string, Set<string>>();

  function addOnline(userId: string, socketId: string) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socketId);
  }

  function removeOnline(userId: string, socketId: string) {
    const set = onlineUsers.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) onlineUsers.delete(userId);
  }

  function emitToUser(targetId: string, event: string, data: unknown) {
    const sockets = onlineUsers.get(targetId);
    if (sockets) sockets.forEach((sid) => io.to(sid).emit(event, data));
  }

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    addOnline(userId, socket.id);
    socket.join('public');

    // Broadcast online list
    io.to('public').emit('users:online', [...onlineUsers.keys()]);

    /* ── Public chat ── */
    socket.on('chat:send', async (content: string) => {
      if (!content?.trim()) return;
      try {
        const banned = await chat.isUserBanned(userId);
        if (banned) { socket.emit('error', { message: 'Hesabınız askıya alınmıştır.' }); return; }
        const filtered = await chat.filterContent(content.trim().slice(0, 500));
        const msg = await chat.createMessage(userId, filtered);
        io.to('public').emit('chat:message', msg);
      } catch (e) { console.error('chat:send', e); }
    });

    /* ── DM ── */
    socket.on('dm:send', async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!content?.trim() || !receiverId) return;
      try {
        const friends = await chat.areFriends(userId, receiverId);
        if (!friends) { socket.emit('error', { message: 'Sadece arkadaşlarınıza DM atabilirsiniz.' }); return; }
        const filtered = await chat.filterContent(content.trim().slice(0, 1000));
        const msg = await chat.saveDM(userId, receiverId, filtered);
        socket.emit('dm:message', msg);
        emitToUser(receiverId, 'dm:message', msg);
      } catch (e) { console.error('dm:send', e); }
    });

    socket.on('dm:read', async ({ senderId }: { senderId: string }) => {
      try {
        await chat.markDMsRead(userId, senderId);
        emitToUser(senderId, 'dm:read', { by: userId });
      } catch (e) { console.error('dm:read', e); }
    });

    /* ── Friends ── */
    socket.on('friend:request', async ({ addresseeId }: { addresseeId: string }) => {
      try {
        const f = await chat.sendFriendRequest(userId, addresseeId);
        if (!f) { socket.emit('error', { message: 'Zaten arkadaşsınız veya istek gönderilmiş.' }); return; }
        socket.emit('friend:sent', f);
        emitToUser(addresseeId, 'friend:request', f);
      } catch (e) { console.error('friend:request', e); }
    });

    socket.on('friend:accept', async ({ friendshipId }: { friendshipId: string }) => {
      try {
        const f = await chat.acceptFriendRequest(friendshipId, userId);
        if (!f) return;
        socket.emit('friend:accepted', f);
        emitToUser(f.requesterId, 'friend:accepted', f);
      } catch (e) { console.error('friend:accept', e); }
    });

    socket.on('friend:reject', async ({ friendshipId }: { friendshipId: string }) => {
      try { await chat.rejectFriendRequest(friendshipId, userId); }
      catch (e) { console.error('friend:reject', e); }
    });

    /* ── Kendi mesajını sil ── */
    socket.on('msg:delete_own', async ({ messageId }: { messageId: string }) => {
      try {
        const ok = await chat.deleteOwnMessage(messageId, userId);
        if (ok) io.to('public').emit('chat:deleted', { messageId });
      } catch (e) { console.error('msg:delete_own', e); }
    });

    /* ── Mod/Admin: mesaj sil ── */
    socket.on('admin:delete_msg', async ({ messageId }: { messageId: string }) => {
      try {
        if (!(await chat.isModerator(userId))) return;
        await chat.deleteMessage(messageId, userId);
        io.to('public').emit('chat:deleted', { messageId });
      } catch (e) { console.error('admin:delete_msg', e); }
    });

    /* ── Mod/Admin: ban ── */
    socket.on('admin:ban', async ({ targetId, reason, durationMinutes }: {
      targetId: string; reason?: string; durationMinutes?: number;
    }) => {
      try {
        const callerIsAdmin = await chat.isAdmin(userId);
        const callerIsMod = await chat.isModerator(userId);
        if (!callerIsMod) return;
        // Mod sadece süreli ban yapabilir
        if (!callerIsAdmin && !durationMinutes) return;
        const ban = await chat.banUser(targetId, userId, reason, durationMinutes);
        io.emit('user:banned', { userId: targetId, ban });
        const msg = `Hesabınız${durationMinutes ? ` ${durationMinutes} dakika` : ''} askıya alındı${reason ? `: ${reason}` : '.'}`;
        emitToUser(targetId, 'error', { message: msg });
      } catch (e) { console.error('admin:ban', e); }
    });

    socket.on('admin:unban', async ({ banId }: { banId: string }) => {
      try {
        if (!(await chat.isModerator(userId))) return;
        await chat.unbanUser(banId);
        socket.emit('admin:unbanned', { banId });
      } catch (e) { console.error('admin:unban', e); }
    });

    /* ── Admin only: sohbeti temizle ── */
    socket.on('admin:clear_chat', async () => {
      try {
        if (!(await chat.isAdmin(userId))) return;
        await chat.clearChat(userId);
        io.to('public').emit('chat:cleared');
      } catch (e) { console.error('admin:clear_chat', e); }
    });

    /* ── Admin only: moderatör yap / kaldır ── */
    socket.on('admin:set_mod', async ({ targetId, value }: { targetId: string; value: boolean }) => {
      try {
        if (!(await chat.isAdmin(userId))) return;
        await chat.setModerator(targetId, value);
        io.emit('user:mod_updated', { userId: targetId, isMod: value });
      } catch (e) { console.error('admin:set_mod', e); }
    });

    socket.on('disconnect', () => {
      removeOnline(userId, socket.id);
      io.to('public').emit('users:online', [...onlineUsers.keys()]);
    });
  });

  return io;
}
