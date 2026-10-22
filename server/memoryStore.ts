import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { MemoryItem, MemoryCategory } from '../src/types/memory';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');

class MemoryStore {
  private memories: Map<string, MemoryItem> = new Map();
  private isLoaded = false;

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(MEMORIES_FILE)) {
        const raw = fs.readFileSync(MEMORIES_FILE, 'utf-8');
        const list: MemoryItem[] = JSON.parse(raw);
        this.memories.clear();
        for (const item of list) {
          if (item && item.id) {
            this.memories.set(item.id, item);
          }
        }
      } else {
        // Initial setup: save an empty list
        this.saveToDisk();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error reading memories from disk:', err);
      this.memories.clear();
    }
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      const list = Array.from(this.memories.values()).sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing memories to disk:', err);
    }
  }

  async getAll(): Promise<MemoryItem[]> {
    if (!this.isLoaded) this.loadFromDisk();
    return Array.from(this.memories.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async search(query?: string, category?: string): Promise<MemoryItem[]> {
    const all = await this.getAll();
    let filtered = all;

    if (category && category !== 'all') {
      filtered = filtered.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          m.key.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  async getById(id: string): Promise<MemoryItem | null> {
    if (!this.isLoaded) this.loadFromDisk();
    return this.memories.get(id) || null;
  }

  async findSimilar(key: string): Promise<MemoryItem | null> {
    const normalized = key.toLowerCase().trim();
    for (const item of this.memories.values()) {
      if (
        item.key.toLowerCase().trim() === normalized ||
        normalized.includes(item.key.toLowerCase().trim()) ||
        item.key.toLowerCase().trim().includes(normalized)
      ) {
        return item;
      }
    }
    return null;
  }

  async save(
    data: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<MemoryItem> {
    if (!this.isLoaded) this.loadFromDisk();

    // Check if an existing memory with same or very similar key exists in this category
    const existing = await this.findSimilar(data.key);
    const now = Date.now();

    if (existing && !data.id) {
      // Update existing memory
      existing.content = data.content;
      existing.category = (data.category as MemoryCategory) || existing.category;
      existing.key = data.key || existing.key;
      existing.updatedAt = now;
      if (data.tags) existing.tags = data.tags;
      this.saveToDisk();
      return existing;
    }

    const id = data.id || crypto.randomUUID();
    const item: MemoryItem = {
      id,
      category: (data.category as MemoryCategory) || 'general',
      key: data.key.trim(),
      content: data.content.trim(),
      createdAt: now,
      updatedAt: now,
      tags: data.tags || [],
    };

    this.memories.set(id, item);
    this.saveToDisk();
    return item;
  }

  async update(
    id: string,
    updates: Partial<Omit<MemoryItem, 'id' | 'createdAt'>>
  ): Promise<MemoryItem | null> {
    if (!this.isLoaded) this.loadFromDisk();
    const item = this.memories.get(id);
    if (!item) return null;

    if (updates.key !== undefined) item.key = updates.key.trim();
    if (updates.content !== undefined) item.content = updates.content.trim();
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.tags !== undefined) item.tags = updates.tags;
    item.updatedAt = Date.now();

    this.saveToDisk();
    return item;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.isLoaded) this.loadFromDisk();
    const existed = this.memories.delete(id);
    if (existed) {
      this.saveToDisk();
    }
    return existed;
  }

  async deleteByKeyOrQuery(query: string): Promise<{ success: boolean; deletedItem?: MemoryItem }> {
    const item = await this.findSimilar(query);
    if (item) {
      this.memories.delete(item.id);
      this.saveToDisk();
      return { success: true, deletedItem: item };
    }
    return { success: false };
  }

  async deleteAll(): Promise<number> {
    if (!this.isLoaded) this.loadFromDisk();
    const count = this.memories.size;
    this.memories.clear();
    this.saveToDisk();
    return count;
  }

  formatForPrompt(): string {
    const list = Array.from(this.memories.values());
    if (list.length === 0) {
      return 'No memories saved yet. If the user asks you to remember something, use saveMemory.';
    }

    return list
      .map(
        (m) =>
          `- [${m.category.toUpperCase()}] ${m.key}: "${m.content}" (ID: ${m.id})`
      )
      .join('\n');
  }
}

export const memoryStore = new MemoryStore();
