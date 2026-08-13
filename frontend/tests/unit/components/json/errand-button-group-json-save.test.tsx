import { FormValidationProvider } from '@contexts/form-validation-provider';
import type { ErrandFormDTO } from '@interfaces/errand-form';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createErrandMock, routerPushMock, snackbarMock, updateErrandMock } = vi.hoisted(() => ({
  createErrandMock: vi.fn(),
  routerPushMock: vi.fn(),
  snackbarMock: vi.fn(),
  updateErrandMock: vi.fn(),
}));

vi.mock('@components/cancel-errand-dialog.component', () => ({
  CancelErrandDialog: () => null,
}));

vi.mock('@services/errand-service/errand-service', () => ({
  createErrand: createErrandMock,
  updateErrand: updateErrandMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('src/config/appconfig', () => ({
  appConfig: { features: { draftEnabled: true } },
}));

vi.mock('@sk-web-gui/react', () => {
  const Button = ({ children, onClick }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
  const Dialog = ({ children, show }: { children?: ReactNode; show?: boolean }) =>
    show ? <div>{children}</div> : null;
  function DialogContent({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  }
  function DialogButtons({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  }
  Dialog.Content = DialogContent;
  Dialog.Buttons = DialogButtons;

  return {
    Button,
    Dialog,
    useSnackbar: () => snackbarMock,
  };
});

function TestForm() {
  const methods = useForm<ErrandFormDTO>({
    defaultValues: {
      status: 'DRAFT',
      errandFormData: [
        {
          schemaName: 'avvikelse-plats-handelse',
          schemaId: 'schema-v1',
          data: '{invalid-json',
        },
      ],
    },
  });

  return (
    <FormProvider {...methods}>
      <FormValidationProvider>
        <ErrandButtonGroup isNewErrand />
      </FormValidationProvider>
    </FormProvider>
  );
}

describe('ErrandButtonGroup JSON save contract', () => {
  beforeEach(() => {
    createErrandMock.mockReset();
    routerPushMock.mockReset();
    snackbarMock.mockReset();
    updateErrandMock.mockReset();
  });

  it('handles invalid persisted JSON without calling the save API', async () => {
    render(<TestForm />);

    fireEvent.click(screen.getByRole('button', { name: 'errand-information:save_draft' }));

    await waitFor(() => {
      expect(snackbarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'invalid_form_data',
        })
      );
    });
    expect(createErrandMock).not.toHaveBeenCalled();
    expect(updateErrandMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });
});
