import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, Mail, ShieldCheck } from "lucide-react";

import { storyOfUsDemoCtaConfig } from "../lib/storyofus/demoCtaConfig";

export const Route = createFileRoute("/storyofus/refund-policy")({
  head: () => ({
    meta: [
      { title: "StoryOfUs iade politikası | Leony" },
      {
        name: "description",
        content:
          "StoryOfUs kişiye özel web sitesi için 3 saatlik düzenleme ve iade talebi süreci.",
      },
    ],
  }),
  component: StoryOfUsRefundPolicyRoute,
});

function StoryOfUsRefundPolicyRoute() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_48%,#fffaf7_100%)] px-4 py-8 text-rose-950 sm:px-6 sm:py-12">
      <section className="mx-auto grid max-w-4xl gap-6">
        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-lg shadow-rose-100/70">
            <HeartHandshake className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
            StoryOfUs
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            İade Politikası
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-rose-950/65 sm:text-base">
            StoryOfUs kişiye özel hazırlanan romantik bir web sitesi hizmetidir. Bu nedenle iade
            sürecini, hazırlık başlamadan önceki düzenleme penceresiyle birlikte açık ve sakin
            şekilde yönetiyoruz.
          </p>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-xl shadow-rose-100/60 backdrop-blur sm:p-7">
          <PolicyBlock
            title="Hizmet ne zaman başlar?"
            body="Ödeme tek başına kişiselleştirilmiş hazırlığı başlatmaz. Kurulum formunu açmanız da hazırlığın başladığı anlamına gelmez. Hazırlık, ilk başarılı kurulum formu gönderiminden sonra verilen 3 saatlik düzenleme ve iade talebi süresi sona erdiğinde başlar."
          />
          <PolicyBlock
            title="3 saatlik düzenleme ve iade talebi süresi"
            body="İlk başarılı kurulum formu gönderiminden sonra bilgilerinizi düzenleyebilmeniz için 3 saatlik bir süre bulunur. Bu süre içinde iade talebinizi de iletebilirsiniz. Kesin son tarih siparişinizin düzenleme bitiş zamanı olan editable_until değerine göre belirlenir."
          />
          <PolicyBlock
            title="Süre sona erdiğinde"
            body="3 saatlik süre sona erdiğinde gönderdiğiniz bilgiler kilitlenir ve kişiselleştirilmiş StoryOfUs web sitenizin hazırlanmasına başlanır. Hazırlık başladıktan sonra yalnızca fikir değişikliğine dayalı iade talepleri kabul edilmez."
          />
          <PolicyBlock
            title="Yasal haklarınız saklıdır"
            body="Hizmetin eksik, ayıplı, hatalı, ulaşılamaz veya taahhüt edildiği şekilde sunulmaması hâlindeki yasal haklarınız saklıdır. Mükerrer veya hatalı ödemeler ayrıca değerlendirilir."
          />
        </div>

        <div className="rounded-[2rem] border border-rose-100 bg-[#fffaf8]/90 p-5 shadow-sm shadow-rose-100/60 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-rose-600 shadow-sm shadow-rose-100/70">
              <Mail className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-950">İade talebi nasıl iletilir?</h2>
              <p className="mt-2 text-sm leading-7 text-rose-950/65">
                İade talepleri{" "}
                <a
                  href="mailto:contact@leony.tech"
                  className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 transition hover:text-rose-700"
                >
                  contact@leony.tech
                </a>{" "}
                adresi üzerinden alınır. Talebinizin 3 saatlik düzenleme ve iade talebi süresi
                dolmadan Leony’ye ulaşması gerekir.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-rose-100 bg-white/85 p-5 shadow-sm shadow-rose-100/60 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600 shadow-sm shadow-rose-100/70">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-950">Kısa özet</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-rose-950/65">
                <li>Ödeme sonrası kurulum formunuzu doldurursunuz.</li>
                <li>İlk başarılı gönderimden sonra 3 saatlik düzenleme ve iade talebi süresi başlar.</li>
                <li>Süre bitince bilgileriniz kilitlenir ve kişiselleştirilmiş hazırlık başlar.</li>
                <li>Hazırlık başladıktan sonra fikir değişikliğine dayalı iade sunulmaz.</li>
                <li>Eksik, hatalı veya taahhüt edildiği gibi sunulmayan hizmetlere ilişkin haklarınız saklıdır.</li>
              </ul>
            </div>
          </div>
        </div>

        <Link
          to={storyOfUsDemoCtaConfig.mainPath}
          className="mx-auto inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-rose-700 shadow-sm shadow-rose-100 transition hover:bg-rose-50"
        >
          StoryOfUs sayfasına dön
        </Link>
      </section>
    </main>
  );
}

function PolicyBlock({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-rose-100 bg-[#fffaf8]/80 p-4 shadow-sm shadow-rose-100/40">
      <h2 className="text-lg font-bold text-rose-950">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-rose-950/65">{body}</p>
    </article>
  );
}
