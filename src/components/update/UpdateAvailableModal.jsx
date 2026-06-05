import React, { useMemo, useState } from 'react';
import { Download, Sparkles, Tag, Calendar, HardDrive } from 'lucide-react';
import Modal from './Modal';
import { formatBytes, relTime } from '@/lib/updater';

function renderNotes(notes) {
  if (!notes) return <p className="text-xs text-slate-400 italic">No release notes provided.</p>;
  let text = '';
  if (typeof notes === 'string') text = notes;
  else if (Array.isArray(notes)) text = notes.map((n) => (typeof n === 'string' ? n : n?.note || '')).join('\n\n');
  else if (typeof notes === 'object' && notes.note) text = String(notes.note);
  if (!text.trim()) return <p className="text-xs text-slate-400 italic">No release notes provided.</p>;

  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  return text.split(/\n{2,}/).map((para, i) => (
    <p key={i} className="text-xs text-slate-600 leading-relaxed mb-2">
      {para.split(/\n/).map((line, j) => (
        <React.Fragment key={j}>
          {j > 0 && <br />}
          {line.split(urlRegex).map((part, k) =>
            /^https?:\/\//.test(part) ? (
              <a key={`${j}-${k}`} href={part} target="_blank" rel="noreferrer noopener" className="text-indigo-600 underline underline-offset-2 break-all">
                {part}
              </a>
            ) : (
              <React.Fragment key={`${j}-${k}-t`}>{part}</React.Fragment>
            )
          )}
        </React.Fragment>
      ))}
    </p>
  ));
}

export default function UpdateAvailableModal({ open, currentVersion, availableUpdate, onLater, onUpdate, downloading }) {
  const [busy, setBusy] = useState(false);

  const totalSize = useMemo(() => {
    if (!availableUpdate) return null;
    if (availableUpdate.size) return Number(availableUpdate.size);
    if (Array.isArray(availableUpdate.files) && availableUpdate.files.length) {
      return availableUpdate.files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);
    }
    return null;
  }, [availableUpdate]);

  const handleUpdate = async () => {
    if (busy || downloading) return;
    setBusy(true);
    try { await onUpdate && onUpdate(); }
    finally { setBusy(false); }
  };

  if (!availableUpdate) return null;

  return (
    <Modal open={open} onClose={onLater} title="Update available" size="lg">
      <div className="p-7">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900">Update available</h2>
            <p className="text-xs text-slate-500 mt-1">
              A new version of Expense Tracker is ready to download.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag size={11} /> Version
            </div>
            <div className="text-sm font-extrabold text-slate-800 mt-1 break-all">
              v{currentVersion || '—'} <span className="text-slate-300 mx-1">→</span> v{availableUpdate.version}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HardDrive size={11} /> Size
            </div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">
              {totalSize ? formatBytes(totalSize) : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar size={11} /> Released
            </div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">
              {availableUpdate.releaseDate ? relTime(availableUpdate.releaseDate) : 'recently'}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Release notes</div>
          <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4">
            {renderNotes(availableUpdate.releaseNotes)}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onLater}
            className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
          >
            Remind me later
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={busy || downloading}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Download size={14} />
            {downloading ? 'Downloading…' : busy ? 'Starting…' : 'Update now'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
