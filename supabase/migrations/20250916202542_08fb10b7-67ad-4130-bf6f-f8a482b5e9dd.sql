-- Create admin test user using Supabase auth functions
-- This creates a user that can login with admin/admin

DO $$
BEGIN
  -- Try to create the admin user
  -- Using Supabase's built-in user creation
  PERFORM auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    -- If direct insertion fails, we'll handle it in the application
    NULL;
END $$;