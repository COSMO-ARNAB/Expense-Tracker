import React, { useState } from 'react';
import { CheckCircle2, Power } from 'lucide-react';
import Modal from './Modal';
import { relTime } from '@/lib/updater';

export default function UpdateDownloadedModal({ open, currentVersion, downloadedUpdate, onLater, onInstall }) {
  const [busy, setBusy] = useState(false);
  if (!downloadedUpdate) return null;

  const handleInstall = async () => {
    if (busy) return;
    setBusy(true);
    try { await onInstall && onInstall(); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onLater} title="Update ready to install" size="md">
      <div className="p-7">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900">Update ready to install</h2>
            <p className="text-xs text-slate-500 mt-1">
              v{downloadedUpdate.version} has been downloaded{downloadedUpdate.releaseDate ? ` (released ${relTime(downloadedUpdate.releaseDate)})` : ''}.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Restart the app to apply <span className="font-bold text-slate-900">v{downloadedUpdate.version}</span>.
            You'll be returned to your dashboard, and your local data (including your SQLite database) will remain intact.
          </p>
          {currentVersion && (
            <p className="text-[11px] text-slate-400 mt-2">
              You are currently on v{currentVersion}.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onLater}
            className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Power size={14} />
            {busy ? 'Restarting…' : 'Restart & install'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
