import { Button } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { ComponentPropsWithoutRef } from 'react';

type DesignSystemButtonProps = ComponentPropsWithoutRef<typeof Button.Component>;

export type LinkButtonProps = Omit<DesignSystemButtonProps, 'as' | 'ref' | 'type'> &
  Omit<ComponentPropsWithoutRef<typeof NextLink>, keyof DesignSystemButtonProps>;

/**
 * Typsäker adapter för designsystemets knapp renderad som en Next.js-länk.
 * Installerad Button stödjer `as` i runtime, men dess deklaration behåller inte
 * målkomponentens props.
 */
export const LinkButton: React.FC<LinkButtonProps> = (props) => <Button as={NextLink} {...props} />;
