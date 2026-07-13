import type { StoryOfUsEmailType } from "./emailOutbox.server";

export type StoryOfUsEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export type StoryOfUsOrderCreatedTemplateInput = {
  emailType: "order_created";
  customerName: string;
  orderReference: string;
  setupUrl: string;
  trackOrderUrl: string;
};

export type StoryOfUsFinalSiteReadyTemplateInput = {
  emailType: "final_site_ready";
  customerName: string;
  orderReference: string;
  finalSiteUrl: string;
};

export type StoryOfUsEmailTemplateInput =
  StoryOfUsOrderCreatedTemplateInput | StoryOfUsFinalSiteReadyTemplateInput;

const SUPPORT_EMAIL = "contact@leony.tech";

export function createStoryOfUsEmailTemplate(
  input: StoryOfUsEmailTemplateInput,
): StoryOfUsEmailTemplate {
  if (input.emailType === "order_created") {
    return createOrderCreatedTemplate(input);
  }

  return createFinalSiteReadyTemplate(input);
}

export function getStoryOfUsEmailTemplateSubject(
  emailType: StoryOfUsEmailType,
  orderReference: string,
) {
  if (emailType === "order_created") {
    return `${orderReference} numaralı siparişiniz oluşturuldu 💌`;
  }

  return "StoryOfUs sayfanız hazır 💖";
}

function createOrderCreatedTemplate(
  input: StoryOfUsOrderCreatedTemplateInput,
): StoryOfUsEmailTemplate {
  const safeCustomerName = escapeHtml(input.customerName);
  const safeOrderReference = escapeHtml(input.orderReference);
  const safeSetupUrl = escapeHtml(input.setupUrl);
  const safeTrackOrderUrl = escapeHtml(input.trackOrderUrl);
  const subject = getStoryOfUsEmailTemplateSubject("order_created", input.orderReference);

  return {
    subject,
    html: renderEmailShell({
      eyebrow: "Siparişiniz oluşturuldu",
      title: "StoryOfUs yolculuğunuz başladı",
      preview:
        "StoryOfUs siparişiniz oluşturuldu. Kişisel bilgilerinizi tamamlamak için özel kurulum bağlantınızı kullanabilirsiniz.",
      bodyHtml: `
        <p>Merhaba ${safeCustomerName},</p>
        <p><strong>${safeOrderReference}</strong> numaralı StoryOfUs siparişiniz başarıyla oluşturuldu.</p>
        <p>Şimdi sırada sevgilinize özel hazırlanacak sayfa için fotoğraflarınızı, müziğinizi, anılarınızı ve mektup detaylarınızı tamamlamak var.</p>
        <p>Kurulum bilgilerinizi aşağıdaki özel bağlantıdan doldurabilirsiniz. Final StoryOfUs web siteniz hazır olduğunda size ayrıca e-posta ile haber vereceğiz.</p>
        ${renderButton("Kurulum bilgilerini doldur", safeSetupUrl)}
        ${renderSecondaryButton("Siparişimi takip et", safeTrackOrderUrl)}
        ${renderRawLink("Kurulum bağlantısı", safeSetupUrl)}
        ${renderRawLink("Sipariş takip bağlantısı", safeTrackOrderUrl)}
        ${renderSupportNote()}
      `,
    }),
    text: [
      `Merhaba ${input.customerName},`,
      "",
      `${input.orderReference} numaralı StoryOfUs siparişiniz başarıyla oluşturuldu.`,
      "",
      "Sevgilinize özel hazırlanacak sayfa için fotoğraflarınızı, müziğinizi, anılarınızı ve mektup detaylarınızı özel kurulum bağlantınızdan tamamlayabilirsiniz.",
      "Final StoryOfUs web siteniz hazır olduğunda size ayrıca e-posta ile haber vereceğiz.",
      "",
      `Kurulum bağlantısı: ${input.setupUrl}`,
      `Sipariş takip bağlantısı: ${input.trackOrderUrl}`,
      "",
      `Herhangi bir konuda bize ${SUPPORT_EMAIL} adresinden yazabilirsiniz.`,
    ].join("\n"),
  };
}

function createFinalSiteReadyTemplate(
  input: StoryOfUsFinalSiteReadyTemplateInput,
): StoryOfUsEmailTemplate {
  const safeCustomerName = escapeHtml(input.customerName);
  const safeOrderReference = escapeHtml(input.orderReference);
  const safeFinalSiteUrl = escapeHtml(input.finalSiteUrl);
  const subject = getStoryOfUsEmailTemplateSubject("final_site_ready", input.orderReference);

  return {
    subject,
    html: renderEmailShell({
      eyebrow: "Sayfanız hazır",
      title: "StoryOfUs web siteniz hazır",
      preview:
        "Sevgilinize özel StoryOfUs sayfanız hazır. Final bağlantınızı bu e-postada bulabilirsiniz.",
      bodyHtml: `
        <p>Merhaba ${safeCustomerName},</p>
        <p><strong>${safeOrderReference}</strong> numaralı StoryOfUs siparişiniz hazırlandı.</p>
        <p>Sevgilinize özel romantik web sitenizi aşağıdaki bağlantıdan açabilirsiniz.</p>
        <p>Sayfada giriş şifresi istenirse, kurulum sırasında sizin belirlediğiniz dört haneli şifreyi kullanabilirsiniz. Güvenliğiniz için bu şifre e-postada paylaşılmaz.</p>
        ${renderButton("StoryOfUs sayfamı aç", safeFinalSiteUrl)}
        ${renderRawLink("Final site bağlantısı", safeFinalSiteUrl)}
        ${renderSupportNote()}
      `,
    }),
    text: [
      `Merhaba ${input.customerName},`,
      "",
      `${input.orderReference} numaralı StoryOfUs siparişiniz hazırlandı.`,
      "",
      "Sevgilinize özel romantik web sitenizi aşağıdaki bağlantıdan açabilirsiniz.",
      "Sayfada giriş şifresi istenirse, kurulum sırasında sizin belirlediğiniz dört haneli şifreyi kullanabilirsiniz. Güvenliğiniz için bu şifre e-postada paylaşılmaz.",
      "",
      `Final site bağlantısı: ${input.finalSiteUrl}`,
      "",
      `Herhangi bir konuda bize ${SUPPORT_EMAIL} adresinden yazabilirsiniz.`,
    ].join("\n"),
  };
}

function renderEmailShell({
  eyebrow,
  title,
  preview,
  bodyHtml,
}: {
  eyebrow: string;
  title: string;
  preview: string;
  bodyHtml: string;
}) {
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#fff1f5; color:#4c1d2f; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${escapeHtml(preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff1f5; margin:0; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; overflow:hidden; border-radius:28px; border:1px solid #fecdd3; background:#fffafa; box-shadow:0 24px 70px rgba(190, 24, 93, 0.14);">
            <tr>
              <td style="padding:32px 28px 18px; background:linear-gradient(135deg, #fff7fb 0%, #ffe4ec 48%, #fff7ed 100%);">
                <p style="margin:0 0 10px; color:#be185d; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0; color:#881337; font-family:Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.18; font-weight:700;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px 30px; font-size:16px; line-height:1.7; color:#5f273d;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0; color:#9f526c; font-size:12px; line-height:1.6;">
            StoryOfUs by Leony
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderButton(label: string, href: string) {
  return `<p style="margin:26px 0 14px;"><a href="${href}" style="display:inline-block; border-radius:999px; background:#be185d; color:#ffffff; font-size:15px; font-weight:700; line-height:1; padding:15px 22px; text-decoration:none; box-shadow:0 14px 32px rgba(190, 24, 93, 0.24);">${escapeHtml(label)}</a></p>`;
}

function renderSecondaryButton(label: string, href: string) {
  return `<p style="margin:0 0 20px;"><a href="${href}" style="display:inline-block; border-radius:999px; border:1px solid #f9a8d4; background:#fff7fb; color:#be185d; font-size:14px; font-weight:700; line-height:1; padding:13px 18px; text-decoration:none;">${escapeHtml(label)}</a></p>`;
}

function renderRawLink(label: string, href: string) {
  return `<p style="margin:12px 0 0; color:#7f1d4e; font-size:13px; line-height:1.6;"><strong>${escapeHtml(label)}:</strong><br><a href="${href}" style="color:#be185d; word-break:break-word;">${href}</a></p>`;
}

function renderSupportNote() {
  return `<p style="margin:24px 0 0; padding:16px 18px; border-radius:18px; background:#fff1f5; border:1px solid #fbcfe8; color:#7f1d4e; font-size:14px;">Herhangi bir konuda bize <a href="mailto:${SUPPORT_EMAIL}" style="color:#be185d; font-weight:700;">${SUPPORT_EMAIL}</a> adresinden yazabilirsiniz.</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
