import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FormProvider, useForm } from 'react-hook-form';

jest.mock('src/config/appconfig', () => ({ appConfig: { features: { disclosureDoneMark: false } } }), {
  virtual: true,
});

const globalWithActEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const ErrandForm: React.FC<{ children: React.ReactNode; status: string }> = ({ children, status }) => {
  const methods = useForm<ErrandDTO>({ defaultValues: { status } });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ErrandContentLock', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (component: React.ReactNode) => {
    act(() => root.render(component));
  };

  it('keeps draft controls enabled', () => {
    render(
      <ErrandForm status="DRAFT">
        <ErrandContentLock>
          <input aria-label="Ärenderubrik" />
        </ErrandContentLock>
      </ErrandForm>
    );

    expect(container.querySelector('fieldset')).not.toBeDisabled();
    expect(container.querySelector('input')).not.toBeDisabled();
  });

  it('disables controls when the errand has been sent', () => {
    render(
      <ErrandForm status="NEW">
        <ErrandContentLock>
          <input aria-label="Ärenderubrik" />
        </ErrandContentLock>
      </ErrandForm>
    );

    expect(container.querySelector('fieldset')).toBeDisabled();
    expect(container.querySelector('input')).toBeDisabled();
  });

  it('keeps the disclosure toggle interactive for a sent errand', () => {
    render(
      <ErrandForm status="NEW">
        <ErrandDisclosure header="Om ärendet" icon={<span aria-hidden="true" />} initialOpen={false}>
          <input aria-label="Ärenderubrik" />
        </ErrandDisclosure>
      </ErrandForm>
    );

    const toggle = container.querySelector('button');
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    act(() => toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('input')).toBeDisabled();
  });
});
