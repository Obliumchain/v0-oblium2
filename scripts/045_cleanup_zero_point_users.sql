-- Delete users who have been at 0 points for the past 6 hours
-- This removes inactive users who haven't earned any points since registration

DELETE FROM profiles
WHERE points = 0
  AND created_at < NOW() - INTERVAL '6 hours';
