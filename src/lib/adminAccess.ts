type AdminUser = { id: string; email?: string; email_confirmed_at?: string };
type AdminAccessClient = {
  auth: { getUser: () => Promise<{ data: { user: AdminUser | null }; error: unknown }> };
  getAdminRole: (userId: string) => Promise<{ data: { role?: string } | null; error: unknown }>;
};

export async function loadAdminAccess(client: AdminAccessClient) {
  let user: AdminUser | null = null;
  try {
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user?.id) return { user: null, authorized: false };
    user = identity.data.user;
    if (!user.email_confirmed_at) return { user, authorized: false };
    const role = await client.getAdminRole(user.id);
    return { user, authorized: !role.error && role.data?.role === "admin" };
  } catch {
    return { user, authorized: false };
  }
}
