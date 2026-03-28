import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/hooks/useSettings';
import Select from '@/components/ui/Select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ReferenceLine,
} from 'recharts';
import { progressApi } from '@/api/progress.api';
import { workoutApi } from '@/api/workout.api';
import { programApi } from '@/api/program.api';
import { format, subDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#f97316', back: '#3b82f6', legs: '#22c55e',
  shoulders: '#a855f7', arms: '#ec4899', core: '#eab308', cardio: '#14b8a6',
};
const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Göğüs', back: 'Sırt', legs: 'Bacak',
  shoulders: 'Omuz', arms: 'Kol', core: 'Core', cardio: 'Kardiyo',
};

// Epley 1RM formula
function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

const ONE_RM_PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60];

function HabitCalendar({ workoutDates }: { workoutDates: Array<{ date: string; count: string }> }) {
  const dateSet = new Set(workoutDates.map((d) => d.date.split('T')[0]));
  const today = startOfDay(new Date());
  const WEEKS = 15;
  const DAYS = 7;

  // Build grid: last WEEKS weeks, starting from Monday
  const days: Array<{ date: Date; iso: string }> = [];
  for (let i = (WEEKS * DAYS) - 1; i >= 0; i--) {
    const d = subDays(today, i);
    days.push({ date: d, iso: format(d, 'yyyy-MM-dd') });
  }

  const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div>
      <div className="flex gap-0.5 mb-1 ml-0">
        {dayLabels.map((l) => (
          <div key={l} className="flex-1 text-center text-[9px] text-gray-700">{l}</div>
        ))}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${DAYS}, 1fr)` }}>
        {days.map(({ date, iso }) => {
          const hasWorkout = dateSet.has(iso);
          const isToday = iso === format(today, 'yyyy-MM-dd');
          return (
            <div
              key={iso}
              title={`${format(date, 'd MMM', { locale: tr })}${hasWorkout ? ' — antrenman' : ''}`}
              className="rounded-sm aspect-square"
              style={{
                background: hasWorkout
                  ? 'rgba(249,115,22,0.7)'
                  : 'rgba(255,255,255,0.04)',
                border: isToday ? '1px solid rgba(249,115,22,0.5)' : '1px solid transparent',
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-xs text-gray-700">Az</span>
        <div className="flex gap-0.5">
          {[0.06, 0.2, 0.4, 0.6, 0.85].map((o, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(249,115,22,${o})` }} />
          ))}
        </div>
        <span className="text-xs text-gray-700">Çok</span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const queryClient = useQueryClient();
  const { settings, save: saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'body' | 'strength' | 'muscle' | 'onerm'>('body');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    measuredAt: new Date().toISOString().split('T')[0],
    weightKg: '',
    bodyFat: '',
    chestCm: '',
    waistCm: '',
    hipsCm: '',
  });
  const [selectedExercise, setSelectedExercise] = useState('');
  const [heightInput, setHeightInput] = useState(settings.heightCm > 0 ? String(settings.heightCm) : '');
  const [onermWeight, setOnermWeight] = useState('');
  const [onermReps, setOnermReps] = useState('');

  const { data: measurements } = useQuery({
    queryKey: ['measurements'],
    queryFn: progressApi.getMeasurements,
  });
  const { data: muscleData } = useQuery({
    queryKey: ['muscle-distribution'],
    queryFn: () => progressApi.getMuscleDistribution(),
  });
  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => workoutApi.listExercises(),
  });
  const { data: prHistory } = useQuery({
    queryKey: ['pr-history', selectedExercise],
    queryFn: () => progressApi.getPRHistory(selectedExercise),
    enabled: !!selectedExercise,
  });
  const { data: weeklySummary } = useQuery({
    queryKey: ['weekly-summary'],
    queryFn: () => progressApi.getWeeklySummary(),
  });
  const { data: workoutDates } = useQuery({
    queryKey: ['workout-dates'],
    queryFn: () => workoutApi.getWorkoutDates(),
  });
  const { data: strengthTrend } = useQuery({
    queryKey: ['strength-trend', selectedExercise],
    queryFn: () => programApi.getStrengthTrend(selectedExercise),
    enabled: !!selectedExercise,
  });

  const addMeasurementMutation = useMutation({
    mutationFn: progressApi.addMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      setShowAddForm(false);
      setForm({ measuredAt: new Date().toISOString().split('T')[0], weightKg: '', bodyFat: '', chestCm: '', waistCm: '', hipsCm: '' });
    },
  });

  const latestWeight = measurements?.[0]?.weightKg;
  const prevWeight = measurements?.[1]?.weightKg;
  const weightChange = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  const bmi =
    settings.heightCm > 0 && latestWeight
      ? (latestWeight / Math.pow(settings.heightCm / 100, 2)).toFixed(1)
      : null;

  const bmiInfo = bmi
    ? parseFloat(bmi) < 18.5 ? { label: 'Zayıf',         color: '#3b82f6', range: '< 18.5' }
      : parseFloat(bmi) < 25 ? { label: 'Normal',         color: '#22c55e', range: '18.5–24.9' }
      : parseFloat(bmi) < 30 ? { label: 'Fazla Kilolu',   color: '#f59e0b', range: '25–29.9' }
      : { label: 'Obez', color: '#ef4444', range: '≥ 30' }
    : null;

  const weightData = measurements
    ?.filter((m) => m.weightKg)
    .map((m) => ({ date: format(new Date(m.measuredAt), 'd MMM', { locale: tr }), weight: m.weightKg! }))
    .reverse();

  const pieData = (muscleData as Array<{ muscle_group: string; set_count: string }> | undefined)?.map((d) => ({
    name: MUSCLE_LABELS[d.muscle_group] ?? d.muscle_group,
    value: parseInt(d.set_count),
    color: MUSCLE_COLORS[d.muscle_group] ?? '#6b7280',
  }));

  const weeklyData = (weeklySummary as Array<{
    week_start?: string; weekStart?: string;
    total_workouts?: number; totalWorkouts?: number;
    total_volume?: number; totalVolume?: number;
  }> | undefined)?.map((w) => ({
    week: format(new Date(w.week_start ?? w.weekStart ?? ''), 'd MMM', { locale: tr }),
    antrenman: Number(w.total_workouts ?? w.totalWorkouts ?? 0),
    hacim: Math.round(Number(w.total_volume ?? w.totalVolume ?? 0) / 1000),
  })).reverse();

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#0f1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' },
    labelStyle: { color: '#94a3b8' },
  };

  // 1RM calculation
  const oneRMResult = (() => {
    const w = parseFloat(onermWeight);
    const r = parseInt(onermReps);
    if (!w || !r || r < 1) return null;
    return epley1RM(w, r);
  })();

  // Workout streak
  const workoutStreak = (() => {
    if (!workoutDates || workoutDates.length === 0) return 0;
    const dateSet = new Set(workoutDates.map((d) => d.date.split('T')[0]));
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const iso = format(cursor, 'yyyy-MM-dd');
      if (dateSet.has(iso)) {
        streak++;
        cursor = subDays(cursor, 1);
      } else {
        // allow today to be missed (still early in day)
        if (streak === 0 && iso === format(new Date(), 'yyyy-MM-dd')) {
          cursor = subDays(cursor, 1);
          continue;
        }
        break;
      }
    }
    return streak;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-white">İlerleme</h1>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">+ Ölçüm Ekle</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {latestWeight && (
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Son Kilo</p>
            <p className="text-xl font-bold text-white">{latestWeight} kg</p>
            {weightChange && (
              <p className="text-xs mt-1 font-medium"
                style={{ color: parseFloat(weightChange) > 0 ? '#ef4444' : '#22c55e' }}>
                {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
              </p>
            )}
          </div>
        )}
        {bmi && bmiInfo && (
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">BMI</p>
            <p className="text-xl font-bold" style={{ color: bmiInfo.color }}>{bmi}</p>
            <p className="text-xs mt-1" style={{ color: bmiInfo.color }}>{bmiInfo.label}</p>
          </div>
        )}
        {measurements?.[0]?.bodyFat && (
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Yağ Oranı</p>
            <p className="text-xl font-bold text-white">{measurements[0].bodyFat}%</p>
          </div>
        )}
        {workoutStreak > 0 && (
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Seri</p>
            <p className="text-xl font-bold text-orange-400">{workoutStreak} 🔥</p>
            <p className="text-xs text-gray-600 mt-1">gün üst üste</p>
          </div>
        )}
        {!settings.heightCm && (
          <div className="card p-4 col-span-2 flex items-center gap-3"
            style={{ border: '1px dashed rgba(249,115,22,0.2)' }}>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Boy girerek BMI hesapla</p>
              <div className="flex gap-2">
                <input type="number" className="input py-1.5 text-sm" placeholder="175"
                  value={heightInput} onChange={(e) => setHeightInput(e.target.value)} />
                <button
                  onClick={() => { if (heightInput) saveSettings({ heightCm: parseFloat(heightInput) }); }}
                  className="btn-primary py-1.5 px-3 text-xs shrink-0">Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Yeni Ölçüm</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Tarih</label>
              <input type="date" className="input" value={form.measuredAt}
                onChange={(e) => setForm({ ...form, measuredAt: e.target.value })} />
            </div>
            <div>
              <label className="label">Kilo (kg)</label>
              <input type="number" className="input" placeholder="75.5" value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })} step="0.1" />
            </div>
            <div>
              <label className="label">Yağ Oranı (%)</label>
              <input type="number" className="input" placeholder="18.5" value={form.bodyFat}
                onChange={(e) => setForm({ ...form, bodyFat: e.target.value })} step="0.1" />
            </div>
            <div>
              <label className="label">Göğüs (cm)</label>
              <input type="number" className="input" placeholder="95" value={form.chestCm}
                onChange={(e) => setForm({ ...form, chestCm: e.target.value })} step="0.5" />
            </div>
            <div>
              <label className="label">Bel (cm)</label>
              <input type="number" className="input" placeholder="80" value={form.waistCm}
                onChange={(e) => setForm({ ...form, waistCm: e.target.value })} step="0.5" />
            </div>
            <div>
              <label className="label">Kalça (cm)</label>
              <input type="number" className="input" placeholder="95" value={form.hipsCm}
                onChange={(e) => setForm({ ...form, hipsCm: e.target.value })} step="0.5" />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => addMeasurementMutation.mutate({
                measuredAt: form.measuredAt,
                weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
                bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : undefined,
                chestCm: form.chestCm ? parseFloat(form.chestCm) : undefined,
                waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
                hipsCm: form.hipsCm ? parseFloat(form.hipsCm) : undefined,
              } as Parameters<typeof progressApi.addMeasurement>[0])}
              disabled={addMeasurementMutation.isPending}
              className="btn-primary"
            >
              {addMeasurementMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">İptal</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: 'body', label: '⚖️ Vücut' },
          { key: 'strength', label: '💪 Kuvvet' },
          { key: 'muscle', label: '🎯 Kas Grubu' },
          { key: 'onerm', label: '🏆 1RM' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={activeTab === tab.key
              ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }
              : { color: '#6b7280' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Tab */}
      {activeTab === 'body' && (
        <div className="space-y-4">
          {/* Habit Calendar */}
          {workoutDates && workoutDates.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Antrenman Takvimi</h3>
                <span className="text-xs text-gray-500">{workoutDates.length} antrenman</span>
              </div>
              <HabitCalendar workoutDates={workoutDates} />
            </div>
          )}

          {weeklyData && weeklyData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Haftalık Antrenman Sayısı</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} antrenman`, 'Hafta']} />
                  <ReferenceLine y={settings.workoutsPerWeekGoal} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" />
                  <Bar dataKey="antrenman" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {weightData && weightData.length > 0 ? (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Kilo Değişimi</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} domain={['auto', 'auto']} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} kg`, 'Kilo']} />
                  <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fed7aa' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <p className="text-3xl mb-2">⚖️</p>
              Henüz kilo ölçümü yok. "Ölçüm Ekle" ile başla.
            </div>
          )}

          {measurements && measurements.length > 0 && (
            <div className="card overflow-hidden">
              <h3 className="font-semibold text-white mb-4">Son Ölçümler</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Tarih', 'Kilo', 'Yağ %', 'Göğüs', 'Bel', 'Kalça'].map((h) => (
                        <th key={h} className="text-left pb-3 pr-4 text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.slice(0, 10).map((m, i) => (
                      <tr key={i} className="border-t border-gray-800/60 hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4 text-gray-300">
                          {format(new Date(m.measuredAt), 'd MMM yyyy', { locale: tr })}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-white">{m.weightKg ? `${m.weightKg} kg` : '—'}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{m.bodyFat ? `${m.bodyFat}%` : '—'}</td>
                        <td className="py-2.5 pr-4 text-gray-400">{(m as { chestCm?: number }).chestCm ? `${(m as { chestCm: number }).chestCm} cm` : '—'}</td>
                        <td className="py-2.5 pr-4 text-gray-400">{(m as { waistCm?: number }).waistCm ? `${(m as { waistCm: number }).waistCm} cm` : '—'}</td>
                        <td className="py-2.5 text-gray-400">{(m as { hipsCm?: number }).hipsCm ? `${(m as { hipsCm: number }).hipsCm} cm` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strength / PR Tab */}
      {activeTab === 'strength' && (
        <div className="space-y-4">
          <div className="card">
            <label className="label">Egzersiz Seç</label>
            <Select
              value={selectedExercise}
              onChange={setSelectedExercise}
              placeholder="Egzersiz seçin..."
              options={exercises?.map((ex) => ({ value: ex.id, label: ex.name })) ?? []}
            />
          </div>

          {/* Strength trend analysis */}
          {strengthTrend && strengthTrend.length >= 2 && (() => {
            const sessions = [...strengthTrend].reverse();
            const weights = sessions.map((s) => parseFloat(s.max_weight));
            const latest = weights[weights.length - 1];
            const prev = weights[weights.length - 2];
            const diff = latest - prev;
            const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
            const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#f59e0b';
            const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
            const trendLabel = trend === 'up' ? 'İlerliyorsun!' : trend === 'down' ? 'Gerileme var' : 'Sabit kalıyor';

            // Check overall trend (last 4 vs first 4 sessions)
            const half = Math.floor(weights.length / 2);
            const earlyAvg = weights.slice(0, half).reduce((a, b) => a + b, 0) / half;
            const lateAvg = weights.slice(-half).reduce((a, b) => a + b, 0) / half;
            const overallPct = earlyAvg > 0 ? Math.round(((lateAvg - earlyAvg) / earlyAvg) * 100) : 0;

            return (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Kuvvet Trendi</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: `${trendColor}15`, border: `1px solid ${trendColor}30` }}>
                    <span className="text-lg font-bold" style={{ color: trendColor }}>{trendIcon}</span>
                    <span className="text-sm font-medium" style={{ color: trendColor }}>{trendLabel}</span>
                  </div>
                </div>

                {/* Weight timeline */}
                <div className="flex items-end gap-1.5 h-20 mb-3">
                  {sessions.map((s, i) => {
                    const w = parseFloat(s.max_weight);
                    const maxW = Math.max(...weights);
                    const pct = maxW > 0 ? (w / maxW) * 100 : 50;
                    const isLast = i === sessions.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white whitespace-nowrap px-2 py-1 rounded-lg z-10"
                          style={{ background: '#0f1a24', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {w} kg
                        </div>
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${pct}%`,
                            background: isLast ? '#f97316' : 'rgba(249,115,22,0.3)',
                            minHeight: '4px',
                          }}
                        />
                        <span className="text-[9px] text-gray-700">
                          {format(new Date(s.date), 'dd/MM', { locale: tr })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Son seans</p>
                    <p className="text-lg font-bold text-white">{latest} kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Fark</p>
                    <p className="text-lg font-bold" style={{ color: trendColor }}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Genel değişim</p>
                    <p className="text-lg font-bold" style={{ color: overallPct >= 0 ? '#22c55e' : '#ef4444' }}>
                      {overallPct > 0 ? '+' : ''}{overallPct}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {prHistory && (prHistory as unknown[]).length > 0 ? (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Kişisel Rekor Geçmişi</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={(prHistory as Array<{
                  weightKg?: number; weight_kg?: string | number;
                  reps?: number; achievedAt?: string; achieved_at?: string;
                }>).map((d) => ({
                  date: format(new Date(d.achievedAt ?? d.achieved_at ?? ''), 'd MMM', { locale: tr }),
                  ağırlık: d.weightKg ?? parseFloat(String(d.weight_kg ?? 0)),
                  tekrar: d.reps,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip {...tooltipStyle}
                    formatter={(v: number, name: string) => [
                      name === 'ağırlık' ? `${v} kg` : `${v} tekrar`,
                      name === 'ağırlık' ? 'Ağırlık' : 'Tekrar',
                    ]} />
                  <Bar dataKey="ağırlık" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : selectedExercise ? (
            <div className="card text-center py-10 text-gray-500">
              <p className="text-2xl mb-2">🏋️</p>
              Bu egzersiz için kayıt bulunamadı
            </div>
          ) : null}
        </div>
      )}

      {/* Muscle distribution Tab */}
      {activeTab === 'muscle' && (
        <div className="space-y-4">
          {pieData && pieData.length > 0 ? (
            <>
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Son 30 Günde Kas Grubu Dağılımı</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} set`, 'Set Sayısı']} />
                    <Legend formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pieData.sort((a, b) => b.value - a.value).map((d) => {
                  const total = pieData.reduce((s, i) => s + i.value, 0);
                  return (
                    <div key={d.name} className="card p-4">
                      <div className="w-8 h-8 rounded-lg mb-2"
                        style={{ background: `${d.color}20`, border: `2px solid ${d.color}40` }} />
                      <p className="text-sm font-semibold text-white">{d.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{d.value} set</p>
                      <p className="text-xs font-bold mt-1" style={{ color: d.color }}>
                        {Math.round((d.value / total) * 100)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <p className="text-3xl mb-2">📊</p>
              Henüz antrenman verisi yok
            </div>
          )}
        </div>
      )}

      {/* 1RM Calculator Tab */}
      {activeTab === 'onerm' && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-1">1RM Hesaplayıcı</h3>
              <p className="text-xs text-gray-600">Epley formülü: 1RM = Ağırlık × (1 + Tekrar / 30)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ağırlık (kg)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="100"
                  value={onermWeight}
                  onChange={(e) => setOnermWeight(e.target.value)}
                  step="0.5"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Tekrar Sayısı</label>
                <input
                  type="number"
                  className="input"
                  placeholder="8"
                  value={onermReps}
                  onChange={(e) => setOnermReps(e.target.value)}
                  min="1"
                  max="30"
                />
              </div>
            </div>

            {oneRMResult && (
              <div className="pt-4 border-t border-gray-800">
                <div className="text-center mb-6">
                  <p className="text-xs text-gray-500 mb-1">Tahmini 1RM</p>
                  <p className="text-5xl font-bold text-orange-400">{Math.round(oneRMResult)}</p>
                  <p className="text-gray-500 mt-1">kg</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">% Tablosu</p>
                  {ONE_RM_PERCENTAGES.map((pct) => {
                    const kg = (oneRMResult * pct) / 100;
                    const estReps = pct === 100 ? 1
                      : pct >= 95 ? 2
                      : pct >= 90 ? 4
                      : pct >= 85 ? 5
                      : pct >= 80 ? 6
                      : pct >= 75 ? 8
                      : pct >= 70 ? 10
                      : pct >= 65 ? 12
                      : 15;
                    return (
                      <div key={pct} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(249,115,22,0.6)' }} />
                        </div>
                        <span className="text-sm font-semibold text-white w-16 text-right">{Math.round(kg)} kg</span>
                        <span className="text-xs text-gray-600 w-12">~{estReps} tek</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
