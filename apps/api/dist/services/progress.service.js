"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBodyMeasurements = getBodyMeasurements;
exports.addBodyMeasurement = addBodyMeasurement;
exports.getWeeklySummary = getWeeklySummary;
exports.getPRHistory = getPRHistory;
exports.getMuscleGroupDistribution = getMuscleGroupDistribution;
const db_1 = require("../db");
async function getBodyMeasurements(userId, limit = 30) {
    return (0, db_1.query)(`SELECT * FROM body_measurements WHERE user_id = $1 ORDER BY measured_at DESC LIMIT $2`, [userId, limit]);
}
async function addBodyMeasurement(userId, data) {
    return (0, db_1.queryOne)(`INSERT INTO body_measurements (user_id, measured_at, weight_kg, body_fat, chest_cm, waist_cm, hips_cm, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
        userId,
        data.measuredAt,
        data.weightKg ?? null,
        data.bodyFat ?? null,
        data.chestCm ?? null,
        data.waistCm ?? null,
        data.hipsCm ?? null,
        data.notes ?? null,
    ]);
}
async function getWeeklySummary(userId, weeks = 12) {
    return (0, db_1.query)(`WITH week_series AS (
       SELECT generate_series(
         date_trunc('week', NOW() - ($2 || ' weeks')::interval),
         date_trunc('week', NOW()),
         '1 week'::interval
       ) AS week_start
     )
     SELECT
       ws.week_start,
       ws.week_start + '6 days'::interval AS week_end,
       COUNT(DISTINCT w.id) AS total_workouts,
       COALESCE(SUM(wset.set_number), 0) AS total_sets,
       COALESCE(SUM(wset.weight_kg * wset.reps), 0) AS total_volume
     FROM week_series ws
     LEFT JOIN workouts w ON w.user_id = $1
       AND date_trunc('week', w.started_at) = ws.week_start
     LEFT JOIN workout_sets wset ON wset.workout_id = w.id
     GROUP BY ws.week_start
     ORDER BY ws.week_start`, [userId, weeks]);
}
async function getPRHistory(userId, exerciseId) {
    return (0, db_1.query)(`SELECT ws.weight_kg, ws.reps, w.started_at AS achieved_at
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND ws.exercise_id = $2 AND ws.weight_kg IS NOT NULL
     ORDER BY w.started_at`, [userId, exerciseId]);
}
async function getMuscleGroupDistribution(userId, days = 30) {
    return (0, db_1.query)(`SELECT e.muscle_group, COUNT(*) AS set_count
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE w.user_id = $1 AND w.started_at >= NOW() - ($2 || ' days')::interval
     GROUP BY e.muscle_group
     ORDER BY set_count DESC`, [userId, days]);
}
