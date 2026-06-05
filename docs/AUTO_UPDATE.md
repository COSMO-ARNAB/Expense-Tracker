# Auto-Update System

This document explains how Expense Tracker ships updates to your users using **electron-updater** + **GitHub Releases**.

## 1. How updates work

1. You push a `v*` tag (e.g. `v1.2.3`).
2. The GitHub Actions workflow at `.github/workflows/release.yml` runs on `windows-latest`, runs `npm run release`, and `electron-builder` produces:
   - `Expense Tracker Setup 1.2.3.exe` (NSIS installer)
   - `Expense Tracker Setup 1.2.3.exe.blockmap` (binary diff metadata)
   - `latest.yml` (manifest of files + SHA-512 hashes for the stable channel)
   - `beta.yml` (manifest for the beta channel, when channel=beta)
3. `electron-builder` uploads those files to the GitHub Release attached to the tag.
4. When a user opens the app, `electron-updater` (running in the main process) reads `latest.yml` (or `beta.yml` based on the user’s channel setting), compares versions, and — if a newer version is published — emits an `update-available` event.
5. The renderer shows the **Update Available** modal. The user clicks **Update now**; the app downloads the new `.exe` in the background, displays a progress bar, and — when finished — shows the **Restart & Install** modal.
6. On **Restart & Install**, the app calls `autoUpdater.quitAndInstall()`, the app quits, the new version installs over the old one, and the app relaunches.

Updates are **differential** (NSIS `oneClick: false` + `blockmap` files) — the updater only downloads the bytes that changed.

## 2. Where the SQLite database lives (and why it’s safe)

The database file is at:

| OS      | Path                                                                |
| ------- | ------------------------------------------------------------------- |
| Windows | `%APPDATA%\Expense Tracker\expense-tracker.db`                      |
| macOS   | `~/Library/Application Support/Expense Tracker/expense-tracker.db`  |
| Linux   | `~/.config/Expense Tracker/expense-tracker.db`                     |

This path is computed at runtime via `app.getPath('userData')` (see `database/db.cjs`). The NSIS installer is configured with `perMachine: false` and never writes to or deletes `%APPDATA%`. Electron’s auto-updater uses **blockmap differential updates** and only replaces files inside the installation directory (`%LOCALAPPDATA%\Programs\Expense Tracker` on Windows) — `userData` is *not* touched by upgrades.

In other words: **the user’s data survives every update**. The only ways to lose data are: a user manually uninstalls, a user deletes `%APPDATA%\Expense Tracker`, or disk failure.

## 3. First-time setup

1. Create the GitHub repo (if you haven’t yet) and push the code. The remote is already configured to `https://github.com/COSMO-ARNAB/Expense-Tracker.git`.
2. In **Settings → Actions → General → Workflow permissions**, ensure **Read and write permissions** is selected. This is what lets the workflow upload release assets.
3. No additional secrets are required. `GITHUB_TOKEN` is provided automatically to every workflow run.
4. (Recommended but not required for first release) Add `CSC_LINK` and `CSC_KEY_PASSWORD` secrets to sign the Windows installer. See **Code signing** below.

## 4. Release workflow (developer)

### Bump & publish a stable release

```bash
npm version patch   # 1.0.0 → 1.0.1
git push --follow-tags
```

The Actions workflow builds and publishes the release automatically. Wait ~3–5 minutes, then verify:

- `https://github.com/COSMO-ARNAB/Expense-Tracker/releases/tag/v1.0.1` lists `Expense Tracker Setup 1.0.1.exe`, the matching `.blockmap`, and `latest.yml`.
- A user with `1.0.0` installed sees the update banner the next time they launch the app.

### Local test build (no upload)

```bash
npm run release:dir
```

This produces installers in `release/` but does **not** contact GitHub. Useful for testing NSIS prompts, install location, shortcuts, and the upgrade path.

### Publish a beta release

```bash
npm version 1.1.0-beta.1 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump to 1.1.0-beta.1"
git tag v1.1.0-beta.1
git push --follow-tags
```

The workflow will run with `extraMetadata.channel = beta` and electron-builder will write `beta.yml` instead of `latest.yml`. Users on the **Beta** channel receive it; stable users do not.

Or use the local script:

```bash
npm run release:beta
```

## 5. Channels

The updater reads one of two files from the GitHub Release:

| Channel | File          | When to use                                     |
| ------- | ------------- | ----------------------------------------------- |
| `latest` (default) | `latest.yml` | Stable releases; tag the commit `vX.Y.Z`.        |
| `beta`   | `beta.yml`    | Pre-releases; tag the commit `vX.Y.Z-beta.N`.   |

`electron-updater` chooses the file based on `autoUpdater.channel`. The renderer can switch the channel at runtime from **Settings → About & Updates → Update channel**. Switching the channel writes the new value to `update-prefs.json` and immediately re-checks for updates.

## 6. Code signing

Without code signing, every new download will show a SmartScreen warning ("Windows protected your PC"). To remove this:

1. Buy an **EV code-signing certificate** (recommended — instant SmartScreen reputation) or an **OV certificate** (cheaper, but requires reputation to build).
2. Convert your `.pfx` to **base64**:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\cert.pfx"))
   ```

3. Add the following secrets to your GitHub repo (**Settings → Secrets and variables → Actions**):
   - `CSC_LINK` — the base64 string above (or an `https://…` URL to the raw `.pfx`).
   - `CSC_KEY_PASSWORD` — the password for the `.pfx`.
4. The workflow will automatically pick them up via `electron-builder`.

If you don’t have a certificate yet, the workflow ships with `CSC_IDENTITY_AUTO_DISCOVERY: false` so it still builds and uploads, just without signing.

## 7. Troubleshooting

**SmartScreen blocks the installer.** Expected for unsigned builds. Click **More info → Run anyway**. To remove: see Code signing above.

**Updater says “No update available” but the user is on an older version.** Check the GitHub Release contains `latest.yml` (not just the `.exe`). The `latest.yml` is what `electron-updater` actually reads.

**Stuck on “Downloading 100%”** without the “Restart & Install” modal. Check the app log at `%APPDATA%\Expense Tracker\logs\main.log`. The most common cause is antivirus quarantining the downloaded installer.

**Manually clear update state on a user’s machine.** Delete `%APPDATA%\Expense Tracker\update-prefs.json`. The next launch starts fresh.

**Force a re-check.** Use the **Check for updates** button in **Settings → About & Updates**.

## 8. Security

- The updater verifies SHA-512 hashes against `latest.yml` / `beta.yml` before applying the update. A tampered or partially-downloaded file is rejected with a `signature` error.
- `latest.yml` is fetched over HTTPS from `github.com`; only repo collaborators can publish a release, so a third party cannot replace the manifest.
- The renderer is sandboxed (`contextIsolation: true`, `nodeIntegration: false`) and the updater runs in the main process only — no auto-update code is bundled into the React build.
- A code-signing certificate (see above) binds the binary to your organization; without it, a sufficiently motivated attacker could ship a malicious update only by first obtaining your signing key.

## 9. Reference

- `electron/updater.cjs` — main process updater
- `src/contexts/UpdateContext.jsx` — renderer state
- `src/components/update/` — UI (modals, progress, errors, settings)
- `dev-app-update.yml` — dev configuration (no network in dev)
- `.github/workflows/release.yml` — release pipeline
