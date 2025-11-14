-- Reset quiz completions to allow users to retake the quiz with new questions
-- Run this ONLY if you want all users to be able to retake the quiz

-- Option 1: Delete all quiz completions (recommended for new questions)
DELETE FROM quiz_completions;

-- Option 2: If you want to keep history, you could rename the table first:
-- ALTER TABLE quiz_completions RENAME TO quiz_completions_old;
-- Then the app will create new entries in the fresh table

-- Note: This will allow all users to retake the quiz and earn points again
