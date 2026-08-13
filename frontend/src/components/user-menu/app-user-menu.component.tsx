'use client';

import { Avatar, cx, PopupMenu, UserMenuProps } from '@sk-web-gui/react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface AppUserMenuProps extends UserMenuProps {
  buttonLabel?: string;
}

export const AppUserMenu = forwardRef<HTMLDivElement, AppUserMenuProps>((props, ref) => {
  const { t } = useTranslation();
  const {
    buttonLabel = t('layout:controls.open_user_menu'),
    buttonRounded = true,
    buttonSize = 'lg',
    className,
    image,
    imageAlt = '',
    imageElem,
    initials,
    menuGroups,
    menuSubTitle,
    menuTitle,
    placeholderImage,
    ...rest
  } = props;

  return (
    <div ref={ref} className={cx('sk-usermenu', className)} {...rest}>
      <PopupMenu align="end">
        <PopupMenu.Button
          aria-label={buttonLabel}
          size={buttonSize}
          showBackground={false}
          className="sk-usermenu-button"
          rounded={buttonRounded}
          variant="tertiary"
          iconButton
        >
          <Avatar
            size={buttonSize}
            rounded={buttonRounded}
            initials={initials}
            imageUrl={image}
            imageAlt={imageAlt}
            placeholderImage={placeholderImage}
            imageElement={imageElem}
          />
        </PopupMenu.Button>
        <PopupMenu.Panel>
          {[menuTitle, menuSubTitle].some(Boolean) && (
            <PopupMenu.Group>
              <div className="font-bold">{menuTitle}</div>
              <small>{menuSubTitle}</small>
            </PopupMenu.Group>
          )}
          <PopupMenu.Items>
            {menuGroups.map((group, groupIndex) => (
              <PopupMenu.Group aria-label={group.label} role="group" key={`app-user-menu-${groupIndex}`}>
                {group.elements.map((item, itemIndex) => (
                  <PopupMenu.Item key={`app-user-menu-${groupIndex}-${itemIndex}`}>{item.element()}</PopupMenu.Item>
                ))}
              </PopupMenu.Group>
            ))}
          </PopupMenu.Items>
        </PopupMenu.Panel>
      </PopupMenu>
    </div>
  );
});

AppUserMenu.displayName = 'AppUserMenu';
