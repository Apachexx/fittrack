-- Backfill: mark all saved sets as completed (they were logged = they were done)
UPDATE workout_sets SET completed = TRUE WHERE completed = FALSE OR completed IS NULL;
