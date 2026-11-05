# My Survival acceptance

## Implemented

- 23 source-linked offline guides, full-text search and saved guides.
- Supplies, quantities, dates, water allowance and go-bag checklist.
- Contacts, meeting points, medical/accessibility notes and printable plan.
- Incident log, outage timestamps, approximate battery runtime and opt-in coordinates.
- AES-256-GCM encrypted plans with PBKDF2-SHA256 (310,000 iterations), random salt
  and nonce, explicit export and validated two-stage restoration. Session-only
  planning is available without entering a password.
- Single-file portable app and hash-verified, scoped service-worker cache.
- Embedded Windows apphost runtime and per-user authenticated encrypted backups.
- Suite integration source: registry, General default selection, package ownership,
  rebased ports, private storage, recovery/update metadata, MyAccounts callbacks,
  logout coverage, narrow public static routes, branding and candidate build path.

## Verified

Six browser tests passed against the production build in Chrome: all 23 guides
and search; 390px layout/dark mode; encryption, wrong password and cross-profile
restore; network-disabled cached reload and tools; portable file opened with the
network disabled; malformed import rejection; encrypted saving and reload directly
from the portable file without networking. Water/range calculations, invalid dates
and oversized plan rejection checked. The final six tests passed in 15.1 seconds.
Screenshots reviewed at desktop and phone widths. These are browser tests, not
physical-phone or real-emergency tests.

App Go tests and `go vet ./...` passed. Server tests include real synthetic-NTFS
apphost startup, CSRF enforcement, per-account backup isolation and logout.
Go catalog, suite and branding tests passed after adding the public-handbook
exception to the shared sign-in test. Candidate package ownership test passes.
Detailed final evidence is recorded in `agents/history/` and the build receipt.

The final Windows binary was launched with a new synthetic NTFS data directory.
Its served files matched every final offline-manifest SHA256. Synthetic login,
encrypted Workspace backup, private-API revocation on logout, and phone-width
navigation/reload at `/survival/` with networking disabled all passed. The tracked
test process was stopped. This is native apphost acceptance, not a claim of full
managed MyAccounts/OIDC installation acceptance.

The standalone HTML is 309,718 bytes; the cached public payload is 641,216 bytes.
The Windows executable is 14,043,136 bytes. No models, maps, video bundles, fonts
or additional runtime downloads are required.

## Delivery boundaries

The complete ordinary candidate bundle validates 40 apps and 520 packages. Six
isolated native managed checks passed: fresh setup, restart, omission, default-app
discovery through a protected upgrade from Workspace116, independent Survival
update and rollback. They verify real MyAccounts owner/issuer binding, optional
backup sign-in, shared picker, anonymous API denial, encrypted plan retention,
offline navigation and preservation of unrelated account bytes and user files.
The candidate receipt is `evidence/managed-candidate117b.json`; final publication
and per-machine delivery receipts belong to the Workspace release record.

No owner services or personal data are test fixtures. Release/channel promotion
and owner installation are separate from acceptance. No offline map dataset,
live alert feed, native mobile binary or physical-phone/reboot test is claimed.
No independent clinical review has been performed.

Port 9041 / base+51 avoids the concurrent My Commute source reservation at 9040.
The contract uses installer integration 11 and minimum manager
0.3.0-preview.117. Both fresh setup and upgrades use the same rebasing rule.

No owner services or files are used as fixtures. Synthetic private data stays in
`C:/Projects/.cache/my-survival-20261105`; program/build artifacts live under
`I:/Projects/tooling/my-survival-20261105`. Stop any tracked preview services after
verification. The portable app can be opened directly without a running service.

## Public installation completion

The exact public Workspace117 installer passed all six lifecycle checks;
see `evidence/managed-public117.json`. Survival1 and Workspace117 are published,
promoted and verified on the primary installation. Installed payload and
served offline-file hashes match the tested release. Existing apps, identity
and locations were preserved. Per-machine receipts are in the suite record.
