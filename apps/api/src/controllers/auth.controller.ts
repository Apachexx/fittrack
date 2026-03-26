import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export async function registerHandler(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt başarısız';
    res.status(400).json({ error: message });
  }
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Giriş başarısız';
    res.status(401).json({ error: message });
  }
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token yenileme başarısız';
    res.status(401).json({ error: message });
  }
}

export async function logoutHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    await authService.logout(req.user!.id);
    res.status(204).send();
  } catch {
    res.status(204).send();
  }
}
