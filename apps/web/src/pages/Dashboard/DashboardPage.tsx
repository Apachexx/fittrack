import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { workoutApi } from '@/api/workout.api';
import { nutritionApi } from '@/api/nutrition.api';
import { progressApi } from '@/api/progress.api';
import { programApi } from '@/api/program.api';
import { format, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Workout } from '@fittrack/shared';

function getStreak(workouts: Workout[]): number {
  if (!workouts?.length) return 0;
  const days = new Set(workouts.map((w) => new Date(w.startedAt).toISOString().split('T')[0]));
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let i = 0;
  while (true) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (days.has(dateStr)) {
      streak++;
      i++;
    } else if (i === 0 && dateStr === today) {
      i++; // today no workout yet, check yesterday
    } else {
      break;
    }
  }
  return streak;
}

function getThisWeekWorkouts(workouts: Workout[]) {
  return workouts.filter((w) => new Date(w.startedAt) >= new Date(Date.now() - 7 * 86400000));
}

function CalorieRing({
  value, goal, size = 80,
}: { value: number; goal: number; size?: number }) {
  const pct = Math.min(value / goal, 1);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const isOver = value > goal;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={isOver ? '#ef4444' : '#f97316'}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
    </svg>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const dur = workout.endedAt
    ? differenceInMinutes(new Date(workout.endedAt), new Date(workout.startedAt))
    : null;
  return (
    <Link to={`/workouts/${workout.id}`}
      className="card p-4 flex items-center gap-4 hover:border-white/[0.12] transition-all duration-150 group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
        style={{ background: 'rgba(249,115,22,0.1)' }}>
        💪
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200 truncate">{workout.name}</p>
        <p className="text-xs text-gray-600">
          {format(new Date(workout.startedAt), 'd MMM · HH:mm', { locale: tr })}
          {dur != null && dur > 0 && <span> · {dur}dk</span>}
        </p>
      </div>
      {workout.endedAt && (
        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          ✓
        </span>
      )}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
        className="w-4 h-4 text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all">
        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const today = new Date().toISOString().split('T')[0];

  const { data: workouts = [] } = useQuery({ queryKey: ['workouts'], queryFn: workoutApi.list });
  const { data: nutrition } = useQuery({
    queryKey: ['nutrition-summary', today],
    queryFn: () => nutritionApi.getSummary(today),
  });
  const { data: measurements } = useQuery({ queryKey: ['measurements'], queryFn: progressApi.getMeasurements });
  const { data: activeProgram } = useQuery({ queryKey: ['active-program'], queryFn: programApi.getActive });
  const { data: prs } = useQuery({ queryKey: ['personal-records'], queryFn: workoutApi.getPersonalRecords });

  const latestWeight = measurements?.[0];
  const thisWeekWorkouts = getThisWeekWorkouts(workouts);
  const streak = getStreak(workouts);
  const calories = Math.round(nutrition?.totalCalories ?? 0);
  const calorieGoal = settings.calorieGoal;
  const weeklyGoal = settings.workoutsPerWeekGoal;

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Gece geç saatler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const firstName = user?.name?.split(' ')[0] ?? '';

  const bmi =
    settings.heightCm > 0 && latestWeight?.weightKg
      ? (latestWeight.weightKg / Math.pow(settings.heightCm / 100, 2)).toFixed(1)
      : null;

  const bmiLabel = bmi
    ? parseFloat(bmi) < 18.5 ? { text: 'Zayıf', color: '#3b82f6' }
      : parseFloat(bmi) < 25 ? { text: 'Normal', color: '#22c55e' }
      : parseFloat(bmi) < 30 ? { text: 'Fazla Kilolu', color: '#f59e0b' }
      : { text: 'Obez', color: '#ef4444' }
    : null;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: tr })}
          </p>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, <span className="gradient-text">{firstName}</span> 👋
          </h1>
        </div>
        <Link to="/workouts/new" className="btn-primary flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Antrenman Başlat
        </Link>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Streak */}
        <div className="card p-5 flex flex-col gap-3 hover:border-white/[0.1] transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(245,158,11,0.15)', boxShadow: '0 4px 16px rgba(245,158,11,0.2)' }}>
            🔥
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">{streak} gün</p>
            <p className="text-xs text-gray-500 mt-0.5">Seri</p>
            <p className="text-xs text-gray-700 mt-0.5">
              {streak === 0 ? 'Bugün antrenman yap!' : streak === 1 ? 'Süreyi koru!' : 'Harika gidiyorsun!'}
            </p>
          </div>
        </div>

        {/* Weekly progress */}
        <div className="card p-5 flex flex-col gap-3 hover:border-white/[0.1] transition-all group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(249,115,22,0.15)', boxShadow: '0 4px 16px rgba(249,115,22,0.2)' }}>
              🏋️
            </div>
            <span className="text-xs text-gray-600">{thisWeekWorkouts.length}/{weeklyGoal} hafta</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">{thisWeekWorkouts.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Bu Hafta</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((thisWeekWorkouts.length / weeklyGoal) * 100, 100)}%`,
                background: thisWeekWorkouts.length >= weeklyGoal
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, #f97316, #ea580c)',
              }} />
          </div>
        </div>

        {/* Weight / BMI */}
        <div className="card p-5 flex flex-col gap-3 hover:border-white/[0.1] transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(59,130,246,0.15)', boxShadow: '0 4px 16px rgba(59,130,246,0.2)' }}>
            ⚖️
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {latestWeight?.weightKg ? `${latestWeight.weightKg} kg` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {latestWeight?.measuredAt
                ? format(new Date(latestWeight.measuredAt), 'd MMM', { locale: tr })
                : 'Ölçüm yok'}
            </p>
            {bmi && bmiLabel && (
              <p className="text-xs mt-0.5 font-medium" style={{ color: bmiLabel.color }}>
                BMI {bmi} · {bmiLabel.text}
              </p>
            )}
          </div>
        </div>

        {/* Active program */}
        <div className="card p-5 flex flex-col gap-3 hover:border-white/[0.1] transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(168,85,247,0.15)', boxShadow: '0 4px 16px rgba(168,85,247,0.2)' }}>
            📋
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {(activeProgram as { currentWeek?: number } | null)?.currentWeek
                ? `Hafta ${(activeProgram as { currentWeek: number }).currentWeek}`
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">
              {(activeProgram as { title?: string } | null)?.title ?? 'Program yok'}
            </p>
            {activeProgram && (
              <Link to="/programs" className="text-xs text-purple-400 hover:text-purple-300 mt-0.5 block">
                Görüntüle →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent workouts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-200">Son Antrenmanlar</h2>
            <Link to="/workouts" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
              Tümünü gör →
            </Link>
          </div>

          {workouts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">🏋️</p>
              <p className="text-gray-400 font-medium">Henüz antrenman yok</p>
              <p className="text-gray-600 text-sm mt-1">İlk antrenmana bugün başla</p>
              <Link to="/workouts/new" className="btn-primary mt-4 text-sm inline-flex">
                Antrenman Başlat
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {workouts.slice(0, 5).map((workout, i) => (
                <div key={workout.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <WorkoutCard workout={workout} />
                </div>
              ))}
              {workouts.length > 5 && (
                <Link to="/workouts"
                  className="block text-center py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  +{workouts.length - 5} daha
                </Link>
              )}
            </div>
          )}

          {/* PRs */}
          {prs && (prs as unknown[]).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <h2 className="text-base font-semibold text-gray-200">Kişisel Rekortlar</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(prs as Array<{ exerciseName?: string; exercise_name?: string; weightKg?: number; weight_kg?: string | number; reps?: number }>)
                  .slice(0, 4)
                  .map((pr, i) => (
                    <div key={i} className="card p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: 'rgba(234,179,8,0.15)' }}>
                        🏆
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 truncate">
                          {pr.exerciseName ?? pr.exercise_name}
                        </p>
                        <p className="text-sm font-bold text-white">
                          {parseFloat(String(pr.weightKg ?? pr.weight_kg ?? 0))} kg × {pr.reps} tekrar
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Calorie ring */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300">Günlük Kalori</h2>
              <Link to="/nutrition" className="text-xs text-orange-400 hover:text-orange-300">Ekle →</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <CalorieRing value={calories} goal={calorieGoal} size={76} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{Math.round((calories / calorieGoal) * 100)}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">{calories.toLocaleString()}</p>
                <p className="text-xs text-gray-500">/ {calorieGoal.toLocaleString()} kcal hedef</p>
                {calories > 0 && (
                  <p className="text-xs mt-1"
                    style={{ color: calories > calorieGoal ? '#ef4444' : '#22c55e' }}>
                    {calories > calorieGoal
                      ? `${(calories - calorieGoal).toLocaleString()} kcal fazla`
                      : `${(calorieGoal - calories).toLocaleString()} kcal kaldı`}
                  </p>
                )}
              </div>
            </div>

            {nutrition && nutrition.totalCalories > 0 && (
              <div className="mt-4 space-y-2.5">
                {[
                  { label: 'Protein', val: nutrition.totalProtein, goal: settings.proteinGoal, color: '#3b82f6' },
                  { label: 'Karbonhidrat', val: nutrition.totalCarbs, goal: settings.carbsGoal, color: '#f59e0b' },
                  { label: 'Yağ', val: nutrition.totalFat, goal: settings.fatGoal, color: '#ec4899' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{m.label}</span>
                      <span className="font-medium" style={{ color: m.color }}>
                        {Math.round(m.val)}g / {m.goal}g
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((m.val / m.goal) * 100, 100)}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Hızlı Erişim</h2>
            <div className="space-y-1.5">
              {[
                { to: '/workouts/new', icon: '🏋️', label: 'Antrenman Başlat', desc: 'Yeni seans' },
                { to: '/nutrition', icon: '🍎', label: 'Öğün Ekle', desc: 'Kalori takibi' },
                { to: '/progress', icon: '📏', label: 'Ölçüm Kaydet', desc: 'Kilo & vücut' },
                { to: '/programs', icon: '📋', label: 'Programlar', desc: 'Hazır planlar' },
              ].map(({ to, icon, label, desc }) => (
                <Link key={to} to={to}
                  className="card p-3.5 flex items-center gap-3 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-150 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: 'rgba(249,115,22,0.08)' }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300">{label}</p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
