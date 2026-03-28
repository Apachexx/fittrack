import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { programApi } from '@/api/program.api';
import { useAuth } from '@/context/AuthContext';
import BodyMap from '@/components/ui/BodyMap';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const GOAL_LABELS: Record<string, string> = {
  strength: '💪 Kuvvet',
  hypertrophy: '🏋️ Kas Kitlesi',
  endurance: '🏃 Dayanıklılık',
  weight_loss: '🔥 Yağ Yakımı',
};

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{
    key: string;
    exerciseName: string;
    muscleGroup: string | null;
  } | null>(null);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', id],
    queryFn: () => programApi.get(id!),
    enabled: !!id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (data: any) => {
      if (isPublic === null) setIsPublic(data.is_public ?? false);
      return data;
    },
  });

  const { data: activeProgram } = useQuery({
    queryKey: ['active-program'],
    queryFn: programApi.getActive,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isEnrolled = !!activeProgram && (activeProgram as any).programId === id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = !!user && !!(program as any)?.createdBy && (program as any).createdBy === user.id;

  const enrollMutation = useMutation({
    mutationFn: () => programApi.enroll(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-program'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: (val: boolean) => programApi.setVisibility(id!, val),
    onSuccess: (data) => {
      setIsPublic(data.is_public);
      queryClient.invalidateQueries({ queryKey: ['community-programs'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-20 text-gray-400">
        Program bulunamadı.{' '}
        <Link to="/programs" className="text-primary-400 hover:underline">Geri dön</Link>
      </div>
    );
  }

  const weeks = program.weeks ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      <Link to="/programs" className="text-gray-400 hover:text-white transition-colors">
        ← Programlar
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`badge-${program.level}`}>{LEVEL_LABELS[program.level]}</span>
              <span className="text-sm text-gray-400">{program.durationWeeks} hafta</span>
              {program.enrollmentCount != null && program.enrollmentCount > 0 && (
                <span className="text-xs text-gray-500">👤 {program.enrollmentCount} sporcu</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{program.title}</h1>
            {program.description && (
              <p className="text-gray-400 leading-relaxed">{program.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="text-sm text-gray-300">{GOAL_LABELS[program.goal]}</span>
              {program.creatorName && (
                <span className="text-sm text-gray-500">👤 {program.creatorName}</span>
              )}
            </div>

            {/* Visibility toggle — only owner sees this */}
            {isOwner && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
                <span className="text-sm text-gray-400">Herkese Açık</span>
                <button
                  onClick={() => visibilityMutation.mutate(!isPublic)}
                  disabled={visibilityMutation.isPending}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isPublic ? 'bg-primary-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500">
                  {isPublic ? 'Topluluk sayfasında görünüyor' : 'Sadece sen görüyorsun'}
                </span>
              </div>
            )}
          </div>

          {isEnrolled ? (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                ✓
              </div>
              <span className="text-xs text-emerald-400 font-medium">Aktif Program</span>
            </div>
          ) : (
            <button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="btn-primary px-6 py-3 shrink-0"
            >
              {enrollMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydolunuyor...
                </span>
              ) : 'Programa Kaydol'}
            </button>
          )}
        </div>
      </div>

      {/* Program content + Body Map side panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6 items-start">
        {/* Weeks / Days / Exercises */}
        <div>
          {weeks.length > 0 ? (
            <div className="space-y-6">
              {weeks.map((week) => (
                <div key={week.id}>
                  <h2 className="text-lg font-semibold text-white mb-3">Hafta {week.weekNumber}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {week.days.map((day) => (
                      <div key={day.id} className={`card ${day.isRestDay ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-medium text-white">
                            Gün {day.dayNumber}: {day.name}
                          </p>
                          {day.isRestDay && (
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                              Dinlenme
                            </span>
                          )}
                        </div>

                        {!day.isRestDay && day.exercises.length > 0 && (
                          <div>
                            {day.exercises.map((ex, i) => {
                              const key = `${day.id}-${i}`;
                              const isActive = selected?.key === key;
                              return (
                              <button
                                key={i}
                                onClick={() => setSelected(isActive ? null : { key, exerciseName: ex.exerciseName, muscleGroup: ex.muscleGroup ?? null })}
                                className={`w-full flex items-center justify-between py-2 px-2 border-t border-gray-800 first:border-0 rounded-md transition-colors text-left cursor-pointer
                                  ${isActive ? 'bg-emerald-500/15' : 'hover:bg-white/5'}`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <p className="text-sm text-gray-200 truncate">{ex.exerciseName}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-xs font-semibold text-orange-400">
                                    {ex.sets} × {ex.reps}
                                  </span>
                                </div>
                              </button>
                              );
                            })}
                          </div>
                        )}

                        {!day.isRestDay && day.exercises.length === 0 && (
                          <p className="text-xs text-gray-600">Egzersiz eklenmemiş</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              Program içeriği henüz eklenmemiş
            </div>
          )}
        </div>

        {/* Sticky Body Map */}
        <div className="sticky top-6">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 text-center uppercase tracking-widest">
              Kas Grupları
            </h3>
            <BodyMap exerciseName={selected?.exerciseName} muscleGroup={selected?.muscleGroup} />
          </div>
        </div>
      </div>
    </div>
  );
}
