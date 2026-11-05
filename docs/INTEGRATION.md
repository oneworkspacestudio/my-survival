# Managed integration contract

My Survival: stable ID `survival`, route `/survival`, proposed repository
`oneworkspacestudio/my-survival`. General/default app; update group and recovery
scope `survival`. Public handbook and offline shell are an intentional capability.
MyAccounts protects the optional encrypted-plan backup API. An offline plan
passphrase encrypts local data; it is not a replacement server login.

Single `MySurvival.exe`, apphost, loopback port 9041 (rebased base+51), health
`/healthz`, callback `/survival/auth/callback`; Accounts starts first. No workers,
dynamic executables, videos, map tiles or model downloads. Embedded content and
browser cache each have a hard 20 MiB build budget. Native package budget 150 MiB;
encrypted plan limited to 1 MiB. This remains well under the user's 1 GB ceiling.

Private SQLite, apphost logs and secrets live in `${DATA}/survival`; managed
backup/recovery uses the normal apphost database snapshots. Plain personal files
are not stored on the server. Explicit encrypted exports go to the user's chosen
Files location. Browser data is separately encrypted, not covered by server backup.

Only embedded static files may be publicly served/cached. No API, auth responses,
session or personal plan belongs in the service-worker cache. Public guidance
works with server down after the offline-ready check; private plan unlocks locally.
First use offers session-only planning or opt-in encrypted persistence. No imported
standalone data is overwritten; restoration is explicit and validated.

Publication, channel promotion and owner installation are separate delivery gates.
No owner installation is a test fixture. Verify fresh setup, ordinary upgrade,
app-only update and rollback with synthetic NTFS data before managed release.
