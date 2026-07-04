import { createFileRoute, notFound } from "@tanstack/react-router";
import { Configurator } from "@/components/storyofus/Configurator";
import { STYLES, type StyleId } from "@/lib/storyofus/config";

const VALID = new Set<StyleId>(["soft", "cinematic", "cute"]);

export const Route = createFileRoute("/storyofus/styles/$style")({
  ssr: false,
  head: ({ params }) => {
    const style = STYLES.find((s) => s.id === (params.style as StyleId));
    const name = style?.name ?? "Story of Us";
    return {
      meta: [
        { title: `${name} — Story of Us | Leony` },
        {
          name: "description",
          content: `Story of Us ${name} stilinde kişiye özel romantik web sitesi tasarımı.`,
        },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  loader: ({ params }) => {
    if (!VALID.has(params.style as StyleId)) throw notFound();
    return { style: params.style as StyleId };
  },
  component: StylePage,
});

function StylePage() {
  const { style } = Route.useLoaderData();
  return <Configurator style={style} />;
}
