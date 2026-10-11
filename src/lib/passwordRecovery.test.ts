import assert from "node:assert/strict";
import test from "node:test";
import {
  observePasswordRecovery,
  passwordRecoveryRedirect,
  updateRecoveredPassword,
} from "./passwordRecovery.ts";

async function settle() {
  // Flush nested SDK and observer tasks without relying on wall-clock timing.
  for (let task = 0; task < 4; task++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function observerFixture(event?: string, userId: string | null = "recovery-user") {
  let listener: (event: string, session: { user: { id: string } } | null) => void = () => {};
  const states: string[] = [];
  const client = {
    ...auth(userId),
    initialize: async () => {
      if (event) setTimeout(() => listener(event, { user: { id: "recovery-user" } }), 0);
    },
    onAuthStateChange: (callback: typeof listener) => {
      listener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listener = () => {};
            },
          },
        },
      };
    },
  };
  return {
    client,
    states,
    emit: (event: string) => listener(event, null),
    callbacks: {
      ready: (id: string) => states.push(id),
      invalid: () => states.push("invalid"),
      scrubUrl: () => states.push("scrubbed"),
    },
  };
}

test("SDK's deferred PASSWORD_RECOVERY event verifies the user and enables recovery", async () => {
  const fixture = observerFixture("PASSWORD_RECOVERY");
  const stop = observePasswordRecovery(fixture.client, fixture.callbacks);
  await settle();
  assert.deepEqual(fixture.states, ["scrubbed", "recovery-user"]);
  stop();
});

for (const event of [undefined, "SIGNED_IN", "INITIAL_SESSION"]) {
  test(`direct visit or ordinary auth event (${event}) never enables recovery`, async () => {
    const fixture = observerFixture(event);
    const stop = observePasswordRecovery(fixture.client, fixture.callbacks);
    await settle();
    assert.deepEqual(fixture.states, ["scrubbed", "invalid"]);
    stop();
  });
}

test("an invalid server-verified recovery user cannot enable the form", async () => {
  const fixture = observerFixture("PASSWORD_RECOVERY", null);
  const stop = observePasswordRecovery(fixture.client, fixture.callbacks);
  await settle();
  assert.deepEqual(fixture.states, ["scrubbed", "invalid"]);
  stop();
});

test("sign-out prevents a pending recovery verification from enabling the form", async () => {
  const fixture = observerFixture("PASSWORD_RECOVERY");
  let resolveUser!: (result: Awaited<ReturnType<typeof fixture.client.getUser>>) => void;
  fixture.client.getUser = () =>
    new Promise((resolve) => {
      resolveUser = resolve;
    });
  const stop = observePasswordRecovery(fixture.client, fixture.callbacks);
  await settle();
  fixture.emit("SIGNED_OUT");
  resolveUser({ data: { user: { id: "recovery-user" } }, error: null });
  await settle();
  assert.deepEqual(fixture.states, ["scrubbed", "invalid"]);
  stop();
});

test("unmounting removes the auth listener and ignores deferred callbacks", async () => {
  const fixture = observerFixture("PASSWORD_RECOVERY");
  const stop = observePasswordRecovery(fixture.client, fixture.callbacks);
  stop();
  await settle();
  assert.deepEqual(fixture.states, []);
});

function auth(userId: string | null = "recovery-user", updateError: unknown = null) {
  const updates: { password: string }[] = [];
  return {
    updates,
    getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: null }),
    updateUser: async (attributes: { password: string }) => {
      updates.push(attributes);
      return { error: updateError };
    },
  };
}

test("recovery redirect uses a fixed same-origin route without user-controlled destinations", () => {
  assert.equal(
    passwordRecoveryRedirect("https://leony.tech"),
    "https://leony.tech/auth/reset-password",
  );
  assert.equal(
    passwordRecoveryRedirect("http://localhost:3000"),
    "http://localhost:3000/auth/reset-password",
  );
});

test("an ordinary session without recovery authorization cannot update a password", async () => {
  const client = auth();
  await assert.rejects(
    updateRecoveredPassword(client, null, "a-long-new-password", "a-long-new-password"),
    /recovery email/,
  );
  assert.deepEqual(client.updates, []);
});

for (const user of [null, "different-user"]) {
  test(`expired or switched session (${user}) cannot update a password`, async () => {
    const client = auth(user);
    await assert.rejects(
      updateRecoveredPassword(
        client,
        "recovery-user",
        "a-long-new-password",
        "a-long-new-password",
      ),
      /expired/,
    );
    assert.deepEqual(client.updates, []);
  });
}

test("password confirmation and minimum length are required before sending a mutation", async () => {
  const client = auth();
  await assert.rejects(
    updateRecoveredPassword(client, "recovery-user", "short", "short"),
    /12 characters/,
  );
  await assert.rejects(
    updateRecoveredPassword(client, "recovery-user", "a-long-new-password", "another-password"),
    /do not match/,
  );
  assert.deepEqual(client.updates, []);
});

test("a verified recovery session changes only the existing user's password", async () => {
  const client = auth();
  await updateRecoveredPassword(
    client,
    "recovery-user",
    "a-long-new-password",
    "a-long-new-password",
  );
  assert.deepEqual(client.updates, [{ password: "a-long-new-password" }]);
});

test("Supabase failure is reported without exposing raw service errors", async () => {
  const client = auth("recovery-user", new Error("private service detail"));
  await assert.rejects(
    updateRecoveredPassword(client, "recovery-user", "a-long-new-password", "a-long-new-password"),
    (error: Error) => {
      assert.match(error.message, /could not be updated/);
      assert.doesNotMatch(error.message, /private service detail/);
      return true;
    },
  );
});

test("rejected SDK requests do not expose underlying errors", async () => {
  const client = auth();
  client.getUser = async () => {
    throw new Error("private request detail");
  };
  await assert.rejects(
    updateRecoveredPassword(client, "recovery-user", "a-long-new-password", "a-long-new-password"),
    /recovery session has expired/,
  );
  assert.deepEqual(client.updates, []);
  const updatingClient = auth();
  updatingClient.updateUser = async () => {
    throw new Error("private request detail");
  };
  await assert.rejects(
    updateRecoveredPassword(
      updatingClient,
      "recovery-user",
      "a-long-new-password",
      "a-long-new-password",
    ),
    /Password could not be updated/,
  );
});
