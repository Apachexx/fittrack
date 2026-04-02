import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supplementsApi, type Supplement, type UserSupplement, type DailyLog } from '@/api/supplements.api';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_CFG = {
  vitamin:  { label: 'Vitaminler',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '🌟' },
  mineral:  { label: 'Mineraller',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: '💎' },
  sports:   { label: 'Sporcu Takviyeleri', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '💪' },
  health:   { label: 'Sağlık & Wellness', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', icon: '🍃' },
} as const;

type TabType = 'browse' | 'my' | 'today';

// ── Time formatting ────────────────────────────────────────────────────────────
function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

// ── SupplementCard (browse) ────────────────────────────────────────────────────
function SupplementCard({
  supplement,
  isInStack,
  onAdd,
  onRemove,
}: {
  supplement: Supplement;
  isInStack: boolean;
  onAdd: (s: Supplement) => void;
  onRemove: (s: Supplement) => void;
}) {
  const cfg = CATEGORY_CFG[supplement.category];
  return (
    <div
      className="card p-4 flex flex-col gap-2 relative"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">{supplement.name_tr}</p>
          <p className="text-[11px] text-gray-500 leading-snug">{supplement.name}</p>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {supplement.description && (
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{supplement.description}</p>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
            📦 {supplement.default_dose}
          </span>
          {supplement.timing && (
            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
              ⏰ {supplement.timing}
            </span>
          )}
        </div>
        <button
          onClick={() => isInStack ? onRemove(supplement) : onAdd(supplement)}
          className="text-xs px-3 py-1 rounded-lg font-medium transition-all"
          style={isInStack
            ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
            : { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }
          }
        >
          {isInStack ? '− Çıkar' : '+ Ekle'}
        </button>
      </div>
    </div>
  );
}

// ── TimePickerModal ───────────────────────────────────────────────────────────
function TimePickerModal({
  supplement,
  current,
  onSave,
  onClose,
}: {
  supplement: UserSupplement;
  current: string | null;
  onSave: (id: string, time: string | null) => void;
  onClose: () => void;
}) {
  const [time, setTime] = useState(current ?? '');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-xs p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white">Saat Ayarla</h3>
        <p className="text-sm text-gray-400">{supplement.name_tr} için hatırlatma saati</p>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-white text-sm"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <div className="flex gap-2">
          {time && (
            <button
              onClick={() => { onSave(supplement.id, null); onClose(); }}
              className="flex-1 py-2 rounded-lg text-sm text-gray-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Saati Kaldır
            </button>
          )}
          <button
            onClick={() => { onSave(supplement.id, time || null); onClose(); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' }}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Today tab ─────────────────────────────────────────────────────────────────
function TodayTab({ today }: { today: string }) {
  const qc = useQueryClient();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['supplement-logs', today],
    queryFn: () => supplementsApi.getLogs(today),
  });

  const takeMutation = useMutation({
    mutationFn: ({ id, taken }: { id: string; taken: boolean }) =>
      taken
        ? supplementsApi.unmarkTaken(id, today)
        : supplementsApi.markTaken(id, today),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplement-logs', today] }),
  });

  const taken = logs.filter((l) => l.log_id).length;
  const total = logs.length;

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="text-4xl">💊</span>
        <p className="text-gray-400 text-sm">Bugün için supplement listeniz boş.</p>
        <p className="text-gray-600 text-xs">Listeme sekmesinden supplement ekleyin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress header */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Bugünkü İlerleme</p>
          <span className="text-sm font-bold" style={{ color: taken === total ? '#22c55e' : '#fb923c' }}>
            {taken} / {total}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${total > 0 ? (taken / total) * 100 : 0}%`,
              background: taken === total ? '#22c55e' : 'linear-gradient(90deg, #f97316, #ef4444)',
            }}
          />
        </div>
        {taken === total && total > 0 && (
          <p className="text-xs text-green-400 mt-2 text-center font-medium">🎉 Tüm supplementler alındı!</p>
        )}
      </div>

      {/* Log items */}
      <div className="flex flex-col gap-2">
        {logs.map((log) => {
          const isTaken = !!log.log_id;
          const cfg = CATEGORY_CFG[log.category as keyof typeof CATEGORY_CFG] ?? CATEGORY_CFG.health;
          return (
            <button
              key={log.user_supplement_id}
              onClick={() => takeMutation.mutate({ id: log.user_supplement_id, taken: isTaken })}
              disabled={takeMutation.isPending}
              className="card p-4 flex items-center gap-3 text-left w-full transition-all hover:scale-[1.01]"
              style={isTaken ? { borderLeft: '3px solid #22c55e', opacity: 0.8 } : { borderLeft: `3px solid ${cfg.color}` }}
            >
              {/* Check circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={isTaken
                  ? { background: 'rgba(34,197,94,0.2)', border: '2px solid #22c55e' }
                  : { background: 'rgba(255,255,255,0.04)', border: `2px solid ${cfg.color}40` }
                }
              >
                {isTaken && (
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="#22c55e" strokeWidth={2.5}>
                    <polyline points="3 8 6.5 11.5 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${isTaken ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {log.name_tr}
                </p>
                <p className="text-[11px] text-gray-600">
                  {log.dose ?? log.default_dose}
                  {log.schedule_time && ` · ${formatTime(log.schedule_time)}`}
                </p>
              </div>

              {isTaken ? (
                <span className="text-[10px] text-green-400 shrink-0">Alındı ✓</span>
              ) : (
                <span className="text-[10px] shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── My Stack tab ──────────────────────────────────────────────────────────────
function MyStackTab() {
  const qc = useQueryClient();
  const [editingTime, setEditingTime] = useState<UserSupplement | null>(null);

  const { data: mySupplements = [], isLoading } = useQuery({
    queryKey: ['my-supplements'],
    queryFn: supplementsApi.getMy,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, scheduleTime }: { id: string; scheduleTime: string | null }) =>
      supplementsApi.update(id, { scheduleTime }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-supplements'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => supplementsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-supplements'] });
      qc.invalidateQueries({ queryKey: ['supplement-logs'] });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (mySupplements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="text-4xl">📋</span>
        <p className="text-gray-400 text-sm">Supplement listeniz boş.</p>
        <p className="text-gray-600 text-xs">Keşfet sekmesinden supplement ekleyin.</p>
      </div>
    );
  }

  const grouped = mySupplements.reduce((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, UserSupplement[]>);

  return (
    <>
      {editingTime && (
        <TimePickerModal
          supplement={editingTime}
          current={editingTime.schedule_time}
          onSave={(id, time) => updateMutation.mutate({ id, scheduleTime: time })}
          onClose={() => setEditingTime(null)}
        />
      )}
      <div className="flex flex-col gap-4">
        {Object.entries(grouped).map(([cat, items]) => {
          const cfg = CATEGORY_CFG[cat as keyof typeof CATEGORY_CFG] ?? CATEGORY_CFG.health;
          return (
            <div key={cat}>
              <p className="text-xs font-semibold mb-2" style={{ color: cfg.color }}>
                {cfg.icon} {cfg.label}
              </p>
              <div className="flex flex-col gap-2">
                {items.map((s) => (
                  <div key={s.id} className="card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white leading-snug">{s.name_tr}</p>
                      <p className="text-[11px] text-gray-500">{s.dose ?? s.default_dose}</p>
                    </div>

                    <button
                      onClick={() => setEditingTime(s)}
                      className="text-[11px] px-2.5 py-1 rounded-lg transition-all shrink-0"
                      style={s.schedule_time
                        ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      ⏰ {formatTime(s.schedule_time) ?? 'Saat ekle'}
                    </button>

                    <button
                      onClick={() => removeMutation.mutate(s.id)}
                      disabled={removeMutation.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 transition-all shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="3 4 13 4" strokeLinecap="round" />
                        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                        <path d="M6 7v5M10 7v5" strokeLinecap="round" />
                        <path d="M4 4l.8 9a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9L12 4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Browse tab ────────────────────────────────────────────────────────────────
function BrowseTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');

  const { data: supplements = [], isLoading } = useQuery({
    queryKey: ['supplements', category],
    queryFn: () => supplementsApi.list(category || undefined),
    staleTime: 1000 * 60 * 60,
  });

  const { data: mySupplements = [] } = useQuery({
    queryKey: ['my-supplements'],
    queryFn: supplementsApi.getMy,
  });

  const myIds = new Set(mySupplements.map((s) => s.supplement_id));

  const addMutation = useMutation({
    mutationFn: (s: Supplement) => supplementsApi.add(s.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-supplements'] });
      qc.invalidateQueries({ queryKey: ['supplement-logs'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (s: Supplement) => {
      const us = mySupplements.find((ms) => ms.supplement_id === s.id);
      return us ? supplementsApi.remove(us.id) : Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-supplements'] });
      qc.invalidateQueries({ queryKey: ['supplement-logs'] });
    },
  });

  const filtered = supplements.filter((s) =>
    search === '' ||
    s.name_tr.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Supplement ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[{ key: '', label: 'Tümü', icon: '🔍' }, ...Object.entries(CATEGORY_CFG).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))].map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className="text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all shrink-0"
            style={category === c.key
              ? { background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">Sonuç bulunamadı</p>
          ) : (
            filtered.map((s) => (
              <SupplementCard
                key={s.id}
                supplement={s}
                isInStack={myIds.has(s.id)}
                onAdd={(sup) => addMutation.mutate(sup)}
                onRemove={(sup) => removeMutation.mutate(sup)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SupplementsPage() {
  const [tab, setTab] = useState<TabType>('today');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'd MMMM', { locale: tr });
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  const { data: logs = [] } = useQuery({
    queryKey: ['supplement-logs', today],
    queryFn: () => supplementsApi.getLogs(today),
  });

  const taken = logs.filter((l) => l.log_id).length;
  const total = logs.length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Supplement Takibi</h1>
          <p className="text-xs text-gray-500 mt-0.5">{todayLabel}</p>
        </div>
        {/* Push notification toggle */}
        {isSupported && (
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            title={isSubscribed ? 'Bildirimleri kapat' : 'Bildirimleri aç'}
            style={isSubscribed
              ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {isSubscribed ? '🔔 Bildirim Açık' : '🔕 Bildirim Kapalı'}
          </button>
        )}
      </div>

      {/* Today mini summary card */}
      {total > 0 && tab !== 'today' && (
        <button
          onClick={() => setTab('today')}
          className="card p-3 flex items-center justify-between text-left w-full"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💊</span>
            <span className="text-sm text-gray-300">Bugün <span className="text-white font-semibold">{taken}/{total}</span> alındı</span>
          </div>
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {([
          { key: 'today', label: 'Bugün', icon: '✓' },
          { key: 'my', label: 'Listem', icon: '📋' },
          { key: 'browse', label: 'Keşfet', icon: '🔍' },
        ] as { key: TabType; label: string; icon: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            style={tab === t.key
              ? { background: 'rgba(249,115,22,0.2)', color: '#fb923c' }
              : { color: '#4b5563' }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'today' && <TodayTab today={today} />}
      {tab === 'my' && <MyStackTab />}
      {tab === 'browse' && <BrowseTab />}
    </div>
  );
}
