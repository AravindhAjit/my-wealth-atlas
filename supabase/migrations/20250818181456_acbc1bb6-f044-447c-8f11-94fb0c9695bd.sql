-- Add default_currency and username fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT,
ADD COLUMN default_currency TEXT DEFAULT 'USD';