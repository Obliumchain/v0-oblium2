-- Add quiz_version column to quiz_completions table
ALTER TABLE quiz_completions
ADD COLUMN IF NOT EXISTS quiz_version integer DEFAULT 1;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_version 
ON quiz_completions(user_id, quiz_version);

-- Add comment explaining the versioning
COMMENT ON COLUMN quiz_completions.quiz_version IS 'Quiz version number - allows users to retake quiz when new questions are released';
