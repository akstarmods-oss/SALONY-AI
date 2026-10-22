import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  Check,
  FolderHeart,
  Sparkles,
} from 'lucide-react';
import { MemoryItem, MemoryCategory } from '../types/memory';
import { memoryService } from '../services/memoryService';

interface MemoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoriesUpdated?: () => void;
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({
  isOpen,
  onClose,
  onMemoriesUpdated,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('general');
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories: { id: string; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: 'from-purple-500 to-cyan-500' },
    { id: 'personal', label: 'Personal', color: 'from-pink-500 to-rose-500' },
    { id: 'preferences', label: 'Preferences', color: 'from-cyan-500 to-blue-500' },
    { id: 'projects', label: 'Projects', color: 'from-emerald-500 to-teal-500' },
    { id: 'goals', label: 'Goals', color: 'from-amber-500 to-orange-500' },
    { id: 'general', label: 'General', color: 'from-indigo-500 to-purple-500' },
  ];

  const loadMemories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await memoryService.getMemories(searchQuery, selectedCategory);
      setMemories(data);
    } catch (err: any) {
      setErrorMessage('Failed to load memories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMemories();
  };

  const handleSaveNew = async () => {
    if (!newKey.trim() || !newContent.trim()) return;
    try {
      await memoryService.saveMemory({
        key: newKey.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      setNewKey('');
      setNewContent('');
      setIsAddingNew(false);
      await loadMemories();
      onMemoriesUpdated?.();
    } catch (err: any) {
      setErrorMessage('Failed to save memory.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMemory || !editingMemory.key.trim() || !editingMemory.content.trim()) return;
    try {
      await memoryService.updateMemory(editingMemory.id, {
        key: editingMemory.key.trim(),
        content: editingMemory.content.trim(),
        category: editingMemory.category,
      });
      setEditingMemory(null);
      await loadMemories();
      onMemoriesUpdated?.();
    } catch (err: any) {
      setErrorMessage('Failed to update memory.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await memoryService.deleteMemory(id);
      setDeleteTargetId(null);
      await loadMemories();
      onMemoriesUpdated?.();
    } catch (err: any) {
      setErrorMessage('Failed to delete memory.');
    }
  };

  const handleClearAll = async () => {
    try {
      await memoryService.clearAllMemories();
      setConfirmClearAll(false);
      await loadMemories();
      onMemoriesUpdated?.();
    } catch (err: any) {
      setErrorMessage('Failed to clear memories.');
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'personal':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      case 'preferences':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'projects':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'goals':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'general':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="w-full max-w-2xl bg-[#08051a] border border-purple-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <div className="w-full h-full bg-[#0a071f] rounded-2xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg sm:text-xl font-['Space_Grotesk'] tracking-wide">
                    Salony's Memory
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
                    {memories.length} saved
                  </span>
                </div>
                <p className="text-xs text-purple-300/60 font-medium">
                  Persistent facts & details remembered across all sessions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Action Bar */}
          <div className="py-3.5 space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search memories (e.g. colour, project, name)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-purple-950/30 border border-purple-800/40 focus:border-cyan-400 text-xs text-slate-100 placeholder-purple-400/50 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setTimeout(loadMemories, 10);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              <button
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-95 text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="Add Memory Manually"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>

              <button
                onClick={loadMemories}
                className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:text-white transition-all active:scale-95"
                title="Refresh memories"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {memories.length > 0 && (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="p-2 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 hover:bg-rose-900/50 hover:text-white transition-all active:scale-95"
                  title="Clear All Memories"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full border transition-all shrink-0 font-medium ${
                      isActive
                        ? 'bg-purple-900/60 border-cyan-400/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-purple-950/20 border-purple-900/40 text-purple-300/70 hover:bg-purple-900/30 hover:text-purple-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error notice if present */}
          {errorMessage && (
            <div className="p-2.5 mb-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shrink-0">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)}>
                <X className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          )}

          {/* Add New Memory Form Card */}
          {isAddingNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 mb-3 rounded-2xl bg-purple-950/40 border border-cyan-400/40 shrink-0 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Add New Memory
                </span>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Key/Topic (e.g. Favourite Food, Project Name)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-purple-800/40 text-xs text-white focus:border-cyan-400 outline-none"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-purple-800/40 text-xs text-purple-200 focus:border-cyan-400 outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="preferences">Preferences</option>
                  <option value="projects">Projects</option>
                  <option value="goals">Goals</option>
                  <option value="general">General</option>
                </select>
              </div>

              <textarea
                rows={2}
                placeholder="Content details (e.g. User loves spicy butter chicken with naan)"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-purple-800/40 text-xs text-white focus:border-cyan-400 outline-none resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/40 text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNew}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-xs font-semibold text-white shadow-md"
                >
                  Save Memory
                </button>
              </div>
            </motion.div>
          )}

          {/* Memory List Container */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-purple-400/60 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs">Loading saved memories...</span>
              </div>
            ) : memories.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl border border-dashed border-purple-900/40 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-950/60 flex items-center justify-center text-purple-400">
                  <FolderHeart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-purple-200">No memories found</p>
                <p className="text-xs text-purple-400/60 max-w-xs leading-relaxed">
                  Teach Salony something by voice: say{' '}
                  <span className="text-cyan-300 font-medium">"Salony, remember that my favourite colour is blue"</span> or click "Add" above.
                </p>
              </div>
            ) : (
              memories.map((mem) => {
                const isEditingThis = editingMemory?.id === mem.id;

                if (isEditingThis) {
                  return (
                    <div
                      key={mem.id}
                      className="p-3.5 rounded-2xl bg-purple-950/50 border border-cyan-400/60 space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editingMemory.key}
                          onChange={(e) =>
                            setEditingMemory({ ...editingMemory, key: e.target.value })
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-800 text-xs text-white outline-none"
                        />
                        <select
                          value={editingMemory.category}
                          onChange={(e) =>
                            setEditingMemory({
                              ...editingMemory,
                              category: e.target.value as MemoryCategory,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-800 text-xs text-purple-200 outline-none"
                        >
                          <option value="personal">Personal</option>
                          <option value="preferences">Preferences</option>
                          <option value="projects">Projects</option>
                          <option value="goals">Goals</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={editingMemory.content}
                        onChange={(e) =>
                          setEditingMemory({ ...editingMemory, content: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-purple-800 text-xs text-white outline-none resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMemory(null)}
                          className="px-3 py-1 rounded-lg text-xs text-purple-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3.5 py-1 rounded-lg bg-cyan-500 text-black font-semibold text-xs flex items-center gap-1 shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Update
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={mem.id}
                    className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-900/30 hover:border-purple-700/40 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                            mem.category
                          )}`}
                        >
                          {mem.category}
                        </span>
                        <h4 className="text-sm font-bold text-white font-['Space_Grotesk']">
                          {mem.key}
                        </h4>
                      </div>
                      <p className="text-xs text-purple-200/90 leading-relaxed font-normal">
                        {mem.content}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-purple-400/50 pt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Updated {formatTimestamp(mem.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        onClick={() => setEditingMemory(mem)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-cyan-300 hover:bg-purple-900/40 transition-all"
                        title="Edit Memory"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(mem.id)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Delete Single Memory Confirmation Dialog */}
          {deleteTargetId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm p-5 rounded-2xl bg-[#0e0a24] border border-rose-500/40 text-center space-y-3 shadow-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Delete this memory?</h4>
                <p className="text-xs text-purple-300/70">
                  Salony will no longer remember this detail. This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={() => setDeleteTargetId(null)}
                    className="px-4 py-2 rounded-xl bg-purple-950/40 text-xs text-purple-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTargetId)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-lg"
                  >
                    Delete Memory
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Clear All Confirmation Dialog */}
          {confirmClearAll && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm p-5 rounded-2xl bg-[#0e0a24] border border-rose-500/50 text-center space-y-3 shadow-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Clear All Memories?</h4>
                <p className="text-xs text-purple-300/70 leading-relaxed">
                  Are you sure you want to permanently erase all {memories.length} memories? Salony will forget all saved user details.
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-4 py-2 rounded-xl bg-purple-950/40 text-xs text-purple-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-lg"
                  >
                    Yes, Clear Everything
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs text-purple-300/60 shrink-0">
            <span>Voice prompt: "What do you remember about me?"</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 text-white font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
