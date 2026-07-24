import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateStoryOfUsFinancialSummary,
  classifyStoryOfUsDeliveryDeadline,
  formatStoryOfUsRemainingTime,
  getStoryOfUsAdminDeliveryDeadline,
  getStoryOfUsAdminStatus,
  getStoryOfUsAdminStatusLabel,
  getStoryOfUsPeriodStart,
} from "./storyOfUsAdminDashboard.ts";

test("maps checkout-created orders into visible admin lifecycle statuses", () => {
  const status = getStoryOfUsAdminStatus({
    status: "draft",
    paymentStatus: "pending",
    refundStatus: "none",
    checkoutExpiresAt: "2026-07-25T12:00:00.000Z",
    submittedAt: null,
    editableUntil: null,
    editingClosedAt: null,
    reviewReadyAt: null,
    deliveredAt: null,
    finalSiteUrl: null,
  });

  assert.equal(status, "payment_pending");
  assert.equal(getStoryOfUsAdminStatusLabel(status), "Payment Pending");
});

test("maps submitted paid orders to editing until the real edit window ends", () => {
  assert.equal(
    getStoryOfUsAdminStatus({
      status: "submitted",
      paymentStatus: "paid",
      refundStatus: "none",
      checkoutExpiresAt: null,
      submittedAt: "2026-07-24T14:00:00.000Z",
      editableUntil: "2026-07-25T14:00:00.000Z",
      editingClosedAt: null,
      reviewReadyAt: null,
      deliveredAt: null,
      finalSiteUrl: null,
    }),
    "editing",
  );
});

test("maps real review and delivery states from stored fields", () => {
  assert.equal(
    getStoryOfUsAdminStatus({
      status: "in_review",
      paymentStatus: "paid",
      refundStatus: "none",
      checkoutExpiresAt: null,
      submittedAt: "2026-07-24T14:00:00.000Z",
      editableUntil: "2026-07-24T17:00:00.000Z",
      editingClosedAt: "2026-07-24T17:00:00.000Z",
      reviewReadyAt: "2026-07-24T17:01:00.000Z",
      deliveryQueuedAt: null,
      deliveredAt: null,
      finalSiteUrl: null,
    }),
    "review_ready",
  );

  assert.equal(
    getStoryOfUsAdminStatus({
      status: "queued_for_delivery",
      paymentStatus: "paid",
      refundStatus: "none",
      checkoutExpiresAt: null,
      submittedAt: "2026-07-24T14:00:00.000Z",
      editableUntil: "2026-07-24T17:00:00.000Z",
      editingClosedAt: "2026-07-24T17:00:00.000Z",
      reviewReadyAt: "2026-07-24T17:01:00.000Z",
      deliveryQueuedAt: "2026-07-24T17:30:00.000Z",
      deliveredAt: null,
      finalSiteUrl: null,
    }),
    "queued_for_delivery",
  );

  assert.equal(
    getStoryOfUsAdminStatus({
      status: "published",
      paymentStatus: "paid",
      refundStatus: "none",
      checkoutExpiresAt: null,
      submittedAt: "2026-07-24T14:00:00.000Z",
      editableUntil: "2026-07-24T17:00:00.000Z",
      editingClosedAt: "2026-07-24T17:00:00.000Z",
      reviewReadyAt: "2026-07-24T17:01:00.000Z",
      deliveryQueuedAt: "2026-07-24T17:30:00.000Z",
      deliveredAt: "2026-07-24T18:00:00.000Z",
      finalSiteUrl: "https://leony.tech/storyofus/site/example",
    }),
    "delivered",
  );
});

test("refund and failed outcomes override normal lifecycle statuses", () => {
  const base = {
    status: "submitted",
    paymentStatus: "paid",
    checkoutExpiresAt: null,
    submittedAt: "2026-07-24T14:00:00.000Z",
    editableUntil: "2026-07-24T17:00:00.000Z",
    editingClosedAt: null,
    reviewReadyAt: null,
    deliveredAt: null,
    finalSiteUrl: null,
  };

  assert.equal(getStoryOfUsAdminStatus({ ...base, refundStatus: "requested" }), "refund_requested");
  assert.equal(getStoryOfUsAdminStatus({ ...base, refundStatus: "approved" }), "refund_approved");
  assert.equal(getStoryOfUsAdminStatus({ ...base, refundStatus: "refunded" }), "refunded");
  assert.equal(
    getStoryOfUsAdminStatus({ ...base, paymentStatus: "failed", refundStatus: "none" }),
    "payment_failed",
  );
});

test("delivery deadline is based on editing end plus 24 hours", () => {
  assert.equal(
    getStoryOfUsAdminDeliveryDeadline("2026-07-24T17:00:00.000Z"),
    "2026-07-25T17:00:00.000Z",
  );
});

test("classifies delivery deadline urgency and visible countdown labels", () => {
  assert.equal(
    classifyStoryOfUsDeliveryDeadline("2026-07-24T19:30:00.000Z", "2026-07-24T17:00:00.000Z"),
    "urgent",
  );
  assert.equal(
    classifyStoryOfUsDeliveryDeadline("2026-07-24T16:30:00.000Z", "2026-07-24T17:00:00.000Z"),
    "overdue",
  );
  assert.equal(
    formatStoryOfUsRemainingTime("2026-07-24T19:30:00.000Z", "2026-07-24T17:00:00.000Z"),
    "2h 30m remaining",
  );
});

test("calculates estimated StoryOfUs financials without refunded or failed orders in gross revenue", () => {
  const summary = calculateStoryOfUsFinancialSummary({
    commissionRate: 0.04,
    commissionVatRate: 0.2,
    orders: [
      {
        amount: 199,
        refundAmount: 0,
        isPaid: true,
        isRefunded: false,
        isFailedOrCancelled: false,
      },
      {
        amount: 199,
        refundAmount: 199,
        isPaid: true,
        isRefunded: true,
        isFailedOrCancelled: false,
      },
      {
        amount: 199,
        refundAmount: 0,
        isPaid: false,
        isRefunded: false,
        isFailedOrCancelled: true,
      },
    ],
  });

  assert.equal(summary.grossRevenue, 199);
  assert.equal(summary.paidOrderCount, 1);
  assert.equal(summary.averageOrderValue, 199);
  assert.equal(summary.estimatedCommission, 7.96);
  assert.equal(summary.commissionVat, 1.59);
  assert.equal(summary.estimatedNetRevenue, 189.45);
  assert.equal(summary.refundTotal, 199);
  assert.equal(summary.netRevenueAfterRefunds, -9.55);
});

test("does not invent Shopier fee estimates when commission config is missing", () => {
  const summary = calculateStoryOfUsFinancialSummary({
    orders: [
      {
        amount: 199,
        refundAmount: 0,
        isPaid: true,
        isRefunded: false,
        isFailedOrCancelled: false,
      },
    ],
  });

  assert.equal(summary.grossRevenue, 199);
  assert.equal(summary.paidOrderCount, 1);
  assert.equal(summary.estimatedCommission, null);
  assert.equal(summary.commissionVat, null);
  assert.equal(summary.estimatedNetRevenue, null);
  assert.equal(summary.netRevenueAfterRefunds, null);
});

test("period helper returns stable beginning of selected reporting windows", () => {
  const now = new Date("2026-07-24T15:30:00.000Z");
  const today = getStoryOfUsPeriodStart("today", now);
  const week = getStoryOfUsPeriodStart("7d", now);
  const year = getStoryOfUsPeriodStart("year", now);

  assert.equal(today.getFullYear(), 2026);
  assert.equal(today.getMonth(), 6);
  assert.equal(today.getDate(), 24);
  assert.equal(today.getHours(), 0);
  assert.equal(today.getMinutes(), 0);
  assert.equal(week.getDate(), 18);
  assert.equal(year.getMonth(), 0);
  assert.equal(year.getDate(), 1);
});
