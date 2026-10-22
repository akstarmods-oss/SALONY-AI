import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
  error: string | null;
  onDismiss: () => void;
  onRetry: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onDismiss, onRetry }) => {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="w-full max-w-md mx-auto px-4 my-2"
      >
        <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 backdrop-blur-md shadow-lg flex items-center justify-between gap-3 text-rose-100">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">{error}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onRetry}
              className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-all flex items-center gap-1 text-xs font-semibold"
              title="Retry connection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-rose-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
