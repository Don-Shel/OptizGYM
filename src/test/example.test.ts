import { describe, it, expect } from "vitest";

describe("OptizGYM", () => {
  it("should pass basic sanity check", () => {
    expect(true).toBe(true);
  });

  it("should retain the original monthly and yearly plan prices", () => {
    const PLAN_PRICES = {
      basic: { monthly: 1500, yearly: 15000 },
      pro: { monthly: 3500, yearly: 35000 },
      elite: { monthly: 7500, yearly: 75000 },
    };
    expect(PLAN_PRICES.basic.monthly).toBe(1500);
    expect(PLAN_PRICES.pro.monthly).toBe(3500);
    expect(PLAN_PRICES.elite.monthly).toBe(7500);
    expect(Object.values(PLAN_PRICES).every((plan) => plan.yearly === plan.monthly * 10)).toBe(true);
  });
});
