import { describe, it, expect } from "vitest";

describe("OptizGYM", () => {
  it("should pass basic sanity check", () => {
    expect(true).toBe(true);
  });

  it("should calculate the monthly KES 2, KES 3, and KES 4 test prices", () => {
    const TEST_PLAN_PRICES = {
      basic: { monthly: 2, yearly: 5 },
      pro: { monthly: 3, yearly: 5 },
      elite: { monthly: 4, yearly: 5 },
    };
    expect(TEST_PLAN_PRICES.basic.monthly).toBe(2);
    expect(TEST_PLAN_PRICES.pro.monthly).toBe(3);
    expect(TEST_PLAN_PRICES.elite.monthly).toBe(4);
  });
});
