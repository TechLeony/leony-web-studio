import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  acceptAdminInvitation,
  readAdminInvitation,
  setInvitedAdminPassword,
} from "./adminInvitation.ts";
import type { InvitationClient } from "./adminInvitation.ts";

const approvedEmail = "contact@leony.tech";
const sessionInput = readAdminInvitation({
  search: "",
  hash: "#type=invite&access_token=local-access&refresh_token=local-refresh",
});

function fixture() {
  type User = { id: string; email: string; email_confirmed_at?: string; invited_at?: string };
  const state: {
    user: User | null;
    role: { role: string } | null;
    roleError: unknown;
    updateError: unknown;
  } = {
    user: {
      id: "invited-user",
      email: approvedEmail,
      email_confirmed_at: "confirmed",
      invited_at: "invited",
    },
    role: { role: "admin" },
    roleError: null,
    updateError: null,
  };
  const sessions: unknown[] = [];
  const otps: unknown[] = [];
  const updates: unknown[] = [];
  const filters: unknown[] = [];
  const client: InvitationClient = {
    auth: {
      setSession: async (input) => {
        sessions.push(input);
        return { data: { user: { ...state.user! } }, error: null };
      },
      verifyOtp: async (input) => {
        otps.push(input);
        return { data: { user: { ...state.user! } }, error: null };
      },
      getUser: async () => ({ data: { user: state.user }, error: null }),
      updateUser: async (input) => {
        updates.push(input);
        return { error: state.updateError };
      },
    },
    getAdminRole: async (userId) => {
      filters.push(userId);
      return { data: state.role, error: state.roleError };
    },
  };
  return { state, client, sessions, otps, updates, filters };
}

test("default fragment invitation is installed, Auth-verified and role-checked", async () => {
  const f = fixture();
  assert.equal(await acceptAdminInvitation(f.client, sessionInput, approvedEmail), "invited-user");
  assert.deepEqual(f.sessions, [{ access_token: "local-access", refresh_token: "local-refresh" }]);
  assert.deepEqual(f.filters, ["invited-user"]);
  assert.deepEqual(f.updates, []);
});

test("custom token-hash invitation uses verifyOtp with fixed invite type", async () => {
  const f = fixture();
  const input = readAdminInvitation({
    search: "?token_hash=local-hash&type=invite&next=https://untrusted.invalid",
    hash: "",
  });
  assert.equal(await acceptAdminInvitation(f.client, input, approvedEmail), "invited-user");
  assert.deepEqual(f.otps, [{ token_hash: "local-hash", type: "invite" }]);
  assert.deepEqual(f.sessions, []);
});

for (const [search, hash] of [
  ["", ""],
  ["", "#type=recovery&access_token=a&refresh_token=b"],
  ["", "#type=invite&access_token=a"],
  ["", "#type=invite&type=invite&access_token=a&refresh_token=b"],
  ["", "#type=invite&access_token=a&access_token=b&refresh_token=c"],
  ["?type=invite&access_token=a&refresh_token=b", ""],
  ["?code=local-code", ""],
  ["?token_hash=a&type=recovery", ""],
  ["?token_hash=a&token_hash=b&type=invite", ""],
  ["?token_hash=a&type=invite", "#type=invite&access_token=a&refresh_token=b"],
  ["?error=expired", "#type=invite&access_token=a&refresh_token=b"],
]) {
  test(`malformed, ambiguous, recovery or ordinary input is rejected (${search}, ${hash})`, async () => {
    const f = fixture();
    const input = readAdminInvitation({ search, hash });
    assert.equal(input, null);
    await assert.rejects(acceptAdminInvitation(f.client, input, approvedEmail), /invalid, expired/);
    assert.deepEqual(f.sessions, []);
    assert.deepEqual(f.otps, []);
  });
}

for (const change of [
  "wrong-user",
  "unconfirmed",
  "not-invited",
  "wrong-email",
  "missing-role",
  "role-error",
]) {
  test(`invitation authorization fails closed: ${change}`, async () => {
    const f = fixture();
    if (change === "wrong-user")
      f.client.auth.getUser = async () => ({
        data: { user: { ...f.state.user!, id: "switched" } },
        error: null,
      });
    if (change === "unconfirmed") f.state.user!.email_confirmed_at = undefined;
    if (change === "not-invited") f.state.user!.invited_at = undefined;
    if (change === "wrong-email") f.state.user!.email = "ordinary@example.invalid";
    if (change === "missing-role") f.state.role = null;
    if (change === "role-error") f.state.roleError = new Error("private SQL detail");
    await assert.rejects(
      acceptAdminInvitation(f.client, sessionInput, approvedEmail),
      /not authorized/,
    );
    assert.deepEqual(f.updates, []);
  });
}

test("SDK failures never expose token or service details", async () => {
  const f = fixture();
  f.client.auth.setSession = async () => {
    throw new Error("private token/service detail");
  };
  await assert.rejects(
    acceptAdminInvitation(f.client, sessionInput, approvedEmail),
    (error: Error) => {
      assert.doesNotMatch(error.message, /private token|service detail/);
      return true;
    },
  );
});

test("verified invitation changes only the same existing user's password", async () => {
  const f = fixture();
  const id = await acceptAdminInvitation(f.client, sessionInput, approvedEmail);
  await setInvitedAdminPassword(
    f.client,
    id,
    approvedEmail,
    "a-long-new-password",
    "a-long-new-password",
  );
  assert.deepEqual(f.updates, [{ password: "a-long-new-password" }]);
});

test("ordinary visit and invalid password inputs never cause a mutation", async () => {
  const f = fixture();
  await assert.rejects(
    setInvitedAdminPassword(
      f.client,
      null,
      approvedEmail,
      "a-long-new-password",
      "a-long-new-password",
    ),
    /invitation first/,
  );
  await assert.rejects(
    setInvitedAdminPassword(f.client, "invited-user", approvedEmail, "short", "short"),
    /12 characters/,
  );
  await assert.rejects(
    setInvitedAdminPassword(
      f.client,
      "invited-user",
      approvedEmail,
      "a-long-new-password",
      "different-password",
    ),
    /do not match/,
  );
  assert.deepEqual(f.updates, []);
});

for (const change of ["expired", "switched", "revoked-role", "role-lookup-failure"]) {
  test(`identity and role are rechecked before password mutation: ${change}`, async () => {
    const f = fixture();
    const id = await acceptAdminInvitation(f.client, sessionInput, approvedEmail);
    if (change === "expired") f.state.user = null;
    if (change === "switched") f.state.user!.id = "another-user";
    if (change === "revoked-role") f.state.role = null;
    if (change === "role-lookup-failure") f.state.roleError = true;
    await assert.rejects(
      setInvitedAdminPassword(
        f.client,
        id,
        approvedEmail,
        "a-long-new-password",
        "a-long-new-password",
      ),
      /no longer authorized/,
    );
    assert.deepEqual(f.updates, []);
  });
}

test("password mutation failure is generic", async () => {
  const f = fixture();
  f.state.updateError = new Error("private password rules");
  await assert.rejects(
    setInvitedAdminPassword(
      f.client,
      "invited-user",
      approvedEmail,
      "a-long-new-password",
      "a-long-new-password",
    ),
    /Password could not be set/,
  );
});

test("invitation route isolates sessions, scrubs URL, excludes analytics, and leaves recovery strict", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const route = read("../routes/auth.callback.tsx");
  const client = read("../integrations/supabase/invitation-client.ts");
  const root = read("../routes/__root.tsx");
  const recovery = read("./passwordRecovery.ts");
  assert.match(route, /ssr: false/);
  assert.match(route, /name: "referrer", content: "no-referrer"/);
  assert.ok(
    route.indexOf("window.history.replaceState") <
      route.indexOf("const client = createInvitationClient"),
  );
  assert.match(route, /href="\/admin"/);
  assert.doesNotMatch(route, /window.location.assign|redirectTo|next=/);
  assert.match(client, /persistSession: false/);
  assert.match(client, /autoRefreshToken: false/);
  assert.match(client, /detectSessionInUrl: false/);
  assert.match(client, /\.from\("user_roles"\)/);
  assert.match(client, /\.eq\("user_id", userId\)/);
  assert.match(client, /\.eq\("role", "admin"\)/);
  assert.match(root, /\["\/auth\/reset-password", "\/auth\/callback"\]\.includes/);
  assert.match(recovery, /event === "PASSWORD_RECOVERY"/);
  assert.doesNotMatch(recovery, /invite|SIGNED_IN/);
});
