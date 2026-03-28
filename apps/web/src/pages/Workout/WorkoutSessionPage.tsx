import { useState, useReducer, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutApi } from '@/api/workout.api';
import RestTimer, { type RestTimerRef } from '@/components/workout/RestTimer';
import ExerciseModal from '@/components/workout/ExerciseModal';
import type { Exercise } from '@fittrack/shared';

interface SetEntry {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: string;
  weightKg: string;
  done: boolean;
}

type Action =
  | { type: 'ADD'; payload: SetEntry }
  | { type: 'REMOVE'; payload: number }
  | { type: 'UPDATE'; payload: { i: number; field: keyof SetEntry; value: string | boolean } }
  | { type: 'TOGGLE_DONE'; payload: number };

function reducer(state: SetEntry[], action: Action): SetEntry[] {
  switch (action.type) {
    case 'ADD': return [...state, action.payload];
    case 'REMOVE': return state.filter((_, i) => i !== action.payload);
    case 'UPDATE': return state.map((s, i) => i === action.payload.i ? { ...s, [action.payload.field]: action.payload.value } : s);
    case 'TOGGLE_DONE': return state.map((s, i) => i === action.payload ? { ...s, done: !s.done } : s);
    default: return state;
  }
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#f97316', back: '#3b82f6', legs: '#22c55e',
  shoulders: '#a855f7', arms: '#ec4899', core: '#eab308', cardio: '#14b8a6',
};

const SESSION_KEY = 'fittrack_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { name: string; sets: SetEntry[]; startedAt: number };
  } catch { return null; }
}

function saveSession(name: string, sets: SetEntry[], startedAt: number) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name, sets, startedAt }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function WorkoutSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const restTimerRef = useRef<RestTimerRef>(null);

  // Compute once at mount — if sets existed in localStorage, this is a program workout
  const [{ saved, fromProgram }] = useState(() => {
    const s = loadSession();
    return { saved: s, fromProgram: (s?.sets?.length ?? 0) > 0 };
  });
  const [name, setName] = useState(saved?.name ?? 'Yeni Antrenman');
  const [editingName, setEditingName] = useState(false);
  const [sets, dispatch] = useReducer(reducer, saved?.sets ?? []);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [modalEx, setModalEx] = useState<Exercise | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  // exerciseId → last session sets
  const [lastSessionMap, setLastSessionMap] = useState<Record<string, Array<{ set_number: number; reps: number | null; weight_kg: string | null }>>>({});
  const startRef = useRef(saved?.startedAt ?? Date.now());

  useEffect(() => {
    if (sets.length > 0 || name !== 'Yeni Antrenman') {
      saveSession(name, sets, startRef.current);
    }
  }, [sets, name]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsedStr = (() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search, muscleFilter],
    queryFn: () => workoutApi.listExercises({ search: search || undefined, muscleGroup: muscleFilter || undefined }),
  });

  // Fetch last session for selected exercise
  const { data: selectedExLastSession } = useQuery({
    queryKey: ['exercise-last-session', selectedEx?.id],
    queryFn: () => workoutApi.getExerciseLastSession(selectedEx!.id),
    enabled: !!selectedEx,
  });

  const createMutation = useMutation({ mutationFn: workoutApi.create });

  async function handleFinish() {
    if (sets.length === 0) return;
    setSaving(true);
    try {
      const workout = await createMutation.mutateAsync({ name });
      for (const s of sets) {
        await workoutApi.addSet(workout.id, {
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: parseInt(s.reps) || undefined,
          weightKg: parseFloat(s.weightKg) || undefined,
          completed: s.done,
        });
      }
      await workoutApi.update(workout.id, { endedAt: new Date().toISOString() } as Parameters<typeof workoutApi.update>[1]);
      clearSession();
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      navigate(`/workouts/${workout.id}`);
    } finally {
      setSaving(false);
    }
  }

  async function addSetForExercise(ex: { id: string; name: string; muscleGroup: string }) {
    const prev = [...sets].reverse().find((s) => s.exerciseId === ex.id);
    const newIdx = sets.length;

    // Fetch last session data for this exercise if not already cached
    if (!lastSessionMap[ex.id]) {
      try {
        const data = await workoutApi.getExerciseLastSession(ex.id);
        if (data.length > 0) {
          setLastSessionMap((m) => ({ ...m, [ex.id]: data }));
        }
      } catch { /* ignore */ }
    }

    dispatch({
      type: 'ADD',
      payload: {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        setNumber: (prev?.setNumber ?? 0) + 1,
        reps: prev?.reps ?? '10',
        weightKg: prev?.weightKg ?? '0',
        done: false,
      },
    });
    setEditingIdx(newIdx);
  }


  // Preserve exercise order by first occurrence in sets array
  const exerciseOrder: string[] = [];
  const grouped: Record<string, SetEntry[]> = {};
  for (const s of sets) {
    if (!grouped[s.exerciseName]) {
      grouped[s.exerciseName] = [];
      exerciseOrder.push(s.exerciseName);
    }
    grouped[s.exerciseName].push(s);
  }

  const doneCount = sets.filter((s) => s.done).length;
  const totalVolume = sets.filter((s) => s.done).reduce((sum, s) => sum + (parseFloat(s.weightKg) || 0) * (parseInt(s.reps) || 0), 0);

  const muscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'];
  const REPS = Array.from({ length: 80 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">

      {/* Session header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              className="text-2xl font-bold bg-transparent border-none outline-none text-white w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="text-left group flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">{name}</h1>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-gray-500 font-mono">{elapsedStr}</span>
            <span className="text-gray-700">·</span>
            <span className="text-sm text-gray-500">{doneCount}/{sets.length} set</span>
            {totalVolume > 0 && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-sm text-gray-500">{Math.round(totalVolume).toLocaleString()} kg hacim</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {sets.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Antrenmanı sıfırlamak istediğinize emin misiniz?')) {
                  clearSession();
                  navigate('/workouts/start');
                }
              }}
              className="btn-secondary text-sm px-3 py-2"
            >
              Sıfırla
            </button>
          )}
          <button
            onClick={handleFinish}
            disabled={saving || sets.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {saving ? 'Kaydediliyor...' : 'Bitir'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {sets.length > 0 && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / sets.length) * 100}%` }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: exercise picker + set log */}
        <div className="lg:col-span-2 space-y-4">

          {/* Exercise picker — sadece boş antrenman için */}
          {!fromProgram && <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Egzersiz Seç</p>

            <div className="relative mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                className="w-4 h-4 absolute left-3 inset-y-0 my-auto text-gray-600 pointer-events-none">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input className="input pl-9" placeholder="Egzersiz ara..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="flex gap-1.5 flex-wrap mb-3">
              <button
                onClick={() => setMuscleFilter('')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={!muscleFilter ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Tümü
              </button>
              {muscles.map((m) => (
                <button key={m} onClick={() => setMuscleFilter(m === muscleFilter ? '' : m)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                  style={m === muscleFilter
                    ? { background: `${MUSCLE_COLORS[m]}20`, color: MUSCLE_COLORS[m], border: `1px solid ${MUSCLE_COLORS[m]}40` }
                    : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
              {exercises?.map((ex) => (
                <div key={ex.id} className="relative group">
                  <button onClick={() => setSelectedEx(ex)}
                    className="text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-150 w-full pr-7"
                    style={selectedEx?.id === ex.id
                      ? { background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#d1d5db' }}>
                    <p className="font-medium truncate text-xs leading-tight">{ex.name}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: MUSCLE_COLORS[ex.muscleGroup] ?? '#9ca3af' }}>
                      {ex.muscleGroup}
                    </p>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setModalEx(ex); }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                    title="Kas haritasını gör"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {selectedEx && (
              <div className="mt-3 space-y-2">
                {selectedExLastSession && selectedExLastSession.length > 0 && (
                  <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', color: '#9ca3af' }}>
                    <span className="text-orange-500 font-medium">Geçen seans: </span>
                    {selectedExLastSession.map((s) => `${s.reps ?? '?'}×${s.weight_kg ? parseFloat(s.weight_kg) : 0}kg`).join(' · ')}
                  </div>
                )}
                <button
                  onClick={() => addSetForExercise(selectedEx)}
                  className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}
                >
                  + {selectedEx.name} Ekle
                </button>
              </div>
            )}
          </div>}

          {/* Set log */}
          {exerciseOrder.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-2">💪</p>
              <p className="text-gray-500 text-sm">Egzersiz seçip set eklemeye başlayın</p>
            </div>
          ) : (
            exerciseOrder.map((exName) => {
              const exSets = grouped[exName];
              const color = MUSCLE_COLORS[exSets[0].muscleGroup] ?? '#9ca3af';
              const activeSetInThisEx = editingIdx !== null && sets[editingIdx]?.exerciseName === exName;
              const lastSession = lastSessionMap[exSets[0].exerciseId];

              return (
                <div key={exName} className="card p-5">
                  {/* Exercise header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 rounded-full shrink-0" style={{ background: color }} />
                    <button
                      className="font-semibold text-white hover:text-orange-400 transition-colors text-left flex items-center gap-1.5"
                      onClick={() => setModalEx({
                        id: exSets[0].exerciseId,
                        name: exName,
                        muscleGroup: exSets[0].muscleGroup as Exercise['muscleGroup'],
                        equipment: 'other' as Exercise['equipment'],
                        isCustom: false,
                      })}
                    >
                      {exName}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-gray-600 shrink-0">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize ml-auto"
                      style={{ background: `${color}15`, color }}>
                      {exSets[0].muscleGroup}
                    </span>
                  </div>

                  {/* Previous session data */}
                  {lastSession && lastSession.length > 0 && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-gray-600">Geçen seans: </span>
                      <span className="text-gray-500">
                        {lastSession.map((s) => `${s.reps ?? '?'}×${s.weight_kg ? parseFloat(s.weight_kg) : 0}kg`).join(' · ')}
                      </span>
                    </div>
                  )}

                  {/* Set chips row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {exSets.map((set) => {
                      const gi = sets.indexOf(set);
                      return (
                        <button
                          key={gi}
                          onClick={() => setEditingIdx(editingIdx === gi ? null : gi)}
                          className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
                          style={
                            set.done
                              ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                              : editingIdx === gi
                              ? { background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' }
                              : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }
                          }
                        >
                          {set.done ? '✓' : set.setNumber}
                        </button>
                      );
                    })}

                  </div>

                  {/* Set editing panel */}
                  {activeSetInThisEx && editingIdx !== null && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Set {sets[editingIdx].setNumber} Düzenle
                      </p>

                      {/* Reps picker */}
                      <div>
                        <label className="label">Tekrar Sayısı</label>
                        <div
                          className="flex gap-1 overflow-x-auto pb-2"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {REPS.map((n) => {
                            const isSelected = sets[editingIdx].reps === String(n);
                            return (
                              <button
                                key={n}
                                onClick={() => dispatch({ type: 'UPDATE', payload: { i: editingIdx, field: 'reps', value: String(n) } })}
                                className="flex-shrink-0 w-8 h-8 rounded-lg text-xs font-medium transition-all"
                                style={
                                  isSelected
                                    ? { background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' }
                                    : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.06)' }
                                }
                              >
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weight input */}
                      <div>
                        <label className="label">Ağırlık (kg)</label>
                        <input
                          type="number"
                          className="input"
                          value={sets[editingIdx].weightKg}
                          onChange={(e) => dispatch({ type: 'UPDATE', payload: { i: editingIdx, field: 'weightKg', value: e.target.value } })}
                          step="0.5"
                          min="0"
                          placeholder="0"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            dispatch({ type: 'TOGGLE_DONE', payload: editingIdx });
                            restTimerRef.current?.start(90); // otomatik dinlenme başlat
                            setEditingIdx(null);
                          }}
                          className="btn-primary flex-1"
                        >
                          ✓ Seti Tamamla
                        </button>
                        <button
                          onClick={() => {
                            dispatch({ type: 'REMOVE', payload: editingIdx });
                            setEditingIdx(null);
                          }}
                          className="btn-secondary px-4"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: timer + stats */}
        <div className="space-y-4">
          <RestTimer ref={restTimerRef} />

          {sets.length > 0 && (
            <div className="card p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seans Özeti</p>
              {[
                { label: 'Egzersiz', val: exerciseOrder.length },
                { label: 'Toplam Set', val: sets.length },
                { label: 'Tamamlanan', val: doneCount },
                { label: 'Hacim (kg)', val: Math.round(totalVolume).toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-sm font-semibold text-white">{s.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalEx && (
        <ExerciseModal exercise={modalEx} onClose={() => setModalEx(null)} />
      )}
    </div>
  );
}
