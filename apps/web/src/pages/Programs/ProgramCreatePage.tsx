import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programApi } from '@/api/program.api';
import { workoutApi } from '@/api/workout.api';
import type { Exercise } from '@fittrack/shared';

const DAYS = [
  { num: 1, label: 'Pzt', full: 'Pazartesi' },
  { num: 2, label: 'Sal', full: 'Salı' },
  { num: 3, label: 'Çar', full: 'Çarşamba' },
  { num: 4, label: 'Per', full: 'Perşembe' },
  { num: 5, label: 'Cum', full: 'Cuma' },
  { num: 6, label: 'Cmt', full: 'Cumartesi' },
  { num: 7, label: 'Paz', full: 'Pazar' },
];

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#f97316', back: '#3b82f6', legs: '#22c55e',
  shoulders: '#a855f7', arms: '#ec4899', core: '#eab308', cardio: '#14b8a6',
};

interface DayExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSecs: number;
}

interface DayPlan {
  dayNumber: number;
  exercises: DayExercise[];
}

export default function ProgramCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Program info
  const [title, setTitle] = useState('');

  // Day selection
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]);

  // Exercise plan per day
  const [dayPlans, setDayPlans] = useState<Record<number, DayExercise[]>>({});

  // Exercise picker state
  const [activeDayPicker, setActiveDayPicker] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search, muscleFilter],
    queryFn: () => workoutApi.listExercises({ search: search || undefined, muscleGroup: muscleFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: programApi.create,
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      navigate(`/programs/${program.id}`);
    },
  });

  function toggleDay(num: number) {
    setSelectedDays((prev) =>
      prev.includes(num) ? prev.filter((d) => d !== num) : [...prev, num].sort()
    );
  }

  function addExerciseToDay(day: number, ex: Exercise) {
    setDayPlans((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
        {
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: 3,
          reps: '8',
          restSecs: 90,
        },
      ],
    }));
    setActiveDayPicker(null);
    setSearch('');
    setMuscleFilter('');
  }

  function updateExercise(day: number, idx: number, field: keyof DayExercise, value: string | number) {
    setDayPlans((prev) => {
      const updated = [...(prev[day] ?? [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, [day]: updated };
    });
  }

  function removeExercise(day: number, idx: number) {
    setDayPlans((prev) => {
      const updated = (prev[day] ?? []).filter((_, i) => i !== idx);
      return { ...prev, [day]: updated };
    });
  }

  function handleCreate() {
    if (!title.trim()) return;
    const days: DayPlan[] = selectedDays
      .filter((d) => (dayPlans[d] ?? []).length > 0)
      .map((d) => ({
        dayNumber: d,
        name: DAYS.find((day) => day.num === d)?.full ?? '',
        exercises: dayPlans[d] ?? [],
      }));

    if (days.length === 0) return;

    createMutation.mutate({ title, level: 'intermediate', goal: 'hypertrophy', durationWeeks: 8, days });
  }

  const canCreate = title.trim().length > 0 &&
    selectedDays.some((d) => (dayPlans[d] ?? []).length > 0);

  const muscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/programs')} className="btn-secondary p-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Program Oluştur</h1>
      </div>

      {/* Program info */}
      <div className="card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Bilgileri</p>

        <div>
          <label className="label">Program Adı</label>
          <input
            className="input"
            placeholder="Örn: Benim Kas Programım"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

      </div>

      {/* Day selector */}
      <div className="card p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Antrenman Günleri</p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((d) => {
            const isSelected = selectedDays.includes(d.num);
            const hasExercises = (dayPlans[d.num] ?? []).length > 0;
            return (
              <button
                key={d.num}
                onClick={() => toggleDay(d.num)}
                className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all font-medium text-sm min-w-[52px]"
                style={
                  isSelected
                    ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                {d.label}
                {isSelected && hasExercises && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-600">
          {selectedDays.length} gün seçildi · Her hafta tekrar eder
        </p>
      </div>

      {/* Day exercise plans */}
      {selectedDays.map((dayNum) => {
        const dayInfo = DAYS.find((d) => d.num === dayNum)!;
        const exList = dayPlans[dayNum] ?? [];

        return (
          <div key={dayNum} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{dayInfo.full}</p>
              <span className="text-xs text-gray-600">{exList.length} hareket</span>
            </div>

            {/* Exercise list */}
            {exList.map((ex, idx) => (
              <div key={idx} className="rounded-xl p-3 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: MUSCLE_COLORS[ex.muscleGroup] ?? '#6b7280' }} />
                    <span className="text-sm font-medium text-white">{ex.exerciseName}</span>
                  </div>
                  <button
                    onClick={() => removeExercise(dayNum, idx)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Set</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateExercise(dayNum, idx, 'sets', Math.max(1, ex.sets - 1))}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center text-lg"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>−</button>
                      <span className="text-white font-bold text-sm w-5 text-center">{ex.sets}</span>
                      <button
                        onClick={() => updateExercise(dayNum, idx, 'sets', Math.min(20, ex.sets + 1))}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center text-lg"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>+</button>
                    </div>
                  </div>
                  <div>
                    <label className="label text-[10px]">Tekrar</label>
                    <input
                      className="input py-1 text-sm text-center"
                      value={ex.reps}
                      onChange={(e) => updateExercise(dayNum, idx, 'reps', e.target.value)}
                      placeholder="8"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  → {ex.sets}×{ex.reps} {ex.exerciseName}
                </p>
              </div>
            ))}

            {/* Add exercise button */}
            {activeDayPicker === dayNum ? (
              <div className="space-y-3 pt-2 border-t border-gray-800">
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    className="w-4 h-4 absolute left-3 inset-y-0 my-auto text-gray-600 pointer-events-none">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                  </svg>
                  <input className="input pl-9" placeholder="Egzersiz ara..."
                    value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setMuscleFilter('')}
                    className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                    style={!muscleFilter
                      ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }
                    }>Tümü</button>
                  {muscles.map((m) => (
                    <button key={m} onClick={() => setMuscleFilter(m === muscleFilter ? '' : m)}
                      className="px-2 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                      style={m === muscleFilter
                        ? { background: `${MUSCLE_COLORS[m]}20`, color: MUSCLE_COLORS[m], border: `1px solid ${MUSCLE_COLORS[m]}40` }
                        : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {m}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {exercises?.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addExerciseToDay(dayNum, ex)}
                      className="text-left px-3 py-2 rounded-xl text-sm transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#d1d5db' }}
                    >
                      <p className="font-medium truncate text-xs">{ex.name}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: MUSCLE_COLORS[ex.muscleGroup] ?? '#9ca3af' }}>
                        {ex.muscleGroup}
                      </p>
                    </button>
                  ))}
                </div>

                <button onClick={() => setActiveDayPicker(null)} className="btn-secondary w-full text-sm">
                  İptal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveDayPicker(dayNum)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', color: '#6b7280' }}
              >
                + Hareket Ekle
              </button>
            )}
          </div>
        );
      })}

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate || createMutation.isPending}
        className="btn-primary w-full py-3 text-base font-semibold"
      >
        {createMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Oluşturuluyor...
          </span>
        ) : 'Programı Oluştur'}
      </button>
    </div>
  );
}
