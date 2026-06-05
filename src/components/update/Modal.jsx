import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  className = '',
  initialFocus = 'first-button'
}) {
  const ref = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose && onClose();
        return;
      }
      if (e.key === 'Tab' && ref.current) {
        const focusable = ref.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    const timer = setTimeout(() => {
      if (!ref.current) return;
      let target = null;
      if (initialFocus === 'first-button') target = ref.current.querySelector('button');
      else if (typeof initialFocus === 'string') target = ref.current.querySelector(initialFocus);
      if (target) target.focus();
    }, 30);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
      document.body.style.overflow = '';
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        try { previouslyFocused.current.focus(); } catch (_) {}
      }
    };
  }, [open, onClose, initialFocus]);

  const sizeClass = size === 'lg' ? 'max-w-xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Dialog'}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={cn(
              'relative w-full bg-white rounded-3xl border border-slate-100 shadow-2xl z-[10001] overflow-hidden',
              sizeClass,
              className
            )}
          >
            {showClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
