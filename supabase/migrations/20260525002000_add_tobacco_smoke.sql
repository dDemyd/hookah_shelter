ALTER TABLE tobaccos
  ADD COLUMN IF NOT EXISTS smoke int NOT NULL DEFAULT 4;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tobaccos_smoke_check'
  ) THEN
    ALTER TABLE tobaccos
      ADD CONSTRAINT tobaccos_smoke_check
      CHECK (smoke BETWEEN 1 AND 5);
  END IF;
END $$;

UPDATE tobaccos
SET smoke = seed.smoke
FROM (
  VALUES
    ('11111111-1111-4111-8111-111111111111'::uuid, 4),
    ('11111111-1111-4111-8111-111111111112'::uuid, 5),
    ('11111111-1111-4111-8111-111111111113'::uuid, 4),
    ('11111111-1111-4111-8111-111111111114'::uuid, 4),
    ('11111111-1111-4111-8111-111111111115'::uuid, 4),
    ('11111111-1111-4111-8111-111111111116'::uuid, 4),
    ('11111111-1111-4111-8111-111111111117'::uuid, 5),
    ('11111111-1111-4111-8111-111111111118'::uuid, 3),
    ('11111111-1111-4111-8111-111111111119'::uuid, 4),
    ('11111111-1111-4111-8111-111111111120'::uuid, 4)
) AS seed(id, smoke)
WHERE tobaccos.id = seed.id;
