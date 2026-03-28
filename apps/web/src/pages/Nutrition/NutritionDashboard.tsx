import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/api/nutrition.api';
import { useSettings } from '@/hooks/useSettings';
import Select from '@/components/ui/Select';
import { format, addDays, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const MEAL_CONFIG = {
  breakfast: { label: 'Kahvaltı', icon: '🌅', color: '#f59e0b' },
  lunch:     { label: 'Öğle',     icon: '☀️',  color: '#f97316' },
  dinner:    { label: 'Akşam',    icon: '🌙',  color: '#6366f1' },
  snack:     { label: 'Ara Öğün', icon: '🍎',  color: '#22c55e' },
};

export default function NutritionDashboard() {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [servings, setServings] = useState('1');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['nutrition-summary', date],
    queryFn: () => nutritionApi.getSummary(date),
  });

  const { data: water } = useQuery({
    queryKey: ['water', date],
    queryFn: () => nutritionApi.getWater(date),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['food-search', searchQ],
    queryFn: () => nutritionApi.searchFoods(searchQ),
    enabled: searchQ.length >= 2,
  });

  const addLogMutation = useMutation({
    mutationFn: nutritionApi.addLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary', date] });
      setShowSearch(false);
      setSearchQ('');
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: nutritionApi.deleteLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition-summary', date] }),
  });

  const addWaterMutation = useMutation({
    mutationFn: nutritionApi.addWater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['water', date] }),
  });

  const waterTotal = (water as { totalMl?: number } | undefined)?.totalMl ?? 0;
  const waterGoal = settings.waterGoalMl;
  const isToday = date === new Date().toISOString().split('T')[0];

  const macros = [
    { key: 'totalCalories', label: 'Kalori',       unit: 'kcal', color: '#f97316', goal: settings.calorieGoal },
    { key: 'totalProtein',  label: 'Protein',      unit: 'g',    color: '#3b82f6', goal: settings.proteinGoal },
    { key: 'totalCarbs',    label: 'Karbonhidrat', unit: 'g',    color: '#f59e0b', goal: settings.carbsGoal },
    { key: 'totalFat',      label: 'Yağ',          unit: 'g',    color: '#ec4899', goal: settings.fatGoal },
  ] as const;

  const calories = Math.round((summary as Record<string, number> | undefined)?.totalCalories ?? 0);
  const calorieBalance = calories - settings.calorieGoal;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Beslenme</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isToday ? 'Bugün' : format(new Date(date + 'T12:00:00'), 'd MMMM', { locale: tr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(subDays(new Date(date + 'T12:00:00'), 1).toISOString().split('T')[0])}
            className="btn-secondary py-2 px-3">←</button>
          <span className="text-gray-400 text-sm font-medium min-w-[130px] text-center">
            {format(new Date(date + 'T12:00:00'), 'd MMMM yyyy', { locale: tr })}
          </span>
          <button onClick={() => setDate(addDays(new Date(date + 'T12:00:00'), 1).toISOString().split('T')[0])}
            disabled={isToday} className="btn-secondary py-2 px-3 disabled:opacity-30">→</button>
        </div>
      </div>

      {/* Calorie balance banner */}
      {calories > 0 && (
        <div className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: calorieBalance > 200 ? 'rgba(239,68,68,0.08)' : calorieBalance > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${calorieBalance > 200 ? 'rgba(239,68,68,0.2)' : calorieBalance > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
          }}>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Kalori Dengesi</p>
            <p className="font-bold text-white text-lg">
              {Math.abs(calorieBalance)} kcal {calorieBalance > 0 ? 'fazla' : 'açık'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Alınan</p>
            <p className="text-sm font-semibold text-white">{calories} / {settings.calorieGoal} kcal</p>
          </div>
        </div>
      )}

      {/* Macro cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {macros.map((m) => {
          const val = Math.round((summary as Record<string, number> | undefined)?.[m.key] ?? 0);
          const pct = m.goal > 0 ? Math.min((val / m.goal) * 100, 100) : 0;
          const isOver = m.goal > 0 && val > m.goal;
          return (
            <div key={m.key} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{m.label}</span>
                <span className="text-xs font-semibold" style={{ color: isOver ? '#ef4444' : m.color }}>
                  {isOver ? `+${val - m.goal}` : m.goal > 0 ? `${Math.round((1 - val/m.goal)*100)}% kaldı` : '—'}
                </span>
              </div>
              <p className="text-xl font-bold text-white mb-2">{val.toLocaleString()}</p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: isOver ? '#ef4444' : m.color }} />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">Hedef: {m.goal.toLocaleString()} {m.unit}</p>
            </div>
          );
        })}
      </div>

      {/* Water + Add meal */}
      <div className="flex gap-3 flex-wrap">
        <div className="card p-4 flex-1 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <span className="text-sm font-semibold text-white">Su Takibi</span>
            </div>
            <span className="text-xs font-medium text-blue-400">
              {(waterTotal / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((waterTotal / waterGoal) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              }} />
          </div>
          <div className="flex gap-1.5">
            {[150, 250, 330, 500].map((ml) => (
              <button key={ml}
                onClick={() => addWaterMutation.mutate({ loggedAt: date, amountMl: ml })}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all text-blue-400 hover:text-white"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                +{ml >= 1000 ? `${ml/1000}L` : `${ml}`}
              </button>
            ))}
          </div>
          {waterTotal >= waterGoal && (
            <p className="text-xs text-center mt-2 text-blue-400">🎉 Günlük su hedefine ulaştın!</p>
          )}
        </div>

        <button onClick={() => setShowSearch(!showSearch)}
          className="card p-4 flex flex-col items-center justify-center gap-2 w-36 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all shrink-0"
          style={{ border: showSearch ? '1px solid rgba(249,115,22,0.3)' : undefined }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(249,115,22,0.1)' }}>
            {showSearch ? '✕' : '+'}
          </div>
          <span className="text-xs font-medium text-gray-400">{showSearch ? 'Kapat' : 'Öğün Ekle'}</span>
        </button>
      </div>

      {/* Food search panel */}
      {showSearch && (
        <div className="card p-5 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                className="w-4 h-4 absolute left-3 inset-y-0 my-auto text-gray-600 pointer-events-none">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input className="input pl-9" placeholder="Gıda ara (tavuk, yulaf, elma...)"
                value={searchQ} onChange={(e) => setSearchQ(e.target.value)} autoFocus />
            </div>
            <Select
              value={selectedMeal} onChange={setSelectedMeal}
              className="w-36 text-sm"
              options={Object.entries(MEAL_CONFIG).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))}
            />
            <div className="relative w-20">
              <input type="number" className="input text-sm text-center" placeholder="Porsiyon"
                value={servings} onChange={(e) => setServings(e.target.value)} min="0.1" step="0.5" />
            </div>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {searchResults.map((food) => (
                <button key={food.id}
                  onClick={() => addLogMutation.mutate({ foodId: food.id, loggedAt: date, mealType: selectedMeal, servings: parseFloat(servings) || 1 })}
                  disabled={addLogMutation.isPending}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{food.name}</p>
                    {food.brand && <p className="text-xs text-gray-600">{food.brand}</p>}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-bold text-orange-400">{food.calories} kcal</p>
                    <p className="text-xs text-gray-600">P:{food.proteinG}g K:{food.carbsG}g Y:{food.fatG}g</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    className="w-4 h-4 text-gray-600 hover:text-orange-400 ml-3 transition-colors shrink-0">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
            </div>
          )}
          {searchQ.length >= 2 && (!searchResults || searchResults.length === 0) && (
            <p className="text-center text-sm text-gray-600 py-4">Sonuç bulunamadı</p>
          )}
        </div>
      )}

      {/* Meal groups */}
      <div className="space-y-4">
        {Object.entries(MEAL_CONFIG).map(([mealKey, mealConf]) => {
          const logs = summary?.logs?.filter((l) => l.mealType === mealKey) ?? [];
          if (logs.length === 0) return null;
          const mealCal = logs.reduce((s, l) => s + l.calculatedCalories, 0);

          return (
            <div key={mealKey} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${mealConf.color}15`, border: `1px solid ${mealConf.color}25` }}>
                    {mealConf.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{mealConf.label}</p>
                    <p className="text-xs text-gray-600">{logs.length} öğe</p>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: mealConf.color }}>
                  {Math.round(mealCal)} kcal
                </span>
              </div>

              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div key={log.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl group"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">
                        {log.foodName ?? log.food?.name ?? 'Bilinmeyen gıda'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{log.servings} porsiyon</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-400">{Math.round(log.calculatedCalories)} kcal</p>
                        <p className="text-xs text-gray-600">
                          P:{Math.round(log.calculatedProtein)}g · K:{Math.round(log.calculatedCarbs)}g · Y:{Math.round(log.calculatedFat)}g
                        </p>
                      </div>
                      <button onClick={() => deleteLogMutation.mutate(log.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-gray-600 hover:text-red-400 hover:bg-red-500/10">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!isLoading && (!summary?.logs || summary.logs.length === 0) && (
          <div className="card text-center py-14">
            <p className="text-4xl mb-3">🥗</p>
            <p className="text-gray-400 font-medium">
              {isToday ? 'Bugün henüz öğün eklenmedi' : 'Bu gün için kayıt yok'}
            </p>
            {isToday && (
              <button onClick={() => setShowSearch(true)} className="btn-primary mt-4 text-sm">
                + Öğün Ekle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
