-- Map Supabase users to Stripe customer IDs
CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_stripe_customer" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Add subscription fields to user_plans
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status     TEXT;  -- active | canceled | past_due | trialing
