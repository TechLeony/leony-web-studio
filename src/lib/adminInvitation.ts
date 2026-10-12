import { passwordValidationError } from "./passwordRecovery.ts";

export const ADMIN_INVITATION_PATH = "/auth/callback";

type InvitationInput =
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "otp"; tokenHash: string };

type InvitationUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  invited_at?: string;
};

type UserResult = { data: { user: InvitationUser | null }; error: unknown };
export type InvitationClient = {
  auth: {
    setSession: (tokens: { access_token: string; refresh_token: string }) => Promise<UserResult>;
    verifyOtp: (params: { token_hash: string; type: "invite" }) => Promise<UserResult>;
    getUser: () => Promise<UserResult>;
    updateUser: (attributes: { password: string }) => Promise<{ error: unknown }>;
  };
  getAdminRole: (userId: string) => Promise<{ data: { role: string } | null; error: unknown }>;
};

function single(params: URLSearchParams, name: string) {
  const values = params.getAll(name);
  return values.length === 1 && values[0].length > 0 ? values[0] : null;
}

export function readAdminInvitation(location: {
  search: string;
  hash: string;
}): InvitationInput | null {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (
    query.has("error") ||
    fragment.has("error") ||
    query.has("error_code") ||
    fragment.has("error_code")
  ) {
    return null;
  }
  // Bearer credentials belong in the fragment, never query strings/server logs.
  if (query.has("access_token") || query.has("refresh_token") || query.has("code")) return null;
  if (query.has("token_hash")) {
    if (single(query, "type") !== "invite" || fragment.toString()) return null;
    const tokenHash = single(query, "token_hash");
    return tokenHash ? { kind: "otp", tokenHash } : null;
  }
  if (query.has("type") || single(fragment, "type") !== "invite") return null;
  const accessToken = single(fragment, "access_token");
  const refreshToken = single(fragment, "refresh_token");
  return accessToken && refreshToken ? { kind: "session", accessToken, refreshToken } : null;
}

async function verifyInvitedAdmin(client: InvitationClient, userId: string, approvedEmail: string) {
  const result = await client.auth.getUser();
  const user = result.data.user;
  if (
    result.error ||
    !user ||
    user.id !== userId ||
    !user.email_confirmed_at ||
    !user.invited_at ||
    user.email?.toLowerCase() !== approvedEmail.toLowerCase()
  ) {
    throw new Error("Invalid invitation identity");
  }
  const role = await client.getAdminRole(user.id);
  if (role.error || role.data?.role !== "admin") throw new Error("Missing administrator role");
}

export async function acceptAdminInvitation(
  client: InvitationClient,
  input: InvitationInput | null,
  approvedEmail: string,
) {
  try {
    if (!input) throw new Error("Missing invitation");
    const result =
      input.kind === "otp"
        ? await client.auth.verifyOtp({ token_hash: input.tokenHash, type: "invite" })
        : await client.auth.setSession({
            access_token: input.accessToken,
            refresh_token: input.refreshToken,
          });
    if (result.error || !result.data.user?.id) throw new Error("Invalid invitation session");
    await verifyInvitedAdmin(client, result.data.user.id, approvedEmail);
    return result.data.user.id;
  } catch {
    throw new Error(
      "This invitation is invalid, expired, or not authorized. Contact the project owner.",
    );
  }
}

export async function setInvitedAdminPassword(
  client: InvitationClient,
  invitationUserId: string | null,
  approvedEmail: string,
  password: string,
  confirmation: string,
) {
  if (!invitationUserId) throw new Error("Open a valid invitation first.");
  const validation = passwordValidationError(password, confirmation);
  if (validation) throw new Error(validation);
  try {
    await verifyInvitedAdmin(client, invitationUserId, approvedEmail);
  } catch {
    throw new Error("Your invitation session is no longer authorized. Contact the project owner.");
  }
  try {
    const result = await client.auth.updateUser({ password });
    if (result.error) throw new Error("Password rejected");
  } catch {
    throw new Error(
      "Password could not be set. Check the password requirements or request a new link.",
    );
  }
}
