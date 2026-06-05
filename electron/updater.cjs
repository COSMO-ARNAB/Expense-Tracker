const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log/main');

let initialized = false;
let getMainWindow = () => null;
let prefsPath = null;
let prefsWriteChain = Promise.resolve();
let startupCheckTimer = null;
let appIsQuitting = false;
let mainStatus = {
  phase: 'idle',
  message: 'Idle',
  availableUpdate: null,
  downloadProgress: null,
  downloadedUpdate: null,
  lastCheckedAt: null,
  lastDownloadedAt: null,
  error: null
};

function readPrefs() {
  try {
    if (fs.existsSync(prefsPath)) {
      const raw = fs.readFileSync(prefsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        channel: typeof parsed.channel === 'string' ? parsed.channel : 'latest',
        autoDownload: typeof parsed.autoDownload === 'boolean' ? parsed.autoDownload : false,
        dismissedVersion: typeof parsed.dismissedVersion === 'string' ? parsed.dismissedVersion : null,
        lastCheckedAt: typeof parsed.lastCheckedAt === 'string' ? parsed.lastCheckedAt : null,
        lastDownloadedAt: typeof parsed.lastDownloadedAt === 'string' ? parsed.lastDownloadedAt : null
      };
    }
  } catch (err) {
    log.warn('updater: failed to read prefs', err);
  }
  return { channel: 'latest', autoDownload: false, dismissedVersion: null, lastCheckedAt: null, lastDownloadedAt: null };
}

function writePrefs(partial) {
  const current = readPrefs();
  const next = { ...current, ...partial };
  try {
    fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
    fs.writeFileSync(prefsPath, JSON.stringify(next, null, 2), 'utf-8');
  } catch (err) {
    log.warn('updater: failed to write prefs', err);
  }
  return next;
}

function getGitShortSha() {
  try {
    const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' });
    if (r.status === 0 && r.stdout) return r.stdout.trim();
  } catch (_) {}
  return null;
}

function getGitCommitCount() {
  try {
    const r = spawnSync('git', ['rev-list', '--count', 'HEAD'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' });
    if (r.status === 0 && r.stdout) return r.stdout.trim();
  } catch (_) {}
  return null;
}

function resolveBuildNumber() {
  const pkg = require('../package.json');
  const baseVersion = app.getVersion() || pkg.version || '0.0.0';
  if (!app.isPackaged) {
    const sha = getGitShortSha();
    return sha ? `${baseVersion}-dev+${sha}` : `${baseVersion}-dev`;
  }
  const commits = getGitCommitCount();
  return commits ? `${baseVersion}+${commits}` : baseVersion;
}

function getInfo() {
  const pkg = require('../package.json');
  const prefs = readPrefs();
  return {
    appVersion: app.getVersion() || pkg.version,
    buildNumber: resolveBuildNumber(),
    electronVersion: process.versions.electron || null,
    chromeVersion: process.versions.chrome || null,
    nodeVersion: process.versions.node || null,
    platform: process.platform,
    arch: process.arch,
    channel: prefs.channel,
    autoDownload: prefs.autoDownload,
    isPackaged: app.isPackaged,
    appUserModelId: 'com.expensetracker.app'
  };
}

function classifyError(err) {
  const message = (err && err.message ? String(err.message) : '').toLowerCase();
  const statusCode = err && (err.statusCode || (err.response && err.response.statusCode));
  if (
    /signature|hash mismatch|checksum|invalid signature|verification failed/.test(message)
  ) {
    return 'signature';
  }
  if (
    statusCode === undefined &&
    (/network|enotfound|econnrefused|econnreset|etimedout|getaddrinfo|fetch failed|unable to reach|timeout/i.test(message))
  ) {
    return 'network';
  }
  if (statusCode && (statusCode >= 500 || statusCode === 0 || statusCode === 408 || statusCode === 429)) {
    return 'network';
  }
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return 'signature';
  }
  return 'unknown';
}

function emit(type, details) {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return;
  const payload = { type, ...details, at: new Date().toISOString() };
  try {
    win.webContents.send('update:event', payload);
  } catch (err) {
    log.warn('updater: failed to send event to renderer', err);
  }
}

function wireEvents() {
  autoUpdater.on('checking-for-update', () => {
    mainStatus = { ...mainStatus, phase: 'checking', message: 'Checking for updates…', error: null };
    log.info('updater: checking-for-update');
    emit('checking-for-update', { status: mainStatus });
  });

  autoUpdater.on('update-available', (info) => {
    mainStatus = {
      ...mainStatus,
      phase: 'available',
      message: `Update ${info.version} available`,
      availableUpdate: {
        version: info.version,
        releaseDate: info.releaseDate || null,
        releaseNotes: info.releaseNotes || null,
        files: (info.files || []).map((f) => ({ url: f.url, size: f.size, name: f.name })),
        size: info.size || null
      },
      error: null
    };
    writePrefs({ lastCheckedAt: new Date().toISOString() });
    log.info('updater: update-available', info && info.version);
    emit('update-available', { status: mainStatus, info: mainStatus.availableUpdate });
  });

  autoUpdater.on('update-not-available', (info) => {
    mainStatus = {
      ...mainStatus,
      phase: 'not-available',
      message: 'You are up to date',
      availableUpdate: null,
      error: null
    };
    writePrefs({ lastCheckedAt: new Date().toISOString() });
    log.info('updater: update-not-available', info && info.version);
    emit('update-not-available', { status: mainStatus });
  });

  autoUpdater.on('download-progress', (progress) => {
    const safe = {
      percent: typeof progress.percent === 'number' ? progress.percent : 0,
      bytesPerSecond: progress.bytesPerSecond || 0,
      transferred: progress.transferred || 0,
      total: progress.total || 0
    };
    mainStatus = {
      ...mainStatus,
      phase: 'downloading',
      message: `Downloading ${safe.percent.toFixed(0)}%`,
      downloadProgress: safe
    };
    emit('download-progress', { status: mainStatus, progress: safe });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainStatus = {
      ...mainStatus,
      phase: 'downloaded',
      message: `Update ${info.version} downloaded`,
      downloadedUpdate: {
        version: info.version,
        releaseDate: info.releaseDate || null,
        releaseNotes: info.releaseNotes || null,
        files: (info.files || []).map((f) => ({ url: f.url, size: f.size, name: f.name })),
        size: info.size || null
      },
      downloadProgress: null
    };
    writePrefs({ lastDownloadedAt: new Date().toISOString() });
    log.info('updater: update-downloaded', info && info.version);
    emit('update-downloaded', { status: mainStatus, info: mainStatus.downloadedUpdate });
  });

  autoUpdater.on('error', (err) => {
    const code = classifyError(err);
    const errorPayload = {
      code,
      message: err && err.message ? String(err.message) : 'Unknown update error',
      stack: err && err.stack ? String(err.stack) : null,
      statusCode: err && (err.statusCode || (err.response && err.response.statusCode)) || null
    };
    mainStatus = {
      ...mainStatus,
      phase: 'error',
      message: errorPayload.message,
      error: errorPayload
    };
    log.error('updater: error', errorPayload);
    emit('error', { status: mainStatus, error: errorPayload });
  });
}

function initAutoUpdater(opts) {
  if (initialized) return;
  initialized = true;

  getMainWindow = opts && typeof opts.getMainWindow === 'function' ? opts.getMainWindow : () => null;
  prefsPath = opts && opts.prefsPath ? opts.prefsPath : path.join(app.getPath('userData'), 'update-prefs.json');

  try {
    app.setAppUserModelId('com.expensetracker.app');
  } catch (err) {
    log.warn('updater: setAppUserModelId failed', err);
  }

  try {
    log.initialize();
    if (log.transports && log.transports.file) {
      log.transports.file.resolvePathFn = () => path.join(app.getPath('logs'), 'main.log');
    }
    log.transports.file.level = 'info';
    log.transports.console.level = app.isPackaged ? 'warn' : 'debug';
    autoUpdater.logger = log;
  } catch (err) {
    console.warn('updater: failed to attach logger', err);
  }

  const prefs = readPrefs();
  try {
    autoUpdater.channel = prefs.channel || 'latest';
    autoUpdater.autoDownload = !!prefs.autoDownload;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = (prefs.channel || 'latest') !== 'latest';
  } catch (err) {
    log.warn('updater: failed to set options', err);
  }

  if (!app.isPackaged) {
    const devCfg = path.resolve(__dirname, '..', 'dev-app-update.yml');
    try {
      autoUpdater.updateConfigPath = devCfg;
      log.info('updater: dev mode — using', devCfg);
      console.log('[updater] Auto-update disabled in development. To test, see docs/AUTO_UPDATE.md.');
    } catch (err) {
      log.warn('updater: failed to set dev updateConfigPath', err);
    }
  } else {
    startupCheckTimer = setTimeout(() => {
      startupCheckTimer = null;
      if (appIsQuitting) return;
      try { autoUpdater.checkForUpdates().catch((err) => log.warn('updater: startup check failed', err)); }
      catch (err) { log.warn('updater: startup check threw', err); }
    }, 4000);
  }

  wireEvents();
}

async function check() {
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    log.warn('updater: check() failed', err);
    const code = classifyError(err);
    const errorPayload = {
      code,
      message: err && err.message ? String(err.message) : 'Check failed',
      statusCode: err && (err.statusCode || (err.response && err.response.statusCode)) || null
    };
    mainStatus = { ...mainStatus, phase: 'error', message: errorPayload.message, error: errorPayload };
    emit('error', { status: mainStatus, error: errorPayload });
    return { ok: false, error: errorPayload };
  }
}

async function download() {
  if (mainStatus.phase === 'downloading') {
    return { ok: false, reason: 'already-downloading' };
  }
  try {
    mainStatus = { ...mainStatus, phase: 'downloading', message: 'Starting download…', error: null };
    emit('download-progress', { status: mainStatus, progress: { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 } });
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    log.warn('updater: download() failed', err);
    const code = classifyError(err);
    const errorPayload = {
      code,
      message: err && err.message ? String(err.message) : 'Download failed',
      statusCode: err && (err.statusCode || (err.response && err.response.statusCode)) || null
    };
    mainStatus = { ...mainStatus, phase: 'error', message: errorPayload.message, error: errorPayload };
    emit('error', { status: mainStatus, error: errorPayload });
    return { ok: false, error: errorPayload };
  }
}

function install() {
  try {
    autoUpdater.quitAndInstall(false, false);
    return { ok: true };
  } catch (err) {
    log.warn('updater: install() failed', err);
    const code = classifyError(err);
    const errorPayload = {
      code,
      message: err && err.message ? String(err.message) : 'Install failed',
      statusCode: null
    };
    mainStatus = { ...mainStatus, phase: 'error', message: errorPayload.message, error: errorPayload };
    emit('error', { status: mainStatus, error: errorPayload });
    return { ok: false, error: errorPayload };
  }
}

async function setPrefs(partial) {
  if (!partial || typeof partial !== 'object') return { ok: false };
  const allowed = ['channel', 'autoDownload', 'dismissedVersion'];
  const toWrite = {};
  for (const k of allowed) if (k in partial) toWrite[k] = partial[k];
  if ('channel' in toWrite) toWrite.channel = toWrite.channel === 'beta' ? 'beta' : 'latest';
  if ('autoDownload' in toWrite) toWrite.autoDownload = !!toWrite.autoDownload;
  if ('dismissedVersion' in toWrite) toWrite.dismissedVersion = toWrite.dismissedVersion ? String(toWrite.dismissedVersion) : null;

  // Serialize all writes through a single promise chain so concurrent
  // setPrefs calls (e.g. user dismisses + switches channel in the same tick)
  // can never interleave a read-modify-write and lose one of the updates.
  const run = prefsWriteChain.then(async () => {
    const current = readPrefs();
    const next = { ...current, ...toWrite };
    try {
      fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
      fs.writeFileSync(prefsPath, JSON.stringify(next, null, 2), 'utf-8');
    } catch (err) {
      log.warn('updater: failed to write prefs', err);
      throw err;
    }
    if ('channel' in toWrite) {
      try { autoUpdater.channel = next.channel; } catch (_) {}
      try { autoUpdater.allowPrerelease = next.channel !== 'latest'; } catch (_) {}
    }
    if ('autoDownload' in toWrite) {
      try { autoUpdater.autoDownload = next.autoDownload; } catch (_) {}
    }
    return { ok: true, prefs: next };
  });

  // Keep the chain alive even if a write throws.
  prefsWriteChain = run.catch(() => undefined);
  return run;
}

function getStatus() {
  return {
    status: mainStatus,
    info: getInfo(),
    prefs: readPrefs()
  };
}

function getPrefsPath() {
  return prefsPath;
}

app.on('before-quit', () => {
  appIsQuitting = true;
  if (startupCheckTimer) {
    clearTimeout(startupCheckTimer);
    startupCheckTimer = null;
  }
});

module.exports = {
  initAutoUpdater,
  check,
  download,
  install,
  setPrefs,
  getStatus,
  getInfo,
  getPrefsPath
};
