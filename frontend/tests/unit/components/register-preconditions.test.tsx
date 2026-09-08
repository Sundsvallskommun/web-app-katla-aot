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
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'sv' } }),
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

  const cx = (...classNames: unknown[]) => classNames.filter(Boolean).join(' ');

  return { Button, cx, Dialog, useSnackbar: () => snackbarMock };
});

const OWNER: ErrandFormDTO['stakeholders'] = [
  { role: 'PRIMARY', externalId: 'f1e2d3c4-0000-4000-8000-000000000001', organizationName: 'Acme Restaurang AB' },
];

const CLASSIFICATION: ErrandFormDTO['labels'] = [
  { id: 'alkohol', classification: 'CATEGORY' },
  { id: 'folkol', classification: 'TYPE' },
];

const renderButtons = (defaultValues: Partial<ErrandFormDTO> = {}) => {
  const TestForm: React.FC = () => {
    const methods = useForm<ErrandFormDTO>({ defaultValues: { status: 'DRAFT', ...defaultValues } });

    return (
      <FormProvider {...methods}>
        <FormValidationProvider>
          <ErrandButtonGroup isNewErrand />
        </FormValidationProvider>
      </FormProvider>
    );
  };

  return render(<TestForm />);
};

describe('What registration requires before it will submit', () => {
  beforeEach(() => {
    createErrandMock.mockReset();
    routerPushMock.mockReset();
    snackbarMock.mockReset();
    updateErrandMock.mockReset();
  });

  const clickRegister = () => {
    fireEvent.click(screen.getByRole('button', { name: 'errand-information:register' }));
  };

  const expectReported = async (message: string) => {
    await waitFor(() => {
      expect(snackbarMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', message }));
    });
    expect(screen.queryByRole('button', { name: 'errand-information:submit_confirm.submit' })).not.toBeInTheDocument();
  };

  it('refuses to register an errand that has not been categorized', async () => {
    renderButtons({ stakeholders: OWNER });

    clickRegister();

    await expectReported('validation:categorization.category_required');
  });

  it('asks for the type once the category is chosen', async () => {
    renderButtons({ labels: [{ id: 'alkohol', classification: 'CATEGORY' }], stakeholders: OWNER });

    clickRegister();

    await expectReported('validation:categorization.type_required');
  });

  it('refuses to register an errand with no owner', async () => {
    renderButtons({ labels: CLASSIFICATION });

    clickRegister();

    await expectReported('validation:owner.required');
  });

  it('opens the confirmation once the errand is categorized and has an owner', async () => {
    renderButtons({ labels: CLASSIFICATION, stakeholders: OWNER });

    clickRegister();

    expect(await screen.findByRole('button', { name: 'errand-information:submit_confirm.submit' })).toBeInTheDocument();
    expect(snackbarMock).not.toHaveBeenCalled();
  });
});
