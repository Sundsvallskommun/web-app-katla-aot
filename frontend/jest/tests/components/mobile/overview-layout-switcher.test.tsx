import { OverviewLayoutSwitcher } from '@components/mobile/overview-layout-switcher.component';
import { useIsOverviewMobile } from '@contexts/overview-mobile-context';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('@components/sidebars/overview-sidebar.component', () => ({
  OverviewSidebar: () => <aside data-testid="overview-sidebar" />,
}));

function MobileState() {
  return <span data-testid="mobile-state">{useIsOverviewMobile() ? 'mobile' : 'desktop'}</span>;
}

function setMediaQueryMatch(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((media: string) => ({
      matches,
      media,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('OverviewLayoutSwitcher', () => {
  let container: HTMLDivElement;
  let root: Root;
  const testEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

  beforeAll(() => {
    testEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    delete testEnvironment.IS_REACT_ACT_ENVIRONMENT;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(children: ReactNode) {
    act(() => root.render(children));
  }

  it('provides desktop state and renders the overview sidebar on wider screens', () => {
    setMediaQueryMatch(false);

    render(
      <OverviewLayoutSwitcher>
        <MobileState />
      </OverviewLayoutSwitcher>
    );

    expect(container.querySelector('[data-testid="mobile-state"]')).toHaveTextContent('desktop');
    expect(container.querySelector('[data-testid="overview-sidebar"]')).toBeInTheDocument();
  });

  it('provides mobile state and omits the overview sidebar on smaller screens', () => {
    setMediaQueryMatch(true);

    render(
      <OverviewLayoutSwitcher>
        <MobileState />
      </OverviewLayoutSwitcher>
    );

    expect(container.querySelector('[data-testid="mobile-state"]')).toHaveTextContent('mobile');
    expect(container.querySelector('[data-testid="overview-sidebar"]')).not.toBeInTheDocument();
  });
});
