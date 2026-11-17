import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes, Coins, Handshake, Scale, Users } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchStatusBadge, PageHeader, Panel, PickupStatusBadge, Simulated, StatCard } from "@/components/remake/ui";
import { WorkflowTracker } from "@/components/remake/WorkflowTracker";
import { useRemake } from "@/lib/remake/store";
import { MATERIAL_LIST, MATERIALS, MONTHLY_TONNAGE, REWARDS } from "@/lib/remake/data";
import { fmtGmd, fmtKg, fmtNum, fmtShortDate } from "@/lib/remake/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Remake" },
      { name: "description", content: "Platform overview: users, collections, materials, partners, rewards and demo transactions." },
      { property: "og:title", content: "Admin — Remake" },
      { property: "og:description", content: "Remake operations console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type U = { id: string; name: string; role: string; area: string; active: boolean };
const SEED_USERS: U[] = [
  { id: "U-01", name: "Ebrima Njie", role: "Resident", area: "Kanifing", active: true },
  { id: "U-02", name: "Awa Touray", role: "Business", area: "Kololi", active: true },
  { id: "U-03", name: "Lamin Ceesay", role: "Collector", area: "Kanifing", active: true },
  { id: "U-04", name: "Fatou Jallow", role: "Collector", area: "Bakau", active: true },
  { id: "U-05", name: "Omar Sanneh", role: "Collector", area: "Kololi", active: false },
  { id: "U-06", name: "Isatou Bah", role: "Hub operator", area: "Kanifing", active: true },
  { id: "U-07", name: "Modou Sowe", role: "Processor", area: "Banjul", active: true },
  { id: "U-08", name: "Mariama Bojang", role: "Resident", area: "Bakau", active: true },
  { id: "U-09", name: "Isatou Faye", role: "Resident", area: "Sukuta", active: true },
];
const PARTNERS = [
  { name: "Gambia Polymer Works", type: "Processor", materials: "Plastic, Paper", status: "Active" },
  { name: "Banjul Metal Recovery", type: "Processor", materials: "Metal", status: "Active" },
  { name: "Brikama Compost Co-op", type: "Processor", materials: "Organic", status: "Onboarding" },
  { name: "Kanifing Recycling Hub", type: "Hub", materials: "All", status: "Active" },
  { name: "Africell", type: "Reward partner", materials: "Airtime", status: "Active" },
  { name: "NAWEC", type: "Reward partner", materials: "Cash Power", status: "Active" },
  { name: "Kololi Sands Hotel", type: "Business", materials: "Plastic, Glass", status: "Active" },
];

const chip = (on: boolean) => cn("rounded-full px-3 py-1 text-xs font-semibold", on ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground");

function AdminPage() {
  const { state } = useRemake();
  const [users, setUsers] = useState(SEED_USERS);
  const [roleF, setRoleF] = useState("All");
  const [rewardsOn, setRewardsOn] = useState<Record<string, boolean>>(() => Object.fromEntries(REWARDS.map((r) => [r.id, true])));
  const totalKg = state.pickups.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const roles = ["All", ...Array.from(new Set(users.map((u) => u.role)))];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Remake Operations" title="Platform admin" description="Everything here reflects the live demo state across all workspaces." actions={<Simulated label="Demo transactions" />} />
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          {["overview", "users", "collections", "materials", "partners", "rewards", "transactions"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Users" value={users.length} sub={`${users.filter((u) => u.active).length} active`} icon={Users} />
            <StatCard label="Collections" value={state.pickups.length} sub={fmtKg(totalKg)} icon={Scale} tone="brand" />
            <StatCard label="Batches" value={state.batches.length} sub={`${state.batches.filter((b) => b.status === "verified").length} verified`} icon={Boxes} />
            <StatCard label="Coins outstanding" value={fmtNum(state.wallet.available + state.wallet.pending)} sub={`≈ ${fmtGmd((state.wallet.available + state.wallet.pending) / 10)} liability`} icon={Coins} tone="ink" />
          </div>
          <WorkflowTracker />
          <Panel title="Platform tonnage (t)">
            <div className="h-72"><ResponsiveContainer><BarChart data={MONTHLY_TONNAGE}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend />
              {(["plastic", "metal", "glass", "paper", "ewaste"] as const).map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={`var(--chart-${i + 1})`} name={MATERIALS[k].name} />)}
            </BarChart></ResponsiveContainer></div>
          </Panel>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Panel title="User management" action={<div className="flex flex-wrap gap-1.5">{roles.map((r) => <button key={r} className={chip(roleF === r)} onClick={() => setRoleF(r)}>{r}</button>)}</div>}>
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Area</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Active</TableHead></TableRow></TableHeader>
              <TableBody>{users.filter((u) => roleF === "All" || u.role === roleF).map((u) => (
                <TableRow key={u.id}><TableCell className="font-mono text-xs">{u.id}</TableCell><TableCell className="font-medium">{u.name}</TableCell><TableCell>{u.role}</TableCell><TableCell>{u.area}</TableCell>
                  <TableCell><Badge variant={u.active ? "success" : "muted"}>{u.active ? "Active" : "Suspended"}</Badge></TableCell>
                  <TableCell className="text-right"><Switch checked={u.active} onCheckedChange={(v) => { setUsers((l) => l.map((x) => (x.id === u.id ? { ...x, active: v } : x))); toast(`${u.name} ${v ? "activated" : "suspended"}`); }} /></TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Panel title="All collections">
              <Table>
                <TableHeader><TableRow><TableHead>Pickup</TableHead><TableHead>Customer</TableHead><TableHead>Material</TableHead><TableHead>Collector</TableHead><TableHead>Weight</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{state.pickups.map((p) => <TableRow key={p.id}><TableCell className="font-mono text-xs">{p.id}</TableCell><TableCell>{p.customer}</TableCell><TableCell>{MATERIALS[p.material].name}</TableCell><TableCell>{p.collector}</TableCell><TableCell>{p.weightKg ? fmtKg(p.weightKg) : "—"}</TableCell><TableCell><PickupStatusBadge status={p.status} /></TableCell></TableRow>)}</TableBody>
              </Table>
            </Panel>
            <Panel title="Batches">
              <ul className="divide-y">{state.batches.map((b) => <li key={b.id} className="flex items-center justify-between py-2.5 text-sm"><span><b className="font-mono">{b.id}</b> · {MATERIALS[b.material].name} · {fmtKg(b.totalKg)}</span><BatchStatusBadge status={b.status} /></li>)}</ul>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MATERIAL_LIST.map((m) => {
              const kg = state.pickups.filter((p) => p.material === m.id).reduce((s, p) => s + (p.weightKg ?? 0), 0);
              return <div key={m.id} className="overflow-hidden rounded-2xl border bg-card shadow-card"><img src={m.image} alt="" className="h-28 w-full object-cover" /><div className="p-4"><p className="font-display font-semibold">{m.name}</p><p className="text-sm text-muted-foreground">{m.pointsPerKg} coins/kg · {fmtKg(kg)} collected in demo</p></div></div>;
            })}
          </div>
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <Panel title="Partners">
            <Table><TableHeader><TableRow><TableHead>Partner</TableHead><TableHead>Type</TableHead><TableHead>Materials / offer</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{PARTNERS.map((p) => <TableRow key={p.name}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.type}</TableCell><TableCell>{p.materials}</TableCell><TableCell><Badge variant={p.status === "Active" ? "success" : "warning"}>{p.status}</Badge></TableCell></TableRow>)}</TableBody></Table>
          </Panel>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <Panel title="Rewards catalogue">
            <Table><TableHeader><TableRow><TableHead>Reward</TableHead><TableHead>Partner</TableHead><TableHead>Cost</TableHead><TableHead>Value</TableHead><TableHead>Stock</TableHead><TableHead>Redeemed</TableHead><TableHead className="text-right">Listed</TableHead></TableRow></TableHeader>
              <TableBody>{REWARDS.map((r) => <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.partner}</TableCell><TableCell>{fmtNum(r.cost)}</TableCell><TableCell>{fmtGmd(r.valueGmd)}</TableCell><TableCell>{r.stock}</TableCell><TableCell>{state.redemptions.filter((x) => x.rewardId === r.id).length}</TableCell>
                <TableCell className="text-right"><Switch checked={rewardsOn[r.id] ?? true} onCheckedChange={(v) => setRewardsOn((s) => ({ ...s, [r.id]: v }))} /></TableCell></TableRow>)}</TableBody></Table>
          </Panel>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Panel title="Demo transactions" action={<Button variant="outline" size="sm" onClick={() => toast("CSV export is simulated")}><Handshake /> Export</Button>}>
            <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Coins</TableHead></TableRow></TableHeader>
              <TableBody>{state.transactions.map((t) => <TableRow key={t.id}><TableCell className="font-mono text-xs">{t.id}</TableCell><TableCell>{fmtShortDate(t.date)}</TableCell><TableCell><Badge variant={t.type === "earned" ? "success" : t.type === "pending" ? "warning" : t.type === "forfeited" ? "danger" : "muted"} className="capitalize">{t.type}</Badge></TableCell><TableCell>{t.label} <span className="text-xs text-muted-foreground">(simulated)</span></TableCell><TableCell className="text-right font-semibold tabular">{t.amount > 0 ? "+" : ""}{fmtNum(t.amount)}</TableCell></TableRow>)}</TableBody></Table>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
