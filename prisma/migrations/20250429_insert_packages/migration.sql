-- Insert default packages
INSERT INTO "packages" (
  "id",
  "name", 
  "description", 
  "price",
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
);
