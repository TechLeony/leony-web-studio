import { storyOfUsDemoCtaConfig } from "./demoCtaConfig";

// Required before production Shopier automation:
// - SHOPIER_API_KEY
// - SHOPIER_API_SECRET
// - SHOPIER_BUYER_ACCOUNT_ID or SHOPIER_MERCHANT_ID if required by Shopier integration
// - SHOPIER_PAYMENT_AMOUNT_TRY
// - SHOPIER_PAYMENT_CURRENCY, defaults to TRY
// - SHOPIER_SUCCESS_URL
// - SHOPIER_FAIL_URL
// - SHOPIER_CALLBACK_URL
// - SHOPIER_ALLOW_UNVERIFIED_CALLBACK_DEV, dev-only callback testing escape hatch
export const storyOfUsShopierConfig = {
  apiKey: process.env.SHOPIER_API_KEY ?? "",
  apiSecret: process.env.SHOPIER_API_SECRET ?? "",
  buyerAccountId: process.env.SHOPIER_BUYER_ACCOUNT_ID ?? "",
  merchantId: process.env.SHOPIER_MERCHANT_ID ?? "",
  paymentAmountTry: parsePaymentAmount(process.env.SHOPIER_PAYMENT_AMOUNT_TRY),
  paymentCurrency: process.env.SHOPIER_PAYMENT_CURRENCY?.trim() || "TRY",
  successUrl: process.env.SHOPIER_SUCCESS_URL ?? "",
  failUrl: process.env.SHOPIER_FAIL_URL ?? "",
  callbackUrl: process.env.SHOPIER_CALLBACK_URL ?? "",
  allowUnverifiedCallbackDev:
    process.env.NODE_ENV !== "production" &&
    process.env.SHOPIER_ALLOW_UNVERIFIED_CALLBACK_DEV === "true",
  fallbackPaymentUrl: storyOfUsDemoCtaConfig.shopierPaymentUrl,
} as const;

function parsePaymentAmount(value: string | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 199;
}
