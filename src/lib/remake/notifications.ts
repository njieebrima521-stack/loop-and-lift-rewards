import { MATERIALS } from "./data";
import type { RemakeState } from "./types";

export interface Notice {
  id: string;
  title: string;
  body: string;
  date: string;
  kind: "pickup" | "coins" | "reward" | "tip";
}

/** Resident notifications derived from demo state, newest first. */
export function residentNotifications(state: RemakeState): Notice[] {
  const out: Notice[] = [];
  for (const p of state.pickups.filter((x) => x.mine)) {
    const m = MATERIALS[p.material].name;
    out.push({ id: `${p.id}-booked`, kind: "pickup", date: p.createdAt, title: "Pickup booked", body: `${m} pickup ${p.id} is scheduled with ${p.collector}.` });
    if (p.receiptNo) out.push({ id: `${p.id}-collected`, kind: "pickup", date: p.collectedAt ?? p.date, title: "Waste collected", body: `${p.collector} recorded ${p.weightKg} kg. Receipt ${p.receiptNo}.` });
    if (p.status === "rejected") out.push({ id: `${p.id}-rejected`, kind: "pickup", date: p.collectedAt ?? p.date, title: "Pickup not accepted", body: `Reason: ${p.rejectReason}` });
    if (p.status === "verified") out.push({ id: `${p.id}-verified`, kind: "coins", date: p.collectedAt ?? p.date, title: "Green Coins available", body: `+${p.pointsAwarded ?? 0} coins released for ${p.id} after processor verification.` });
  }
  for (const r of state.redemptions) out.push({ id: `${r.id}-redeemed`, kind: "reward", date: r.date, title: "Reward redeemed", body: `${r.name} · voucher ${r.voucher}` });
  out.push({ id: "tip-sachets", kind: "tip", date: "2026-11-01", title: "Tip: rinse your sachets", body: "Clean pure-water sachets are accepted as plastic. Food residue gets rejected." });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
