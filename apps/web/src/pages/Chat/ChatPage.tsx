import { useState, useEffect, useRef, useCallback, memo, Component } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/api/client';

/* ── Error Boundary ─────────────────────────────────────────────────────── */
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
    if (this.state.hasError)
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm opacity-60">Bir hata oluştu</p>
          <p className="text-xs opacity-30 font-mono">{this.state.error}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
            className="btn btn-primary btn-sm">Yenile</button>
        </div>
      );
    return this.props.children;
  }
}

/* ── AuthImg ─────────────────────────────────────────────────────────────── */
function AuthImg({ src, className, style, draggable, onContextMenu, onReady }
  : React.ImgHTMLAttributes<HTMLImageElement> & { onReady?: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });
  useEffect(() => {
    setBlobUrl(null); setFailed(false);
    if (!src) return;
    let url: string;
    api.get(src.replace(/^\/api\//, ''), { responseType: 'blob' })
      .then(r => {
        url = URL.createObjectURL(r.data);
        setBlobUrl(url);
        onReadyRef.current?.();   // notify viewer the image is ready
      })
      .catch(() => setFailed(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [src]);
  if (failed) return (
    <div className={className} style={{ ...style, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 20, opacity: 0.4 }}>🖼️</span>
      <span style={{ fontSize: 10, opacity: 0.35 }}>Yüklenemedi</span>
    </div>
  );
  if (!blobUrl) return <div className={className} style={{ ...style, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(249,115,22,0.3)', borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite' }} />
  </div>;
  return <img src={blobUrl} className={className} style={style} draggable={draggable} onContextMenu={onContextMenu} />;
}

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Msg { id: string; userId: string | null; userName: string; content: string; createdAt: string; isMod: boolean; isAdmin: boolean; }
interface DM { id: string; senderId: string | null; receiverId: string; senderName: string; content: string; isRead: boolean; createdAt: string; msgType?: 'text' | 'image'; imageUrl?: string | null; viewTimer?: number | null; viewedAt?: string | null; expiresAt?: string | null; }
interface Friend { id: string; otherUser: { id: string; name: string }; }
interface PendingReq { id: string; requester_id: string; requester_name: string; created_at: string; }
interface Ban { id: string; user_id: string; user_name: string; reason: string; expires_at: string | null; }
interface Word { id: string; word: string; }
interface Mod { id: string; name: string; is_admin: boolean; is_moderator: boolean; }

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function timeStr(iso: string | null | undefined) {
  if (!iso) return '';
  try { return format(new Date(iso), 'HH:mm', { locale: tr }); } catch { return ''; }
}
function lastSeenStr(iso: string | null | undefined) {
  if (!iso) return 'çevrimdışı';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'çevrimdışı';
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return 'az önce aktifti';
    if (diff < 60) return `${diff}dk önce aktifti`;
    if (diff < 1440) return `${Math.floor(diff / 60)}sa önce aktifti`;
    return format(d, 'd MMM', { locale: tr }) + ' aktifti';
  } catch { return 'çevrimdışı'; }
}
function avatarColor(name: string | null | undefined) {
  if (!name) return '#6b7280';
  const colors = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}
function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

/* ── Avatar component ────────────────────────────────────────────────────── */
function Av({ name, size = 40, online }: { name?: string | null; size?: number; online?: boolean }) {
  const c = avatarColor(name);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: c + '25', border: `2px solid ${c}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c, fontWeight: 700, fontSize: size * 0.36,
      }}>
        {initials(name)}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: online ? '#4ade80' : '#4b5563',
          border: '2px solid #0d1117',
        }} />
      )}
    </div>
  );
}

/* ── Image Send Preview ──────────────────────────────────────────────────── */
const TIMER_OPTS = [
  { label: '∞', value: null }, { label: '1×', value: 0 },
  { label: '5s', value: 5 }, { label: '10s', value: 10 },
  { label: '30s', value: 30 }, { label: '60s', value: 60 },
];
function ImageSendPreview({ file, preview, uploading, onSend, onClose }: {
  file: File; preview: string; uploading: boolean;
  onSend: (f: File, t: number | null) => void; onClose: () => void;
}) {
  const [timer, setTimer] = useState<number | null>(null);
  return (
    <div className="modal modal-open">
      <div className="modal-box p-0 overflow-hidden w-full max-w-sm" style={{ background: '#0f1520' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-lg">✕</button>
          <p className="font-semibold text-sm">Fotoğraf Gönder</p>
          <div className="w-9" />
        </div>
        <div className="flex items-center justify-center bg-black/50" style={{ height: 220 }}>
          <img src={preview} className="max-w-full max-h-full object-contain select-none" draggable={false} />
        </div>
        <div className="px-4 py-3">
          <p className="text-xs opacity-50 mb-2 uppercase tracking-wide">Görüntüleme Süresi</p>
          <div className="flex gap-1.5 mb-4">
            {TIMER_OPTS.map(o => (
              <button key={String(o.value)} onClick={() => setTimer(o.value)}
                className={`flex-1 btn btn-xs ${timer === o.value ? 'btn-primary' : 'btn-ghost border border-white/10'}`}>
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

/* ── Image Viewer ────────────────────────────────────────────────────────── */
const ImageViewer = memo(({ url, senderName, timer, onClose }: {
  url: string; senderName: string; timer: number | null; onClose: () => void;
}) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const initialRemaining = timer != null ? (timer === 0 ? 10 : timer) : null;
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Start countdown ONLY after image is fully fetched & displayed
  useEffect(() => {
    if (!imgLoaded || remaining === null) return;
    if (remaining <= 0) { onCloseRef.current(); return; }
    const t = setTimeout(() => setRemaining(r => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, imgLoaded]); // intentionally omit onClose — use ref instead
  useEffect(() => {
    const p = (e: Event) => e.preventDefault();
    const k = (e: KeyboardEvent) => { if (e.key === 'PrintScreen' || (e.ctrlKey && 'sp'.includes(e.key))) e.preventDefault(); };
    document.addEventListener('contextmenu', p);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('contextmenu', p); document.removeEventListener('keydown', k); };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={onClose} data-viewer-open="1">
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute text-white/[0.08] text-xs font-bold whitespace-nowrap"
            style={{ top: `${(i % 4) * 28}%`, left: `${Math.floor(i / 4) * 35}%`, transform: 'rotate(-30deg)' }}>
            {senderName} • V&S
          </div>
        ))}
      </div>
      <button onClick={onClose} className="btn btn-ghost btn-circle absolute top-4 right-4 z-10 text-white text-xl">✕</button>

      {/* Timer badge — shows only after image is loaded */}
      {remaining !== null && imgLoaded && (
        <div className={`badge ${remaining <= 3 ? 'badge-error' : 'badge-warning'} gap-1 absolute top-4 left-1/2 -translate-x-1/2 z-10 py-3 px-4 text-sm font-bold`}>
          ⏱ {remaining}s
        </div>
      )}

      {/* Image container — always rendered so mobile browser fetches it */}
      <div className="relative max-w-[92vw] max-h-[82vh] select-none" onClick={e => e.stopPropagation()}>
        <AuthImg src={url} className="max-w-full max-h-[82vh] rounded-2xl object-contain select-none"
          draggable={false} onContextMenu={e => e.preventDefault()}
          onReady={() => setImgLoaded(true)} />
        <div className="absolute inset-0 rounded-2xl" onContextMenu={e => e.preventDefault()} />

        {/* Loading overlay on top of image while fetching */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(249,115,22,0.3)', borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Yükleniyor...</span>
          </div>
        )}
      </div>
    </div>
  );
});

/* ── Image Message Bubble ────────────────────────────────────────────────── */
function ImageMessage({ msg, isMe, onOpen }: { msg: DM; isMe: boolean; onOpen: (m: DM) => void }) {
  const isOpened = !!msg.viewedAt;
  const isExpired = msg.expiresAt ? new Date(msg.expiresAt) < new Date() : false;
  const isOnce = msg.viewTimer === 0;
  const hasTimer = msg.viewTimer != null;
  const base: React.CSSProperties = { width: 200, height: 150, borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#1a2840', flexShrink: 0, display: 'block' };
  const timerLabel = hasTimer ? ` · ${isOnce ? '1×' : `${msg.viewTimer}s`}` : '';

  // Shared card style — same look for both sender and receiver after a timed photo is opened
  const OpenedCard = ({ label }: { label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <span style={{ fontSize: 22 }}>📸</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Fotoğraf{timerLabel}</span>
        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>{label}</span>
      </div>
    </div>
  );

  if (isExpired && hasTimer) return <OpenedCard label="🔒 Süresi doldu" />;

  // Sender side: blurred thumbnail while unsent/unviewed; same card as receiver once opened
  if (isMe) {
    if (isOpened && hasTimer) return <OpenedCard label="✓ Görüntülendi" />;
    return (
      <div style={base}>
        <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px)', transform: 'scale(1.1)' }} draggable={false} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Gönderildi{timerLabel}</span>
        </div>
      </div>
    );
  }

  // Receiver: timed photo already viewed — same card as sender
  if (isOpened && hasTimer) return <OpenedCard label="✓ Açıldı" />;

  // Receiver: clickable (infinite or not yet viewed)
  return (
    <button onClick={() => onOpen(msg)} style={{ ...base, cursor: 'pointer', border: 'none', padding: 0 }}>
      <AuthImg src={msg.imageUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(16px)', transform: 'scale(1.1)' }} draggable={false} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👁</div>
        <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>
          {hasTimer ? (isOnce ? '1× Görüntüle' : `${msg.viewTimer}s`) : 'Görüntüle'}
        </span>
      </div>
    </button>
  );
}

/* ── Ban Modal ───────────────────────────────────────────────────────────── */
function BanModal({ user, meIsAdmin, onClose, onBan }: {
  user: { id: string; name: string }; meIsAdmin: boolean;
  onClose: () => void; onBan: (r: string, m?: number) => void;
}) {
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
              className={`btn btn-xs ${minutes === String(m) && type === 'temp' ? 'btn-error' : 'btn-ghost border border-white/10'}`}>
              {m < 60 ? `${m}dk` : m < 1440 ? `${m / 60}sa` : m < 10080 ? `${m / 1440}g` : `${m / 10080}h`}
            </button>
          ))}
        </div>
        <input className="input input-bordered w-full mb-4 text-sm" placeholder="Sebep (isteğe bağlı)"
          value={reason} onChange={e => setReason(e.target.value)} />
        <div className="modal-action mt-0 gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm">İptal</button>
          <button onClick={() => { onBan(reason, type === 'temp' ? parseInt(minutes) : undefined); onClose(); }}
            className="btn btn-error btn-sm">
            {type === 'perm' ? 'Kalıcı Banla' : 'Sustur'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════ */
function ChatPageInner() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'public' | 'dm' | 'admin'>(() => {
    try { return (sessionStorage.getItem('chat_tab') as 'public' | 'dm' | 'admin') || 'public'; } catch { return 'public'; }
  });
  const [publicMsgs, setPublicMsgs] = useState<Msg[]>([]);
  const [dmMsgs, setDmMsgs] = useState<DM[]>([]);
  const [activeDM, setActiveDM] = useState<{ id: string; name: string } | null>(() => {
    try { const s = sessionStorage.getItem('chat_activeDM'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [showOnlinePanel, setShowOnlinePanel] = useState(false);
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
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState<{ id: string; name: string } | null>(null);
  const [clickedUser, setClickedUser] = useState<{ id: string; name: string; msgId?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'info' | 'success'>('error');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeDMRef = useRef(activeDM);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const showToast = useCallback((msg: string, type: 'error' | 'info' | 'success' = 'error') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToastType(type); setToastMsg(msg);
    toastRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicMsgs.length, dmMsgs.length]);

  // Persist tab + activeDM across SW-triggered page reloads
  useEffect(() => { try { sessionStorage.setItem('chat_tab', tab); } catch {} }, [tab]);
  useEffect(() => {
    try {
      if (activeDM) sessionStorage.setItem('chat_activeDM', JSON.stringify(activeDM));
      else sessionStorage.removeItem('chat_activeDM');
    } catch {}
  }, [activeDM]);

  /* ── Queries ── */
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

  /* ── Socket events ── */
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
      ['users:online', 'user:went_offline', 'user:last_seen', 'dm:read', 'chat:message',
       'chat:deleted', 'chat:cleared', 'dm:message', 'user:mod_updated', 'friend:request',
       'friend:accepted', 'friend:sent', 'friend:removed', 'dm:image-opened', 'error']
        .forEach(e => socket.off(e));
    };
  }, [socket, user?.id, qc, refetchMods, showToast]);

  /* ── Actions ── */
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

    // Client-side size check (base64 is ~33% larger than binary)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Fotoğraf çok büyük (max 10MB)', 'error');
      return;
    }

    setUploading(true);
    try {
      // Compress image before upload if it's large
      const imageData = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          const MAX = 1600; // px
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const ratio = Math.min(MAX / width, MAX / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          // fallback: send raw file as-is
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        };
        img.src = objUrl;
      });

      const { data } = await api.post<{ url: string }>('/chat/dm/upload', {
        imageData,
        mimeType: 'image/jpeg',
      });
      socket.emit('dm:send', { receiverId: dm.id, content: '', imageUrl: data.url, viewTimer: timer });
      setPendingImage(null);
    } catch (e: any) {
      const serverMsg = e?.response?.data?.error;
      showToast(serverMsg ? `Hata: ${serverMsg}` : 'Fotoğraf gönderilemedi', 'error');
      console.error('[sendImage]', e?.response?.status, serverMsg, e?.message);
    }
    finally { setUploading(false); }
  }, [socket, connected, showToast]);

  const openImage = useCallback((msg: DM) => {
    // Only mark as opened for timed photos (viewTimer != null) — infinite photos stay re-viewable
    if (!msg.viewedAt && msg.senderId !== user?.id && msg.viewTimer != null)
      socket?.emit('dm:open-image', { messageId: msg.id });
    setViewerMsg(msg);
  }, [socket, user?.id]);

  function openDM(friend: { id: string; name: string }) {
    setActiveDM(friend);
    setUnread(p => ({ ...p, [friend.id]: 0 }));
  }
  function closeDM() { setActiveDM(null); }
  function removeFriend(id: string) {
    socket?.emit('friend:remove', { friendId: id });
    qc.invalidateQueries({ queryKey: ['chat-friends'] });
    if (activeDM?.id === id) { setActiveDM(null); setTab('public'); }
  }
  function sendFriendRequest(id: string) { socket?.emit('friend:request', { addresseeId: id }); setSentRequestIds(p => [...p, id]); }
  function acceptRequest(id: string) { socket?.emit('friend:accept', { friendshipId: id }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); qc.invalidateQueries({ queryKey: ['chat-friends'] }); }
  function rejectRequest(id: string) { socket?.emit('friend:reject', { friendshipId: id }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); }
  function setMod(tid: string, val: boolean) { socket?.emit('admin:set_mod', { targetId: tid, value: val }); refetchMods(); }
  function doBan(reason: string, minutes?: number) { if (!banTarget) return; socket?.emit('admin:ban', { targetId: banTarget.id, reason, durationMinutes: minutes }); setTimeout(() => refetchBans(), 500); }
  function doClearChat() { socket?.emit('admin:clear_chat'); setConfirmClear(false); }
  function deleteOwnMsg(id: string) { socket?.emit('msg:delete_own', { messageId: id }); }
  function deleteMsgAdmin(id: string) { socket?.emit('admin:delete_msg', { messageId: id }); }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ── Shared: Input bar ── */
  const inputBar = (isDM: boolean) => (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2.5"
      style={{ background: '#111f2e', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {isDM && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setPendingImage({ file: f, preview: URL.createObjectURL(f) }); e.target.value = ''; }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={!connected}
            className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{ width: 38, height: 38, background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', opacity: connected ? 1 : 0.5 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </>
      )}
      <div className="flex-1 flex items-center rounded-full px-4 py-2 gap-2"
        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          className="flex-1 bg-transparent text-sm outline-none"
          placeholder={isDM ? 'Mesaj...' : 'Mesaj yaz...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          maxLength={500} disabled={!connected} />
      </div>
      <button onClick={sendMessage} disabled={!input.trim() || !connected}
        className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-95"
        style={{
          width: 38, height: 38,
          background: input.trim() && connected ? '#f97316' : 'rgba(249,115,22,0.15)',
          color: input.trim() && connected ? '#fff' : '#f97316',
          border: '1px solid rgba(249,115,22,0.4)',
          boxShadow: input.trim() && connected ? '0 4px 16px rgba(249,115,22,0.4)' : 'none',
          opacity: !connected ? 0.5 : 1,
        }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );

  /* ── Shared: Message bubble ── */
  function Bubble({ isMe, name, content, time, isRead, onNameClick }: {
    isMe: boolean; name?: string; content: React.ReactNode; time: string; isRead?: boolean;
    onNameClick?: () => void;
  }) {
    return (
      <div className={`chat ${isMe ? 'chat-end' : 'chat-start'} py-0.5`}>
        <div className="chat-header text-xs opacity-50 mb-0.5 flex items-center gap-1">
          {!isMe && name && (
            onNameClick
              ? <button onClick={onNameClick} style={{ color: avatarColor(name), fontWeight: 600, padding: '2px 4px', margin: '-2px -4px', borderRadius: 6, WebkitTapHighlightColor: 'transparent' }} className="active:opacity-60">{name}</button>
              : <span className="font-semibold" style={{ color: avatarColor(name) }}>{name}</span>
          )}
          <span>{time}</span>
          {isMe && <span style={{ fontSize: 10, color: isRead ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>{isRead ? '✓✓' : '✓'}</span>}
        </div>
        <div className={`chat-bubble text-sm leading-relaxed max-w-[75vw] sm:max-w-xs ${isMe ? 'chat-bubble-primary' : ''}`}
          style={isMe ? {} : { background: '#1e2a3a', color: '#e2e8f0' }}>
          {content}
        </div>
      </div>
    );
  }

  /* ── Shared: Message list ── */
  const publicMsgList = publicMsgs.map(msg => {
    const isMe = msg.userId === user?.id;
    const canAct = !isMe && (isAdmin || isMod) && msg.userId;
    return (
      <div key={msg.id} className="group">
        <Bubble
          isMe={isMe}
          name={!isMe ? msg.userName : undefined}
          content={msg.content}
          time={timeStr(msg.createdAt)}
          onNameClick={canAct ? () => setClickedUser({ id: msg.userId!, name: msg.userName, msgId: msg.id }) : undefined}
        />
        {/* Own message delete — long-press friendly tap target */}
        {isMe && (
          <div className="flex justify-end px-2 -mt-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => deleteOwnMsg(msg.id)} className="btn btn-ghost btn-xs text-error py-0 h-5 min-h-0">🗑</button>
          </div>
        )}
      </div>
    );
  });

  const dmMsgList = dmMsgs.map(msg => {
    const isMe = msg.senderId === user?.id;
    return (
      <Bubble key={msg.id} isMe={isMe} name={!isMe ? msg.senderName : undefined}
        content={msg.msgType === 'image' ? <ImageMessage msg={msg} isMe={isMe} onOpen={openImage} /> : msg.content}
        time={timeStr(msg.createdAt)} isRead={msg.isRead}
        onNameClick={!isMe && msg.senderId ? () => setClickedUser({ id: msg.senderId!, name: msg.senderName }) : undefined}
      />
    );
  });

  /* ── Friend list (shared mobile/desktop) ── */
  const friendList = (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <label className="input input-sm flex items-center gap-2 rounded-full"
          style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 opacity-40">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder="Kullanıcı ara..." className="grow bg-transparent outline-none text-sm"
            value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          {userSearch && <button onClick={() => setUserSearch('')} className="opacity-40">✕</button>}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {debouncedSearch.length >= 1 && (searchResults as { id: string; name: string }[]).map(u => {
          const isFriend = (friends as Friend[]).some(f => f.otherUser.id === u.id);
          const pending = sentRequestIds.includes(u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
              <Av name={u.name} size={44} />
              <span className="flex-1 text-sm font-medium truncate">{u.name}</span>
              {isFriend ? <span className="badge badge-success badge-sm">Arkadaş</span>
                : pending ? <span className="badge badge-ghost badge-sm">Gönderildi</span>
                : <button onClick={() => sendFriendRequest(u.id)} className="btn btn-primary btn-xs">+ Ekle</button>}
            </div>
          );
        })}

        {/* Pending requests */}
        {(requests as PendingReq[]).length > 0 && (
          <div className="px-4 py-2 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-warning mb-2">Arkadaşlık İstekleri ({(requests as PendingReq[]).length})</p>
            {(requests as PendingReq[]).map(r => (
              <div key={r.id} className="flex items-center gap-3 py-2">
                <Av name={r.requester_name} size={40} />
                <span className="flex-1 text-sm truncate">{r.requester_name}</span>
                <button onClick={() => acceptRequest(r.id)} className="btn btn-success btn-xs btn-circle">✓</button>
                <button onClick={() => rejectRequest(r.id)} className="btn btn-error btn-xs btn-circle">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Friends */}
        {(friends as Friend[]).length === 0 && debouncedSearch.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 opacity-30 gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" strokeLinecap="round" />
            </svg>
            <p className="text-sm">Arkadaş listeniz boş</p>
            <p className="text-xs">Yukarıdan kullanıcı arayın</p>
          </div>
        )}
        {(friends as Friend[]).map(f => {
          const isOnline = onlineUsers.some(u => u.id === f.otherUser.id);
          const cnt = unread[f.otherUser.id] ?? 0;
          return (
            <div key={f.id} className="flex items-center group"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Ana alan → DM aç */}
              <button onClick={() => openDM(f.otherUser)}
                className="flex-1 flex items-center gap-3 px-4 py-3.5 transition-all active:bg-white/5 hover:bg-white/[0.03] min-w-0">
                <Av name={f.otherUser.name} size={48} online={isOnline} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate">{f.otherUser.name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: isOnline ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
                    {isOnline ? '● çevrimiçi' : lastSeenStr(lastSeenMap[f.otherUser.id])}
                  </p>
                </div>
                {cnt > 0 && <div className="badge badge-primary">{cnt > 9 ? '9+' : cnt}</div>}
              </button>
              {/* ⋯ → mod/profil menüsü */}
              <button
                onClick={() => setClickedUser({ id: f.otherUser.id, name: f.otherUser.name })}
                className="shrink-0 px-3 py-3.5 transition-all active:opacity-60"
                style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, lineHeight: 1 }}>
                ⋯
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── DM chat view ── */
  const dmChatView = activeDM && (() => {
    const isOnline = onlineUsers.some(u => u.id === activeDM.id);
    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* DM Header */}
        <div className="shrink-0 flex items-center gap-3 px-3 py-2.5"
          style={{ background: '#111f2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={closeDM}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', border: '1.5px solid rgba(249,115,22,0.5)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Av name={activeDM.name} size={38} online={isOnline} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{activeDM.name}</p>
            <p className="text-xs" style={{ color: isOnline ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
              {isOnline ? '● çevrimiçi' : lastSeenStr(lastSeenMap[activeDM.id])}
            </p>
          </div>
          <button onClick={() => showToast('Sesli arama yakında! 🎙️', 'info')}
            className="btn btn-ghost btn-sm btn-circle shrink-0 opacity-60">📞</button>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle shrink-0 opacity-60 text-lg">⋯</button>
            <ul tabIndex={0} className="dropdown-content menu shadow-xl rounded-2xl z-50 w-44 p-1"
              style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.1)' }}>
              <li><a className="text-sm py-2" onClick={() => setDmMsgs([])}>🗑 Mesajları Temizle</a></li>
              <li><a className="text-sm py-2 text-error" onClick={() => setConfirmRemoveFriend({ id: activeDM.id, name: activeDM.name })}>👤 Arkadaşlıktan Çıkar</a></li>
            </ul>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2 px-1" style={{ background: '#0d1826' }}>
          {dmMsgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-30 gap-2">
              <span className="text-4xl">💬</span>
              <p className="text-sm">Henüz mesaj yok</p>
            </div>
          )}
          {dmMsgList}
          <div ref={bottomRef} />
        </div>

        {inputBar(true)}
      </div>
    );
  })();

  /* ── Public chat view ── */
  const publicChatView = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Clickable header → shows online users */}
      <button onClick={() => setShowOnlinePanel(p => !p)}
        className="shrink-0 flex items-center gap-3 px-4 py-2.5 w-full text-left transition-all active:bg-white/5"
        style={{ background: '#111f2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg"
          style={{ background: 'linear-gradient(135deg,#f97316,#e11d48)' }}>💬</div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Genel Sohbet</p>
          <p className="text-xs" style={{ color: '#4ade80' }}>● {onlineUsers.length} kişi çevrimiçi</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className="w-4 h-4 opacity-30 transition-transform shrink-0"
          style={{ transform: showOnlinePanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Online users panel */}
      {showOnlinePanel && (
        <div className="shrink-0 border-b border-white/[0.06]" style={{ background: '#0a1520', maxHeight: 220, overflowY: 'auto' }}>
          {onlineUsers.length === 0
            ? <p className="text-xs opacity-30 text-center py-4">Çevrimiçi kullanıcı yok</p>
            : onlineUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04]">
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Av name={u.name} size={34} />
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#4ade80', border: '2px solid #0a1520' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{u.name}</span>
                </div>
                {u.is_admin && <span className="badge badge-error badge-xs">Admin</span>}
                {u.is_mod && !u.is_admin && <span className="badge badge-info badge-xs">Mod</span>}
              </div>
            ))
          }
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto py-2 px-1" style={{ background: '#0d1826' }}>
        {publicMsgs.length === 0 && <p className="text-center opacity-30 text-sm mt-8">Henüz mesaj yok</p>}
        {publicMsgList}
        <div ref={bottomRef} />
      </div>
      {inputBar(false)}
    </div>
  );

  /* ── Admin panel ── */
  const adminPanel = (
    <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ background: '#0d1826' }}>
      <button onClick={() => setConfirmClear(true)} className="btn btn-error btn-sm btn-outline gap-2">🗑 Sohbeti Temizle</button>
      <div>
        <p className="text-sm font-semibold mb-3">Moderatörler</p>
        {(mods as Mod[]).filter(m => !m.is_admin).map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Av name={m.name} size={36} />
            <div className="flex-1"><p className="text-sm font-medium text-blue-300">{m.name}</p><p className="text-xs opacity-50">Moderatör</p></div>
            <button onClick={() => setMod(m.id, false)} className="btn btn-error btn-xs btn-outline">Kaldır</button>
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold mb-3">Aktif Engellemeler ({(bans as Ban[]).length})</p>
        {(bans as Ban[]).map(ban => (
          <div key={ban.id} className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex-1">
              <p className="text-sm font-medium text-error">{ban.user_name}</p>
              {ban.reason && <p className="text-xs opacity-50">{ban.reason}</p>}
              <p className="text-xs opacity-30">{ban.expires_at ? `Bitiş: ${format(new Date(ban.expires_at), 'd MMM HH:mm', { locale: tr })}` : 'Kalıcı'}</p>
            </div>
            <button onClick={() => chatApi.unban(ban.id).then(() => refetchBans())} className="btn btn-success btn-xs btn-outline">Kaldır</button>
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold mb-3">Yasaklı Kelimeler</p>
        <div className="flex gap-2 mb-3">
          <input className="input input-bordered input-sm flex-1" placeholder="Yeni kelime..." value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }} />
          <button onClick={() => { if (newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }}
            className="btn btn-primary btn-sm">Ekle</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(bannedWords as Word[]).map(w => (
            <span key={w.id} className="badge badge-error gap-1 py-3">{w.word}
              <button onClick={() => chatApi.removeBannedWord(w.id).then(() => refetchWords())} className="hover:opacity-60">✕</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117' }}>

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="toast toast-top toast-center z-[200] pointer-events-none">
          <div className={`alert alert-${toastType} text-sm py-2 shadow-xl`}>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
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
      {confirmRemoveFriend && (
        <div className="modal modal-open modal-middle">
          <div className="modal-box text-center" style={{ background: '#0c1420' }}>
            <p className="text-3xl mb-2">👤</p>
            <h3 className="font-bold text-lg">Arkadaşlıktan Çıkar</h3>
            <p className="text-sm opacity-50 my-3"><b>{confirmRemoveFriend.name}</b> kişisini arkadaş listenden çıkarmak istediğine emin misin?</p>
            <div className="modal-action justify-center gap-2">
              <button onClick={() => setConfirmRemoveFriend(null)} className="btn btn-ghost btn-sm">İptal</button>
              <button onClick={() => { removeFriend(confirmRemoveFriend.id); setConfirmRemoveFriend(null); }} className="btn btn-error btn-sm">Çıkar</button>
            </div>
          </div>
        </div>
      )}
      {/* ── User Action Modal (mod/admin: tıklanan kullanıcı üzerinde işlem) ── */}
      {clickedUser && (
        <div className="modal modal-open modal-bottom sm:modal-middle" onClick={() => setClickedUser(null)}>
          <div className="modal-box p-0 overflow-hidden" style={{ background: '#0c1420', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.07]">
              <Av name={clickedUser.name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{clickedUser.name}</p>
                <p className="text-xs opacity-40 mt-0.5">
                  {onlineUsers.some(u => u.id === clickedUser.id) ? '● çevrimiçi' : 'çevrimdışı'}
                </p>
              </div>
              <button onClick={() => setClickedUser(null)} className="opacity-40 hover:opacity-100 text-lg px-1">✕</button>
            </div>
            {/* Actions */}
            <div className="p-3 flex flex-col gap-2">
              {clickedUser.msgId && (
                <button
                  onClick={() => { deleteMsgAdmin(clickedUser.msgId!); setClickedUser(null); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error transition-all active:bg-white/5"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  🗑 Bu mesajı sil
                </button>
              )}
              <button
                onClick={() => { setBanTarget({ id: clickedUser.id, name: clickedUser.name }); setClickedUser(null); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-warning transition-all active:bg-white/5"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
                🚫 Banla / Sustur
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    const already = modIds.includes(clickedUser.id);
                    setMod(clickedUser.id, !already);
                    setClickedUser(null);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-info transition-all active:bg-white/5"
                  style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  🛡 {modIds.includes(clickedUser.id) ? 'Moderatörlüğü Kaldır' : 'Moderatör Yap'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {banTarget && <BanModal user={banTarget} meIsAdmin={isAdmin} onClose={() => setBanTarget(null)} onBan={doBan} />}
      {pendingImage && (
        <ImageSendPreview file={pendingImage.file} preview={pendingImage.preview} uploading={uploading}
          onSend={sendImage} onClose={() => { setPendingImage(null); URL.revokeObjectURL(pendingImage.preview); }} />
      )}
      {viewerMsg?.imageUrl && (
        <ImageViewer url={viewerMsg.imageUrl} senderName={viewerMsg.senderName}
          timer={viewerMsg.viewTimer ?? null} onClose={() => setViewerMsg(null)} />
      )}

      {/* ── Hidden file input ── */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) setPendingImage({ file: f, preview: URL.createObjectURL(f) }); e.target.value = ''; }} />

      {/* ── Tab bar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2"
        style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className={`badge badge-xs shrink-0 ${connected ? 'badge-success' : 'badge-warning'}`} />
        <div className="flex gap-1 flex-1">
          {[
            { key: 'public', label: '💬 Genel' },
            { key: 'dm', label: `📨 DM${totalUnread > 0 ? ` (${totalUnread})` : ''}` },
            ...(isAdmin || isMod ? [{ key: 'admin', label: '🛡' }] : []),
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key as 'public' | 'dm' | 'admin')}
              className={`btn btn-sm rounded-full ${tab === t.key ? 'btn-primary' : 'btn-ghost opacity-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Admin */}
        {tab === 'admin' && adminPanel}

        {/* Public chat */}
        {tab === 'public' && publicChatView}

        {/* DM — MOBILE: either list OR chat, never both */}
        {tab === 'dm' && isMobile && (
          activeDM ? dmChatView : friendList
        )}

        {/* DM — DESKTOP: sidebar + chat side by side */}
        {tab === 'dm' && !isMobile && (
          <>
            <div className="w-72 shrink-0 flex flex-col border-r border-white/[0.06]" style={{ background: '#0d1117' }}>
              {friendList}
            </div>
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: '#0d1826' }}>
              {activeDM ? dmChatView : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                  <span className="text-5xl">💬</span>
                  <p className="text-sm">Sohbet başlatmak için bir arkadaş seçin</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <ChatErrorBoundary><ChatPageInner /></ChatErrorBoundary>;
}
