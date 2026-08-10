import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WizardState {
  currentStep: number;
  stepErrors: Record<number, string[]>;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  setStepErrors: (step: number, errors: string[]) => void;
  clearStepErrors: (step: number) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      currentStep: 0,
      stepErrors: {},
      goNext: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      goBack: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
      goToStep: (step) => set({ currentStep: step }),
      setStepErrors: (step, errors) =>
        set((state) => ({ stepErrors: { ...state.stepErrors, [step]: errors } })),
      clearStepErrors: (step) =>
        set((state) => {
          const { [step]: _, ...rest } = state.stepErrors;
          return { stepErrors: rest };
        }),
      reset: () => set({ currentStep: 0, stepErrors: {} }),
    }),
    {
      name: 'wizard-storage',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);
