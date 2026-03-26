CREATE TABLE IF NOT EXISTS exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest','back','legs','shoulders','arms','core','cardio')),
  equipment    TEXT CHECK (equipment IN ('barbell','dumbbell','machine','bodyweight','cables','other')),
  is_custom    BOOLEAN DEFAULT FALSE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);

-- Varsayılan egzersizler
INSERT INTO exercises (name, muscle_group, equipment, is_custom) VALUES
  ('Bench Press', 'chest', 'barbell', false),
  ('Incline Bench Press', 'chest', 'barbell', false),
  ('Dumbbell Fly', 'chest', 'dumbbell', false),
  ('Push-up', 'chest', 'bodyweight', false),
  ('Cable Crossover', 'chest', 'cables', false),
  ('Pull-up', 'back', 'bodyweight', false),
  ('Barbell Row', 'back', 'barbell', false),
  ('Lat Pulldown', 'back', 'machine', false),
  ('Seated Cable Row', 'back', 'cables', false),
  ('Deadlift', 'back', 'barbell', false),
  ('Squat', 'legs', 'barbell', false),
  ('Leg Press', 'legs', 'machine', false),
  ('Leg Curl', 'legs', 'machine', false),
  ('Leg Extension', 'legs', 'machine', false),
  ('Lunge', 'legs', 'dumbbell', false),
  ('Romanian Deadlift', 'legs', 'barbell', false),
  ('Overhead Press', 'shoulders', 'barbell', false),
  ('Dumbbell Lateral Raise', 'shoulders', 'dumbbell', false),
  ('Front Raise', 'shoulders', 'dumbbell', false),
  ('Face Pull', 'shoulders', 'cables', false),
  ('Bicep Curl', 'arms', 'dumbbell', false),
  ('Hammer Curl', 'arms', 'dumbbell', false),
  ('Tricep Pushdown', 'arms', 'cables', false),
  ('Skull Crusher', 'arms', 'barbell', false),
  ('Plank', 'core', 'bodyweight', false),
  ('Crunch', 'core', 'bodyweight', false),
  ('Russian Twist', 'core', 'bodyweight', false),
  ('Treadmill', 'cardio', 'machine', false),
  ('Cycling', 'cardio', 'machine', false),
  ('Jump Rope', 'cardio', 'other', false)
ON CONFLICT DO NOTHING;
