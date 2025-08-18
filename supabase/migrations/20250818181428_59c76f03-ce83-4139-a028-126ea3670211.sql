-- Add default_currency and username fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT,
ADD COLUMN default_currency TEXT DEFAULT 'USD';

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();