# Admin password recovery

The admin login uses the existing main Supabase client, configured with
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. It does not use the
StoryOfUs data project's client. No service-role key is needed in the browser.

## Production prerequisites

The checked-in `supabase/config.toml` specifies project `kmxagqjwykvbiytzzete`
only. It does not include Auth redirect settings. The production allowlist
cannot be verified from this file or from public Supabase Auth endpoints.

An authorized backend owner must check the main project's Auth URL
configuration, using Lovable Cloud if that platform manages the backend:

- Site URL: `https://leony.tech`
- Allowed redirect URL: `https://leony.tech/auth/reset-password`
- Add the exact canonical `www` URL too only if admin login is served there.
- For local email testing, explicitly allow the dev server's exact origin plus
  `/auth/reset-password`. Avoid broad production wildcard redirects.
- Ensure password recovery email sending is configured and the recovery email
  template retains Supabase's confirmation link (`{{ .ConfirmationURL }}`).
  A customized redirect template must preserve `{{ .RedirectTo }}`.

Reference: https://supabase.com/docs/guides/auth/redirect-urls

Deploy the new route only after approval. No SQL migration or user/role data
change is required. Deployment alone does not change the hosted Auth allowlist.

## Flow and validation

Enter the existing account email at `/admin`, then select Forgot Password.
The confirmation message does not disclose whether the account exists.
Open the email link in a new page, choose a password of at least 12 characters,
and sign in again. Existing authorization checks still apply.

The standalone recovery route accepts the SDK's `PASSWORD_RECOVERY` event,
verifies the user with Supabase, and checks the same user again before calling
`updateUser({ password })`. Direct visits and ordinary sign-in sessions do not
enable the form. Recovery URL credentials are removed after SDK processing;
the recovery page omits the site's analytics pixel and sets no-referrer.
Refreshing after credentials are consumed requires a fresh email link.

Local tests use mocks and do not send production recovery emails or change
passwords. A real end-to-end email test requires an authorized test account,
working mail delivery, and the redirect allowlist described above.
