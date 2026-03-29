import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/* ────────── types ────────── */
interface Msg { id: string; userId: string | null; userName: string; userInitials: string; content: string; createdAt: string; }
interface DM { id: string; senderId: string | null; receiverId: string; senderName: string; content: string; isRead: boolean; createdAt: string; }
interface Friend { id: string; otherUser: { id: string; name: string }; }
interface PendingReq { id: string; requester_id: string; requester_name: string; created_at: string; }
interface Ban { id: string; user_id: string; user_name: string; reason: string; expires_at: string | null; }
interface Word { id: string; word: string; }

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

/* ────────── UserPopup ────────── */
function UserPopup({
  user, pos, meId, friends, sentIds, onRequest, onClose,
}: {
  user: { id: string; name: string };
  pos: { x: number; y: number };
  meId: string;
  friends: Friend[];
  sentIds: string[];
  onRequest: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isFriend = friends.some((f) => f.otherUser.id === user.id);
  const isPending = sentIds.includes(user.id);

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  if (user.id === meId) return null;

  // Adjust position so popup stays within viewport
  const left = Math.min(pos.x, window.innerWidth - 200);
  const top = pos.y + 8;

  return (
    <div ref={ref} className="fixed z-50 rounded-2xl p-3 shadow-2xl min-w-[170px]"
      style={{ left, top, background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar name={user.name} size={9} />
        <p className="text-sm font-semibold text-white">{user.name}</p>
      </div>
      {isFriend ? (
        <p className="text-xs text-green-400 text-center py-1">✓ Arkadaşsınız</p>
      ) : isPending ? (
        <p className="text-xs text-gray-500 text-center py-1">İstek Gönderildi</p>
      ) : (
        <button onClick={() => { onRequest(user.id); onClose(); }}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)' }}>
          + Arkadaş İsteği Gönder
        </button>
      )}
    </div>
  );
}

/* ────────── BanModal ────────── */
function BanModal({ user, onClose, onBan }: {
  user: { id: string; name: string };
  onClose: () => void;
  onBan: (reason: string, minutes?: number) => void;
}) {
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'temp' | 'perm'>('temp');
  const [minutes, setMinutes] = useState('60');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-5" style={{ background: '#0c1420', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-base font-semibold text-white mb-1">Kullanıcıyı Engelle</h3>
        <p className="text-xs text-gray-400 mb-4">{user.name}</p>
        <div className="flex gap-2 mb-3">
          {(['temp', 'perm'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
              style={type === t ? { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid transparent' }}>
              {t === 'temp' ? 'Süreli' : 'Kalıcı'}
            </button>
          ))}
        </div>
        {type === 'temp' && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {[15, 60, 360, 1440, 10080].map((m) => (
              <button key={m} onClick={() => setMinutes(String(m))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={minutes === String(m) ? { background: '#ef444420', color: '#ef4444' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                {m < 60 ? `${m}dk` : m < 1440 ? `${m / 60}sa` : m < 10080 ? `${m / 1440}g` : `${m / 10080}h`}
              </button>
            ))}
          </div>
        )}
        <input className="input text-sm w-full mb-3" placeholder="Sebep (isteğe bağlı)"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)' }}>İptal</button>
          <button onClick={() => { onBan(reason, type === 'temp' ? parseInt(minutes) : undefined); onClose(); }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#ef4444' }}>
            Engelle
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
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [input, setInput] = useState('');

  // Search with debounce — no API call on every keystroke
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [popup, setPopup] = useState<{ user: { id: string; name: string }; pos: { x: number; y: number } } | null>(null);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [newWord, setNewWord] = useState('');
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: isAdminData } = useQuery({ queryKey: ['chat-me'], queryFn: chatApi.getMe, staleTime: 60_000 });
  const isAdmin = isAdminData?.isAdmin ?? false;

  const { data: friends = [] } = useQuery<Friend[]>({ queryKey: ['chat-friends'], queryFn: chatApi.getFriends });
  const { data: requests = [] } = useQuery<PendingReq[]>({ queryKey: ['chat-requests'], queryFn: chatApi.getRequests });
  const { data: searchResults = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['chat-users', debouncedSearch],
    queryFn: () => chatApi.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 1,
    staleTime: 30_000,
  });
  const { data: bans = [], refetch: refetchBans } = useQuery<Ban[]>({
    queryKey: ['chat-bans'], queryFn: chatApi.getBans, enabled: isAdmin,
  });
  const { data: bannedWords = [], refetch: refetchWords } = useQuery<Word[]>({
    queryKey: ['chat-words'], queryFn: chatApi.getBannedWords, enabled: isAdmin,
  });

  // Load initial data
  useEffect(() => {
    chatApi.getMessages().then(setPublicMsgs);
    chatApi.getUnread().then(setUnread);
  }, []);

  // Load DMs when switching friend
  useEffect(() => {
    if (!activeDM) return;
    chatApi.getDMs(activeDM.id).then((msgs) => {
      setDmMsgs(msgs);
      setUnread((p) => { const n = { ...p }; delete n[activeDM.id]; return n; });
      socket?.emit('dm:read', { senderId: activeDM.id });
    });
  }, [activeDM?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicMsgs.length, dmMsgs.length]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const onOnline = (ids: string[]) => setOnlineIds(ids);
    const onMsg = (msg: Msg) => setPublicMsgs((p) => [...p.slice(-199), msg]);
    const onDeleted = ({ messageId }: { messageId: string }) =>
      setPublicMsgs((p) => p.filter((m) => m.id !== messageId));
    const onDM = (msg: DM) => {
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
    };
    const onFriendReq = () => {
      qc.invalidateQueries({ queryKey: ['chat-requests'] });
    };
    const onFriendAccepted = () => {
      qc.invalidateQueries({ queryKey: ['chat-friends'] });
      qc.invalidateQueries({ queryKey: ['chat-requests'] });
    };
    const onError = ({ message }: { message: string }) => {
      // Show as a non-blocking toast rather than alert
      console.warn('Socket error:', message);
    };

    socket.on('users:online', onOnline);
    socket.on('chat:message', onMsg);
    socket.on('chat:deleted', onDeleted);
    socket.on('dm:message', onDM);
    socket.on('friend:request', onFriendReq);
    socket.on('friend:accepted', onFriendAccepted);
    socket.on('friend:sent', onFriendAccepted);
    socket.on('error', onError);

    return () => {
      socket.off('users:online', onOnline);
      socket.off('chat:message', onMsg);
      socket.off('chat:deleted', onDeleted);
      socket.off('dm:message', onDM);
      socket.off('friend:request', onFriendReq);
      socket.off('friend:accepted', onFriendAccepted);
      socket.off('friend:sent', onFriendAccepted);
      socket.off('error', onError);
    };
  }, [socket, user?.id, qc]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    if (!socket || !connected) return;
    if (tab === 'public') {
      socket.emit('chat:send', input.trim());
    } else if (tab === 'dm' && activeDM) {
      socket.emit('dm:send', { receiverId: activeDM.id, content: input.trim() });
    }
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, socket, connected, tab, activeDM]);

  function sendFriendRequest(addresseeId: string) {
    socket?.emit('friend:request', { addresseeId });
    setSentRequestIds((p) => [...p, addresseeId]);
  }

  function acceptRequest(friendshipId: string) {
    socket?.emit('friend:accept', { friendshipId });
    qc.invalidateQueries({ queryKey: ['chat-requests'] });
    qc.invalidateQueries({ queryKey: ['chat-friends'] });
  }

  function rejectRequest(friendshipId: string) {
    socket?.emit('friend:reject', { friendshipId });
    qc.invalidateQueries({ queryKey: ['chat-requests'] });
  }

  function deleteMsg(messageId: string) {
    socket?.emit('admin:delete_msg', { messageId });
  }

  function doBan(reason: string, minutes?: number) {
    if (!banTarget) return;
    socket?.emit('admin:ban', { targetId: banTarget.id, reason, durationMinutes: minutes });
    setTimeout(() => refetchBans(), 500);
  }

  function openPopup(e: React.MouseEvent, u: { id: string; name: string }) {
    if (u.id === user?.id) return;
    e.stopPropagation();
    setPopup({ user: u, pos: { x: e.clientX, y: e.clientY } });
  }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ── Sidebar ── */
  const sidebarEl = (
    <div className="w-52 shrink-0 flex flex-col gap-3 h-full overflow-y-auto">
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-yellow-500 animate-pulse'}`} />
        <span className="text-xs text-gray-500">{connected ? `${onlineIds.length} çevrimiçi` : 'Bağlanıyor...'}</span>
      </div>

      {/* Pending requests */}
      {(requests as PendingReq[]).length > 0 && (
        <div className="card p-3">
          <p className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-1">
            <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
              style={{ background: '#f97316' }}>{(requests as PendingReq[]).length}</span>
            Arkadaşlık İstekleri
          </p>
          <div className="space-y-2">
            {(requests as PendingReq[]).map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <Avatar name={r.requester_name} size={7} />
                <span className="text-xs text-gray-300 flex-1 truncate">{r.requester_name}</span>
                <button onClick={() => acceptRequest(r.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-green-400 hover:text-white transition-all shrink-0"
                  style={{ background: 'rgba(34,197,94,0.15)' }} title="Kabul et">✓</button>
                <button onClick={() => rejectRequest(r.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:text-white transition-all shrink-0"
                  style={{ background: 'rgba(239,68,68,0.15)' }} title="Reddet">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="card p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Arkadaşlar ({(friends as Friend[]).length})</p>
        {(friends as Friend[]).length === 0 && <p className="text-xs text-gray-600">Henüz arkadaşın yok</p>}
        <div className="space-y-0.5">
          {(friends as Friend[]).map((f) => {
            const isOnline = onlineIds.includes(f.otherUser.id);
            const dmUnread = unread[f.otherUser.id] ?? 0;
            return (
              <button key={f.id} onClick={() => { setActiveDM(f.otherUser); setTab('dm'); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left transition-all hover:bg-white/[0.04]"
                style={activeDM?.id === f.otherUser.id && tab === 'dm' ? { background: 'rgba(249,115,22,0.1)' } : {}}>
                <div className="relative">
                  <Avatar name={f.otherUser.name} size={7} />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`}
                    style={{ borderColor: '#080c14' }} />
                </div>
                <span className="text-xs text-gray-300 flex-1 truncate">{f.otherUser.name}</span>
                {dmUnread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: '#f97316' }}>{dmUnread > 9 ? '9+' : dmUnread}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User search */}
      <div className="card p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Kullanıcı Bul</p>
        <input
          className="input text-xs py-1.5 w-full mb-2"
          placeholder="İsim ara..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {(searchResults as { id: string; name: string }[]).map((u) => {
            const alreadyFriend = (friends as Friend[]).some((f) => f.otherUser.id === u.id);
            const pending = sentRequestIds.includes(u.id) ||
              (requests as PendingReq[]).some((r) => r.requester_id === u.id);
            return (
              <div key={u.id} className="flex items-center gap-2">
                <Avatar name={u.name} size={6} />
                <span className="text-xs text-gray-300 flex-1 truncate">{u.name}</span>
                {alreadyFriend ? (
                  <span className="text-[10px] text-green-500 shrink-0">✓</span>
                ) : pending ? (
                  <span className="text-[10px] text-gray-500 shrink-0">bekliyor</span>
                ) : (
                  <button onClick={() => sendFriendRequest(u.id)}
                    className="text-[10px] px-2 py-0.5 rounded-lg text-orange-400 hover:text-white transition-all shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)' }}>+ Ekle</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ── Messages ── */
  const messagesEl = (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
      {tab === 'public' && publicMsgs.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-600 text-sm">Henüz mesaj yok · İlk sen yaz!</div>
      )}
      {tab === 'dm' && !activeDM && (
        <div className="flex items-center justify-center h-full text-gray-600 text-sm">Sol panelden bir arkadaş seç</div>
      )}
      {tab === 'dm' && activeDM && dmMsgs.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-600 text-sm">{activeDM.name} ile henüz mesajlaşmadın</div>
      )}

      {tab === 'public' && (publicMsgs as Msg[]).map((msg) => {
        const isMe = msg.userId === user?.id;
        return (
          <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
            {!isMe && (
              <button onClick={(e) => openPopup(e, { id: msg.userId!, name: msg.userName })} className="shrink-0 mt-1">
                <Avatar name={msg.userName} size={8} />
              </button>
            )}
            <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <button onClick={(e) => openPopup(e, { id: msg.userId!, name: msg.userName })}
                  className="text-[11px] text-gray-500 mb-0.5 px-1 hover:text-orange-400 transition-colors text-left">
                  {msg.userName}
                </button>
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
              {/* Admin actions — always visible as small icons */}
              {isAdmin && !isMe && msg.userId && (
                <div className="flex items-center gap-1 mt-1 px-1">
                  <button onClick={() => deleteMsg(msg.id)} title="Mesajı sil"
                    className="text-[10px] px-1.5 py-0.5 rounded-lg text-red-400 hover:text-white transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    🗑 Sil
                  </button>
                  <button onClick={() => setBanTarget({ id: msg.userId!, name: msg.userName })} title="Engelle"
                    className="text-[10px] px-1.5 py-0.5 rounded-lg text-orange-400 hover:text-white transition-all"
                    style={{ background: 'rgba(249,115,22,0.1)' }}>
                    🚫 Engelle
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {tab === 'dm' && activeDM && (dmMsgs as DM[]).map((msg) => {
        const isMe = msg.senderId === user?.id;
        return (
          <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
            {!isMe && <Avatar name={activeDM.name} size={8} />}
            <div className={`max-w-[72%] flex items-end gap-1.5`}>
              <div className="px-3 py-2 rounded-2xl text-sm"
                style={isMe
                  ? { background: 'rgba(249,115,22,0.2)', color: '#fed7aa', borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: 4 }}>
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-700 mb-1 shrink-0">{timeStr(msg.createdAt)}</span>
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
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Aktif Engellemeler ({(bans as Ban[]).length})</h3>
        {(bans as Ban[]).length === 0 && <p className="text-xs text-gray-600">Aktif engelleme yok</p>}
        <div className="space-y-2">
          {(bans as Ban[]).map((ban) => (
            <div key={ban.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">{ban.user_name}</p>
                {ban.reason && <p className="text-xs text-gray-500 mt-0.5">{ban.reason}</p>}
                <p className="text-xs text-gray-600 mt-0.5">
                  {ban.expires_at ? `Bitiş: ${format(new Date(ban.expires_at), 'd MMM HH:mm', { locale: tr })}` : 'Kalıcı'}
                </p>
              </div>
              <button onClick={() => { chatApi.unban(ban.id).then(() => refetchBans()); }}
                className="text-xs px-2.5 py-1.5 rounded-lg text-green-400 hover:text-white transition-all shrink-0"
                style={{ background: 'rgba(34,197,94,0.1)' }}>Kaldır</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Yasaklı Kelimeler</h3>
        <div className="flex gap-2 mb-3">
          <input className="input text-sm flex-1" placeholder="Yeni kelime..."
            value={newWord} onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newWord.trim()) { chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); } }} />
          <button onClick={() => { if (newWord.trim()) chatApi.addBannedWord(newWord.trim()).then(() => { setNewWord(''); refetchWords(); }); }}
            className="px-3 rounded-xl text-sm font-medium text-white" style={{ background: 'rgba(249,115,22,0.2)' }}>Ekle</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(bannedWords as Word[]).map((w) => (
            <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-300">{w.word}</span>
              <button onClick={() => chatApi.removeBannedWord(w.id).then(() => refetchWords())}
                className="text-red-600 hover:text-red-300 leading-none">✕</button>
            </div>
          ))}
          {(bannedWords as Word[]).length === 0 && <p className="text-xs text-gray-600">Henüz yasaklı kelime yok</p>}
        </div>
      </div>
    </div>
  );

  /* ── render ── */
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)', maxHeight: 760 }}>
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} onBan={doBan} />}
      {popup && (
        <UserPopup
          user={popup.user}
          pos={popup.pos}
          meId={user?.id ?? ''}
          friends={friends as Friend[]}
          sentIds={sentRequestIds}
          onRequest={sendFriendRequest}
          onClose={() => setPopup(null)}
        />
      )}

      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Sohbet</h1>
          <p className="text-xs text-gray-500">FitTrack Topluluğu</p>
        </div>
        <div className="flex gap-1">
          {[
            { key: 'public', label: 'Genel', color: '#f97316' },
            { key: 'dm', label: `DM${totalUnread > 0 ? ` (${totalUnread})` : ''}`, color: '#60a5fa' },
            ...(isAdmin ? [{ key: 'admin', label: '🛡 Admin', color: '#f87171' }] : []),
          ].map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key as 'public' | 'dm' | 'admin'); }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={tab === t.key
                ? { background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-4 flex-1 min-h-0">
        {tab !== 'admin' && sidebarEl}

        <div className="flex-1 flex flex-col card overflow-hidden min-w-0">
          {/* Chat header */}
          <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {tab === 'public' && (
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="text-sm font-semibold text-white">Genel Sohbet</span>
                <span className="text-xs text-gray-600 ml-auto">{onlineIds.length} çevrimiçi</span>
              </div>
            )}
            {tab === 'dm' && activeDM && (
              <div className="flex items-center gap-2.5">
                <Avatar name={activeDM.name} size={8} />
                <div>
                  <p className="text-sm font-semibold text-white">{activeDM.name}</p>
                  <p className="text-xs" style={{ color: onlineIds.includes(activeDM.id) ? '#4ade80' : '#6b7280' }}>
                    {onlineIds.includes(activeDM.id) ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </p>
                </div>
              </div>
            )}
            {tab === 'dm' && !activeDM && <span className="text-sm text-gray-500">Özel Mesajlar</span>}
            {tab === 'admin' && <span className="text-sm font-semibold text-red-400">🛡️ Admin Paneli</span>}
          </div>

          {/* Messages or admin */}
          {tab === 'admin' ? adminEl : messagesEl}

          {/* Input */}
          {tab !== 'admin' && (tab === 'public' || (tab === 'dm' && activeDM)) && (
            <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {!connected && (
                <p className="text-xs text-yellow-500 mb-2 text-center">Bağlanıyor... lütfen bekleyin</p>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  className="input flex-1 text-sm"
                  placeholder={connected ? 'Mesaj yaz... (Enter ile gönder)' : 'Bağlanılıyor...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  maxLength={500}
                  disabled={!connected}
                />
                <button onClick={sendMessage} disabled={!input.trim() || !connected}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
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
    </div>
  );
}
