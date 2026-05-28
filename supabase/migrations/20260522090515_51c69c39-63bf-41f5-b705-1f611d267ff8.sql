CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_email boolean := lower(NEW.email) = lower('Simphiwenkhosingphepsilemabuza@gmail.com');
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Approve all existing users so they can browse
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- Promote admin if already signed up
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE lower(email) = lower('Simphiwenkhosingphepsilemabuza@gmail.com') LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    UPDATE public.profiles SET status = 'approved', plan = 'premium' WHERE id = admin_uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
END $$;