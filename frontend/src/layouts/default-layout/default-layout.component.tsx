'use client';

import { CookieConsent, Footer, Header, Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

//REMOVE?

interface DefaultLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  preContent?: React.ReactNode;
  postContent?: React.ReactNode;
  logoLinkHref?: string;
}

export default function DefaultLayout({
  headerTitle,
  headerSubtitle,
  children,
  preContent,
  postContent,
  logoLinkHref = '/',
}: DefaultLayoutProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const setFocusToMain = () => {
    const contentElement = document.getElementById('content');
    contentElement?.focus();
  };

  const handleLogoClick = () => {
    router.push(logoLinkHref);
  };

  return (
    <div className="DefaultLayout full-page-layout">
      <Link
        as={NextLink}
        href="#content"
        onClick={setFocusToMain}
        accessKey="s"
        className="next-link-a"
        data-cy="systemMessage-a"
      >
        {t('layout:header.goto_content')}
      </Link>

      <Header
        data-cy="nav-header"
        title={(headerTitle ?? '') || process.env.NEXT_PUBLIC_APP_NAME}
        subtitle={headerSubtitle ?? ''}
        aria-label={`${(headerTitle ?? '') || process.env.NEXT_PUBLIC_APP_NAME} ${headerSubtitle}`}
        logoLinkOnClick={handleLogoClick}
        // LogoLinkWrapperComponent={<NextLink legacyBehavior href={logoLinkHref} passHref />}
      />

      {preContent && preContent}

      <div className={`main-container flex-grow relative w-full flex flex-col`}>
        <div className="main-content-padding">{children}</div>
      </div>

      {postContent && postContent}

      <Footer></Footer>

      <CookieConsent
        title={t('layout:cookies.title', { app: process.env.NEXT_PUBLIC_APP_NAME })}
        body={
          <p>
            {t('layout:cookies.description')}{' '}
            <Link as={NextLink} href="/kakor">
              {t('layout:cookies.read_more')}
            </Link>
          </p>
        }
        cookies={[
          {
            optional: false,
            displayName: t('layout:cookies.necessary.displayName'),
            description: t('layout:cookies.necessary.description'),
            cookieName: 'necessary',
          },
          {
            optional: true,
            displayName: t('layout:cookies.func.displayName'),
            description: t('layout:cookies.func.description'),
            cookieName: 'func',
          },
          {
            optional: true,
            displayName: t('layout:cookies.stats.displayName'),
            description: t('layout:cookies.stats.description'),
            cookieName: 'stats',
          },
        ]}
        resetConsentOnInit={false}
        onConsent={() => {
          // FIXME: do stuff with cookies?
          // NO ANO FUNCTIONS
        }}
      />
    </div>
  );
}
