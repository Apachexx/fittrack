"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const workoutService = __importStar(require("../services/workout.service"));
async function listWorkouts(req, res) {
    try {
        const workouts = await workoutService.listWorkouts(req.user.id);
        res.json(workouts);
    }
    catch (err) {
        console.error('listWorkouts error:', err);
        res.status(500).json({ error: 'Antrenmanlar alınamadı' });
    }
}
async function getWorkout(req, res) {
    try {
        const workout = await workoutService.getWorkout(req.params.id, req.user.id);
        if (!workout) {
            res.status(404).json({ error: 'Antrenman bulunamadı' });
            return;
        }
        res.json(workout);
    }
    catch (err) {
        console.error('getWorkout error:', err);
        res.status(500).json({ error: 'Antrenman alınamadı' });
    }
}
async function createWorkout(req, res) {
    try {
        const { name, notes } = req.body;
        const workout = await workoutService.createWorkout(req.user.id, name, notes);
        res.status(201).json(workout);
    }
    catch (err) {
        console.error('createWorkout error:', err);
        res.status(500).json({ error: 'Antrenman oluşturulamadı' });
    }
}
async function updateWorkout(req, res) {
    try {
        const workout = await workoutService.updateWorkout(req.params.id, req.user.id, {
            name: req.body.name,
            notes: req.body.notes,
            endedAt: req.body.endedAt,
        });
        if (!workout) {
            res.status(404).json({ error: 'Antrenman bulunamadı' });
            return;
        }
        res.json(workout);
    }
    catch (err) {
        console.error('updateWorkout error:', err);
        res.status(500).json({ error: 'Antrenman güncellenemedi' });
    }
}
async function deleteWorkout(req, res) {
    try {
        await workoutService.deleteWorkout(req.params.id, req.user.id);
        res.status(204).send();
    }
    catch (err) {
        console.error('deleteWorkout error:', err);
        res.status(500).json({ error: 'Antrenman silinemedi' });
    }
}
async function addSet(req, res) {
    try {
        const set = await workoutService.addSet(req.params.id, req.user.id, req.body);
        if (!set) {
            res.status(404).json({ error: 'Antrenman bulunamadı' });
            return;
        }
        res.status(201).json(set);
    }
    catch (err) {
        console.error('addSet error:', err);
        res.status(500).json({ error: 'Set eklenemedi' });
    }
}
async function listExercises(req, res) {
    try {
        const { search, muscleGroup } = req.query;
        const exercises = await workoutService.listExercises(req.user.id, search, muscleGroup);
        res.json(exercises);
    }
    catch (err) {
        console.error('listExercises error:', err);
        res.status(500).json({ error: 'Egzersizler alınamadı' });
    }
}
async function createExercise(req, res) {
    try {
        const exercise = await workoutService.createExercise(req.user.id, req.body);
        res.status(201).json(exercise);
    }
    catch (err) {
        console.error('createExercise error:', err);
        res.status(500).json({ error: 'Egzersiz oluşturulamadı' });
    }
}
async function getPersonalRecords(req, res) {
    try {
        const records = await workoutService.getPersonalRecords(req.user.id);
        res.json(records);
    }
    catch (err) {
        console.error('getPersonalRecords error:', err);
        res.status(500).json({ error: 'Kişisel rekorlar alınamadı' });
    }
}
async function getExerciseLastSession(req, res) {
    try {
        const sets = await workoutService.getExerciseLastSession(req.user.id, req.params.exerciseId);
        res.json(sets);
    }
    catch (err) {
        console.error('getExerciseLastSession error:', err);
        res.status(500).json({ error: 'Son seans verileri alınamadı' });
    }
}
async function getWorkoutDates(req, res) {
    try {
        const dates = await workoutService.getWorkoutDates(req.user.id);
        res.json(dates);
    }
    catch (err) {
        console.error('getWorkoutDates error:', err);
        res.status(500).json({ error: 'Antrenman tarihleri alınamadı' });
    }
}
