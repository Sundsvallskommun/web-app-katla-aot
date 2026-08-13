import { ColorSchemeItems } from '@components/misc/color-scheme-items.component';
import { MobileErrandCard } from '@components/mobile/mobile-errand-card.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { ColorSchemeMode, PopupMenu, Tabs } from '@sk-web-gui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import NextLink from 'next/link';
import { I18nextProvider } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import commonSv from '../../../locales/sv/common.json';
import layoutSv from '../../../locales/sv/layout.json';

const routerPushMock = vi.hoisted(() => vi.fn());
const colorSchemeStoreMock = vi.hoisted(() => ({
  colorScheme: 'system',
  setColorScheme: vi.fn(),
}));
const i18n = createInstance();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock('@utils/use-localstorage.hook', () => ({
  useLocalStorage: () => colorSchemeStoreMock,
}));

const renderLocalized = (component: React.ReactNode) =>
  render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);

describe('control semantics', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: 'sv',
      resources: {
        sv: {
          common: commonSv,
          layout: layoutSv,
        },
      },
      defaultNS: 'layout',
      ns: ['layout', 'common'],
    });
  });

  afterEach(() => {
    routerPushMock.mockReset();
    colorSchemeStoreMock.colorScheme = 'system';
    colorSchemeStoreMock.setColorScheme.mockReset();
    useNotificationStore.setState({ activeNotifications: [], acknowledgedNotifications: [] });
  });

  it('keeps the application menu actions keyboard-addressable', async () => {
    renderLocalized(
      <AppUserMenu initials="AE" menuTitle="Ada Exempel" menuGroups={createUserMenuGroups(i18n.t)} buttonSize="md" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Öppna användarmeny' }));
    const logout = await screen.findByRole('menuitem', { name: 'Logga ut' });

    expect(logout).toHaveAttribute('id');
    expect(logout).toHaveAttribute('tabindex');
    fireEvent.click(logout);
    expect(routerPushMock).toHaveBeenCalledWith('/logout');
  });

  it('gives the user menu trigger a functional accessible name', () => {
    renderLocalized(
      <AppUserMenu
        data-testid="user-menu"
        initials="AE"
        menuTitle="Ada Exempel"
        menuGroups={[
          {
            label: 'Kontroller',
            elements: [{ label: 'Inställningar', element: () => <button type="button">Inställningar</button> }],
          },
        ]}
        buttonSize="md"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Öppna användarmeny' }));

    expect(screen.getByRole('menuitem', { name: 'Inställningar' })).toBeVisible();
    expect(screen.getByTestId('user-menu')).toHaveClass('sk-usermenu');
  });

  it('exposes notification count and expanded state without a false menu-item role', () => {
    const toggleShow = vi.fn();
    useNotificationStore.setState({ activeNotifications: [{ id: 'notification-1' }] });

    renderLocalized(<NotificationsBell expanded toggleShow={toggleShow} />);

    const button = screen.getByRole('button', { name: 'Öppna notifieringar (1 oläst)' });
    expect(button).toHaveAttribute('aria-controls', 'notifications-panel');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(toggleShow).toHaveBeenCalledOnce();
  });

  it('renders mobile errand navigation as one named link', () => {
    renderLocalized(
      <MobileErrandCard
        errand={{
          errandNumber: 'AIA-25120019',
          status: 'NEW',
          created: '2026-08-12T08:00:00Z',
        }}
      />
    );

    const link = screen.getByRole('link', { name: 'Öppna ärende AIA-25120019' });
    expect(link).toHaveAttribute('href', '/arende/AIA-25120019/grundinformation');
    expect(link.querySelector('button')).not.toBeInTheDocument();
  });

  it('keeps the design-system tab identity while rendering a single link', () => {
    const linkProps = { as: NextLink, href: '/arende/ett/grundinformation' };

    render(
      <Tabs>
        <Tabs.Item>
          <Tabs.Button {...linkProps}>Grundinformation</Tabs.Button>
          <Tabs.Content>Innehåll</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    );

    const tab = screen.getByRole('tab', { name: 'Grundinformation' });
    expect(tab.tagName).toBe('A');
    expect(tab).toHaveAttribute('href', '/arende/ett/grundinformation');
    expect(tab.querySelector('button')).not.toBeInTheDocument();
  });

  it('exposes color modes as one radio set without closing after a selection', () => {
    renderLocalized(
      <PopupMenu open>
        <PopupMenu.Button>Färgläge</PopupMenu.Button>
        <PopupMenu.Panel>
          <ColorSchemeItems />
        </PopupMenu.Panel>
      </PopupMenu>
    );

    const light = screen.getByRole('menuitemradio', { name: 'Ljust' });
    const dark = screen.getByRole('menuitemradio', { name: 'Mörkt' });
    const system = screen.getByRole('menuitemradio', { name: 'System' });

    expect([light, dark, system].map((radio) => radio.getAttribute('name'))).toEqual([
      'user-menu-color-scheme',
      'user-menu-color-scheme',
      'user-menu-color-scheme',
    ]);
    expect(system).toBeChecked();

    fireEvent.click(light);

    expect(colorSchemeStoreMock.setColorScheme).toHaveBeenCalledWith(ColorSchemeMode.Light);
    expect(screen.getByRole('menuitemradio', { name: 'Mörkt' })).toBeVisible();
  });
});
