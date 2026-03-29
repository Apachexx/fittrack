-- Step 1: Remove duplicate system programs (keep oldest)
DELETE FROM programs
WHERE created_by IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (title) id
    FROM programs
    WHERE created_by IS NULL
    ORDER BY title, created_at ASC
  );

-- Step 2: Remove duplicate system exercises (keep oldest)
DELETE FROM exercises
WHERE is_custom = FALSE
  AND user_id IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (name) id
    FROM exercises
    WHERE is_custom = FALSE AND user_id IS NULL
    ORDER BY name, created_at ASC
  );

-- Step 3: Add unique constraints to prevent future duplicates (safe, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'programs_title_system_unique'
  ) THEN
    ALTER TABLE programs ADD CONSTRAINT programs_title_system_unique UNIQUE (title);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exercises_name_system_unique'
  ) THEN
    ALTER TABLE exercises ADD CONSTRAINT exercises_name_system_unique UNIQUE (name);
  END IF;
END $$;
