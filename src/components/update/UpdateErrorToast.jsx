import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, RefreshCw, ShieldAlert } from 'lucide-react';

const AUTO_DISMISS_MS = 8000;

export default function UpdateErrorToast({ error, onRetry, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (!error) return;
    if (error.code === 'network' || error.code === 'unknown') {
      const t = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [error]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onDismiss && onDismiss(), 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, onDismiss]);

  if (!error) return null;

  const isSignature = error.code === 'signature';
  const title = isSignature
    ? 'Update signature invalid'
    : error.code === 'network'
    ? 'Couldn’t reach the update server'
    : 'Update failed';

  const body = isSignature
    ? 'The downloaded update could not be verified. Please reinstall the latest version from our website — do not retry.'
    : error.code === 'network'
    ? 'We couldn’t check for updates. Check your internet connection and try again.'
    : (error.message || 'Something went wrong while updating.');

  const Icon = isSignature ? ShieldAlert : AlertTriangle;
  const accent = isSignature
    ? 'border-rose-200 bg-rose-50/70 text-rose-700'
    : error.code === 'network'
    ? 'border-amber-200 bg-amber-50/70 text-amber-700'
    : 'border-slate-200 bg-white text-slate-700';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="upd-error"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className={`fixed bottom-6 left-6 z-[9997] w-[340px] max-w-[calc(100vw-2rem)] border ${accent} shadow-2xl rounded-2xl p-4`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/60">
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold">{title}</div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setVisible(false)}
                  className="text-current opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed opacity-90">{body}</p>
              {error.code === 'network' && (
                <button
                  type="button"
                  onClick={() => { onRetry && onRetry(); setVisible(false); }}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:underline"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
