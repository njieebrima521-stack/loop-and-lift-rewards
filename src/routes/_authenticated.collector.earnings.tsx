import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, Scale, TrendingUp, Wallet } from "lucide-react";
import { endOfWeek, format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Simulated, StatCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { fmtGmd, fmtKg, fmtShortDate } from "@/lib/remake/format";

export const Route = createFileRoute("/_authenticated/collector/earnings")({
  head: () => ({
    meta: [
      { title: "Collector Earnings — Remake" },
      { name: "description", content: "Estimated GMD earnings per kilogram collected." },
      { property: "og:title", content: "Collector Earnings — Remake" },
      { property: "og:description", content: "Track your Remake collector earnings in GMD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EarningsPage,
});

function EarningsPage() {
  const { state } = useRemake();
  const rate = state.settings.collectorRateGmdPerKg;
  const done = state.pickups.filter((p) => p.assignedToMe && p.weightKg).sort((a, b) => (b.collectedAt ?? "").localeCompare(a.collectedAt ?? ""));
  const now = new Date();
  // Last five weeks (Mon–Sun) from recorded collections.
  const weeks = Array.from({ length: 5 }, (_, i) => {
    const start = startOfWeek(subWeeks(now, 4 - i), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    const kg = done.filter((p) => p.collectedAt && parseISO(p.collectedAt) >= start && parseISO(p.collectedAt) <= end).reduce((s, p) => s + (p.weightKg ?? 0), 0);
    return { w: i === 4 ? "This wk" : format(start, "d MMM"), kg, gmd: Math.round(kg * rate) };
  });
  const thisWeek = weeks[4]!;
  const total = done.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Collector" title="Earnings" description={`Estimated at GMD ${rate} for every kilogram you record.`} actions={<><Simulated label="Payouts not connected" /><Button onClick={() => toast("Payout requests aren't connected yet", { description: "Your recorded weights are saved; payouts are handled offline for now." })}><Banknote /> Request payout</Button></>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This week" value={fmtGmd(thisWeek.gmd)} sub={fmtKg(thisWeek.kg)} icon={Wallet} tone="brand" />
        <StatCard label="Weight collected" value={fmtKg(total)} sub={`${done.length} collections`} icon={Scale} />
        <StatCard label="Last 5 weeks" value={fmtGmd(weeks.reduce((s, w) => s + w.gmd, 0))} icon={TrendingUp} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Weekly earnings (GMD)">
          <div className="h-64"><ResponsiveContainer><BarChart data={weeks}><XAxis dataKey="w" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="gmd" fill="var(--primary)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Earnings by collection">
          {done.length === 0 && <p className="text-sm text-muted-foreground">No weighed collections yet.</p>}
          <ul className="divide-y">{done.map((p) => <li key={p.id} className="flex justify-between py-2.5 text-sm"><span>{p.customer} · {fmtKg(p.weightKg ?? 0)} <span className="text-muted-foreground">{fmtShortDate(p.collectedAt ?? p.date)}</span></span><b>{fmtGmd((p.weightKg ?? 0) * rate)}</b></li>)}</ul>
        </Panel>
      </div>
    </div>
  );
}
