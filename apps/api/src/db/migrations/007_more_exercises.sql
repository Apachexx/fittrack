INSERT INTO exercises (name, muscle_group, equipment, is_custom)
SELECT name, muscle_group, equipment, false
FROM (VALUES
  ('Plate Loaded Chest Press', 'chest', 'machine'),
  ('Pec Deck', 'chest', 'machine'),
  ('Dumbbell Bench Press', 'chest', 'dumbbell'),
  ('Low Cable Fly', 'chest', 'cables'),
  ('T-Bar Row', 'back', 'barbell'),
  ('Chest Supported Row', 'back', 'machine'),
  ('Hack Squat', 'legs', 'machine'),
  ('Bulgarian Split Squat', 'legs', 'dumbbell'),
  ('Hip Thrust', 'legs', 'barbell'),
  ('Calf Raise', 'legs', 'machine'),
  ('Arnold Press', 'shoulders', 'dumbbell'),
  ('Upright Row', 'shoulders', 'barbell'),
  ('Preacher Curl', 'arms', 'machine'),
  ('Close Grip Bench Press', 'arms', 'barbell'),
  ('Dips', 'arms', 'bodyweight'),
  ('Hanging Leg Raise', 'core', 'bodyweight'),
  ('Cable Crunch', 'core', 'cables'),
  ('Ab Wheel', 'core', 'other')
) AS v(name, muscle_group, equipment)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = v.name AND e.is_custom = FALSE AND e.user_id IS NULL
);
