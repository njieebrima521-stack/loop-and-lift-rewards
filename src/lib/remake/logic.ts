/**
 * Pure Remake business rules shared by the UI and mirrored by the backend
 * (the backend functions are the source of truth; these helpers drive previews
 * and are covered by logic.test.ts).
 */

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Green Coins for a weight at a material's configured rate. */
export function pointsFor(pointsPerKg: number, kg: number): number {
  return Math.round(pointsPerKg * kg);
}

/** Collector scale readings must be above 0 and at most 500 kg. */
export function isValidWeight(kg: number): boolean {
  return Number.isFinite(kg) && kg > 0 && kg <= 500;
}

/** Processor decision from accepted share: 100% accepted, 0% rejected, otherwise partial. */
export function decisionFor(acceptedKg: number, rejectedKg: number): "accepted" | "partial" | "rejected" {
  if (rejectedKg <= 0 && acceptedKg > 0) return "accepted";
  if (acceptedKg <= 0) return "rejected";
  return "partial";
}

/**
 * Settlement for one pickup in a verified batch: the batch's accepted share is applied
 * to the pickup's collected weight, and only that accepted weight earns coins.
 */
export function settlePickup(weightKg: number, actualKg: number, rejectedKg: number, pointsPerKg: number) {
  const accepted = round1(actualKg - rejectedKg);
  const ratio = actualKg > 0 ? accepted / actualKg : 0;
  const acceptedKg = round1(weightKg * ratio);
  return { acceptedKg, awarded: pointsFor(pointsPerKg, acceptedKg) };
}

export type RedeemCheck = { ok: true } | { ok: false; error: string };

/** Only AVAILABLE coins can be spent; pending coins never count. */
export function canRedeem(available: number, cost: number, stock: number, active = true): RedeemCheck {
  if (!active) return { ok: false, error: "This reward is not available." };
  if (stock <= 0) return { ok: false, error: "This reward is out of stock." };
  if (available < cost) return { ok: false, error: `You need ${cost - available} more Green Coins.` };
  return { ok: true };
}

/** Readable message from a backend error. */
export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return "Something went wrong. Please try again.";
}
