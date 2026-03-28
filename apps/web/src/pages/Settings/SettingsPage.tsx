import { useState } from 'react';
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
  { value: 1.2,   label: 'Hareketsiz',  desc: 'Masa başı iş, egzersiz yok' },
  { value: 1.375, label: 'Az Aktif',    desc: 'Haftada 1-3 gün hafif egzersiz' },
  { value: 1.55,  label: 'Orta Aktif',  desc: 'Haftada 3-5 gün orta egzersiz' },
  { value: 1.725, label: 'Çok Aktif',   desc: 'Haftada 6-7 gün ağır egzersiz' },
  { value: 1.9,   label: 'Ekstra Aktif',desc: 'Günde 2 antrenman veya fiziksel iş' },
];

const GOALS_CALC = [
  { value: 'lose',     label: 'Yağ Yak',   multiplier: 0.80, color: '#3b82f6' },
  { value: 'maintain', label: 'Kilo Koru', multiplier: 1.00, color: '#4ade80' },
  { value: 'gain',     label: 'Kas Kazan', multiplier: 1.10, color: '#f97316' },
];

// ISSN & Morton 2018 meta-analiz kaynaklı — kg başına gram
const PROTEIN_PER_KG: Record<string, number> = {
  lose:     2.4,  // ISSN: 2.3–3.1 g/kg (kas koruma için yüksek tutulur)
  maintain: 1.8,  // ISSN: 1.6–2.0 g/kg aktif bireyler
  gain:     2.2,  // Morton 2018 meta-analiz: 2.0–2.4 g/kg
};
const FAT_MIN_PER_KG = 0.8; // Hormon sağlığı için minimum (araştırma konsensüsü)

export default function SettingsPage() {
  const { settings, save } = useSettings();
  const { user } = useAuth();
  const [local, setLocal] = useState({ ...settings });

  // Kalori hesaplayıcı state — SettingsPage içinde, local ile aynı scope
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(25);
  const [calcWeight, setCalcWeight] = useState(settings.weightKg);
  const [calcHeight, setCalcHeight] = useState(settings.heightCm);
  const [activityLevel, setActivityLevel] = useState(1.55);
  const [calcGoal, setCalcGoal] = useState<'lose' | 'maintain' | 'gain'>('gain');
  const [targetWeight, setTargetWeight] = useState(settings.weightKg);

  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  // Kalori hesabı — ISSN & Mifflin-St Jeor (2024 bilimsel standartları)
  const calcResult = (() => {
    const current = calcWeight;
    const target  = calcGoal !== 'maintain' && targetWeight > 0 ? targetWeight : calcWeight;
    const h = calcHeight;
    if (!current || !h || !age) return null;

    // Mifflin-St Jeor BMR — hedef kiloya göre
    const bmr = gender === 'male'
      ? 10 * target + 6.25 * h - 5 * age + 5
      : 10 * target + 6.25 * h - 5 * age - 161;

    const tdee = Math.round(bmr * activityLevel);
    const goalDef = GOALS_CALC.find((g) => g.value === calcGoal)!;
    const dailyCalories = Math.round(tdee * goalDef.multiplier);

    // Minimum kalori sınırları
    const minCal = gender === 'male' ? 1500 : 1200;
    const safeDailyCalories = Math.max(dailyCalories, minCal);

    // Protein: ISSN aralığı — 1.6g/kg (min) ile 2.2g/kg (max) arası
    const proteinMin = Math.round(1.6 * target);
    const proteinMax = Math.round(2.2 * target);
    const protein = proteinMax; // uygulama için üst değer kullanılır
    // Yağ: minimum 0.8g/kg hormon sağlığı için — hedef kiloya göre
    const fat = Math.round(Math.max(FAT_MIN_PER_KG * target, safeDailyCalories * 0.20 / 9));
    // Karbonhidrat: kalan kaloriyi doldurur
    const carbKcal = safeDailyCalories - (protein * 4) - (fat * 9);
    const carbs = Math.max(0, Math.round(carbKcal / 4));

    // Hedefe ulaşma süresi: kalori farkı başına 7700 kcal = 1 kg yağ
    const caloricDelta = Math.abs(tdee - safeDailyCalories);
    const diff = target - current;
    let daysToGoal: number | null = null;
    if (calcGoal !== 'maintain' && Math.abs(diff) >= 0.5 && caloricDelta > 0) {
      daysToGoal = Math.round(Math.abs(diff) * 7700 / caloricDelta);
    }

    return { tdee, dailyCalories: safeDailyCalories, protein, proteinMin, proteinMax, carbs, fat, daysToGoal, goalColor: goalDef.color };
  })();

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
          <GoalInput label="Boy" value={local.heightCm}
            onChange={(v) => setLocal({ ...local, heightCm: v })}
            unit="cm" min={100} max={250} hint="BMI hesaplamak için gerekli" />
          <GoalInput label="Kilo" value={local.weightKg}
            onChange={(v) => setLocal({ ...local, weightKg: v })}
            unit="kg" min={30} max={300} step={0.1} hint="Mevcut ağırlığın" />
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
              <p className="text-xs text-gray-600 mt-2">{local.heightCm} cm / {local.weightKg} kg</p>
            </div>
          </div>
        )}
      </div>

      {/* Kalori Hesaplayıcı */}
      <div className="card space-y-5">
        <SectionTitle>Kalori Hesaplayıcı</SectionTitle>

        {(!calcWeight || !calcHeight) && (
          <p className="text-xs text-yellow-500 bg-yellow-500/10 rounded-lg px-3 py-2">
            Boy ve kilo bilgilerini yukarıdaki Profil bölümüne gir.
          </p>
        )}

        {/* Kilo ve Boy */}
        <div className="grid grid-cols-2 gap-4">
          <GoalInput label="Kilo" value={calcWeight} onChange={setCalcWeight}
            unit="kg" min={30} max={300} step={0.1} />
          <GoalInput label="Boy" value={calcHeight} onChange={setCalcHeight}
            unit="cm" min={100} max={250} />
        </div>

        {/* Cinsiyet */}
        <div>
          <label className="label">Cinsiyet</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((g) => (
              <button key={g} onClick={() => setGender(g)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  gender === g
                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                    : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600'
                }`}>
                {g === 'male' ? 'Erkek' : 'Kadın'}
              </button>
            ))}
          </div>
        </div>

        {/* Yaş */}
        <GoalInput label="Yaş" value={age} onChange={setAge} unit="yıl" min={10} max={100} />

        {/* Aktivite */}
        <div>
          <label className="label">Aktivite Seviyesi</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((a) => (
              <button key={a.value} onClick={() => setActivityLevel(a.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  activityLevel === a.value
                    ? 'bg-primary-500/10 border-primary-500/40 text-white'
                    : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600'
                }`}>
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
            {GOALS_CALC.map((g) => (
              <button key={g.value} onClick={() => setCalcGoal(g.value as typeof calcGoal)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border`}
                style={calcGoal === g.value
                  ? { background: `${g.color}25`, borderColor: `${g.color}60`, color: g.color }
                  : { background: 'transparent', borderColor: '#1f2937', color: '#6b7280' }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hedef kilo */}
        {calcGoal !== 'maintain' && (
          <GoalInput
            label="Hedef Kilo"
            value={targetWeight}
            onChange={setTargetWeight}
            unit="kg" min={30} max={300} step={0.5}
            hint={`Mevcut: ${calcWeight} kg`}
          />
        )}

        {/* Sonuç */}
        {calcResult && (
          <div className="rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hesaplama Sonucu</p>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-500">Günlük Kalori İhtiyacı</p>
                <p className="text-4xl font-bold mt-1" style={{ color: calcResult.goalColor }}>
                  {calcResult.dailyCalories.toLocaleString()}
                  <span className="text-base font-normal text-gray-500 ml-1">kcal</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Bazal metabolizma × aktivite = {calcResult.tdee} kcal/gün
                </p>
              </div>
              {calcResult.daysToGoal && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Hedefe Ulaşma</p>
                  <p className="text-2xl font-bold text-white mt-1">{calcResult.daysToGoal}</p>
                  <p className="text-xs text-gray-500">gün (~{Math.round(calcResult.daysToGoal / 7)} hafta)</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <p className="text-xs text-gray-500 mb-1">Protein</p>
                <p className="text-lg font-bold text-blue-400">{calcResult.proteinMin}–{calcResult.proteinMax}g</p>
                <p className="text-xs text-gray-600 mt-0.5">1.6–2.2g/kg</p>
              </div>
              <div className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
                <p className="text-xs text-gray-500 mb-1">Karbonhidrat</p>
                <p className="text-xl font-bold text-yellow-400">{calcResult.carbs}g</p>
                <p className="text-xs text-gray-600 mt-0.5">kalan kalori</p>
              </div>
              <div className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <p className="text-xs text-gray-500 mb-1">Yağ</p>
                <p className="text-xl font-bold text-pink-400">{calcResult.fat}g</p>
                <p className="text-xs text-gray-600 mt-0.5">≥{FAT_MIN_PER_KG}g/kg</p>
              </div>
            </div>

            <button
              onClick={() => setLocal((prev) => ({
                ...prev,
                calorieGoal: calcResult.dailyCalories,
                proteinGoal: calcResult.protein,
                carbsGoal: calcResult.carbs,
                fatGoal: calcResult.fat,
              }))}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: `${calcResult.goalColor}30`, border: `1px solid ${calcResult.goalColor}50` }}>
              Bu Değerleri Hedeflerime Uygula
            </button>
          </div>
        )}
      </div>

      {/* Nutrition Goals */}
      <div className="card space-y-5">
        <SectionTitle>Beslenme Hedefleri</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GoalInput label="Günlük Kalori" value={local.calorieGoal}
            onChange={(v) => setLocal({ ...local, calorieGoal: v })}
            unit="kcal" min={800} max={6000} hint="Kilo hedefine göre ayarla" />
          <GoalInput label="Protein" value={local.proteinGoal}
            onChange={(v) => setLocal({ ...local, proteinGoal: v })}
            unit="g" min={30} max={400} hint="Önerilen: vücut ağırlığının 1.6-2.2x" />
          <GoalInput label="Karbonhidrat" value={local.carbsGoal}
            onChange={(v) => setLocal({ ...local, carbsGoal: v })}
            unit="g" min={50} max={600} />
          <GoalInput label="Yağ" value={local.fatGoal}
            onChange={(v) => setLocal({ ...local, fatGoal: v })}
            unit="g" min={20} max={200} />
          <GoalInput label="Su" value={local.waterGoalMl}
            onChange={(v) => setLocal({ ...local, waterGoalMl: v })}
            unit="ml" min={500} max={8000} step={250} hint="Önerilen: 2000-3000 ml" />
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
        <GoalInput label="Haftalık Antrenman Hedefi" value={local.workoutsPerWeekGoal}
          onChange={(v) => setLocal({ ...local, workoutsPerWeekGoal: v })}
          unit="gün/hafta" min={1} max={7} hint="Her hafta kaç gün antrenman yapmak istiyorsun?" />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={() => save(local)} disabled={!isDirty}
          className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed">
          {isDirty ? 'Kaydet' : '✓ Kaydedildi'}
        </button>
        {isDirty && (
          <button onClick={() => setLocal({ ...settings })} className="btn-secondary">
            İptal
          </button>
        )}
      </div>
    </div>
  );
}
