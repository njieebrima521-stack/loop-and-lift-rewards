import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Search, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/remake/ui";
import { MATERIAL_LIST } from "@/lib/remake/data";
import type { MaterialId } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/resident/guide")({
  head: () => ({
    meta: [
      { title: "Recycling Guide — Remake" },
      { name: "description", content: "What Remake accepts, what it doesn't, and how to prepare each material in The Gambia." },
      { property: "og:title", content: "Recycling Guide — Remake" },
      { property: "og:description", content: "Learn how to sort plastics, metals, glass, paper, e-waste and organics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const [sel, setSel] = useState<MaterialId>("plastic");
  const [q, setQ] = useState("");
  const list = MATERIAL_LIST.filter((m) => !q || `${m.name} ${m.examples} ${m.accepted.join(" ")} ${m.notAccepted.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const m = MATERIAL_LIST.find((x) => x.id === sel)!;
  return (
    <div>
      <PageHeader eyebrow="Resident" title="Recycling guide" description="Choose a waste category to see what's accepted and how to prepare it for collection." />
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. sachet, cans, phone…" className="h-11 w-full rounded-xl border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ul className="space-y-3">
          {list.length === 0 && <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No category matches "{q}".</li>}
          {list.map((x) => (
            <li key={x.id}>
              <button onClick={() => setSel(x.id)} className={cn("flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition", sel === x.id ? "border-primary bg-mint ring-2 ring-primary/20" : "bg-card hover:border-primary/40")}>
                <img src={x.image} alt="" className="size-16 rounded-xl object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold">{x.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{x.examples}</span>
                </span>
                <span className="text-xs font-semibold text-primary">{x.pointsPerKg}/kg</span>
              </button>
            </li>
          ))}
        </ul>
        <Panel>
          <div className="flex flex-col gap-6 md:flex-row">
            <img src={m.image} alt={m.name} className="h-48 w-full rounded-2xl object-cover md:w-64" />
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">{m.name}</h2>
              <p className="mt-1 text-muted-foreground">{m.examples}</p>
              <p className="mt-4 inline-flex rounded-full bg-ink px-3 py-1 text-sm font-semibold text-ink-foreground">Earns {m.pointsPerKg} Green Coins per kg</p>
              <div className="mt-5">
                <Button asChild><Link to="/resident/pickups" search={{ tab: "book", material: m.id }}><Truck /> Book a {m.name.toLowerCase()} pickup</Link></Button>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-mint p-4 text-mint-foreground">
              <p className="mb-2 font-semibold">Accepted</p>
              <ul className="space-y-1.5 text-sm">{m.accepted.map((a) => <li key={a} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{a}</li>)}</ul>
            </div>
            <div className="rounded-2xl bg-danger-soft p-4 text-destructive">
              <p className="mb-2 font-semibold">Not accepted</p>
              <ul className="space-y-1.5 text-sm">{m.notAccepted.map((a) => <li key={a} className="flex gap-2"><X className="mt-0.5 size-4 shrink-0" />{a}</li>)}</ul>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="mb-2 font-semibold">How to prepare</p>
              <ol className="list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">{m.prep.map((a) => <li key={a}>{a}</li>)}</ol>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
