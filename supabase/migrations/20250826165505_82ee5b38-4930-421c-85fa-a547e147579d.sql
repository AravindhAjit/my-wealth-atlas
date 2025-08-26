-- Disable email confirmation requirement to avoid email validation issues
-- This allows the fake emails to work without validation
UPDATE auth.config 
SET email_confirm_required = false 
WHERE true;