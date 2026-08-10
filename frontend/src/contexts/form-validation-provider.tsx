'use client';

import { FormValidationContext } from '@contexts/form-validation-context';
import { ReactNode, useState } from 'react';

// Utbruten till egen fil så att kontextfilen bara exporterar icke-komponenter (react-refresh/only-export-components)
export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [showValidation, setShowValidation] = useState(false);
  return (
    <FormValidationContext.Provider value={{ showValidation, setShowValidation }}>
      {children}
    </FormValidationContext.Provider>
  );
}
