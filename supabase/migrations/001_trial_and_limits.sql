-- ---------------------------------------------------------------------------
-- 1. trial_usage — tracks one free trial per IP address (30-day window)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_usage (
  ip_hash  TEXT        PRIMARY KEY,
  used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trial_usage ENABLE ROW LEVEL SECURITY;

-- Allow the anon key to insert and read (no user auth required for trials)
CREATE POLICY "trial_usage_insert" ON public.trial_usage
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "trial_usage_select" ON public.trial_usage
  FOR SELECT TO anon USING (true);


-- ---------------------------------------------------------------------------
-- 2. try_consume_generation — atomic check + increment for user quota
--
--    Returns:
--      'ok'            — generation is allowed; counter has been incremented
--      'limit_reached' — free plan quota exhausted; generation blocked
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.try_consume_generation(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as table owner, bypasses RLS for user_plans
AS $$
DECLARE
  v_plan RECORD;
BEGIN
  -- Bootstrap plan row for new users
  INSERT INTO public.user_plans (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the row for this transaction to prevent concurrent races
  SELECT * INTO v_plan
  FROM public.user_plans
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Reset the 30-day usage window if it has expired
  IF EXTRACT(EPOCH FROM (NOW() - v_plan.period_start)) / 86400 > 30 THEN
    UPDATE public.user_plans
    SET gens_used = 1, period_start = NOW()
    WHERE user_id = p_user_id;
    RETURN 'ok';
  END IF;

  -- Pro users have unlimited generations
  IF v_plan.plan = 'pro' THEN
    UPDATE public.user_plans
    SET gens_used = gens_used + 1
    WHERE user_id = p_user_id;
    RETURN 'ok';
  END IF;

  -- Free plan: check against limit
  IF v_plan.gens_used >= v_plan.gens_limit THEN
    RETURN 'limit_reached';
  END IF;

  -- Increment and allow
  UPDATE public.user_plans
  SET gens_used = gens_used + 1
  WHERE user_id = p_user_id;
  RETURN 'ok';
END;
$$;

-- Allow authenticated users to call this function via the anon key
GRANT EXECUTE ON FUNCTION public.try_consume_generation(UUID) TO authenticated;
