import { describe, expect, it } from "vitest";
import { normalizeTyreSize, parseTyreSize } from "../modules/tyres/tyreSize.js";

describe("tyre size parsing", () => {
  it.each(["205/55/R16", "205/55/16", "205 55 16", "205-55-16", "2055516"])(
    "normalises %s",
    (input) => {
      expect(normalizeTyreSize(input)).toBe("205/55/R16");
    }
  );

  it("returns parsed dimensions", () => {
    expect(parseTyreSize("225/45/R17")).toEqual({
      width: 225,
      profile: 45,
      rim: 17,
      canonical: "225/45/R17"
    });
  });

  it("rejects invalid tyre sizes", () => {
    expect(parseTyreSize("hello")).toBeNull();
    expect(parseTyreSize("999/10/R99")).toBeNull();
  });
});

