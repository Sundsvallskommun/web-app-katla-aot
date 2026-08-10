'use client';

import { LogoutButton } from '@components/buttons/logout-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { userMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import { Button, cx, Divider, Logo, UserMenu } from '@sk-web-gui/react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { FilterOverviewSidebarStatusSelector } from './filter-overview-sidebar-status-selector.component';

export const OverviewSidebar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(true);

  const user = useUserStore(useShallow((s) => s.user));

  // Bugfix (static-components): JSX-variabel i stället för komponent skapad under rendering
  const sidebarLogo = (
    <NextLink
      href="/"
      className="no-underline"
      aria-label={`Katla - ${process.env.NEXT_PUBLIC_APP_NAME}. Gå till startsidan.`}
    >
      <Logo
        className={cx(open ? '' : 'w-[2.8rem]')}
        variant={open ? 'service' : 'symbol'}
        title={'Katla'}
        subtitle={process.env.NEXT_PUBLIC_APP_NAME}
      />
    </NextLink>
  );
  return (
    <>
      <aside
        data-cy="overview-aside"
        className={cx(
          'sticky transition-all ease-in-out duration-150 flex flex-col bg-vattjom-background-200 min-h-screen',
          open ? 'max-lg:shadow-100 sm:w-[32rem] sm:min-w-[32rem]' : 'w-[5.6rem]'
        )}
      >
        <div className={cx('h-full w-full', open ? 'p-24' : '')}>
          <div className={cx('mb-24', open ? '' : 'flex flex-col items-center justify-center pt-[1rem]')}>
            {sidebarLogo}
          </div>
          <div
            className={cx(
              'h-fit items-center',
              open ? 'pb-24 flex gap-12 justify-between' : 'pb-15 flex flex-col items-center justify-center'
            )}
          >
            {open && (
              <div className="flex gap-12 justify-between items-center">
                <UserMenu
                  data-cy="avatar-aside"
                  initials={user.initials}
                  menuTitle={`${user.name} (${user.username})`}
                  menuGroups={userMenuGroups}
                  buttonSize="md"
                  className="flex-shrink-0"
                  buttonRounded={false}
                />
                <span className="leading-tight h-fit font-bold mb-0" data-cy="userinfo">
                  {user.name}
                </span>
              </div>
            )}
            <NotificationsBell
              toggleShow={() => {
                setShowNotifications(!showNotifications);
              }}
            />
          </div>
          <Divider className={cx(open ? '' : 'w-[4rem] mx-auto')} />
          <div className={cx('flex flex-col gap-8', open ? 'py-24' : 'items-center justify-center py-15')}>
            <FilterOverviewSidebarStatusSelector smallSideBar={!open} />
          </div>
          <Divider className={cx(open ? '' : 'w-[4rem] mx-auto')} />
          <div className="py-10 w-full ">
            <LogoutButton smallSideBar={!open} data-cy="logout-button" />
          </div>
          <div
            className={cx('absolute bottom-[2.4rem]', open ? 'right-[2.4rem]' : 'left-1/2 transform -translate-x-1/2')}
          >
            <Button
              color="primary"
              size={'md'}
              variant="tertiary"
              aria-label={open ? 'Stäng sidomeny' : 'Öppna sidomeny'}
              iconButton
              leftIcon={open ? <ChevronsLeft /> : <ChevronsRight />}
              onClick={() => {
                setOpen(!open);
              }}
            />
          </div>
        </div>
      </aside>
      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} open={open} />
    </>
  );
};
