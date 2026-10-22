/**
 * Memory types for Salony AI persistent memory system
 */

export type MemoryCategory = 'personal' | 'preferences' | 'projects' | 'goals' | 'general';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface MemoryFilter {
  category?: MemoryCategory | 'all';
  search?: string;
}
