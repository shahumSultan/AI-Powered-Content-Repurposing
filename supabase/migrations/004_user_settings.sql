-- User API key settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  groq_api_key      TEXT,
  openai_api_key    TEXT,
  preferred_provider TEXT NOT NULL DEFAULT 'groq',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
