
-- Drop MT4 columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mt4_broker;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mt4_login;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mt4_server;

-- Tighten policies: restrict to authenticated role explicitly
-- profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.uid() = id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- signals
DROP POLICY IF EXISTS "Authenticated read signals" ON public.signals;
CREATE POLICY "Authenticated read signals" ON public.signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage signals" ON public.signals;
CREATE POLICY "Admins manage signals" ON public.signals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- ea_connections
DROP POLICY IF EXISTS "Users view own connection" ON public.ea_connections;
CREATE POLICY "Users view own connection" ON public.ea_connections
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Users update own connection" ON public.ea_connections;
CREATE POLICY "Users update own connection" ON public.ea_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own connection" ON public.ea_connections;
CREATE POLICY "Users insert own connection" ON public.ea_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ea_commands
DROP POLICY IF EXISTS "Users view own commands" ON public.ea_commands;
CREATE POLICY "Users view own commands" ON public.ea_commands
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Users insert own commands" ON public.ea_commands;
CREATE POLICY "Users insert own commands" ON public.ea_commands
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ea_trades
DROP POLICY IF EXISTS "Users view own trades" ON public.ea_trades;
CREATE POLICY "Users view own trades" ON public.ea_trades
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR public.has_role(auth.uid(),'admin'::app_role));

-- subscriptions
DROP POLICY IF EXISTS "Users view own subs" ON public.subscriptions;
CREATE POLICY "Users view own subs" ON public.subscriptions
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Users insert own subs" ON public.subscriptions;
CREATE POLICY "Users insert own subs" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update subs" ON public.subscriptions;
CREATE POLICY "Admins update subs" ON public.subscriptions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- app_settings: allow only authenticated reads (settings may not be secret but no need for anon)
DROP POLICY IF EXISTS "Anyone reads settings" ON public.app_settings;
CREATE POLICY "Authenticated reads settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins write settings" ON public.app_settings;
CREATE POLICY "Admins write settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Economic calendar cache (server populates via service role; users read)
CREATE TABLE IF NOT EXISTS public.economic_calendar_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  events jsonb NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE public.economic_calendar_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read calendar" ON public.economic_calendar_cache;
CREATE POLICY "Authenticated read calendar" ON public.economic_calendar_cache
  FOR SELECT TO authenticated USING (true);
