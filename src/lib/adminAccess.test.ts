import assert from "node:assert/strict";
import test from "node:test";
import { loadAdminAccess } from "./adminAccess.ts";

function fixture(
  options: {
    user?: { id: string; email?: string; email_confirmed_at?: string } | null;
    role?: string | null;
    identityError?: boolean;
    roleError?: boolean;
    throws?: boolean;
  } = {},
) {
  const filters: [string, string][] = [];
  let queries = 0;
  const query = {
    eq(column: string, value: string) {
      filters.push([column, value]);
      return query;
    },
    async maybeSingle() {
      if (options.throws) throw new Error("Unavailable");
      return {
        data: options.role ? { role: options.role } : null,
        error: options.roleError ? new Error("Denied") : null,
      };
    },
  };
  const client = {
    auth: {
      async getUser() {
        return {
          data: { user: options.user ?? null },
          error: options.identityError ? new Error("Invalid identity") : null,
        };
      },
    },
    async getAdminRole(userId: string) {
      queries++;
      return query.eq("user_id", userId).eq("role", "admin").maybeSingle();
    },
  };
  return { client, filters, queries: () => queries };
}

const confirmed = {
  id: "verified-user",
  email: "contact@leony.tech",
  email_confirmed_at: "2026-01-01T00:00:00Z",
};

test("anonymous, invalid and unconfirmed identities never query roles", async () => {
  for (const options of [
    {},
    { user: confirmed, identityError: true },
    { user: { id: confirmed.id } },
  ]) {
    const f = fixture(options);
    assert.equal((await loadAdminAccess(f.client)).authorized, false);
    assert.equal(f.queries(), 0);
  }
});

test("approved email alone never authorizes access", async () => {
  for (const role of [null, "user", "moderator"]) {
    const f = fixture({ user: confirmed, role });
    assert.equal((await loadAdminAccess(f.client)).authorized, false);
  }
});

test("verified actual admin is authorized using the verified user ID", async () => {
  const f = fixture({ user: { ...confirmed, email: "other-admin@example.test" }, role: "admin" });
  assert.equal((await loadAdminAccess(f.client)).authorized, true);
  assert.deepEqual(f.filters, [
    ["user_id", confirmed.id],
    ["role", "admin"],
  ]);
});

test("role errors and unavailable role queries fail closed", async () => {
  for (const options of [{ roleError: true }, { throws: true }]) {
    const f = fixture({ user: confirmed, role: "admin", ...options });
    assert.equal((await loadAdminAccess(f.client)).authorized, false);
  }
});

test("authorization does not cache a previously granted role", async () => {
  const options = { user: confirmed, role: "admin" as string | null };
  const f = fixture(options);
  assert.equal((await loadAdminAccess(f.client)).authorized, true);
  options.role = null;
  assert.equal((await loadAdminAccess(f.client)).authorized, false);
});
