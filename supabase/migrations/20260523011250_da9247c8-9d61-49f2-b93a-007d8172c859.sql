-- EA bridge: connections (1 per user)
CREATE TABLE public.ea_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  api_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  mt5_login text,
  mt5_server text,
  broker text,
  account_currency text,
  balance numeric,
  equity numeric,
  pnl numeric,
  margin numeric,
  free_margin numeric,
  open_positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_heartbeat timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ea_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own connection"
  ON public.ea_connections FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users update own connection"
  ON public.ea_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER touch_ea_connections
  BEFORE UPDATE ON public.ea_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Command queue
CREATE TYPE public.ea_command_type AS ENUM ('start','stop','open_trade','close_trade','close_all');
CREATE TYPE public.ea_command_status AS ENUM ('pending','sent','done','failed');

CREATE TABLE public.ea_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type ea_command_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status ea_command_status NOT NULL DEFAULT 'pending',
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.ea_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own commands"
  ON public.ea_commands FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own commands"
  ON public.ea_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ea_commands_user_pending_idx
  ON public.ea_commands (user_id, status, created_at);

-- Trades reported by the EA
CREATE TABLE public.ea_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket text,
  pair text NOT NULL,
  direction text NOT NULL,
  lots numeric,
  open_price numeric,
  close_price numeric,
  stop_loss numeric,
  take_profit numeric,
  pnl numeric,
  status text NOT NULL DEFAULT 'open',
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ea_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trades"
  ON public.ea_trades FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user trigger to also seed an ea_connection
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
  INSERT INTO public.ea_connections (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Backfill ea_connections for existing users
INSERT INTO public.ea_connections (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.ea_connections);