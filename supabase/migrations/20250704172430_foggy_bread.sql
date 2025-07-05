/*
# Fix User Signup RLS Policy

This migration fixes the RLS policy issue that prevents new users from being created.
The problem was that there was no INSERT policy for the users table, which caused
the handle_new_user() trigger function to fail when trying to create a user profile.

## Changes Made

1. **Users Table RLS Policy**
   - Add INSERT policy to allow the trigger function to create user profiles
   - The policy allows INSERT operations when the user ID matches the authenticated user ID
   - Also allows INSERT for the service role (used by triggers)

## Security
- Maintains security by only allowing users to create their own profile
- Service role can insert (needed for the trigger function)
- No changes to existing SELECT and UPDATE policies
*/

-- Add INSERT policy for users table to allow profile creation during signup
CREATE POLICY "Allow user profile creation during signup" ON users
  FOR INSERT
  WITH CHECK (
    -- Allow if the user ID matches the authenticated user (during signup)
    auth.uid() = id 
    OR 
    -- Allow service role (for trigger functions)
    auth.role() = 'service_role'
  );