# Wallet login API
All JSON envelopes `{success:true,data:...}` / `{success:false,error:string}`.
All mutation requests require allowlisted Origin and header `X-AgentSafe-CSRF: 1`, including authentication. Frontend default Origin http://localhost:5173, http://127.0.0.1:5173; production configured AUTH_ALLOWED_ORIGINS. Cookie credentials required.

POST /api/auth/challenge `{owner_pubkey}` -> `{challenge_id,message,expires_at}`. Sign exact UTF8 message with Phantom signMessage. Message stored server-side includes app/domain origin, pubkey, nonce, issue/expiry, purpose explicitly non-payment. TTL 5min.
POST /api/auth/verify `{challenge_id,signature}` signature canonical base64 of 64byte Ed25519 signature -> `{authenticated:true,owner_pubkey}` and HttpOnly SameSite=Strict session cookie. No token in JSON/localStorage.
GET /api/auth/session -> `{authenticated:false}` or `{authenticated:true,owner_pubkey}`. Session TTL 8h, persisted hashed. Expired/invalid cookie returns false.
POST /api/auth/logout `{}` -> `{authenticated:false}`, revokes durable session and clears cookie.

All other /api endpoints require authentication (401). IDs owned by another identity return404. Legacy POST /api/users and POST /api/vaults disabled501; use authenticated POST /api/vaults/local `{owner_pubkey}` matching signed wallet. Existing wallet connection without valid backend session must not display authenticated state. No watching arbitrary wallets through signed identity.
Cookie secure in production (NODE_ENV=production), HTTP local dev intentionally nonsecure. Authentication grants app control of own records only, never permission to transfer wallet assets. Payments remain501. Faucet remains Devnet-only and owned vault only.
Challenge response additionally sets HttpOnly `agentsafe_login` cookie (production `__Host-agentsafe_login`); verify requires the same browser cookie and stored Origin. Preserve cookie jar across challenge/verify. Session cookie `agentsafe_session` (production `__Host-agentsafe_session`), both Path=/ and SameSite=Strict. GET session/verify include `expires_at`. Public auth payload never includes user_id/hash/token. Responses use Cache-Control:no-store.

In production, AUTH_ALLOWED_ORIGINS must be explicitly configured (defaults deny all mutations), HTTPS required for Secure cookies. Nonbrowser testing clients must set the configured Origin and X-AgentSafe-CSRF header and preserve cookies, without a bypass endpoint. Challenge/signature verification performs no RPC.
