-- Allow the authenticated user to insert their own public.users row.
-- Needed during signup (when session exists immediately, i.e. email
-- confirmation disabled) and in the auth/callback route (after the
-- confirmation code has been exchanged for a session). The WITH CHECK
-- ensures a user can only insert a row whose id matches their own
-- auth.uid() — no user can impersonate another.
CREATE POLICY "users insert own row" ON public.users
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);
