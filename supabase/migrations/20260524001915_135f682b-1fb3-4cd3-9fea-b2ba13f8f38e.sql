-- Ensure pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1) Hash EA API tokens -----------------------------------------------------
ALTER TABLE public.ea_connections
  ADD COLUMN IF NOT EXISTS api_token_hash text;

-- Backfill: hash existing plaintext tokens
UPDATE public.ea_connections
SET api_token_hash = encode(extensions.digest(api_token, 'sha256'), 'hex')
WHERE api_token_hash IS NULL AND api_token IS NOT NULL;

-- Drop the plaintext token column entirely
ALTER TABLE public.ea_connections DROP COLUMN IF EXISTS api_token;

ALTER TABLE public.ea_connections
  ALTER COLUMN api_token_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ea_connections_api_token_hash_key
  ON public.ea_connections (api_token_hash);

-- Rotate function: generates a fresh token, stores only the hash, returns plaintext once.
CREATE OR REPLACE FUNCTION public.rotate_ea_api_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.ea_connections (user_id, api_token_hash)
  VALUES (auth.uid(), encode(extensions.digest(raw_token, 'sha256'), 'hex'))
  ON CONFLICT (user_id) DO UPDATE
    SET api_token_hash = EXCLUDED.api_token_hash,
        updated_at = now();

  RETURN raw_token;
END;
$$;

-- Ensure one connection per user (needed for ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS ea_connections_user_id_key
  ON public.ea_connections (user_id);

REVOKE EXECUTE ON FUNCTION public.rotate_ea_api_token() FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.rotate_ea_api_token() TO authenticated;

-- 2) INSERT policy on ea_connections ---------------------------------------
DROP POLICY IF EXISTS "Users insert own connection" ON public.ea_connections;
CREATE POLICY "Users insert own connection"
  ON public.ea_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3) Drop MT4/MT5 password columns -----------------------------------------
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mt4_password;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mt5_password;

-- 4) Notifications: require auth on broadcast reads ------------------------
DROP POLICY IF EXISTS "Users see own and broadcast notifs" ON public.notifications;
CREATE POLICY "Users see own and broadcast notifs"
  ON public.notifications FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid() = user_id OR broadcast = true)
  );

-- 5) Restrict has_role EXECUTE --------------------------------------------
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 6) Update handle_new_user trigger to store only token hash ---------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  is_admin_email boolean := lower(NEW.email) = lower('Simphiwenkhosingphepsilemabuza@gmail.com');
  raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
BEGIN
  INSERT INTO public.profiles (id, email, username, name, surname, phone, country_code, status, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email,'@',1) || SUBSTR(NEW.id::text,1,4)),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+27'),
    'approved'::approval_status,
    CASE WHEN is_admin_email THEN 'premium'::plan_tier ELSE 'none'::plan_tier END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin_email THEN 'admin'::app_role ELSE 'user'::app_role END);
  INSERT INTO public.ea_connections (user_id, api_token_hash)
  VALUES (NEW.id, encode(extensions.digest(raw_token, 'sha256'), 'hex'));
  RETURN NEW;
END;
$$;