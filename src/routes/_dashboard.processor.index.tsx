import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Factory, PackageCheck, Scale, Truck } from "lucide-react";
import { BatchStatusBadge, DecisionBadge, EmptyState, PageHeader, Panel, StatCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { MATERIALS } from "@/lib/remake/data";
import { fmtKg, fmtShortDate } from "@/lib/remake/format";

export const Route = createFileRoute("/_dashboard/processor/")({
  head: () => ({
    meta: [
      { title: "Processor Dashboard — Remake" },
      { name: "description", content: "Incoming recycling batches awaiting inspection and verification." },
      { property: "og:title", content: "Processor Dashboard — Remake" },
      { property: "og:description", content: "Verify incoming Remake batches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProcessorPage,
});

function ProcessorPage() {
  const { state } = useRemake();
  const incoming = state.batches.filter((b) => b.status === "in_transit");
  const upcoming = state.batches.filter((b) => b.status === "ready");
  const done = state.batches.filter((b) => b.status === "verified");
  const acc = done.reduce((s, b) => s + (b.acceptedKg ?? 0), 0);
  const tot = done.reduce((s, b) => s + (b.acceptedKg ?? 0) + (b.rejectedKg ?? 0), 0);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Gambia Polymer Works" title="Incoming batches" description="Inspect each batch, weigh it on arrival and record your decision. Residents' pending coins are released when you verify." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting inspection" value={incoming.length} icon={Truck} tone="brand" />
        <StatCard label="At hub, not shipped" value={upcoming.length} icon={Factory} />
        <StatCard label="Verified batches" value={done.length} icon={PackageCheck} />
        <StatCard label="Acceptance rate" value={tot ? `${Math.round((acc / tot) * 100)}%` : "—"} sub={`${fmtKg(acc)} accepted`} icon={Scale} />
      </div>
      <Panel title="Ready for inspection">
        {incoming.length === 0 ? <EmptyState icon={Truck} title="No batches in transit">Batches appear when the hub hands them over.</EmptyState> : (
          <ul className="divide-y">
            {incoming.map((b) => (
              <li key={b.id}><Link to="/processor/batches/$id" params={{ id: b.id }} className="flex items-center gap-4 py-3 hover:bg-muted/40">
                <img src={MATERIALS[b.material].image} alt="" className="size-12 rounded-xl object-cover" />
                <div className="flex-1"><p className="font-semibold">{b.id} · {MATERIALS[b.material].name}</p><p className="text-sm text-muted-foreground">Declared {fmtKg(b.totalKg)} · {fmtShortDate(b.createdAt)} · {b.processor}</p></div>
                <BatchStatusBadge status={b.status} /><ChevronRight className="size-4 text-muted-foreground" />
              </Link></li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Recent decisions" action={<Link to="/processor/history" className="text-sm font-semibold text-primary hover:underline">History</Link>}>
        <ul className="divide-y">{done.slice(0, 4).map((b) => <li key={b.id} className="flex items-center justify-between py-3 text-sm"><span><b>{b.id}</b> · {MATERIALS[b.material].name} · {fmtKg(b.acceptedKg ?? 0)} of {fmtKg(b.totalKg)}</span><DecisionBadge decision={b.decision} /></li>)}</ul>
      </Panel>
    </div>
  );
}
