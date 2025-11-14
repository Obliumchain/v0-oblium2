# Reset Quiz Completions

## Important: New Quiz Questions Deployed

The quiz has been updated with **10 new educational questions** about ObliumChain's community education, transparency, and DAO principles.

## ⚠️ Database Update Required

Since the questions have completely changed, you need to decide:

### Option 1: Allow Everyone to Retake the Quiz (Recommended)
Run this SQL in your Supabase SQL Editor:

\`\`\`sql
DELETE FROM quiz_completions;
\`\`\`

This will:
- Remove all previous quiz completion records
- Allow all users to retake the quiz with the new questions
- Award points again for correct answers (1,000 points each)

### Option 2: Keep Old Quiz History
If you want to preserve old quiz data:

\`\`\`sql
-- Rename old table to keep history
ALTER TABLE quiz_completions RENAME TO quiz_completions_old;

-- Users will automatically start fresh with the new quiz
\`\`\`

## What Changed?

**Old Questions (1-10):** About Oblium's vision, Solana network, transparency, and governance basics

**New Questions (11-20):** 
- Community education program
- Decentralization principles
- Transparency importance
- Task-to-Earn model
- DAO governance structure
- Partnerships and AMAs
- Blockchain security
- Long-term vision

## After Running the Script

All users will see the quiz as "not completed" and can answer the new questions to earn up to 10,000 points (1,000 per correct answer).
