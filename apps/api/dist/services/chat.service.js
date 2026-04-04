"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateWordCache = invalidateWordCache;
exports.filterContent = filterContent;
exports.isAdmin = isAdmin;
exports.isModerator = isModerator;
exports.setModerator = setModerator;
exports.getModerators = getModerators;
exports.clearChat = clearChat;
exports.isUserBanned = isUserBanned;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.getBans = getBans;
exports.getMessages = getMessages;
exports.createMessage = createMessage;
exports.deleteOwnMessage = deleteOwnMessage;
exports.getMessageOwner = getMessageOwner;
exports.deleteMessage = deleteMessage;
exports.getUserNames = getUserNames;
exports.searchUsers = searchUsers;
exports.getAllUsers = getAllUsers;
exports.getFriends = getFriends;
exports.getPendingRequests = getPendingRequests;
exports.getSentRequests = getSentRequests;
exports.sendFriendRequest = sendFriendRequest;
exports.acceptFriendRequest = acceptFriendRequest;
exports.rejectFriendRequest = rejectFriendRequest;
exports.removeFriend = removeFriend;
exports.areFriends = areFriends;
exports.getDMs = getDMs;
exports.saveDM = saveDM;
exports.openDMImage = openDMImage;
exports.markDMsRead = markDMsRead;
exports.getUnreadCounts = getUnreadCounts;
exports.getBannedWords = getBannedWords;
exports.addBannedWord = addBannedWord;
exports.removeBannedWord = removeBannedWord;
const db_1 = require("../db");
/* ─────────────── profanity filter ─── */
let cachedWords = [];
let cacheTime = 0;
async function getBannedWordList() {
    if (Date.now() - cacheTime < 30000)
        return cachedWords;
    const rows = await (0, db_1.query)('SELECT word FROM banned_words', []);
    cachedWords = rows.map((r) => r.word.toLowerCase());
    cacheTime = Date.now();
    return cachedWords;
}
function invalidateWordCache() { cacheTime = 0; }
async function filterContent(content) {
    const words = await getBannedWordList();
    if (words.length === 0)
        return content;
    let result = content;
    for (const w of words) {
        const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        result = result.replace(re, '*'.repeat(w.length));
    }
    return result;
}
/* ─────────────── admin / mod ─── */
async function isAdmin(userId) {
    const rows = await (0, db_1.query)('SELECT is_admin FROM users WHERE id = $1', [userId]);
    return rows[0]?.is_admin === true;
}
async function isModerator(userId) {
    const rows = await (0, db_1.query)('SELECT is_moderator, is_admin FROM users WHERE id = $1', [userId]);
    return rows[0]?.is_admin === true || rows[0]?.is_moderator === true;
}
async function setModerator(targetId, value) {
    await (0, db_1.query)('UPDATE users SET is_moderator = $2 WHERE id = $1', [targetId, value]);
}
async function getModerators() {
    return (0, db_1.query)('SELECT id, name, is_admin, is_moderator FROM users WHERE is_moderator = TRUE OR is_admin = TRUE ORDER BY name', []);
}
async function clearChat(deletedBy) {
    await (0, db_1.query)('UPDATE chat_messages SET is_deleted = TRUE, deleted_by = $1, cleared_at = NOW() WHERE is_deleted = FALSE', [deletedBy]);
}
/* ─────────────── ban ─── */
async function isUserBanned(userId) {
    const rows = await (0, db_1.query)(`SELECT id FROM user_bans
     WHERE user_id = $1
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`, [userId]);
    return rows.length > 0;
}
async function banUser(userId, bannedBy, reason, durationMinutes) {
    const expiresAt = durationMinutes
        ? new Date(Date.now() + durationMinutes * 60000).toISOString()
        : null;
    const rows = await (0, db_1.query)(`INSERT INTO user_bans (user_id, banned_by, reason, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id, expires_at`, [userId, bannedBy, reason ?? null, expiresAt]);
    return rows[0];
}
async function unbanUser(banId) {
    await (0, db_1.query)('DELETE FROM user_bans WHERE id = $1', [banId]);
}
async function getBans() {
    return (0, db_1.query)(`SELECT ub.id, ub.user_id, u.name AS user_name,
            ub.reason, ub.expires_at, ub.created_at
     FROM user_bans ub
     JOIN users u ON u.id = ub.user_id
     WHERE ub.expires_at IS NULL OR ub.expires_at > NOW()
     ORDER BY ub.created_at DESC`, []);
}
/* ─────────────── messages ─── */
async function getMessages(limit = 60) {
    const rows = await (0, db_1.query)(`SELECT cm.id, cm.user_id, COALESCE(u.name, 'Silinmiş Kullanıcı') AS name,
            cm.content, cm.is_deleted, cm.created_at,
            COALESCE(u.is_moderator, FALSE) AS is_mod,
            COALESCE(u.is_admin, FALSE) AS is_admin
     FROM chat_messages cm
     LEFT JOIN users u ON u.id = cm.user_id
     WHERE cm.is_deleted = FALSE
     ORDER BY cm.created_at DESC
     LIMIT $1`, [limit]);
    return rows.reverse().map(toMsg);
}
function toMsg(r) {
    const name = r.name || 'Kullanıcı';
    return {
        id: r.id,
        userId: r.user_id,
        userName: name,
        userInitials: name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
        content: r.content,
        isDeleted: r.is_deleted,
        isMod: r.is_mod ?? false,
        isAdmin: r.is_admin ?? false,
        createdAt: r.created_at,
    };
}
async function createMessage(userId, content) {
    const rows = await (0, db_1.query)(`INSERT INTO chat_messages (user_id, content)
     VALUES ($1, $2)
     RETURNING id, user_id,
       (SELECT name FROM users WHERE id = $1) AS name,
       content, is_deleted, created_at,
       (SELECT is_moderator FROM users WHERE id = $1) AS is_mod,
       (SELECT is_admin FROM users WHERE id = $1) AS is_admin`, [userId, content]);
    return toMsg(rows[0]);
}
async function deleteOwnMessage(messageId, userId) {
    const result = await (0, db_1.query)('UPDATE chat_messages SET is_deleted = TRUE, deleted_by = $2 WHERE id = $1 AND user_id = $2 RETURNING id', [messageId, userId]);
    return result.length > 0;
}
async function getMessageOwner(messageId) {
    const rows = await (0, db_1.query)('SELECT user_id FROM chat_messages WHERE id = $1', [messageId]);
    return rows[0]?.user_id ?? null;
}
async function deleteMessage(messageId, deletedBy) {
    await (0, db_1.query)('UPDATE chat_messages SET is_deleted = TRUE, deleted_by = $2 WHERE id = $1', [messageId, deletedBy]);
}
/* ─────────────── users ─── */
async function getUserNames(ids) {
    if (ids.length === 0)
        return [];
    return (0, db_1.query)(`SELECT id, name, is_moderator AS is_mod, is_admin FROM users WHERE id = ANY($1)`, [ids]);
}
async function searchUsers(q, exclude) {
    return (0, db_1.query)(`SELECT id, name FROM users
     WHERE id != $2 AND LOWER(name) LIKE LOWER($1)
     ORDER BY name LIMIT 20`, [`%${q}%`, exclude]);
}
async function getAllUsers(exclude) {
    return (0, db_1.query)(`SELECT id, name FROM users WHERE id != $1 ORDER BY name LIMIT 50`, [exclude]);
}
/* ─────────────── friends ─── */
async function getFriends(userId) {
    const rows = await (0, db_1.query)(`SELECT f.id, f.requester_id, f.addressee_id, f.status, f.created_at,
            CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS other_id,
            CASE WHEN f.requester_id = $1 THEN ua.name ELSE ur.name END AS other_name
     FROM friendships f
     JOIN users ur ON ur.id = f.requester_id
     JOIN users ua ON ua.id = f.addressee_id
     WHERE (f.requester_id = $1 OR f.addressee_id = $1)
       AND f.status = 'accepted'
     ORDER BY other_name`, [userId]);
    return rows.map((r) => ({
        id: r.id,
        requesterId: r.requester_id,
        addresseeId: r.addressee_id,
        status: r.status,
        createdAt: r.created_at,
        otherUser: { id: r.other_id, name: r.other_name },
    }));
}
async function getPendingRequests(userId) {
    return (0, db_1.query)(`SELECT f.id, f.requester_id, u.name AS requester_name, f.created_at
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`, [userId]);
}
async function getSentRequests(userId) {
    return (0, db_1.query)(`SELECT f.id, f.addressee_id, u.name AS addressee_name, f.status
     FROM friendships f
     JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = $1 AND f.status = 'pending'`, [userId]);
}
async function sendFriendRequest(requesterId, addresseeId) {
    // Already friends or already sent?
    const existing = await (0, db_1.query)(`SELECT id FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`, [requesterId, addresseeId]);
    if (existing.length > 0)
        return null;
    const rows = await (0, db_1.query)(`INSERT INTO friendships (requester_id, addressee_id)
     VALUES ($1, $2)
     RETURNING id, requester_id, addressee_id, status, created_at,
       (SELECT name FROM users WHERE id = $1) AS req_name`, [requesterId, addresseeId]);
    const r = rows[0];
    return {
        id: r.id,
        requesterId: r.requester_id,
        addresseeId: r.addressee_id,
        status: r.status,
        createdAt: r.created_at,
        otherUser: { id: r.requester_id, name: r.req_name },
    };
}
async function acceptFriendRequest(friendshipId, userId) {
    const rows = await (0, db_1.query)(`UPDATE friendships SET status = 'accepted', updated_at = NOW()
     WHERE id = $1 AND addressee_id = $2
     RETURNING id, requester_id, addressee_id,
       (SELECT name FROM users WHERE id = requester_id) AS req_name`, [friendshipId, userId]);
    if (!rows[0])
        return null;
    const r = rows[0];
    return {
        id: r.id,
        requesterId: r.requester_id,
        addresseeId: r.addressee_id,
        otherUser: { id: r.requester_id, name: r.req_name },
    };
}
async function rejectFriendRequest(friendshipId, userId) {
    await (0, db_1.query)(`UPDATE friendships SET status = 'rejected', updated_at = NOW()
     WHERE id = $1 AND addressee_id = $2`, [friendshipId, userId]);
}
async function removeFriend(userId, friendId) {
    await (0, db_1.query)(`DELETE FROM friendships
     WHERE status = 'accepted'
       AND ((requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1))`, [userId, friendId]);
}
async function areFriends(userA, userB) {
    const rows = await (0, db_1.query)(`SELECT id FROM friendships
     WHERE status = 'accepted'
       AND ((requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1))
     LIMIT 1`, [userA, userB]);
    return rows.length > 0;
}
/* ─────────────── DMs ─── */
async function getDMs(userId, friendId, limit = 50) {
    const rows = await (0, db_1.query)(`SELECT dm.id, dm.sender_id, dm.receiver_id,
            COALESCE(u.name, 'Silindi') AS name,
            dm.content, dm.is_read, dm.created_at,
            dm.msg_type, dm.image_url, dm.view_timer, dm.viewed_at, dm.expires_at
     FROM direct_messages dm
     LEFT JOIN users u ON u.id = dm.sender_id
     WHERE ((dm.sender_id = $1 AND dm.receiver_id = $2)
        OR (dm.sender_id = $2 AND dm.receiver_id = $1))
       AND (dm.expires_at IS NULL OR dm.expires_at > NOW())
     ORDER BY dm.created_at ASC
     LIMIT $3`, [userId, friendId, limit]);
    return rows.map((r) => ({
        id: r.id,
        senderId: r.sender_id,
        receiverId: r.receiver_id,
        senderName: r.name,
        content: r.content,
        isRead: r.is_read,
        createdAt: r.created_at,
        msgType: (r.msg_type || 'text'),
        imageUrl: r.image_url,
        viewTimer: r.view_timer,
        viewedAt: r.viewed_at,
        expiresAt: r.expires_at,
    }));
}
async function saveDM(senderId, receiverId, content, opts) {
    const msgType = opts?.imageUrl ? 'image' : 'text';
    const rows = await (0, db_1.query)(`INSERT INTO direct_messages
       (sender_id, receiver_id, content, msg_type, image_url, view_timer)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, sender_id, receiver_id,
       (SELECT name FROM users WHERE id = $1) AS name,
       content, is_read, created_at,
       msg_type, image_url, view_timer, viewed_at, expires_at`, [senderId, receiverId, content, msgType, opts?.imageUrl ?? null, opts?.viewTimer ?? null]);
    const r = rows[0];
    return {
        id: r.id,
        senderId: r.sender_id,
        receiverId: r.receiver_id,
        senderName: r.name,
        content: r.content,
        isRead: r.is_read,
        createdAt: r.created_at,
        msgType: msgType,
        imageUrl: r.image_url,
        viewTimer: r.view_timer,
        viewedAt: r.viewed_at,
        expiresAt: r.expires_at,
    };
}
// Called when recipient opens an image — starts the timer
async function openDMImage(messageId, viewerId) {
    const rows = await (0, db_1.query)(`UPDATE direct_messages
     SET viewed_at   = COALESCE(viewed_at, NOW()),
         expires_at  = CASE
           WHEN viewed_at IS NULL AND view_timer IS NOT NULL AND view_timer > 0
             THEN NOW() + (view_timer || ' seconds')::INTERVAL
           WHEN viewed_at IS NULL AND view_timer = 0
             THEN NOW() + INTERVAL '10 seconds'
           ELSE expires_at
         END
     WHERE id = $1 AND receiver_id = $2 AND msg_type = 'image'
     RETURNING id, sender_id, receiver_id,
       (SELECT name FROM users WHERE id = sender_id) AS name,
       content, is_read, created_at,
       msg_type, image_url, view_timer, viewed_at, expires_at`, [messageId, viewerId]);
    if (!rows[0])
        return null;
    const r = rows[0];
    return {
        id: r.id, senderId: r.sender_id, receiverId: r.receiver_id,
        senderName: r.name, content: r.content, isRead: r.is_read,
        createdAt: r.created_at, msgType: 'image',
        imageUrl: r.image_url, viewTimer: r.view_timer,
        viewedAt: r.viewed_at, expiresAt: r.expires_at,
    };
}
async function markDMsRead(receiverId, senderId) {
    await (0, db_1.query)(`UPDATE direct_messages SET is_read = TRUE
     WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`, [receiverId, senderId]);
}
async function getUnreadCounts(userId) {
    const rows = await (0, db_1.query)(`SELECT sender_id, COUNT(*) AS cnt FROM direct_messages
     WHERE receiver_id = $1 AND is_read = FALSE
     GROUP BY sender_id`, [userId]);
    return Object.fromEntries(rows.map((r) => [r.sender_id, parseInt(r.cnt)]));
}
/* ─────────────── banned words ─── */
async function getBannedWords() {
    return (0, db_1.query)('SELECT id, word, created_at FROM banned_words ORDER BY word', []);
}
async function addBannedWord(word, addedBy) {
    const rows = await (0, db_1.query)(`INSERT INTO banned_words (word, added_by) VALUES (LOWER($1), $2)
     ON CONFLICT (word) DO NOTHING
     RETURNING id, word`, [word, addedBy]);
    invalidateWordCache();
    return rows[0];
}
async function removeBannedWord(wordId) {
    await (0, db_1.query)('DELETE FROM banned_words WHERE id = $1', [wordId]);
    invalidateWordCache();
}
