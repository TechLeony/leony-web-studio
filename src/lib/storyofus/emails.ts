// Story of Us — email placeholders. Wire to a real provider later (Resend etc.).
import { LEONY_ADMIN_EMAIL_HERE } from "./config";
import { updateOrder } from "./storage";
import type { StoryOrder } from "./types";

function logEmail(kind: string, to: string, subject: string, body: string) {
  // eslint-disable-next-line no-console
  console.info(`[storyofus:email] ${kind} → ${to}\n${subject}\n---\n${body}`);
}

export async function sendAdminLeadEmail(order: StoryOrder) {
  const subject = `Yeni Story of Us Siparişi: ${order.orderCode}`;
  const body = `Sipariş: ${order.orderCode}
Tarih: ${order.createdAtDate} ${order.createdAtTime}
Müşteri: ${order.customerName} (${order.customerEmail})
Teslimat maili: ${order.deliveryEmail} (aynı mı? ${order.useSameEmailForDelivery ? "evet" : "hayır"})
Telefon: ${order.customerPhone}
Stil: ${order.selectedStyle} | Paket: ${order.selectedPackage} (${order.packageActivePrice} TL)
Görünürlük: ${order.visibility} (+${order.visibilityExtraPrice} TL)
Tanıtım izni: ${order.marketingPermissionType} (-${order.marketingDiscount} TL)
Toplam: ${order.totalPrice} TL
Slug: leony.tech/storyofus/${order.desiredSlug}
Aşk notu: ${order.loveNote}
Hikaye: ${order.story}
Şarkı: ${order.song}`;
  logEmail("admin-lead", LEONY_ADMIN_EMAIL_HERE, subject, body);
  updateOrder(order.id, {
    adminLeadEmailSent: true,
    adminLeadEmailSentAt: new Date().toISOString(),
  });
}

export async function sendCustomerOrderReceivedEmail(order: StoryOrder) {
  const subject = "Story of Us sipariş bilgilerin alındı 💌";
  const body = `Merhaba ${order.customerName},

Story of Us sipariş bilgilerini aldık. 💌

Sipariş kodun: ${order.orderCode}
Seçtiğin stil: ${order.selectedStyle}
Seçtiğin paket: ${order.selectedPackage}
Toplam tutar: ${order.totalPrice} TL
Teslimat e-postası: ${order.deliveryEmail}

Ödeme yaparken Shopier sipariş notu/açıklama alanına sipariş kodunu yazman gerekiyor.

Sipariş kodun: ${order.orderCode}

Teslim süresi: Ödeme onayından sonra 2–4 iş günü.

Sevgiler,
Leony`;
  logEmail("customer-received", order.customerEmail, subject, body);
  updateOrder(order.id, {
    customerOrderReceivedEmailSent: true,
    customerOrderReceivedEmailSentAt: new Date().toISOString(),
  });
}

export async function sendPaymentConfirmationEmail(order: StoryOrder) {
  const subject = "Ödemen onaylandı, Story of Us siten hazırlanıyor 💌";
  const body = `Merhaba ${order.customerName},

Ödemen başarıyla onaylandı. Story of Us web sitenin hazırlanma süreci başladı. 💌

Sipariş kodun: ${order.orderCode}
Seçilen stil: ${order.selectedStyle}
Seçilen paket: ${order.selectedPackage}
Toplam ödeme: ${order.totalPrice} TL
İstenen website linki: leony.tech/storyofus/${order.desiredSlug}
Teslimat e-postası: ${order.deliveryEmail}

Teslim süresi: 2–4 iş günü içinde.

Sevgiler,
Leony`;
  logEmail("payment-confirmed", order.customerEmail, subject, body);
  updateOrder(order.id, {
    paymentConfirmationEmailSent: true,
    paymentConfirmationEmailSentAt: new Date().toISOString(),
  });
}

export async function sendDeliveryEmail(order: StoryOrder, finalWebsiteLink: string) {
  const subject = "Story of Us web siten hazır 💌";
  const body = `Merhaba ${order.customerName},

Story of Us web siten hazır. 💌

Sipariş kodun: ${order.orderCode}
Web sitene buradan ulaşabilirsin: ${finalWebsiteLink}
Site görünürlüğü: ${order.visibility}

Güzel günlerde kullanmanız dileğiyle.
Leony`;
  logEmail("delivery", order.deliveryEmail, subject, body);
  updateOrder(order.id, {
    finalWebsiteLink,
    deliveryEmailSent: true,
    deliveryEmailSentAt: new Date().toISOString(),
    orderStatus: "Teslim Edildi",
  });
}

export async function sendPaymentReminderEmail(order: StoryOrder) {
  const subject = "Story of Us siparişin için ödeme hatırlatması 💌";
  const body = `Merhaba ${order.customerName},

Sipariş kodun: ${order.orderCode}
Toplam: ${order.totalPrice} TL

Ödeme henüz alınmadı. Sipariş kodunu Shopier notuna yazmayı unutma.

Sevgiler,
Leony`;
  logEmail("reminder", order.customerEmail, subject, body);
  updateOrder(order.id, {
    reminderEmailSent: true,
    reminderEmailSentAt: new Date().toISOString(),
  });
}
