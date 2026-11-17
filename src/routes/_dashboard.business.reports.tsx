import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Droplets, Leaf, TreePine } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Simulated, StatCard } from "@/components/remake/ui";
import { BUSINESS, MONTHLY_TONNAGE } from "@/lib/remake/data";

export const Route = createFileRoute("/_dashboard/business/reports")({
  head: () => ({
    meta: [
      { title: "Impact Reports — Remake Business" },
      { name: "description", content: "Monthly diversion, CO₂ savings and sustainability reporting for business partners." },
      { property: "og:title", content: "Impact Reports — Remake Business" },
      { property: "og:description", content: "Sustainability impact of your recycling with Remake." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [range, setRange] = useState<3 | 6>(6);
  // Business share of platform tonnage (simulated 4%), in kg.
  const data = MONTHLY_TONNAGE.slice(-range).map((m) => ({ month: m.month, kg: Math.round((m.plastic + m.metal + m.glass + m.paper + m.ewaste) * 40) }));
  const total = data.reduce((s, d) => s + d.kg, 0);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={BUSINESS.name} title="Impact report" description="Ready to share with guests, investors and the Ministry of Environment." actions={<><Simulated label="Estimated figures" /><Button variant="outline" onClick={() => setRange(range === 6 ? 3 : 6)}>Last {range === 6 ? 3 : 6} months</Button><Button onClick={() => { window.print(); toast("Use your browser's print dialog to save as PDF"); }}><Download /> Export PDF</Button></>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Waste diverted" value={`${(total / 1000).toFixed(2)} t`} sub={`Last ${range} months`} icon={Leaf} tone="brand" />
        <StatCard label="CO₂e avoided" value={`${((total * 1.5) / 1000).toFixed(1)} t`} icon={TreePine} />
        <StatCard label="Water saved" value={`${Math.round(total * 0.9).toLocaleString("en-GB")} L`} icon={Droplets} />
      </div>
      <Panel title="Monthly diversion (kg)">
        <div className="h-72"><ResponsiveContainer><AreaChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Area dataKey="kg" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
      </Panel>
    </div>
  );
}
