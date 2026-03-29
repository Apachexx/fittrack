import api from './client';
import type { UserSettings } from '@/hooks/useSettings';

export const settingsApi = {
  get: () => api.get<UserSettings>('/settings').then((r) => r.data),
  put: (s: UserSettings) => api.put('/settings', s).then((r) => r.data),
};
