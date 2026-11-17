import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudOff, CloudUpload, MapPin, Scale, Truck, Wallet, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel, PickupStatusBadge, Simulated, StatCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { ACTIVE_COLLECTOR, MATERIALS } from "@/lib/remake/data";
import { COLLECTOR_RATE_GMD_PER_KG } from "@/lib/remake/logic";
import { fmtGmd, fmtKg } from "@/lib/remake/format";


export const Route = createFileRoute("/_dashboard/collector/")({
  head: () => ({
    meta: [
      { title: "Collector Dashboard — Remake" },
      { name: "description", content: "Today's collection jobs, weights recorded, earnings and offline sync for Remake collectors." },
      { property: "og:title", content: "Collector Dashboard — Remake" },
      { property: "og:description", content: "Run your Remake collection route." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectorDashboard,
});

function CollectorDashboard() {
  const { state, setOffline, sync } = useRemake();
  const mine = state.pickups.filter((p) => p.collector === ACTIVE_COLLECTOR);
  const todo = mine.filter((p) => p.status === "scheduled").sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
  const done = mine.filter((p) => p.weightKg);
  const kg = done.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const unsynced = state.pickups.filter((p) => p.unsynced).length;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Collector · Truck GM-4471" title="Good morning, Lamin" description="Your jobs update live when residents and businesses book pickups." actions={<Button asChild><Link to="/collector/today"><MapPin /> Start route</Link></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open stops" value={todo.length} sub="Assigned to you" icon={Truck} tone="brand" />
        <StatCard label="Weighed" value={fmtKg(kg)} sub={`${done.length} collections`} icon={Scale} />
        <StatCard label="Earnings" value={fmtGmd(kg * COLLECTOR_RATE_GMD_PER_KG)} sub={`GMD ${COLLECTOR_RATE_GMD_PER_KG}/kg · simulated`} icon={Wallet} />
        <StatCard label="Unsynced records" value={unsynced} sub={state.collectorOffline ? "Offline mode on" : "All caught up"} icon={state.collectorOffline ? CloudOff : Wifi} tone={unsynced ? "ink" : "default"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Next stops" action={<Link to="/collector/today" className="text-sm font-semibold text-primary hover:underline">Full route</Link>}>
          {todo.length === 0 ? <p className="text-sm text-muted-foreground">No open stops. New bookings will appear here.</p> : (
            <ul className="divide-y">
              {todo.slice(0, 5).map((p, i) => (
                <li key={p.id}>
                  <Link to="/collector/stops/$id" params={{ id: p.id }} className="flex items-center gap-4 py-3 hover:bg-muted/40">
                    <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-sm font-bold text-ink-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{p.customer} {p.mine && <span className="text-xs font-semibold text-primary">· demo resident</span>}</p>
                      <p className="text-sm text-muted-foreground">{p.address}, {p.area} · {p.slot}</p>
                    </div>
                    <span className="hidden text-sm sm:block">{MATERIALS[p.material].name} · {p.bags} bags</span>
                    <PickupStatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Offline & sync" action={<Simulated />}>
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">{state.collectorOffline ? <CloudOff className="text-warning" /> : <Wifi className="text-primary" />}<div><p className="font-semibold">{state.collectorOffline ? "Offline mode" : "Online"}</p><p className="text-sm text-muted-foreground">Simulate weak network on the route</p></div></div>
            <Switch checked={state.collectorOffline} onCheckedChange={setOffline} aria-label="Offline mode" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Records captured offline are saved on the device and marked <b>unsynced</b> until you sync.</p>
          <Button className="mt-4 w-full" variant="ink" disabled={unsynced === 0 && !state.collectorOffline} onClick={() => { sync(); toast.success(`Synced ${unsynced} record${unsynced === 1 ? "" : "s"}`); }}>
            <CloudUpload /> Sync now {unsynced > 0 && `(${unsynced})`}
          </Button>
        </Panel>
      </div>
    </div>
  );
}
