import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, ChevronRight, MapPin, QrCode, Repeat, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, Panel, PickupStatusBadge, Simulated } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { AREAS, DEMO_TODAY, MATERIAL_LIST, MATERIALS, TIME_SLOTS } from "@/lib/remake/data";
import { fmtDate, fmtKg, fmtNum } from "@/lib/remake/format";
import type { MaterialId, PickupStatus } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

type Search = { tab?: "book" | "history" | undefined; material?: MaterialId | undefined };

export const Route = createFileRoute("/_dashboard/resident/pickups/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: s["tab"] === "book" || s["tab"] === "history" ? s["tab"] : undefined,
    material: typeof s["material"] === "string" && s["material"] in MATERIALS ? (s["material"] as MaterialId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pickups — Remake" },
      { name: "description", content: "Book a recyclables pickup and track every collection, QR code and receipt." },
      { property: "og:title", content: "Book a pickup — Remake" },
      { property: "og:description", content: "Garbage handover made easy across Greater Banjul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PickupsPage,
});

const inputCls = "h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function PickupsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/resident/pickups/" });
  const tab = search.tab ?? (search.material ? "book" : "history");
  return (
    <div>
      <PageHeader eyebrow="Resident" title="Garbage handover" description="Request a pickup from your home. Show your QR code to the collector when they arrive." />
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as "book" | "history" } })}>
        <TabsList className="mb-6">
          <TabsTrigger value="history">My pickups</TabsTrigger>
          <TabsTrigger value="book">Book a pickup</TabsTrigger>
        </TabsList>
        <TabsContent value="book"><BookForm initial={search.material} /></TabsContent>
        <TabsContent value="history"><History /></TabsContent>
      </Tabs>
    </div>
  );
}

function BookForm({ initial }: { initial?: MaterialId | undefined }) {
  const { state, bookPickup } = useRemake();
  const [material, setMaterial] = useState<MaterialId>(initial ?? "plastic");
  const [bags, setBags] = useState(2);
  const [date, setDate] = useState<Date | undefined>(parseISO("2026-11-19"));
  const [slot, setSlot] = useState<string>(TIME_SLOTS[1]!);
  const [address, setAddress] = useState(state.profile.address);
  const [area, setArea] = useState(state.profile.area);
  const [notes, setNotes] = useState("");
  // Profile hydrates from browser storage after first render.
  useEffect(() => { setAddress(state.profile.address); setArea(state.profile.area); }, [state.profile.address, state.profile.area]);
  const [done, setDone] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = () => {
    if (!date) { toast.error("Choose a pickup date"); return; }
    if (!address.trim()) { toast.error("Enter your address"); return; }
    if (bags < 1 || bags > 20) { toast.error("Bags must be between 1 and 20"); return; }
    const id = bookPickup({ material, bags, date: format(date, "yyyy-MM-dd"), slot, address: address.trim(), area, notes: notes.trim() || undefined });
    setDone(id);
  };
  const booked = state.pickups.find((p) => p.id === done);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Panel title="Choose waste category">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MATERIAL_LIST.map((m) => (
            <button key={m.id} onClick={() => setMaterial(m.id)} className={cn("overflow-hidden rounded-2xl border text-left transition", material === m.id ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/40")}>
              <img src={m.image} alt="" className="h-24 w-full object-cover" loading="lazy" />
              <div className={cn("p-3", material === m.id ? "bg-primary text-primary-foreground" : "bg-card")}>
                <p className="font-display font-semibold">{m.name}</p>
                <p className={cn("truncate text-xs", material === m.id ? "opacity-90" : "text-muted-foreground")}>{m.examples}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Quantity (bags)
            <input type="number" min={1} max={20} value={bags} onChange={(e) => setBags(Number(e.target.value))} className={cn(inputCls, "mt-1.5")} />
          </label>
          <label className="text-sm font-medium">Area
            <select value={area} onChange={(e) => setArea(e.target.value)} className={cn(inputCls, "mt-1.5")}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
          </label>
          <label className="text-sm font-medium md:col-span-2">Pickup address
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={cn(inputCls, "mt-1.5")} />
          </label>
          <label className="text-sm font-medium md:col-span-2">Notes for collector (optional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Blue gate, bags by the wall" className="mt-1.5 w-full rounded-xl border bg-card p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
        </div>
      </Panel>
      <div className="space-y-6">
        <Panel title="Date & time">
          <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: parseISO(DEMO_TODAY) }} defaultMonth={parseISO(DEMO_TODAY)} className="mx-auto rounded-xl border" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((s) => (
              <button key={s} onClick={() => setSlot(s)} className={cn("rounded-xl border px-3 py-2 text-sm", slot === s ? "border-primary bg-mint font-semibold text-mint-foreground" : "hover:bg-muted")}>{s}</button>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Summary</span><Simulated /></div>
          <p className="mt-2 font-display text-lg font-semibold">{MATERIALS[material].name} · {bags} bag{bags === 1 ? "" : "s"}</p>
          <p className="text-sm text-muted-foreground">{date ? fmtDate(format(date, "yyyy-MM-dd")) : "Pick a date"} · {slot}</p>
          <Button size="lg" className="mt-4 w-full" onClick={submit}><Truck /> Hand over the trash</Button>
        </Panel>
      </div>

      <Dialog open={!!booked} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-md text-center">
          <CheckCircle2 className="mx-auto size-16 text-primary" />
          <DialogTitle className="font-display text-2xl">Pickup booked</DialogTitle>
          {booked && (
            <>
              <p className="text-sm text-muted-foreground">Green Coins are credited as <b>pending</b> once the collector weighs your waste.</p>
              <dl className="mt-2 divide-y rounded-2xl border text-left text-sm">
                {[["Status", "Scheduled"], ["Pickup ID", booked.id], ["Type of waste", MATERIALS[booked.material].name], ["Quantity", `${booked.bags} bags`], ["Date", `${fmtDate(booked.date)} · ${booked.slot}`], ["Collector", booked.collector]].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => navigate({ to: "/resident" })}>Back to home</Button>
                <Button onClick={() => navigate({ to: "/resident/pickups/$id", params: { id: booked.id } })}><QrCode /> View QR</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const FILTERS: { key: "all" | PickupStatus; label: string }[] = [
  { key: "all", label: "All" }, { key: "scheduled", label: "Scheduled" }, { key: "collected", label: "Collected" },
  { key: "batched", label: "Batched" }, { key: "verified", label: "Verified" }, { key: "rejected", label: "Rejected" },
];

function History() {
  const { state } = useRemake();
  const [f, setF] = useState<(typeof FILTERS)[number]["key"]>("all");
  const mine = state.pickups.filter((p) => p.mine && (f === "all" || p.status === f)).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Panel title="Pickup history" action={<div className="flex flex-wrap gap-1.5">{FILTERS.map((x) => <button key={x.key} onClick={() => setF(x.key)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", f === x.key ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>{x.label}</button>)}</div>}>
      {mine.length === 0 ? (
        <EmptyState icon={Truck} title="No pickups here">Book a pickup to get started.</EmptyState>
      ) : (
        <ul className="divide-y">
          {mine.map((p) => (
            <li key={p.id}>
              <Link to="/resident/pickups/$id" params={{ id: p.id }} className="flex items-center gap-4 py-3 hover:bg-muted/40">
                <img src={MATERIALS[p.material].image} alt="" className="size-12 rounded-xl object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{MATERIALS[p.material].name} · {p.bags} bags <span className="font-mono text-xs text-muted-foreground">{p.id}</span></p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{fmtDate(p.date)} · {p.slot}{p.recurring && <Repeat className="size-3.5" />}</p>
                </div>
                <div className="hidden text-right text-sm sm:block">
                  {p.weightKg ? <p className="font-semibold">{fmtKg(p.weightKg)}</p> : <p className="text-muted-foreground">Not weighed</p>}
                  <p className="text-xs text-muted-foreground">{p.pointsAwarded ? `+${fmtNum(p.pointsAwarded)} coins` : p.pointsPending ? `${fmtNum(p.pointsPending)} pending` : ""}</p>
                </div>
                <PickupStatusBadge status={p.status} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
