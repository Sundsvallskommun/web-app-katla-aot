import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  activeStatus: string | null;
  statuses: string[];
  setActiveStatus: (status: string) => void;
  setStatuses: (statuses: string[]) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      activeStatus: null,
      statuses: [],
      setActiveStatus: (status) => set({ activeStatus: status }),
      setStatuses: (statuses) => set({ statuses }),
    }),
    {
      name: 'filter-storage',
    }
  )
);
