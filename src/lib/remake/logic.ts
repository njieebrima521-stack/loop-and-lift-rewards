import { MATERIALS, RESIDENT, ACTIVE_COLLECTOR, DEMO_TODAY } from "./data";
import type { Batch, MaterialId, Pickup, RemakeState, Reward, ScanResult } from "./types";

/** Collector payout per kg recorded, in GMD (simulated rate). */
export const COLLECTOR_RATE_GMD_PER_KG = 6;
/** 10 Green Coins = GMD 1 (simulated rate). */
export const COINS_PER_GMD = 10;

export function pointsFor(material: MaterialId, kg: number): number {
  return Math.round(MATERIALS[material].pointsPerKg * kg);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export interface BookInput {
  material: MaterialId;
  /** Defaults to the demo resident. */
  business?: undefined | { name: string; phone: string; frequency: "Weekly" | "Fortnightly" | "Monthly" };
  bags: number;
  date: string;
  slot: string;
  address: string;
  area: string;
  notes?: string | undefined;
}

export function saveScan(state: RemakeState, scan: ScanResult): RemakeState {
  return { ...state, lastScan: scan };
}

export function bookPickup(state: RemakeState, input: BookInput): RemakeState {
  const seq = state.seq + 1;
  const id = `PU-${seq}`;
  const pickup: Pickup = {
    id,
    code: `RMK-${id}`,
    ownerType: input.business ? "business" : "resident",
    mine: !input.business,
    customer: input.business?.name ?? (state.profile?.name || RESIDENT.name),
    phone: input.business?.phone ?? (state.profile?.phone || RESIDENT.phone),
    recurring: input.business ? true : undefined,
    frequency: input.business?.frequency,
    address: input.address,
    area: input.area,
    material: input.material,
    bags: input.bags,
    date: input.date,
    slot: input.slot,
    notes: input.notes,
    status: "scheduled",
    collector: ACTIVE_COLLECTOR,
    createdAt: DEMO_TODAY,
  };
  return { ...state, seq, pickups: [pickup, ...state.pickups], demoPickupId: input.business ? state.demoPickupId : id };
}

/** Collector weighs a scheduled pickup. Resident points become PENDING, not spendable. */
export function recordWeight(state: RemakeState, pickupId: string, weightKg: number): RemakeState {
  const p = state.pickups.find((x) => x.id === pickupId);
  if (!p || p.status !== "scheduled" || !(weightKg > 0)) return state;
  const seq = state.seq + 1;
  const pts = p.mine ? pointsFor(p.material, weightKg) : 0;
  const updated: Pickup = {
    ...p,
    status: "collected",
    weightKg: round1(weightKg),
    receiptNo: `RC-${88000 + seq}`,
    collectedAt: DEMO_TODAY,
    pointsPending: p.mine ? pts : undefined,
    unsynced: state.collectorOffline || undefined,
    photoTaken: p.photoTaken,
  };
  return {
    ...state,
    seq,
    pickups: state.pickups.map((x) => (x.id === pickupId ? updated : x)),
    wallet: p.mine ? { ...state.wallet, pending: state.wallet.pending + pts } : state.wallet,
    transactions: p.mine
      ? [{ id: `T-${seq}`, type: "pending", amount: pts, label: `${MATERIALS[p.material].name} pickup ${p.id} · awaiting verification`, date: DEMO_TODAY }, ...state.transactions]
      : state.transactions,
  };
}

/** Collector refuses a pickup (contaminated, not ready...). No points are created. */
export function rejectPickup(state: RemakeState, pickupId: string, reason: string): RemakeState {
  const p = state.pickups.find((x) => x.id === pickupId);
  if (!p || p.status !== "scheduled" || !reason.trim()) return state;
  return {
    ...state,
    pickups: state.pickups.map((x) =>
      x.id === pickupId ? { ...x, status: "rejected", rejectReason: reason.trim(), collectedAt: DEMO_TODAY, unsynced: state.collectorOffline || undefined } : x,
    ),
  };
}

export function setCollectorOffline(state: RemakeState, offline: boolean): RemakeState {
  return { ...state, collectorOffline: offline };
}

/** Pushes offline collector records to the server (simulated). */
export function syncCollector(state: RemakeState): RemakeState {
  return { ...state, collectorOffline: false, pickups: state.pickups.map((p) => (p.unsynced ? { ...p, unsynced: undefined } : p)) };
}

export function markPhoto(state: RemakeState, pickupId: string): RemakeState {
  return { ...state, pickups: state.pickups.map((p) => (p.id === pickupId ? { ...p, photoTaken: true } : p)) };
}

/** Processor decision from accepted share: 100% accepted, 0% rejected, otherwise partial. */
export function decisionFor(acceptedKg: number, rejectedKg: number): "accepted" | "partial" | "rejected" {
  if (rejectedKg <= 0 && acceptedKg > 0) return "accepted";
  if (acceptedKg <= 0) return "rejected";
  return "partial";
}

/** Hub groups collected pickups of one material into a batch. */
export function createBatch(state: RemakeState, pickupIds: string[], processor: string): RemakeState {
  const picks = state.pickups.filter((p) => pickupIds.includes(p.id) && p.status === "collected");
  if (picks.length === 0) return state;
  const material = picks[0]!.material;
  if (picks.some((p) => p.material !== material)) return state;
  const seq = state.seq + 1;
  const id = `BT-${seq}`;
  const batch: Batch = {
    id,
    code: `RMK-${id}`,
    material,
    pickupIds: picks.map((p) => p.id),
    totalKg: round1(picks.reduce((s, p) => s + (p.weightKg ?? 0), 0)),
    processor,
    createdAt: DEMO_TODAY,
    status: "ready",
  };
  const ids = new Set(batch.pickupIds);
  return {
    ...state,
    seq,
    batches: [batch, ...state.batches],
    pickups: state.pickups.map((p) => (ids.has(p.id) ? { ...p, status: "batched", batchId: id } : p)),
  };
}

export function handOverBatch(state: RemakeState, batchId: string): RemakeState {
  return {
    ...state,
    batches: state.batches.map((b) => (b.id === batchId && b.status === "ready" ? { ...b, status: "in_transit" } : b)),
  };
}

/**
 * Processor verifies a batch. Accepted share of each pickup's weight converts
 * the resident's pending points into available Green Coins; the rejected share is forfeited.
 */
export function verifyBatch(
  state: RemakeState,
  batchId: string,
  acceptedKg: number,
  rejectedKg: number,
  grade: string,
  note?: string,
): RemakeState {
  const batch = state.batches.find((b) => b.id === batchId);
  if (!batch || batch.status !== "in_transit") return state;
  if (acceptedKg < 0 || rejectedKg < 0) return state;
  const total = acceptedKg + rejectedKg;
  const ratio = total > 0 ? acceptedKg / total : 0;
  let seq = state.seq;
  let available = state.wallet.available;
  let pending = state.wallet.pending;
  const txns = [...state.transactions];
  const ids = new Set(batch.pickupIds);

  const pickups = state.pickups.map((p) => {
    if (!ids.has(p.id)) return p;
    const accepted = round1((p.weightKg ?? 0) * ratio);
    if (!p.mine) return { ...p, status: "verified" as const, acceptedKg: accepted };
    const awarded = pointsFor(p.material, accepted);
    const wasPending = p.pointsPending ?? 0;
    pending -= wasPending;
    available += awarded;
    seq += 1;
    txns.unshift({ id: `T-${seq}`, type: "earned", amount: awarded, label: `${MATERIALS[p.material].name} pickup ${p.id} verified`, date: DEMO_TODAY });
    if (wasPending > awarded) {
      seq += 1;
      txns.unshift({ id: `T-${seq}`, type: "forfeited", amount: -(wasPending - awarded), label: `Rejected weight on ${p.id}`, date: DEMO_TODAY });
    }
    return { ...p, status: "verified" as const, acceptedKg: accepted, pointsAwarded: awarded, pointsPending: 0 };
  });

  return {
    ...state,
    seq,
    pickups,
    transactions: txns,
    wallet: { available, pending: Math.max(0, pending) },
    batches: state.batches.map((b) =>
      b.id === batchId
        ? { ...b, status: "verified", acceptedKg: round1(acceptedKg), rejectedKg: round1(rejectedKg), grade, inspectionNote: note, decision: decisionFor(acceptedKg, rejectedKg) }
        : b,
    ),
  };
}

export type RedeemResult = { ok: true; state: RemakeState; voucher: string } | { ok: false; error: string };

/** Only AVAILABLE coins can be spent; pending coins never count. */
export function redeemReward(state: RemakeState, reward: Reward): RedeemResult {
  if (state.wallet.available < reward.cost) {
    return { ok: false, error: `You need ${reward.cost - state.wallet.available} more Green Coins.` };
  }
  const seq = state.seq + 1;
  const voucher = `RMK-${reward.id.slice(0, 3).toUpperCase()}-${(seq * 7919).toString(36).toUpperCase().slice(-4)}`;
  return {
    ok: true,
    voucher,
    state: {
      ...state,
      seq,
      wallet: { ...state.wallet, available: state.wallet.available - reward.cost },
      redemptions: [{ id: `RD-${seq}`, rewardId: reward.id, name: reward.name, cost: reward.cost, date: DEMO_TODAY, voucher, status: "Issued" }, ...state.redemptions],
      transactions: [{ id: `T-${seq}`, type: "redeemed", amount: -reward.cost, label: reward.name, date: DEMO_TODAY }, ...state.transactions],
    },
  };
}

/** Simulated material detection from a photo. Deterministic per variant. */
export function simulateScan(variant: number, id: string): ScanResult {
  const presets: Omit<ScanResult, "id" | "createdAt">[] = [
    {
      items: [
        { label: "PET plastic bottles", material: "plastic", count: 14, confidence: 0.96 },
        { label: "Aluminium drink cans", material: "metal", count: 9, confidence: 0.92 },
      ],
      primaryMaterial: "plastic",
      accepted: true,
      estimatedKg: 3.2,
    },
    {
      items: [
        { label: "Glass bottles", material: "glass", count: 6, confidence: 0.94 },
        { label: "Glass jars", material: "glass", count: 3, confidence: 0.88 },
      ],
      primaryMaterial: "glass",
      accepted: true,
      estimatedKg: 4.5,
    },
    {
      items: [
        { label: "Food-soiled plastic bags", material: "plastic", count: 5, confidence: 0.81 },
        { label: "Mixed food waste", material: "organic", count: 1, confidence: 0.77 },
      ],
      primaryMaterial: "plastic",
      accepted: false,
      estimatedKg: 1.4,
    },
  ];
  return { ...presets[variant % presets.length]!, id, createdAt: DEMO_TODAY };
}
