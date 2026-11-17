import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Scale, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel, Simulated, StatCard } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { AREAS } from "@/lib/remake/data";
import { fmtKg } from "@/lib/remake/format";
import type { RemakeState } from "@/lib/remake/types";

export const Route = createFileRoute("/_dashboard/resident/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Remake" },
      { name: "description", content: "Manage your Remake resident profile, pickup address and alerts." },
      { property: "og:title", content: "Profile — Remake" },
      { property: "og:description", content: "Your Remake resident profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const inputCls = "mt-1.5 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function ProfilePage() {
  const { state, updateProfile } = useRemake();
  const [form, setForm] = useState<RemakeState["profile"]>(state.profile);
  useEffect(() => setForm(state.profile), [state.profile]);
  const mine = state.pickups.filter((p) => p.mine);
  const kg = mine.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const save = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("Name and phone are required"); return; }
    updateProfile(form);
    toast.success("Profile saved");
  };
  const initials = form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Resident" title="Profile" actions={<Simulated label="Demo account" />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-glow">
            <span className="grid size-16 place-items-center rounded-full bg-card font-display text-xl font-bold text-primary">{initials}</span>
            <p className="mt-4 font-display text-2xl font-semibold">{state.profile.name}</p>
            <p className="opacity-90">{state.profile.phone}</p>
            <p className="mt-1 text-sm opacity-80">{state.profile.address}, {state.profile.area}</p>
          </div>
          <StatCard label="Recycled" value={fmtKg(kg)} icon={Scale} />
          <StatCard label="Pickups" value={mine.length} icon={Truck} />
          <StatCard label="Member since" value="Mar 2026" icon={Leaf} />
        </div>
        <Panel title="Personal details">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Name<input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="text-sm font-medium">Phone<input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="text-sm font-medium md:col-span-2">Default pickup address<input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className="text-sm font-medium">Area<select className={inputCls} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></label>
            <label className="text-sm font-medium">Language<select className={inputCls} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as RemakeState["profile"]["language"] })}>{["English", "Wolof", "Mandinka"].map((a) => <option key={a}>{a}</option>)}</select></label>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border p-4">
            <div><p className="font-semibold">SMS pickup alerts</p><p className="text-sm text-muted-foreground">Get a text when your collector is on the way.</p></div>
            <Switch checked={form.smsAlerts} onCheckedChange={(v) => setForm({ ...form, smsAlerts: v })} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForm(state.profile)}>Cancel</Button>
            <Button onClick={save}>Save changes</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
