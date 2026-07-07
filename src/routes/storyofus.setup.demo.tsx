import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Upload, X, Plus, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/storyofus/setup/demo")({
  head: () => ({
    meta: [
      { title: "StoryOfUs Setup (Demo) | Leony" },
      { name: "description", content: "Sitenin bilgilerini girip özelleştirdiğin demo setup formu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetupDemo,
});

const FONTS = [
  { id: "cursive", label: "Cursive (Great Vibes)", family: '"Great Vibes", cursive' },
  { id: "serif", label: "Elegant Serif (Playfair)", family: '"Playfair Display", Georgia, serif' },
  { id: "sans", label: "Modern Sans", family: "Inter, system-ui, sans-serif" },
];

type Memory = { date: string; title: string; desc: string };
type Photo = { name: string; caption: string };

function SetupDemo() {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name1: "",
    name2: "",
    startDate: "",
    hero: "",
    letter: "",
    songTitle: "",
    artist: "",
    songUrl: "",
    songNote: "",
    voiceNoteTitle: "",
    voiceNoteFileName: "",
    voiceNoteTranscript: "",
    font: "cursive",
    mainColor: "#e11d48",
    bgColor: "#fff5f7",
    accentColor: "#ec4899",
    accessPin: "",
    accessPinHint: "",
    finalMessage: "",
  });
  const [photos, setPhotos] = useState<Photo[]>([
    { name: "", caption: "" },
    { name: "", caption: "" },
    { name: "", caption: "" },
  ]);
  const [memories, setMemories] = useState<Memory[]>([
    { date: "", title: "", desc: "" },
    { date: "", title: "", desc: "" },
    { date: "", title: "", desc: "" },
  ]);
  const [reasons, setReasons] = useState<string[]>(["", "", "", "", ""]);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const addPhoto = () => photos.length < 5 && setPhotos([...photos, { name: "", caption: "" }]);
  const rmPhoto = (i: number) => photos.length > 3 && setPhotos(photos.filter((_, x) => x !== i));

  const addReason = () => reasons.length < 10 && setReasons([...reasons, ""]);
  const rmReason = (i: number) => reasons.length > 5 && setReasons(reasons.filter((_, x) => x !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(form.accessPin)) {
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center bg-[linear-gradient(180deg,#fff5f7,#ffd1de)] px-6">
        <div className="max-w-lg text-center bg-white/80 backdrop-blur border border-rose-200 rounded-3xl p-10 shadow-xl shadow-rose-300/40">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1
            className="mt-6 text-4xl text-rose-700"
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            Bilgilerin alındı 💌
          </h1>
          <p className="mt-4 text-rose-950/70 leading-relaxed">
            Gerçek sistemde web siten hazırlanıyor maili gönderilecek. Site hazır olduğunda
            özel linkin mailine düşecek.
          </p>
          <Link
            to="/storyofus"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose-700 text-white px-6 py-3 hover:bg-rose-800 transition"
          >
            <Heart className="h-4 w-4 fill-white" /> Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff5f7_0%,#ffe4ec_100%)] text-rose-950">
      <header className="px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
        <Link to="/storyofus" className="font-serif text-lg text-rose-700">
          Leony · StoryOfUs
        </Link>
        <span className="text-xs text-rose-950/60">Demo Setup</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-500">Sitenin bilgileri</p>
          <h1
            className="mt-3 text-5xl text-rose-700"
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            Hikayenizi anlatın
          </h1>
          <p className="mt-3 text-rose-950/70">
            Her alanı doldur, sitenin nasıl görüneceğini biz hazırlayalım.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card title="İkiniz">
            <Grid2>
              <Field label="Person 1 ismi">
                <Input value={form.name1} onChange={upd("name1")} required placeholder="Ada" />
              </Field>
              <Field label="Person 2 ismi">
                <Input value={form.name2} onChange={upd("name2")} required placeholder="Mert" />
              </Field>
            </Grid2>
            <Field label="İlişkinin başladığı tarih">
              <Input type="date" value={form.startDate} onChange={upd("startDate")} required />
            </Field>
          </Card>

          <Card title="Ana mesaj & mektup">
            <Field label="Ana hero mesajı">
              <Input
                value={form.hero}
                onChange={upd("hero")}
                placeholder="Bu, bizim küçük dijital anı kutumuz..."
                required
              />
            </Field>
            <Field label="Aşk mektubu / kişisel not">
              <Textarea
                value={form.letter}
                onChange={upd("letter")}
                rows={6}
                placeholder="Sevgilime yazmak istediğim her şey..."
                required
              />
            </Field>
          </Card>

          <Card title={`Fotoğraflar (${photos.length}/5)`}>
            <div className="space-y-3">
              {photos.map((p, i) => (
                <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-rose-900">Fotoğraf {i + 1}</span>
                    {photos.length > 3 && (
                      <button type="button" onClick={() => rmPhoto(i)} className="text-rose-400 hover:text-rose-700">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border border-dashed border-rose-300 bg-white px-4 py-3 cursor-pointer hover:bg-rose-50">
                    <Upload className="h-4 w-4 text-rose-500" />
                    <span className="text-sm text-rose-950/70">
                      {p.name || "Fotoğraf yükle (demo)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const next = [...photos];
                        next[i] = { ...next[i], name: e.target.files?.[0]?.name ?? "" };
                        setPhotos(next);
                      }}
                    />
                  </label>
                  <Input
                    className="mt-3"
                    placeholder="Fotoğraf açıklaması"
                    value={p.caption}
                    onChange={(e) => {
                      const next = [...photos];
                      next[i] = { ...next[i], caption: e.target.value };
                      setPhotos(next);
                    }}
                  />
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={addPhoto}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 bg-white/60 py-3 text-sm text-rose-700 hover:bg-white"
                >
                  <Plus className="h-4 w-4" /> Fotoğraf ekle
                </button>
              )}
            </div>
          </Card>

          <Card title="3 anı / kilometre taşı">
            <div className="space-y-3">
              {memories.map((m, i) => (
                <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                  <div className="text-sm font-medium text-rose-900">Anı {i + 1}</div>
                  <Grid2>
                    <Input
                      type="date"
                      value={m.date}
                      onChange={(e) => {
                        const n = [...memories];
                        n[i] = { ...n[i], date: e.target.value };
                        setMemories(n);
                      }}
                    />
                    <Input
                      placeholder="Başlık (İlk buluşma)"
                      value={m.title}
                      onChange={(e) => {
                        const n = [...memories];
                        n[i] = { ...n[i], title: e.target.value };
                        setMemories(n);
                      }}
                    />
                  </Grid2>
                  <Textarea
                    placeholder="Kısa açıklama"
                    rows={2}
                    value={m.desc}
                    onChange={(e) => {
                      const n = [...memories];
                      n[i] = { ...n[i], desc: e.target.value };
                      setMemories(n);
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Seni seviyorum çünkü… (${reasons.length}/10)`}>
            <div className="space-y-2">
              {reasons.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Sebep ${i + 1}`}
                    value={r}
                    onChange={(e) => {
                      const n = [...reasons];
                      n[i] = e.target.value;
                      setReasons(n);
                    }}
                  />
                  {reasons.length > 5 && (
                    <button type="button" onClick={() => rmReason(i)} className="text-rose-400 hover:text-rose-700 px-2">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {reasons.length < 10 && (
                <button
                  type="button"
                  onClick={addReason}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 bg-white/60 py-2.5 text-sm text-rose-700 hover:bg-white"
                >
                  <Plus className="h-4 w-4" /> Sebep ekle
                </button>
              )}
            </div>
          </Card>

          <Card title="Şarkı & tasarım">
            <Grid2>
              <Field label="Spotify şarkı adı">
                <Input
                  value={form.songTitle}
                  onChange={upd("songTitle")}
                  placeholder="Örn: Ahu"
                />
              </Field>
              <Field label="Sanatçı adı">
                <Input
                  value={form.artist}
                  onChange={upd("artist")}
                  placeholder="Örn: Mabel Matiz"
                />
              </Field>
            </Grid2>
            <Field label="Spotify / şarkı linki">
              <Input
                value={form.songUrl}
                onChange={upd("songUrl")}
                placeholder="https://open.spotify.com/track/..."
              />
            </Field>
            <Field label="Şarkı notu" helper="Opsiyonel. Şarkının sizin için anlamını yaz.">
              <Textarea
                value={form.songNote}
                onChange={upd("songNote")}
                rows={2}
                placeholder="Bu şarkıyı her dinlediğimde aklıma sen geliyorsun."
              />
            </Field>
            <Grid2>
              <Field label="Ses notu başlığı" helper="Opsiyonel.">
                <Input
                  value={form.voiceNoteTitle}
                  onChange={upd("voiceNoteTitle")}
                  placeholder="Sadece senin için"
                />
              </Field>
              <Field label="Ses notu dosyası" helper="Ses yükleme alanı demo amaçlıdır.">
                <label className="flex h-11 cursor-pointer items-center rounded-lg border border-dashed border-rose-300 bg-white px-3 text-sm text-rose-950/70 hover:bg-rose-50">
                  {form.voiceNoteFileName || "Ses dosyası yükle"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) =>
                      setForm({ ...form, voiceNoteFileName: e.target.files?.[0]?.name ?? "" })
                    }
                  />
                </label>
              </Field>
            </Grid2>
            <Field label="Ses notu metni" helper="Opsiyonel. Metni oku butonuyla gösterilir.">
              <Textarea
                value={form.voiceNoteTranscript}
                onChange={upd("voiceNoteTranscript")}
                rows={3}
                placeholder="Merhaba aşkım..."
              />
            </Field>
            <Field label="Yazı tipi (font)">
              <select
                value={form.font}
                onChange={upd("font")}
                className="w-full h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Grid2>
              <Field label="Ana renk">
                <Color value={form.mainColor} onChange={upd("mainColor")} />
              </Field>
              <Field label="Arka plan rengi">
                <Color value={form.bgColor} onChange={upd("bgColor")} />
              </Field>
              <Field label="Vurgu rengi">
                <Color value={form.accentColor} onChange={upd("accentColor")} />
              </Field>
            </Grid2>
          </Card>

          <Card title="Romantik giriş şifresi">
            <Field
              label="Sürpriz şifresi"
              helper="Sevgilinin tahmin edebileceği özel bir 4 haneli sayı seç."
            >
              <Input
                value={form.accessPin}
                onChange={(e) =>
                  setForm({ ...form, accessPin: e.target.value.replace(/\D/g, "").slice(0, 4) })
                }
                placeholder="Örn: 2022"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                required
              />
            </Field>
            <Field
              label="Şifre ipucu"
              helper="Şifreyi unutmaması için küçük, romantik bir ipucu yaz."
            >
              <Input
                value={form.accessPinHint}
                onChange={upd("accessPinHint")}
                placeholder="Örn: Tanıştığımız yıl"
              />
            </Field>
            {form.accessPin && !/^\d{4}$/.test(form.accessPin) && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                Şifre tam olarak 4 rakam olmalı.
              </p>
            )}
          </Card>

          <Card title="Gizli son mesaj">
            <Field label="Sevgilinin göreceği son sürpriz mesaj">
              <Textarea
                value={form.finalMessage}
                onChange={upd("finalMessage")}
                rows={3}
                placeholder="Seni her sabah yeniden seviyorum."
                required
              />
            </Field>
          </Card>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 py-4 text-white font-semibold shadow-lg shadow-rose-400/50 hover:scale-[1.01] transition-transform"
          >
            <Heart className="h-5 w-5 fill-white" /> Bilgileri Gönder
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur border border-rose-100 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-rose-500 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-rose-900/80">{label}</span>
      <div className="mt-1.5">{children}</div>
      {helper && <span className="mt-1.5 block text-[11px] leading-relaxed text-rose-950/55">{helper}</span>}
    </label>
  );
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Input({ className = "", ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...p}
      className={`w-full h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${className}`}
    />
  );
}
function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
    />
  );
}
function Color({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={onChange}
        className="h-11 w-14 rounded-lg border border-rose-200 bg-white cursor-pointer"
      />
      <input
        value={value}
        onChange={onChange}
        className="flex-1 h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-mono"
      />
    </div>
  );
}
