import {
  assertStoryOfUsShopierProductConfiguration,
  StoryOfUsShopierConfigurationError,
  type StoryOfUsShopierConfigurationErrorCode,
  storyOfUsShopierConfig,
} from "./shopierConfig.server";

export type StoryOfUsShopierProductErrorCode =
  | StoryOfUsShopierConfigurationErrorCode
  | "shopier_request_timeout"
  | "shopier_rate_limited"
  | "shopier_provider_unavailable"
  | "shopier_product_rejected"
  | "shopier_invalid_response"
  | "shopier_product_create_failed";

export type CreateStoryOfUsShopierProductInput = {
  orderReference: string;
  amount: number;
  currency: string;
};

export type CreateStoryOfUsShopierProductResult = {
  productId: string;
  paymentUrl: string;
};

export class StoryOfUsShopierProductError extends Error {
  constructor(public readonly errorCode: StoryOfUsShopierProductErrorCode) {
    super("StoryOfUs Shopier product could not be created.");
  }
}

const SHOPIER_API_ORIGIN = "https://api.shopier.com";
const SHOPIER_PRODUCT_PATH = "/v1/products";
const SHOPIER_REQUEST_TIMEOUT_MS = 15_000;
const STORYOFUS_PRODUCT_TITLE = "StoryOfUs – Size Özel Dijital Aşk Hikâyesi";
const STORYOFUS_PRODUCT_DESCRIPTION =
  "Leony tarafından hazırlanan kişiye özel dijital romantik hikaye sitesi.";
const STORYOFUS_PRODUCT_IMAGE_URL = "https://leony.tech/logos/leony-logo-ask-sitesi.png";

export async function createStoryOfUsShopierProduct({
  orderReference,
  amount,
  currency,
}: CreateStoryOfUsShopierProductInput): Promise<CreateStoryOfUsShopierProductResult> {
  try {
    assertStoryOfUsShopierProductConfiguration();
  } catch (error) {
    if (error instanceof StoryOfUsShopierConfigurationError) {
      throw new StoryOfUsShopierProductError(error.errorCode);
    }

    throw error;
  }

  if (!orderReference.trim() || !Number.isFinite(amount) || amount <= 0) {
    throw new StoryOfUsShopierProductError("shopier_configuration_missing");
  }

  const normalizedCurrency = currency.trim().toUpperCase();

  if (!["TRY", "USD", "EUR"].includes(normalizedCurrency)) {
    throw new StoryOfUsShopierProductError("shopier_configuration_missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SHOPIER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(new URL(SHOPIER_PRODUCT_PATH, SHOPIER_API_ORIGIN), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${storyOfUsShopierConfig.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: STORYOFUS_PRODUCT_TITLE,
        description: STORYOFUS_PRODUCT_DESCRIPTION,
        type: "digital",
        media: [
          {
            type: "image",
            url: STORYOFUS_PRODUCT_IMAGE_URL,
            placement: 1,
          },
        ],
        priceData: {
          currency: normalizedCurrency,
          price: formatShopierPrice(amount),
        },
        stockQuantity: 1,
        shippingPayer: "sellerPays",
        customListing: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new StoryOfUsShopierProductError(mapShopierStatusToErrorCode(response.status));
    }

    const responseBody: unknown = await response.json().catch(() => null);
    return parseShopierProductResponse(responseBody);
  } catch (error) {
    if (error instanceof StoryOfUsShopierProductError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new StoryOfUsShopierProductError("shopier_request_timeout");
    }

    throw new StoryOfUsShopierProductError("shopier_provider_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

function parseShopierProductResponse(responseBody: unknown): CreateStoryOfUsShopierProductResult {
  if (!isRecord(responseBody)) {
    throw new StoryOfUsShopierProductError("shopier_invalid_response");
  }

  const productId = stringValue(responseBody.id);
  const paymentUrl = stringValue(responseBody.url);

  if (!productId) {
    throw new StoryOfUsShopierProductError("shopier_invalid_response");
  }

  if (!isValidShopierPaymentUrl(paymentUrl)) {
    throw new StoryOfUsShopierProductError("shopier_invalid_response");
  }

  return {
    productId,
    paymentUrl,
  };
}

function mapShopierStatusToErrorCode(status: number): StoryOfUsShopierProductErrorCode {
  if (status === 429) {
    return "shopier_rate_limited";
  }

  if (status >= 500) {
    return "shopier_provider_unavailable";
  }

  if (status >= 400 && status < 500) {
    return "shopier_product_rejected";
  }

  return "shopier_product_create_failed";
}

function formatShopierPrice(amount: number) {
  return amount.toFixed(2);
}

function isValidShopierPaymentUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (hostname === "shopier.com" || hostname.endsWith(".shopier.com"))
    );
  } catch {
    return false;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
