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

export default function SettingsPage() {
  const { settings, save } = useSettings();
  const { user } = useAuth();
  const [local, setLocal] = useState({ ...settings });

  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  function handleSave() {
    save(local);
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

        {/* Calorie preview */}
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
