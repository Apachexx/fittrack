import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as programService from '../services/program.service';

export async function listPrograms(req: AuthRequest, res: Response): Promise<void> {
  const { level, goal } = req.query as { level?: string; goal?: string };
  const programs = await programService.listPrograms({ level, goal });
  res.json(programs);
}

export async function getProgram(req: AuthRequest, res: Response): Promise<void> {
  const program = await programService.getProgram(req.params.id);
  if (!program) {
    res.status(404).json({ error: 'Program bulunamadı' });
    return;
  }
  res.json(program);
}

export async function enrollProgram(req: AuthRequest, res: Response): Promise<void> {
  const enrollment = await programService.enrollProgram(req.params.id, req.user!.id);
  if (!enrollment) {
    res.status(404).json({ error: 'Program bulunamadı' });
    return;
  }
  res.status(201).json(enrollment);
}

export async function getActiveProgram(req: AuthRequest, res: Response): Promise<void> {
  const active = await programService.getActiveProgram(req.user!.id);
  res.json(active);
}

export async function updateProgress(req: AuthRequest, res: Response): Promise<void> {
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
}
