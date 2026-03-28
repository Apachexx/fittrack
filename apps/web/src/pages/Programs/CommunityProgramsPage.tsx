import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { programApi } from '@/api/program.api';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const GOAL_LABELS: Record<string, string> = {
  strength: 'Kuvvet',
  hypertrophy: 'Kas Kitlesi',
  endurance: 'Dayanıklılık',
  weight_loss: 'Yağ Yakımı',
};

const GOAL_COLORS: Record<string, string> = {
  strength: 'rgba(239,68,68,0.15)',
  hypertrophy: 'rgba(249,115,22,0.15)',
  endurance: 'rgba(34,197,94,0.15)',
  weight_loss: 'rgba(59,130,246,0.15)',
};

export default function CommunityProgramsPage() {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['community-programs'],
    queryFn: programApi.getCommunity,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Programlar
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-white">Topluluk Programları</h1>
        <p className="text-sm text-gray-400 mt-0.5">Kullanıcıların paylaştığı programlar</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (!programs || programs.length === 0) && (
        <div className="card text-center py-12">
          <p className="text-gray-400">Henüz paylaşılan program yok.</p>
          <p className="text-gray-500 text-sm mt-1">Kendi programını oluşturup herkesle paylaşabilirsin!</p>
          <Link to="/programs/create" className="btn-primary mt-4 inline-block px-6 py-2">
            Program Oluştur
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {programs?.map((p) => (
          <Link
            key={p.id}
            to={`/programs/${p.id}`}
            className="block rounded-2xl p-4 border border-gray-800 hover:border-primary-500/40 transition-all"
            style={{ background: GOAL_COLORS[p.goal] ?? 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{p.title}</p>
                <p className="text-sm text-primary-400 mt-0.5">
                  {p.creator_name ?? 'Anonim'}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 mt-1">
                {LEVEL_LABELS[p.level] ?? p.level}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>{GOAL_LABELS[p.goal] ?? p.goal}</span>
              <span>•</span>
              <span>{p.day_count} gün/hafta</span>
              <span>•</span>
              <span>{p.exercise_count} egzersiz</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
