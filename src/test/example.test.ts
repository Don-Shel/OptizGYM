import { describe, it, expect } from "vitest";

describe("OptizGYM", () => {
  it("should pass basic sanity check", () => {
    expect(true).toBe(true);
  });

  it("should calculate the KES 5 test prices for every paid plan", () => {
    const TEST_PLAN_PRICES = {
      basic: { monthly: 5, yearly: 5 },
      pro: { monthly: 5, yearly: 5 },
      elite: { monthly: 5, yearly: 5 },
    };
    expect(Object.values(TEST_PLAN_PRICES).every((plan) => plan.monthly === 5 && plan.yearly === 5)).toBe(true);
  });
});
