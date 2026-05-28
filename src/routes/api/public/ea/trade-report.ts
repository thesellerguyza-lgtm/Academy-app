import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sha256hex = (s: string) => createHash("sha256").update(s).digest("hex");

// EA -> SFX trade report. Auth: api_token in body or x-sfx-token header.
// Body: { token, ticket, pair, direction, lots?, open_price?, close_price?, stop_loss?, take_profit?, pnl?, status?: "open"|"closed", opened_at?, closed_at? }
export const Route = createFileRoute("/api/public/ea/trade-report")({
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
        const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
        let body: any = {};
        try { body = await request.json(); } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: cors });
        }
        const token = request.headers.get("x-sfx-token") || body?.token;
        if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers: cors });

        const { data: conn } = await supabaseAdmin
          .from("ea_connections").select("user_id").eq("api_token_hash", sha256hex(token)).maybeSingle();
        if (!conn) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });

        if (!body.pair || !body.direction) {
          return new Response(JSON.stringify({ error: "pair + direction required" }), { status: 400, headers: cors });
        }

        const row: Record<string, any> = {
          user_id: conn.user_id,
          ticket: body.ticket ? String(body.ticket) : null,
          pair: String(body.pair),
          direction: String(body.direction),
          status: body.status === "closed" ? "closed" : "open",
        };
        for (const k of ["lots", "open_price", "close_price", "stop_loss", "take_profit", "pnl"]) {
          if (typeof body[k] === "number") row[k] = body[k];
        }
        if (body.opened_at) row.opened_at = body.opened_at;
        if (body.closed_at) row.closed_at = body.closed_at;

        // upsert-by-ticket if provided
        if (row.ticket) {
          const { data: existing } = await supabaseAdmin
            .from("ea_trades").select("id").eq("user_id", conn.user_id).eq("ticket", row.ticket).maybeSingle();
          if (existing) {
            await supabaseAdmin.from("ea_trades").update(row as any).eq("id", existing.id);
          } else {
            await supabaseAdmin.from("ea_trades").insert(row as any);
          }
        } else {
          await supabaseAdmin.from("ea_trades").insert(row as any);
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
      },
    },
  },
});
