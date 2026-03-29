import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings.api';

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

export const SETTINGS_DEFAULTS: UserSettings = {
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
  const qc = useQueryClient();

  const { data: settings = SETTINGS_DEFAULTS, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: (updates: Partial<UserSettings>) =>
      settingsApi.put({ ...settings, ...updates }),
    onSuccess: (_data, updates) => {
      qc.setQueryData(['settings'], (prev: UserSettings) => ({
        ...prev,
        ...updates,
      }));
    },
  });

  function save(updates: Partial<UserSettings>) {
    mutate(updates);
  }

  return { settings, save, isLoading };
}
