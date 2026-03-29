import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/api/nutrition.api';
import { useSettings } from '@/hooks/useSettings';
import { format, addDays, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

/* ─────────────────────────────────────────── constants ── */
const MEAL_CFG = {
  breakfast: { label: 'Kahvaltı',      icon: '🌅', color: '#f59e0b' },
  lunch:     { label: 'Öğle Yemeği',  icon: '☀️',  color: '#f97316' },
  dinner:    { label: 'Akşam Yemeği', icon: '🌙',  color: '#818cf8' },
  snack:     { label: 'Ara Öğün',     icon: '🍎',  color: '#22c55e' },
} as const;

type MealKey = keyof typeof MEAL_CFG;

/* ─────────────────────────────────────────── CalorieRing ── */
function CalorieRing({ calories, goal }: { calories: number; goal: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(calories / goal, 1) : 0;
  const isOver = calories > goal;
  const color = isOver ? '#ef4444' : pct > 0.9 ? '#f59e0b' : '#f97316';
  const remaining = Math.max(goal - calories, 0);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
          <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={9}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-white leading-tight">{remaining.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">kcal kaldı</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {calories.toLocaleString()} / {goal.toLocaleString()} kcal
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────── MacroBar ── */
function MacroBar({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const isOver = value > goal;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium" style={{ color: isOver ? '#ef4444' : color }}>
          {Math.round(value)}{unit}
          <span className="text-gray-600 font-normal"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, background: isOver ? '#ef4444' : color }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── FoodSearchModal ── */
interface SearchModalProps {
  date: string;
  initialMeal: MealKey;
  onClose: () => void;
  onAdded: () => void;
}

function FoodSearchModal({ date, initialMeal, onClose, onAdded }: SearchModalProps) {
  const queryClient = useQueryClient();
  const [meal, setMeal] = useState<MealKey>(initialMeal);
  const [q, setQ] = useState('');
  const [servingsMap, setServingsMap] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '100', unit: 'g' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn); }, [onClose]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['food-search', q],
    queryFn: () => nutritionApi.searchFoods(q),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });

  const addLogMutation = useMutation({
    mutationFn: nutritionApi.addLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary', date] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-history'] });
      onAdded();
    },
  });

  const createFoodMutation = useMutation({
    mutationFn: nutritionApi.createCustomFood,
    onSuccess: (food) => {
      addLogMutation.mutate({ foodId: food.id, loggedAt: date, mealType: meal, servings: 1 });
      setShowCustom(false);
      setCustom({ name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '100', unit: 'g' });
    },
  });

  function addFood(foodId: string) {
    const s = parseFloat(servingsMap[foodId] ?? '1') || 1;
    addLogMutation.mutate({ foodId, loggedAt: date, mealType: meal, servings: s });
  }

  function submitCustom() {
    if (!custom.name || !custom.calories) return;
    createFoodMutation.mutate({
      name: custom.name,
      calories: parseFloat(custom.calories) || 0,
      proteinG: parseFloat(custom.protein) || 0,
      carbsG: parseFloat(custom.carbs) || 0,
      fatG: parseFloat(custom.fat) || 0,
      servingSize: parseFloat(custom.servingSize) || 100,
      servingUnit: custom.unit,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#0c1420', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '88vh' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-white flex-1">Gıda Ekle</h2>
        <button onClick={() => setShowCustom(!showCustom)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{ background: showCustom ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.06)', color: showCustom ? '#fb923c' : '#9ca3af' }}>
          {showCustom ? 'Kapat' : '+ Özel Gıda'}
        </button>
      </div>

      {/* Meal tabs */}
      <div className="flex gap-1 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(Object.entries(MEAL_CFG) as [MealKey, typeof MEAL_CFG[MealKey]][]).map(([k, v]) => (
          <button key={k} onClick={() => setMeal(k)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={meal === k
              ? { background: `${v.color}20`, color: v.color, border: `1px solid ${v.color}40` }
              : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid transparent' }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Custom food form */}
        {showCustom && (
          <div className="p-4 border-b border-white/[0.06]" style={{ background: 'rgba(249,115,22,0.04)' }}>
            <p className="text-sm font-semibold text-orange-400 mb-3">Özel Gıda Oluştur</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className="input text-sm col-span-2" placeholder="Gıda adı *" value={custom.name}
                onChange={(e) => setCustom((p) => ({ ...p, name: e.target.value }))} />
              <input className="input text-sm" placeholder="Kalori (kcal) *" type="number" value={custom.calories}
                onChange={(e) => setCustom((p) => ({ ...p, calories: e.target.value }))} />
              <input className="input text-sm" placeholder="Protein (g)" type="number" value={custom.protein}
                onChange={(e) => setCustom((p) => ({ ...p, protein: e.target.value }))} />
              <input className="input text-sm" placeholder="Karbonhidrat (g)" type="number" value={custom.carbs}
                onChange={(e) => setCustom((p) => ({ ...p, carbs: e.target.value }))} />
              <input className="input text-sm" placeholder="Yağ (g)" type="number" value={custom.fat}
                onChange={(e) => setCustom((p) => ({ ...p, fat: e.target.value }))} />
              <input className="input text-sm" placeholder="Porsiyon boyutu" type="number" value={custom.servingSize}
                onChange={(e) => setCustom((p) => ({ ...p, servingSize: e.target.value }))} />
              <select className="input text-sm" value={custom.unit}
                onChange={(e) => setCustom((p) => ({ ...p, unit: e.target.value }))}>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="adet">adet</option>
              </select>
            </div>
            <button onClick={submitCustom} disabled={!custom.name || !custom.calories || createFoodMutation.isPending}
              className="btn-primary w-full text-sm py-2">
              {createFoodMutation.isPending ? 'Ekleniyor...' : 'Oluştur ve Ekle'}
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-4 sticky top-0 z-10" style={{ background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="w-4 h-4 absolute left-3 inset-y-0 my-auto text-gray-500 pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input ref={inputRef} className="input pl-9 text-sm" placeholder="Gıda ara... (tavuk, yulaf, elma)"
              value={q} onChange={(e) => setQ(e.target.value)} />
            {isFetching && <div className="absolute right-3 inset-y-0 my-auto w-3.5 h-3.5 rounded-full border border-orange-500 border-t-transparent animate-spin" />}
          </div>
        </div>

        {/* Results */}
        <div className="px-4 pb-6 space-y-1.5">
          {q.length < 2 && (
            <div className="text-center py-12 text-gray-600">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">En az 2 karakter gir</p>
            </div>
          )}

          {q.length >= 2 && results.length === 0 && !isFetching && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🥲</p>
              <p className="text-sm text-gray-500">"{q}" için sonuç bulunamadı</p>
              <button onClick={() => setShowCustom(true)} className="mt-3 text-sm text-orange-400 hover:underline">
                Özel gıda oluştur →
              </button>
            </div>
          )}

          {results.map((food) => (
            <div key={food.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{food.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  <span className="text-orange-400 font-semibold">{food.calories} kcal</span>
                  {' · '}P:{food.proteinG}g K:{food.carbsG}g Y:{food.fatG}g
                  <span className="text-gray-700"> / {food.servingSize}{food.servingUnit}</span>
                </p>
              </div>
              <input
                type="number" min="0.1" step="0.5"
                value={servingsMap[food.id] ?? '1'}
                onChange={(e) => setServingsMap((p) => ({ ...p, [food.id]: e.target.value }))}
                className="w-16 text-center text-sm rounded-lg py-1.5 bg-white/5 border border-white/10 text-white"
                title="Porsiyon sayısı"
              />
              <button onClick={() => addFood(food.id)} disabled={addLogMutation.isPending}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all shrink-0"
                style={{ background: MEAL_CFG[meal].color + '20', border: `1px solid ${MEAL_CFG[meal].color}40` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={MEAL_CFG[meal].color} strokeWidth={2.5} className="w-4 h-4">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── Main Page ── */
export default function NutritionDashboard() {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchModal, setSearchModal] = useState<{ open: boolean; meal: MealKey }>({ open: false, meal: 'lunch' });
  const [customWater, setCustomWater] = useState('');

  const isToday = date === new Date().toISOString().split('T')[0];

  const { data: summary, isLoading } = useQuery({
    queryKey: ['nutrition-summary', date],
    queryFn: () => nutritionApi.getSummary(date),
  });

  const { data: water } = useQuery({
    queryKey: ['water', date],
    queryFn: () => nutritionApi.getWater(date),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['nutrition-history'],
    queryFn: () => nutritionApi.getWeeklyHistory(7),
    staleTime: 5 * 60_000,
  });

  const deleteLogMutation = useMutation({
    mutationFn: nutritionApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary', date] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-history'] });
    },
  });

  const addWaterMutation = useMutation({
    mutationFn: nutritionApi.addWater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['water', date] }),
  });

  const calories  = Math.round((summary as Record<string, number> | undefined)?.totalCalories ?? 0);
  const protein   = Math.round((summary as Record<string, number> | undefined)?.totalProtein ?? 0);
  const carbs     = Math.round((summary as Record<string, number> | undefined)?.totalCarbs ?? 0);
  const fat       = Math.round((summary as Record<string, number> | undefined)?.totalFat ?? 0);
  const waterMl   = (water as { totalMl?: number } | undefined)?.totalMl ?? 0;
  const waterGoal = settings.waterGoalMl || 2500;

  // Build 7-day chart data — fill missing days with 0
  const chartData = (() => {
    const map = new Map((history as Array<{ date: string; calories: number }>).map((d) => [d.date, d.calories]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const iso = format(d, 'yyyy-MM-dd');
      return { day: format(d, 'EEE', { locale: tr }), calories: map.get(iso) ?? 0, iso };
    });
  })();

  function openSearch(meal: MealKey) { setSearchModal({ open: true, meal }); }
  function closeSearch() { setSearchModal((p) => ({ ...p, open: false })); }

  function addWater(ml: number) { addWaterMutation.mutate({ loggedAt: date, amountMl: ml }); }
  function addCustomWater() {
    const ml = parseInt(customWater);
    if (ml > 0) { addWater(ml); setCustomWater(''); }
  }

  return (
    <>
      {/* Food search modal */}
      {searchModal.open && (
        <FoodSearchModal
          date={date}
          initialMeal={searchModal.meal}
          onClose={closeSearch}
          onAdded={closeSearch}
        />
      )}

      <div className="space-y-5 max-w-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Beslenme</h1>
            <p className="text-sm text-gray-500">{isToday ? 'Bugün' : format(new Date(date + 'T12:00:00'), 'd MMMM yyyy', { locale: tr })}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setDate(subDays(new Date(date + 'T12:00:00'), 1).toISOString().split('T')[0])}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>‹</button>
            <span className="text-xs text-gray-400 min-w-[90px] text-center font-medium">
              {format(new Date(date + 'T12:00:00'), 'd MMM', { locale: tr })}
            </span>
            <button onClick={() => setDate(addDays(new Date(date + 'T12:00:00'), 1).toISOString().split('T')[0])}
              disabled={isToday}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)' }}>›</button>
          </div>
        </div>

        {/* ── Calorie overview ── */}
        <div className="card p-5">
          <div className="flex items-center gap-6">
            {isLoading
              ? <div className="w-[130px] h-[130px] rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              : <CalorieRing calories={calories} goal={settings.calorieGoal || 2000} />
            }
            <div className="flex-1 space-y-3">
              <MacroBar label="Protein" value={protein} goal={settings.proteinGoal || 150} unit="g" color="#3b82f6" />
              <MacroBar label="Karbonhidrat" value={carbs} goal={settings.carbsGoal || 250} unit="g" color="#f59e0b" />
              <MacroBar label="Yağ" value={fat} goal={settings.fatGoal || 65} unit="g" color="#ec4899" />
            </div>
          </div>

          {/* Deficit/Surplus tag */}
          {calories > 0 && (() => {
            const diff = calories - (settings.calorieGoal || 2000);
            const isOver = diff > 0;
            return (
              <div className="mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                style={{ background: isOver ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${isOver ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                <span style={{ color: isOver ? '#ef4444' : '#22c55e' }}>{isOver ? '▲' : '▼'}</span>
                <span style={{ color: isOver ? '#ef4444' : '#22c55e' }} className="font-semibold">
                  {Math.abs(diff)} kcal {isOver ? 'fazla' : 'açık'}
                </span>
                <span className="text-gray-600 ml-auto">Hedef: {(settings.calorieGoal || 2000).toLocaleString()} kcal</span>
              </div>
            );
          })()}
        </div>

        {/* ── Meal sections ── */}
        <div className="space-y-3">
          {(Object.entries(MEAL_CFG) as [MealKey, typeof MEAL_CFG[MealKey]][]).map(([mealKey, cfg]) => {
            const logs = summary?.logs?.filter((l) => l.mealType === mealKey) ?? [];
            const mealCal = logs.reduce((s, l) => s + l.calculatedCalories, 0);

            return (
              <div key={mealKey} className="card overflow-hidden">
                {/* Meal header */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: logs.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                      style={{ background: cfg.color + '15' }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{cfg.label}</p>
                      {mealCal > 0 && <p className="text-xs" style={{ color: cfg.color }}>{Math.round(mealCal)} kcal</p>}
                    </div>
                  </div>
                  <button onClick={() => openSearch(mealKey)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: cfg.color + '12', color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Ekle
                  </button>
                </div>

                {/* Food items */}
                {logs.length > 0 && (
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate">{log.foodName ?? 'Bilinmeyen gıda'}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {log.servings} porsiyon · P:{log.calculatedProtein}g K:{log.calculatedCarbs}g Y:{log.calculatedFat}g
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0" style={{ color: cfg.color }}>
                          {Math.round(log.calculatedCalories)} kcal
                        </p>
                        <button onClick={() => deleteLogMutation.mutate(log.id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-gray-600 hover:text-red-400 hover:bg-red-500/10 shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Water tracker ── */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <span className="text-sm font-semibold text-white">Su Takibi</span>
            </div>
            <span className="text-xs font-semibold text-blue-400">
              {(waterMl / 1000).toFixed(2).replace(/\.?0+$/, '')} / {(waterGoal / 1000).toFixed(1)} L
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((waterMl / waterGoal) * 100, 100)}%`, background: 'linear-gradient(90deg,#3b82f6,#06b6d4)' }} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[150, 200, 250, 330, 500].map((ml) => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex-1 min-w-[44px] py-2 rounded-lg text-xs font-medium transition-all text-blue-400 hover:text-white"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                +{ml}
              </button>
            ))}
            <div className="flex gap-1 flex-1 min-w-[100px]">
              <input type="number" placeholder="ml" value={customWater}
                onChange={(e) => setCustomWater(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomWater()}
                className="input text-xs text-center flex-1 py-2 min-w-0" />
              <button onClick={addCustomWater}
                className="px-2.5 py-2 rounded-lg text-xs text-blue-400 hover:text-white transition-all shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>+</button>
            </div>
          </div>
          {waterMl >= waterGoal && <p className="text-xs text-center mt-2 text-blue-400">🎉 Günlük su hedefine ulaştın!</p>}
        </div>

        {/* ── 7-day chart ── */}
        {chartData.some((d) => d.calories > 0) && (
          <div className="card p-4">
            <p className="text-sm font-semibold text-white mb-4">Son 7 Gün</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#0f1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Kalori']}
                />
                <ReferenceLine y={settings.calorieGoal || 2000} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 3" />
                <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.iso}
                      fill={d.iso === date ? '#f97316' : d.calories > (settings.calorieGoal || 2000) ? 'rgba(239,68,68,0.6)' : 'rgba(249,115,22,0.35)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-700 text-right mt-1">— hedef {(settings.calorieGoal || 2000).toLocaleString()} kcal</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!summary?.logs || summary.logs.length === 0) && (
          <div className="text-center py-8 text-gray-600 text-sm">
            {isToday ? 'Bugün henüz öğün eklenmedi · Yukarıdaki öğünlerden başla' : 'Bu gün için kayıt yok'}
          </div>
        )}

      </div>
    </>
  );
}
