export interface MuscleTarget {
  primary: string[];
  secondary: string[];
}

export const EXERCISE_MUSCLES: Record<string, MuscleTarget> = {
  // CHEST
  'Bench Press': { primary: ['chest'], secondary: ['triceps', 'anterior_delt'] },
  'Plate Loaded Chest Press': { primary: ['chest'], secondary: ['triceps', 'anterior_delt'] },
  'Incline Bench Press': { primary: ['chest'], secondary: ['anterior_delt', 'triceps'] },
  'Smith Machine Low Incline Press': { primary: ['chest'], secondary: ['anterior_delt', 'triceps'] },
  'Dumbbell Fly': { primary: ['chest'], secondary: ['anterior_delt'] },
  'Chest Fly Machine': { primary: ['chest'], secondary: ['anterior_delt'] },
  'Cable Crossover': { primary: ['chest'], secondary: ['anterior_delt'] },
  'Push-up': { primary: ['chest', 'triceps'], secondary: ['anterior_delt', 'core'] },

  // BACK
  'Pull-up': { primary: ['lats'], secondary: ['biceps', 'rear_delt'] },
  'Barbell Row': { primary: ['lats', 'traps'], secondary: ['rear_delt', 'biceps', 'lower_back'] },
  'Lat Pulldown': { primary: ['lats'], secondary: ['biceps', 'rear_delt'] },
  'Seated Cable Row': { primary: ['lats', 'traps'], secondary: ['rear_delt', 'biceps'] },
  'Cable Row': { primary: ['lats', 'traps'], secondary: ['rear_delt', 'biceps'] },
  'Plate Loaded Wide Grip Row': { primary: ['lats', 'traps'], secondary: ['rear_delt', 'biceps'] },
  'Deadlift': { primary: ['lats', 'lower_back', 'glutes'], secondary: ['traps', 'hamstrings', 'quads'] },
  'Face Pull': { primary: ['rear_delt', 'traps'], secondary: [] },
  'Cable Rear Delt Fly': { primary: ['rear_delt'], secondary: ['traps'] },

  // LEGS
  'Squat': { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core', 'lower_back'] },
  'Smith Machine Squat': { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'] },
  'Leg Press': { primary: ['quads'], secondary: ['glutes', 'hamstrings'] },
  'Leg Curl': { primary: ['hamstrings'], secondary: [] },
  'Leg Extension': { primary: ['quads'], secondary: [] },
  'Lunge': { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  'Romanian Deadlift': { primary: ['hamstrings', 'glutes'], secondary: ['lower_back'] },
  'Seated Leg Curl': { primary: ['hamstrings'], secondary: [] },

  // SHOULDERS
  'Overhead Press': { primary: ['anterior_delt', 'lateral_delt'], secondary: ['triceps', 'traps'] },
  'Shoulder Press Machine': { primary: ['anterior_delt', 'lateral_delt'], secondary: ['triceps'] },
  'Dumbbell Lateral Raise': { primary: ['lateral_delt'], secondary: [] },
  'Lateral Raise': { primary: ['lateral_delt'], secondary: [] },
  'Front Raise': { primary: ['anterior_delt'], secondary: [] },

  // ARMS
  'Bicep Curl': { primary: ['biceps'], secondary: ['forearms'] },
  'Hammer Curl': { primary: ['biceps'], secondary: ['forearms'] },
  'Incline Dumbbell Curl': { primary: ['biceps'], secondary: [] },
  'Cable Curl': { primary: ['biceps'], secondary: ['forearms'] },
  'Reverse Barbell Curl': { primary: ['forearms'], secondary: ['biceps'] },
  'Tricep Pushdown': { primary: ['triceps'], secondary: [] },
  'Triceps Pushdown': { primary: ['triceps'], secondary: [] },
  'Overhead Rope Extension': { primary: ['triceps'], secondary: [] },
  'Skull Crusher': { primary: ['triceps'], secondary: [] },

  // CORE
  'Plank': { primary: ['core'], secondary: ['lower_back'] },
  'Crunch': { primary: ['core'], secondary: [] },
  'Russian Twist': { primary: ['core'], secondary: [] },

  // CARDIO
  'Treadmill': { primary: ['quads', 'calves'], secondary: ['hamstrings', 'glutes'] },
  'Cycling': { primary: ['quads'], secondary: ['hamstrings', 'glutes', 'calves'] },
  'Jump Rope': { primary: ['calves'], secondary: ['quads', 'core'] },
};

export function getMuscles(exerciseName: string): MuscleTarget {
  return EXERCISE_MUSCLES[exerciseName] ?? { primary: [], secondary: [] };
}
