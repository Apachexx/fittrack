import { useState, useEffect, useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
      <span className="w-4 h-px bg-gray-700 flex-shrink-0" />
      {children}
      <span className="flex-1 h-px bg-gray-800" />
    </h2>
  );
}

function GoalInput({
  label, value, onChange, unit, min, max, step, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  unit: string; min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type="number"
          className="input pr-14"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step ?? 1}
          placeholder="0"
        />
        <span className="absolute right-4 inset-y-0 flex items-center text-xs text-gray-500 pointer-events-none">
          {unit}
        </span>
      </div>
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Zayıf', color: '#60a5fa' };
  if (bmi < 25) return { label: 'Normal', color: '#4ade80' };
  if (bmi < 30) return { label: 'Fazla Kilolu', color: '#facc15' };
  return { label: 'Obez', color: '#f87171' };
}

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: 'Hareketsiz',        desc: 'Masa başı iş, egzersiz yok' },
  { value: 1.375, label: 'Az Aktif',           desc: 'Haftada 1-3 gün hafif egzersiz' },
  { value: 1.55,  label: 'Orta Aktif',         desc: 'Haftada 3-5 gün orta egzersiz' },
  { value: 1.725, label: 'Çok Aktif',          desc: 'Haftada 6-7 gün ağır egzersiz' },
  { value: 1.9,   label: 'Ekstra Aktif',       desc: 'Günde 2 antrenman veya fiziksel iş' },
];

const GOALS = [
  { value: 'lose',     label: 'Yağ Yak',       delta: -500, color: '#3b82f6' },
  { value: 'maintain', label: 'Kilo Koru',      delta: 0,    color: '#4ade80' },
  { value: 'gain',     label: 'Kas Kazan',      delta: 300,  color: '#f97316' },
];

const MACRO_RATIOS: Record<string, { p: number; c: number; f: number }> = {
  lose:     { p: 0.35, c: 0.35, f: 0.30 },
  maintain: { p: 0.25, c: 0.45, f: 0.30 },
  gain:     { p: 0.30, c: 0.45, f: 0.25 },
};

interface CalcState {
  gender: 'male' | 'female';
  age: number;
  activityLevel: number;
  goal: 'lose' | 'maintain' | 'gain';
  targetWeight: number;
}

function CalorieCalculator({
  weightKg,
  heightCm,
  onApply,
}: {
  weightKg: number;
  heightCm: number;
  onApply: (calories: number, protein: number, carbs: number, fat: number) => void;
}) {
  const [calc, setCalc] = useState<CalcState>({
    gender: 'male',
    age: 25,
    activityLevel: 1.55,
    goal: 'gain',
    targetWeight: weightKg || 0,
  });

  // weightKg prop değişince targetWeight'i güncelle
  useEffect(() => {
    if (weightKg > 0) {
      setCalc((prev) => ({ ...prev, targetWeight: weightKg }));
    }
  }, [weightKg]);

  const result = useMemo(() => {
    if (!weightKg || !heightCm || !calc.age) return null;

    // Mifflin-St Jeor BMR
    const bmr =
      calc.gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * calc.age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * calc.age - 161;

    const tdee = Math.round(bmr * calc.activityLevel);
    const goalDef = GOALS.find((g) => g.value === calc.goal)!;
    const dailyCalories = tdee + goalDef.delta;

    const ratios = MACRO_RATIOS[calc.goal];
    const protein = Math.round((dailyCalories * ratios.p) / 4);
    const carbs   = Math.round((dailyCalories * ratios.c) / 4);
    const fat     = Math.round((dailyCalories * ratios.f) / 9);

    let daysToGoal: number | null = null;
    const diff = calc.targetWeight - weightKg;
    if (calc.goal !== 'maintain' && Math.abs(diff) >= 0.5 && Math.abs(goalDef.delta) > 0) {
      daysToGoal = Math.round(Math.abs((diff * 7700) / goalDef.delta));
    }

    return { tdee, dailyCalories, protein, carbs, fat, daysToGoal, goalColor: goalDef.color };
  }, [weightKg, heightCm, calc]);

  return (
    <div className="card space-y-5">
      <SectionTitle>Kalori Hesaplayıcı</SectionTitle>

      {(!weightKg || !heightCm) && (
        <p className="text-xs text-yellow-500 bg-yellow-500/10 rounded-lg px-3 py-2">
          Boy ve kilo bilgilerini yukarıdaki Profil bölümüne gir.
        </p>
      )}

      {/* Cinsiyet */}
      <div>
        <label className="label">Cinsiyet</label>
        <div className="flex gap-2">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setCalc({ ...calc, gender: g })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                calc.gender === g
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
            >
              {g === 'male' ? 'Erkek' : 'Kadın'}
            </button>
          ))}
        </div>
      </div>

      {/* Yaş */}
      <GoalInput
        label="Yaş"
        value={calc.age}
        onChange={(v) => setCalc({ ...calc, age: v })}
        unit="yıl"
        min={10}
        max={100}
      />

      {/* Aktivite seviyesi */}
      <div>
        <label className="label">Aktivite Seviyesi</label>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.value}
              onClick={() => setCalc({ ...calc, activityLevel: a.value })}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                calc.activityLevel === a.value
                  ? 'bg-primary-500/10 border-primary-500/40 text-white'
                  : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="font-medium text-sm">{a.label}</span>
              <span className="text-xs text-gray-500 ml-2">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hedef */}
      <div>
        <label className="label">Hedef</label>
        <div className="flex gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => setCalc({ ...calc, goal: g.value as CalcState['goal'] })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                calc.goal === g.value
                  ? 'border-transparent text-white'
                  : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
              style={calc.goal === g.value ? { background: `${g.color}25`, borderColor: `${g.color}60`, color: g.color } : {}}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hedef kilo */}
      {calc.goal !== 'maintain' && (
        <GoalInput
          label={calc.goal === 'lose' ? 'Hedef Kilo' : 'Hedef Kilo'}
          value={calc.targetWeight}
          onChange={(v) => setCalc({ ...calc, targetWeight: v })}
          unit="kg"
          min={30}
          max={300}
          step={0.5}
          hint={
            calc.goal === 'lose'
              ? `Mevcut: ${weightKg} kg → Vermek istediğin kilo`
              : `Mevcut: ${weightKg} kg → Almak istediğin kilo`
          }
        />
      )}

      {/* Sonuç */}
      {result && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hesaplama Sonucu</p>

          {/* Kalori */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">Günlük Kalori İhtiyacı</p>
              <p className="text-4xl font-bold mt-1" style={{ color: result.goalColor }}>
                {result.dailyCalories.toLocaleString()}
                <span className="text-base font-normal text-gray-500 ml-1">kcal</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">Bazal metabolizma × aktivite = {result.tdee} kcal/gün</p>
            </div>
            {result.daysToGoal && calc.targetWeight !== weightKg && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Hedefe Ulaşma</p>
                <p className="text-2xl font-bold text-white mt-1">{result.daysToGoal}</p>
                <p className="text-xs text-gray-500">gün (~{Math.round(result.daysToGoal / 7)} hafta)</p>
              </div>
            )}
          </div>

          {/* Makrolar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <p className="text-xs text-gray-500 mb-1">Protein</p>
              <p className="text-xl font-bold text-blue-400">{result.protein}g</p>
              <p className="text-xs text-gray-600 mt-0.5">{Math.round(MACRO_RATIOS[calc.goal].p * 100)}%</p>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
              <p className="text-xs text-gray-500 mb-1">Karbonhidrat</p>
              <p className="text-xl font-bold text-yellow-400">{result.carbs}g</p>
              <p className="text-xs text-gray-600 mt-0.5">{Math.round(MACRO_RATIOS[calc.goal].c * 100)}%</p>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <p className="text-xs text-gray-500 mb-1">Yağ</p>
              <p className="text-xl font-bold text-pink-400">{result.fat}g</p>
              <p className="text-xs text-gray-600 mt-0.5">{Math.round(MACRO_RATIOS[calc.goal].f * 100)}%</p>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => onApply(result.dailyCalories, result.protein, result.carbs, result.fat)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: `${result.goalColor}30`, border: `1px solid ${result.goalColor}50` }}
          >
            Bu Değerleri Hedeflerime Uygula
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, save } = useSettings();
  const { user } = useAuth();
  const [local, setLocal] = useState({ ...settings });

  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  function handleSave() {
    save(local);
  }

  function handleApplyCalc(calories: number, protein: number, carbs: number, fat: number) {
    setLocal((prev) => ({ ...prev, calorieGoal: calories, proteinGoal: protein, carbsGoal: carbs, fatGoal: fat }));
  }

  const bmi =
    local.heightCm > 0 && local.weightKg > 0
      ? parseFloat((local.weightKg / Math.pow(local.heightCm / 100, 2)).toFixed(1))
      : null;

  const bmiCategory = bmi ? getBmiCategory(bmi) : null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Ayarlar</h1>
        <p className="text-gray-500 mt-1 text-sm">Hedeflerini ve tercihlerini yönet</p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <SectionTitle>Profil</SectionTitle>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(244,63,94,0.2))', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GoalInput
            label="Boy"
            value={local.heightCm}
            onChange={(v) => setLocal({ ...local, heightCm: v })}
            unit="cm"
            min={100}
            max={250}
            hint="BMI hesaplamak için gerekli"
          />
          <GoalInput
            label="Kilo"
            value={local.weightKg}
            onChange={(v) => setLocal({ ...local, weightKg: v })}
            unit="kg"
            min={30}
            max={300}
            step={0.1}
            hint="Mevcut ağırlığın"
          />
        </div>

        {bmi && bmiCategory && (
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Vücut Kitle İndeksi (BMI)</p>
              <p className="text-3xl font-bold mt-1" style={{ color: bmiCategory.color }}>{bmi}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: `${bmiCategory.color}18`, color: bmiCategory.color }}>
                {bmiCategory.label}
              </span>
              <p className="text-xs text-gray-600 mt-2">
                {local.heightCm} cm / {local.weightKg} kg
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Calorie Calculator */}
      <CalorieCalculator
        weightKg={local.weightKg}
        heightCm={local.heightCm}
        onApply={handleApplyCalc}
      />

      {/* Nutrition Goals */}
      <div className="card space-y-5">
        <SectionTitle>Beslenme Hedefleri</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GoalInput
            label="Günlük Kalori"
            value={local.calorieGoal}
            onChange={(v) => setLocal({ ...local, calorieGoal: v })}
            unit="kcal"
            min={800}
            max={6000}
            hint="Kilo hedefine göre ayarla"
          />
          <GoalInput
            label="Protein"
            value={local.proteinGoal}
            onChange={(v) => setLocal({ ...local, proteinGoal: v })}
            unit="g"
            min={30}
            max={400}
            hint="Önerilen: vücut ağırlığının 1.6-2.2x"
          />
          <GoalInput
            label="Karbonhidrat"
            value={local.carbsGoal}
            onChange={(v) => setLocal({ ...local, carbsGoal: v })}
            unit="g"
            min={50}
            max={600}
          />
          <GoalInput
            label="Yağ"
            value={local.fatGoal}
            onChange={(v) => setLocal({ ...local, fatGoal: v })}
            unit="g"
            min={20}
            max={200}
          />
          <GoalInput
            label="Su"
            value={local.waterGoalMl}
            onChange={(v) => setLocal({ ...local, waterGoalMl: v })}
            unit="ml"
            min={500}
            max={8000}
            step={250}
            hint="Önerilen: 2000-3000 ml"
          />
        </div>

        {local.calorieGoal > 0 && (
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.12)' }}>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Makro Dağılımı</p>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">
                Protein: <span className="text-blue-400 font-semibold">{Math.round((local.proteinGoal * 4 / local.calorieGoal) * 100)}%</span>
              </span>
              <span className="text-gray-400">
                Karb: <span className="text-yellow-400 font-semibold">{Math.round((local.carbsGoal * 4 / local.calorieGoal) * 100)}%</span>
              </span>
              <span className="text-gray-400">
                Yağ: <span className="text-pink-400 font-semibold">{Math.round((local.fatGoal * 9 / local.calorieGoal) * 100)}%</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Workout Goals */}
      <div className="card space-y-5">
        <SectionTitle>Antrenman Hedefleri</SectionTitle>
        <GoalInput
          label="Haftalık Antrenman Hedefi"
          value={local.workoutsPerWeekGoal}
          onChange={(v) => setLocal({ ...local, workoutsPerWeekGoal: v })}
          unit="gün/hafta"
          min={1}
          max={7}
          hint="Her hafta kaç gün antrenman yapmak istiyorsun?"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDirty ? 'Kaydet' : '✓ Kaydedildi'}
        </button>
        {isDirty && (
          <button
            onClick={() => setLocal({ ...settings })}
            className="btn-secondary"
          >
            İptal
          </button>
        )}
      </div>
    </div>
  );
}
