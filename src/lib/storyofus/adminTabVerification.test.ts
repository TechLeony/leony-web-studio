import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_TAB_VERIFICATION_KEY,
  ADMIN_TAB_VERIFICATION_MARKER,
  clearAdminTabVerification,
  clearCopiedAdminTabVerification,
  readAdminTabVerification,
  verifyAdminTabAccessForContext,
  writeAdminTabVerification,
} from "../adminTabVerification.ts";

const ADMIN_EMAIL = "contact@leony.test";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test("first StoryOfUs admin visit in a new tab requires verification", () => {
  const storage = new MemoryStorage();

  assert.equal(readAdminTabVerification(storage), false);
});

test("refresh in the verified tab remains allowed", () => {
  const storage = new MemoryStorage();

  writeAdminTabVerification(storage);
  clearCopiedAdminTabVerification({ storage, navigationType: "reload" });

  assert.equal(storage.getItem(ADMIN_TAB_VERIFICATION_KEY), ADMIN_TAB_VERIFICATION_MARKER);
  assert.equal(readAdminTabVerification(storage), true);
});

test("another opened or duplicated tab requires verification again", () => {
  const storage = new MemoryStorage();

  writeAdminTabVerification(storage);
  clearCopiedAdminTabVerification({ storage, navigationType: "navigate" });

  assert.equal(readAdminTabVerification(storage), false);
});

test("browser restore and back-forward navigation cannot reuse copied verification", () => {
  const storage = new MemoryStorage();

  writeAdminTabVerification(storage);
  clearCopiedAdminTabVerification({ storage, navigationType: "back_forward" });

  assert.equal(readAdminTabVerification(storage), false);
});

test("unknown navigation type clears verification instead of preserving a copied marker", () => {
  const storage = new MemoryStorage();

  writeAdminTabVerification(storage);
  clearCopiedAdminTabVerification({ storage, navigationType: "" });

  assert.equal(readAdminTabVerification(storage), false);
});

test("logout clears tab verification", () => {
  const storage = new MemoryStorage();

  writeAdminTabVerification(storage);
  clearAdminTabVerification(storage);

  assert.equal(readAdminTabVerification(storage), false);
});

test("non-admin authenticated users remain blocked by server verification", async () => {
  const result = await verifyAdminTabAccessForContext(
    createContext({ hasRole: false }),
    ADMIN_EMAIL,
  );

  assert.deepEqual(result, { allowed: false, reason: "not_admin" });
});

test("unauthenticated users remain blocked by server verification", async () => {
  const result = await verifyAdminTabAccessForContext(null, ADMIN_EMAIL);

  assert.deepEqual(result, { allowed: false, reason: "unauthenticated" });
});

test("configured admin email remains accepted by server verification", async () => {
  const result = await verifyAdminTabAccessForContext(
    createContext({ email: ADMIN_EMAIL, hasRole: false }),
    ADMIN_EMAIL,
  );

  assert.equal(result.allowed, true);
});

test("role-based admins are accepted by server verification", async () => {
  const result = await verifyAdminTabAccessForContext(
    createContext({ email: "role-admin@example.com", hasRole: true }),
    ADMIN_EMAIL,
  );

  assert.equal(result.allowed, true);
});

function createContext({
  email = "user@example.com",
  hasRole,
}: {
  email?: string;
  hasRole: boolean;
}) {
  return {
    userId: "user-1",
    claims: {
      email,
    },
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: hasRole ? { role: "admin" } : null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    },
  };
}
