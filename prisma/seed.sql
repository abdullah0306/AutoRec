-- Insert or update packages
INSERT INTO packages (
  id,
  name, 
  description, 
  price,
  "maxMonthlyScrapes",
  "maxUrlsPerBatch",
  "maxPagesPerSite",
  "concurrentSites",
  "maxMonthlyEmails",
  "maxEmailsPerSite",
  "isActive",
  "createdAt"
) VALUES
(
  'pkg_basic',
  'Basic',
  'Perfect for getting started',
  29.99,
  100,
  10,
  50,
  1,
  1000,
  50,
  true,
  CURRENT_TIMESTAMP
),
(
  'pkg_pro',
  'Pro',
  'Most popular for growing businesses',
  49.99,
  1000,
  50,
  200,
  3,
  5000,
  100,
  true,
  CURRENT_TIMESTAMP
),
(
  'pkg_enterprise',
  'Enterprise',
  'For large organizations',
  99.99,
  10000,
  100,
  500,
  10,
  10000,
  200,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "maxMonthlyScrapes" = EXCLUDED."maxMonthlyScrapes",
  "maxUrlsPerBatch" = EXCLUDED."maxUrlsPerBatch",
  "maxPagesPerSite" = EXCLUDED."maxPagesPerSite",
  "concurrentSites" = EXCLUDED."concurrentSites",
  "maxMonthlyEmails" = EXCLUDED."maxMonthlyEmails",
  "maxEmailsPerSite" = EXCLUDED."maxEmailsPerSite",
  "isActive" = EXCLUDED."isActive";
