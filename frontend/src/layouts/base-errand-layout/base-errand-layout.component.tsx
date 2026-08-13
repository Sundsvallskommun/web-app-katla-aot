import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { PageHeader } from '@layouts/page-header.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import { Divider, Link, Logo, PopupMenu } from '@sk-web-gui/react';
import { Menu } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface BaseErrandLayoutProps {
  children: React.ReactNode;
  registerNewErrand: boolean;
}

export default function BaseErrandLayout({ children, registerNewErrand }: BaseErrandLayoutProps) {
  const user = useUserStore((s) => s.user);
  const { watch } = useFormContext<ErrandDTO>();
  const { t } = useTranslation();
  const userMenuGroups = createUserMenuGroups(t);

  const errandNumber = watch('errandNumber');
  const status = watch('status');

  // Bugfix (static-components): JSX-variabel i stället för komponent skapad under rendering
  const singleErrandTitle = (
    <div className="flex items-center gap-12 md:gap-24 py-8 md:py-10">
      {registerNewErrand ?
        <Logo variant="symbol" className="h-32 md:h-40" />
      : <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH}/oversikt`}
          title={`Katla - ${process.env.NEXT_PUBLIC_APP_NAME}. Gå till startsidan.`}
        >
          <Logo variant="symbol" className="h-32 md:h-40" />
        </a>
      }
      <span className="text-large">
        {registerNewErrand ?
          <strong className="text-large ml-8 font-bold">{t('filtering:new_errand')}</strong>
        : <>
            <StatusLabel status={status} />
            <span className="ml-8 text-small">{errandNumber}</span>
          </>
        }
      </span>
    </div>
  );

  return (
    <>
      <div className="bg-background-100 h-screen min-h-screen max-h-screen overflow-hidden w-full flex flex-col">
        <div className="relative z-[15] bg-background-content">
          <PageHeader
            logo={singleErrandTitle}
            userMenu={
              <div className="flex items-center h-fit">
                <div data-cy="usermenu">
                  <AppUserMenu
                    initials={user.initials}
                    menuTitle={`${user.name} (${user.username})`}
                    menuSubTitle=""
                    menuGroups={userMenuGroups}
                    buttonRounded={false}
                    buttonSize="sm"
                  />
                </div>

                <Divider orientation="vertical" className="mx-24" />
                <LinkButton
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`}
                  data-cy="register-new-errand-button"
                  color="primary"
                  variant="tertiary"
                >
                  {t('filtering:new_errand')}
                </LinkButton>
              </div>
            }
            mobileMenu={
              registerNewErrand ? undefined : (
                <PopupMenu align="end">
                  <PopupMenu.Button iconButton aria-label={t('layout:controls.open_menu')}>
                    <Menu />
                  </PopupMenu.Button>
                  <PopupMenu.Panel>
                    <PopupMenu.Group>
                      <div className="font-bold">{`${user.name} (${user.username})`}</div>
                    </PopupMenu.Group>
                    <PopupMenu.Items>
                      <PopupMenu.Group>
                        <PopupMenu.Item>
                          <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`}>
                            {t('filtering:new_errand')}
                          </Link>
                        </PopupMenu.Item>
                      </PopupMenu.Group>

                      {userMenuGroups.map((group, groupindex) => (
                        <PopupMenu.Group key={`mobilegroup-${groupindex}`}>
                          {group.elements.map((item, itemindex) => (
                            <PopupMenu.Item key={`mobilegroup-${groupindex}-${itemindex}`}>
                              {item.element()}
                            </PopupMenu.Item>
                          ))}
                        </PopupMenu.Group>
                      ))}
                    </PopupMenu.Items>
                  </PopupMenu.Panel>
                </PopupMenu>
              )
            }
          />
        </div>

        {children}
      </div>
    </>
  );
}
