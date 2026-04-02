import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as supplementService from '../services/supplement.service';

export async function listSupplements(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { category } = req.query as { category?: string };
    const supplements = await supplementService.listSupplements(category);
    res.json(supplements);
  } catch (err) {
    console.error('listSupplements error:', err);
    res.status(500).json({ error: 'Supplementler listelenemedi' });
  }
}

export async function getUserSupplements(req: AuthRequest, res: Response): Promise<void> {
  try {
    const supplements = await supplementService.getUserSupplements(req.user!.id);
    res.json(supplements);
  } catch (err) {
    console.error('getUserSupplements error:', err);
    res.status(500).json({ error: 'Supplement listeniz getirilemedi' });
  }
}

export async function addUserSupplement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { supplementId, dose, scheduleTime } = req.body;
    if (!supplementId) { res.status(400).json({ error: 'supplementId gerekli' }); return; }
    const result = await supplementService.addUserSupplement(
      req.user!.id, supplementId, dose, scheduleTime
    );
    res.status(201).json(result);
  } catch (err) {
    console.error('addUserSupplement error:', err);
    res.status(500).json({ error: 'Supplement eklenemedi' });
  }
}

export async function updateUserSupplement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { dose, scheduleTime } = req.body;
    const result = await supplementService.updateUserSupplement(req.user!.id, id, {
      dose,
      scheduleTime: scheduleTime !== undefined ? scheduleTime : undefined,
    });
    if (!result) { res.status(404).json({ error: 'Bulunamadı' }); return; }
    res.json(result);
  } catch (err) {
    console.error('updateUserSupplement error:', err);
    res.status(500).json({ error: 'Supplement güncellenemedi' });
  }
}

export async function removeUserSupplement(req: AuthRequest, res: Response): Promise<void> {
  try {
    await supplementService.removeUserSupplement(req.user!.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('removeUserSupplement error:', err);
    res.status(500).json({ error: 'Supplement silinemedi' });
  }
}

export async function getDailyLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const logs = await supplementService.getDailyLogs(req.user!.id, date);
    res.json(logs);
  } catch (err) {
    console.error('getDailyLogs error:', err);
    res.status(500).json({ error: 'Günlük loglar getirilemedi' });
  }
}

export async function markTaken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const result = await supplementService.markTaken(req.user!.id, id, date);
    res.json({ ok: true, log: result });
  } catch (err) {
    console.error('markTaken error:', err);
    res.status(500).json({ error: 'İşaretlenemedi' });
  }
}

export async function unmarkTaken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    await supplementService.unmarkTaken(req.user!.id, id, date);
    res.json({ ok: true });
  } catch (err) {
    console.error('unmarkTaken error:', err);
    res.status(500).json({ error: 'İşaret kaldırılamadı' });
  }
}

export async function savePushSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Geçersiz subscription verisi' });
      return;
    }
    await supplementService.savePushSubscription(req.user!.id, endpoint, keys.p256dh, keys.auth);
    res.json({ ok: true });
  } catch (err) {
    console.error('savePushSubscription error:', err);
    res.status(500).json({ error: 'Bildirim aboneliği kaydedilemedi' });
  }
}

export async function deletePushSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { endpoint } = req.body;
    if (!endpoint) { res.status(400).json({ error: 'endpoint gerekli' }); return; }
    await supplementService.deletePushSubscription(req.user!.id, endpoint);
    res.json({ ok: true });
  } catch (err) {
    console.error('deletePushSubscription error:', err);
    res.status(500).json({ error: 'Bildirim aboneliği silinemedi' });
  }
}

export async function getVapidPublicKey(_req: AuthRequest, res: Response): Promise<void> {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) { res.status(503).json({ error: 'Push bildirimleri yapılandırılmamış' }); return; }
  res.json({ key });
}
