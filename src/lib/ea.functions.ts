import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Enqueue a command for the user's EA bridge to pick up on next heartbeat. */
export const enqueueEACommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { type: string; payload?: Record<string, unknown> }) =>
    z
      .object({
        type: z.enum(["start", "stop", "open_trade", "close_trade", "close_all"]),
        payload: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("ea_commands").insert({
      user_id: userId,
      type: data.type as any,
      payload: (data.payload ?? {}) as any,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
