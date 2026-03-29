import { query } from '../db';

/* ─────────────── types ─── */
export interface ChatMessage {
  id: string;
  userId: string | null;
  userName: string;
  userInitials: string;
  content: string;
  isDeleted: boolean;
  isMod: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
  otherUser: { id: string; name: string };
}

export interface DirectMessage {
  id: string;
  senderId: string | null;
  receiverId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/* ─────────────── profanity filter ─── */
let cachedWords: string[] = [];
let cacheTime = 0;

async function getBannedWordList(): Promise<string[]> {
  if (Date.now() - cacheTime < 30_000) return cachedWords;
  const rows = await query<{ word: string }>('SELECT word FROM banned_words', []);
  cachedWords = rows.map((r) => r.word.toLowerCase());
  cacheTime = Date.now();
  return cachedWords;
}

export function invalidateWordCache() { cacheTime = 0; }

export async function filterContent(content: string): Promise<string> {
  const words = await getBannedWordList();
  if (words.length === 0) return content;
  let result = content;
  for (const w of words) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, '*'.repeat(w.length));
  }
  return result;
}

/* ─────────────── admin / mod ─── */
export async function isAdmin(userId: string): Promise<boolean> {
  const rows = await query<{ is_admin: boolean }>(
    'SELECT is_admin FROM users WHERE id = $1',
    [userId]
  );
  return rows[0]?.is_admin === true;
}

export async function isModerator(userId: string): Promise<boolean> {
  const rows = await query<{ is_moderator: boolean; is_admin: boolean }>(
    'SELECT is_moderator, is_admin FROM users WHERE id = $1',
    [userId]
  );
  return rows[0]?.is_admin === true || rows[0]?.is_moderator === true;
}

export async function setModerator(targetId: string, value: boolean) {
  await query('UPDATE users SET is_moderator = $2 WHERE id = $1', [targetId, value]);
}

export async function getModerators() {
  return query<{ id: string; name: string; is_admin: boolean; is_moderator: boolean }>(
    'SELECT id, name, is_admin, is_moderator FROM users WHERE is_moderator = TRUE OR is_admin = TRUE ORDER BY name',
    []
  );
}

export async function clearChat(deletedBy: string) {
  await query(
    'UPDATE chat_messages SET is_deleted = TRUE, deleted_by = $1, cleared_at = NOW() WHERE is_deleted = FALSE',
    [deletedBy]
  );
}

/* ─────────────── ban ─── */
export async function isUserBanned(userId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM user_bans
     WHERE user_id = $1
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

export async function banUser(
  userId: string,
  bannedBy: string,
  reason?: string,
  durationMinutes?: number
) {
  const expiresAt = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60_000).toISOString()
    : null;
  const rows = await query<{ id: string; expires_at: string | null }>(
    `INSERT INTO user_bans (user_id, banned_by, reason, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id, expires_at`,
    [userId, bannedBy, reason ?? null, expiresAt]
  );
  return rows[0];
}

export async function unbanUser(banId: string) {
  await query('DELETE FROM user_bans WHERE id = $1', [banId]);
}

export async function getBans() {
  return query<{
    id: string; user_id: string; user_name: string;
    reason: string; expires_at: string | null; created_at: string;
  }>(
    `SELECT ub.id, ub.user_id, u.name AS user_name,
            ub.reason, ub.expires_at, ub.created_at
     FROM user_bans ub
     JOIN users u ON u.id = ub.user_id
     WHERE ub.expires_at IS NULL OR ub.expires_at > NOW()
     ORDER BY ub.created_at DESC`,
    []
  );
}

/* ─────────────── messages ─── */
export async function getMessages(limit = 60): Promise<ChatMessage[]> {
  const rows = await query<{
    id: string; user_id: string | null; name: string;
    content: string; is_deleted: boolean; is_mod: boolean; is_admin: boolean; created_at: string;
  }>(
    `SELECT cm.id, cm.user_id, COALESCE(u.name, 'Silinmiş Kullanıcı') AS name,
            cm.content, cm.is_deleted, cm.created_at,
            COALESCE(u.is_moderator, FALSE) AS is_mod,
            COALESCE(u.is_admin, FALSE) AS is_admin
     FROM chat_messages cm
     LEFT JOIN users u ON u.id = cm.user_id
     WHERE cm.is_deleted = FALSE
     ORDER BY cm.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.reverse().map(toMsg);
}

function toMsg(r: { id: string; user_id: string | null; name: string; content: string; is_deleted: boolean; is_mod?: boolean; is_admin?: boolean; created_at: string }): ChatMessage {
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

export async function createMessage(userId: string, content: string): Promise<ChatMessage> {
  const rows = await query<{
    id: string; user_id: string; name: string;
    content: string; is_deleted: boolean; is_mod: boolean; is_admin: boolean; created_at: string;
  }>(
    `INSERT INTO chat_messages (user_id, content)
     VALUES ($1, $2)
     RETURNING id, user_id,
       (SELECT name FROM users WHERE id = $1) AS name,
       content, is_deleted, created_at,
       (SELECT is_moderator FROM users WHERE id = $1) AS is_mod,
       (SELECT is_admin FROM users WHERE id = $1) AS is_admin`,
    [userId, content]
  );
  return toMsg(rows[0]);
}

export async function deleteOwnMessage(messageId: string, userId: string) {
  const result = await query<{ id: string }>(
    'UPDATE chat_messages SET is_deleted = TRUE, deleted_by = $2 WHERE id = $1 AND user_id = $2 RETURNING id',
    [messageId, userId]
  );
  return result.length > 0;
}

export async function deleteMessage(messageId: string, deletedBy: string) {
  await query(
    'UPDATE chat_messages SET is_deleted = TRUE, deleted_by = $2 WHERE id = $1',
    [messageId, deletedBy]
  );
}

/* ─────────────── users ─── */
export async function getUserNames(ids: string[]): Promise<{ id: string; name: string; is_mod: boolean; is_admin: boolean }[]> {
  if (ids.length === 0) return [];
  return query<{ id: string; name: string; is_mod: boolean; is_admin: boolean }>(
    `SELECT id, name, is_moderator AS is_mod, is_admin FROM users WHERE id = ANY($1)`,
    [ids]
  );
}

export async function searchUsers(q: string, exclude: string) {
  return query<{ id: string; name: string }>(
    `SELECT id, name FROM users
     WHERE id != $2 AND LOWER(name) LIKE LOWER($1)
     ORDER BY name LIMIT 20`,
    [`%${q}%`, exclude]
  );
}

export async function getAllUsers(exclude: string) {
  return query<{ id: string; name: string }>(
    `SELECT id, name FROM users WHERE id != $1 ORDER BY name LIMIT 50`,
    [exclude]
  );
}

/* ─────────────── friends ─── */
export async function getFriends(userId: string): Promise<Friendship[]> {
  const rows = await query<{
    id: string; requester_id: string; addressee_id: string;
    status: string; created_at: string; other_id: string; other_name: string;
  }>(
    `SELECT f.id, f.requester_id, f.addressee_id, f.status, f.created_at,
            CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS other_id,
            CASE WHEN f.requester_id = $1 THEN ua.name ELSE ur.name END AS other_name
     FROM friendships f
     JOIN users ur ON ur.id = f.requester_id
     JOIN users ua ON ua.id = f.addressee_id
     WHERE (f.requester_id = $1 OR f.addressee_id = $1)
       AND f.status = 'accepted'
     ORDER BY other_name`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    requesterId: r.requester_id,
    addresseeId: r.addressee_id,
    status: r.status,
    createdAt: r.created_at,
    otherUser: { id: r.other_id, name: r.other_name },
  }));
}

export async function getPendingRequests(userId: string) {
  return query<{
    id: string; requester_id: string; requester_name: string; created_at: string;
  }>(
    `SELECT f.id, f.requester_id, u.name AS requester_name, f.created_at
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );
}

export async function getSentRequests(userId: string) {
  return query<{
    id: string; addressee_id: string; addressee_name: string; status: string;
  }>(
    `SELECT f.id, f.addressee_id, u.name AS addressee_name, f.status
     FROM friendships f
     JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = $1 AND f.status = 'pending'`,
    [userId]
  );
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  // Already friends or already sent?
  const existing = await query<{ id: string }>(
    `SELECT id FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [requesterId, addresseeId]
  );
  if (existing.length > 0) return null;

  const rows = await query<{
    id: string; requester_id: string; addressee_id: string;
    status: string; created_at: string; req_name: string;
  }>(
    `INSERT INTO friendships (requester_id, addressee_id)
     VALUES ($1, $2)
     RETURNING id, requester_id, addressee_id, status, created_at,
       (SELECT name FROM users WHERE id = $1) AS req_name`,
    [requesterId, addresseeId]
  );
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

export async function acceptFriendRequest(friendshipId: string, userId: string) {
  const rows = await query<{
    id: string; requester_id: string; addressee_id: string; req_name: string;
  }>(
    `UPDATE friendships SET status = 'accepted', updated_at = NOW()
     WHERE id = $1 AND addressee_id = $2
     RETURNING id, requester_id, addressee_id,
       (SELECT name FROM users WHERE id = requester_id) AS req_name`,
    [friendshipId, userId]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    requesterId: r.requester_id,
    addresseeId: r.addressee_id,
    otherUser: { id: r.requester_id, name: r.req_name },
  };
}

export async function rejectFriendRequest(friendshipId: string, userId: string) {
  await query(
    `UPDATE friendships SET status = 'rejected', updated_at = NOW()
     WHERE id = $1 AND addressee_id = $2`,
    [friendshipId, userId]
  );
}

export async function areFriends(userA: string, userB: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM friendships
     WHERE status = 'accepted'
       AND ((requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1))
     LIMIT 1`,
    [userA, userB]
  );
  return rows.length > 0;
}

/* ─────────────── DMs ─── */
export async function getDMs(userId: string, friendId: string, limit = 50): Promise<DirectMessage[]> {
  const rows = await query<{
    id: string; sender_id: string; receiver_id: string;
    name: string; content: string; is_read: boolean; created_at: string;
  }>(
    `SELECT dm.id, dm.sender_id, dm.receiver_id,
            COALESCE(u.name, 'Silindi') AS name,
            dm.content, dm.is_read, dm.created_at
     FROM direct_messages dm
     LEFT JOIN users u ON u.id = dm.sender_id
     WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
        OR (dm.sender_id = $2 AND dm.receiver_id = $1)
     ORDER BY dm.created_at ASC
     LIMIT $3`,
    [userId, friendId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    senderName: r.name,
    content: r.content,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));
}

export async function saveDM(senderId: string, receiverId: string, content: string): Promise<DirectMessage> {
  const rows = await query<{
    id: string; sender_id: string; receiver_id: string;
    name: string; content: string; is_read: boolean; created_at: string;
  }>(
    `INSERT INTO direct_messages (sender_id, receiver_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, receiver_id,
       (SELECT name FROM users WHERE id = $1) AS name,
       content, is_read, created_at`,
    [senderId, receiverId, content]
  );
  const r = rows[0];
  return {
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    senderName: r.name,
    content: r.content,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}

export async function markDMsRead(receiverId: string, senderId: string) {
  await query(
    `UPDATE direct_messages SET is_read = TRUE
     WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
    [receiverId, senderId]
  );
}

export async function getUnreadCounts(userId: string) {
  const rows = await query<{ sender_id: string; cnt: string }>(
    `SELECT sender_id, COUNT(*) AS cnt FROM direct_messages
     WHERE receiver_id = $1 AND is_read = FALSE
     GROUP BY sender_id`,
    [userId]
  );
  return Object.fromEntries(rows.map((r) => [r.sender_id, parseInt(r.cnt)]));
}

/* ─────────────── banned words ─── */
export async function getBannedWords() {
  return query<{ id: string; word: string; created_at: string }>(
    'SELECT id, word, created_at FROM banned_words ORDER BY word',
    []
  );
}

export async function addBannedWord(word: string, addedBy: string) {
  const rows = await query<{ id: string; word: string }>(
    `INSERT INTO banned_words (word, added_by) VALUES (LOWER($1), $2)
     ON CONFLICT (word) DO NOTHING
     RETURNING id, word`,
    [word, addedBy]
  );
  invalidateWordCache();
  return rows[0];
}

export async function removeBannedWord(wordId: string) {
  await query('DELETE FROM banned_words WHERE id = $1', [wordId]);
  invalidateWordCache();
}
