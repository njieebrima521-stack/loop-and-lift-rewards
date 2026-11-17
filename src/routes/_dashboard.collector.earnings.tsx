import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, Scale, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Simulated, StatCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { ACTIVE_COLLECTOR } from "@/lib/remake/data";
import { COLLECTOR_RATE_GMD_PER_KG } from "@/lib/remake/logic";
import { fmtGmd, fmtKg, fmtShortDate } from "@/lib/remake/format";

export const Route = createFileRoute("/_dashboard/collector/earnings")({
  head: () => ({
    meta: [
      { title: "Collector Earnings — Remake" },
      { name: "description", content: "Simulated GMD earnings per kilogram collected." },
      { property: "og:title", content: "Collector Earnings — Remake" },
      { property: "og:description", content: "Track your Remake collector earnings in GMD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EarningsPage,
});

const WEEKS = [{ w: "Wk 43", gmd: 1420 }, { w: "Wk 44", gmd: 1680 }, { w: "Wk 45", gmd: 1310 }, { w: "Wk 46", gmd: 1890 }];

function EarningsPage() {
  const { state } = useRemake();
  const done = state.pickups.filter((p) => p.collector === ACTIVE_COLLECTOR && p.weightKg).sort((a, b) => (b.collectedAt ?? "").localeCompare(a.collectedAt ?? ""));
  const kg = done.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const now = kg * COLLECTOR_RATE_GMD_PER_KG;
  const data = [...WEEKS, { w: "This wk", gmd: Math.round(now) }];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Collector" title="Earnings" description={`You earn GMD ${COLLECTOR_RATE_GMD_PER_KG} for every kilogram recorded.`} actions={<><Simulated label="Simulated payouts" /><Button onClick={() => toast.success("Payout requested to Wave ••• 2345", { description: "Simulated — no money moves." })}><Banknote /> Request payout</Button></>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This week" value={fmtGmd(now)} icon={Wallet} tone="brand" />
        <StatCard label="Weight collected" value={fmtKg(kg)} icon={Scale} />
        <StatCard label="Last 4 weeks" value={fmtGmd(WEEKS.reduce((s, w) => s + w.gmd, 0))} icon={TrendingUp} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Weekly earnings (GMD)">
          <div className="h-64"><ResponsiveContainer><BarChart data={data}><XAxis dataKey="w" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="gmd" fill="var(--primary)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Earnings by collection">
          <ul className="divide-y">{done.map((p) => <li key={p.id} className="flex justify-between py-2.5 text-sm"><span>{p.customer} · {fmtKg(p.weightKg ?? 0)} <span className="text-muted-foreground">{fmtShortDate(p.collectedAt ?? p.date)}</span></span><b>{fmtGmd((p.weightKg ?? 0) * COLLECTOR_RATE_GMD_PER_KG)}</b></li>)}</ul>
        </Panel>
      </div>
    </div>
  );
}
