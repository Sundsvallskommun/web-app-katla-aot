import { OverviewLayoutSwitcher } from '@components/mobile/overview-layout-switcher.component';
import { useIsOverviewMobile } from '@contexts/overview-mobile-context';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@components/sidebars/overview-sidebar.component', () => ({
  OverviewSidebar: () => <aside data-testid="overview-sidebar" />,
}));

function MobileState() {
  return <span data-testid="mobile-state">{useIsOverviewMobile() ? 'mobile' : 'desktop'}</span>;
}

function setMediaQueryMatch(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      matches,
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('OverviewLayoutSwitcher', () => {
  it('provides desktop state and renders the overview sidebar on wider screens', () => {
    setMediaQueryMatch(false);

    render(
      <OverviewLayoutSwitcher>
        <MobileState />
      </OverviewLayoutSwitcher>
    );

    expect(screen.getByTestId('mobile-state')).toHaveTextContent('desktop');
    expect(screen.getByTestId('overview-sidebar')).toBeInTheDocument();
  });

  it('provides mobile state and omits the overview sidebar on smaller screens', async () => {
    setMediaQueryMatch(true);

    render(
      <OverviewLayoutSwitcher>
        <MobileState />
      </OverviewLayoutSwitcher>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-state')).toHaveTextContent('mobile');
    });
    expect(screen.queryByTestId('overview-sidebar')).not.toBeInTheDocument();
  });
});
