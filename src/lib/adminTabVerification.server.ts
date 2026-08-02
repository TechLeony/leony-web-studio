import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type AdminTabVerificationContext,
  type VerifyAdminTabAccessResult,
  verifyAdminTabAccessForContext,
} from "@/lib/adminTabVerification";
import { SITE } from "@/lib/site";

export const verifyAdminTabAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VerifyAdminTabAccessResult> => {
    return verifyAdminTabAccessForContext(context as AdminTabVerificationContext, SITE.adminEmail);
  });
