import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, CloudOff, MapPin, Phone } from "lucide-react";
import { PageHeader, Panel, PickupStatusBadge } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { ACTIVE_COLLECTOR, MATERIALS } from "@/lib/remake/data";
import { fmtShortDate } from "@/lib/remake/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/collector/today")({
  head: () => ({
    meta: [
      { title: "Collection Route — Remake" },
      { name: "description", content: "Assigned collection stops in order, with addresses and materials." },
      { property: "og:title", content: "Collection Route — Remake" },
      { property: "og:description", content: "Today's Remake collection route." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoutePage,
});

function RoutePage() {
  const { state } = useRemake();
  const [show, setShow] = useState<"open" | "all">("open");
  const stops = state.pickups
    .filter((p) => p.collector === ACTIVE_COLLECTOR && (show === "all" || p.status === "scheduled"))
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
  const areas = Array.from(new Set(stops.map((s) => s.area)));
  return (
    <div>
      <PageHeader eyebrow="Collector" title="Assigned route" description={`Route covers ${areas.join(" → ") || "no areas yet"}`} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title={`${stops.length} stops`} action={
          <div className="flex flex-wrap gap-1.5">{(["open", "all"] as const).map((k) => <button key={k} onClick={() => setShow(k)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", show === k ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground")}>{k === "open" ? "Open" : "All"}</button>)}</div>
        }>
          <ol className="space-y-3">
            {stops.map((p, i) => (
              <li key={p.id}>
                <Link to="/collector/stops/$id" params={{ id: p.id }} className="flex items-center gap-4 rounded-2xl border p-4 transition hover:border-primary/40 hover:shadow-card">
                  <span className="grid size-10 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
                  <img src={MATERIALS[p.material].image} alt="" className="hidden size-12 rounded-xl object-cover sm:block" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.customer}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{p.address}, {p.area}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{p.phone} · {fmtShortDate(p.date)} {p.slot}</p>
                  </div>
                  {p.unsynced && <CloudOff className="size-4 text-warning" />}
                  <PickupStatusBadge status={p.status} />
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
            {stops.length === 0 && <li className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Route complete. 🎉</li>}
          </ol>
        </Panel>
        <Panel title="Route map" description="Simulated map">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-mint">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-primary">
              <path d="M10 85 C 30 70, 25 50, 45 45 S 70 30, 88 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            {stops.slice(0, 6).map((p, i) => {
              const t = stops.length > 1 ? i / (Math.min(stops.length, 6) - 1) : 0.5;
              return <span key={p.id} className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-xs font-bold text-ink-foreground shadow-lift" style={{ left: `${10 + t * 78}%`, top: `${85 - t * 73}%` }}>{i + 1}</span>;
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
