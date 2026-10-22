import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Youtube, MessageCircle, Globe, CheckCircle2, X } from 'lucide-react';
import { ToolActionResult } from '../services/toolManager';

interface ActionToastProps {
  action: ToolActionResult | null;
  onDismiss: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ action, onDismiss }) => {
  if (!action) return null;

  const getIcon = () => {
    if (action.label?.toLowerCase().includes('youtube') || action.url?.includes('youtube')) {
      return <Youtube className="w-5 h-5 text-red-400" />;
    }
    if (action.label?.toLowerCase().includes('whatsapp') || action.url?.includes('whatsapp')) {
      return <MessageCircle className="w-5 h-5 text-emerald-400" />;
    }
    return <Globe className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm"
      >
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Action Executed
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 mt-0.5">{action.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {action.url && (
              <a
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-90 transition-all flex items-center gap-1 text-xs font-semibold shadow-md active:scale-95"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
