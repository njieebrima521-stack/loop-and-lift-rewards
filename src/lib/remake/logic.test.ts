import { describe, expect, it } from "vitest";
import { canRedeem, decisionFor, isValidWeight, pointsFor, settlePickup } from "./logic";

describe("Green Coins rules", () => {
  it("10 kg of plastic at 15 coins/kg earns 150 coins", () => {
    expect(pointsFor(15, 10)).toBe(150);
  });

  it("an 80% accepted batch pays only the accepted share", () => {
    // 10 kg plastic pickup in a batch of 10 kg actual, 2 kg rejected -> 8 kg -> 120 coins
    expect(settlePickup(10, 10, 2, 15)).toEqual({ acceptedKg: 8, awarded: 120 });
  });

  it("a fully rejected batch pays nothing", () => {
    expect(settlePickup(10, 10, 10, 15)).toEqual({ acceptedKg: 0, awarded: 0 });
  });

  it("redeeming refuses when available coins are short", () => {
    expect(canRedeem(2450, 10000, 8)).toEqual({ ok: false, error: "You need 7550 more Green Coins." });
    expect(canRedeem(2450, 350, 300)).toEqual({ ok: true });
  });

  it("redeeming refuses when the reward is out of stock or unlisted", () => {
    expect(canRedeem(5000, 350, 0).ok).toBe(false);
    expect(canRedeem(5000, 350, 10, false).ok).toBe(false);
  });
});

describe("collector and processor rules", () => {
  it("weights must be above 0 and at most 500 kg", () => {
    expect(isValidWeight(0)).toBe(false);
    expect(isValidWeight(-2)).toBe(false);
    expect(isValidWeight(500.1)).toBe(false);
    expect(isValidWeight(12.4)).toBe(true);
  });

  it("processor decision is accepted, partial or rejected by weight", () => {
    expect(decisionFor(10, 0)).toBe("accepted");
    expect(decisionFor(8, 2)).toBe("partial");
    expect(decisionFor(0, 10)).toBe("rejected");
  });
});
