import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Panel, PickupStatusBadge, Simulated } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { BUSINESS, DEMO_TODAY, MATERIAL_LIST, MATERIALS, TIME_SLOTS } from "@/lib/remake/data";
import { fmtDate, fmtKg } from "@/lib/remake/format";
import type { MaterialId } from "@/lib/remake/types";

export const Route = createFileRoute("/_dashboard/business/pickups")({
  head: () => ({
    meta: [
      { title: "Recurring Pickups — Remake Business" },
      { name: "description", content: "Schedule recurring commercial pickups and review collection history." },
      { property: "og:title", content: "Recurring Pickups — Remake Business" },
      { property: "og:description", content: "Commercial recycling pickups across Greater Banjul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BizPickups,
});

const inputCls = "mt-1.5 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
type Freq = "Weekly" | "Fortnightly" | "Monthly";

function BizPickups() {
  const { state, bookPickup } = useRemake();
  const [material, setMaterial] = useState<MaterialId>("plastic");
  const [bags, setBags] = useState(10);
  const [date, setDate] = useState("2026-11-24");
  const [slot, setSlot] = useState<string>(TIME_SLOTS[0]!);
  const [freq, setFreq] = useState<Freq>("Weekly");
  const mine = state.pickups.filter((p) => p.customer === BUSINESS.name).sort((a, b) => b.date.localeCompare(a.date));
  const submit = () => {
    if (date < DEMO_TODAY) { toast.error("Choose a future date"); return; }
    if (bags < 1) { toast.error("At least 1 bag"); return; }
    bookPickup({ material, bags, date, slot, address: BUSINESS.address, area: BUSINESS.area, business: { name: BUSINESS.name, phone: BUSINESS.phone, frequency: freq } });
    toast.success(`${freq} ${MATERIALS[material].name.toLowerCase()} pickup scheduled`, { description: "Assigned to the collector route." });
  };
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={BUSINESS.name} title="Recurring pickups" actions={<Simulated />} />
      <Panel title="Schedule a recurring pickup">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <label className="text-sm font-medium xl:col-span-2">Material<select className={inputCls} value={material} onChange={(e) => setMaterial(e.target.value as MaterialId)}>{MATERIAL_LIST.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
          <label className="text-sm font-medium">Bags<input type="number" min={1} className={inputCls} value={bags} onChange={(e) => setBags(Number(e.target.value))} /></label>
          <label className="text-sm font-medium">First pickup<input type="date" min={DEMO_TODAY} className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-sm font-medium">Time<select className={inputCls} value={slot} onChange={(e) => setSlot(e.target.value)}>{TIME_SLOTS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="text-sm font-medium">Frequency<select className={inputCls} value={freq} onChange={(e) => setFreq(e.target.value as Freq)}>{["Weekly", "Fortnightly", "Monthly"].map((s) => <option key={s}>{s}</option>)}</select></label>
        </div>
        <Button className="mt-5" onClick={submit}><Repeat /> Schedule pickup</Button>
      </Panel>
      <Panel title="Collection history">
        <Table>
          <TableHeader><TableRow><TableHead>Pickup</TableHead><TableHead>Material</TableHead><TableHead>Date</TableHead><TableHead>Bags</TableHead><TableHead>Weight</TableHead><TableHead>Frequency</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{mine.map((p) => <TableRow key={p.id}><TableCell className="font-mono text-xs">{p.id}</TableCell><TableCell>{MATERIALS[p.material].name}</TableCell><TableCell>{fmtDate(p.date)}</TableCell><TableCell>{p.bags}</TableCell><TableCell>{p.weightKg ? fmtKg(p.weightKg) : "—"}</TableCell><TableCell>{p.frequency ?? (p.recurring ? "Weekly" : "One-off")}</TableCell><TableCell><PickupStatusBadge status={p.status} /></TableCell></TableRow>)}</TableBody>
        </Table>
      </Panel>
    </div>
  );
}
