import { MemoryItem, MemoryCategory } from '../types/memory';

const LOCAL_STORAGE_KEY = 'salony_memories_cache';

class MemoryService {
  /**
   * Load memories from server with fallback to localStorage
   */
  async getMemories(search?: string, category?: string): Promise<MemoryItem[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);

      const res = await fetch(`/api/memories?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.memories)) {
          // Cache to localStorage
          if (!search && (!category || category === 'all')) {
            this.saveToCache(data.memories);
          }
          return data.memories;
        }
      }
    } catch (err) {
      console.warn('Network request for memories failed, using local cache:', err);
    }

    // Fallback to local cache
    return this.searchCache(search, category);
  }

  async saveMemory(data: {
    key: string;
    content: string;
    category?: MemoryCategory;
    tags?: string[];
  }): Promise<MemoryItem> {
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.memory) {
          this.updateLocalCacheItem(resData.memory);
          return resData.memory;
        }
      }
    } catch (err) {
      console.error('Error saving memory to server:', err);
    }

    // Local fallback
    const localItem: MemoryItem = {
      id: crypto.randomUUID(),
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
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.memory) {
          this.updateLocalCacheItem(resData.memory);
          return resData.memory;
        }
      }
    } catch (err) {
      console.error('Error updating memory on server:', err);
    }

    const cached = this.getFromCache();
    const target = cached.find((m) => m.id === id);
    if (target) {
      if (updates.key !== undefined) target.key = updates.key;
      if (updates.content !== undefined) target.content = updates.content;
      if (updates.category !== undefined) target.category = updates.category;
      target.updatedAt = Date.now();
      this.saveToCache(cached);
      return target;
    }
    return null;
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.removeFromCache(id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting memory on server:', err);
    }

    this.removeFromCache(id);
    return true;
  }

  async clearAllMemories(): Promise<boolean> {
    try {
      const res = await fetch('/api/memories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });
      if (res.ok) {
        this.saveToCache([]);
        return true;
      }
    } catch (err) {
      console.error('Error clearing memories on server:', err);
    }

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
