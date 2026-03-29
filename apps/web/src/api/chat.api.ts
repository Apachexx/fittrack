import api from './client';

export const chatApi = {
  getMessages: () => api.get('/chat/messages').then((r) => r.data),
  getFriends: () => api.get('/chat/friends').then((r) => r.data),
  getRequests: () => api.get('/chat/requests').then((r) => r.data),
  getDMs: (userId: string) => api.get(`/chat/dm/${userId}`).then((r) => r.data),
  getUnread: () => api.get('/chat/unread').then((r) => r.data),
  searchUsers: (q: string) => api.get('/chat/users', { params: { q } }).then((r) => r.data),
  getMe: () => api.get('/chat/me').then((r) => r.data as { isAdmin: boolean }),
  // Admin
  getBans: () => api.get('/chat/admin/bans').then((r) => r.data),
  unban: (id: string) => api.delete(`/chat/admin/bans/${id}`),
  getBannedWords: () => api.get('/chat/admin/words').then((r) => r.data),
  addBannedWord: (word: string) => api.post('/chat/admin/words', { word }).then((r) => r.data),
  removeBannedWord: (id: string) => api.delete(`/chat/admin/words/${id}`),
};
