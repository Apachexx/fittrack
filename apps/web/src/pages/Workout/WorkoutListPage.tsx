import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { workoutApi } from '@/api/workout.api';
import { format, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Workout } from '@fittrack/shared';

function getDuration(workout: Workout): string | null {
  if (!workout.endedAt || !workout.startedAt) return null;
  const mins = differenceInMinutes(new Date(workout.endedAt), new Date(workout.startedAt));
  if (mins < 1) return null;
  if (mins < 60) return `${mins}dk`;
  return `${Math.floor(mins / 60)}s ${mins % 60}dk`;
}

function groupByMonth(workouts: Workout[]): Record<string, Workout[]> {
  const groups: Record<string, Workout[]> = {};
  for (const w of workouts) {
    const key = format(new Date(w.startedAt), 'MMMM yyyy', { locale: tr });
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }
  return groups;
}

export default function WorkoutListPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'month'>('list');

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: workoutApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  });

  const completed = workouts.filter((w) => w.endedAt);
  const thisWeek = workouts.filter((w) => new Date(w.startedAt) >= new Date(Date.now() - 7 * 86400000));
  const totalDuration = completed.reduce((sum, w) => {
    if (!w.endedAt) return sum;
    return sum + differenceInMinutes(new Date(w.endedAt), new Date(w.startedAt));
  }, 0);
  const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;
  const grouped = groupByMonth(workouts);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Antrenmanlar</h1>
          <p className="text-gray-500 mt-1 text-sm">{workouts.length} toplam antrenman</p>
        </div>
        <Link to="/workouts/new" className="btn-primary flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Yeni Antrenman
        </Link>
      </div>

      {workouts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Toplam', value: workouts.length, unit: 'antrenman', color: '#f97316' },
            { label: 'Bu Hafta', value: thisWeek.length, unit: 'antrenman', color: '#3b82f6' },
            { label: 'Tamamlanan', value: completed.length, unit: 'antrenman', color: '#22c55e' },
            { label: 'Ort. Süre', value: avgDuration, unit: 'dakika', color: '#a855f7' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.unit}</p>
            </div>
          ))}
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl">🏋️</span>
          <p className="mt-4 text-gray-300 font-medium">Henüz antrenman yok</p>
          <p className="text-gray-500 text-sm mt-1">İlk antrenmana başlamak için butona tıkla</p>
          <Link to="/workouts/new" className="btn-primary mt-6 inline-block">Antrenman Başlat</Link>
        </div>
      ) : (
        <>
          <div className="flex gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[{ key: 'list', label: 'Liste' }, { key: 'month', label: 'Aylık' }].map((v) => (
              <button key={v.key} onClick={() => setView(v.key as typeof view)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={view === v.key
                  ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }
                  : { color: '#6b7280' }}>
                {v.label}
              </button>
            ))}
          </div>

          {view === 'list' && (
            <div className="space-y-2">
              {workouts.map((workout) => {
                const dur = getDuration(workout);
                return (
                  <div key={workout.id} className="card flex items-center p-4 hover:border-white/[0.12] transition-all group">
                    <Link to={`/workouts/${workout.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                        style={{ background: workout.endedAt ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)' }}>
                        {workout.endedAt ? '✓' : '💪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{workout.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-600">
                            {format(new Date(workout.startedAt), 'd MMM yyyy · HH:mm', { locale: tr })}
                          </span>
                          {dur && <span className="text-xs text-gray-500">· {dur}</span>}
                          {workout.endedAt && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                              Tamamlandı
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => { if (confirm('Bu antrenmanı silmek istiyorsun?')) deleteMutation.mutate(workout.id); }}
                      className="ml-3 w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                        <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" />
                        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'month' && (
            <div className="space-y-6">
              {Object.entries(grouped).map(([month, monthWorkouts]) => (
                <div key={month}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-gray-400 capitalize">{month}</h3>
                    <span className="text-xs text-gray-600 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {monthWorkouts.length} antrenman
                    </span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    {monthWorkouts.map((workout) => {
                      const dur = getDuration(workout);
                      return (
                        <Link key={workout.id} to={`/workouts/${workout.id}`}
                          className="card flex items-center gap-3 p-4 hover:border-white/[0.12] transition-all group">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-gray-400 shrink-0"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {format(new Date(workout.startedAt), 'd')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-200 truncate">{workout.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-600 capitalize">
                                {format(new Date(workout.startedAt), 'EEEE · HH:mm', { locale: tr })}
                              </span>
                              {dur && <span className="text-xs text-gray-500">· {dur}</span>}
                            </div>
                          </div>
                          {workout.endedAt && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">✓</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
