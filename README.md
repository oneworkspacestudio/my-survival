# My Survival

A small offline emergency companion for power cuts, disrupted services and civilian
safety during conflict. The UK edition contains 23 short, sourced reference guides,
water planning, supply dates, a go-bag checklist, contacts, meeting points, incident
notes, a power-cut log and a battery runtime estimator.

## Open the offline app

Open **My-Survival-offline.html** in a modern desktop browser. Everything needed
for the handbook and tools is inside that file. Keep a copy on your computer or a
USB drive. The portable file is around 0.3 MB; no model, video, font or map download
is required.

For a phone, open the hosted HTTPS app, choose **Offline & backup → Check offline
copy**, wait for **Offline ready**, then use your browser’s **Install app** or
**Add to Home Screen**. Test it in airplane mode before relying on it. Opening
local HTML files on phones varies by operating system; the HTTPS installed app is
the supported mobile route. A hosted production address is not included in this
portable download. Use your installed One Workspace address for the hosted app.

## Keep your plan

Planning begins in memory for the current session. To retain it, open **Offline &
backup**, choose a passphrase of at least 12 characters, confirm it, and enable
encrypted saving. Remember the passphrase: there is no recovery service.

Export an encrypted backup and try restoring it before an emergency. Keep a paper
copy of your plan and important numbers. Browser storage can be cleared; a copy
of the app is not a backup of your personal plan. Moving or renaming the portable
file can change its browser storage location, so export first.

## What the app can tell you

Guides summarise primary guidance from UK public bodies, St John Ambulance, the
Red Cross, CDC, ICRC and UNMAS. Each includes its source and review date. The app
has not received independent clinical review. It provides general first steps,
not diagnosis, live alerts, verified shelters, safe routes or exposure estimates.
Source links need internet. Calls need a working telephone network. Current local
emergency instructions take priority.

The water calculator starts with 3 litres of drinking water per person per day,
plus your additional allowance. It does not set an intake limit. Battery estimates
are not suitable for planning life-support power.

## One Workspace

The Windows runtime uses MyAccounts for an optional per-user encrypted backup.
Your plan passphrase stays in the browser. The handbook is public and works from
a verified offline cache even when the host PC is off. Offline encryption is
separate from your server identity. The runtime has no sidecar or startup download.

See [integration](docs/INTEGRATION.md), [sources](docs/SOURCES.md), and
[verification and delivery status](docs/ACCEPTANCE.md). Managed installation needs
One Workspace 0.3.0-preview.117 or later. Select My Survival in Workspace updates;
the supported updater retains your other apps and creates a recovery copy.

## Build

Use Node 26+, `npm ci` and `npm run build` in `web`. Build `./cmd/my-survival` with
Go 1.27.3. UI sources live in `web/src/screens/*.aui`; generated React is disposable.
The default pinned apphost module is `v0.3.0-preview.116`; a local ignored `go.work`
can use the accompanying suite integration checkout. No GitHub Actions are used.

Run `npm test` for browser, offline, encryption, restore and layout checks. Run
`go test ./...` for server authorization/storage tests using an isolated NTFS temp
root. `scripts/package.py` creates a candidate archive with size/hash checks.
