# Quiz System Setup Instructions

## Step 1: Create Database Tables

Run this SQL in your Supabase SQL Editor:

\`\`\`sql
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
\`\`\`

## Step 2: Verify increment_points Function Exists

Make sure the `increment_points()` function exists (from script 032). If not, run:

\`\`\`sql
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

## Features

- 10 questions about ObliumChain
- 1,000 points per correct answer
- One-time completion (users can only take the quiz once)
- Immediate feedback with explanations after submission
- Visual indicators for correct/incorrect answers
- Responsive design with card-based layout

## How It Works

1. Users navigate to `/quiz` from the sidebar
2. They answer all 10 questions (multiple choice)
3. After submitting, they see their score and earn points
4. Explanations appear under each question showing the correct answer
5. Points are automatically added to their profile
6. Once completed, users cannot retake the quiz (shows completion status)
