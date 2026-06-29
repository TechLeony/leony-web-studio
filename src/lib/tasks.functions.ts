import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string; claims: any }) {
  const adminEmail = "contact@leony.tech";
  const email: string | undefined = ctx.claims?.email;
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Unable to verify admin role");
  if (!data && email?.toLowerCase() !== adminEmail) {
    throw new Error("Forbidden: admin access required");
  }
}

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { data, error } = await context.supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { tasks: data ?? [] };
  });

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "done", "canceled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  customer_name: z.string().max(200).optional().nullable(),
  customer_phone: z.string().max(40).optional().nullable(),
  customer_email: z.string().max(255).optional().nullable(),
  business_category: z.string().max(120).optional().nullable(),
  source: z.string().max(80).optional().nullable(),
  admin_note: z.string().max(2000).optional().nullable(),
  progress_note: z.string().max(8000).optional().nullable(),
  due_date: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { task: row };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done", "canceled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  admin_note: z.string().max(2000).nullable().optional(),
  progress_note: z.string().max(8000).nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("tasks").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createTaskFromLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lead_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);

    const { data: existing } = await context.supabase
      .from("tasks")
      .select("id")
      .eq("lead_id", data.lead_id)
      .maybeSingle();
    if (existing) {
      throw new Error("Bu lead için zaten bir task oluşturulmuş.");
    }

    const { data: lead, error: leadErr } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.lead_id)
      .single();
    if (leadErr || !lead) throw new Error("Lead bulunamadı");

    const category = lead.custom_business_category || lead.business_category || "Website";
    const title = `${category} website talebi - ${lead.name}`;

    const insert = {
      lead_id: lead.id,
      title,
      description: lead.message,
      status: "todo",
      priority: "medium",
      customer_name: lead.name,
      customer_phone: lead.whatsapp_number || lead.phone,
      customer_email: lead.email,
      business_category: category,
      source: lead.source,
    };

    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { task: row };
  });
