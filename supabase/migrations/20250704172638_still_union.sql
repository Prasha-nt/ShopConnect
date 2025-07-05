/*
  # Fix user signup database error

  1. Database Functions
    - Create or update the handle_new_user function to properly create user profiles
    - Ensure the function handles role metadata correctly

  2. Triggers
    - Ensure the trigger fires on auth.users insert to create public.users record

  3. Security
    - Update RLS policies to allow proper user creation during signup
    - Ensure service role can create user records during the signup process

  4. Changes
    - Fix the handle_new_user function to extract role from user metadata
    - Update RLS policies for users table to allow signup process
*/

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policy for user profile creation during signup
DROP POLICY IF EXISTS "Allow user profile creation during signup" ON public.users;

CREATE POLICY "Allow user profile creation during signup"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure the service role can manage users (needed for the trigger function)
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;