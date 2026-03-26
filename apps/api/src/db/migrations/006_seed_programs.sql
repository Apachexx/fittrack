DO $$
DECLARE
  ex_bench UUID := 'f8ccec15-9474-46ec-ac38-8f9d4546db69';
  ex_incline_bench UUID := '5cfba19f-74af-4c74-948e-f7fc9db396f7';
  ex_incline_smith UUID := 'bfc44c17-5dd9-4819-863f-85202df925d3';
  ex_chest_fly UUID := 'cc41318a-f748-4caa-8868-e47ba7850145';
  ex_cable_crossover UUID := '7116400b-e268-4add-b81c-5157d2247317';
  ex_dumbbell_fly UUID := '99a06c21-66d5-4388-a5bc-7764d19e8662';
  ex_overhead_press UUID := '3f4ee4ce-216c-438a-8def-2809e1ebb93a';
  ex_shoulder_machine UUID := 'dbb24aa7-03c2-496b-94eb-c6d78e02dfd5';
  ex_lateral_raise UUID := '669e4154-6b67-467c-8d6f-d4fd263e35d1';
  ex_db_lateral_raise UUID := 'a18af9fb-c32e-47a3-a33b-d0cf1a64396e';
  ex_face_pull UUID := '8c5a20f2-9a87-4167-aa0f-42d977ea8b15';
  ex_tricep_pushdown UUID := '813d86cd-e4e3-4776-9896-67923184ec6b';
  ex_overhead_rope UUID := '965b9ae2-5290-4201-9214-debcb9bd69c4';
  ex_skull_crusher UUID := '04994002-7683-44b4-983c-21d3e20838bd';
  ex_pullup UUID := '318759cc-9275-4b47-aa07-311f6b7e3b3c';
  ex_barbell_row UUID := '8aa158ff-f9fe-4f43-b8b7-58d67c051d97';
  ex_lat_pulldown UUID := 'b6db8896-ae2d-42e6-b449-a2b39d820796';
  ex_seated_cable_row UUID := '82c94bba-0792-4887-ae0d-4b1c7d67a593';
  ex_cable_row UUID := '1cf38742-7dca-469e-bed7-28010f5d987c';
  ex_cable_rear_delt UUID := 'bb59c384-d678-4ca1-b4b1-8d90a4be3061';
  ex_deadlift UUID := '8378d8c1-195d-4261-a07c-4c7b2780929d';
  ex_squat UUID := 'f6cc8c18-3a5a-4769-a74c-20cfc2eaa053';
  ex_smith_squat UUID := '7b109539-ee7c-43f9-87db-a008685b962c';
  ex_leg_press UUID := '6dcca810-c1c8-4caa-b647-987af0d2e679';
  ex_rdl UUID := '3b26c50b-39ca-4bfa-b686-b06132f2466a';
  ex_leg_curl UUID := 'c5e938ad-b65d-4e7f-8569-88c614cb56cb';
  ex_seated_leg_curl UUID := 'ea8f7a2c-0c4a-4249-b1f9-75bfa7b4409f';
  ex_leg_extension UUID := '9647beab-c95b-4aa2-bb0d-d3a841777c5e';
  ex_lunge UUID := 'bec5d619-3121-4532-ae51-710c63e68b66';
  ex_bicep_curl UUID := '467275fa-dab6-43c4-ac3a-1b795f52899f';
  ex_hammer_curl UUID := '075c1068-4443-4f9e-a97d-7c4db5874fc2';
  ex_cable_curl UUID := '218d17ca-cdd1-49cf-95c8-6afb40c67e92';
  ex_incline_db_curl UUID := '39773c62-1ea5-421e-8db2-e66ef7f8d2f7';
  ex_plank UUID := '03c1d4dc-b4f7-4d5c-af59-59d7ef847c20';

  prog_id UUID;
  w1 UUID;
  d1 UUID; d2 UUID; d3 UUID; d4 UUID; d5 UUID; d6 UUID;

BEGIN

-- ============================================================
-- PROGRAM 1: PPL
-- ============================================================
INSERT INTO programs (title, description, level, goal, duration_weeks)
VALUES (
  'Push Pull Legs (PPL)',
  '6 günlük klasik PPL split. Haftada iki tam döngü ile maksimum kas gelişimi. Progressive overload prensibiyle her hafta ağırlıkları artır.',
  'intermediate', 'hypertrophy', 8
) RETURNING id INTO prog_id;

INSERT INTO program_weeks (program_id, week_number) VALUES (prog_id, 1) RETURNING id INTO w1;

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 1, 'Push A — Göğüs & Omuz & Tricep', false) RETURNING id INTO d1;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d1, ex_bench, 4, '6-10', 180, 'Ana kaldırış — her sette ağırlık artır', 0),
  (d1, ex_incline_smith, 3, '8-12', 120, 'Üst göğüsü hedefle', 1),
  (d1, ex_chest_fly, 3, '12-15', 90, 'Kasılmaya odaklan', 2),
  (d1, ex_shoulder_machine, 3, '10-12', 90, NULL, 3),
  (d1, ex_lateral_raise, 4, '15-20', 60, 'Yan deltaya isolasyon', 4),
  (d1, ex_tricep_pushdown, 3, '12-15', 75, NULL, 5),
  (d1, ex_overhead_rope, 3, '12-15', 75, 'Tricep uzun başı', 6);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 2, 'Pull A — Sırt & Bicep', false) RETURNING id INTO d2;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d2, ex_pullup, 4, '6-10', 180, 'Yüklü veya vücut ağırlığıyla', 0),
  (d2, ex_barbell_row, 4, '6-10', 150, 'Sırtı düz tut', 1),
  (d2, ex_seated_cable_row, 3, '10-12', 90, NULL, 2),
  (d2, ex_lat_pulldown, 3, '12-15', 90, 'Geniş kavrama', 3),
  (d2, ex_cable_rear_delt, 3, '15-20', 60, 'Arka omuz', 4),
  (d2, ex_bicep_curl, 4, '10-12', 75, NULL, 5),
  (d2, ex_hammer_curl, 3, '12-15', 60, NULL, 6);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 3, 'Legs A — Bacak', false) RETURNING id INTO d3;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d3, ex_squat, 4, '6-10', 240, 'Kral hareket', 0),
  (d3, ex_leg_press, 3, '10-15', 120, 'Yüksek hacim', 1),
  (d3, ex_rdl, 3, '8-12', 120, 'Hamstring gergin tut', 2),
  (d3, ex_leg_curl, 3, '12-15', 90, NULL, 3),
  (d3, ex_leg_extension, 3, '15-20', 75, NULL, 4),
  (d3, ex_lunge, 3, '10-12', 90, 'Her bacak için', 5);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 4, 'Push B — Göğüs & Omuz & Tricep', false) RETURNING id INTO d4;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d4, ex_incline_bench, 4, '8-12', 150, 'Üst göğüs ağırlıklı gün', 0),
  (d4, ex_cable_crossover, 3, '12-15', 90, 'Göğüs streci', 1),
  (d4, ex_dumbbell_fly, 3, '12-15', 90, NULL, 2),
  (d4, ex_overhead_press, 4, '8-12', 150, 'Omuz geliştirme', 3),
  (d4, ex_db_lateral_raise, 4, '15-20', 60, NULL, 4),
  (d4, ex_skull_crusher, 3, '10-12', 90, 'Tricep uzun başı', 5),
  (d4, ex_tricep_pushdown, 3, '15-20', 60, NULL, 6);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 5, 'Pull B — Sırt & Bicep', false) RETURNING id INTO d5;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d5, ex_deadlift, 3, '4-6', 240, 'Maximum ağırlık', 0),
  (d5, ex_cable_row, 4, '10-12', 120, NULL, 1),
  (d5, ex_lat_pulldown, 3, '10-12', 90, 'Dar kavrama', 2),
  (d5, ex_face_pull, 4, '15-20', 60, 'Omuz sağlığı için zorunlu', 3),
  (d5, ex_incline_db_curl, 3, '10-12', 75, 'Tam gerim açısı', 4),
  (d5, ex_cable_curl, 3, '12-15', 60, NULL, 5),
  (d5, ex_hammer_curl, 3, '12-15', 60, NULL, 6);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 6, 'Legs B — Bacak', false) RETURNING id INTO d6;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d6, ex_smith_squat, 4, '8-12', 150, 'Farklı açıdan quad stimülasyonu', 0),
  (d6, ex_leg_press, 4, '12-15', 120, 'Yüksek tekrar hacmi', 1),
  (d6, ex_seated_leg_curl, 4, '12-15', 90, NULL, 2),
  (d6, ex_rdl, 3, '10-12', 120, NULL, 3),
  (d6, ex_leg_extension, 4, '15-20', 75, NULL, 4),
  (d6, ex_lunge, 3, '12-15', 90, NULL, 5);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 7, 'Dinlenme', true);

-- ============================================================
-- PROGRAM 2: Starting Strength 5x5
-- ============================================================
INSERT INTO programs (title, description, level, goal, duration_weeks)
VALUES (
  'Starting Strength 5×5',
  'Bill Starr''ın 5x5 metoduna dayanan başlangıç güç programı. Haftada 3 gün A-B dönüşümlü. Temel bileşik hareketlerle hızlı güç artışı. Her antrenmanda ağırlık artır.',
  'beginner', 'strength', 12
) RETURNING id INTO prog_id;

INSERT INTO program_weeks (program_id, week_number) VALUES (prog_id, 1) RETURNING id INTO w1;

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 1, 'Antrenman A', false) RETURNING id INTO d1;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d1, ex_squat, 5, '5', 240, 'Her antrenman +2.5kg', 0),
  (d1, ex_bench, 5, '5', 180, 'Her antrenman +2.5kg', 1),
  (d1, ex_barbell_row, 5, '5', 180, 'Sırtı düz tut', 2);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 2, 'Dinlenme', true);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 3, 'Antrenman B', false) RETURNING id INTO d3;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d3, ex_squat, 5, '5', 240, 'Her antrenman +2.5kg', 0),
  (d3, ex_overhead_press, 5, '5', 180, 'Her antrenman +1.25kg', 1),
  (d3, ex_deadlift, 1, '5', 300, 'Tek set maksimum efor — her antrenman +5kg', 2);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 4, 'Dinlenme', true);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 5, 'Antrenman A (tekrar)', false) RETURNING id INTO d5;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d5, ex_squat, 5, '5', 240, NULL, 0),
  (d5, ex_bench, 5, '5', 180, NULL, 1),
  (d5, ex_barbell_row, 5, '5', 180, NULL, 2);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 6, 'Dinlenme', true);
INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 7, 'Dinlenme', true);

-- ============================================================
-- PROGRAM 3: Upper Lower Split
-- ============================================================
INSERT INTO programs (title, description, level, goal, duration_weeks)
VALUES (
  'Upper Lower Split',
  'Haftada 4 gün üst-alt bölünmüş program. Bileşik hareketler ve izolasyon egzersizlerini dengeli birleştirir. Güç ve hacim için en kanıtlanmış split programlarından biri.',
  'intermediate', 'strength', 8
) RETURNING id INTO prog_id;

INSERT INTO program_weeks (program_id, week_number) VALUES (prog_id, 1) RETURNING id INTO w1;

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 1, 'Üst Vücut A — Güç', false) RETURNING id INTO d1;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d1, ex_bench, 4, '4-6', 210, 'Ağır güç seti', 0),
  (d1, ex_barbell_row, 4, '4-6', 210, NULL, 1),
  (d1, ex_overhead_press, 3, '6-8', 150, NULL, 2),
  (d1, ex_lat_pulldown, 3, '8-10', 120, NULL, 3),
  (d1, ex_bicep_curl, 3, '10-12', 75, NULL, 4),
  (d1, ex_tricep_pushdown, 3, '10-12', 75, NULL, 5);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 2, 'Alt Vücut A — Güç', false) RETURNING id INTO d2;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d2, ex_squat, 4, '4-6', 240, NULL, 0),
  (d2, ex_rdl, 3, '6-8', 180, NULL, 1),
  (d2, ex_leg_press, 3, '8-10', 120, NULL, 2),
  (d2, ex_leg_curl, 3, '10-12', 90, NULL, 3),
  (d2, ex_leg_extension, 3, '12-15', 75, NULL, 4);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 3, 'Dinlenme', true);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 4, 'Üst Vücut B — Hacim', false) RETURNING id INTO d4;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d4, ex_incline_bench, 4, '8-12', 120, NULL, 0),
  (d4, ex_cable_row, 4, '8-12', 120, NULL, 1),
  (d4, ex_db_lateral_raise, 4, '12-15', 60, NULL, 2),
  (d4, ex_face_pull, 3, '15-20', 60, 'Rotator cuff sağlığı', 3),
  (d4, ex_hammer_curl, 3, '12-15', 75, NULL, 4),
  (d4, ex_overhead_rope, 3, '12-15', 75, NULL, 5);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 5, 'Alt Vücut B — Hacim', false) RETURNING id INTO d5;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d5, ex_deadlift, 3, '3-5', 270, 'Haftalık deadlift', 0),
  (d5, ex_leg_press, 4, '10-15', 120, 'Yüksek hacim', 1),
  (d5, ex_seated_leg_curl, 4, '12-15', 90, NULL, 2),
  (d5, ex_leg_extension, 4, '15-20', 75, NULL, 3),
  (d5, ex_lunge, 3, '12-15', 90, NULL, 4);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 6, 'Dinlenme', true);
INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 7, 'Dinlenme', true);

-- ============================================================
-- PROGRAM 4: Arnold Split
-- ============================================================
INSERT INTO programs (title, description, level, goal, duration_weeks)
VALUES (
  'Arnold Split',
  'Schwarzenegger''ın efsanevi 6 günlük programı. Göğüs/Sırt, Omuz/Kol ve Bacak günleri. Yüksek hacim ve süperset teknikleriyle maksimum hipertrofi. Deneyimli sporcular için.',
  'advanced', 'hypertrophy', 8
) RETURNING id INTO prog_id;

INSERT INTO program_weeks (program_id, week_number) VALUES (prog_id, 1) RETURNING id INTO w1;

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 1, 'Göğüs & Sırt', false) RETURNING id INTO d1;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d1, ex_bench, 5, '6-10', 180, 'Süperset: Bench + Barbell Row', 0),
  (d1, ex_barbell_row, 5, '6-10', 30, 'Süperset pair', 1),
  (d1, ex_incline_bench, 4, '8-12', 120, NULL, 2),
  (d1, ex_lat_pulldown, 4, '8-12', 30, 'Süperset: Incline + Lat Pulldown', 3),
  (d1, ex_cable_crossover, 3, '12-15', 90, NULL, 4),
  (d1, ex_cable_row, 3, '12-15', 90, NULL, 5),
  (d1, ex_plank, 3, '45-60sn', 60, NULL, 6);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 2, 'Omuz & Kol', false) RETURNING id INTO d2;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d2, ex_overhead_press, 5, '6-10', 180, NULL, 0),
  (d2, ex_bicep_curl, 5, '8-12', 30, 'Süperset: OH Press + Curl', 1),
  (d2, ex_db_lateral_raise, 4, '12-15', 75, NULL, 2),
  (d2, ex_skull_crusher, 4, '10-12', 75, NULL, 3),
  (d2, ex_incline_db_curl, 3, '10-12', 75, 'Tam gerim', 4),
  (d2, ex_overhead_rope, 3, '12-15', 60, NULL, 5),
  (d2, ex_cable_rear_delt, 3, '15-20', 60, 'Arka omuz', 6),
  (d2, ex_cable_curl, 3, '12-15', 60, NULL, 7);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 3, 'Bacak', false) RETURNING id INTO d3;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d3, ex_squat, 6, '6-10', 210, 'Yüksek hacim Arnold tarzı', 0),
  (d3, ex_leg_press, 4, '10-15', 150, NULL, 1),
  (d3, ex_leg_extension, 4, '15-20', 75, NULL, 2),
  (d3, ex_seated_leg_curl, 4, '10-15', 90, NULL, 3),
  (d3, ex_rdl, 3, '8-12', 120, NULL, 4),
  (d3, ex_lunge, 3, '12-15', 90, 'Her bacak', 5);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 4, 'Göğüs & Sırt (2. Tur)', false) RETURNING id INTO d4;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d4, ex_incline_bench, 5, '8-12', 150, 'Üst göğüs öncelik', 0),
  (d4, ex_barbell_row, 5, '8-12', 120, NULL, 1),
  (d4, ex_dumbbell_fly, 4, '12-15', 90, NULL, 2),
  (d4, ex_cable_row, 4, '10-12', 90, NULL, 3),
  (d4, ex_chest_fly, 3, '15-20', 75, 'Pump seti', 4),
  (d4, ex_face_pull, 3, '15-20', 60, 'Omuz sağlığı', 5);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 5, 'Omuz & Kol (2. Tur)', false) RETURNING id INTO d5;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d5, ex_shoulder_machine, 4, '10-12', 120, NULL, 0),
  (d5, ex_db_lateral_raise, 4, '15-20', 60, NULL, 1),
  (d5, ex_hammer_curl, 4, '10-12', 75, NULL, 2),
  (d5, ex_tricep_pushdown, 4, '12-15', 75, NULL, 3),
  (d5, ex_cable_curl, 3, '12-15', 60, NULL, 4),
  (d5, ex_overhead_rope, 3, '12-15', 60, NULL, 5),
  (d5, ex_face_pull, 3, '15-20', 60, NULL, 6);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 6, 'Bacak (2. Tur)', false) RETURNING id INTO d6;
INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, notes, sort_order) VALUES
  (d6, ex_deadlift, 3, '4-6', 270, 'Ağır deadlift', 0),
  (d6, ex_smith_squat, 4, '10-15', 120, NULL, 1),
  (d6, ex_leg_press, 4, '12-15', 120, NULL, 2),
  (d6, ex_leg_curl, 4, '12-15', 90, NULL, 3),
  (d6, ex_leg_extension, 4, '15-20', 75, NULL, 4);

INSERT INTO program_days (week_id, day_number, name, is_rest_day) VALUES (w1, 7, 'Dinlenme', true);

END $$;
