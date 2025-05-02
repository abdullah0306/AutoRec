-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "features" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE
);

-- Insert default packages
INSERT INTO "packages" ("name", "description", "price", "duration_days", "features") VALUES
('Basic', 'Perfect for getting started', 29.99, 30, ARRAY['Up to 100 emails per month', 'Basic email templates', 'Email tracking']),
('Pro', 'Most popular for growing businesses', 49.99, 30, ARRAY['Up to 1000 emails per month', 'Advanced email templates', 'Email tracking', 'Priority support', 'Analytics dashboard']),
('Enterprise', 'For large organizations', 99.99, 30, ARRAY['Unlimited emails', 'Custom email templates', 'Advanced email tracking', '24/7 priority support', 'Advanced analytics', 'Custom integrations']);
