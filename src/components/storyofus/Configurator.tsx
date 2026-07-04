import { useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LivePreview } from "./LivePreview";
import {
  ANIMATIONS,
  COLOR_THEMES,
  FONTS,
  MARKETING_PERMISSIONS,
  MARKETING_PRIVACY,
  PACKAGES,
  PHOTO_LAYOUTS,
  STYLES,
  VISIBILITY,
  getShopierPaymentLink,
  type AnimationId,
  type ColorThemeId,
  type FontId,
  type MarketingPermissionId,
  type MarketingPrivacyId,
  type PackageId,
  type PhotoLayoutId,
  type StyleId,
  type VisibilityId,
} from "@/lib/storyofus/config";
import { createOrder } from "@/lib/storyofus/storage";
import {
  sendAdminLeadEmail,
  sendCustomerOrderReceivedEmail,
} from "@/lib/storyofus/emails";
import type { StoryOrder } from "@/lib/storyofus/types";
import {
  formatTL,
  isValidEmail,
  isValidSlug,
  isValidTrPhone,
  slugify,
} from "@/lib/storyofus/utils";

interface Props {
  style: StyleId;
}

export function Configurator({ style }: Props) {
  const styleDef = STYLES.find((s) => s.id === style)!;

  const [colorTheme, setColorTheme] = useState<ColorThemeId>(styleDef.defaults.colorTheme);
  const [font, setFont] = useState<FontId>(styleDef.defaults.font);
  const [photoLayout, setPhotoLayout] = useState<PhotoLayoutId>(styleDef.defaults.photoLayout);
  const [animation, setAnimation] = useState<AnimationId>(styleDef.defaults.animation);
  const [visibility, setVisibility] = useState<VisibilityId>("hidden");
  const [packageId, setPackageId] = useState<PackageId>("premium");
  const [marketingPerm, setMarketingPerm] = useState<MarketingPermissionId>("none");
  const [marketingPrivacy, setMarketingPrivacy] = useState<MarketingPrivacyId>("full");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<StoryOrder | null>(null);

  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const vis = VISIBILITY.find((v) => v.id === visibility)!;
  const perm = MARKETING_PERMISSIONS.find((m) => m.id === marketingPerm)!;
  const totalPrice = pkg.activePrice + vis.extraPrice - perm.discount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white">
      <header className="border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <a href="/storyofus" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-500" />
            <span className="font-semibold">Story of Us</span>
          </a>
          <div className="text-xs text-muted-foreground">
            Stil: <span className="font-semibold text-foreground">{styleDef.name}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-8 md:py-12 lg:grid-cols-[1fr_1.1fr]">
        {/* Live Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Canlı Önizleme
            </h2>
          </div>
          <LivePreview
            partnerOne="Ahmet"
            partnerTwo="Ceren"
            date="14.02.2024"
            loveNote="Seninle her gün, en sevdiğim hikayenin yeni bir sayfası gibi."
            song="Bizim şarkımız"
            colorTheme={colorTheme}
            font={font}
            photoLayout={photoLayout}
            animation={animation}
          />

          {/* Visibility */}
          <div className="mt-6">
            <SectionTitle>Site Görünürlüğü</SectionTitle>
            <div className="mt-3 grid gap-2">
              {VISIBILITY.map((v) => {
                const Icon = v.id === "public" ? Eye : v.id === "hidden" ? EyeOff : Lock;
                const selected = visibility === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVisibility(v.id)}
                    className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 bg-rose-50/70 shadow-sm ring-2 ring-rose-200"
                        : "border-border bg-white hover:border-rose-200"
                    }`}
                  >
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-full ${
                        selected ? "bg-rose-500 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{v.label}</span>
                        {v.badge && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                            {v.badge}
                          </span>
                        )}
                        {v.extraPrice > 0 && (
                          <span className="text-xs text-muted-foreground">
                            +{v.extraPrice} TL
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-rose-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customization */}
        <div className="space-y-8">
          {/* Colors */}
          <div>
            <SectionTitle>Renk Teması</SectionTitle>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {COLOR_THEMES.map((c) => {
                const selected = colorTheme === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorTheme(c.id)}
                    className={`group rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 shadow-sm ring-2 ring-rose-200"
                        : "border-border hover:border-rose-200"
                    }`}
                  >
                    <div className="flex gap-1">
                      {c.swatches.map((sw, i) => (
                        <span
                          key={i}
                          className="h-8 flex-1 rounded-md"
                          style={{ background: sw }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{c.label}</span>
                      {selected && <Check className="h-4 w-4 text-rose-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font */}
          <div>
            <SectionTitle>Font Stili</SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {FONTS.map((f) => {
                const selected = font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFont(f.id)}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 shadow-sm ring-2 ring-rose-200"
                        : "border-border hover:border-rose-200"
                    }`}
                  >
                    <div
                      className="text-2xl"
                      style={{ fontFamily: f.family, lineHeight: 1.1 }}
                    >
                      Ahmet & Ceren
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">{f.label}</span>
                      {selected && <Check className="h-4 w-4 text-rose-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo layout */}
          <div>
            <SectionTitle>Fotoğraf Düzeni</SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {PHOTO_LAYOUTS.map((p) => {
                const selected = photoLayout === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPhotoLayout(p.id)}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 shadow-sm ring-2 ring-rose-200"
                        : "border-border hover:border-rose-200"
                    }`}
                  >
                    <div className="h-14 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{p.label}</span>
                      {selected && <Check className="h-4 w-4 text-rose-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animation */}
          <div>
            <SectionTitle>Animasyon Stili</SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {ANIMATIONS.map((a) => {
                const selected = animation === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAnimation(a.id)}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 shadow-sm ring-2 ring-rose-200"
                        : "border-border hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{a.label}</span>
                      {selected && <Check className="h-4 w-4 text-rose-500" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Packages */}
          <div>
            <SectionTitle>Paketini Seç</SectionTitle>
            <div className="mt-3 grid gap-3">
              {PACKAGES.map((p) => {
                const selected = packageId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPackageId(p.id)}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 bg-rose-50/60 shadow-sm ring-2 ring-rose-200"
                        : "border-border bg-white hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold">{p.label}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xs text-muted-foreground line-through">
                            {p.originalPrice} TL
                          </span>
                          <span className="text-lg font-bold text-rose-600">
                            {p.activePrice} TL
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{p.delivery}</div>
                      </div>
                      {selected && <Check className="h-5 w-5 text-rose-500" />}
                    </div>
                    <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3 w-3 text-rose-500" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marketing */}
          <div>
            <SectionTitle>Tanıtım Kullanım İzni</SectionTitle>
            <div className="mt-3 grid gap-3">
              {MARKETING_PERMISSIONS.map((m) => {
                const selected = marketingPerm === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMarketingPerm(m.id)}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-rose-400 bg-rose-50/60 shadow-sm ring-2 ring-rose-200"
                        : "border-border bg-white hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">{m.label}</div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {m.discount > 0 && (
                          <span className="text-sm font-bold text-emerald-600">
                            -{m.discount} TL
                          </span>
                        )}
                        {selected && <Check className="mx-auto mt-1 h-4 w-4 text-rose-500" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {marketingPerm !== "none" && (
              <div className="mt-4 space-y-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Gizlilik tercihi
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MARKETING_PRIVACY.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setMarketingPrivacy(p.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs cursor-pointer ${
                          marketingPrivacy === p.id
                            ? "border-rose-400 bg-rose-500 text-white"
                            : "border-border bg-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Bu tercihi isteğe bağlı olarak yaptığımı, web sitemin seçtiğim kapsamda tanıtım
                    amacıyla kullanılmasına izin verdiğimi ve bu izni daha sonra geri
                    çekebileceğimi biliyorum.
                  </span>
                </label>
                <p className="text-[11px] text-muted-foreground">
                  İzin daha sonra geri çekilirse, kişisel bilgiler ve gerçek içerikler
                  tanıtımlardan kaldırılır. Daha önce yayınlanmış veya gösterilmiş içeriklerin
                  geçmiş görüntülenmeleri geri alınamayabilir.
                </p>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-md">
            <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Sipariş Özeti
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <SummaryRow label={`${pkg.label} Paket`}>
                <span className="mr-2 text-xs text-muted-foreground line-through">
                  {pkg.originalPrice} TL
                </span>
                <span className="font-semibold">{pkg.activePrice} TL</span>
              </SummaryRow>
              {vis.extraPrice > 0 && (
                <SummaryRow label={vis.label}>
                  <span>+{vis.extraPrice} TL</span>
                </SummaryRow>
              )}
              {perm.discount > 0 && (
                <SummaryRow label="Tanıtım Kullanım İzni">
                  <span className="text-emerald-600">-{perm.discount} TL</span>
                </SummaryRow>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-base font-semibold">Toplam</span>
                <span className="text-2xl font-bold text-rose-600">{formatTL(totalPrice)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (marketingPerm !== "none" && !marketingConsent) {
                  toast.error("Lütfen tanıtım kullanım iznini onaylayın.");
                  return;
                }
                setFormOpen(true);
              }}
              className="mt-5 w-full rounded-full bg-rose-500 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 cursor-pointer"
            >
              Sipariş Ver
            </button>
          </div>
        </div>
      </div>

      {formOpen && !submittedOrder && (
        <OrderFormModal
          style={style}
          colorTheme={colorTheme}
          font={font}
          photoLayout={photoLayout}
          animation={animation}
          visibility={visibility}
          packageId={packageId}
          marketingPerm={marketingPerm}
          marketingPrivacy={marketingPrivacy}
          marketingConsent={marketingConsent}
          totalPrice={totalPrice}
          onClose={() => setFormOpen(false)}
          onSubmitted={(o) => setSubmittedOrder(o)}
        />
      )}

      {submittedOrder && (
        <PaymentInstructionScreen
          order={submittedOrder}
          onClose={() => {
            setSubmittedOrder(null);
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h3>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

// -----------------------------------------------------------
// Order form modal
// -----------------------------------------------------------

interface FormProps {
  style: StyleId;
  colorTheme: ColorThemeId;
  font: FontId;
  photoLayout: PhotoLayoutId;
  animation: AnimationId;
  visibility: VisibilityId;
  packageId: PackageId;
  marketingPerm: MarketingPermissionId;
  marketingPrivacy: MarketingPrivacyId;
  marketingConsent: boolean;
  totalPrice: number;
  onClose: () => void;
  onSubmitted: (o: StoryOrder) => void;
}

function OrderFormModal(props: FormProps) {
  const {
    style, colorTheme, font, photoLayout, animation, visibility, packageId,
    marketingPerm, marketingPrivacy, marketingConsent, totalPrice,
  } = props;

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [useSameEmailForDelivery, setUseSameEmailForDelivery] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partnerOne, setPartnerOne] = useState("");
  const [partnerTwo, setPartnerTwo] = useState("");
  const [relationshipDate, setRelationshipDate] = useState("");
  const [specialDate, setSpecialDate] = useState("");
  const [desiredSlug, setDesiredSlug] = useState("");
  const [loveNote, setLoveNote] = useState("");
  const [story, setStory] = useState("");
  const [song, setSong] = useState("");
  const [password, setPassword] = useState("");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const [marketingConsentForm, setMarketingConsentForm] = useState(marketingConsent);
  const [submitting, setSubmitting] = useState(false);

  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const vis = VISIBILITY.find((v) => v.id === visibility)!;
  const perm = MARKETING_PERMISSIONS.find((m) => m.id === marketingPerm)!;

  const slugPreview = useMemo(() => desiredSlug || "adınız-partnerinizin-adı", [desiredSlug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) return toast.error("Ad Soyad zorunludur.");
    if (!isValidEmail(customerEmail)) return toast.error("Lütfen geçerli bir e-posta adresi girin.");
    if (!useSameEmailForDelivery && !isValidEmail(deliveryEmail))
      return toast.error("Lütfen geçerli bir teslimat e-postası girin.");
    if (!isValidTrPhone(customerPhone))
      return toast.error("Lütfen geçerli bir telefon numarası girin.");
    if (!partnerOne.trim() || !partnerTwo.trim())
      return toast.error("Her iki partnerin adı zorunludur.");
    if (!isValidSlug(desiredSlug))
      return toast.error("Lütfen boşluk kullanmadan, sadece harf, sayı ve tire içeren bir link yazın.");
    if (visibility === "password_protected" && password.trim().length < 4)
      return toast.error("Site şifresi en az 4 karakter olmalıdır.");
    if (!consent1 || !consent2 || !consent3)
      return toast.error("Lütfen tüm onay kutucuklarını işaretleyin.");
    if (marketingPerm !== "none" && !marketingConsentForm)
      return toast.error("Lütfen tanıtım kullanım iznini onaylayın.");

    setSubmitting(true);
    try {
      const order = createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        useSameEmailForDelivery,
        deliveryEmail: useSameEmailForDelivery ? customerEmail.trim() : deliveryEmail.trim(),
        customerPhone: customerPhone.trim(),
        partnerOneName: partnerOne.trim(),
        partnerTwoName: partnerTwo.trim(),
        relationshipDate,
        specialDate,
        desiredSlug: desiredSlug.trim(),
        selectedStyle: style,
        selectedColorTheme: colorTheme,
        selectedFont: font,
        selectedPhotoLayout: photoLayout,
        selectedAnimation: animation,
        selectedPackage: packageId,
        packageOriginalPrice: pkg.originalPrice,
        packageDiscountedPrice: pkg.activePrice,
        packageActivePrice: pkg.activePrice,
        visibility,
        visibilityExtraPrice: vis.extraPrice,
        password: visibility === "password_protected" ? password : null,
        loveNote: loveNote.trim(),
        story: story.trim(),
        song: song.trim(),
        photos: [],
        marketingPermissionType: marketingPerm,
        marketingDiscount: perm.discount,
        marketingPrivacyPreference: marketingPerm !== "none" ? marketingPrivacy : null,
        marketingConsentAccepted: marketingPerm !== "none" ? marketingConsentForm : false,
        totalPrice,
        paymentStatus: "Ödeme Bekleniyor",
        orderStatus: "Form Alındı",
        shopierPaymentDate: null,
        shopierPaymentTime: null,
        shopierPaymentNote: null,
        matchedBy: null,
        finalWebsiteLink: null,
        internalAdminNotes: null,
        adminLeadEmailSent: false,
        adminLeadEmailSentAt: null,
        customerOrderReceivedEmailSent: false,
        customerOrderReceivedEmailSentAt: null,
        paymentConfirmationEmailSent: false,
        paymentConfirmationEmailSentAt: null,
        deliveryEmailSent: false,
        deliveryEmailSentAt: null,
        reminderEmailSent: false,
        reminderEmailSentAt: null,
      });
      await Promise.all([
        sendAdminLeadEmail(order),
        sendCustomerOrderReceivedEmail(order),
      ]);
      toast.success("Sipariş bilgilerin alındı 💌");
      props.onSubmitted(order);
    } catch (err: any) {
      toast.error(err?.message ?? "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="mx-auto my-6 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Bilgilerini Gönder</h2>
            <p className="text-xs text-muted-foreground">
              Toplam:{" "}
              <span className="font-semibold text-rose-600">{formatTL(totalPrice)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-full border border-border px-3 py-1 text-xs cursor-pointer"
          >
            Kapat
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Ad Soyad" required>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="E-posta" required>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} required />
          </Field>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={useSameEmailForDelivery} onChange={(e) => setUseSameEmailForDelivery(e.target.checked)} className="mt-0.5" />
            <span>Teslimat maili olarak bu e-posta adresi kullanılsın.</span>
          </label>
          {!useSameEmailForDelivery && (
            <Field label="Teslimat e-postası" required>
              <input type="email" value={deliveryEmail} onChange={(e) => setDeliveryEmail(e.target.value)} placeholder="teslimat@example.com" className={inputCls} required />
            </Field>
          )}
          <Field label="Telefon Numarası" required helper="Siparişinizle ilgili size ulaşabilmemiz için telefon numaranızı yazın.">
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="05xxxxxxxxx" className={inputCls} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Senin adın" required>
              <input value={partnerOne} onChange={(e) => setPartnerOne(e.target.value)} className={inputCls} required />
            </Field>
            <Field label="Partnerinin adı" required>
              <input value={partnerTwo} onChange={(e) => setPartnerTwo(e.target.value)} className={inputCls} required />
            </Field>
            <Field label="İlişki başlangıç tarihi">
              <input type="date" value={relationshipDate} onChange={(e) => setRelationshipDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Özel gün / hediye tarihi">
              <input type="date" value={specialDate} onChange={(e) => setSpecialDate(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="İstediğiniz website linki" required helper={`Önizleme: leony.tech/storyofus/${slugPreview}`}>
            <input
              value={desiredSlug}
              onChange={(e) => setDesiredSlug(slugify(e.target.value))}
              placeholder="ahmet-ceren"
              className={inputCls}
              required
            />
          </Field>

          <Field label="Aşk notunuz">
            <textarea value={loveNote} onChange={(e) => setLoveNote(e.target.value)} className={inputCls} rows={2} />
          </Field>
          <Field label="Hikayeniz">
            <textarea value={story} onChange={(e) => setStory(e.target.value)} className={inputCls} rows={3} />
          </Field>
          <Field label="Şarkınız">
            <input value={song} onChange={(e) => setSong(e.target.value)} className={inputCls} />
          </Field>

          <div className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
            Fotoğraf yükleme alanı yakında aktif olacak. Şimdilik sipariş sonrası sizinle iletişime geçilecektir.
          </div>

          {visibility === "password_protected" && (
            <Field label="Site şifresi" required helper="Bu şifreyi bilmeyen kişiler web sitenizi görüntüleyemez.">
              <input value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
            </Field>
          )}

          <div className="space-y-2 rounded-2xl bg-muted/40 p-4 text-xs">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} className="mt-0.5" />
              <span>Paylaştığım bilgilerin kişisel web sitemin hazırlanması için kullanılmasına izin veriyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} className="mt-0.5" />
              <span>Partnerime ait bilgileri/fotoğrafları paylaşma hakkım olduğunu onaylıyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={consent3} onChange={(e) => setConsent3(e.target.checked)} className="mt-0.5" />
              <span>Kişiye özel dijital ürün olduğu için tasarım süreci başladıktan sonra iptal/iade koşullarını okudum.</span>
            </label>
            {marketingPerm !== "none" && (
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={marketingConsentForm} onChange={(e) => setMarketingConsentForm(e.target.checked)} className="mt-0.5" />
                <span>Tanıtım kullanım iznini seçtiğim kapsamda verdiğimi onaylıyorum.</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-rose-500 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Gönderiliyor..." : "Bilgilerimi Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

function Field({
  label, required, helper, children,
}: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {helper && <span className="mt-1 block text-[11px] text-muted-foreground">{helper}</span>}
    </label>
  );
}

// -----------------------------------------------------------
// Payment instruction screen
// -----------------------------------------------------------

function PaymentInstructionScreen({ order, onClose }: { order: StoryOrder; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [ack, setAck] = useState(false);
  const canProceed = copied && ack;

  const paymentLink = getShopierPaymentLink(
    order.totalPrice,
    order.selectedPackage,
    order.visibility,
    order.marketingPermissionType,
  );

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
            💌
          </div>
          <h2 className="mt-4 text-2xl font-bold">Sipariş bilgilerin alındı 💌</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.createdAtDate} · {order.createdAtTime}
          </p>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl bg-muted/40 p-4 text-sm">
          <SummaryRow2 k="Stil" v={order.selectedStyle} />
          <SummaryRow2 k="Paket" v={order.selectedPackage} />
          <SummaryRow2 k="Toplam" v={formatTL(order.totalPrice)} bold />
          <SummaryRow2 k="Teslim süresi" v="Ödeme onayından sonra 2–4 iş günü" />
        </div>

        <div className="mt-6 rounded-3xl border-2 border-rose-200 bg-rose-50/50 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-rose-700">Sipariş Kodu</div>
          <div className="mt-2 select-all font-mono text-2xl font-bold text-rose-700">
            {order.orderCode}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(order.orderCode).then(() => {
                setCopied(true);
                toast.success("Kod kopyalandı");
              });
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" /> Kodu Kopyala
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Ödeme yaparken Shopier sipariş notu/açıklama alanına bu sipariş kodunu yazmanız gerekmektedir.
          Bu kod, ödemenizin siparişinizle eşleşmesi için kullanılır.
        </p>

        <label className="mt-4 flex items-start gap-2 text-xs">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
          <span>
            Sipariş kodumu kopyaladım ve Shopier ödeme notu/açıklama alanına yazacağımı onaylıyorum.
          </span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm cursor-pointer"
          >
            Kapat
          </button>
          <a
            href={canProceed ? paymentLink : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!canProceed}
            onClick={(e) => {
              if (!canProceed) e.preventDefault();
            }}
            className={`rounded-full px-5 py-2 text-center text-sm font-semibold text-white transition ${
              canProceed
                ? "bg-rose-500 hover:bg-rose-600 cursor-pointer"
                : "cursor-not-allowed bg-rose-300"
            }`}
          >
            Ödemeye Geç · {formatTL(order.totalPrice)}
          </a>
        </div>
      </div>
    </div>
  );
}

function SummaryRow2({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={bold ? "text-base font-bold text-rose-600" : "font-medium"}>{v}</span>
    </div>
  );
}
