import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  business_category: z.string().trim().min(1).max(80),
  custom_business_category: z.string().trim().max(120).optional().nullable(),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  phone: z.string().trim().max(40).optional().nullable(),
  phone_country: z.string().trim().max(80).optional().nullable(),
  phone_country_code: z.string().trim().max(4).optional().nullable(),
  phone_dial_code: z.string().trim().max(8).optional().nullable(),
  whatsapp_number: z.string().trim().min(6).max(40),
  message: z.string().trim().min(1).max(2000),
  preferred_contact_method: z.enum(["WhatsApp", "Mail"]).default("WhatsApp"),
  selected_package: z.string().trim().max(80).optional().nullable(),
  source: z.string().trim().max(80).optional().nullable(),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const payload = {
      ...data,
      email: data.email && data.email.length > 0 ? data.email : null,
    };
    const { error } = await supabase.from("leads").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
