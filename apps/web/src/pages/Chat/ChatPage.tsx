import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/* ────────── types ────────── */
interface Msg { id: string; userId: string | null; userName: string; userInitials: string; content: string; createdAt: string; }
interface DM { id: string; senderId: string | null; receiverId: string; senderName: string; content: string; isRead: boolean; createdAt: string; }
interface Friend { id: string; otherUser: { id: string; name: string }; }
interface PendingReq { id: string; requester_id: string; requester_name: string; createdAt: string; }
interface Ban { id: string; user_id: string; user_name: string; reason: string; expires_at: string | null; }
interface Word { id: string; word: string; }

/* ────────── helpers ────────── */
function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
function timeStr(iso: string) {
  return format(new Date(iso), 'HH:mm', { locale: tr });
}
function avatarColor(name: string) {
  const colors = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6','#f59e0b'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

/* ────────── Avatar ────────── */
function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const color = avatarColor(name);
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}
      style={{ background: color + '40', border: `1px solid ${color}60`, color }}>
      {initials(name)}
    </div>
  );
}

/* ────────── BanModal ────────── */
function BanModal({ user, onClose, onBan }: { user: { id: string; name: string }; onClose: () => void; onBan: (reason: string, minutes?: number) => void }) {
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'perm' | 'temp'>('temp');
  const [minutes, setMinutes] = useState('60');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-5" style={{ background: '#0c1420', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-base font-semibold text-white mb-1">Kullanıcıyı Engelle</h3>
        <p className="text-xs text-gray-500 mb-4">{user.name}</p>
        <div className="flex gap-2 mb-3">
          {(['temp','perm'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
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
                style={minutes === String(m) ? { background: '#ef444420', color: '#ef4444' } : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                {m < 60 ? `${m}dk` : m < 1440 ? `${m/60}sa` : m < 10080 ? `${m/1440}g` : `${m/10080}h`}
              </button>
            ))}
          </div>
        )}
        <input className="input text-sm w-full mb-3" placeholder="Sebep (isteğe bağlı)" value={reason}
          onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)' }}>İptal</button>
          <button onClick={() => { onBan(reason, type === 'temp' ? parseInt(minutes) : undefined); onClose(); }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: '#ef4444' }}>Engelle</button>
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
  const [userSearch, setUserSearch] = useState('');
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [newWord, setNewWord] = useState('');
  const [unread, setUnread] = useState<Record<string, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: isAdminData } = useQuery({ queryKey: ['chat-me'], queryFn: chatApi.getMe, staleTime: 60_000 });
  const isAdmin = isAdminData?.isAdmin ?? false;

  const { data: friends = [] } = useQuery<Friend[]>({ queryKey: ['chat-friends'], queryFn: chatApi.getFriends, staleTime: 30_000 });
  const { data: requests = [] } = useQuery<PendingReq[]>({ queryKey: ['chat-requests'], queryFn: chatApi.getRequests });
  const { data: searchResults = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['chat-users', userSearch],
    queryFn: () => chatApi.searchUsers(userSearch),
    enabled: userSearch.length >= 1,
    staleTime: 30_000,
  });
  const { data: bans = [], refetch: refetchBans } = useQuery<Ban[]>({ queryKey: ['chat-bans'], queryFn: chatApi.getBans, enabled: isAdmin });
  const { data: bannedWords = [], refetch: refetchWords } = useQuery<Word[]>({ queryKey: ['chat-words'], queryFn: chatApi.getBannedWords, enabled: isAdmin });

  const addWordMutation = useMutation({
    mutationFn: chatApi.addBannedWord,
    onSuccess: () => { setNewWord(''); refetchWords(); },
  });
  const removeWordMutation = useMutation({ mutationFn: chatApi.removeBannedWord, onSuccess: () => refetchWords() });
  const unbanMutation = useMutation({ mutationFn: chatApi.unban, onSuccess: () => refetchBans() });

  // Load initial messages
  useEffect(() => {
    chatApi.getMessages().then((msgs) => setPublicMsgs(msgs));
    chatApi.getUnread().then((counts) => setUnread(counts));
  }, []);

  // Load DMs when switching friend
  useEffect(() => {
    if (!activeDM) return;
    chatApi.getDMs(activeDM.id).then((msgs) => {
      setDmMsgs(msgs);
      setUnread((p) => { const n = { ...p }; delete n[activeDM.id]; return n; });
      socket?.emit('dm:read', { senderId: activeDM.id });
    });
  }, [activeDM, socket]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicMsgs, dmMsgs, tab]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('users:online', (ids: string[]) => setOnlineIds(ids));
    socket.on('chat:message', (msg: Msg) => setPublicMsgs((p) => [...p.slice(-199), msg]));
    socket.on('chat:deleted', ({ messageId }: { messageId: string }) =>
      setPublicMsgs((p) => p.filter((m) => m.id !== messageId))
    );
    socket.on('dm:message', (msg: DM) => {
      const otherId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
      if (activeDM?.id === otherId || activeDM?.id === msg.senderId) {
        setDmMsgs((p) => [...p, msg]);
        socket.emit('dm:read', { senderId: msg.senderId });
      } else {
        setUnread((p) => ({ ...p, [otherId ?? '']: (p[otherId ?? ''] ?? 0) + 1 }));
      }
    });
    socket.on('friend:request', () => qc.invalidateQueries({ queryKey: ['chat-requests'] }));
    socket.on('friend:accepted', () => qc.invalidateQueries({ queryKey: ['chat-friends'] }));
    socket.on('friend:sent', () => qc.invalidateQueries({ queryKey: ['chat-requests'] }));
    socket.on('error', ({ message }: { message: string }) => alert(message));

    return () => {
      socket.off('users:online');
      socket.off('chat:message');
      socket.off('chat:deleted');
      socket.off('dm:message');
      socket.off('friend:request');
      socket.off('friend:accepted');
      socket.off('friend:sent');
      socket.off('error');
    };
  }, [socket, activeDM, user?.id, qc]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket) return;
    if (tab === 'public') {
      socket.emit('chat:send', input.trim());
    } else if (tab === 'dm' && activeDM) {
      socket.emit('dm:send', { receiverId: activeDM.id, content: input.trim() });
    }
    setInput('');
    inputRef.current?.focus();
  }, [input, socket, tab, activeDM]);

  function sendFriendRequest(addresseeId: string) {
    socket?.emit('friend:request', { addresseeId });
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
    refetchBans();
  }

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ────── sidebar panel ────── */
  const Sidebar = () => (
    <div className="w-56 shrink-0 flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* Connection dot */}
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-600'}`} />
        <span className="text-xs text-gray-500">{connected ? 'Bağlı' : 'Bağlanıyor...'}</span>
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="card p-3">
          <p className="text-xs font-semibold text-orange-400 mb-2">İstekler ({requests.length})</p>
          <div className="space-y-2">
            {(requests as PendingReq[]).map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <Avatar name={r.requester_name} size={7} />
                <span className="text-xs text-gray-300 flex-1 truncate">{r.requester_name}</span>
                <button onClick={() => acceptRequest(r.id)} className="text-green-400 hover:text-green-300 text-xs font-bold">✓</button>
                <button onClick={() => rejectRequest(r.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends */}
      <div className="card p-3 flex-1">
        <p className="text-xs font-semibold text-gray-400 mb-2">Arkadaşlar ({friends.length})</p>
        {friends.length === 0 && <p className="text-xs text-gray-600">Henüz arkadaşın yok</p>}
        <div className="space-y-1">
          {(friends as Friend[]).map((f) => {
            const isOnline = onlineIds.includes(f.otherUser.id);
            const dmUnread = unread[f.otherUser.id] ?? 0;
            return (
              <button key={f.id} onClick={() => { setActiveDM(f.otherUser); setTab('dm'); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left transition-all hover:bg-white/[0.04]"
                style={activeDM?.id === f.otherUser.id ? { background: 'rgba(249,115,22,0.1)' } : {}}>
                <div className="relative">
                  <Avatar name={f.otherUser.name} size={7} />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`}
                    style={{ borderColor: '#0c1420' }} />
                </div>
                <span className="text-xs text-gray-300 flex-1 truncate">{f.otherUser.name}</span>
                {dmUnread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#f97316' }}>
                    {dmUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User search */}
      <div className="card p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Kullanıcı Bul</p>
        <input className="input text-xs py-1.5 w-full mb-2" placeholder="İsim ara..."
          value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {(searchResults as { id: string; name: string }[]).map((u) => {
            const alreadyFriend = (friends as Friend[]).some((f) => f.otherUser.id === u.id);
            const pendingSent = (requests as PendingReq[]).some((r) => r.requester_id === u.id);
            return (
              <div key={u.id} className="flex items-center gap-2">
                <Avatar name={u.name} size={6} />
                <span className="text-xs text-gray-300 flex-1 truncate">{u.name}</span>
                {alreadyFriend ? (
                  <span className="text-[10px] text-green-500">✓</span>
                ) : pendingSent ? (
                  <span className="text-[10px] text-gray-500">bekliyor</span>
                ) : (
                  <button onClick={() => sendFriendRequest(u.id)}
                    className="text-[10px] px-2 py-0.5 rounded-lg text-orange-400 hover:text-white transition-all"
                    style={{ background: 'rgba(249,115,22,0.1)' }}>+ Ekle</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ────── message list ────── */
  const MessageList = () => {
    const msgs = tab === 'public' ? publicMsgs : dmMsgs;
    if (msgs.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          {tab === 'public' ? 'Henüz mesaj yok · İlk sen yaz!' : activeDM ? `${activeDM.name} ile henüz mesajlaşmadın` : 'Bir arkadaş seç'}
        </div>
      );
    }
    return (
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {tab === 'public' ? (publicMsgs as Msg[]).map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <Avatar name={msg.userName} size={8} />}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && <span className="text-[11px] text-gray-500 mb-0.5 px-1">{msg.userName}</span>}
                <div className="relative flex items-end gap-1.5">
                  <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                    style={isMe
                      ? { background: 'rgba(249,115,22,0.2)', color: '#fed7aa', borderBottomRightRadius: 4 }
                      : { background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderBottomLeftRadius: 4 }}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-700 shrink-0 mb-1">{timeStr(msg.createdAt)}</span>
                  {isAdmin && !isMe && (
                    <div className="absolute -top-6 right-0 hidden group-hover:flex items-center gap-1 z-10">
                      <button onClick={() => deleteMsg(msg.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded-lg text-red-400 hover:text-white"
                        style={{ background: 'rgba(239,68,68,0.15)' }}>Sil</button>
                      {msg.userId && (
                        <button onClick={() => setBanTarget({ id: msg.userId!, name: msg.userName })}
                          className="text-[10px] px-1.5 py-0.5 rounded-lg text-orange-400 hover:text-white"
                          style={{ background: 'rgba(249,115,22,0.15)' }}>Engelle</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (dmMsgs as DM[]).map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && activeDM && <Avatar name={activeDM.name} size={8} />}
              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-1.5">
                  <div className="px-3 py-2 rounded-2xl text-sm"
                    style={isMe
                      ? { background: 'rgba(249,115,22,0.2)', color: '#fed7aa', borderBottomRightRadius: 4 }
                      : { background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderBottomLeftRadius: 4 }}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-700 mb-1">{timeStr(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    );
  };

  /* ────── admin panel ────── */
  const AdminPanel = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {/* Active bans */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Aktif Engellemeler ({bans.length})</h3>
        {bans.length === 0 && <p className="text-xs text-gray-600">Aktif engelleme yok</p>}
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
              <button onClick={() => unbanMutation.mutate(ban.id)}
                className="text-xs px-2.5 py-1.5 rounded-lg text-green-400 hover:text-white transition-all"
                style={{ background: 'rgba(34,197,94,0.1)' }}>Kaldır</button>
            </div>
          ))}
        </div>
      </div>

      {/* Banned words */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Yasaklı Kelimeler</h3>
        <div className="flex gap-2 mb-3">
          <input className="input text-sm flex-1" placeholder="Yeni kelime ekle..."
            value={newWord} onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newWord.trim() && addWordMutation.mutate(newWord.trim())} />
          <button onClick={() => newWord.trim() && addWordMutation.mutate(newWord.trim())}
            className="px-3 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'rgba(249,115,22,0.2)' }}>Ekle</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(bannedWords as Word[]).map((w) => (
            <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-300">{w.word}</span>
              <button onClick={() => removeWordMutation.mutate(w.id)} className="text-red-600 hover:text-red-300">✕</button>
            </div>
          ))}
          {(bannedWords as Word[]).length === 0 && <p className="text-xs text-gray-600">Henüz yasaklı kelime yok</p>}
        </div>
      </div>
    </div>
  );

  /* ────── render ────── */
  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] flex flex-col" style={{ maxHeight: 720 }}>
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} onBan={doBan} />}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sohbet</h1>
          <p className="text-sm text-gray-500">FitTrack topluluğu</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          <button onClick={() => setTab('public')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={tab === 'public' ? { background: 'rgba(249,115,22,0.15)', color: '#f97316' }
              : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
            Genel
          </button>
          <button onClick={() => { setTab('dm'); if (!activeDM && friends.length > 0) setActiveDM((friends as Friend[])[0]?.otherUser ?? null); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all relative"
            style={tab === 'dm' ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
              : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
            Özel Mesaj
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ background: '#f97316' }}>{totalUnread > 9 ? '9+' : totalUnread}</span>
            )}
          </button>
          {isAdmin && (
            <button onClick={() => setTab('admin')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={tab === 'admin' ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
              Admin
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        {tab !== 'admin' && <Sidebar />}

        {/* Chat area */}
        <div className="flex-1 flex flex-col card overflow-hidden min-w-0">
          {/* Chat header */}
          {tab === 'public' && (
            <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="text-sm font-semibold text-white">Genel Sohbet</span>
                <span className="text-xs text-gray-600 ml-auto">{onlineIds.length} çevrimiçi</span>
              </div>
            </div>
          )}
          {tab === 'dm' && activeDM && (
            <div className="px-4 py-3 border-b shrink-0 flex items-center gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Avatar name={activeDM.name} size={8} />
              <div>
                <p className="text-sm font-semibold text-white">{activeDM.name}</p>
                <p className="text-xs text-gray-600">{onlineIds.includes(activeDM.id) ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
              </div>
            </div>
          )}
          {tab === 'admin' && (
            <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-semibold text-red-400">🛡️ Admin Paneli</span>
            </div>
          )}

          {/* Content */}
          {tab === 'admin' ? <AdminPanel /> : <MessageList />}

          {/* Input */}
          {tab !== 'admin' && (tab === 'public' || activeDM) && (
            <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2">
                <input ref={inputRef} className="input flex-1 text-sm" placeholder="Mesaj yaz..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  maxLength={500}
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
          {tab === 'dm' && !activeDM && (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              Arkadaş listesinden birini seç
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
