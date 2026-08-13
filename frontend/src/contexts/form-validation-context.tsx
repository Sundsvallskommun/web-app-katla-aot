'use client';

import { createContext, useContext } from 'react';

export interface FormValidationContextType {
  showValidation: boolean;
  setShowValidation: (show: boolean) => void;
  /** Flyttar fokus till första fältet som visar ett valideringsfel och rullar fram det. */
  focusFirstError: () => void;
}

export const FormValidationContext = createContext<FormValidationContextType | undefined>(undefined);

export function useFormValidation() {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidation must be used within FormValidationProvider');
  }
  return context;
}
