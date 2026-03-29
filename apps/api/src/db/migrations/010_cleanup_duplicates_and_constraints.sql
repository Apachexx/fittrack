-- Step 1: Remove duplicate system programs (keep oldest by ctid)
DELETE FROM programs
WHERE created_by IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (title) id
    FROM programs
    WHERE created_by IS NULL
    ORDER BY title, created_at ASC
  );

-- Step 2: Remove duplicate system exercises (keep oldest by ctid)
DELETE FROM exercises
WHERE is_custom = FALSE
  AND user_id IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (name) id
    FROM exercises
    WHERE is_custom = FALSE AND user_id IS NULL
    ORDER BY name, created_at ASC
  );

-- Step 3: Add unique constraints to prevent future duplicates
ALTER TABLE programs
  ADD CONSTRAINT IF NOT EXISTS programs_title_system_unique
  UNIQUE (title);

ALTER TABLE exercises
  ADD CONSTRAINT IF NOT EXISTS exercises_name_system_unique
  UNIQUE (name);
