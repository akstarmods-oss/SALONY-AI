import { MemoryItem, MemoryCategory } from '../types/memory';

const LOCAL_STORAGE_KEY = 'salony_memories_cache';

class MemoryService {
  /**
   * Pure client-side storage using localStorage
   */
  async getMemories(search?: string, category?: string): Promise<MemoryItem[]> {
    return this.searchCache(search, category);
  }

  async saveMemory(data: {
    key: string;
    content: string;
    category?: MemoryCategory;
    tags?: string[];
  }): Promise<MemoryItem> {
    const localItem: MemoryItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      key: data.key,
      content: data.content,
      category: data.category || 'general',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: data.tags || [],
    };
    this.updateLocalCacheItem(localItem);
    return localItem;
  }

  async updateMemory(
    id: string,
    updates: { key?: string; content?: string; category?: MemoryCategory; tags?: string[] }
  ): Promise<MemoryItem | null> {
    const cached = this.getFromCache();
    const target = cached.find((m) => m.id === id);
    if (target) {
      if (updates.key !== undefined) target.key = updates.key;
      if (updates.content !== undefined) target.content = updates.content;
      if (updates.category !== undefined) target.category = updates.category;
      if (updates.tags !== undefined) target.tags = updates.tags;
      target.updatedAt = Date.now();
      this.saveToCache(cached);
      return target;
    }
    return null;
  }

  async deleteMemory(id: string): Promise<boolean> {
    this.removeFromCache(id);
    return true;
  }

  async clearAllMemories(): Promise<boolean> {
    this.saveToCache([]);
    return true;
  }

  private getFromCache(): MemoryItem[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  private saveToCache(list: MemoryItem[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // storage quota or disabled
    }
  }

  private updateLocalCacheItem(item: MemoryItem) {
    const list = this.getFromCache();
    const idx = list.findIndex((m) => m.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    this.saveToCache(list);
  }

  private removeFromCache(id: string) {
    const list = this.getFromCache().filter((m) => m.id !== id);
    this.saveToCache(list);
  }

  private searchCache(query?: string, category?: string): MemoryItem[] {
    let list = this.getFromCache();
    if (category && category !== 'all') {
      list = list.filter((m) => m.category.toLowerCase() === category.toLowerCase());
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.key.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export const memoryService = new MemoryService();