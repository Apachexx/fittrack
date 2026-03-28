import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { programApi } from '@/api/program.api';
import type { Program } from '@fittrack/shared';
import Select from '@/components/ui/Select';

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

export default function ProgramListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [levelFilter, setLevelFilter] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs', levelFilter, goalFilter],
    queryFn: () => programApi.list({
      level: levelFilter || undefined,
      goal: goalFilter || undefined,
    }),
  });

  const { data: activeProgram } = useQuery({
    queryKey: ['active-program'],
    queryFn: programApi.getActive,
  });

  const enrollMutation = useMutation({
    mutationFn: programApi.enroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-program'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Programlar</h1>
          <p className="text-gray-400 mt-1">Hazır programlar veya kendin oluştur</p>
        </div>
        <button onClick={() => navigate('/programs/create')} className="btn-primary flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
          Program Oluştur
        </button>
      </div>

      {/* Aktif program banner */}
      {activeProgram && (
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-400 font-medium uppercase tracking-wide mb-1">Aktif Programın</p>
              <p className="font-semibold text-white text-lg">{(activeProgram as { title?: string }).title}</p>
              <p className="text-sm text-gray-400 mt-1">Hafta {(activeProgram as { currentWeek?: number }).currentWeek}</p>
            </div>
            <span className="text-4xl">🏃</span>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={levelFilter}
          onChange={setLevelFilter}
          className="w-44"
          options={[
            { value: '', label: 'Tüm Seviyeler' },
            { value: 'beginner', label: 'Başlangıç' },
            { value: 'intermediate', label: 'Orta' },
            { value: 'advanced', label: 'İleri' },
          ]}
        />
        <Select
          value={goalFilter}
          onChange={setGoalFilter}
          className="w-44"
          options={[
            { value: '', label: 'Tüm Hedefler' },
            { value: 'strength', label: 'Kuvvet' },
            { value: 'hypertrophy', label: 'Kas Kitlesi' },
            { value: 'endurance', label: 'Dayanıklılık' },
            { value: 'weight_loss', label: 'Yağ Yakımı' },
          ]}
        />
      </div>

      {/* Program kartları */}
      {programs?.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <span className="text-5xl">📋</span>
          <p className="mt-4">Bu kriterlere uygun program bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs?.map((program: Program) => (
            <div key={program.id} className="card hover:border-gray-700 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <span className={`badge-${program.level}`}>
                  {LEVEL_LABELS[program.level]}
                </span>
                <span className="text-sm text-gray-400">{program.durationWeeks} hafta</span>
              </div>

              <h3 className="font-semibold text-white text-lg mb-2">{program.title}</h3>
              {program.description && (
                <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-3">{program.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-300">{GOAL_LABELS[program.goal]}</span>
              </div>

              {program.creatorName && (
                <p className="text-xs text-gray-500 mb-4">👤 {program.creatorName}</p>
              )}

              <div className="flex gap-2 mt-auto">
                <Link to={`/programs/${program.id}`} className="btn-secondary flex-1 text-center text-sm">
                  Detay
                </Link>
                {(activeProgram as { programId?: string } | null)?.programId === program.id ? (
                  <span className="flex-1 text-center text-sm py-2 rounded-xl font-semibold text-emerald-400"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ✓ Aktif
                  </span>
                ) : (
                  <button
                    onClick={() => enrollMutation.mutate(program.id)}
                    disabled={enrollMutation.isPending && enrollMutation.variables === program.id}
                    className="btn-primary flex-1 text-sm"
                  >
                    {enrollMutation.isPending && enrollMutation.variables === program.id ? '...' : 'Başla'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
