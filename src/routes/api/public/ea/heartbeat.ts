import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sha256hex = (s: string) => createHash("sha256").update(s).digest("hex");
const clampStr = (s: unknown, max = 64) =>
  typeof s === "string" && s.length <= max ? s : null;

// EA -> SFX bridge heartbeat. Auth: api_token in body (or x-sfx-token header).
// Body shape:
// { token, mt5_login?, mt5_server?, broker?, currency?, balance?, equity?, pnl?, margin?, free_margin?, positions?:[] }
// Returns pending commands; marks them as 'sent'.
export const Route = createFileRoute("/api/public/ea/heartbeat")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-sfx-token",
          },
        }),
      POST: async ({ request }) => {
        const cors = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        };
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: cors });
        }
        const token = request.headers.get("x-sfx-token") || body?.token;
        if (!token || typeof token !== "string") {
          return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers: cors });
        }

        const { data: conn, error: cErr } = await supabaseAdmin
          .from("ea_connections")
          .select("user_id")
          .eq("api_token_hash", sha256hex(token))
          .maybeSingle();
        if (cErr || !conn) {
          return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
        }

        const patch: Record<string, any> = { last_heartbeat: new Date().toISOString() };
        for (const k of ["mt5_login", "mt5_server", "broker"]) {
          const v = clampStr(body[k]);
          if (v) patch[k] = v;
        }
        const cur = clampStr(body.currency, 8);
        if (cur) patch.account_currency = cur;
        for (const k of ["balance", "equity", "pnl", "margin", "free_margin"]) {
          if (typeof body[k] === "number" && Number.isFinite(body[k])) patch[k] = body[k];
        }
        if (Array.isArray(body.positions) && body.positions.length <= 500) {
          patch.open_positions = body.positions.slice(0, 500);
        }

        await supabaseAdmin
          .from("ea_connections")
          .update(patch as any)
          .eq("user_id", conn.user_id);

        // pull pending commands
        const { data: cmds } = await supabaseAdmin
          .from("ea_commands")
          .select("id, type, payload, created_at")
          .eq("user_id", conn.user_id)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(25);

        if (cmds && cmds.length) {
          await supabaseAdmin
            .from("ea_commands")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .in("id", cmds.map((c) => c.id));
        }

        return new Response(
          JSON.stringify({ ok: true, commands: cmds ?? [], ts: Date.now() }),
          { status: 200, headers: cors },
        );
      },
    },
  },
});
