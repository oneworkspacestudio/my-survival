# My Survival local preview

## Scope and repository boundary

Created a UK-default offline survival companion for power cuts, disrupted services
and civilian safety during conflict. User requested small storage, ideally a few
hundred MB and below 1 GB. No publication or owner-installation authorization.
New app repository is separate from the outer, unborn OneWorkspace aggregation
repository. No commit, remote creation, push, release or owner installation made.
Suite integration lives in the isolated sibling `workspace-my-survival` worktree
based on one-workspace `1f505e0`; do not overwrite concurrent app development.

## Implementation

- `web/src/content.ts`: 23 original concise source-linked guides. Reviewed against
  primary public guidance on 2026-11-05. No independent clinical review. No live
  alerts, maps, verified shelters/routes, exposure detector or native phone binary.
- AUI screens compile through @codedia/parser to React; narrow semantic adapters
  are in `web/src/components/ui.ts`. Desktop/mobile, dark/light and print layouts.
- Water allowance, supply inventory/dates, go-bag checks, household contacts and
  needs, meeting points, incident journal, outage log, battery runtime estimator,
  explicit transient GPS request. No location tracking or background downloads.
- Session-only by default. Opt-in AES-256-GCM with PBKDF2-SHA256/310000 iterations,
  random salt/nonce; encrypted localStorage and JSON exports. Validated preview
  before import replaces data. Automatic idle lock at ten minutes. No recovery
  for forgotten passphrases. Plan size capped below 1 MB encrypted envelope limit.
- `web/scripts/offline.mjs`: standalone inline HTML plus atomic service-worker
  installation with per-file SHA256 verification. Cache only public static files.
- Native single Go apphost exe with embedded UI and optional authenticated,
  account-isolated encrypted backup. Exact byte serving avoids index redirects.
  Uses protected NTFS private storage. No sidecars or runtime downloads.

## Verification and delivery

Production browser tests cover guides/search, 390px layouts, encrypted persistence,
wrong-password rejection, cross-profile restore, offline cached navigation/tools,
single-file opening with network disabled, malformed import and calculator bounds.
Six final browser tests passed in 15.1 seconds, including offline encryption and
reload from the portable file itself. Go vet passed. Final native acceptance
verified all eight embedded asset hashes, per-account encrypted backup, logout
revocation and network-disabled `/survival/` reload/navigation at 390px. Test
runtime was stopped; no tracked preview listener remains. Native receipt is
`docs/native-acceptance.json`.

Go tests cover anonymous denial, CSRF, account separation, logout, public static
content and native storage. See `docs/ACCEPTANCE.md` and native acceptance receipt
for final packaged-artifact evidence. Screenshots contain only synthetic data.

Build with `npm ci` / `npm run build` / `npm test` in `web`, then Go 1.27.3.
Default module pin is apphost v0.3.0-preview.114; local ignored go.work points to
the integration worktree. Use the default Go module cache: explicitly choosing
the separate I-drive gomodcache caused long stalls. Run server tests on synthetic
NTFS TEMP roots, never an owner installation. Shared filesystem builds may be slow.

Portable output and Windows candidate package are built by `scripts/package.py`.
Candidate metadata intentionally has no source commit and is rejected by the
normal public component path. No GitHub Actions workflows added or enabled.
Final portable size 309718 bytes; cache payload 641216 bytes; exe 14043136 bytes;
package 14514359 bytes; ZIP 5964760 bytes. User copies are in the aggregation
workspace's `output/my-survival`, with README, source notes, acceptance and hashes.

## Managed delivery remains pending

Suite contract proposes installer integration 9 / minimum manager preview.115,
port 9041 / base+41 (9040 is reserved by concurrent My Commute development).
Reconcile newer suite inventory, create/pin reviewed immutable source/component
releases only when authorized, and verify supported fresh install, ordinary
upgrade, app-only update and rollback with isolated NTFS identities. Run the
mandatory signed-Android suite publication entry point when authorized. Do not
claim the local preview is a public channel or an installed owner app.

## Authorized managed installation

User subsequently requested installation in Workspace (primary only). Reconciled
suite with public dba9313, retaining News/Commute/Finance6 and startup fixes. Final
contract integration11/minmanager117; canonical9041 rebases to base+51. This
corrects the initial base+41 inconsistency. App pins public apphost116 and is built
with GOWORK disabled; final native exe remains14043136 bytes. Go tests pass.

Complete candidate117b has40apps/520packages. All six native managed checks pass:
fresh, restart, omission,116→117 default discovery, independent app update/rollback.
Real MyAccounts identity, optional backup sign-in, shared picker, public offline
handbook, anonymous private denial and encrypted plan preservation verified. The
suite upgrade test first caught missing distribution package ownership; fixed with
a SelectBundleUpdates regression, including exclusion and consistent port rebasing.
Six browser tests remain passing; app source/assets unchanged by these suite fixes.
Sanitised candidate receipt in docs/evidence. Publication and actual primary update
are now in progress; final machine proof must be recorded separately. NoPC2 claim.
