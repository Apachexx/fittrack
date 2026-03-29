"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkouts = listWorkouts;
exports.getWorkout = getWorkout;
exports.createWorkout = createWorkout;
exports.updateWorkout = updateWorkout;
exports.deleteWorkout = deleteWorkout;
exports.addSet = addSet;
exports.listExercises = listExercises;
exports.createExercise = createExercise;
exports.getPersonalRecords = getPersonalRecords;
exports.getExerciseLastSession = getExerciseLastSession;
exports.getWorkoutDates = getWorkoutDates;
const db_1 = require("../db");
async function listWorkouts(userId) {
    return (0, db_1.query)(`SELECT id, user_id, name, started_at, ended_at, notes
     FROM workouts WHERE user_id = $1 ORDER BY started_at DESC`, [userId]);
}
async function getWorkout(id, userId) {
    const workout = await (0, db_1.queryOne)('SELECT * FROM workouts WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!workout)
        return null;
    const sets = await (0, db_1.query)(`SELECT ws.*, e.name AS exercise_name, e.muscle_group
     FROM workout_sets ws
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.workout_id = $1
     ORDER BY ws.created_at, ws.set_number`, [id]);
    return { ...workout, sets };
}
async function createWorkout(userId, name, notes) {
    return (0, db_1.queryOne)('INSERT INTO workouts (user_id, name, notes) VALUES ($1, $2, $3) RETURNING *', [userId, name, notes ?? null]);
}
async function updateWorkout(id, userId, data) {
    const existing = await (0, db_1.queryOne)('SELECT id FROM workouts WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing)
        return null;
    return (0, db_1.queryOne)(`UPDATE workouts SET
       name = COALESCE($3, name),
       notes = COALESCE($4, notes),
       ended_at = COALESCE($5, ended_at)
     WHERE id = $1 AND user_id = $2
     RETURNING *`, [id, userId, data.name ?? null, data.notes ?? null, data.endedAt ?? null]);
}
async function deleteWorkout(id, userId) {
    const result = await (0, db_1.query)('DELETE FROM workouts WHERE id = $1 AND user_id = $2', [id, userId]);
    const r = result;
    return (r?.rowCount ?? 0) > 0;
}
async function addSet(workoutId, userId, data) {
    // Kullanıcının antrenmanı olduğunu doğrula
    const workout = await (0, db_1.queryOne)('SELECT id FROM workouts WHERE id = $1 AND user_id = $2', [workoutId, userId]);
    if (!workout)
        return null;
    return (0, db_1.queryOne)(`INSERT INTO workout_sets
       (workout_id, exercise_id, set_number, reps, weight_kg, rest_secs, is_superset, superset_group, completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`, [
        workoutId,
        data.exerciseId,
        data.setNumber,
        data.reps ?? null,
        data.weightKg ?? null,
        data.restSecs ?? null,
        data.isSuperset ?? false,
        data.supersetGroup ?? null,
        data.completed ?? false,
    ]);
}
async function listExercises(userId, search, muscleGroup) {
    let sql = `SELECT * FROM exercises WHERE (is_custom = FALSE OR user_id = $1)`;
    const params = [userId];
    if (search) {
        params.push(`%${search}%`);
        sql += ` AND name ILIKE $${params.length}`;
    }
    if (muscleGroup) {
        params.push(muscleGroup);
        sql += ` AND muscle_group = $${params.length}`;
    }
    sql += ' ORDER BY is_custom ASC, name ASC';
    return (0, db_1.query)(sql, params);
}
async function createExercise(userId, data) {
    return (0, db_1.queryOne)(`INSERT INTO exercises (name, muscle_group, equipment, is_custom, user_id)
     VALUES ($1, $2, $3, TRUE, $4) RETURNING *`, [data.name, data.muscleGroup, data.equipment, userId]);
}
async function getPersonalRecords(userId) {
    return (0, db_1.query)(`SELECT DISTINCT ON (ws.exercise_id)
       ws.exercise_id, e.name AS exercise_name, e.muscle_group,
       ws.weight_kg, ws.reps, w.started_at AS achieved_at
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE w.user_id = $1 AND ws.weight_kg IS NOT NULL AND ws.completed = TRUE
     ORDER BY ws.exercise_id, ws.weight_kg DESC`, [userId]);
}
async function getExerciseLastSession(userId, exerciseId) {
    return (0, db_1.query)(`SELECT ws.set_number, ws.reps, ws.weight_kg
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND ws.exercise_id = $2 AND w.ended_at IS NOT NULL
     ORDER BY w.started_at DESC, ws.set_number ASC
     LIMIT 10`, [userId, exerciseId]);
}
async function getWorkoutDates(userId) {
    return (0, db_1.query)(`SELECT DATE(started_at) AS date, COUNT(*) AS count
     FROM workouts
     WHERE user_id = $1 AND ended_at IS NOT NULL
     GROUP BY DATE(started_at)
     ORDER BY date DESC
     LIMIT 365`, [userId]);
}
