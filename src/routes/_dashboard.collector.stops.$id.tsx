import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, CloudOff, ImageIcon, Loader2, MapPin, Phone, QrCode, Scale, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PickupStatusBadge, ReceiptCard, Simulated } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { MATERIALS } from "@/lib/remake/data";
import { pointsFor } from "@/lib/remake/logic";
import { fmtDate } from "@/lib/remake/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/collector/stops/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Stop ${params.id} — Remake Collector` },
      { name: "description", content: "Scan the pickup QR, weigh materials and issue a receipt." },
      { property: "og:title", content: `Stop ${params.id} — Remake Collector` },
      { property: "og:description", content: "Collection stop details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StopPage,
});

const REASONS = ["Waste mixed with food residue", "Customer not home", "Wrong material category", "Hazardous items found"];

function StopPage() {
  const { id } = Route.useParams();
  const { state, recordWeight, rejectPickup, markPhoto } = useRemake();
  const p = state.pickups.find((x) => x.id === id);
  const [scan, setScan] = useState<"idle" | "scanning" | "ok">("idle");
  const [kg, setKg] = useState("");
  const [reason, setReason] = useState<string>(REASONS[0]!);
  const [mode, setMode] = useState<"accept" | "reject">("accept");

  if (!p) return <div className="rounded-2xl border border-dashed p-10 text-center">Stop {id} not found. <Link to="/collector/today" className="font-semibold text-primary">Back to route</Link></div>;
  const m = MATERIALS[p.material];
  const open = p.status === "scheduled";
  const verified = scan === "ok" || !open;
  const weight = Number(kg);

  const doScan = () => { setScan("scanning"); setTimeout(() => { setScan("ok"); toast.success(`QR ${p.code} matched`); }, 900); };
  const submit = () => {
    if (mode === "accept") {
      if (!(weight > 0) || weight > 500) { toast.error("Enter a weight between 0.1 and 500 kg"); return; }
      recordWeight(p.id, weight);
      toast.success(`Recorded ${weight} kg${state.collectorOffline ? " · saved offline" : ""}`);
    } else {
      rejectPickup(p.id, reason);
      toast(`Pickup ${p.id} rejected`);
    }
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2"><Link to="/collector/today"><ArrowLeft /> Route</Link></Button>
      <PageHeader eyebrow={`Stop ${p.id}`} title={p.customer} description={`${m.name} · ${p.bags} bags · ${fmtDate(p.date)} ${p.slot}`} actions={<>{p.unsynced && <span className="flex items-center gap-1 text-sm font-semibold text-warning"><CloudOff className="size-4" /> Unsynced</span>}<PickupStatusBadge status={p.status} /></>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Panel title="Stop details">
            <dl className="space-y-3 text-sm">
              <div className="flex gap-2"><MapPin className="size-4 text-primary" />{p.address}, {p.area}</div>
              <div className="flex gap-2"><Phone className="size-4 text-primary" />{p.phone}</div>
              {p.notes && <div className="rounded-xl bg-muted p-3">“{p.notes}”</div>}
              <div className="flex items-center gap-3 rounded-xl border p-3"><img src={m.image} alt="" className="size-12 rounded-lg object-cover" /><div><p className="font-semibold">{m.name}</p><p className="text-xs text-muted-foreground">{m.examples}</p></div></div>
            </dl>
          </Panel>
          <Panel title="1 · Scan pickup QR" action={<Simulated />}>
            <div className={cn("relative grid aspect-video place-items-center overflow-hidden rounded-2xl", verified ? "bg-mint" : "bg-ink")}>
              {verified ? <div className="text-center text-mint-foreground"><CheckCircle2 className="mx-auto size-10" /><p className="mt-1 font-mono text-sm font-semibold">{p.code}</p></div>
                : <><QrCode className="size-16 text-ink-muted" /><div className="absolute inset-6 rounded-xl border-2 border-dashed border-primary" />{scan === "scanning" && <div className="absolute inset-x-6 top-1/2 h-0.5 animate-pulse bg-primary" />}</>}
            </div>
            {open && <Button className="mt-4 w-full" onClick={doScan} disabled={scan !== "idle"}>{scan === "scanning" ? <><Loader2 className="animate-spin" /> Scanning…</> : scan === "ok" ? "QR verified" : <><Camera /> Scan QR code</>}</Button>}
          </Panel>
          <Panel title="2 · Photo evidence">
            <button onClick={() => { markPhoto(p.id); toast.success("Photo attached (placeholder)"); }} className={cn("grid aspect-video w-full place-items-center rounded-2xl border-2 border-dashed", p.photoTaken ? "border-primary bg-mint text-mint-foreground" : "text-muted-foreground hover:bg-muted")}>
              <span className="text-center"><ImageIcon className="mx-auto size-8" /><span className="mt-1 block text-sm font-medium">{p.photoTaken ? "Photo attached · tap to retake" : "Tap to add photo (placeholder)"}</span></span>
            </button>
          </Panel>
        </div>
        <div className="space-y-6">
          {open ? (
            <Panel title="3 · Weigh & record">
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button onClick={() => setMode("accept")} className={cn("flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold", mode === "accept" ? "border-primary bg-mint text-mint-foreground" : "hover:bg-muted")}><CheckCircle2 className="size-4" /> Accept</button>
                <button onClick={() => setMode("reject")} className={cn("flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold", mode === "reject" ? "border-destructive bg-danger-soft text-destructive" : "hover:bg-muted")}><XCircle className="size-4" /> Reject</button>
              </div>
              {mode === "accept" ? (
                <>
                  <label className="text-sm font-medium">Scale reading (kg)</label>
                  <div className="mt-1.5 flex items-center gap-3 rounded-2xl bg-ink p-5 text-ink-foreground">
                    <Scale className="size-7 text-primary" />
                    <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.0" className="w-full bg-transparent font-display text-4xl font-semibold outline-none placeholder:text-ink-muted" aria-label="Weight in kg" />
                    <span className="text-ink-muted">kg</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">{[2.5, 5, 9.6, 12.4].map((v) => <button key={v} onClick={() => setKg(String(v))} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{v} kg</button>)}</div>
                  {p.mine && weight > 0 && <p className="mt-4 rounded-xl bg-mint p-3 text-sm text-mint-foreground">Resident will see <b>{pointsFor(p.material, weight)} pending Green Coins</b>.</p>}
                </>
              ) : (
                <div className="space-y-2">{REASONS.map((r) => <label key={r} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm", reason === r && "border-destructive bg-danger-soft")}><input type="radio" checked={reason === r} onChange={() => setReason(r)} className="accent-destructive" />{r}</label>)}</div>
              )}
              <Button size="lg" className="mt-5 w-full" variant={mode === "accept" ? "default" : "destructive"} disabled={!verified} onClick={submit}>
                {!verified ? "Scan QR first" : mode === "accept" ? "Record weight & issue receipt" : "Reject pickup"}
              </Button>
            </Panel>
          ) : p.status === "rejected" ? (
            <Panel title="Rejected"><p className="text-sm text-destructive">{p.rejectReason}</p></Panel>
          ) : (
            <ReceiptCard pickup={p} />
          )}
        </div>
      </div>
    </div>
  );
}
