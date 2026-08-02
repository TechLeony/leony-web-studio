import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createStoryOfUsSignatureLine,
  resolveStoryOfUsSignatureName,
} from "./signatureName.ts";

describe("StoryOfUs signature name", () => {
  it("uses the canonical main customer name for current submissions", () => {
    assert.equal(
      resolveStoryOfUsSignatureName({
        customerName: " Emira ",
        submissionSnapshot: {
          contactCouple: {
            customerName: "Ignored Snapshot",
          },
        },
        legacyCoupleDisplayName: "Other & Legacy",
      }),
      "Emira",
    );
  });

  it("falls back to legacy setup snapshot and display-name fields for older submissions", () => {
    assert.equal(
      resolveStoryOfUsSignatureName({
        submissionSnapshot: {
          contactCouple: {
            customerName: "Legacy Contact",
          },
        },
        legacyCoupleDisplayName: "Other & Older Display",
      }),
      "Legacy Contact",
    );

    assert.equal(
      resolveStoryOfUsSignatureName({
        legacyCoupleDisplayName: "Other & Older Display",
        legacyPartnerName: "Other",
      }),
      "Older Display",
    );
  });

  it("does not use a legacy display-name fallback unless the recipient name can be removed", () => {
    assert.equal(
      resolveStoryOfUsSignatureName({
        legacyCoupleDisplayName: "Customer & Recipient",
      }),
      "",
    );

    assert.equal(
      resolveStoryOfUsSignatureName({
        legacyCoupleDisplayName: "Recipient & Customer",
        legacyPartnerName: "Recipient",
      }),
      "Customer",
    );

    assert.equal(
      resolveStoryOfUsSignatureName({
        legacyCoupleDisplayName: "Customer & Recipient",
        legacyPartnerName: "Recipient",
      }),
      "Customer",
    );
  });

  it("returns an empty name and formats only the prefix when no valid name exists", () => {
    const signatureName = resolveStoryOfUsSignatureName({
      customerName: " ",
      coupleDetailsCustomerName: null,
      submissionSnapshot: {
        contactCouple: {
          customerName: "",
        },
      },
      legacyCoupleDisplayName: "StoryOfUs",
    });

    assert.equal(signatureName, "");
    assert.equal(createStoryOfUsSignatureLine("Sonsuza dek", signatureName), "Sonsuza dek");
  });

  it("formats the resolved customer name under the signature prefix", () => {
    assert.equal(createStoryOfUsSignatureLine("Sonsuza dek", "Emira"), "Sonsuza dek,\nEmira");
  });
});
