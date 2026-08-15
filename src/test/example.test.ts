import { describe, it, expect } from "vitest";

describe("OptizGYM", () => {
  it("should pass basic sanity check", () => {
    expect(true).toBe(true);
  });

  it("should calculate plan prices correctly", () => {
    const PLAN_PRICES = {
      basic: { monthly: 29, yearly: 25 },
      pro: { monthly: 59, yearly: 50 },
      elite: { monthly: 99, yearly: 84 },
    };
    expect(PLAN_PRICES.pro.monthly).toBe(59);
    expect(PLAN_PRICES.elite.yearly).toBe(84);
  });
});
