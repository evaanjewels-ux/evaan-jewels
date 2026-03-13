import { describe, it, expect } from "vitest";
import {
  calculateProductPrice,
  calculateMetalSubtotals,
  calculateGemstoneSubtotals,
} from "./pricing";
import { Types } from "mongoose";

// Helper to create ObjectId-like values
const oid = () => new Types.ObjectId();

describe("calculateProductPrice", () => {
  it("calculates basic product with single metal", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 10,
          pricePerGram: 6200,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [],
      makingCharges: { type: "fixed", value: 5000 },
      wastageCharges: { type: "fixed", value: 2000 },
      gstPercentage: 3,
      otherCharges: [],
    });

    expect(result.metalTotal).toBe(62000);
    expect(result.gemstoneTotal).toBe(0);
    expect(result.makingChargeAmount).toBe(5000);
    expect(result.wastageChargeAmount).toBe(2000);
    expect(result.otherChargesTotal).toBe(0);
    expect(result.subtotal).toBe(69000);
    expect(result.gstAmount).toBe(2070);
    expect(result.totalPrice).toBe(71070);
  });

  it("calculates product with multiple metals", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 8.5,
          pricePerGram: 6200,
          subtotal: 0,
        },
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 18K",
          weightInGrams: 2,
          pricePerGram: 5100,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [],
      makingCharges: { type: "fixed", value: 0 },
      wastageCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [],
    });

    expect(result.metalTotal).toBe(52700 + 10200);
    expect(result.subtotal).toBe(62900);
    expect(result.gstAmount).toBe(1887);
    expect(result.totalPrice).toBe(64787);
  });

  it("calculates product with gemstones", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 5,
          pricePerGram: 6200,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [
        {
          gemstone: oid(),
          variantId: oid(),
          variantName: "Diamond VVS1",
          weightInCarats: 0.5,
          quantity: 1,
          pricePerCarat: 45000,
          subtotal: 0,
        },
      ],
      makingCharges: { type: "fixed", value: 0 },
      wastageCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [],
    });

    expect(result.metalTotal).toBe(31000);
    expect(result.gemstoneTotal).toBe(22500);
    expect(result.subtotal).toBe(53500);
  });

  it("calculates percentage-based making charges", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 10,
          pricePerGram: 6200,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [],
      makingCharges: { type: "percentage", value: 12 },
      wastageCharges: { type: "percentage", value: 3 },
      gstPercentage: 3,
      otherCharges: [],
    });

    // metalTotal = 62000
    expect(result.makingChargeAmount).toBe(7440); // 12% of 62000
    expect(result.wastageChargeAmount).toBe(1860); // 3% of 62000
    expect(result.subtotal).toBe(62000 + 7440 + 1860);
    expect(result.subtotal).toBe(71300);
  });

  it("calculates with other charges", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 5,
          pricePerGram: 6000,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [],
      makingCharges: { type: "fixed", value: 0 },
      wastageCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [
        { name: "Certification Fee", amount: 500 },
        { name: "Polishing", amount: 300 },
      ],
    });

    expect(result.otherChargesTotal).toBe(800);
    expect(result.subtotal).toBe(30000 + 800);
    expect(result.gstAmount).toBe(924); // 3% of 30800
    expect(result.totalPrice).toBe(31724);
  });

  it("handles the full roadmap example correctly", () => {
    // From ROADMAP.md Phase 6 example
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 8.5,
          pricePerGram: 6200,
          subtotal: 0,
        },
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 18K",
          weightInGrams: 2.0,
          pricePerGram: 5100,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [
        {
          gemstone: oid(),
          variantId: oid(),
          variantName: "Diamond VVS1",
          weightInCarats: 0.5,
          quantity: 1,
          pricePerCarat: 45000,
          subtotal: 0,
        },
      ],
      makingCharges: { type: "percentage", value: 12 },
      wastageCharges: { type: "percentage", value: 3 },
      gstPercentage: 3,
      otherCharges: [{ name: "Certification Fee", amount: 500 }],
    });

    // Metal: 8.5 * 6200 + 2 * 5100 = 52700 + 10200 = 62900
    expect(result.metalTotal).toBe(62900);
    // Gemstone: 0.5 * 1 * 45000 = 22500
    expect(result.gemstoneTotal).toBe(22500);
    // Making: 12% of 62900 = 7548
    expect(result.makingChargeAmount).toBe(7548);
    // Wastage: 3% of 62900 = 1887
    expect(result.wastageChargeAmount).toBe(1887);
    // Other: 500
    expect(result.otherChargesTotal).toBe(500);
    // Subtotal: 62900 + 22500 + 7548 + 1887 + 500 = 95335
    expect(result.subtotal).toBe(95335);
    // GST: 3% of 95335 = 2860.05
    expect(result.gstAmount).toBe(2860.05);
    // Total: 95335 + 2860.05 = 98195.05
    expect(result.totalPrice).toBe(98195.05);
  });

  it("handles zero charges and empty compositions", () => {
    const result = calculateProductPrice({
      metalComposition: [],
      gemstoneComposition: [],
      makingCharges: { type: "fixed", value: 0 },
      wastageCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [],
    });

    expect(result.metalTotal).toBe(0);
    expect(result.gemstoneTotal).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.gstAmount).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  it("handles multiple gemstones with quantity", () => {
    const result = calculateProductPrice({
      metalComposition: [],
      gemstoneComposition: [
        {
          gemstone: oid(),
          variantId: oid(),
          variantName: "Diamond VVS1",
          weightInCarats: 0.25,
          quantity: 4,
          pricePerCarat: 40000,
          subtotal: 0,
        },
        {
          gemstone: oid(),
          variantId: oid(),
          variantName: "Ruby Natural",
          weightInCarats: 1.0,
          quantity: 2,
          pricePerCarat: 15000,
          subtotal: 0,
        },
      ],
      makingCharges: { type: "fixed", value: 0 },
      wastageCharges: { type: "fixed", value: 0 },
      gstPercentage: 0,
      otherCharges: [],
    });

    // Diamond: 0.25 * 4 * 40000 = 40000
    // Ruby: 1.0 * 2 * 15000 = 30000
    expect(result.gemstoneTotal).toBe(70000);
    expect(result.totalPrice).toBe(70000);
  });

  it("rounds all values to 2 decimal places", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 3.33,
          pricePerGram: 6199.99,
          subtotal: 0,
        },
      ],
      gemstoneComposition: [],
      makingCharges: { type: "percentage", value: 7.5 },
      wastageCharges: { type: "fixed", value: 0 },
      gstPercentage: 3,
      otherCharges: [],
    });

    // Verify all numbers have max 2 decimal places
    const values = Object.values(result);
    values.forEach((val) => {
      const decimals = val.toString().split(".")[1];
      expect(!decimals || decimals.length <= 2).toBe(true);
    });
  });

  it("calculates per_gram making and wastage charges", () => {
    const result = calculateProductPrice({
      metalComposition: [
        {
          metal: oid(),
          variantId: oid(),
          variantName: "Gold 22K",
          weightInGrams: 10,
          pricePerGram: 6200,
          subtotal: 0,
          wastageCharges: { type: "per_gram", value: 200 },
        },
      ],
      gemstoneComposition: [],
      makingCharges: { type: "per_gram", value: 500 },
      gstPercentage: 3,
      otherCharges: [],
    });

    // metalTotal = 10 * 6200 = 62000
    expect(result.metalTotal).toBe(62000);
    // making = 500/g * 10g = 5000
    expect(result.makingChargeAmount).toBe(5000);
    // wastage = 200/g * 10g = 2000
    expect(result.wastageChargeAmount).toBe(2000);
    // subtotal = 62000 + 5000 + 2000 = 69000
    expect(result.subtotal).toBe(69000);
    // GST = 3% of 69000 = 2070
    expect(result.gstAmount).toBe(2070);
    expect(result.totalPrice).toBe(71070);
  });
});

describe("calculateMetalSubtotals", () => {
  it("computes subtotal for each metal", () => {
    const result = calculateMetalSubtotals([
      {
        metal: oid(),
        variantId: oid(),
        variantName: "Gold 22K",
        weightInGrams: 10,
        pricePerGram: 6200,
        subtotal: 0,
      },
      {
        metal: oid(),
        variantId: oid(),
        variantName: "Silver 925",
        weightInGrams: 50,
        pricePerGram: 80,
        subtotal: 0,
      },
    ]);

    expect(result[0].subtotal).toBe(62000);
    expect(result[1].subtotal).toBe(4000);
  });
});

describe("calculateGemstoneSubtotals", () => {
  it("computes subtotal for each gemstone", () => {
    const result = calculateGemstoneSubtotals([
      {
        gemstone: oid(),
        variantId: oid(),
        variantName: "Diamond VVS1",
        weightInCarats: 0.5,
        quantity: 2,
        pricePerCarat: 45000,
        subtotal: 0,
      },
    ]);

    // 0.5 * 2 * 45000 = 45000
    expect(result[0].subtotal).toBe(45000);
  });
});
