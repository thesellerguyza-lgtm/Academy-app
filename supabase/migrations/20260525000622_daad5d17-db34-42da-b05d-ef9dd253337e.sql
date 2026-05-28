
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.rotate_ea_api_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotate_ea_api_token() TO authenticated;
