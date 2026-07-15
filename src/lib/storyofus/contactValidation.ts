export type StoryOfUsCheckoutContactInput = {
  customerName: string;
  customerEmail: string;
  confirmCustomerEmail: string;
  contactPhone: string;
  contactConsentAccepted: boolean;
  emailAccuracyAccepted: boolean;
};

export type StoryOfUsCheckoutContactErrors = Partial<
  Record<keyof StoryOfUsCheckoutContactInput, string>
>;

export function validateStoryOfUsCheckoutContact(input: StoryOfUsCheckoutContactInput) {
  const errors: StoryOfUsCheckoutContactErrors = {};
  const customerName = input.customerName.trim();
  const customerEmail = input.customerEmail.trim().toLowerCase();
  const confirmCustomerEmail = input.confirmCustomerEmail.trim().toLowerCase();
  const normalizedPhone = normalizeTurkeyMobilePhone(input.contactPhone);

  if (customerName.length < 2) {
    errors.customerName = "Lütfen ad soyad bilginizi yazın.";
  }

  if (!customerEmail) {
    errors.customerEmail = "E-posta adresiniz zorunlu.";
  } else if (!isValidEmailAddress(customerEmail)) {
    errors.customerEmail = "Lütfen geçerli bir e-posta adresi girin.";
  }

  if (!confirmCustomerEmail) {
    errors.confirmCustomerEmail = "E-posta adresinizi tekrar yazın.";
  } else if (customerEmail && customerEmail !== confirmCustomerEmail) {
    errors.confirmCustomerEmail = "E-posta adresleri aynı olmalı.";
  }

  if (!input.contactPhone.trim() || !normalizedPhone) {
    errors.contactPhone = "Lütfen geçerli bir Türkiye cep telefonu girin.";
  }

  if (!input.contactConsentAccepted) {
    errors.contactConsentAccepted =
      "Ödeme ve kurulum süreci için iletişim iznini onaylamanız gerekiyor.";
  }

  if (!input.emailAccuracyAccepted) {
    errors.emailAccuracyAccepted =
      "Kurulum bağlantısının bu e-posta adresine gönderileceğini onaylamanız gerekiyor.";
  }

  return {
    errors,
    normalized: {
      customerName,
      customerEmail,
      contactPhone: normalizedPhone ?? "",
    },
    isValid: Object.keys(errors).length === 0,
  };
}

export function normalizeTurkeyMobilePhone(value: string) {
  const compactValue = value.trim().replace(/[\s()-]/g, "");

  if (/^\+905\d{9}$/.test(compactValue)) {
    return compactValue;
  }

  if (/^05\d{9}$/.test(compactValue)) {
    return `+9${compactValue}`;
  }

  if (/^5\d{9}$/.test(compactValue)) {
    return `+90${compactValue}`;
  }

  return null;
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
