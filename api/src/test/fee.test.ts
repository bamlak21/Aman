import { describe, expect, it } from "vitest";
import { appFeeCents } from "../utils/fee";

describe("appFeeCents", () => {
  it("computes 15% fee of the escrow amount", () => {
    expect(appFeeCents(10000)).toBe(1500);
    expect(appFeeCents(5000)).toBe(750);
  });

  it("rounds the fee down so it never exceeds the amount", () => {
    expect(appFeeCents(100)).toBe(15);
    expect(appFeeCents(1)).toBe(0);
    expect(appFeeCents(10)).toBe(1);
  });

  it("returns 0 for non-positive amounts", () => {
    expect(appFeeCents(0)).toBe(0);
    expect(appFeeCents(-100)).toBe(0);
  });
});
