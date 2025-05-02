const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Delete existing packages
  await prisma.package.deleteMany();

  // Create Basic Package
  await prisma.package.create({
    data: {
      id: 'pkg_basic',
      name: 'Basic',
      description: 'Perfect for getting started',
      price: 35.00,
      maxMonthlyScrapes: 250,  // Keep existing field
      maxUrlsPerBatch: 15,     // Keep existing field
      maxPagesPerSite: 50,     // Keep existing field
      concurrentSites: 2,      // Keep existing field
      maxMonthlyEmails: 1000,  // Keep existing field
      maxEmailsPerSite: 50,    // Keep existing field
      maxCandidateProfiles: 250, // New field: 250 candidate profiles per month
      maxProfilesPerBatch: 15,   // New field: 15 profiles per go
      stripeProductId: 'prod_SAbwkZTBtZAIjZ',
      stripePriceId: 'price_1RGGiXB7S6nOH9haPxBbBcN0',
      isActive: true
    }
  });

  // Create Professional Package
  await prisma.package.create({
    data: {
      id: 'pkg_pro',
      name: 'Professional',
      description: 'Most popular for growing businesses',
      price: 70.00,
      maxMonthlyScrapes: 1000,  // Keep existing field
      maxUrlsPerBatch: 30,      // Keep existing field
      maxPagesPerSite: 100,     // Keep existing field
      concurrentSites: 5,       // Keep existing field
      maxMonthlyEmails: 2000,   // Keep existing field
      maxEmailsPerSite: 100,    // Keep existing field
      maxCandidateProfiles: 1000, // New field: 1000 candidate profiles per month
      maxProfilesPerBatch: 30,    // New field: 30 profiles per go
      stripeProductId: 'prod_SAbxtsGuGjGY06',
      stripePriceId: 'price_1RGGjvB7S6nOH9haNMsGrQuM',
      isActive: true
    }
  });

  // Create Enterprise Package (placeholder values)
  await prisma.package.create({
    data: {
      id: 'pkg_enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      price: 199.00,
      maxMonthlyScrapes: 5000,   // Placeholder
      maxUrlsPerBatch: 100,      // Placeholder
      maxPagesPerSite: 500,      // Placeholder
      concurrentSites: 20,       // Placeholder
      maxMonthlyEmails: 10000,   // Placeholder
      maxEmailsPerSite: 500,     // Placeholder
      maxCandidateProfiles: 5000, // Placeholder
      maxProfilesPerBatch: 100,   // Placeholder
      isActive: true
    }
  });

  console.log('Packages seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
