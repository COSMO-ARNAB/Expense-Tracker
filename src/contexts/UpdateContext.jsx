import React, { createContext, useContext, useEffect, useReducer, useRef, useCallback } from 'react';

const initialInfo = {
  appVersion: '',
  buildNumber: '',
  electronVersion: '',
  platform: '',
  arch: '',
  channel: 'latest',
  autoDownload: false,
  isPackaged: true
};

const initialState = {
  phase: 'idle',
  message: 'Idle',
  info: initialInfo,
  availableUpdate: null,
  downloadedUpdate: null,
  downloadProgress: null,
  lastCheckedAt: null,
  lastDownloadedAt: null,
  error: null,
  dismissedVersion: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'init': {
      const { info, prefs, status } = action;
      return {
        ...state,
        info: { ...state.info, ...info },
        channel: (info && info.channel) || (prefs && prefs.channel) || state.channel,
        autoDownload: typeof info?.autoDownload === 'boolean' ? info.autoDownload : state.autoDownload,
        lastCheckedAt: (prefs && prefs.lastCheckedAt) || state.lastCheckedAt,
        lastDownloadedAt: (prefs && prefs.lastDownloadedAt) || state.lastDownloadedAt,
        dismissedVersion: (prefs && prefs.dismissedVersion) || null,
        phase: status?.phase || state.phase,
        message: status?.message || state.message
      };
    }
    case 'checking':
      return { ...state, phase: 'checking', message: 'Checking for updates…', error: null };
    case 'available':
      return {
        ...state,
        phase: 'available',
        message: `Update ${action.info?.version || ''} available`,
        availableUpdate: action.info || null,
        lastCheckedAt: new Date().toISOString(),
        error: null
      };
    case 'not-available':
      return {
        ...state,
        phase: 'not-available',
        message: 'You are up to date',
        availableUpdate: null,
        downloadedUpdate: null,
        downloadProgress: null,
        lastCheckedAt: new Date().toISOString(),
        error: null
      };
    case 'downloading':
      return {
        ...state,
        phase: 'downloading',
        message: `Downloading ${(action.progress?.percent || 0).toFixed(0)}%`,
        downloadProgress: action.progress || state.downloadProgress,
        error: null
      };
    case 'downloaded':
      return {
        ...state,
        phase: 'downloaded',
        message: `Update ${action.info?.version || ''} ready`,
        downloadedUpdate: action.info || null,
        downloadProgress: null,
        lastDownloadedAt: new Date().toISOString(),
        error: null
      };
    case 'error':
      return {
        ...state,
        phase: 'error',
        message: action.error?.message || 'Update error',
        error: action.error || null
      };
    case 'set-channel':
      return { ...state, channel: action.channel, info: { ...state.info, channel: action.channel } };
    case 'set-auto-download':
      return { ...state, autoDownload: action.value, info: { ...state.info, autoDownload: action.value } };
    case 'dismiss':
      return { ...state, dismissedVersion: action.version || null };
    case 'reset-dismiss':
      return { ...state, dismissedVersion: null };
    default:
      return state;
  }
}

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const listenerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.getUpdateStatus === 'function') {
          const data = await window.electronAPI.getUpdateStatus();
          if (cancelled) return;
          dispatch({
            type: 'init',
            info: data?.info || initialInfo,
            prefs: data?.prefs || {},
            status: data?.status || null
          });
        }
      } catch (err) {
        console.warn('UpdateProvider: getUpdateStatus failed', err);
      }
    };
    init();

    if (window.electronAPI && typeof window.electronAPI.onUpdateEvent === 'function') {
      listenerRef.current = window.electronAPI.onUpdateEvent((payload) => {
        if (!payload || !payload.type) return;
        switch (payload.type) {
          case 'checking-for-update':
            dispatch({ type: 'checking' });
            break;
          case 'update-available':
            dispatch({ type: 'available', info: payload.info });
            break;
          case 'update-not-available':
            dispatch({ type: 'not-available' });
            break;
          case 'download-progress':
            dispatch({ type: 'downloading', progress: payload.progress });
            break;
          case 'update-downloaded':
            dispatch({ type: 'downloaded', info: payload.info });
            break;
          case 'error':
            dispatch({ type: 'error', error: payload.error });
            break;
          default:
            break;
        }
      });
    }

    return () => {
      cancelled = true;
      if (typeof listenerRef.current === 'function') {
        try { listenerRef.current(); } catch (_) {}
        listenerRef.current = null;
      }
    };
  }, []);

  const check = useCallback(async () => {
    if (!window.electronAPI) return { ok: false, reason: 'no-api' };
    return window.electronAPI.checkForUpdates();
  }, []);

  const download = useCallback(async () => {
    if (!window.electronAPI) return { ok: false, reason: 'no-api' };
    if (state.phase === 'downloading') return { ok: false, reason: 'already-downloading' };
    return window.electronAPI.downloadUpdate();
  }, [state.phase]);

  const install = useCallback(async () => {
    if (!window.electronAPI) return { ok: false, reason: 'no-api' };
    return window.electronAPI.installUpdate();
  }, []);

  const setChannel = useCallback(async (channel) => {
    if (!window.electronAPI) return { ok: false };
    const next = channel === 'beta' ? 'beta' : 'latest';
    const res = await window.electronAPI.setUpdateChannel(next);
    if (res && res.ok) {
      dispatch({ type: 'set-channel', channel: next });
      try { await window.electronAPI.checkForUpdates(); } catch (_) {}
    }
    return res;
  }, []);

  const setAutoDownload = useCallback(async (value) => {
    if (!window.electronAPI) return { ok: false };
    const res = await window.electronAPI.setAutoDownload(!!value);
    if (res && res.ok) dispatch({ type: 'set-auto-download', value: !!value });
    return res;
  }, []);

  const dismissModal = useCallback(async (version) => {
    if (!window.electronAPI) return { ok: false };
    const v = version || (state.availableUpdate && state.availableUpdate.version) || null;
    dispatch({ type: 'dismiss', version: v });
    try {
      await window.electronAPI.setUpdatePrefs({ dismissedVersion: v });
    } catch (err) {
      console.warn('UpdateProvider: persist dismissedVersion failed', err);
    }
    return { ok: true };
  }, [state.availableUpdate]);

  const value = {
    state,
    actions: { check, download, install, setChannel, setAutoDownload, dismissModal }
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) {
    return {
      state: initialState,
      actions: { check: async () => ({}), download: async () => ({}), install: async () => ({}), setChannel: async () => ({}), setAutoDownload: async () => ({}), dismissModal: async () => ({}) }
    };
  }
  return ctx;
}
