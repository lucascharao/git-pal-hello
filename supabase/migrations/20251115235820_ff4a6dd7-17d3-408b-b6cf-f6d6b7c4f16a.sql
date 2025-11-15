-- Create freemium_users table for users with unlimited access
CREATE TABLE public.freemium_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.freemium_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage freemium users (you'll need to add records manually through database)
CREATE POLICY "Anyone can check if email is freemium"
ON public.freemium_users
FOR SELECT
USING (true);

-- Add function to check if user is freemium
CREATE OR REPLACE FUNCTION public.is_freemium_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.freemium_users
    WHERE email = user_email
  );
$$;

-- Add function to get user quote count
CREATE OR REPLACE FUNCTION public.get_user_quote_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.quotes
  WHERE user_id = user_uuid;
$$;