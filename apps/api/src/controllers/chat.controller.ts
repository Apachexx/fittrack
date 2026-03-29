import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as chatService from '../services/chat.service';

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const msgs = await chatService.getMessages(80);
    res.json(msgs);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Mesajlar alınamadı' }); }
}

export async function getFriends(req: AuthRequest, res: Response): Promise<void> {
  try {
    const friends = await chatService.getFriends(req.user!.id);
    res.json(friends);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Arkadaşlar alınamadı' }); }
}

export async function getPendingRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const reqs = await chatService.getPendingRequests(req.user!.id);
    res.json(reqs);
  } catch (e) { console.error(e); res.status(500).json({ error: 'İstekler alınamadı' }); }
}

export async function getDMs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const msgs = await chatService.getDMs(req.user!.id, req.params.userId, 60);
    res.json(msgs);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Mesajlar alınamadı' }); }
}

export async function getUnreadCounts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const counts = await chatService.getUnreadCounts(req.user!.id);
    res.json(counts);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Alınamadı' }); }
}

export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string) || '';
    const users = q.length >= 2
      ? await chatService.searchUsers(q, req.user!.id)
      : await chatService.getAllUsers(req.user!.id);
    res.json(users);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Kullanıcılar alınamadı' }); }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [admin, mod] = await Promise.all([
      chatService.isAdmin(req.user!.id),
      chatService.isModerator(req.user!.id),
    ]);
    res.json({ isAdmin: admin, isModerator: mod });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Alınamadı' }); }
}

export async function getModerators(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!(await chatService.isAdmin(req.user!.id))) { res.status(403).json({ error: 'Yetkisiz' }); return; }
    const mods = await chatService.getModerators();
    res.json(mods);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Alınamadı' }); }
}

/* ── Admin ── */
export async function getBans(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!(await chatService.isAdmin(req.user!.id))) { res.status(403).json({ error: 'Yetkisiz' }); return; }
    const bans = await chatService.getBans();
    res.json(bans);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Alınamadı' }); }
}

export async function unban(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!(await chatService.isAdmin(req.user!.id))) { res.status(403).json({ error: 'Yetkisiz' }); return; }
    await chatService.unbanUser(req.params.id);
    res.status(204).send();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Alınamadı' }); }
}

export async function getBannedWords(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!(await chatService.isAdmin(req.user!.id))) { res.status(403).json({ error: 'Yetkisiz' }); return; }
    const words = await chatService.getBannedWords();
    res.json(words);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Alınamadı' }); }
}

export async function addBannedWord(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!(await chatService.isAdmin(req.user!.id))) { res.status(403).json({ error: 'Yetkisiz' }); return; }
    const { word } = req.body;
    if (!word) { res.status(400).json({ error: 'Kelime gerekli' }); return; }
    const result = await chatService.addBannedWord(word, req.user!.id);
    res.status(201).json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Eklenemedi' }); }
}

export async function removeBannedWord(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!(await chatService.isAdmin(req.user!.id))) { res.status(403).json({ error: 'Yetkisiz' }); return; }
    await chatService.removeBannedWord(req.params.id);
    res.status(204).send();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Silinemedi' }); }
}
