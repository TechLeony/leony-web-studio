export const storyOfUsShopierConfig = {
  accessToken: process.env.SHOPIER_ACCESS_TOKEN?.trim() ?? "",
  webhookSecret: process.env.SHOPIER_WEBHOOK_SECRET?.trim() ?? "",
  paymentAmountTry: parseRequiredPaymentAmount(process.env.SHOPIER_PAYMENT_AMOUNT_TRY),
  paymentCurrency: normalizePaymentCurrency(process.env.SHOPIER_PAYMENT_CURRENCY),
} as const;

export type StoryOfUsShopierConfigurationErrorCode =
  | "shopier_configuration_missing"
  | "shopier_invalid_payment_amount"
  | "shopier_invalid_payment_currency";

export class StoryOfUsShopierConfigurationError extends Error {
  constructor(public readonly errorCode: StoryOfUsShopierConfigurationErrorCode) {
    super("StoryOfUs Shopier configuration is invalid.");
  }
}

export function assertStoryOfUsShopierProductConfiguration() {
  if (!storyOfUsShopierConfig.accessToken) {
    throw new StoryOfUsShopierConfigurationError("shopier_configuration_missing");
  }

  if (
    !Number.isFinite(storyOfUsShopierConfig.paymentAmountTry) ||
    storyOfUsShopierConfig.paymentAmountTry <= 0
  ) {
    throw new StoryOfUsShopierConfigurationError("shopier_invalid_payment_amount");
  }

  if (!["TRY", "USD", "EUR"].includes(storyOfUsShopierConfig.paymentCurrency)) {
    throw new StoryOfUsShopierConfigurationError("shopier_invalid_payment_currency");
  }
}

function parseRequiredPaymentAmount(value: string | undefined) {
  const amount = Number(value?.trim());
  return Number.isFinite(amount) && amount > 0 ? amount : Number.NaN;
}

function normalizePaymentCurrency(value: string | undefined) {
  return (value?.trim() || "TRY").toUpperCase();
}
