import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ErrandCountState {
  newErrandCount: number;
  draftErrandCount: number;
  closedErrandCount: number;
  setNewErrandCount: (count: number) => void;
  setDraftErrandCount: (count: number) => void;
  setClosedErrandCount: (count: number) => void;
}

export const useErrandCountStore = create<ErrandCountState>()(
  persist(
    (set) => ({
      newErrandCount: 0,
      draftErrandCount: 0,
      closedErrandCount: 0,
      setNewErrandCount: (count) => set({ newErrandCount: count }),
      setDraftErrandCount: (count) => set({ draftErrandCount: count }),
      setClosedErrandCount: (count) => set({ closedErrandCount: count }),
    }),
    {
      name: 'errand-count-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
