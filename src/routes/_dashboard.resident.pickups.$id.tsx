import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Boxes, Check, Factory, Scale, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PickupStatusBadge, QrBlock, ReceiptCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { MATERIALS } from "@/lib/remake/data";
import { fmtDate, fmtKg, fmtNum } from "@/lib/remake/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/resident/pickups/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Pickup ${params.id} — Remake` },
      { name: "description", content: "Pickup QR code, collection tracking and receipt." },
      { property: "og:title", content: `Pickup ${params.id} — Remake` },
      { property: "og:description", content: "Track your Remake collection from doorstep to processor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PickupDetail,
});

function PickupDetail() {
  const { id } = Route.useParams();
  const { state } = useRemake();
  const p = state.pickups.find((x) => x.id === id && x.mine);
  if (!p) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <p className="font-semibold">Pickup {id} not found</p>
        <Link to="/resident/pickups" className="mt-2 inline-block text-sm font-semibold text-primary">Back to pickups</Link>
      </div>
    );
  }
  const m = MATERIALS[p.material];
  const batch = p.batchId ? state.batches.find((b) => b.id === p.batchId) : undefined;
  const steps = [
    { label: "Booked", sub: fmtDate(p.createdAt), icon: Truck, done: true },
    { label: "Collected & weighed", sub: p.weightKg ? `${fmtKg(p.weightKg)} by ${p.collector}` : `Scheduled ${fmtDate(p.date)} · ${p.slot}`, icon: Scale, done: ["collected", "batched", "verified"].includes(p.status) },
    { label: "Batched at hub", sub: p.batchId ? `Batch ${p.batchId}` : "Waiting at Kanifing hub", icon: Boxes, done: p.status === "batched" || p.status === "verified" },
    { label: "Verified by processor", sub: p.status === "verified" ? `${fmtKg(p.acceptedKg ?? 0)} accepted${batch ? ` · ${batch.processor}` : ""}` : "Coins stay pending until verified", icon: Factory, done: p.status === "verified" },
  ];
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2"><Link to="/resident/pickups"><ArrowLeft /> All pickups</Link></Button>
      <PageHeader eyebrow={`Pickup ${p.id}`} title={`${m.name} · ${p.bags} bags`} description={`${p.address}, ${p.area}`} actions={<PickupStatusBadge status={p.status} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Panel title="Your pickup QR code" description="The collector scans this at your door to confirm the handover.">
            <div className="flex justify-center"><QrBlock value={p.code} size={180} caption="Simulated QR · demo only" /></div>
          </Panel>
          <Panel title="Green Coins">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-muted p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="font-display text-2xl font-semibold">{fmtNum(p.pointsPending ?? 0)}</p></div>
              <div className="rounded-2xl bg-mint p-4 text-mint-foreground"><p className="text-xs">Available</p><p className="font-display text-2xl font-semibold">+{fmtNum(p.pointsAwarded ?? 0)}</p></div>
            </div>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Collection tracking">
            {p.status === "rejected" ? (
              <div className="flex gap-3 rounded-2xl bg-danger-soft p-4 text-destructive"><XCircle className="size-6 shrink-0" /><div><p className="font-semibold">The collector could not accept this pickup</p><p className="text-sm">{p.rejectReason}</p></div></div>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-border pl-6">
                {steps.map((s) => (
                  <li key={s.label} className="relative">
                    <span className={cn("absolute -left-[37px] grid size-7 place-items-center rounded-full", s.done ? "bg-primary text-primary-foreground" : "border-2 bg-card text-muted-foreground")}>
                      {s.done ? <Check className="size-4" strokeWidth={3} /> : <s.icon className="size-3.5" />}
                    </span>
                    <p className={cn("font-semibold", !s.done && "text-muted-foreground")}>{s.label}</p>
                    <p className="text-sm text-muted-foreground">{s.sub}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          {p.receiptNo ? <ReceiptCard pickup={p} /> : <Panel title="Receipt"><p className="text-sm text-muted-foreground">A receipt is issued as soon as the collector weighs your waste.</p></Panel>}
        </div>
      </div>
    </div>
  );
}
