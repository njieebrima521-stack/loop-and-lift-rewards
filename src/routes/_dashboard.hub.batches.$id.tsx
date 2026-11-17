import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BatchStatusBadge, DecisionBadge, PageHeader, Panel, QrBlock } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { HUB_NAME, MATERIALS } from "@/lib/remake/data";
import { fmtDate, fmtKg } from "@/lib/remake/format";

export const Route = createFileRoute("/_dashboard/hub/batches/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Batch ${params.id} — Remake Hub` },
      { name: "description", content: "Batch manifest, QR code and processor handover." },
      { property: "og:title", content: `Batch ${params.id} — Remake Hub` },
      { property: "og:description", content: "Recycling batch details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BatchPage,
});

function BatchPage() {
  const { id } = Route.useParams();
  const { state, handOverBatch } = useRemake();
  const b = state.batches.find((x) => x.id === id);
  if (!b) return <div className="rounded-2xl border border-dashed p-10 text-center">Batch not found. <Link to="/hub" className="font-semibold text-primary">Back to hub</Link></div>;
  const picks = state.pickups.filter((p) => b.pickupIds.includes(p.id));
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2"><Link to="/hub"><ArrowLeft /> Hub</Link></Button>
      <PageHeader eyebrow={`Batch ${b.id}`} title={`${MATERIALS[b.material].name} · ${fmtKg(b.totalKg)}`} description={`Created ${fmtDate(b.createdAt)} at ${HUB_NAME} · destined for ${b.processor}`} actions={<><BatchStatusBadge status={b.status} /><DecisionBadge decision={b.decision} /></>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Panel title="Batch QR manifest" description="Printed and attached to the bale.">
          <div className="flex justify-center"><QrBlock value={b.code} size={180} caption="Simulated QR · demo only" /></div>
          {b.status === "ready" ? (
            <Button size="lg" className="mt-5 w-full" onClick={() => { handOverBatch(b.id); toast.success(`Handed over to ${b.processor}`); }}><Send /> Hand over to processor</Button>
          ) : (
            <p className="mt-5 rounded-xl bg-mint p-3 text-center text-sm text-mint-foreground">Handed over to {b.processor}{b.status === "verified" && ` · ${fmtKg(b.acceptedKg ?? 0)} accepted`}</p>
          )}
        </Panel>
        <Panel title="Loads in this batch">
          {picks.length === 0 ? <p className="text-sm text-muted-foreground">Legacy batch — loads recorded before the demo.</p> : (
            <ul className="divide-y">{picks.map((p) => <li key={p.id} className="flex justify-between py-3 text-sm"><span><b>{p.customer}</b> <span className="font-mono text-xs text-muted-foreground">{p.receiptNo}</span><br /><span className="text-muted-foreground">{p.collector}</span></span><b>{fmtKg(p.weightKg ?? 0)}</b></li>)}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
