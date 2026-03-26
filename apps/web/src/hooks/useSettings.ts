import { useState } from 'react';

const SETTINGS_KEY = 'fittrack_settings';

export interface UserSettings {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  workoutsPerWeekGoal: number;
  heightCm: number;
  weightKg: number;
  waterGoalMl: number;
}

const DEFAULTS: UserSettings = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
  workoutsPerWeekGoal: 4,
  heightCm: 0,
  weightKg: 0,
  waterGoalMl: 2500,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULTS;
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return DEFAULTS;
    }
  });

  function save(updates: Partial<UserSettings>) {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  return { settings, save };
}
