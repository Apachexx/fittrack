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
  const { data: programs, isLoading, isFetching } = useQuery({
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

  if (isLoading && !programs) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Programlar</h1>

      {/* Kendi programını oluştur — büyük kart */}
      <button
        onClick={() => navigate('/programs/create')}
        className="w-full text-left rounded-2xl p-5 transition-all"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(225,29,72,0.08) 100%)', border: '1px solid rgba(249,115,22,0.25)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Kendi programını yap</p>
            <p className="text-lg font-bold text-white">Program Oluştur</p>
            <p className="text-sm text-gray-400 mt-1">Günleri ve hareketleri kendin seç</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={2} className="w-6 h-6">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* Topluluk programları */}
      <button
        onClick={() => navigate('/programs/community')}
        className="w-full text-left rounded-2xl p-5 transition-all"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Kullanıcı programları</p>
            <p className="text-lg font-bold text-white">Topluluk</p>
            <p className="text-sm text-gray-400 mt-1">Herkesin paylaştığı programları keşfet</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth={2} className="w-6 h-6">
              <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4" strokeLinecap="round" />
              <circle cx="19" cy="11" r="3" /><path d="M16 21v-1a3 3 0 0 1 3-3 3 3 0 0 1 3 3v1" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* Aktif program */}
      {activeProgram && (
        <div className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div>
            <p className="text-xs text-emerald-500 font-medium mb-0.5">Aktif Program</p>
            <p className="font-semibold text-white">{(activeProgram as { title?: string }).title}</p>
            <p className="text-xs text-gray-500 mt-0.5">Hafta {(activeProgram as { currentWeek?: number }).currentWeek}</p>
          </div>
          <span className="text-3xl">🏃</span>
        </div>
      )}

      {/* Hazır programlar başlık */}
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Hazır Programlar</p>
        <div className="flex gap-2 flex-wrap mb-4">
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            className="w-36"
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
            className="w-36"
            options={[
              { value: '', label: 'Tüm Hedefler' },
              { value: 'strength', label: 'Kuvvet' },
              { value: 'hypertrophy', label: 'Kas Kitlesi' },
              { value: 'endurance', label: 'Dayanıklılık' },
              { value: 'weight_loss', label: 'Yağ Yakımı' },
            ]}
          />
        </div>
      </div>

      {/* Program kartları */}
      {programs?.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <span className="text-4xl">📋</span>
          <p className="mt-3">Bu kriterlere uygun program bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {programs?.map((program: Program) => (
            <div key={program.id} className="card p-4 hover:border-gray-700 transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge-${program.level}`}>
                  {LEVEL_LABELS[program.level]}
                </span>
                <span className="text-xs text-gray-500">{program.durationWeeks}h · {GOAL_LABELS[program.goal]}</span>
              </div>

              <h3 className="font-semibold text-white mb-1">{program.title}</h3>
              {program.description && (
                <p className="text-gray-500 text-xs mb-3 flex-1 line-clamp-2">{program.description}</p>
              )}

              <div className="flex gap-2 mt-auto pt-2">
                <Link to={`/programs/${program.id}`} className="btn-secondary flex-1 text-center text-xs py-1.5">
                  Detay
                </Link>
                {(activeProgram as { programId?: string } | null)?.programId === program.id ? (
                  <span className="flex-1 text-center text-xs py-1.5 rounded-xl font-semibold text-emerald-400"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ✓ Aktif
                  </span>
                ) : (
                  <button
                    onClick={() => enrollMutation.mutate(program.id)}
                    disabled={enrollMutation.isPending && enrollMutation.variables === program.id}
                    className="btn-primary flex-1 text-xs py-1.5"
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
