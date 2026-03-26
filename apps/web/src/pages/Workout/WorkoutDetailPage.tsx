import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { workoutApi } from '@/api/workout.api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn: () => workoutApi.get(id!),
    enabled: !!id,
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => workoutApi.update(id!, { name } as Parameters<typeof workoutApi.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setEditingName(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-20 text-gray-400">
        Antrenman bulunamadı.{' '}
        <Link to="/workouts" className="text-primary-400 hover:underline">
          Geri dön
        </Link>
      </div>
    );
  }

  // Preserve exercise order by first occurrence
  const exerciseOrder: string[] = [];
  const exerciseMap = new Map<string, { name: string; sets: typeof workout.sets }>();
  for (const set of workout.sets ?? []) {
    const name = (set as unknown as { exercise_name: string }).exercise_name ?? 'Bilinmeyen';
    if (!exerciseMap.has(name)) {
      exerciseMap.set(name, { name, sets: [] });
      exerciseOrder.push(name);
    }
    exerciseMap.get(name)!.sets!.push(set);
  }

  const totalVolume = (workout.sets ?? []).reduce((sum, s) => {
    return sum + ((s.weightKg ?? 0) * (s.reps ?? 0));
  }, 0);

  function startRename() {
    setNameVal(workout!.name);
    setEditingName(true);
  }

  function submitRename() {
    if (nameVal.trim() && nameVal.trim() !== workout!.name) {
      renameMutation.mutate(nameVal.trim());
    } else {
      setEditingName(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/workouts" className="text-gray-400 hover:text-white transition-colors">
          ← Geri
        </Link>
      </div>

      <div>
        {editingName ? (
          <div className="flex items-center gap-3">
            <input
              autoFocus
              className="input text-2xl font-bold flex-1"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setEditingName(false); }}
            />
            <button onClick={submitRename} disabled={renameMutation.isPending} className="btn-primary px-4">
              {renameMutation.isPending ? '...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditingName(false)} className="btn-secondary px-4">İptal</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 group">
            <h1 className="text-3xl font-bold text-white">{workout.name}</h1>
            <button
              onClick={startRename}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10"
              title="İsmi düzenle"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-gray-400">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-gray-400 mt-1">
          {workout.startedAt && !isNaN(new Date(workout.startedAt).getTime())
            ? format(new Date(workout.startedAt), 'd MMMM yyyy, HH:mm', { locale: tr })
            : '—'}
          {workout.endedAt && ' · Tamamlandı'}
        </p>
        {workout.notes && <p className="text-gray-300 mt-2">{workout.notes}</p>}
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{exerciseOrder.length}</p>
          <p className="text-sm text-gray-400">Egzersiz</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{workout.sets?.length ?? 0}</p>
          <p className="text-sm text-gray-400">Toplam Set</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-sm text-gray-400">Hacim (kg)</p>
        </div>
      </div>

      {/* Egzersizler - sıra korunur */}
      <div className="space-y-4">
        {exerciseOrder.map((exName) => {
          const { sets } = exerciseMap.get(exName)!;
          return (
            <div key={exName} className="card">
              <p className="font-semibold text-white mb-4">{exName}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="text-left pb-2">Set</th>
                    <th className="text-center pb-2">Tekrar</th>
                    <th className="text-center pb-2">Ağırlık</th>
                    <th className="text-center pb-2">Hacim</th>
                  </tr>
                </thead>
                <tbody>
                  {sets?.map((set) => (
                    <tr key={set.id} className="border-t border-gray-800">
                      <td className="py-2 text-primary-400 font-medium">{set.setNumber}</td>
                      <td className="py-2 text-center text-white">{set.reps ?? '—'}</td>
                      <td className="py-2 text-center text-white">
                        {set.weightKg ? `${set.weightKg} kg` : '—'}
                      </td>
                      <td className="py-2 text-center text-gray-400">
                        {set.weightKg && set.reps
                          ? `${Math.round(Number(set.weightKg) * set.reps)} kg`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
