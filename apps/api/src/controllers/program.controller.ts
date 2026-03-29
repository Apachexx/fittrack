import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as programService from '../services/program.service';

export async function listPrograms(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { level, goal } = req.query as { level?: string; goal?: string };
    const programs = await programService.listPrograms({ level, goal });
    res.json(programs);
  } catch (err) {
    console.error('listPrograms error:', err);
    res.status(500).json({ error: 'Programlar alınamadı' });
  }
}

export async function getProgram(req: AuthRequest, res: Response): Promise<void> {
  try {
    const program = await programService.getProgram(req.params.id);
    if (!program) {
      res.status(404).json({ error: 'Program bulunamadı' });
      return;
    }
    res.json(program);
  } catch (err) {
    console.error('getProgram error:', err);
    res.status(500).json({ error: 'Program alınamadı' });
  }
}

export async function enrollProgram(req: AuthRequest, res: Response): Promise<void> {
  try {
    const enrollment = await programService.enrollProgram(req.params.id, req.user!.id);
    if (!enrollment) {
      res.status(404).json({ error: 'Program bulunamadı' });
      return;
    }
    res.status(201).json(enrollment);
  } catch (err) {
    console.error('enrollProgram error:', err);
    res.status(500).json({ error: 'Programa katılınamadı' });
  }
}

export async function getActiveProgram(req: AuthRequest, res: Response): Promise<void> {
  try {
    const active = await programService.getActiveProgram(req.user!.id);
    res.json(active);
  } catch (err) {
    console.error('getActiveProgram error:', err);
    res.status(500).json({ error: 'Aktif program alınamadı' });
  }
}

export async function updateProgress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { currentWeek } = req.body;
    const updated = await programService.updateEnrollmentProgress(
      req.user!.id,
      req.params.id,
      currentWeek
    );
    if (!updated) {
      res.status(404).json({ error: 'Kayıt bulunamadı' });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error('updateProgress error:', err);
    res.status(500).json({ error: 'İlerleme güncellenemedi' });
  }
}

export async function createProgram(req: AuthRequest, res: Response): Promise<void> {
  try {
    const program = await programService.createCustomProgram(req.user!.id, req.body);
    if (!program) {
      res.status(500).json({ error: 'Program oluşturulamadı' });
      return;
    }
    res.status(201).json(program);
  } catch (err) {
    console.error('createProgram error:', err);
    res.status(500).json({ error: 'Program oluşturulamadı' });
  }
}

export async function getExerciseStrengthTrend(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await programService.getExerciseStrengthTrend(req.user!.id, req.params.exerciseId);
    res.json(data);
  } catch (err) {
    console.error('getExerciseStrengthTrend error:', err);
    res.status(500).json({ error: 'Kuvvet trendi alınamadı' });
  }
}

export async function getCommunityPrograms(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const programs = await programService.getCommunityPrograms();
    res.json(programs);
  } catch (err) {
    console.error('getCommunityPrograms error:', err);
    res.status(500).json({ error: 'Topluluk programları alınamadı' });
  }
}

export async function updateProgramVisibility(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { isPublic } = req.body;
    const result = await programService.toggleProgramVisibility(req.params.id, req.user!.id, !!isPublic);
    if (!result) {
      res.status(403).json({ error: 'Yetki yok veya program bulunamadı' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('updateProgramVisibility error:', err);
    res.status(500).json({ error: 'Program görünürlüğü güncellenemedi' });
  }
}
