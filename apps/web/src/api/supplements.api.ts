import api from './client';

export interface Supplement {
  id: string;
  name: string;
  name_tr: string;
  category: 'vitamin' | 'mineral' | 'sports' | 'health';
  default_dose: string;
  timing: string | null;
  description: string | null;
}

export interface UserSupplement {
  id: string;
  supplement_id: string;
  name: string;
  name_tr: string;
  category: string;
  default_dose: string;
  timing: string | null;
  description: string | null;
  dose: string | null;
  schedule_time: string | null;
  is_active: boolean;
}

export interface DailyLog {
  user_supplement_id: string;
  supplement_id: string;
  name: string;
  name_tr: string;
  category: string;
  default_dose: string;
  dose: string | null;
  schedule_time: string | null;
  log_id: string | null;
  taken_date: string | null;
}

export const supplementsApi = {
  list: (category?: string) =>
    api.get<Supplement[]>('/supplements', { params: category ? { category } : {} }).then((r) => r.data),

  getMy: () =>
    api.get<UserSupplement[]>('/supplements/my').then((r) => r.data),

  add: (supplementId: string, dose?: string, scheduleTime?: string) =>
    api.post('/supplements/my', { supplementId, dose, scheduleTime }).then((r) => r.data),

  update: (id: string, updates: { dose?: string; scheduleTime?: string | null }) =>
    api.put(`/supplements/my/${id}`, updates).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/supplements/my/${id}`).then((r) => r.data),

  getLogs: (date: string) =>
    api.get<DailyLog[]>('/supplements/logs', { params: { date } }).then((r) => r.data),

  markTaken: (userSupplementId: string, date: string) =>
    api.post(`/supplements/logs/${userSupplementId}/take`, { date }).then((r) => r.data),

  unmarkTaken: (userSupplementId: string, date: string) =>
    api.delete(`/supplements/logs/${userSupplementId}/take`, { params: { date } }).then((r) => r.data),

  getVapidKey: () =>
    api.get<{ key: string }>('/supplements/push/vapid-key').then((r) => r.data),

  subscribePush: (subscription: PushSubscriptionJSON) =>
    api.post('/supplements/push/subscribe', subscription).then((r) => r.data),

  unsubscribePush: (endpoint: string) =>
    api.delete('/supplements/push/subscribe', { data: { endpoint } }).then((r) => r.data),
};
