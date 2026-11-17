import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Boxes, ChevronRight, Inbox, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchStatusBadge, PageHeader, Panel, PickupStatusBadge, StatCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { HUB_NAME, MATERIALS, PROCESSORS } from "@/lib/remake/data";
import { fmtKg, fmtShortDate } from "@/lib/remake/format";
import type { MaterialId } from "@/lib/remake/types";

export const Route = createFileRoute("/_dashboard/hub/")({
  head: () => ({
    meta: [
      { title: "Recycling Hub — Remake" },
      { name: "description", content: "Receive collector loads, create material batches and hand them over to processors." },
      { property: "og:title", content: "Recycling Hub — Remake" },
      { property: "og:description", content: "Kanifing Recycling Hub operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HubPage,
});

function HubPage() {
  const { state, createBatch } = useRemake();
  const navigate = useNavigate();
  const incoming = state.pickups.filter((p) => p.status === "scheduled");
  const received = state.pickups.filter((p) => p.status === "collected");
  const [sel, setSel] = useState<string[]>([]);
  const [processor, setProcessor] = useState<string>(PROCESSORS[0]!);
  const selMat = useMemo<MaterialId | null>(() => (sel.length ? state.pickups.find((p) => p.id === sel[0])?.material ?? null : null), [sel, state.pickups]);
  const selKg = received.filter((p) => sel.includes(p.id)).reduce((s, p) => s + (p.weightKg ?? 0), 0);

  const toggle = (id: string, mat: MaterialId) => {
    if (selMat && selMat !== mat && !sel.includes(id)) { toast.error("A batch can only contain one material"); return; }
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const create = () => {
    const id = createBatch(sel, processor);
    if (!id) { toast.error("Select collected pickups of one material"); return; }
    setSel([]);
    toast.success(`Batch ${id} created`);
    navigate({ to: "/hub/batches/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={HUB_NAME} title="Hub operations" description="Check in collector loads, group them by material into batches, and hand them over with a QR manifest." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Incoming collections" value={incoming.length} sub="Scheduled on routes" icon={Truck} />
        <StatCard label="Received loads" value={received.length} sub={fmtKg(received.reduce((s, p) => s + (p.weightKg ?? 0), 0))} icon={Inbox} tone="brand" />
        <StatCard label="Batches ready" value={state.batches.filter((b) => b.status === "ready").length} sub="Awaiting handover" icon={Boxes} />
        <StatCard label="Handed over" value={state.batches.filter((b) => b.status !== "ready").length} sub="To processors" icon={PackageCheck} />
      </div>
      <Tabs defaultValue="received">
        <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-auto"><TabsTrigger value="received">Received loads &amp; batching</TabsTrigger><TabsTrigger value="incoming">Incoming</TabsTrigger><TabsTrigger value="batches">Batches</TabsTrigger></TabsList>
        <TabsContent value="received" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Panel title="Received loads" description="Select loads of the same material to batch them.">
              {received.length === 0 ? <p className="text-sm text-muted-foreground">No loads waiting. Collected pickups appear here.</p> : (
                <ul className="divide-y">
                  {received.map((p) => (
                    <li key={p.id} className="flex items-center gap-4 py-3">
                      <Checkbox checked={sel.includes(p.id)} onCheckedChange={() => toggle(p.id, p.material)} aria-label={`Select ${p.id}`} />
                      <img src={MATERIALS[p.material].image} alt="" className="size-10 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1"><p className="font-semibold">{p.customer} <span className="font-mono text-xs text-muted-foreground">{p.receiptNo}</span></p><p className="text-sm text-muted-foreground">{MATERIALS[p.material].name} · by {p.collector}</p></div>
                      <b className="tabular">{fmtKg(p.weightKg ?? 0)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Create batch">
              <p className="text-sm text-muted-foreground">{sel.length ? `${sel.length} loads · ${MATERIALS[selMat!].name} · ${fmtKg(selKg)}` : "No loads selected"}</p>
              <label className="mt-4 block text-sm font-medium">Processor
                <select value={processor} onChange={(e) => setProcessor(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-card px-3 text-sm">{PROCESSORS.map((x) => <option key={x}>{x}</option>)}</select>
              </label>
              <Button className="mt-4 w-full" size="lg" disabled={!sel.length} onClick={create}><Boxes /> Create batch & QR</Button>
            </Panel>
          </div>
        </TabsContent>
        <TabsContent value="incoming" className="mt-4">
          <Panel title="Incoming collections">
            <ul className="divide-y">{incoming.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span><b>{p.customer}</b> · {MATERIALS[p.material].name} · {p.bags} bags<br /><span className="text-muted-foreground">{p.collector} · {fmtShortDate(p.date)} {p.slot}</span></span><PickupStatusBadge status={p.status} /></li>)}</ul>
          </Panel>
        </TabsContent>
        <TabsContent value="batches" className="mt-4">
          <Panel title="All batches">
            <ul className="divide-y">
              {state.batches.map((b) => (
                <li key={b.id}><Link to="/hub/batches/$id" params={{ id: b.id }} className="flex items-center gap-4 py-3 hover:bg-muted/40">
                  <span className="font-mono text-sm font-semibold">{b.id}</span>
                  <span className="flex-1 text-sm">{MATERIALS[b.material].name} · {fmtKg(b.totalKg)} → {b.processor}</span>
                  <BatchStatusBadge status={b.status} /><ChevronRight className="size-4 text-muted-foreground" />
                </Link></li>
              ))}
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
