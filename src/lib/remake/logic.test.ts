import { describe, expect, it } from "vitest";
import { createSeedState, REWARDS } from "./data";
import { bookPickup, createBatch, decisionFor, handOverBatch, recordWeight, redeemReward, rejectPickup, setCollectorOffline, syncCollector, verifyBatch } from "./logic";

const input = { material: "plastic" as const, bags: 2, date: "2026-11-18", slot: "09:00 – 11:00", address: "x", area: "Kanifing" };

function walkToHub() {
  let s = bookPickup(createSeedState(), input);
  const id = s.demoPickupId!;
  s = recordWeight(s, id, 10); // 10kg plastic = 150 coins
  return { s, id };
}

describe("Green Coins workflow", () => {
  it("recording weight adds points as pending, not available", () => {
    const seed = createSeedState();
    const { s } = walkToHub();
    expect(s.wallet.pending).toBe(seed.wallet.pending + 150);
    expect(s.wallet.available).toBe(seed.wallet.available);
  });

  it("points become available only after the processor verifies the batch", () => {
    const seed = createSeedState();
    let { s, id } = walkToHub();
    s = createBatch(s, [id], "Gambia Polymer Works");
    const batchId = s.pickups.find((p) => p.id === id)!.batchId!;
    expect(s.wallet.available).toBe(seed.wallet.available);
    s = handOverBatch(s, batchId);
    s = verifyBatch(s, batchId, 10, 0, "Grade A");
    expect(s.wallet.available).toBe(seed.wallet.available + 150);
    expect(s.wallet.pending).toBe(seed.wallet.pending);
  });

  it("rejected weight is not paid out", () => {
    const seed = createSeedState();
    let { s, id } = walkToHub();
    s = createBatch(s, [id], "Gambia Polymer Works");
    const batchId = s.pickups.find((p) => p.id === id)!.batchId!;
    s = handOverBatch(s, batchId);
    s = verifyBatch(s, batchId, 8, 2, "Grade B"); // 80% accepted -> 8kg -> 120 coins
    expect(s.wallet.available).toBe(seed.wallet.available + 120);
  });

  it("cannot verify a batch that has not been handed over", () => {
    let { s, id } = walkToHub();
    s = createBatch(s, [id], "Gambia Polymer Works");
    const batchId = s.pickups.find((p) => p.id === id)!.batchId!;
    const before = s.wallet.available;
    s = verifyBatch(s, batchId, 10, 0, "Grade A");
    expect(s.wallet.available).toBe(before);
  });

  it("redeeming spends only available coins and refuses when short", () => {
    const seed = createSeedState(); // 2450 available, 90 pending
    const dispenser = REWARDS.find((r) => r.id === "dispenser")!; // 10,000
    expect(redeemReward(seed, dispenser).ok).toBe(false);
    const bag = REWARDS.find((r) => r.id === "bag")!; // 350
    const res = redeemReward(seed, bag);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.state.wallet.available).toBe(2100);
  });
});

describe("collector and processor rules", () => {
  it("a pickup rejected by the collector creates no pending coins", () => {
    const seed = createSeedState();
    const booked = bookPickup(seed, { material: "plastic", bags: 2, date: "2026-11-19", slot: "09:00 – 11:00", address: "x", area: "Kanifing" });
    const s = rejectPickup(booked, booked.demoPickupId!, "Customer not home");
    expect(s.pickups.find((p) => p.id === booked.demoPickupId)!.status).toBe("rejected");
    expect(s.wallet.pending).toBe(seed.wallet.pending);
  });

  it("weights recorded offline stay unsynced until sync", () => {
    let s = bookPickup(createSeedState(), { material: "metal", bags: 1, date: "2026-11-19", slot: "09:00 – 11:00", address: "x", area: "Bakau" });
    const id = s.demoPickupId!;
    s = recordWeight(setCollectorOffline(s, true), id, 4);
    expect(s.pickups.find((p) => p.id === id)!.unsynced).toBe(true);
    s = syncCollector(s);
    expect(s.pickups.find((p) => p.id === id)!.unsynced).toBeUndefined();
  });

  it("processor decision is accepted, partial or rejected by weight", () => {
    expect(decisionFor(10, 0)).toBe("accepted");
    expect(decisionFor(8, 2)).toBe("partial");
    expect(decisionFor(0, 10)).toBe("rejected");
  });
});
