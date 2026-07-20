export function getSuccessfulShopierPaymentEmailEnqueueOutcome(emailQueued: boolean) {
  return {
    acknowledgeWebhook: true,
    emailQueued,
  };
}
