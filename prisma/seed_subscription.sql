-- First get the package_id for Basic package
WITH basic_package AS (
  SELECT id FROM packages WHERE name = 'Basic'
)
INSERT INTO subscriptions (
  id,
  "userId",
  "packageId",
  "startDate",
  "endDate",
  "isActive",
  "monthlyUsage",
  "monthlyEmailUsage",
  "lastUsageReset"
) 
SELECT
  gen_random_uuid(),
  '6a2c9cd2-ae71-4ed9-836f-028e546212ff',
  basic_package.id,
  CURRENT_TIMESTAMP,
  NULL,
  true,
  0,
  0,
  CURRENT_TIMESTAMP
FROM basic_package
ON CONFLICT ("userId") 
DO UPDATE SET
  "packageId" = EXCLUDED."packageId",
  "startDate" = CURRENT_TIMESTAMP,
  "endDate" = NULL,
  "isActive" = true,
  "monthlyUsage" = 0,
  "monthlyEmailUsage" = 0,
  "lastUsageReset" = CURRENT_TIMESTAMP;
