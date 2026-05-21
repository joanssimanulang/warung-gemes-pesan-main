
-- Fix search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten security definer functions: only authenticated may call
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_super(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super(UUID) TO authenticated;

-- Restrict bucket listing: drop wide select, allow only viewing specific objects via public URL (already public via bucket flag)
DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;
-- Public bucket files are still served via public URL without policy. Add narrow policy for authenticated listing only.
CREATE POLICY "Authenticated can list menu images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'menu-images');
