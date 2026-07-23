import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Lock, MousePointerClick } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";

import {
  getStoryOfUsFocusTrapTargetIndex,
  shouldCloseStoryOfUsEditSubmitDialogOnEscape,
} from "../lib/storyofus/setupSubmitUiState";
import {
  getStoryOfUsSetupQaStates,
  isStoryOfUsSetupQaAllowed,
  type StoryOfUsSetupQaState,
} from "../lib/storyofus/storyOfUsSetupQaPreview";

export const Route = createFileRoute("/storyofus/internal/setup-qa")({
  head: () => ({
    meta: [
      { title: "StoryOfUs setup QA | Leony" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  loader: () => {
    if (!isStoryOfUsSetupQaAllowed()) {
      throw notFound();
    }

    return {
      states: getStoryOfUsSetupQaStates(),
    };
  },
  component: StoryOfUsSetupQaRoute,
});

function StoryOfUsSetupQaRoute() {
  const { states } = Route.useLoaderData() as { states: StoryOfUsSetupQaState[] };
  const [selectedId, setSelectedId] = useState<StoryOfUsSetupQaState["id"]>(states[0].id);
  const [openDialogId, setOpenDialogId] = useState<StoryOfUsSetupQaState["id"] | null>(null);
  const dialogOpenButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectedState = states.find((state) => state.id === selectedId) ?? states[0];
  const openDialogState = states.find(
    (state) => state.id === openDialogId && state.kind === "dialog",
  );

  function openDialog(stateId: StoryOfUsSetupQaState["id"]) {
    setOpenDialogId(stateId);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#ffe7ef_48%,#fffaf7_100%)] px-4 py-8 text-rose-950 sm:px-6">
      <section className="mx-auto grid max-w-7xl gap-6">
        <header className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-rose-100/70 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-500">
            Preview-only internal QA
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-4xl">
            StoryOfUs setup ve düzenleme ekranları
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-rose-950/65">
            Bu ekran gerçek müşteri-facing copy helperlarını güvenli statik QA durumlarıyla
            gösterir. Sipariş oluşturmaz, ödeme başlatmaz, dosya yüklemez, kurulum göndermez ve
            yayın yapmaz.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[21rem_1fr]">
          <aside className="grid content-start gap-3">
            {states.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => setSelectedId(state.id)}
                className={`rounded-3xl border p-4 text-left transition ${
                  state.id === selectedId
                    ? "border-rose-300 bg-white text-rose-950 shadow-lg shadow-rose-100"
                    : "border-white/70 bg-white/60 text-rose-950/70 hover:border-rose-200 hover:bg-white/85"
                }`}
              >
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
                  {state.kind}
                </span>
                <span className="mt-2 block text-sm font-bold">{state.name}</span>
                <span className="mt-1 block text-xs leading-5">{state.purpose}</span>
              </button>
            ))}
          </aside>

          <section className="grid min-w-0 gap-5">
            <SetupQaMetadataCard state={selectedState} />
            <SetupQaPreviewCard
              state={selectedState}
              dialogOpenButtonRef={dialogOpenButtonRef}
              onOpenDialog={openDialog}
            />
          </section>
        </div>
      </section>

      {openDialogState?.kind === "dialog" && (
        <SetupQaEditSubmitConfirmationDialog
          state={openDialogState}
          returnFocusRef={dialogOpenButtonRef}
          onCancel={() => setOpenDialogId(null)}
        />
      )}
    </main>
  );
}

function SetupQaMetadataCard({ state }: { state: StoryOfUsSetupQaState }) {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-lg shadow-rose-100/70 sm:grid-cols-3 sm:p-6">
      <MetadataItem label="State" value={state.name} />
      <MetadataItem label="Purpose" value={state.purpose} />
      <MetadataItem
        label="Safety"
        value="Static QA only. No Supabase, Shopier, email, media, payment, submit, or publish action."
      />
    </div>
  );
}

function SetupQaPreviewCard({
  state,
  dialogOpenButtonRef,
  onOpenDialog,
}: {
  state: StoryOfUsSetupQaState;
  dialogOpenButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenDialog: (stateId: StoryOfUsSetupQaState["id"]) => void;
}) {
  if (state.kind === "dialog") {
    return (
      <QaShell title={state.name} icon={<MousePointerClick className="h-6 w-6" />}>
        <p className="mx-auto max-w-xl text-sm leading-7 text-rose-950/65">
          Bu durum gerçek düzenleme onay metnini ve klavye odağı kapanını test etmek içindir.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            ref={dialogOpenButtonRef}
            type="button"
            onClick={() => onOpenDialog(state.id)}
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
          >
            Dialogu aç
          </button>
        </div>
      </QaShell>
    );
  }

  if (state.kind === "review") {
    return (
      <QaShell title={state.name} icon={<ClipboardList className="h-6 w-6" />}>
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-100 bg-[#fffaf8] p-5 text-left text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/50">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
            Review copy
          </span>
          <p className="mt-3">{state.body}</p>
        </div>
        <QaInertActionRow primaryLabel="Görsel QA butonu" />
      </QaShell>
    );
  }

  return (
    <QaShell
      title={state.title}
      icon={
        state.kind === "closed" ? (
          <Lock className="h-6 w-6" />
        ) : (
          <CheckCircle2 className="h-6 w-6" />
        )
      }
    >
      <p className="mx-auto max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
        {state.body}
      </p>

      <div className="mx-auto mt-5 max-w-xl rounded-3xl border border-rose-100 bg-[#fffaf8] p-5 text-center text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/50">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
          Düzenleme hakkı
        </span>
        <span className="mt-2 block text-3xl font-bold text-rose-800">{state.usageLabel}</span>
        <span className="mt-3 block">{state.description}</span>
      </div>

      <QaInertActionRow
        primaryLabel={
          state.kind === "closed"
            ? "Eylem kapalı"
            : state.kind === "success"
              ? "Bilgilerimi düzenle"
              : "Bilgilerimi düzenle"
        }
      />
    </QaShell>
  );
}

function QaShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-5 text-center shadow-2xl shadow-rose-100/70 sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-lg shadow-rose-100/70">
        {icon}
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
        StoryOfUs Setup QA
      </p>
      <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function QaInertActionRow({ primaryLabel }: { primaryLabel: string }) {
  return (
    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={(event) => event.preventDefault()}
        className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={(event) => event.preventDefault()}
        className="rounded-full border border-rose-200 bg-white/85 px-6 py-3 text-sm font-semibold text-rose-700 shadow-sm shadow-rose-100 transition hover:border-rose-300 hover:bg-rose-50"
      >
        Kapatılmış QA eylemi
      </button>
    </div>
  );
}

function SetupQaEditSubmitConfirmationDialog({
  state,
  returnFocusRef,
  onCancel,
}: {
  state: Extract<StoryOfUsSetupQaState, { kind: "dialog" }>;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
    const returnFocusElement = returnFocusRef.current;

    return () => {
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab") {
        const focusableElements = getFocusableDialogElements(dialogRef.current);
        const activeIndex = focusableElements.findIndex(
          (element) => element === document.activeElement,
        );
        const targetIndex = getStoryOfUsFocusTrapTargetIndex({
          currentIndex: activeIndex,
          focusableCount: focusableElements.length,
          isShiftKey: event.shiftKey,
        });

        if (targetIndex !== -1) {
          event.preventDefault();
          focusableElements[targetIndex]?.focus();
        }

        return;
      }

      if (event.key !== "Escape") {
        return;
      }

      if (!shouldCloseStoryOfUsEditSubmitDialogOnEscape(false)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 grid place-items-center bg-rose-950/30 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storyofus-setup-qa-dialog-title"
      aria-describedby="storyofus-setup-qa-dialog-description"
    >
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 text-center shadow-2xl shadow-rose-950/20">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-rose-100 bg-rose-50 text-xl">
          💌
        </div>
        <h2 id="storyofus-setup-qa-dialog-title" className="mt-4 text-2xl font-bold text-rose-950">
          {state.title}
        </h2>
        <p
          id="storyofus-setup-qa-dialog-description"
          className="mt-3 text-sm leading-7 text-rose-950/65"
        >
          {state.body}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={(event) => event.preventDefault()}
            className="min-h-11 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
          >
            {state.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function getFocusableDialogElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-rose-100 bg-[#fffaf8]/85 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-rose-950/75">{value}</p>
    </div>
  );
}
