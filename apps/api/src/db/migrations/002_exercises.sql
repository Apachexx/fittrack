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

-- Varsayılan egzersizler (sabit UUID'ler - seed_programs ile eşleşmeli)
INSERT INTO exercises (id, name, muscle_group, equipment, is_custom) VALUES
  ('f8ccec15-9474-46ec-ac38-8f9d4546db69', 'Bench Press', 'chest', 'barbell', false),
  ('5cfba19f-74af-4c74-948e-f7fc9db396f7', 'Incline Bench Press', 'chest', 'barbell', false),
  ('bfc44c17-5dd9-4819-863f-85202df925d3', 'Incline Smith Press', 'chest', 'machine', false),
  ('cc41318a-f748-4caa-8868-e47ba7850145', 'Chest Fly Machine', 'chest', 'machine', false),
  ('7116400b-e268-4add-b81c-5157d2247317', 'Cable Crossover', 'chest', 'cables', false),
  ('99a06c21-66d5-4388-a5bc-7764d19e8662', 'Dumbbell Fly', 'chest', 'dumbbell', false),
  ('318759cc-9275-4b47-aa07-311f6b7e3b3c', 'Pull-up', 'back', 'bodyweight', false),
  ('8aa158ff-f9fe-4f43-b8b7-58d67c051d97', 'Barbell Row', 'back', 'barbell', false),
  ('b6db8896-ae2d-42e6-b449-a2b39d820796', 'Lat Pulldown', 'back', 'machine', false),
  ('82c94bba-0792-4887-ae0d-4b1c7d67a593', 'Seated Cable Row', 'back', 'cables', false),
  ('1cf38742-7dca-469e-bed7-28010f5d987c', 'Cable Row', 'back', 'cables', false),
  ('bb59c384-d678-4ca1-b4b1-8d90a4be3061', 'Cable Rear Delt Fly', 'back', 'cables', false),
  ('8378d8c1-195d-4261-a07c-4c7b2780929d', 'Deadlift', 'back', 'barbell', false),
  ('f6cc8c18-3a5a-4769-a74c-20cfc2eaa053', 'Squat', 'legs', 'barbell', false),
  ('7b109539-ee7c-43f9-87db-a008685b962c', 'Smith Machine Squat', 'legs', 'machine', false),
  ('6dcca810-c1c8-4caa-b647-987af0d2e679', 'Leg Press', 'legs', 'machine', false),
  ('3b26c50b-39ca-4bfa-b686-b06132f2466a', 'Romanian Deadlift', 'legs', 'barbell', false),
  ('c5e938ad-b65d-4e7f-8569-88c614cb56cb', 'Leg Curl', 'legs', 'machine', false),
  ('ea8f7a2c-0c4a-4249-b1f9-75bfa7b4409f', 'Seated Leg Curl', 'legs', 'machine', false),
  ('9647beab-c95b-4aa2-bb0d-d3a841777c5e', 'Leg Extension', 'legs', 'machine', false),
  ('bec5d619-3121-4532-ae51-710c63e68b66', 'Lunge', 'legs', 'dumbbell', false),
  ('3f4ee4ce-216c-438a-8def-2809e1ebb93a', 'Overhead Press', 'shoulders', 'barbell', false),
  ('dbb24aa7-03c2-496b-94eb-c6d78e02dfd5', 'Shoulder Press Machine', 'shoulders', 'machine', false),
  ('669e4154-6b67-467c-8d6f-d4fd263e35d1', 'Lateral Raise', 'shoulders', 'cables', false),
  ('a18af9fb-c32e-47a3-a33b-d0cf1a64396e', 'Dumbbell Lateral Raise', 'shoulders', 'dumbbell', false),
  ('8c5a20f2-9a87-4167-aa0f-42d977ea8b15', 'Face Pull', 'shoulders', 'cables', false),
  ('467275fa-dab6-43c4-ac3a-1b795f52899f', 'Bicep Curl', 'arms', 'dumbbell', false),
  ('075c1068-4443-4f9e-a97d-7c4db5874fc2', 'Hammer Curl', 'arms', 'dumbbell', false),
  ('218d17ca-cdd1-49cf-95c8-6afb40c67e92', 'Cable Curl', 'arms', 'cables', false),
  ('39773c62-1ea5-421e-8db2-e66ef7f8d2f7', 'Incline Dumbbell Curl', 'arms', 'dumbbell', false),
  ('813d86cd-e4e3-4776-9896-67923184ec6b', 'Tricep Pushdown', 'arms', 'cables', false),
  ('965b9ae2-5290-4201-9214-debcb9bd69c4', 'Overhead Rope Extension', 'arms', 'cables', false),
  ('04994002-7683-44b4-983c-21d3e20838bd', 'Skull Crusher', 'arms', 'barbell', false),
  ('03c1d4dc-b4f7-4d5c-af59-59d7ef847c20', 'Plank', 'core', 'bodyweight', false),
  (gen_random_uuid(), 'Push-up', 'chest', 'bodyweight', false),
  (gen_random_uuid(), 'Front Raise', 'shoulders', 'dumbbell', false),
  (gen_random_uuid(), 'Crunch', 'core', 'bodyweight', false),
  (gen_random_uuid(), 'Russian Twist', 'core', 'bodyweight', false),
  (gen_random_uuid(), 'Treadmill', 'cardio', 'machine', false),
  (gen_random_uuid(), 'Cycling', 'cardio', 'machine', false),
  (gen_random_uuid(), 'Jump Rope', 'cardio', 'other', false)
ON CONFLICT (id) DO NOTHING;
