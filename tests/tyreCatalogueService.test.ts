import { describe, expect, it } from "vitest";
import { tyreSeedData } from "../modules/tyres/seedData.js";
import {
  lookupTyresByCustomerInput,
  type TyreCatalogueOption,
  type TyreCatalogueRepository
} from "../modules/tyres/tyreCatalogueService.js";

class SeedTyreRepository implements TyreCatalogueRepository {
  async findActiveBySize(size: string): Promise<TyreCatalogueOption[]> {
    return tyreSeedData
      .filter((item) => item.size === size && item.active)
      .map((item, index) => ({ ...item, id: `tyre-${index}` }));
  }
}

describe("tyre catalogue lookup", () => {
  it("finds seeded catalogue options by normalised size", async () => {
    const result = await lookupTyresByCustomerInput("2055516", new SeedTyreRepository());

    expect(result.parsed?.canonical).toBe("205/55/R16");
    expect(result.options).toHaveLength(3);
    expect(result.options.map((option) => option.category)).toContain("Budget");
    expect(result.options.every((option) => option.is_placeholder_seed_data)).toBe(true);
  });

  it("returns no options for unseeded sizes", async () => {
    const result = await lookupTyresByCustomerInput("185/50/R16", new SeedTyreRepository());

    expect(result.parsed?.canonical).toBe("185/50/R16");
    expect(result.options).toEqual([]);
  });

  it("does not expose helper-only base fields in Prisma seed payload data", () => {
    expect(tyreSeedData).toHaveLength(30);
    expect(tyreSeedData.every((item) => !("base" in item))).toBe(true);
    expect(tyreSeedData.every((item) => typeof item.price === "number" && typeof item.fitted_price === "number")).toBe(true);
  });
});
