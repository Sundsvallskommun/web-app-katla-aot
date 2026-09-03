'use client';

import { pathWithoutLocale } from '@app/locale-path';
import { jsonParametersToErrandFormData } from '@components/json/utils/schema-utils';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { VisibleTabs } from '@components/tabs/tabs';
import { MobileWizard } from '@components/wizard/mobile-wizard.component';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import { yupResolver } from '@hookform/resolvers/yup';
import { ErrandFormDTO } from '@interfaces/errand-form';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import Main from '@layouts/main/main.component';
import { getErrandUsingErrandNumber } from '@services/errand-service/errand-service';
import { Spinner, Tabs } from '@sk-web-gui/react';
import { ErrandFormHandover, takeErrandFormHandover } from '@utils/errand-form-handover';
import { default as NextLink } from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useLoadMetadata } from 'src/hooks/use-load-metadata';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useWizardStore } from 'src/stores/wizard-store';
import * as yup from 'yup';

const FormSchema = yup.object({}).required();
const REGISTER_ROUTE_IDENTITY = 'new-errand';
const INVALID_ROUTE_IDENTITY = 'invalid-errand-route';
const REGISTER_ROUTE_PATTERN = /\/arende\/registrera\/?$/;

type ErrandRoute =
  | { identity: typeof REGISTER_ROUTE_IDENTITY; kind: 'register' }
  | { errandNumber: string; identity: string; kind: 'existing' }
  | { identity: typeof INVALID_ROUTE_IDENTITY; kind: 'invalid' };

// The check exists to reject responses from an earlier route, not to demand canonical casing.
// Compare normalised so a valid deep link with different casing still loads the errand.
const matchesRequestedErrand = (errandNumber: string | undefined, requestedErrandNumber: string): boolean =>
  errandNumber?.trim().toLocaleUpperCase('sv-SE') === requestedErrandNumber.trim().toLocaleUpperCase('sv-SE');

const createDefaultErrand = (): ErrandFormDTO => ({
  title: 'Empty errand',
  priority: 'MEDIUM',
  status: 'DRAFT',
  //TODO: Change channel to ESERVICE_KATLA?
  channel: 'ESERVICE',
  resolution: 'INFORMED',
});

interface ErrandRouteContentProps {
  children: React.ReactNode;
  route: ErrandRoute;
}

// Tabs identifies its direct Button child by component reference. Passing the polymorphic link
// props through an object keeps that identity while working around the installed declaration,
// which does not expose the target's props.
const createLinkTabProps = (href: string) => ({ as: NextLink, href });

const ErrandRouteContent: React.FC<ErrandRouteContentProps> = ({ children, route }) => {
  const { t } = useTranslation();
  const registerNewErrand = route.kind === 'register';
  const requestedErrandNumber = route.kind === 'existing' ? route.errandNumber : null;
  const initialFocus = useRef<HTMLBodyElement>(null);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const wizardReset = useWizardStore((s) => s.reset);
  const wizardGoToStep = useWizardStore((s) => s.goToStep);
  const pathname = usePathname();
  const handoverRef = useRef<{ handover: ErrandFormHandover | null; path: string } | null>(null);
  const { metadataError, metadataLoadState } = useLoadMetadata();
  const metadata = useMetadataStore((state) => state.metadata);
  const [loadState, setLoadState] = useState<'error' | 'loading' | 'ready'>(
    route.kind === 'register' ? 'ready'
    : route.kind === 'invalid' ? 'error'
    : 'loading'
  );

  const setInitalFocus = () => {
    setTimeout(() => {
      initialFocus.current?.focus();
    });
  };

  const methods = useForm<ErrandFormDTO>({
    resolver: yupResolver(FormSchema) as unknown as Resolver<ErrandFormDTO>,
    defaultValues: createDefaultErrand(),
    mode: 'onSubmit',
  });
  const { reset } = methods;

  useEffect(() => {
    // A language switch is a navigation, and Next remounts the whole tree. The handover carries
    // what lived only in memory across it; without it, switching language mid-registration costs
    // the user everything they entered.
    //
    // The entry is removed on first read, while the effect may re-run for the same page —
    // StrictMode does exactly that in development. The result is therefore cached per path: a
    // re-run for the same page reuses it, and a move to another path gets its own (empty) result
    // instead of reapplying values that have gone stale.
    const handoverPath = pathWithoutLocale(pathname);
    if (handoverRef.current?.path !== handoverPath) {
      handoverRef.current = { path: handoverPath, handover: takeErrandFormHandover(handoverPath) };
    }
    const handover = handoverRef.current.handover;

    if (registerNewErrand) {
      if (handover) {
        reset(handover.values);
        wizardGoToStep(handover.wizardStep);
      } else {
        wizardReset();
      }
      return;
    }

    if (!requestedErrandNumber) return;

    let active = true;
    void getErrandUsingErrandNumber(requestedErrandNumber)
      .then((errand) => {
        if (!active) return;
        if (!matchesRequestedErrand(errand.errandNumber, requestedErrandNumber)) {
          throw new Error('Det hämtade ärendet matchar inte den begärda routen');
        }

        const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
        // The handover holds unsaved edits and is therefore newer than the API response, which
        // carries only what has been saved.
        if (handover) {
          reset(handover.values);
          wizardGoToStep(handover.wizardStep);
        } else {
          reset({ ...errand, errandFormData });
        }
        setLoadState('ready');
      })
      .catch(() => {
        if (active) setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [pathname, registerNewErrand, requestedErrandNumber, reset, wizardGoToStep, wizardReset]);

  const errandStatus = methods.watch('status');
  const errandNumber = methods.watch('errandNumber');
  const isDraft = errandStatus === 'DRAFT';
  // A draft is the same unfinished work whether just created or resumed, and the wizard is the
  // interface built for narrow screens. Without this condition a resumed draft switched to the
  // tab view on mobile.
  const showMobileWizard = isMobile && (registerNewErrand || isDraft);

  const getHeaderTitle = () => {
    if (registerNewErrand) {
      return t('filtering:new_errand');
    }
    if (isDraft) {
      return `${t('errand-information:draft')} ${errandNumber}`;
    }
    return `${t('errand-information:errand')} ${errandNumber}`;
  };

  // Role names come from metadata. Rendering the page before it exists leaves the roles empty,
  // so metadata belongs to the same readiness boundary as the errand itself.
  const loadErrors = [loadState === 'error' ? t('api_errors.errand') : null, metadataError].filter(
    (message): message is string => message !== null
  );

  if (loadErrors.length > 0 || loadState !== 'ready' || metadataLoadState !== 'ready' || !metadata) {
    return (
      <FormProvider {...methods}>
        <div className="bg-background-100 h-screen min-h-screen flex items-center justify-center p-24">
          {loadErrors.length > 0 ?
            <ErrorAlertList messages={loadErrors} />
          : <Spinner aria-label={t('forms:loading')} />}
        </div>
      </FormProvider>
    );
  }

  return (
    <FormProvider {...methods}>
      <FormValidationProvider>
        <NextLink
          href="#content"
          passHref
          onClick={() => {
            setInitalFocus();
          }}
          className="sr-only focus:not-sr-only bg-primary-light border-2 border-black p-4 text-black inline-block focus:absolute focus:top-0 focus:left-0 focus:right-0 focus:m-auto focus:w-80 text-center"
        >
          {t('layout:header.goto_content')}
        </NextLink>
        <BaseErrandLayout registerNewErrand={registerNewErrand}>
          {showMobileWizard ?
            <MobileWizard />
          : <div className="grow shrink overflow-y-auto">
              <div className="bg-transparent">
                <div className="mb-xl">
                  <div className="mx-auto max-w-[108rem] flex flex-col md:flex-row justify-between pt-16 md:pt-32 pb-12 px-16 md:px-0 gap-12">
                    <h1 className="text-h2-sm md:text-h2-lg">{getHeaderTitle()}</h1>
                    <ErrandButtonGroup isNewErrand={registerNewErrand} />
                  </div>
                  <Main>
                    <Tabs
                      className="border-1 rounded-12 bg-background-content pt-22 pl-5 mx-auto max-w-[108rem]"
                      tabslistClassName="border-0 -m-b-12 flex-wrap ml-10 overflow-x-auto"
                      panelsClassName="border-t-1"
                      size="sm"
                    >
                      {VisibleTabs.filter((tab) => tab.visible).map((tab) => {
                        return (
                          <Tabs.Item key={tab.path}>
                            <Tabs.Button {...createLinkTabProps(tab.path)} className="text-base whitespace-nowrap">
                              {t(tab.labelKey)}
                            </Tabs.Button>
                            <Tabs.Content>
                              <div className="pt-xl pb-64 px-16 md:px-40">{children}</div>
                            </Tabs.Content>
                          </Tabs.Item>
                        );
                      })}
                    </Tabs>
                  </Main>
                </div>
              </div>
            </div>
          }
        </BaseErrandLayout>
      </FormValidationProvider>
    </FormProvider>
  );
};

export const ErrandLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathName = usePathname();
  const { errandnumber } = useParams<{ errandnumber?: string }>();

  let route: ErrandRoute;
  if (REGISTER_ROUTE_PATTERN.test(pathName)) {
    route = { identity: REGISTER_ROUTE_IDENTITY, kind: 'register' };
  } else if (errandnumber) {
    route = { errandNumber: errandnumber, identity: `existing:${errandnumber}`, kind: 'existing' };
  } else {
    route = { identity: INVALID_ROUTE_IDENTITY, kind: 'invalid' };
  }

  // One route identity owns exactly one RHF instance. The key tears the previous form down
  // synchronously on an A→B navigation, before B renders its header or actions, while the
  // request cleanup rejects any late A response.
  return (
    <ErrandRouteContent key={route.identity} route={route}>
      {children}
    </ErrandRouteContent>
  );
};
