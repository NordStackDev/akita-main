-- Add deleted_at column to auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted_at timestamp;

-- Function to sync deleted_at from public.users to auth.users
CREATE OR REPLACE FUNCTION sync_deleted_at_to_auth_users()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET deleted_at = NEW.deleted_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync deleted_at on update
DROP TRIGGER IF EXISTS trigger_sync_deleted_at ON public.users;
CREATE TRIGGER trigger_sync_deleted_at
AFTER UPDATE OF deleted_at ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_deleted_at_to_auth_users();

-- Policy to prevent login for soft deleted users
DROP POLICY IF EXISTS "Allow login for non-deleted users" ON auth.users;
CREATE POLICY "Allow login for non-deleted users"
ON auth.users
FOR SELECT
USING (deleted_at IS NULL);
