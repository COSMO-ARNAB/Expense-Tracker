import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { formatBytes, formatSpeed } from '@/lib/updater';

export default function UpdateDownloadProgress({ phase, progress, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (phase === 'downloading') setDismissed(false);
  }, [phase]);

  if (phase !== 'downloading' || dismissed || !progress) return null;

  const pct = Math.max(0, Math.min(100, Number(progress.percent) || 0));
  const speed = formatSpeed(progress.bytesPerSecond);
  const transferred = formatBytes(progress.transferred);
  const total = progress.total ? formatBytes(progress.total) : null;

  return (
    <AnimatePresence>
      <motion.div
        key="upd-progress"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed bottom-6 right-6 z-[9998] w-[320px] max-w-[calc(100vw-2rem)] bg-white border border-slate-100 shadow-2xl rounded-2xl p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
              className="inline-flex"
            >
              <Download size={16} />
            </motion.span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-slate-800">Downloading update…</div>
              <button
                type="button"
                aria-label="Hide download progress"
                onClick={() => { setDismissed(true); onDismiss && onDismiss(); }}
                className="text-slate-300 hover:text-slate-600 transition-colors -mt-0.5"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-indigo-600"
                animate={{ width: `${pct}%` }}
                transition={{ ease: 'easeOut', duration: 0.25 }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>{pct.toFixed(0)}%</span>
              <span>
                {transferred}{total ? ` / ${total}` : ''}
                {speed ? <span className="text-slate-400"> · {speed}</span> : null}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
