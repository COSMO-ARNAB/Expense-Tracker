import React, { useState } from 'react';
import { RefreshCw, Download, Info, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { relTime } from '@/lib/updater';

function StatusLine({ state, actions }) {
  const { phase, availableUpdate, downloadedUpdate, downloadProgress, error, info } = state;
  if (error) {
    const isSig = error.code === 'signature';
    return (
      <div className={`mt-4 rounded-2xl border p-4 text-xs font-medium ${isSig ? 'border-rose-200 bg-rose-50/60 text-rose-700' : 'border-amber-200 bg-amber-50/60 text-amber-700'}`}>
        {isSig ? 'Update signature invalid — please reinstall the latest release from GitHub.' : (error.message || 'Update error')}
      </div>
    );
  }
  if (phase === 'downloading' && downloadProgress) {
    return (
      <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
          <span>Downloading update…</span>
          <span>{(downloadProgress.percent || 0).toFixed(0)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, downloadProgress.percent || 0))}%` }}
          />
        </div>
      </div>
    );
  }
  if (phase === 'downloaded' && downloadedUpdate) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
        <CheckCircle2 size={14} /> Update v{downloadedUpdate.version} ready — restart to install.
      </div>
    );
  }
  if (phase === 'available' && availableUpdate) {
    return (
      <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs font-bold text-indigo-700 flex items-center gap-2">
        <Download size={14} /> Update v{availableUpdate.version} is available.
      </div>
    );
  }
  if (phase === 'checking') {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-600 flex items-center gap-2">
        <RefreshCw size={14} className="animate-spin" /> Checking for updates…
      </div>
    );
  }
  if (phase === 'not-available') {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
        <CheckCircle2 size={14} /> You’re up to date.
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-500 flex items-center gap-2">
      <Info size={14} /> v{info?.appVersion || '—'} · ready when you are.
    </div>
  );
}

export default function UpdateSettingsSection({ state, actions }) {
  const { info, channel, autoDownload, lastCheckedAt, phase } = state;
  const [channelSaving, setChannelSaving] = useState(false);

  const handleChannelChange = async (e) => {
    const next = e.target.value;
    setChannelSaving(true);
    try { await actions.setChannel(next); }
    finally { setChannelSaving(false); }
  };

  const handleToggleAuto = async (e) => {
    await actions.setAutoDownload(e.target.checked);
  };

  const handleCheck = async () => {
    await actions.check();
  };

  const checking = phase === 'checking';
  const disabled = checking;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">About &amp; Updates</h2>
        <p className="text-slate-400 text-xs">Application version, build number, and update channel.</p>
      </div>

      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
          <Sparkles size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-800">Expense Tracker</h4>
          <div className="mt-1 text-[11px] font-mono text-slate-500 break-all">
            v{info?.appVersion || '—'}
            {info?.buildNumber ? <span className="text-slate-400"> · build {info.buildNumber}</span> : null}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Last checked: {lastCheckedAt ? relTime(lastCheckedAt) : 'never'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Update channel
          </label>
          <select
            value={channel === 'beta' ? 'beta' : 'latest'}
            onChange={handleChannelChange}
            disabled={channelSaving}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
          >
            <option value="latest">Stable (recommended)</option>
            <option value="beta">Beta — pre-release builds</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-2">
            Switch to Beta to receive pre-release versions tagged <span className="font-mono">v*-beta.*</span>.
          </p>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <div>
            <h4 className="text-sm font-bold text-slate-800 inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-500" /> Download updates automatically
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">When off, you’ll be prompted before each download.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!autoDownload}
            onClick={() => handleToggleAuto({ checked: !autoDownload })}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${autoDownload ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div
              className="w-5 h-5 bg-white rounded-full shadow-md transition-transform"
              style={{ transform: autoDownload ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-100"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking…' : 'Check for updates'}
        </button>
      </div>

      <StatusLine state={state} actions={actions} />
    </div>
  );
}
