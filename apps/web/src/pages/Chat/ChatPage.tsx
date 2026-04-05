import { useState, useEffect, useRef, useCallback, memo, Component } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/api/client';

/* ────────── Error Boundary ────────── */
class ChatErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false, error: '' }; }
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e.message }; }
  render() {
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm opacity-60">Sohbet yüklenirken bir hata oluştu</p>
        <p className="text-xs opacity-30 font-mono">{this.state.error}</p>
        <button onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }} className="btn btn-primary btn-sm">Yenile</button>
      </div>
    );
    return this.props.children;
  }
}

/* ────────── AuthImg ────────── */
function AuthImg({ src, className, style, draggable, onContextMenu }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setBlobUrl(null); setFailed(false);
    if (!src) return;
    let url: string;
    api.get(src.replace('/api/', '/'), { responseType: 'blob' })
      .then(r => { url = URL.createObjectURL(r.data); setBlobUrl(url); })
      .catch(() => setFailed(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [src]);
  if (failed) return (
    <div className={className} style={{ ...style, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 20, opacity: 0.4 }}>🖼️</span>
      <span style={{ fontSize: 10, opacity: 0.35 }}>Yüklenemedi</span>
    </div>
  );
  if (!blobUrl) return <div className={className} style={{ ...style, background: 'rgba(255,255,255,0.06)' }} />;
  return <img src={blobUrl} className={className} style={style} draggable={draggable} onContextMenu={onContextMenu} />;
}

/* ────────── Types ────────── */
interface Msg { id: string; userId: string | null; userName: string; content: string; createdAt: string; isMod: boolean; isAdmin: boolean; }
interface DM { id: string; senderId: string | null; receiverId: string; senderName: string; content: string; isRead: boolean; createdAt: string; msgType?: 'text' | 'image'; imageUrl?: string | null; viewTimer?: number | null; viewedAt?: string | null; expiresAt?: string | null; }
interface Friend { id: string; otherUser: { id: string; name: string }; }
interface PendingReq { id: string; requester_id: string; requester_name: string; created_at: string; }
interface Ban { id: string; user_id: string; user_name: string; reason: string; expires_at: string | null; }
interface Word { id: string; word: string; }
interface Mod { id: string; name: string; is_admin: boolean; is_moderator: boolean; }

/* ────────── Helpers ────────── */
function timeStr(iso: string | null | undefined) {
  if (!iso) return '';
  try { return format(new Date(iso), 'HH:mm', { locale: tr }); } catch { return ''; }
}
function lastSeenStr(iso: string | null | undefined) {
  if (!iso) return 'çevrimdışı';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'çevrimdışı';
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'az önce aktifti';
    if (diffMin < 60) return `${diffMin}dk önce aktifti`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}sa önce aktifti`;
    return format(d, 'd MMM', { locale: tr }) + ' aktifti';
  } catch { return 'çevrimdışı'; }
}
function avatarColor(name: string | null | undefined) {
  if (!name) return '#6b7280';
  const colors = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}
function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

/* ────────── Avatar ────────── */
function Av({ name, size = 10, online }: { name: string | null | undefined; size?: number; online?: boolean }) {
  const c = avatarColor(name);
  const px = `${size * 4}px`;
  return (
    <div className={`avatar ${online !== undefined ? (online ? 'online' : 'offline') : ''} shrink-0`}>
      <div className="rounded-full" style={{ width: px, height: px, background: c + '25', border: `2px solid ${c}50` }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, fontWeight: 700, fontSize: `${size * 1.4}px` }}>
          {initials(name)}
        </div>
      </div>
    </div>
  );
}

/* ────────── Image Send Preview ────────── */
const TIMER_OPTS = [
  { label: '∞', value: null },
  { label: '1×', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];
function ImageSendPreview({ file, preview, uploading, onSend, onClose }: { file: File; preview: string; uploading: boolean; onSend: (f: File, t: number | null) => void; onClose: () => void; }) {
  const [timer, setTimer] = useState<number | null>(null);
  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box p-0 overflow-hidden" style={{ background: '#0f1520' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">✕</button>
          <p className="font-semibold">Fotoğraf Gönder</p>
          <div className="w-9" />
        </div>
        <div className="flex items-center justify-center bg-black/40" style={{ height: 240 }}>
          <img src={preview} className="max-w-full max-h-full object-contain select-none" draggable={false} style={{ maxHeight: 240 }} />
        </div>
        <div className="px-4 py-4">
          <p className="text-xs opacity-50 mb-2 uppercase tracking-wide">Görüntüleme Süresi</p>
          <div className="flex gap-1.5 mb-4">
            {TIMER_OPTS.map(o => (
              <button key={String(o.value)} onClick={() => setTimer(o.value)}
                className={`flex-1 btn btn-sm ${timer === o.value ? 'btn-primary' : 'btn-ghost'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={() => onSend(file, timer)} disabled={uploading} className="btn btn-primary w-full">
            {uploading ? <span className="loading loading-spinner loading-sm" /> : '📤 Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Image Viewer ────────── */
const ImageViewer = memo(({ url, senderName, timer, onClose }: { url: string; senderName: string; timer: number | null; onClose: () => void; }) => {
  const [remaining, setRemaining] = useState<number | null>(timer != null ? (timer === 0 ? 10 : timer) : null);
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) { onClose(); return; }
    const t = setTimeout(() => setRemaining(r => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onClose]);
  useEffect(() => {
    const p = (e: Event) => e.preventDefault();
    const k = (e: KeyboardEvent) => { if (e.key === 'PrintScreen' || (e.ctrlKey && 's p'.includes(e.key))) e.preventDefault(); };
    document.addEventListener('contextmenu', p); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('contextmenu', p); document.removeEventListener('keydown', k); };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={onClose}>
      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute text-white/10 text-xs font-bold whitespace-nowrap"
            style={{ top: `${(i % 4) * 28}%`, left: `${Math.floor(i / 4) * 35}%`, transform: 'rotate(-30deg)' }}>
            {senderName} • V&S
          </div>
        ))}
      </div>
      <button onClick={onClose} className="btn btn-ghost btn-circle absolute top-4 right-4 z-10 text-white">✕</button>
      {remaining !== null && (
        <div className={`badge ${remaining <= 3 ? 'badge-error' : 'badge-warning'} gap-1 absolute top-4 left-1/2 -translate-x-1/2 z-10 py-3 px-4`}>
          ⏱ {remaining}s
        </div>
      )}
      <div className="relative max-w-[90vw] max-h-[80vh] select-none" onClick={e => e.stopPropagation()}>
        <AuthImg src={url} className="max-w-full max-h-[80vh] rounded-2xl object-contain select-none" draggable={false} onContextMenu={e => e.preventDefault()} />
        <div className="absolute inset-0 rounded-2xl" onContextMenu={e => e.preventDefault()} />
      </div>
    </div>
  );
});

/* ────────── Image Message ────────── */
function ImageMessage({ msg, isMe, onOpen }: { msg: DM; isMe: boolean; onOpen: (m: DM) => void }) {
  const isOpened = !!msg.viewedAt;
  const isExpired = msg.expiresAt ? new Date(msg.expiresAt) < new Date() : false;
  const isOnce = msg.viewTimer === 0;
  const style: React.CSSProperties = { width: 180, height: 140, borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#1a2840', flexShrink: 0 };
  if (isExpired) return (
    <div style={{ ...style, height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
      <span>🔒</span><span style={{ fontSize: 11, opacity: 0.5 }}>Süresi doldu</span>
    </div>
  );
  if (isMe) return (
    <div style={style}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px)', transform: 'scale(1.1)' }} draggable={false} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span>{isOpened ? '✅' : '🔒'}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{isOpened ? 'Görüntülendi' : 'Gönderildi'}{msg.viewTimer != null && ` · ${isOnce ? '1×' : `${msg.viewTimer}s`}`}</span>
      </div>
    </div>
  );
  if (isOpened) return (
    <button onClick={() => onOpen(msg)} style={{ ...style, cursor: 'pointer', border: 'none', padding: 0 }}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
    </button>
  );
  return (
    <button onClick={() => onOpen(msg)} style={{ ...style, cursor: 'pointer', border: 'none', padding: 0 }}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(16px)', transform: 'scale(1.1)' }} draggable={false} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👁</div>
        <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{msg.viewTimer != null ? (isOnce ? '1× Görüntüle' : `${msg.viewTimer}s`) : 'Görüntüle'}</span>
      </div>
    </button>
  );
}

/* ────────── Ban Modal ────────── */
function BanModal({ user, meIsAdmin, onClose, onBan }: { user: { id: string; name: string }; meIsAdmin: boolean; onClose: () => void; onBan: (r: string, m?: number) => void }) {
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'temp' | 'perm'>('temp');
  const [minutes, setMinutes] = useState('60');
  return (
    <div className="modal modal-open modal-middle">
      <div className="modal-box" style={{ background: '#0c1420' }}>
        <h3 className="font-bold text-lg mb-1">Engelle / Sustur</h3>
        <p className="text-sm opacity-50 mb-4">{user.name}</p>
        {meIsAdmin && (
          <div className="flex gap-2 mb-3">
            {(['temp', 'perm'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} className={`btn btn-sm flex-1 ${type === t ? 'btn-error' : 'btn-ghost'}`}>
                {t === 'temp' ? 'Süreli' : 'Kalıcı Ban'}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[5, 15, 30, 60, 360, 1440, 10080].map(m => (
            <button key={m} onClick={() => { setMinutes(String(m)); setType('temp'); }}
              className={`btn btn-xs ${minutes === String(m) && type === 'temp' ? 'btn-error' : 'btn-ghost'}`}>
              {m < 60 ? `${m}dk` : m < 1440 ? `${m / 60}sa` : m < 10080 ? `${m / 1440}g` : `${m / 10080}h`}
            </button>
          ))}
        </div>
        <input className="input input-bordered w-full mb-4 text-sm" placeholder="Sebep (isteğe bağlı)" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="modal-action mt-0 gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm">İptal</button>
          <button onClick={() => { onBan(reason, type === 'temp' ? parseInt(minutes) : undefined); onClose(); }} className="btn btn-error btn-sm">
            {type === 'perm' ? 'Kalıcı Banla' : 'Sustur'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
function ChatPageInner() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'public' | 'dm' | 'admin'>('public');
  const [publicMsgs, setPublicMsgs] = useState<Msg[]>([]);
  const [dmMsgs, setDmMsgs] = useState<DM[]>([]);
  const [activeDM, setActiveDM] = useState<{ id: string; name: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string; is_mod: boolean; is_admin: boolean }[]>([]);
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [input, setInput] = useState('');
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [newWord, setNewWord] = useState('');
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [modIds, setModIds] = useState<string[]>([]);
  const [viewerMsg, setViewerMsg] = useState<DM | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'info' | 'success'>('error');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeDMRef = useRef(activeDM);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);

  const showToast = useCallback((msg: string, type: 'error' | 'info' | 'success' = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastType(type); setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [publicMsgs.length, dmMsgs.length]);

  const { data: meData } = useQuery({ queryKey: ['chat-me'], queryFn: chatApi.getMe, staleTime: 60_000 });
  const isAdmin = meData?.isAdmin ?? false;
  const isMod = meData?.isModerator ?? false;

  const { data: friends = [] } = useQuery<Friend[]>({ queryKey: ['chat-friends'], queryFn: chatApi.getFriends });
  const { data: requests = [] } = useQuery<PendingReq[]>({ queryKey: ['chat-requests'], queryFn: chatApi.getRequests });
  const { data: searchResults = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['chat-users', debouncedSearch], queryFn: () => chatApi.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 1, staleTime: 30_000,
  });
  const { data: bans = [], refetch: refetchBans } = useQuery<Ban[]>({ queryKey: ['chat-bans'], queryFn: chatApi.getBans, enabled: isAdmin || isMod });
  const { data: bannedWords = [], refetch: refetchWords } = useQuery<Word[]>({ queryKey: ['chat-words'], queryFn: chatApi.getBannedWords, enabled: isAdmin });
  const { data: mods = [], refetch: refetchMods } = useQuery<Mod[]>({ queryKey: ['chat-mods'], queryFn: chatApi.getModerators, enabled: isAdmin });

  useEffect(() => { setModIds((mods as Mod[]).filter(m => m.is_moderator && !m.is_admin).map(m => m.id)); }, [mods]);
  useEffect(() => { chatApi.getMessages().then(setPublicMsgs); chatApi.getUnread().then(setUnread); }, []);
  useEffect(() => {
    if (!activeDM) return;
    chatApi.getDMs(activeDM.id).then(msgs => {
      setDmMsgs(msgs);
      setUnread(p => { const n = { ...p }; delete n[activeDM.id]; return n; });
      socket?.emit('dm:read', { senderId: activeDM.id });
    });
    socket?.emit('get:last_seen', { userId: activeDM.id });
  }, [activeDM?.id]); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;
    socket.on('users:online', (users: { id: string; name: string; is_mod: boolean; is_admin: boolean }[]) => setOnlineUsers(users));
    socket.on('user:went_offline', ({ userId: uid, lastSeen }: { userId: string; lastSeen: string }) => setLastSeenMap(p => ({ ...p, [uid]: lastSeen })));
    socket.on('user:last_seen', ({ userId: uid, lastSeen }: { userId: string; lastSeen: string | null }) => { if (lastSeen) setLastSeenMap(p => ({ ...p, [uid]: lastSeen })); });
    socket.on('dm:read', ({ by }: { by: string }) => setDmMsgs(p => p.map(m => m.senderId === user?.id && m.receiverId === by ? { ...m, isRead: true } : m)));
    socket.on('chat:message', (msg: Msg) => setPublicMsgs(p => [...p.slice(-199), msg]));
    socket.on('chat:deleted', ({ messageId }: { messageId: string }) => setPublicMsgs(p => p.filter(m => m.id !== messageId)));
    socket.on('chat:cleared', () => setPublicMsgs([]));
    socket.on('dm:message', (msg: DM) => {
      const otherId = msg.senderId === user?.id ? msg.receiverId : (msg.senderId ?? '');
      setActiveDM(curr => {
        if (curr?.id === otherId || curr?.id === msg.senderId) {
          setDmMsgs(p => [...p, msg]);
          socket.emit('dm:read', { senderId: msg.senderId });
        } else {
          setUnread(p => ({ ...p, [otherId]: (p[otherId] ?? 0) + 1 }));
        }
        return curr;
      });
    });
    socket.on('user:mod_updated', ({ userId: uid, isMod: val }: { userId: string; isMod: boolean }) => {
      setModIds(p => val ? [...p.filter(x => x !== uid), uid] : p.filter(x => x !== uid));
      refetchMods(); qc.invalidateQueries({ queryKey: ['chat-me'] });
    });
    socket.on('friend:request', () => qc.invalidateQueries({ queryKey: ['chat-requests'] }));
    socket.on('friend:accepted', () => { qc.invalidateQueries({ queryKey: ['chat-friends'] }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); });
    socket.on('friend:sent', () => { qc.invalidateQueries({ queryKey: ['chat-friends'] }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); });
    socket.on('friend:removed', ({ friendId }: { friendId: string }) => {
      qc.invalidateQueries({ queryKey: ['chat-friends'] });
      setActiveDM(curr => { if (curr?.id === friendId) { setTab('public'); return null; } return curr; });
    });
    socket.on('dm:image-opened', (updated: DM) => setDmMsgs(p => p.map(m => m.id === updated.id ? { ...m, viewedAt: updated.viewedAt, expiresAt: updated.expiresAt } : m)));
    socket.on('error', ({ message }: { message: string }) => showToast(message, 'error'));
    return () => {
      ['users:online','user:went_offline','user:last_seen','dm:read','chat:message','chat:deleted',
       'chat:cleared','dm:message','user:mod_updated','friend:request','friend:accepted',
       'friend:sent','friend:removed','dm:image-opened','error'].forEach(e => socket.off(e));
    };
  }, [socket, user?.id, qc, refetchMods, showToast]);

  const sendMessage = useCallback(() => {
    const msg = input.trim();
    if (!msg || !socket || !connected) return;
    if (tab === 'public') socket.emit('chat:send', msg);
    else if (tab === 'dm' && activeDM) socket.emit('dm:send', { receiverId: activeDM.id, content: msg });
    setInput('');
  }, [input, socket, connected, tab, activeDM]);

  const sendImage = useCallback(async (file: File, timer: number | null) => {
    const dm = activeDMRef.current;
    if (!socket || !connected || !dm) { showToast('Bağlantı yok', 'info'); return; }
    setUploading(true);
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data } = await api.post<{ url: string }>('/chat/dm/upload', { imageData, mimeType: file.type || 'image/jpeg' });
      socket.emit('dm:send', { receiverId: dm.id, content: '', imageUrl: data.url, viewTimer: timer });
      setPendingImage(null);
    } catch (e: any) {
      showToast('Fotoğraf gönderilemedi', 'error');
    } finally { setUploading(false); }
  }, [socket, connected, showToast]);

  const openImage = useCallback((msg: DM) => {
    if (!msg.viewedAt && msg.senderId !== user?.id) socket?.emit('dm:open-image', { messageId: msg.id });
    setViewerMsg(msg);
  }, [socket, user?.id]);

  function removeFriend(id: string) { socket?.emit('friend:remove', { friendId: id }); qc.invalidateQueries({ queryKey: ['chat-friends'] }); if (activeDM?.id === id) { setActiveDM(null); setTab('public'); } }
  function sendFriendRequest(id: string) { socket?.emit('friend:request', { addresseeId: id }); setSentRequestIds(p => [...p, id]); }
  function acceptRequest(id: string) { socket?.emit('friend:accept', { friendshipId: id }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); qc.invalidateQueries({ queryKey: ['chat-friends'] }); }
  function rejectRequest(id: string) { socket?.emit('friend:reject', { friendshipId: id }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); }
  function setMod(tid: string, val: boolean) { socket?.emit('admin:set_mod', { targetId: tid, value: val }); refetchMods(); }
  function doBan(reason: string, minutes?: number) { if (!banTarget) return; socket?.emit('admin:ban', { targetId: banTarget.id, reason, durationMinutes: minutes }); setTimeout(() => refetchBans(), 500); }
  function doClearChat() { socket?.emit('admin:clear_chat'); setConfirmClear(false); }
  function deleteOwnMsg(id: string) { socket?.emit('msg:delete_own', { messageId: id }); }
  function deleteMsgAdmin(id: string) { socket?.emit('admin:delete_msg', { messageId: id }); }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ── Message bubble (DaisyUI chat) ── */
  function MsgBubble({ isMe, name, content, time, isRead, extra }: { isMe: boolean; name?: string; content: React.ReactNode; time: string; isRead?: boolean; extra?: React.ReactNode }) {
    return (
      <div className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
        <div className="chat-header opacity-60 text-xs mb-0.5 flex items-center gap-1">
          {!isMe && name && <span className="font-semibold" style={{ color: avatarColor(name) }}>{name}</span>}
          <span>{time}</span>
          {isMe && isRead && <span style={{ color: '#60a5fa', fontSize: 10 }}>✓✓</span>}
          {isMe && !isRead && <span style={{ opacity: 0.4, fontSize: 10 }}>✓</span>}
        </div>
        <div className={`chat-bubble text-sm leading-relaxed ${isMe ? 'chat-bubble-primary' : ''}`} style={isMe ? {} : { background: '#1e2a3a', color: '#e2e8f0' }}>
          {content}
        </div>
        {extra && <div className="chat-footer">{extra}</div>}
      </div>
    );
  }

  /* ── Sidebar (DM list) ── */
  const dmSidebar = (
    <div className="w-72 shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Search */}
      <div className="p-3">
        <label className="input input-sm flex items-center gap-2" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 opacity-40"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Kullanıcı ara..." className="grow bg-transparent outline-none text-sm" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
        </label>
      </div>

      {/* Search results */}
      {debouncedSearch.length >= 1 && (searchResults as { id: string; name: string }[]).length > 0 && (
        <div className="px-3 pb-2">
          {(searchResults as { id: string; name: string }[]).map(u => {
            const isFriend = (friends as Friend[]).some(f => f.otherUser.id === u.id);
            const pending = sentRequestIds.includes(u.id);
            return (
              <div key={u.id} className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-white/5">
                <Av name={u.name} size={9} />
                <span className="flex-1 text-sm truncate">{u.name}</span>
                {isFriend ? <span className="text-xs text-success">✓</span>
                  : pending ? <span className="text-xs opacity-40">Gönderildi</span>
                  : <button onClick={() => sendFriendRequest(u.id)} className="btn btn-xs btn-primary">Ekle</button>}
              </div>
            );
          })}
        </div>
      )}

      {/* Pending requests */}
      {(requests as PendingReq[]).length > 0 && (
        <div className="px-3 pb-2">
          <p className="text-xs font-semibold text-warning mb-1.5">İstekler ({(requests as PendingReq[]).length})</p>
          {(requests as PendingReq[]).map(r => (
            <div key={r.id} className="flex items-center gap-2 py-1.5">
              <Av name={r.requester_name} size={8} />
              <span className="flex-1 text-sm truncate">{r.requester_name}</span>
              <button onClick={() => acceptRequest(r.id)} className="btn btn-xs btn-success btn-circle">✓</button>
              <button onClick={() => rejectRequest(r.id)} className="btn btn-xs btn-error btn-circle">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Friends list — mern-chat-app style */}
        {(friends as Friend[]).length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 opacity-30 gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" strokeLinecap="round"/></svg>
            <p className="text-xs">Henüz arkadaş yok</p>
          </div>
        )}
        {(friends as Friend[]).map((f, i, arr) => {
          const isOnline = onlineUsers.some(u => u.id === f.otherUser.id);
          const cnt = unread[f.otherUser.id] ?? 0;
          const isActive = activeDM?.id === f.otherUser.id;
          return (
            <div key={f.id}>
              <button
                onClick={() => { setActiveDM(f.otherUser); setUnread(p => ({ ...p, [f.otherUser.id]: 0 })); }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-white/[0.04]'}`}
                style={isActive ? { borderLeft: '3px solid #f97316' } : { borderLeft: '3px solid transparent' }}>
                <Av name={f.otherUser.name} size={10} online={isOnline} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate">{f.otherUser.name}</p>
                  <p className="text-xs opacity-50 mt-0.5 truncate">
                    {isOnline ? 'çevrimiçi' : lastSeenStr(lastSeenMap[f.otherUser.id])}
                  </p>
                </div>
                {cnt > 0 && <div className="badge badge-primary badge-sm">{cnt > 9 ? '9+' : cnt}</div>}
              </button>
              {i < arr.length - 1 && <div className="divider my-0 mx-4 opacity-20" />}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Message input bar ── */
  const inputBar = (isDM: boolean) => (
    <div className="shrink-0 flex items-end gap-2 px-3 py-3" style={{ background: '#111f2e', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {isDM && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setPendingImage({ file: f, preview: URL.createObjectURL(f) }); e.target.value = ''; }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={!connected} className="btn btn-ghost btn-sm btn-circle opacity-60 hover:opacity-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </>
      )}
      <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder-opacity-40"
          placeholder={isDM ? 'Mesaj...' : 'Genel sohbete yaz...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          maxLength={500} disabled={!connected} />
      </div>
      <button onClick={sendMessage} disabled={!input.trim() || !connected}
        className={`btn btn-circle btn-sm ${input.trim() ? 'btn-primary' : 'btn-ghost opacity-40'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );

  /* ────────── Render ────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      {/* Toast */}
      {toastMsg && (
        <div className="toast toast-top toast-center z-[200]">
          <div className={`alert alert-${toastType === 'error' ? 'error' : toastType === 'success' ? 'success' : 'info'} text-sm py-2`}>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {confirmClear && (
        <div className="modal modal-open modal-middle">
          <div className="modal-box text-center" style={{ background: '#0c1420' }}>
            <p className="text-3xl mb-2">🗑️</p>
            <h3 className="font-bold text-lg">Sohbeti Temizle</h3>
            <p className="text-sm opacity-50 my-3">Tüm genel sohbet mesajları silinecek.</p>
            <div className="modal-action justify-center gap-2">
              <button onClick={() => setConfirmClear(false)} className="btn btn-ghost btn-sm">İptal</button>
              <button onClick={doClearChat} className="btn btn-error btn-sm">Temizle</button>
            </div>
          </div>
        </div>
      )}
      {banTarget && <BanModal user={banTarget} meIsAdmin={isAdmin} onClose={() => setBanTarget(null)} onBan={doBan} />}
      {pendingImage && <ImageSendPreview file={pendingImage.file} preview={pendingImage.preview} uploading={uploading} onSend={sendImage} onClose={() => { setPendingImage(null); URL.revokeObjectURL(pendingImage.preview); }} />}
      {viewerMsg?.imageUrl && <ImageViewer url={viewerMsg.imageUrl} senderName={viewerMsg.senderName} timer={viewerMsg.viewTimer ?? null} onClose={() => setViewerMsg(null)} />}

      {/* ── Tab bar ── */}
      <div className="navbar shrink-0 min-h-0 px-3 py-2 gap-2" style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 flex-1">
          <span className={`badge badge-xs ${connected ? 'badge-success' : 'badge-warning animate-pulse'}`} />
          <span className="text-xs opacity-40 hidden sm:block">{connected ? `${onlineUsers.length} çevrimiçi` : 'Bağlanıyor...'}</span>
        </div>
        <div className="flex gap-1">
          {[
            { key: 'public', label: '💬 Genel' },
            { key: 'dm', label: `💬 DM${totalUnread > 0 ? ` (${totalUnread})` : ''}` },
            ...(isAdmin || isMod ? [{ key: 'admin', label: '🛡 Panel' }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'public' | 'dm' | 'admin')}
              className={`btn btn-xs ${tab === t.key ? 'btn-primary' : 'btn-ghost opacity-60'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Admin panel ── */}
      {tab === 'admin' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ background: '#0d1826' }}>
          <button onClick={() => setConfirmClear(true)} className="btn btn-error btn-sm btn-outline">🗑 Sohbeti Temizle</button>
          <div>
            <h3 className="font-semibold mb-3">Moderatörler</h3>
            {(mods as Mod[]).filter(m => !m.is_admin).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <Av name={m.name} size={9} /><div className="flex-1"><p className="text-sm font-medium text-blue-300">{m.name}</p><p className="text-xs opacity-50">Moderatör</p></div>
                <button onClick={() => setMod(m.id, false)} className="btn btn-error btn-xs btn-outline">Kaldır</button>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-semibold mb-3">Aktif Engellemeler ({(bans as Ban[]).length})</h3>
            {(bans as Ban[]).map(ban => (
              <div key={ban.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex-1"><p className="text-sm font-medium text-error">{ban.user_name}</p>{ban.reason && <p className="text-xs opacity-50">{ban.reason}</p>}</div>
                <button onClick={() => chatApi.unban(ban.id).then(() => refetchBans())} className="btn btn-success btn-xs btn-outline">Kaldır</button>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-semibold mb-3">Yasaklı Kelimeler</h3>
            <div className="flex gap-2 mb-3">
              <input className="input input-bordered input-sm flex-1" placeholder="Yeni kelime..." value={newWord} onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }} />
              <button onClick={() => { if (newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }} className="btn btn-primary btn-sm">Ekle</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(bannedWords as Word[]).map(w => (
                <div key={w.id} className="badge badge-error gap-1">{w.word}<button onClick={() => chatApi.removeBannedWord(w.id).then(() => refetchWords())} className="hover:text-white">✕</button></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      {tab !== 'admin' && (
        <div className="flex flex-1 min-h-0">
          {/* DM Sidebar */}
          {tab === 'dm' && dmSidebar}

          {/* Main panel */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: '#0d1826' }}>
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3" style={{ background: '#111f2e', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {tab === 'public' && (
                <>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f97316,#e11d48)' }}>💬</div>
                  <div><p className="font-semibold text-sm">Genel Sohbet</p><p className="text-xs opacity-40">{onlineUsers.length} kişi çevrimiçi</p></div>
                </>
              )}
              {tab === 'dm' && activeDM && (() => {
                const isOnline = onlineUsers.some(u => u.id === activeDM.id);
                return (
                  <>
                    <Av name={activeDM.name} size={9} online={isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{activeDM.name}</p>
                      <p className="text-xs" style={{ color: isOnline ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                        {isOnline ? 'çevrimiçi' : lastSeenStr(lastSeenMap[activeDM.id])}
                      </p>
                    </div>
                    <button onClick={() => showToast('Sesli arama yakında! 🎙️', 'info')} className="btn btn-ghost btn-sm btn-circle opacity-60">📞</button>
                    <div className="dropdown dropdown-end">
                      <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle opacity-60">⋯</button>
                      <ul tabIndex={0} className="dropdown-content menu shadow rounded-2xl z-50 w-44 text-sm" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <li><a onClick={() => setDmMsgs([])}>Mesajları Temizle</a></li>
                        <li><a className="text-error" onClick={() => removeFriend(activeDM.id)}>Arkadaşlıktan Çıkar</a></li>
                      </ul>
                    </div>
                  </>
                );
              })()}
              {tab === 'dm' && !activeDM && <span className="text-sm opacity-40">Özel Mesajlar</span>}
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
              {tab === 'public' && publicMsgs.length === 0 && <p className="text-center opacity-30 text-sm mt-8">Henüz mesaj yok</p>}
              {tab === 'dm' && !activeDM && <p className="text-center opacity-30 text-sm mt-8">Soldaki listeden bir arkadaş seç</p>}

              {/* Public messages */}
              {tab === 'public' && publicMsgs.map(msg => {
                const isMe = msg.userId === user?.id;
                return (
                  <div key={msg.id} className="group">
                    <MsgBubble isMe={isMe} name={isMe ? undefined : msg.userName} content={msg.content} time={timeStr(msg.createdAt)}
                      extra={
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isMe && <button onClick={() => deleteOwnMsg(msg.id)} className="btn btn-ghost btn-xs opacity-60">🗑</button>}
                          {!isMe && (isAdmin || isMod) && (
                            <>
                              <button onClick={() => deleteMsgAdmin(msg.id)} className="btn btn-ghost btn-xs text-error opacity-60">🗑 Sil</button>
                              <button onClick={() => setBanTarget({ id: msg.userId!, name: msg.userName })} className="btn btn-ghost btn-xs text-warning opacity-60">🚫</button>
                            </>
                          )}
                        </div>
                      } />
                  </div>
                );
              })}

              {/* DM messages */}
              {tab === 'dm' && activeDM && dmMsgs.map(msg => {
                const isMe = msg.senderId === user?.id;
                const isImage = msg.msgType === 'image';
                return (
                  <MsgBubble key={msg.id} isMe={isMe} name={isMe ? undefined : msg.senderName}
                    content={isImage ? <ImageMessage msg={msg} isMe={isMe} onOpen={openImage} /> : msg.content}
                    time={timeStr(msg.createdAt)} isRead={msg.isRead} />
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {(tab === 'public' || (tab === 'dm' && activeDM)) && inputBar(tab === 'dm')}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return <ChatErrorBoundary><ChatPageInner /></ChatErrorBoundary>;
}
