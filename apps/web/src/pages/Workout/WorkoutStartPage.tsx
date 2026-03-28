import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { programApi } from '@/api/program.api';
import { useAuth } from '@/context/AuthContext';

const SESSION_KEY = 'fittrack_session';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const GOAL_COLORS: Record<string, string> = {
  strength: '#ef4444',
  hypertrophy: '#f97316',
  endurance: '#22c55e',
  weight_loss: '#3b82f6',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function startFromDay(programTitle: string, dayName: string, exercises: any[], navigate: ReturnType<typeof useNavigate>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sets: any[] = [];
  for (const ex of exercises) {
    const numSets = typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets) || 3;
    for (let i = 1; i <= numSets; i++) {
      sets.push({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup || 'chest',
        setNumber: i,
        reps: String(ex.reps ?? '8'),
        weightKg: '',
        done: false,
      });
    }
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    name: `${programTitle} — ${dayName}`,
    sets,
    startedAt: Date.now(),
  }));
  navigate('/workouts/new');
}

export default function WorkoutStartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: allPrograms = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programApi.list(),
  });

  const { data: programDetail } = useQuery({
    queryKey: ['program', expandedId],
    queryFn: () => programApi.get(expandedId!),
    enabled: !!expandedId,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myPrograms = allPrograms.filter((p: any) => p.createdBy === user?.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classicPrograms = allPrograms.filter((p: any) => !p.createdBy || p.createdBy !== user?.id);

  const days = programDetail
    ? programDetail.weeks?.flatMap((w) => w.days.filter((d) => !d.isRestDay)) ?? []
    : [];

  function toggle(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function ProgramCard({ program }: { program: any }) {
    const isOpen = expandedId === program.id;
    const color = GOAL_COLORS[program.goal] ?? '#f97316';

    return (
      <div className="rounded-2xl overflow-hidden border transition-all"
        style={{ borderColor: isOpen ? `${color}50` : 'rgba(255,255,255,0.07)', background: isOpen ? `${color}08` : 'rgba(255,255,255,0.02)' }}>
        <button onClick={() => toggle(program.id)}
          className="w-full text-left p-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{program.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{LEVEL_LABELS[program.level] ?? program.level}</span>
              {program.durationWeeks && <span className="text-xs text-gray-600">· {program.durationWeeks} hafta</span>}
              {program.creatorName && <span className="text-xs text-gray-600">· {program.creatorName}</span>}
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && (
          <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
            {!programDetail && expandedId === program.id && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {days.length === 0 && programDetail && (
              <p className="text-xs text-gray-500 text-center py-2">Bu programda gün bulunamadı.</p>
            )}
            {days.map((day) => (
              <button key={day.id}
                onClick={() => startFromDay(program.title, day.name, day.exercises, navigate)}
                disabled={day.exercises.length === 0}
                className="w-full text-left flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all disabled:opacity-40">
                <div>
                  <p className="text-sm font-medium text-white">{day.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{day.exercises.length} egzersiz</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
                    {day.exercises.slice(0, 3).map((ex, i) => (
                      <span key={i} className="text-xs text-gray-400 bg-white/5 px-1.5 py-0.5 rounded-md truncate max-w-[70px]">
                        {ex.exerciseName}
                      </span>
                    ))}
                    {day.exercises.length > 3 && (
                      <span className="text-xs text-gray-500">+{day.exercises.length - 3}</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}20` }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} className="w-4 h-4">
                      <path d="M5 3l14 9-14 9V3z" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/workouts" className="text-gray-400 hover:text-white transition-colors text-sm">← Antrenmanlar</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Antrenman Seç</h1>
        <p className="text-sm text-gray-500 mt-1">Bir program ve gün seç, antrenman otomatik hazırlanır</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Benim Programlarım */}
      {myPrograms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Programlarım</p>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          {myPrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
        </div>
      )}

      {/* Klasik Programlar */}
      {classicPrograms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Klasik Programlar</p>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          {classicPrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
        </div>
      )}

      {!isLoading && allPrograms.length === 0 && (
        <div className="card text-center py-12 space-y-3">
          <p className="text-gray-400">Henüz program yok.</p>
          <Link to="/programs/create" className="btn-primary inline-block px-6 py-2 text-sm">
            Program Oluştur
          </Link>
        </div>
      )}

      {/* Boş antrenman başlat */}
      <button
        onClick={() => { localStorage.removeItem(SESSION_KEY); navigate('/workouts/new'); }}
        className="w-full py-3 rounded-xl text-sm text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-all">
        Boş Antrenman Başlat
      </button>
    </div>
  );
}
