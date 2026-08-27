// -----------------------------------------------------------------------
// Shared WebAuthn server configuration
// Imported by:
//   - app/api/police/webauthn/auth-options/route.ts
//   - app/api/police/webauthn/auth-verify/route.ts
// -----------------------------------------------------------------------

export const webauthnConfig = {
  /**
   * Relying Party ID — must match the domain where the credential was
   * registered.  In dev this is 'localhost'; in production it is the
   * value set in NEXT_PUBLIC_WEBAUTHN_RP_ID.
   */
  rpID:
    process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID ?? 'localhost',

  /**
   * Expected origin for the authentication ceremony.
   * Must exactly match window.location.origin on the client.
   */
  origin:
    process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN ?? 'http://localhost:3000',

  /** Human-readable name shown in platform authenticator dialogs */
  rpName: 'SafeRwanda Traffic Police',
};
