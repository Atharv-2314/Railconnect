-- Phase 27: Clean Duplicate Trains and Enforce Uniqueness

-- 1. Re-assign schedules pointing to duplicate trains to the master train (minimum train_id)
UPDATE schedule s
SET train_id = t.master_id
FROM (
    SELECT train_id, 
           FIRST_VALUE(train_id) OVER(PARTITION BY train_number ORDER BY train_id ASC) as master_id
    FROM train
) t
WHERE s.train_id = t.train_id AND t.train_id != t.master_id;

-- 2. Now delete duplicates safely (those that aren't the minimum ID for their train_number)
DELETE FROM train
WHERE train_id NOT IN (
    SELECT MIN(train_id)
    FROM train
    GROUP BY train_number
);

-- 3. Enforce the unique constraint idempotently
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_train_number'
    ) THEN
        ALTER TABLE train ADD CONSTRAINT unique_train_number UNIQUE (train_number);
    END IF;
END $$;
