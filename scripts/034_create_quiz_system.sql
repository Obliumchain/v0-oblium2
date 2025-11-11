-- Create quiz_completions table to track user quiz attempts
CREATE TABLE IF NOT EXISTS quiz_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE quiz_completions ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_completions
CREATE POLICY quiz_completions_select_own ON quiz_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quiz_completions_insert_own ON quiz_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_id ON quiz_completions(user_id);
