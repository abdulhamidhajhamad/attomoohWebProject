import { create } from 'zustand';

interface CrudService<T> {
  getAll(search?: string): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: Record<string, unknown>): Promise<T>;
  update(id: string, data: Record<string, unknown>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface CrudStore<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  fetchAll: (search?: string) => Promise<void>;
  fetchById: (id: string) => Promise<T>;
  createItem: (data: Record<string, unknown>) => Promise<T>;
  updateItem: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearError: () => void;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export function createCrudStore<T extends { _id: string }>(
  service: CrudService<T>,
) {
  return create<CrudStore<T>>()((set) => ({
    items: [],
    loading: false,
    error: null,

    fetchAll: async (search?: string) => {
      set({ loading: true, error: null });
      try {
        const items = await service.getAll(search);
        set({ items, loading: false });
      } catch (e) {
        set({ error: getErrorMessage(e), loading: false });
      }
    },

    fetchById: async (id: string) => {
      try {
        return await service.getById(id);
      } catch (e) {
        set({ error: getErrorMessage(e) });
        throw e;
      }
    },

    createItem: async (data) => {
      set({ loading: true, error: null });
      try {
        const item = await service.create(data);
        set((s) => ({ items: [item, ...s.items], loading: false }));
        return item;
      } catch (e) {
        set({ error: getErrorMessage(e), loading: false });
        throw e;
      }
    },

    updateItem: async (id, data) => {
      set({ error: null });
      try {
        const updated = await service.update(id, data);
        set((s) => ({
          items: s.items.map((item) => (item._id === id ? updated : item)),
        }));
      } catch (e) {
        set({ error: getErrorMessage(e) });
        throw e;
      }
    },

    deleteItem: async (id) => {
      set({ error: null });
      try {
        await service.delete(id);
        set((s) => ({
          items: s.items.filter((item) => item._id !== id),
        }));
      } catch (e) {
        set({ error: getErrorMessage(e) });
        throw e;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
