// Story of Us — client-side order storage (MVP; swap for Supabase later)
import type { StoryOrder } from "./types";
import { generateOrderCode } from "./utils";

const KEY = "leony_storyofus_orders_v1";

function read(): StoryOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoryOrder[]) : [];
  } catch {
    return [];
  }
}

function write(orders: StoryOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(orders));
}

export function listOrders(): StoryOrder[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getOrder(orderCode: string): StoryOrder | null {
  return read().find((o) => o.orderCode === orderCode) ?? null;
}

export function saveOrder(order: StoryOrder) {
  const all = read();
  const idx = all.findIndex((o) => o.id === order.id);
  if (idx >= 0) all[idx] = order;
  else all.unshift(order);
  write(all);
}

export function createOrder(
  data: Omit<StoryOrder, "id" | "orderCode" | "createdAt" | "createdAtDate" | "createdAtTime">,
): StoryOrder {
  const now = new Date();
  const all = read();
  const sameDayCount = all.filter((o) => o.createdAtDate === now.toISOString().slice(0, 10)).length;
  const orderCode = generateOrderCode(sameDayCount, now);
  const order: StoryOrder = {
    ...data,
    id: crypto.randomUUID(),
    orderCode,
    createdAt: now.toISOString(),
    createdAtDate: now.toISOString().slice(0, 10),
    createdAtTime: now.toTimeString().slice(0, 5),
  };
  all.unshift(order);
  write(all);
  return order;
}

export function updateOrder(id: string, patch: Partial<StoryOrder>): StoryOrder | null {
  const all = read();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  write(all);
  return all[idx];
}
