-- Change default trial generation limit from 5 to 3
ALTER TABLE public.user_plans ALTER COLUMN gens_limit SET DEFAULT 3;

-- Update existing free/trial users who still have the old default of 5
UPDATE public.user_plans
SET gens_limit = 3
WHERE plan = 'free' AND gens_limit = 5;
