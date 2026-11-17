import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";
import { Boxes, Check, Coins, Download, Scale, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchStatusBadge, PageHeader, Panel, PickupStatusBadge, StatCard } from "@/components/remake/ui";
import { WorkflowTracker } from "@/components/remake/WorkflowTracker";
import { supabase } from "@/integrations/supabase/client";
import { useRemake } from "@/lib/remake/store";
import { MATERIAL_LIST, MATERIALS } from "@/lib/remake/data";
import { fmtGmd, fmtKg, fmtNum, fmtShortDate } from "@/lib/remake/format";
import { errorMessage } from "@/lib/remake/logic";
import type { AppRole, MaterialId } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Remake" },
      { name: "description", content: "Platform overview: users, collections, materials, partners, rewards and transactions." },
      { property: "og:title", content: "Admin — Remake" },
      { property: "og:description", content: "Remake operations console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const ROLES: AppRole[] = ["resident", "business", "collector", "hub", "processor", "admin"];
const ROLE_LABEL: Record<AppRole, string> = { resident: "Resident", business: "Business", collector: "Collector", hub: "Hub", processor: "Processor", admin: "Admin" };
const chip = (on: boolean) => cn("rounded-full px-3 py-1 text-xs font-semibold", on ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground");
const inputCls = "h-9 w-24 rounded-lg border bg-card px-2 text-sm outline-none focus:border-primary";

async function loadAdmin() {
  const q = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,area,active,account_type,created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("role_requests").select("id,user_id,role,created_at").eq("status", "pending").order("created_at"),
    supabase.from("organizations").select("*").order("kind").order("name"),
    supabase.from("coin_transactions").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(150),
    supabase.from("redemptions").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("wallets").select("available,pending"),
    supabase.from("materials").select("*").order("sort"),
  ]);
  const err = q.find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  const [profiles, roles, requests, orgs, txns, activity, redemptions, wallets, materials] = q.map((r) => r.data ?? []) as [
    { id: string; full_name: string; email: string | null; area: string; active: boolean; account_type: string; created_at: string }[],
    { user_id: string; role: AppRole }[],
    { id: string; user_id: string; role: AppRole; created_at: string }[],
    { id: string; name: string; kind: string; materials: string[]; status: string; area: string }[],
    { id: string; user_id: string; type: string; amount: number; label: string; created_at: string }[],
    { id: number; actor_id: string | null; action: string; entity: string; entity_id: string | null; created_at: string }[],
    { id: string; ref: string; user_id: string; name: string; cost: number; voucher: string; status: string; created_at: string }[],
    { available: number; pending: number }[],
    { id: MaterialId; name: string; points_per_kg: number; active: boolean }[],
  ];
  return { profiles, roles, requests, orgs, txns, activity, redemptions, wallets, materials };
}

function AdminPage() {
  const { state, refresh } = useRemake();
  const qc = useQueryClient();
  const admin = useQuery({ queryKey: ["remake-admin"], queryFn: loadAdmin, refetchInterval: 30_000 });
  const [roleF, setRoleF] = useState<"All" | AppRole>("All");
  const [orgPick, setOrgPick] = useState<Record<string, string>>({});
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [rates, setRates] = useState<Record<string, string>>({});
  const [stock, setStock] = useState<Record<string, string>>({});

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn();
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success(ok);
    await Promise.all([qc.invalidateQueries({ queryKey: ["remake-admin"] }), refresh()]);
  };

  if (admin.isLoading) return <p className="text-sm text-muted-foreground">Loading platform data…</p>;
  if (admin.error) return <p className="text-sm text-destructive">{errorMessage(admin.error)}</p>;
  const d = admin.data!;
  const name = new Map(d.profiles.map((p) => [p.id, p.full_name || p.email || "User"]));
  const rolesOf = (id: string) => d.roles.filter((r) => r.user_id === id).map((r) => r.role);
  const users = d.profiles.filter((u) => roleF === "All" || rolesOf(u.id).includes(roleF));
  const collectors = d.profiles.filter((p) => p.active && rolesOf(p.id).includes("collector"));
  const processors = d.orgs.filter((o) => o.kind === "processor");
  const totalKg = state.pickups.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const coins = d.wallets.reduce((s, w) => s + w.available + w.pending, 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const m = startOfMonth(subMonths(new Date(), 5 - i));
    const key = format(m, "yyyy-MM");
    const row: Record<string, number | string> = { month: format(m, "MMM") };
    for (const mat of MATERIAL_LIST) row[mat.id] = Math.round(state.pickups.filter((p) => p.material === mat.id && (p.collectedAt ?? "").startsWith(key)).reduce((s, p) => s + (p.weightKg ?? 0), 0) * 10) / 10;
    return row;
  });

  const exportCsv = () => {
    const rows = [["id", "date", "user", "type", "description", "coins"], ...d.txns.map((t) => [t.id, t.created_at, name.get(t.user_id) ?? t.user_id, t.type, t.label, String(t.amount)])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `remake-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Remake Operations" title="Platform admin" description="Live data across every workspace. Changes here apply immediately." />
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          {["overview", "users", "collections", "materials", "partners", "rewards", "transactions", "activity"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}{t === "users" && d.requests.length > 0 && <span className="ml-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{d.requests.length}</span>}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Users" value={d.profiles.length} sub={`${d.profiles.filter((u) => u.active).length} active`} icon={Users} />
            <StatCard label="Collections" value={state.pickups.length} sub={fmtKg(totalKg)} icon={Scale} tone="brand" />
            <StatCard label="Batches" value={state.batches.length} sub={`${state.batches.filter((b) => b.status === "verified").length} verified`} icon={Boxes} />
            <StatCard label="Coins outstanding" value={fmtNum(coins)} sub={`≈ ${fmtGmd(coins / (state.settings.coinsPerGmd || 10))} liability`} icon={Coins} tone="ink" />
          </div>
          <WorkflowTracker />
          <Panel title="Collected weight by month (kg)">
            <div className="h-72"><ResponsiveContainer><BarChart data={months}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend />
              {(["plastic", "metal", "glass", "paper", "ewaste"] as const).map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={`var(--chart-${i + 1})`} name={MATERIALS[k].name} />)}
            </BarChart></ResponsiveContainer></div>
          </Panel>
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-6">
          {d.requests.length > 0 && (
            <Panel title="Access requests" description="Collector, hub, processor and admin sign-ups wait here for approval.">
              <ul className="divide-y">
                {d.requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="min-w-0 flex-1"><b>{name.get(r.user_id)}</b> wants <b>{ROLE_LABEL[r.role]}</b> access<br /><span className="text-xs text-muted-foreground">{d.profiles.find((p) => p.id === r.user_id)?.email} · {fmtShortDate(r.created_at.slice(0, 10))}</span></span>
                    {r.role === "processor" && (
                      <select className="h-9 rounded-lg border bg-card px-2 text-sm" value={orgPick[r.id] ?? ""} onChange={(e) => setOrgPick({ ...orgPick, [r.id]: e.target.value })} aria-label="Processor organisation">
                        <option value="">Choose processor…</option>
                        {processors.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    )}
                    <Button size="sm" onClick={() => run(() => supabase.rpc("admin_decide_role_request", { _request: r.id, _approve: true, ...(orgPick[r.id] ? { _org: orgPick[r.id] } : {}) }), "Access approved")}><Check /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => run(() => supabase.rpc("admin_decide_role_request", { _request: r.id, _approve: false }), "Request declined")}><X /> Decline</Button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="User management" action={<div className="flex flex-wrap gap-1.5">{(["All", ...ROLES] as const).map((r) => <button key={r} className={chip(roleF === r)} onClick={() => setRoleF(r)}>{r === "All" ? "All" : ROLE_LABEL[r]}</button>)}</div>}>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Roles</TableHead><TableHead>Area</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Active</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell><p className="font-medium">{u.full_name || "—"}</p><p className="text-xs text-muted-foreground">{u.email}</p></TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{rolesOf(u.id).map((r) => <Badge key={r} variant="muted">{ROLE_LABEL[r]}</Badge>)}{rolesOf(u.id).length === 0 && <span className="text-xs text-muted-foreground">None yet</span>}</div></TableCell>
                    <TableCell>{u.area}</TableCell>
                    <TableCell>{fmtShortDate(u.created_at.slice(0, 10))}</TableCell>
                    <TableCell><Badge variant={u.active ? "success" : "muted"}>{u.active ? "Active" : "Suspended"}</Badge></TableCell>
                    <TableCell className="text-right"><Switch checked={u.active} disabled={u.id === state.me?.id} onCheckedChange={(v) => run(() => supabase.rpc("admin_set_user_active", { _user: u.id, _active: v }), `${u.full_name} ${v ? "activated" : "suspended"}`)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Panel title="All collections">
              <Table>
                <TableHeader><TableRow><TableHead>Pickup</TableHead><TableHead>Customer</TableHead><TableHead>Material</TableHead><TableHead>Collector</TableHead><TableHead>Weight</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {state.pickups.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No pickups yet.</TableCell></TableRow>}
                  {state.pickups.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell><TableCell>{p.customer}</TableCell><TableCell>{MATERIALS[p.material].name}</TableCell>
                      <TableCell>
                        {p.status === "scheduled" ? (
                          <div className="flex items-center gap-1.5">
                            <select className="h-8 max-w-36 rounded-lg border bg-card px-1.5 text-xs" value={assign[p.uuid] ?? p.collectorId ?? ""} onChange={(e) => setAssign({ ...assign, [p.uuid]: e.target.value })} aria-label={`Collector for ${p.id}`}>
                              <option value="">Unassigned</option>
                              {collectors.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                            {assign[p.uuid] && assign[p.uuid] !== p.collectorId && <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => run(() => supabase.rpc("admin_assign_collector", { _pickup: p.uuid, _collector: assign[p.uuid]! }), `${p.id} reassigned`)}>Save</Button>}
                          </div>
                        ) : p.collector}
                      </TableCell>
                      <TableCell>{p.weightKg ? fmtKg(p.weightKg) : "—"}</TableCell><TableCell><PickupStatusBadge status={p.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
            <Panel title="Batches">
              {state.batches.length === 0 && <p className="text-sm text-muted-foreground">No batches yet.</p>}
              <ul className="divide-y">{state.batches.map((b) => <li key={b.id} className="flex items-center justify-between py-2.5 text-sm"><span><b className="font-mono">{b.id}</b> · {MATERIALS[b.material].name} · {fmtKg(b.totalKg)} → {b.processor}</span><BatchStatusBadge status={b.status} /></li>)}</ul>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {d.materials.map((m) => {
              const kg = state.pickups.filter((p) => p.material === m.id).reduce((s, p) => s + (p.weightKg ?? 0), 0);
              const val = rates[m.id] ?? String(m.points_per_kg);
              return (
                <div key={m.id} className="overflow-hidden rounded-2xl border bg-card shadow-card">
                  <img src={MATERIALS[m.id].image} alt="" className="h-28 w-full object-cover" />
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between"><p className="font-display font-semibold">{m.name}</p><Switch checked={m.active} onCheckedChange={(v) => run(() => supabase.rpc("admin_update_material", { _id: m.id, _points: Number(m.points_per_kg), _active: v }), `${m.name} ${v ? "accepted" : "paused"}`)} aria-label={`Accept ${m.name}`} /></div>
                    <p className="text-sm text-muted-foreground">{fmtKg(kg)} collected</p>
                    <div className="flex items-center gap-2 text-sm">
                      <input className={inputCls} inputMode="decimal" value={val} onChange={(e) => setRates({ ...rates, [m.id]: e.target.value.replace(/[^0-9.]/g, "") })} aria-label={`${m.name} coins per kg`} />
                      <span className="text-muted-foreground">coins/kg</span>
                      {val !== String(m.points_per_kg) && <Button size="sm" onClick={() => run(() => supabase.rpc("admin_update_material", { _id: m.id, _points: Number(val), _active: m.active }), `${m.name} rate updated`)}>Save</Button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <SettingsPanel onSave={run} />
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <Panel title="Partners">
            <Table><TableHeader><TableRow><TableHead>Partner</TableHead><TableHead>Type</TableHead><TableHead>Materials</TableHead><TableHead>Area</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{d.orgs.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell><TableCell className="capitalize">{o.kind}</TableCell>
                  <TableCell>{o.materials.map((m) => MATERIALS[m as MaterialId]?.name ?? m).join(", ") || "—"}</TableCell><TableCell>{o.area || "—"}</TableCell>
                  <TableCell>
                    <select className="h-8 rounded-lg border bg-card px-1.5 text-xs" value={o.status} onChange={(e) => run(() => supabase.rpc("admin_set_org_status", { _org: o.id, _status: e.target.value }), `${o.name} updated`)} aria-label={`${o.name} status`}>
                      {["active", "onboarding", "suspended"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </TableCell>
                </TableRow>
              ))}</TableBody></Table>
          </Panel>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6 space-y-6">
          <Panel title="Rewards catalogue">
            <Table><TableHeader><TableRow><TableHead>Reward</TableHead><TableHead>Partner</TableHead><TableHead>Cost</TableHead><TableHead>Value</TableHead><TableHead>Stock</TableHead><TableHead>Redeemed</TableHead><TableHead className="text-right">Listed</TableHead></TableRow></TableHeader>
              <TableBody>{state.rewards.map((r) => {
                const sv = stock[r.id] ?? String(r.stock);
                const save = (active: boolean, st: number) => run(() => supabase.rpc("admin_upsert_reward", { _id: r.id, _name: r.name, _partner: r.partner, _category: r.category, _cost: r.cost, _value: r.valueGmd, _stock: st, _active: active }), `${r.name} updated`);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.partner}</TableCell><TableCell>{fmtNum(r.cost)}</TableCell><TableCell>{fmtGmd(r.valueGmd)}</TableCell>
                    <TableCell><div className="flex items-center gap-1.5"><input className={cn(inputCls, "w-20")} inputMode="numeric" value={sv} onChange={(e) => setStock({ ...stock, [r.id]: e.target.value.replace(/[^0-9]/g, "") })} aria-label={`${r.name} stock`} />{sv !== String(r.stock) && <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => save(r.active, Number(sv))}>Save</Button>}</div></TableCell>
                    <TableCell>{d.redemptions.filter((x) => x.name === r.name).length}</TableCell>
                    <TableCell className="text-right"><Switch checked={r.active} onCheckedChange={(v) => save(v, r.stock)} /></TableCell>
                  </TableRow>
                );
              })}</TableBody></Table>
          </Panel>
          <Panel title="Redemptions">
            {d.redemptions.length === 0 && <p className="text-sm text-muted-foreground">No rewards redeemed yet.</p>}
            <ul className="divide-y">{d.redemptions.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <span><b>{r.name}</b> · {name.get(r.user_id)}<br /><span className="font-mono text-xs text-muted-foreground">{r.voucher} · {fmtShortDate(r.created_at.slice(0, 10))}</span></span>
                {r.status === "Issued" ? <Button size="sm" variant="outline" onClick={() => run(() => supabase.rpc("admin_set_redemption_status", { _id: r.id, _status: "Delivered" }), "Marked delivered")}>Mark delivered</Button> : <Badge variant="success">{r.status}</Badge>}
              </li>
            ))}</ul>
          </Panel>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Panel title="Green Coins transactions" action={<Button variant="outline" size="sm" onClick={exportCsv}><Download /> Export CSV</Button>}>
            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Coins</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.txns.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No transactions yet.</TableCell></TableRow>}
                {d.txns.map((t) => <TableRow key={t.id}><TableCell>{fmtShortDate(t.created_at.slice(0, 10))}</TableCell><TableCell>{name.get(t.user_id)}</TableCell><TableCell><Badge variant={t.type === "earned" ? "success" : t.type === "pending" ? "warning" : t.type === "forfeited" ? "danger" : "muted"} className="capitalize">{t.type}</Badge></TableCell><TableCell>{t.label}</TableCell><TableCell className="text-right font-semibold tabular">{t.amount > 0 ? "+" : ""}{fmtNum(t.amount)}</TableCell></TableRow>)}
              </TableBody></Table>
          </Panel>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Panel title="Platform activity">
            {d.activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            <ul className="divide-y">{d.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span><b>{a.actor_id ? name.get(a.actor_id) ?? "User" : "System"}</b> · {a.action.replace(/_/g, " ")} <span className="font-mono text-xs text-muted-foreground">{a.entity_id}</span></span>
                <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "d MMM HH:mm")}</span>
              </li>
            ))}</ul>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsPanel({ onSave }: { onSave: (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => Promise<void> }) {
  const { state } = useRemake();
  const [rate, setRate] = useState<string | null>(null);
  const [cpg, setCpg] = useState<string | null>(null);
  const r = rate ?? String(state.settings.collectorRateGmdPerKg);
  const c = cpg ?? String(state.settings.coinsPerGmd);
  return (
    <Panel title="Platform settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Collector pay (GMD per kg)
          <div className="mt-1.5 flex gap-2"><input className={inputCls} inputMode="decimal" value={r} onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))} />{r !== String(state.settings.collectorRateGmdPerKg) && <Button size="sm" onClick={() => onSave(() => supabase.rpc("admin_set_setting", { _key: "collector_rate_gmd_per_kg", _value: Number(r) }), "Collector rate updated").then(() => setRate(null))}>Save</Button>}</div>
        </label>
        <label className="text-sm font-medium">Green Coins per GMD 1
          <div className="mt-1.5 flex gap-2"><input className={inputCls} inputMode="decimal" value={c} onChange={(e) => setCpg(e.target.value.replace(/[^0-9.]/g, ""))} />{c !== String(state.settings.coinsPerGmd) && <Button size="sm" onClick={() => onSave(() => supabase.rpc("admin_set_setting", { _key: "coins_per_gmd", _value: Number(c) }), "Coin value updated").then(() => setCpg(null))}>Save</Button>}</div>
        </label>
      </div>
    </Panel>
  );
}
