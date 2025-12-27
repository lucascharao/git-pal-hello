-- Add gemini_api_key column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gemini_api_key TEXT;

-- Update RLS policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);