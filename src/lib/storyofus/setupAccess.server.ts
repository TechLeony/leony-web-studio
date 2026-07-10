import { createServerFn } from "@tanstack/react-start";

import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type StoryOfUsSetupAccessInitialData = {
  orderReference: string;
  customerName: string;
  customerEmail: string;
  contactPhone: string;
  status: string;
};

export type StoryOfUsSetupAccessResult =
  | {
      status: "not_found";
    }
  | {
      status: "not_paid";
      paymentStatus: string | null;
    }
  | {
      status: "already_submitted";
      submissionStatus: string;
    }
  | {
      status: "ready";
      setupToken: string;
      initialData: StoryOfUsSetupAccessInitialData;
    };

export const getStoryOfUsSetupAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object" || typeof (data as { token?: unknown }).token !== "string") {
      return {
        token: "",
      };
    }

    return {
      token: (data as { token: string }).token.trim(),
    };
  })
  .handler(async ({ data }): Promise<StoryOfUsSetupAccessResult> => {
    if (!data.token) {
      return {
        status: "not_found",
      };
    }

    const { data: submission, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select(
        "setup_token, order_reference, customer_email, customer_name, contact_phone, status, payment_status",
      )
      .eq("setup_token", data.token)
      .maybeSingle();

    if (error) {
      throw new Error(`StoryOfUs setup access could not be checked: ${error.message}`);
    }

    if (!submission) {
      return {
        status: "not_found",
      };
    }

    const paymentStatus =
      typeof submission.payment_status === "string" ? submission.payment_status : null;

    if (paymentStatus !== "paid") {
      return {
        status: "not_paid",
        paymentStatus,
      };
    }

    const submissionStatus = typeof submission.status === "string" ? submission.status : "draft";

    if (submissionStatus !== "draft") {
      return {
        status: "already_submitted",
        submissionStatus,
      };
    }

    return {
      status: "ready",
      setupToken: String(submission.setup_token),
      initialData: {
        orderReference:
          typeof submission.order_reference === "string" ? submission.order_reference : "",
        customerName: typeof submission.customer_name === "string" ? submission.customer_name : "",
        customerEmail:
          typeof submission.customer_email === "string" ? submission.customer_email : "",
        contactPhone:
          typeof submission.contact_phone === "string" ? submission.contact_phone : "",
        status: submissionStatus,
      },
    };
  });
