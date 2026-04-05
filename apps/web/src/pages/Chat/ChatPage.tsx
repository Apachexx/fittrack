import { useState, useEffect, useRef, useCallback, memo, Component } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/api/client';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationList,
  Conversation,
  ConversationHeader,
  Avatar as CSAvatar,
  Sidebar,
  MessageSeparator,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';

/* ────────── Error Boundary ────────── */
class ChatErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm text-gray-400">Sohbet yüklenirken bir hata oluştu</p>
          <p className="text-xs text-gray-600 font-mono">{this.state.error}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#f97316,#e11d48)' }}>
            Yenile
          </button>
        </div>
      );
    }
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
      <span style={{ fontSize: 22, opacity: 0.4 }}>🖼️</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Yüklenemedi</span>
    </div>
  );
  if (!blobUrl) return <div className={className} style={{ ...style, background: 'rgba(255,255,255,0.06)' }} />;
  return <img src={blobUrl} className={className} style={style} draggable={draggable} onContextMenu={onContextMenu} />;
}

/* ────────── Types ────────── */
interface Msg {
  id: string; userId: string | null; userName: string; userInitials: string;
  content: string; createdAt: string; isMod: boolean; isAdmin: boolean;
}
interface DM {
  id: string; senderId: string | null; receiverId: string; senderName: string;
  content: string; isRead: boolean; createdAt: string;
  msgType?: 'text' | 'image'; imageUrl?: string | null;
  viewTimer?: number | null; viewedAt?: string | null; expiresAt?: string | null;
}
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
    const diffMin = Math.floor((new Date().getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'az önce çevrimiçiydi';
    if (diffMin < 60) return `${diffMin}dk önce`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `bugün ${format(d, 'HH:mm', { locale: tr })}`;
    return format(d, 'd MMM HH:mm', { locale: tr });
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

/* ── Avatar SVG (used where chatscope Avatar isn't suitable) ── */
function AvatarEl({ name, size = 36 }: { name: string | null | undefined; size?: number }) {
  const c = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c + '30', border: `1.5px solid ${c}60`, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

/* ────────── Timer options ────────── */
const TIMER_OPTIONS = [
  { label: '∞', value: null, desc: 'Kalıcı' },
  { label: '1×', value: 0, desc: '1 kez' },
  { label: '5s', value: 5, desc: '5 sn' },
  { label: '10s', value: 10, desc: '10 sn' },
  { label: '30s', value: 30, desc: '30 sn' },
  { label: '60s', value: 60, desc: '60 sn' },
];

/* ────────── Image Send Preview ────────── */
function ImageSendPreview({ file, preview, uploading, onSend, onClose }: {
  file: File; preview: string; uploading: boolean;
  onSend: (file: File, timer: number | null) => void; onClose: () => void;
}) {
  const [timer, setTimer] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        style={{ background: '#0f1520', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90dvh' }}>
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
          <p className="text-sm font-semibold text-white">Fotoğraf Gönder</p>
          <div className="w-7" />
        </div>
        <div className="flex items-center justify-center bg-black/40 shrink-0" style={{ height: 260 }}>
          <img src={preview} alt="preview" className="max-w-full max-h-full object-contain select-none" draggable={false} style={{ maxHeight: 260 }} />
        </div>
        <div className="px-4 pt-4 pb-2 shrink-0">
          <p className="text-xs text-gray-500 mb-3 font-medium tracking-wide uppercase">Görüntüleme Süresi</p>
          <div className="flex gap-1.5">
            {TIMER_OPTIONS.map((opt) => (
              <button key={String(opt.value)} onClick={() => setTimer(opt.value)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={timer === opt.value
                  ? { background: 'rgba(249,115,22,0.25)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.5)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-2 text-center">
            {timer === null ? 'Kalıcı olarak görünür' : timer === 0 ? 'Alıcı yalnızca 1 kez görüntüleyebilir' : `Açıldıktan ${timer} saniye sonra kaybolur`}
          </p>
        </div>
        <div className="px-4 pb-6 pt-3 shrink-0">
          <button onClick={() => onSend(file, timer)} disabled={uploading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#f97316,#e11d48)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Gönderiliyor...</>
              : <>📤 Gönder</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Image Viewer ────────── */
const ImageViewer = memo(({ url, senderName, timer, onClose }: {
  url: string; senderName: string; timer: number | null; onClose: () => void;
}) => {
  const [remaining, setRemaining] = useState<number | null>(timer != null ? (timer === 0 ? 10 : timer) : null);
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) { onClose(); return; }
    const t = setTimeout(() => setRemaining(r => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onClose]);
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 's' || e.key === 'p'))) e.preventDefault();
    };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('keydown', preventKeys);
    return () => { document.removeEventListener('contextmenu', prevent); document.removeEventListener('keydown', preventKeys); };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute text-white/10 text-xs font-bold whitespace-nowrap"
            style={{ top: `${(i % 4) * 28}%`, left: `${Math.floor(i / 4) * 35}%`, transform: 'rotate(-30deg)' }}>
            {senderName} • V&S
          </div>
        ))}
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>✕</button>
      {remaining !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-sm font-bold text-white flex items-center gap-2"
          style={{ background: remaining <= 3 ? 'rgba(239,68,68,0.8)' : 'rgba(249,115,22,0.8)' }}>
          ⏱ {remaining}s
        </div>
      )}
      <div className="relative max-w-[90vw] max-h-[80vh] select-none" onClick={e => e.stopPropagation()}>
        <AuthImg src={url} className="max-w-full max-h-[80vh] rounded-2xl object-contain select-none" draggable={false} onContextMenu={e => e.preventDefault()} style={{ WebkitUserDrag: 'none' } as React.CSSProperties} />
        <div className="absolute inset-0 rounded-2xl" onContextMenu={e => e.preventDefault()} />
      </div>
    </div>
  );
});

/* ────────── Image Message Bubble ────────── */
function ImageMessage({ msg, isMe, onOpen }: { msg: DM; isMe: boolean; onOpen: (msg: DM) => void }) {
  const isOpened = !!msg.viewedAt;
  const isExpired = msg.expiresAt ? new Date(msg.expiresAt) < new Date() : false;
  const isOnce = msg.viewTimer === 0;

  if (isExpired) return (
    <div style={{ width: 180, height: 70, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <span style={{ fontSize: 20, opacity: 0.6 }}>🔒</span>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>Süresi doldu</span>
    </div>
  );

  if (isMe) return (
    <div style={{ width: 180, height: 140, background: '#1a2840', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px)', transform: 'scale(1.1)' }} draggable={false} onContextMenu={e => e.preventDefault()} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontSize: 22 }}>{isOpened ? '✅' : '🔒'}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{isOpened ? 'Görüntülendi' : 'Gönderildi'}{msg.viewTimer != null && ` · ${isOnce ? '1×' : `${msg.viewTimer}s`}`}</span>
      </div>
    </div>
  );

  if (isOpened) return (
    <button onClick={() => onOpen(msg)} style={{ width: 180, height: 140, background: '#1a2840', borderRadius: 16, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: 'none', padding: 0 }}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} onContextMenu={e => e.preventDefault()} />
    </button>
  );

  return (
    <button onClick={() => onOpen(msg)} style={{ width: 180, height: 140, background: '#1a2840', borderRadius: 16, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: 'none', padding: 0 }}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(16px)', transform: 'scale(1.1)' }} draggable={false} onContextMenu={e => e.preventDefault()} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(249,115,22,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👁</div>
        <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{msg.viewTimer != null ? (isOnce ? '1× Görüntüle' : `${msg.viewTimer}s`) : 'Görüntüle'}</span>
      </div>
    </button>
  );
}

/* ────────── BanModal ────────── */
function BanModal({ user, meIsAdmin, onClose, onBan }: {
  user: { id: string; name: string }; meIsAdmin: boolean; onClose: () => void; onBan: (reason: string, minutes?: number) => void;
}) {
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'temp' | 'perm'>('temp');
  const [minutes, setMinutes] = useState('60');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-5" style={{ background: '#0c1420', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-base font-semibold text-white mb-1">Engelle / Sustur</h3>
        <p className="text-xs text-gray-400 mb-4">{user.name}</p>
        {meIsAdmin && (
          <div className="flex gap-2 mb-3">
            {(['temp', 'perm'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} className="flex-1 py-2 rounded-xl text-xs font-medium"
                style={type === t ? { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                {t === 'temp' ? 'Süreli' : 'Kalıcı Ban'}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 mb-3 flex-wrap">
          {[5, 15, 30, 60, 360, 1440, 10080].map(m => (
            <button key={m} onClick={() => { setMinutes(String(m)); setType('temp'); }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={minutes === String(m) && type === 'temp' ? { background: '#ef444420', color: '#ef4444' } : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
              {m < 60 ? `${m}dk` : m < 1440 ? `${m / 60}sa` : m < 10080 ? `${m / 1440}g` : `${m / 10080}h`}
            </button>
          ))}
        </div>
        <input className="input text-sm w-full mb-3" placeholder="Sebep (isteğe bağlı)" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}>İptal</button>
          <button onClick={() => { onBan(reason, type === 'temp' ? parseInt(minutes) : undefined); onClose(); }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#ef4444' }}>
            {type === 'perm' ? 'Kalıcı Banla' : 'Sustur'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Main Component ────────── */
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
  const [toastColor, setToastColor] = useState('rgba(239,68,68,0.92)');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDMRef = useRef(activeDM);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);

  const showToast = useCallback((msg: string, type: 'error' | 'info' | 'success' = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastColor(type === 'error' ? 'rgba(239,68,68,0.92)' : type === 'success' ? 'rgba(34,197,94,0.92)' : 'rgba(59,130,246,0.92)');
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  const { data: meData } = useQuery({ queryKey: ['chat-me'], queryFn: chatApi.getMe, staleTime: 60_000 });
  const isAdmin = meData?.isAdmin ?? false;
  const isMod = meData?.isModerator ?? false;

  const { data: friends = [] } = useQuery<Friend[]>({ queryKey: ['chat-friends'], queryFn: chatApi.getFriends });
  const { data: requests = [] } = useQuery<PendingReq[]>({ queryKey: ['chat-requests'], queryFn: chatApi.getRequests });
  const { data: searchResults = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['chat-users', debouncedSearch],
    queryFn: () => chatApi.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 1,
    staleTime: 30_000,
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
    if (!input.trim() || !socket || !connected) return;
    if (tab === 'public') socket.emit('chat:send', input.trim());
    else if (tab === 'dm' && activeDM) socket.emit('dm:send', { receiverId: activeDM.id, content: input.trim() });
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
      showToast('Fotoğraf gönderilemedi: ' + (e?.message || 'Hata'), 'error');
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
  function setMod(targetId: string, val: boolean) { socket?.emit('admin:set_mod', { targetId, value: val }); refetchMods(); }
  function doBan(reason: string, minutes?: number) { if (!banTarget) return; socket?.emit('admin:ban', { targetId: banTarget.id, reason, durationMinutes: minutes }); setTimeout(() => refetchBans(), 500); }
  function doClearChat() { socket?.emit('admin:clear_chat'); setConfirmClear(false); }
  function deleteOwnMsg(id: string) { socket?.emit('msg:delete_own', { messageId: id }); }
  function deleteMsgAdmin(id: string) { socket?.emit('admin:delete_msg', { messageId: id }); }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ── Convert messages to chatscope format ── */
  const csPublicMessages = publicMsgs.map(msg => {
    const isMe = msg.userId === user?.id;
    return (
      <Message key={msg.id}
        model={{
          message: msg.content,
          sender: msg.userName,
          direction: isMe ? 'outgoing' : 'incoming',
          position: 'single',
          sentTime: timeStr(msg.createdAt),
        }}>
        {!isMe && (
          <CSAvatar>
            <AvatarEl name={msg.userName} size={32} />
          </CSAvatar>
        )}
        <Message.Footer sentTime={timeStr(msg.createdAt)} sender={!isMe ? msg.userName : undefined} />
      </Message>
    );
  });

  const csDmMessages = dmMsgs.map(msg => {
    const isMe = msg.senderId === user?.id;
    const isImage = msg.msgType === 'image';
    return (
      <Message key={msg.id}
        model={{
          message: isImage ? '' : msg.content,
          sender: msg.senderName,
          direction: isMe ? 'outgoing' : 'incoming',
          position: 'single',
          sentTime: timeStr(msg.createdAt),
          type: isImage ? 'custom' : 'text',
        }}>
        {isImage && (
          <Message.CustomContent>
            <ImageMessage msg={msg} isMe={isMe} onOpen={openImage} />
          </Message.CustomContent>
        )}
        {!isMe && <CSAvatar><AvatarEl name={activeDM?.name} size={32} /></CSAvatar>}
        <Message.Footer
          sentTime={timeStr(msg.createdAt)}
          sender={!isMe ? msg.senderName : undefined}
        />
      </Message>
    );
  });

  const activeDMIsOnline = activeDM ? onlineUsers.some(u => u.id === activeDM.id) : false;
  const activeDMStatus = activeDM
    ? (activeDMIsOnline ? 'çevrimiçi' : lastSeenStr(lastSeenMap[activeDM.id]))
    : '';

  /* ── Modals ── */
  const modals = (
    <>
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-2xl text-sm font-medium text-white shadow-2xl pointer-events-none"
          style={{ background: toastColor, backdropFilter: 'blur(8px)', maxWidth: '90vw', textAlign: 'center' }}>
          {toastMsg}
        </div>
      )}
      {confirmClear && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setConfirmClear(false)}>
          <div className="w-full max-w-xs mx-4 rounded-2xl p-5 text-center" onClick={e => e.stopPropagation()} style={{ background: '#0c1420', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-3xl">🗑️</span>
            <h3 className="text-base font-semibold text-white mt-2 mb-1">Sohbeti Temizle</h3>
            <p className="text-xs text-gray-400 mb-4">Tüm genel sohbet mesajları silinecek.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.06)' }}>İptal</button>
              <button onClick={doClearChat} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#ef4444' }}>Temizle</button>
            </div>
          </div>
        </div>
      )}
      {banTarget && <BanModal user={banTarget} meIsAdmin={isAdmin} onClose={() => setBanTarget(null)} onBan={doBan} />}
      {pendingImage && <ImageSendPreview file={pendingImage.file} preview={pendingImage.preview} uploading={uploading} onSend={sendImage} onClose={() => { setPendingImage(null); URL.revokeObjectURL(pendingImage.preview); }} />}
      {viewerMsg?.imageUrl && <ImageViewer url={viewerMsg.imageUrl} senderName={viewerMsg.senderName} timer={viewerMsg.viewTimer ?? null} onClose={() => setViewerMsg(null)} />}
    </>
  );

  /* ── Admin Panel ── */
  const adminPanel = (
    <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ background: '#0d1826' }}>
      <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
        🗑 Sohbeti Temizle
      </button>
      {/* Mods */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Moderatörler</h3>
        {(mods as Mod[]).filter(m => !m.is_admin).map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <AvatarEl name={m.name} size={36} />
            <div className="flex-1"><p className="text-sm font-medium text-blue-300">{m.name}</p><p className="text-xs text-gray-500">Moderatör</p></div>
            <button onClick={() => setMod(m.id, false)} className="text-xs px-2.5 py-1.5 rounded-lg text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>Kaldır</button>
          </div>
        ))}
      </div>
      {/* Bans */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Aktif Engellemeler ({(bans as Ban[]).length})</h3>
        {(bans as Ban[]).map(ban => (
          <div key={ban.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">{ban.user_name}</p>
              {ban.reason && <p className="text-xs text-gray-500">{ban.reason}</p>}
              <p className="text-xs text-gray-600">{ban.expires_at ? `Bitiş: ${format(new Date(ban.expires_at), 'd MMM HH:mm', { locale: tr })}` : 'Kalıcı'}</p>
            </div>
            <button onClick={() => { chatApi.unban(ban.id).then(() => refetchBans()); }} className="text-xs px-2.5 py-1.5 rounded-lg text-green-400" style={{ background: 'rgba(34,197,94,0.1)' }}>Kaldır</button>
          </div>
        ))}
      </div>
      {/* Words */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Yasaklı Kelimeler</h3>
        <div className="flex gap-2 mb-3">
          <input className="input text-sm flex-1" placeholder="Yeni kelime..." value={newWord} onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }} />
          <button onClick={() => { if (newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }}
            className="px-3 rounded-xl text-sm font-medium text-white" style={{ background: 'rgba(249,115,22,0.2)' }}>Ekle</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(bannedWords as Word[]).map(w => (
            <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-300">{w.word}</span>
              <button onClick={() => chatApi.removeBannedWord(w.id).then(() => refetchWords())} className="text-red-600 hover:text-red-300">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ────────── Render ────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {modals}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) setPendingImage({ file: f, preview: URL.createObjectURL(f) }); e.target.value = ''; }} />

      {/* Top tab bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2" style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-xs text-gray-500 hidden sm:block">{connected ? `${onlineUsers.length} çevrimiçi` : 'Bağlanıyor...'}</span>
        </div>
        <div className="flex gap-1">
          {[
            { key: 'public', label: 'Genel', color: '#f97316' },
            { key: 'dm', label: `DM${totalUnread > 0 ? ` (${totalUnread})` : ''}`, color: '#60a5fa' },
            ...(isAdmin || isMod ? [{ key: 'admin', label: '🛡', color: '#f87171' }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'public' | 'dm' | 'admin')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={tab === t.key ? { background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` } : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>
        {(isAdmin || isMod) && <span className="text-[10px] text-orange-400 hidden sm:block">{isAdmin ? 'ADMİN' : 'MOD'}</span>}
        {!(isAdmin || isMod) && <div className="w-16" />}
      </div>

      {/* Admin panel */}
      {tab === 'admin' && adminPanel}

      {/* Chat UI via chatscope */}
      {tab !== 'admin' && (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <MainContainer style={{ height: '100%', border: 'none', background: '#0d1117' }}>

            {/* Sidebar — friends / DM list */}
            {tab === 'dm' && (
              <Sidebar position="left" style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.07)', minWidth: 240, maxWidth: 280 }}>
                <div style={{ padding: '8px 12px 4px' }}>
                  <input
                    placeholder="Kullanıcı ara..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ width: '100%', background: '#1a2332', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                  />
                </div>

                {/* Search results */}
                {debouncedSearch.length >= 1 && (searchResults as { id: string; name: string }[]).map(u => {
                  const alreadyFriend = (friends as Friend[]).some(f => f.otherUser.id === u.id);
                  const pending = sentRequestIds.includes(u.id);
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <AvatarEl name={u.name} size={34} />
                      <span style={{ flex: 1, color: '#e2e8f0', fontSize: 13 }}>{u.name}</span>
                      {alreadyFriend ? <span style={{ fontSize: 11, color: '#22c55e' }}>✓</span>
                        : pending ? <span style={{ fontSize: 11, color: '#6b7280' }}>Gönderildi</span>
                        : <button onClick={() => sendFriendRequest(u.id)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#f97316', color: '#fff', border: 'none', cursor: 'pointer' }}>Ekle</button>}
                    </div>
                  );
                })}

                {/* Pending requests */}
                {(requests as PendingReq[]).length > 0 && (
                  <div style={{ padding: '6px 14px 2px' }}>
                    <p style={{ fontSize: 11, color: '#f97316', fontWeight: 600, marginBottom: 4 }}>İstekler ({(requests as PendingReq[]).length})</p>
                    {(requests as PendingReq[]).map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <AvatarEl name={r.requester_name} size={30} />
                        <span style={{ flex: 1, color: '#e2e8f0', fontSize: 12 }}>{r.requester_name}</span>
                        <button onClick={() => acceptRequest(r.id)} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'none', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => rejectRequest(r.id)} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friends list */}
                <ConversationList>
                  {(friends as Friend[]).map(f => {
                    const isOnline = onlineUsers.some(u => u.id === f.otherUser.id);
                    const unreadCount = unread[f.otherUser.id] ?? 0;
                    const lastSeen = lastSeenMap[f.otherUser.id];
                    return (
                      <Conversation
                        key={f.id}
                        name={f.otherUser.name}
                        info={isOnline ? 'çevrimiçi' : lastSeenStr(lastSeen)}
                        active={activeDM?.id === f.otherUser.id}
                        unreadCnt={unreadCount}
                        onClick={() => { setActiveDM(f.otherUser); setUnread(p => ({ ...p, [f.otherUser.id]: 0 })); }}>
                        <CSAvatar>
                          <div style={{ position: 'relative' }}>
                            <AvatarEl name={f.otherUser.name} size={40} />
                            {isOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: '2px solid #0d1117' }} />}
                          </div>
                        </CSAvatar>
                      </Conversation>
                    );
                  })}
                </ConversationList>
              </Sidebar>
            )}

            {/* Main chat area */}
            <ChatContainer style={{ background: '#0d1826' }}>
              {/* Header */}
              <ConversationHeader style={{ background: '#111f2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <ConversationHeader.Content>
                  {tab === 'public' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
                      <div>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>Genel Sohbet</p>
                        <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>{onlineUsers.length} çevrimiçi</p>
                      </div>
                    </div>
                  )}
                  {tab === 'dm' && activeDM && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <AvatarEl name={activeDM.name} size={36} />
                        {activeDMIsOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: '2px solid #111f2e' }} />}
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>{activeDM.name}</p>
                        <p style={{ color: activeDMIsOnline ? '#4ade80' : '#6b7280', fontSize: 12, margin: 0 }}>{activeDMStatus}</p>
                      </div>
                    </div>
                  )}
                  {tab === 'dm' && !activeDM && <span style={{ color: '#6b7280', fontSize: 14 }}>Özel Mesajlar</span>}
                </ConversationHeader.Content>
                {tab === 'dm' && activeDM && (
                  <ConversationHeader.Actions>
                    <button onClick={() => showToast('Sesli arama yakında! 🎙️', 'info')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px 8px' }}>📞</button>
                    <button onClick={() => removeFriend(activeDM.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12, padding: '4px 8px' }}>Çıkar</button>
                  </ConversationHeader.Actions>
                )}
              </ConversationHeader>

              {/* Messages */}
              <MessageList
                style={{ background: '#0d1826' }}
                typingIndicator={!connected ? <TypingIndicator content="Bağlanıyor..." /> : undefined}>
                {tab === 'public' && csPublicMessages}
                {tab === 'dm' && activeDM && csDmMessages}
                {tab === 'dm' && !activeDM && (
                  <MessageSeparator content="Soldaki listeden bir arkadaş seç" />
                )}
              </MessageList>

              {/* Input */}
              {(tab === 'public' || (tab === 'dm' && activeDM)) && (
                <MessageInput
                  placeholder={tab === 'dm' ? 'Mesaj...' : 'Mesaj yaz...'}
                  value={input}
                  onChange={val => setInput(val)}
                  onSend={sendMessage}
                  disabled={!connected}
                  attachButton={tab === 'dm'}
                  onAttachClick={() => fileInputRef.current?.click()}
                  style={{ background: '#111f2e', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                />
              )}
            </ChatContainer>
          </MainContainer>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatPageInner />
    </ChatErrorBoundary>
  );
}
