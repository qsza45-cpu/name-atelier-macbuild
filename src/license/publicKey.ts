// Public verification key embedded in the user app (raw Ed25519, base64). Public by design: it can only verify.
// Created 2026-10-28 by the admin key generator; the matching private key lives only in the admin tool's
// app-data folder (encrypted for the admin's Windows account) and in the admin's offline backups.
// Replacing this value means every previously issued key stops working in new builds.
export const LICENSE_PUBLIC_KEY_B64: string = 'v6QzvjakJBDTHoVOwtGfPuQVaD4zJuNM7/oDQWQrvpQ=';
