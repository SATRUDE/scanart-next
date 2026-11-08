export interface PurchaseReceipt {
  orderId: string;
  total: number;
  currency: string;
  itemCount: number;
}

/** The receipt endpoint returns no name, address, email, card or client secret. */
export function parsePurchaseReceipt(value: unknown): PurchaseReceipt | null {
  if (!value || typeof value !== 'object') return null;
  const receipt = value as Record<string, unknown>;
  if (typeof receipt.orderId !== 'string' || !/^pi_[A-Za-z0-9]+$/.test(receipt.orderId)
    || typeof receipt.total !== 'number' || !Number.isFinite(receipt.total) || receipt.total <= 0
    || typeof receipt.currency !== 'string' || !/^(GBP|NOK|USD|DKK|SEK)$/.test(receipt.currency)
    || !Number.isInteger(receipt.itemCount) || Number(receipt.itemCount) < 1) return null;
  return { orderId: receipt.orderId, total: receipt.total, currency: receipt.currency, itemCount: Number(receipt.itemCount) };
}
