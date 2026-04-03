import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/* ────────── types ────────── */
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

/* ────────── helpers ────────── */
function timeStr(iso: string) { return format(new Date(iso), 'HH:mm', { locale: tr }); }
function avatarColor(name: string) {
  const colors = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6','#f59e0b'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}
function initials(name: string) { return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(); }

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const c = avatarColor(name);
  const px = size * 4;
  return (
    <div className="rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ width: px, height: px, background: c + '30', border: `1px solid ${c}50`, color: c }}>
      {initials(name)}
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ isAdmin, isMod }: { isAdmin: boolean; isMod: boolean }) {
  if (isAdmin) return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>ADMİN</span>;
  if (isMod) return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>MOD</span>;
  return null;
}

/* ────────── Image Send Preview (Telegram-style overlay) ────────── */
const TIMER_OPTIONS: { label: string; value: number | null; desc: string }[] = [
  { label: '∞',   value: null, desc: 'Kalıcı' },
  { label: '1×',  value: 0,   desc: '1 kez' },
  { label: '5s',  value: 5,   desc: '5 sn' },
  { label: '10s', value: 10,  desc: '10 sn' },
  { label: '30s', value: 30,  desc: '30 sn' },
  { label: '60s', value: 60,  desc: '60 sn' },
];

function ImageSendPreview({ file, preview, uploading, onSend, onClose }: {
  file: File; preview: string; uploading: boolean;
  onSend: (file: File, timer: number | null) => void;
  onClose: () => void;
}) {
  const [timer, setTimer] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        style={{ background: '#0f1520', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90dvh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="text-sm font-semibold text-white">Fotoğraf Gönder</p>
          <div className="w-7" />
        </div>

        {/* Preview image — fixed height */}
        <div className="flex items-center justify-center bg-black/40 shrink-0"
          style={{ height: 260 }}>
          <img src={preview} alt="preview"
            className="max-w-full max-h-full object-contain select-none"
            draggable={false} style={{ maxHeight: 260 }} />
        </div>

        {/* Timer options */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <p className="text-xs text-gray-500 mb-3 font-medium tracking-wide uppercase">Görüntüleme Süresi</p>
          <div className="flex gap-1.5">
            {TIMER_OPTIONS.map((opt) => (
              <button key={String(opt.value)} onClick={() => setTimer(opt.value)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={timer === opt.value
                  ? { background: 'rgba(249,115,22,0.25)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.5)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-2 text-center">
            {timer === null ? 'Sohbette kalıcı olarak görünür'
              : timer === 0 ? 'Alıcı yalnızca 1 kez görüntüleyebilir'
              : `Alıcı açtıktan ${timer} saniye sonra kaybolur`}
          </p>
        </div>

        {/* Send button */}
        <div className="px-4 pb-6 pt-3 shrink-0">
          <button
            onClick={() => onSend(file, timer)}
            disabled={uploading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Gönderiliyor...</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>Gönder</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Image Viewer Modal ────────── */
const ImageViewer = memo(({ url, senderName, timer, onClose }: {
  url: string; senderName: string; timer: number | null; onClose: () => void;
}) => {
  const [remaining, setRemaining] = useState<number | null>(timer != null ? (timer === 0 ? 10 : timer) : null);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) { onClose(); return; }
    const t = setTimeout(() => setRemaining((r) => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onClose]);

  // Block right-click and keyboard shortcuts
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 's' || e.key === 'p'))) e.preventDefault();
    });
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>

      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute text-white/10 text-xs font-bold whitespace-nowrap"
            style={{
              top: `${(i % 4) * 28}%`,
              left: `${Math.floor(i / 4) * 35}%`,
              transform: 'rotate(-30deg)',
            }}>
            {senderName} • V&S
          </div>
        ))}
      </div>

      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ background: 'rgba(255,255,255,0.12)' }}>✕</button>

      {/* Timer */}
      {remaining !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-sm font-bold text-white flex items-center gap-2"
          style={{ background: remaining <= 3 ? 'rgba(239,68,68,0.8)' : 'rgba(249,115,22,0.8)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/>
          </svg>
          {remaining}s
        </div>
      )}

      {/* Image — no pointer events to prevent save-image context menu */}
      <div className="relative max-w-[90vw] max-h-[80vh] select-none" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="dm"
          className="max-w-full max-h-[80vh] rounded-2xl object-contain select-none"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitUserDrag: 'none' } as React.CSSProperties}
        />
        {/* Transparent overlay to block right-click on image */}
        <div className="absolute inset-0 rounded-2xl" style={{ userSelect: 'none' }}
          onContextMenu={(e) => e.preventDefault()} />
      </div>
    </div>
  );
});

/* ────────── Image Message Bubble ────────── */
function ImageMessage({ msg, isMe, myName, onOpen }: {
  msg: DM; isMe: boolean; myName: string; onOpen: (msg: DM) => void;
}) {
  const isOpened = !!msg.viewedAt;
  const isExpired = msg.expiresAt ? new Date(msg.expiresAt) < new Date() : false;
  const isOnce = msg.viewTimer === 0;

  if (isExpired) {
    return (
      <div className="px-3 py-2 rounded-2xl text-xs text-gray-600 italic"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        🕐 Bu görsel süresi doldu
      </div>
    );
  }

  // Sender sees a small thumb with a lock icon
  if (isMe) {
    return (
      <div className="relative rounded-2xl overflow-hidden select-none"
        style={{ width: 160, height: 120, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
        <img src={msg.imageUrl!} alt="" className="w-full h-full object-cover"
          style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }} draggable={false}
          onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-lg">{isOpened ? '✓' : '🔒'}</span>
          <span className="text-[10px] text-white/70">
            {isOpened ? 'Açıldı' : 'Gönderildi'}
            {msg.viewTimer != null && ` · ${isOnce ? '1×' : `${msg.viewTimer}s`}`}
          </span>
        </div>
      </div>
    );
  }

  // Receiver sees blurred image with "view" button
  return (
    <button onClick={() => onOpen(msg)} className="relative rounded-2xl overflow-hidden select-none"
      style={{ width: 160, height: 120, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <img src={msg.imageUrl!} alt="" className="w-full h-full object-cover"
        style={{ filter: isOpened ? 'blur(0)' : 'blur(14px)', transform: 'scale(1.1)', transition: 'filter 0.3s' }}
        draggable={false} onContextMenu={(e) => e.preventDefault()} />
      {!isOpened && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.85)', backdropFilter: 'blur(4px)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <span className="text-[11px] font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {msg.viewTimer != null ? (isOnce ? '1 kez görüntüle' : `${msg.viewTimer}s görüntüle`) : 'Görüntüle'}
          </span>
        </div>
      )}
    </button>
  );
}

/* ────────── UserPopup ────────── */
function UserPopup({
  user, pos, meId, meIsAdmin, meIsMod, friends, sentIds, modIds,
  onRequest, onRemoveFriend, onClose, onSetMod, onBanTarget,
}: {
  user: { id: string; name: string; isAdmin?: boolean };
  pos: { x: number; y: number };
  meId: string; meIsAdmin: boolean; meIsMod: boolean;
  friends: Friend[]; sentIds: string[]; modIds: string[];
  onRequest: (id: string) => void;
  onRemoveFriend: (id: string) => void;
  onClose: () => void;
  onSetMod: (id: string, val: boolean) => void;
  onBanTarget: (u: { id: string; name: string }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isFriend = friends.some((f) => f.otherUser.id === user.id);
  const isPending = sentIds.includes(user.id);
  const isCurrentlyMod = modIds.includes(user.id);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  if (user.id === meId) return null;

  const left = Math.min(pos.x, window.innerWidth - 210);
  const top = Math.min(pos.y + 8, window.innerHeight - 220);

  return (
    <div ref={ref} className="fixed z-50 rounded-2xl p-3 shadow-2xl min-w-[190px]"
      style={{ left, top, background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="flex items-center gap-2.5 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Avatar name={user.name} size={9} />
        <div>
          <p className="text-sm font-semibold text-white">{user.name}</p>
          {isCurrentlyMod && <span className="text-[9px] text-blue-400">Moderatör</span>}
        </div>
      </div>
      <div className="space-y-1.5">
        {/* Friend request */}
        {isFriend ? (
          <button onClick={() => { onRemoveFriend(user.id); onClose(); }}
            className="w-full py-1.5 rounded-xl text-xs font-medium transition-all text-left px-2"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
            👤 Arkadaşlıktan Çıkar
          </button>
        ) : isPending ? (
          <p className="text-xs text-gray-500 py-1">İstek Gönderildi</p>
        ) : (
          <button onClick={() => { onRequest(user.id); onClose(); }}
            className="w-full py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)' }}>
            + Arkadaş İsteği Gönder
          </button>
        )}

        {/* Mod actions — mods cannot ban admins */}
        {(meIsAdmin || (meIsMod && !user.isAdmin)) && (
          <button onClick={() => { onBanTarget(user); onClose(); }}
            className="w-full py-1.5 rounded-xl text-xs font-medium transition-all text-left px-2"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            🚫 Engelle / Sustur
          </button>
        )}

        {/* Admin only: set mod */}
        {meIsAdmin && (
          <button onClick={() => { onSetMod(user.id, !isCurrentlyMod); onClose(); }}
            className="w-full py-1.5 rounded-xl text-xs font-medium transition-all text-left px-2"
            style={{ background: isCurrentlyMod ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.1)', color: isCurrentlyMod ? '#f87171' : '#60a5fa' }}>
            {isCurrentlyMod ? '🛡 Moderatörlüğü Kaldır' : '🛡 Moderatör Yap'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ────────── BanModal ────────── */
function BanModal({ user, meIsAdmin, onClose, onBan }: {
  user: { id: string; name: string }; meIsAdmin: boolean;
  onClose: () => void; onBan: (reason: string, minutes?: number) => void;
}) {
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'temp' | 'perm'>('temp');
  const [minutes, setMinutes] = useState('60');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-5" style={{ background: '#0c1420', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-base font-semibold text-white mb-1">Engelle / Sustur</h3>
        <p className="text-xs text-gray-400 mb-4">{user.name}</p>
        {meIsAdmin && (
          <div className="flex gap-2 mb-3">
            {(['temp', 'perm'] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={type === t ? { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid transparent' }}>
                {t === 'temp' ? 'Süreli' : 'Kalıcı Ban'}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 mb-3 flex-wrap">
          {[5, 15, 30, 60, 360, 1440, 10080].map((m) => (
            <button key={m} onClick={() => { setMinutes(String(m)); setType('temp'); }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={minutes === String(m) && type === 'temp' ? { background: '#ef444420', color: '#ef4444' }
                : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
              {m < 60 ? `${m}dk` : m < 1440 ? `${m / 60}sa` : m < 10080 ? `${m / 1440}g` : `${m / 10080}h`}
            </button>
          ))}
        </div>
        <input className="input text-sm w-full mb-3" placeholder="Sebep (isteğe bağlı)"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)' }}>İptal</button>
          <button onClick={() => { onBan(reason, type === 'temp' ? parseInt(minutes) : undefined); onClose(); }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#ef4444' }}>
            {type === 'perm' ? 'Kalıcı Banla' : 'Sustur'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Main ────────── */
export default function ChatPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'public' | 'dm' | 'admin'>('public');
  const [publicMsgs, setPublicMsgs] = useState<Msg[]>([]);
  const [dmMsgs, setDmMsgs] = useState<DM[]>([]);
  const [activeDM, setActiveDM] = useState<{ id: string; name: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string; is_mod: boolean; is_admin: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [popup, setPopup] = useState<{ user: { id: string; name: string; isAdmin?: boolean }; pos: { x: number; y: number } } | null>(null);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [newWord, setNewWord] = useState('');
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [modIds, setModIds] = useState<string[]>([]);
  const [viewerMsg, setViewerMsg] = useState<DM | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeDMRef = useRef(activeDM);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);

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
  const { data: bans = [], refetch: refetchBans } = useQuery<Ban[]>({
    queryKey: ['chat-bans'], queryFn: chatApi.getBans, enabled: isAdmin || isMod,
  });
  const { data: bannedWords = [], refetch: refetchWords } = useQuery<Word[]>({
    queryKey: ['chat-words'], queryFn: chatApi.getBannedWords, enabled: isAdmin,
  });
  const { data: mods = [], refetch: refetchMods } = useQuery<Mod[]>({
    queryKey: ['chat-mods'], queryFn: chatApi.getModerators, enabled: isAdmin,
  });

  // Sync mod ids
  useEffect(() => {
    setModIds((mods as Mod[]).filter((m) => m.is_moderator && !m.is_admin).map((m) => m.id));
  }, [mods]);

  // Initial load
  useEffect(() => {
    chatApi.getMessages().then(setPublicMsgs);
    chatApi.getUnread().then(setUnread);
  }, []);

  // Load DMs
  useEffect(() => {
    if (!activeDM) return;
    chatApi.getDMs(activeDM.id).then((msgs) => {
      setDmMsgs(msgs);
      setUnread((p) => { const n = { ...p }; delete n[activeDM.id]; return n; });
      socket?.emit('dm:read', { senderId: activeDM.id });
    });
  }, [activeDM?.id]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicMsgs.length, dmMsgs.length]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('users:online', (users: { id: string; name: string; is_mod: boolean; is_admin: boolean }[]) => setOnlineUsers(users));
    socket.on('chat:message', (msg: Msg) => setPublicMsgs((p) => [...p.slice(-199), msg]));
    socket.on('chat:deleted', ({ messageId }: { messageId: string }) =>
      setPublicMsgs((p) => p.filter((m) => m.id !== messageId)));
    socket.on('chat:cleared', () => setPublicMsgs([]));
    socket.on('dm:message', (msg: DM) => {
      const otherId = msg.senderId === user?.id ? msg.receiverId : (msg.senderId ?? '');
      setActiveDM((curr) => {
        if (curr?.id === otherId || curr?.id === msg.senderId) {
          setDmMsgs((p) => [...p, msg]);
          socket.emit('dm:read', { senderId: msg.senderId });
        } else {
          setUnread((p) => ({ ...p, [otherId]: (p[otherId] ?? 0) + 1 }));
        }
        return curr;
      });
    });
    socket.on('user:mod_updated', ({ userId: uid, isMod: val }: { userId: string; isMod: boolean }) => {
      setModIds((p) => val ? [...p.filter((x) => x !== uid), uid] : p.filter((x) => x !== uid));
      refetchMods();
      qc.invalidateQueries({ queryKey: ['chat-me'] });
    });
    socket.on('friend:request', () => qc.invalidateQueries({ queryKey: ['chat-requests'] }));
    socket.on('friend:accepted', () => { qc.invalidateQueries({ queryKey: ['chat-friends'] }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); });
    socket.on('friend:sent', () => { qc.invalidateQueries({ queryKey: ['chat-friends'] }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); });
    socket.on('friend:removed', ({ friendId }: { friendId: string }) => {
      qc.invalidateQueries({ queryKey: ['chat-friends'] });
      setActiveDM((curr) => { if (curr?.id === friendId) { setTab('public'); return null; } return curr; });
    });

    socket.on('dm:image-opened', (updated: DM) => {
      setDmMsgs((p) => p.map((m) => m.id === updated.id ? { ...m, viewedAt: updated.viewedAt, expiresAt: updated.expiresAt } : m));
    });

    return () => {
      socket.off('users:online');
      socket.off('chat:message');
      socket.off('chat:deleted');
      socket.off('chat:cleared');
      socket.off('dm:message');
      socket.off('user:mod_updated');
      socket.off('friend:request');
      socket.off('friend:accepted');
      socket.off('friend:sent');
      socket.off('friend:removed');
      socket.off('dm:image-opened');
    };
  }, [socket, user?.id, qc, refetchMods]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket || !connected) return;
    if (tab === 'public') socket.emit('chat:send', input.trim());
    else if (tab === 'dm' && activeDM) socket.emit('dm:send', { receiverId: activeDM.id, content: input.trim() });
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, socket, connected, tab, activeDM]);

  const sendImage = useCallback(async (file: File, timer: number | null) => {
    const dm = activeDMRef.current;
    if (!socket || !connected || !dm) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/chat/dm/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const { url } = await res.json();
      socket.emit('dm:send', {
        receiverId: dm.id,
        content: '',
        imageUrl: url,
        viewTimer: timer,
      });
      setPendingImage(null);
    } catch (e) {
      console.error('image upload failed', e);
      alert('Fotoğraf gönderilemedi: ' + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [socket, connected]);

  const openImage = useCallback((msg: DM) => {
    if (!msg.viewedAt && msg.senderId !== user?.id) {
      socket?.emit('dm:open-image', { messageId: msg.id });
    }
    setViewerMsg(msg);
  }, [socket, user?.id]);

  function removeFriend(friendId: string) {
    socket?.emit('friend:remove', { friendId });
    qc.invalidateQueries({ queryKey: ['chat-friends'] });
    if (activeDM?.id === friendId) { setActiveDM(null); setTab('public'); }
  }
  function deleteOwnMsg(messageId: string) { socket?.emit('msg:delete_own', { messageId }); }
  function deleteMsgAsAdmin(messageId: string) { socket?.emit('admin:delete_msg', { messageId }); }
  function clearChat() { if (confirm('Tüm sohbet mesajları silinecek. Emin misin?')) socket?.emit('admin:clear_chat'); }
  function setMod(targetId: string, val: boolean) { socket?.emit('admin:set_mod', { targetId, value: val }); refetchMods(); }
  function sendFriendRequest(id: string) { socket?.emit('friend:request', { addresseeId: id }); setSentRequestIds((p) => [...p, id]); }
  function acceptRequest(id: string) { socket?.emit('friend:accept', { friendshipId: id }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); qc.invalidateQueries({ queryKey: ['chat-friends'] }); }
  function rejectRequest(id: string) { socket?.emit('friend:reject', { friendshipId: id }); qc.invalidateQueries({ queryKey: ['chat-requests'] }); }
  function doBan(reason: string, minutes?: number) {
    if (!banTarget) return;
    socket?.emit('admin:ban', { targetId: banTarget.id, reason, durationMinutes: minutes });
    setTimeout(() => refetchBans(), 500);
  }
  function openPopup(e: React.MouseEvent, u: { id: string; name: string; isAdmin?: boolean; is_admin?: boolean }) {
    if (u.id === user?.id) return;
    e.stopPropagation();
    setPopup({ user: { id: u.id, name: u.name, isAdmin: u.isAdmin ?? u.is_admin ?? false }, pos: { x: e.clientX, y: e.clientY } });
  }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ── Sidebar ── */
  const sidebarEl = (
    <div className="w-28 sm:w-52 shrink-0 flex flex-col gap-2 sm:gap-3 h-full overflow-y-auto overflow-x-hidden">
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-yellow-500 animate-pulse'}`} />
        <span className="text-xs text-gray-500">{connected ? `${onlineUsers.map(u=>u.id).length} çevrimiçi` : 'Bağlanıyor...'}</span>
      </div>

      {(requests as PendingReq[]).length > 0 && (
        <div className="card p-3">
          <p className="text-xs font-semibold text-orange-400 mb-2">
            Arkadaşlık İstekleri ({(requests as PendingReq[]).length})
          </p>
          <div className="space-y-2">
            {(requests as PendingReq[]).map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <button onClick={(e) => openPopup(e, { id: r.requester_id, name: r.requester_name })} className="shrink-0">
                  <Avatar name={r.requester_name} size={7} />
                </button>
                <button className="text-xs text-gray-300 flex-1 truncate text-left hover:text-white transition-colors"
                  onClick={(e) => openPopup(e, { id: r.requester_id, name: r.requester_name })}>
                  {r.requester_name}
                </button>
                <button onClick={() => acceptRequest(r.id)} title="Kabul" className="w-6 h-6 rounded-lg flex items-center justify-center text-green-400 hover:text-white shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>✓</button>
                <button onClick={() => rejectRequest(r.id)} title="Reddet" className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:text-white shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends */}
      <div className="card p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Arkadaşlar ({(friends as Friend[]).length})</p>
        {(friends as Friend[]).length === 0 && <p className="text-xs text-gray-600">Henüz arkadaşın yok</p>}
        <div className="space-y-0.5">
          {(friends as Friend[]).map((f) => {
            const isOnline = onlineUsers.map(u=>u.id).includes(f.otherUser.id);
            const dmUnread = unread[f.otherUser.id] ?? 0;
            return (
              <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-all"
                style={activeDM?.id === f.otherUser.id && tab === 'dm' ? { background: 'rgba(249,115,22,0.08)' } : {}}>
                {/* Avatar → profile popup */}
                <button className="relative shrink-0" onClick={(e) => openPopup(e, f.otherUser)}>
                  <Avatar name={f.otherUser.name} size={7} />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`} style={{ borderColor: '#080c14' }} />
                </button>
                {/* Name → open DM */}
                <button className="text-xs text-gray-300 flex-1 truncate text-left hover:text-white transition-colors"
                  onClick={() => { setActiveDM(f.otherUser); setTab('dm'); }}>
                  {f.otherUser.name}
                </button>
                {dmUnread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: '#f97316' }}>
                    {dmUnread > 9 ? '9+' : dmUnread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Online users (not friends) */}
      {onlineUsers.filter((u) => u.id !== user?.id && !(friends as Friend[]).some((f) => f.otherUser.id === u.id)).length > 0 && (
        <div className="card p-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">Çevrimiçi</p>
          <div className="space-y-0.5">
            {onlineUsers
              .filter((u) => u.id !== user?.id && !(friends as Friend[]).some((f) => f.otherUser.id === u.id))
              .map((u) => (
                <button key={u.id} onClick={(e) => openPopup(e, u)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left hover:bg-white/[0.04] transition-all">
                  <div className="relative shrink-0">
                    <Avatar name={u.name} size={7} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2" style={{ borderColor: '#080c14' }} />
                  </div>
                  <span className="text-xs text-gray-300 flex-1 truncate">{u.name}</span>
                  {(u.is_admin || u.is_mod) && <RoleBadge isAdmin={u.is_admin} isMod={u.is_mod} />}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* User search */}
      <div className="card p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Kullanıcı Bul</p>
        <input className="input text-xs py-1.5 w-full mb-2" placeholder="İsim ara..."
          value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {(searchResults as { id: string; name: string }[]).map((u) => {
            const alreadyFriend = (friends as Friend[]).some((f) => f.otherUser.id === u.id);
            const pending = sentRequestIds.includes(u.id);
            return (
              <div key={u.id} className="flex items-center gap-2">
                {/* Avatar → profile popup */}
                <button onClick={(e) => openPopup(e, u)} className="shrink-0">
                  <Avatar name={u.name} size={6} />
                </button>
                <span className="text-xs text-gray-300 flex-1 truncate">{u.name}</span>
                {alreadyFriend
                  ? <span className="text-[10px] text-green-500 shrink-0">✓</span>
                  : pending
                    ? <span className="text-[10px] text-gray-500 shrink-0">bekliyor</span>
                    : <button onClick={() => sendFriendRequest(u.id)}
                        className="text-[10px] px-2 py-0.5 rounded-lg text-orange-400 hover:text-white transition-all shrink-0"
                        style={{ background: 'rgba(249,115,22,0.1)' }}>+ Ekle</button>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ── Messages ── */
  const messagesEl = (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1.5">
      {tab === 'public' && publicMsgs.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-600 text-sm">Henüz mesaj yok</div>
      )}
      {tab === 'dm' && !activeDM && (
        <div className="flex items-center justify-center h-32 text-gray-600 text-sm">Sol panelden bir arkadaş seç</div>
      )}

      {tab === 'public' && (publicMsgs as Msg[]).map((msg) => {
        const isMe = msg.userId === user?.id;
        return (
          <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
            {!isMe && (
              <button onClick={(e) => openPopup(e, { id: msg.userId!, name: msg.userName, isAdmin: msg.isAdmin })} className="shrink-0 self-end mb-5">
                <Avatar name={msg.userName} size={8} />
              </button>
            )}
            <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <button onClick={(e) => openPopup(e, { id: msg.userId!, name: msg.userName, isAdmin: msg.isAdmin })}
                    className="text-[11px] text-gray-500 hover:text-orange-400 transition-colors">
                    {msg.userName}
                  </button>
                  <RoleBadge isAdmin={msg.isAdmin} isMod={msg.isMod} />
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={isMe
                    ? { background: 'rgba(249,115,22,0.2)', color: '#fed7aa', borderBottomRightRadius: 4 }
                    : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: 4 }}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-700 mb-1 shrink-0">{timeStr(msg.createdAt)}</span>
              </div>
              {/* Action row */}
              <div className="flex items-center gap-1 mt-0.5 px-1">
                {/* Own delete */}
                {isMe && (
                  <button onClick={() => deleteOwnMsg(msg.id)} title="Mesajı Sil"
                    className="text-[10px] px-1.5 py-0.5 rounded-lg text-gray-600 hover:text-red-400 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>🗑</button>
                )}
                {/* Mod/Admin delete others — mod cannot touch admin messages */}
                {!isMe && msg.userId && (isAdmin || (isMod && !msg.isAdmin)) && (
                  <>
                    <button onClick={() => deleteMsgAsAdmin(msg.id)} title="Mesajı Sil"
                      className="text-[10px] px-1.5 py-0.5 rounded-lg text-red-400 hover:text-white transition-all"
                      style={{ background: 'rgba(239,68,68,0.1)' }}>🗑 Sil</button>
                    <button onClick={() => setBanTarget({ id: msg.userId!, name: msg.userName })} title="Engelle"
                      className="text-[10px] px-1.5 py-0.5 rounded-lg text-orange-400 hover:text-white transition-all"
                      style={{ background: 'rgba(249,115,22,0.1)' }}>🚫</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {tab === 'dm' && activeDM && (dmMsgs as DM[]).map((msg) => {
        const isMe = msg.senderId === user?.id;
        const isImage = msg.msgType === 'image';
        return (
          <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
            {!isMe && <div className="shrink-0 self-end mb-1"><Avatar name={activeDM.name} size={8} /></div>}
            <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-end gap-1.5">
                {isImage ? (
                  <ImageMessage msg={msg} isMe={isMe} myName={user?.name ?? ''} onOpen={openImage} />
                ) : (
                  <div className="px-3 py-2 rounded-2xl text-sm"
                    style={isMe
                      ? { background: 'rgba(249,115,22,0.2)', color: '#fed7aa', borderBottomRightRadius: 4 }
                      : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: 4 }}>
                    {msg.content}
                  </div>
                )}
                <span className="text-[10px] text-gray-700 mb-1 shrink-0">{timeStr(msg.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );

  /* ── Admin Panel ── */
  const adminEl = (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Danger actions */}
      <div className="flex gap-2">
        <button onClick={clearChat}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          🗑 Sohbeti Temizle
        </button>
      </div>

      {/* Moderators */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Moderatörler</h3>
        {(mods as Mod[]).filter((m) => !m.is_admin).length === 0 && (
          <p className="text-xs text-gray-600 mb-2">Henüz moderatör yok. Sohbette kullanıcı adına tıklayarak mod ekleyebilirsin.</p>
        )}
        <div className="space-y-2">
          {(mods as Mod[]).filter((m) => !m.is_admin).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <Avatar name={m.name} size={8} />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-300">{m.name}</p>
                <p className="text-xs text-gray-500">Moderatör</p>
              </div>
              <button onClick={() => setMod(m.id, false)}
                className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:text-white transition-all shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)' }}>Kaldır</button>
            </div>
          ))}
        </div>
      </div>

      {/* Active bans */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Aktif Engellemeler ({(bans as Ban[]).length})</h3>
        {(bans as Ban[]).length === 0 && <p className="text-xs text-gray-600">Aktif engelleme yok</p>}
        <div className="space-y-2">
          {(bans as Ban[]).map((ban) => (
            <div key={ban.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">{ban.user_name}</p>
                {ban.reason && <p className="text-xs text-gray-500">{ban.reason}</p>}
                <p className="text-xs text-gray-600">{ban.expires_at ? `Bitiş: ${format(new Date(ban.expires_at), 'd MMM HH:mm', { locale: tr })}` : 'Kalıcı'}</p>
              </div>
              <button onClick={() => { chatApi.unban(ban.id).then(() => refetchBans()); }}
                className="text-xs px-2.5 py-1.5 rounded-lg text-green-400 hover:text-white transition-all shrink-0"
                style={{ background: 'rgba(34,197,94,0.1)' }}>Kaldır</button>
            </div>
          ))}
        </div>
      </div>

      {/* Banned words */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Yasaklı Kelimeler</h3>
        <div className="flex gap-2 mb-3">
          <input className="input text-sm flex-1" placeholder="Yeni kelime..." value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newWord.trim()) { chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); } }} />
          <button onClick={() => { if (newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }}
            className="px-3 rounded-xl text-sm font-medium text-white" style={{ background: 'rgba(249,115,22,0.2)' }}>Ekle</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(bannedWords as Word[]).map((w) => (
            <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-300">{w.word}</span>
              <button onClick={() => chatApi.removeBannedWord(w.id).then(() => refetchWords())} className="text-red-600 hover:text-red-300">✕</button>
            </div>
          ))}
          {(bannedWords as Word[]).length === 0 && <p className="text-xs text-gray-600">Henüz yasaklı kelime yok</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ height: '100%' }}>
      {banTarget && <BanModal user={banTarget} meIsAdmin={isAdmin} onClose={() => setBanTarget(null)} onBan={doBan} />}
      {popup && (
        <UserPopup
          user={popup.user} pos={popup.pos} meId={user?.id ?? ''}
          meIsAdmin={isAdmin} meIsMod={isMod}
          friends={friends as Friend[]} sentIds={sentRequestIds} modIds={modIds}
          onRequest={sendFriendRequest} onRemoveFriend={removeFriend} onClose={() => setPopup(null)}
          onSetMod={setMod} onBanTarget={(u) => setBanTarget(u)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Sohbet</h1>
          <p className="text-xs text-gray-500">V&S Topluluğu{(isAdmin || isMod) && <span className="ml-2 text-orange-400">{isAdmin ? '· ADMİN' : '· MOD'}</span>}</p>
        </div>
        <div className="flex gap-1">
          {[
            { key: 'public', label: 'Genel', color: '#f97316' },
            { key: 'dm', label: `DM${totalUnread > 0 ? ` (${totalUnread})` : ''}`, color: '#60a5fa' },
            ...(isAdmin || isMod ? [{ key: 'admin', label: '🛡 Panel', color: '#f87171' }] : []),
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as 'public' | 'dm' | 'admin')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={tab === t.key
                ? { background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        {tab !== 'admin' && sidebarEl}

        <div className="flex-1 flex flex-col card overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              {tab === 'public' && <><span>💬</span><span className="text-sm font-semibold text-white">Genel Sohbet</span></>}
              {tab === 'dm' && activeDM && (
                <button className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  onClick={(e) => openPopup(e, activeDM)}>
                  <Avatar name={activeDM.name} size={7} />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{activeDM.name}</p>
                    <p className="text-xs" style={{ color: onlineUsers.map(u=>u.id).includes(activeDM.id) ? '#4ade80' : '#6b7280' }}>
                      {onlineUsers.map(u=>u.id).includes(activeDM.id) ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </p>
                  </div>
                </button>
              )}
              {tab === 'dm' && !activeDM && <span className="text-sm text-gray-500">Özel Mesajlar</span>}
              {tab === 'admin' && <span className="text-sm font-semibold text-red-400">🛡️ Yönetim Paneli</span>}
            </div>
            {tab === 'public' && <span className="text-xs text-gray-600">{onlineUsers.map(u=>u.id).length} çevrimiçi</span>}
          </div>

          {tab === 'admin' ? adminEl : messagesEl}

          {/* Input */}
          {tab !== 'admin' && (tab === 'public' || (tab === 'dm' && activeDM)) && (
            <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {!connected && <p className="text-xs text-yellow-500 mb-2 text-center animate-pulse">Bağlanıyor...</p>}

              <div className="flex gap-2">
                {/* Camera button (DM only) — opens preview modal */}
                {tab === 'dm' && activeDM && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setPendingImage({ file: f, preview: URL.createObjectURL(f) });
                        e.target.value = '';
                      }} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!connected}
                      title="Fotoğraf gönder"
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#9ca3af' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </button>
                  </>
                )}

                <input ref={inputRef} className="input flex-1 text-sm"
                  placeholder={connected ? 'Mesaj yaz... (Enter)' : 'Bağlanılıyor...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  maxLength={500} disabled={!connected} />
                <button onClick={sendMessage} disabled={!input.trim() || !connected}
                  className="px-4 py-2 rounded-xl text-white disabled:opacity-40 transition-all shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Send Preview Modal */}
      {pendingImage && (
        <ImageSendPreview
          file={pendingImage.file}
          preview={pendingImage.preview}
          uploading={uploading}
          onSend={sendImage}
          onClose={() => { setPendingImage(null); URL.revokeObjectURL(pendingImage.preview); }}
        />
      )}

      {/* Image Viewer Modal */}
      {viewerMsg?.imageUrl && (
        <ImageViewer
          url={viewerMsg.imageUrl}
          senderName={viewerMsg.senderName}
          timer={viewerMsg.viewTimer ?? null}
          onClose={() => setViewerMsg(null)}
        />
      )}
    </div>
  );
}
