import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string; claims: any }) {
  const adminEmail = "contact@leony.tech";
  const email: string | undefined = ctx.claims?.email;
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error("Unable to verify admin role");
  if (!data && email?.toLowerCase() !== adminEmail) {
    throw new Error("Forbidden: admin access required");
  }
}

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { leads: data ?? [] };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "canceled"]).optional(),
  admin_note: z.string().max(2000).nullable().optional(),
});

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase.from("leads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
