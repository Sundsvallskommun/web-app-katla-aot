'use client';

import { jsonParametersToErrandFormData } from '@components/json/utils/schema-utils';
import { ErrorAlert } from '@components/misc/error-alert.component';
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
import { default as NextLink } from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useAutoInitReporter } from 'src/hooks/use-auto-init-reporter';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { useWizardStore } from 'src/stores/wizard-store';
import * as yup from 'yup';

const ReporterInit: React.FC = () => {
  useAutoInitReporter();
  return null;
};

const FormSchema = yup.object({}).required();
const REGISTER_ROUTE_IDENTITY = 'new-errand';
const INVALID_ROUTE_IDENTITY = 'invalid-errand-route';
const REGISTER_ROUTE_PATTERN = /\/arende\/registrera\/?$/;

type ErrandRoute =
  | { identity: typeof REGISTER_ROUTE_IDENTITY; kind: 'register' }
  | { errandNumber: string; identity: string; kind: 'existing' }
  | { identity: typeof INVALID_ROUTE_IDENTITY; kind: 'invalid' };

// Kontrollen finns för att avvisa svar från en tidigare route, inte för att
// kräva kanonisk skiftlägesform. Jämför normaliserat så att en giltig djuplänk
// med annan skiftlägesform fortfarande laddar ärendet.
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

// Tabs identifierar sitt direkta Button-barn via komponentreferens. Att skicka
// de polymorfa länkpropsen genom ett objekt bevarar den identiteten och går
// samtidigt runt den installerade deklarationen, som inte exponerar målets props.
const createLinkTabProps = (href: string) => ({ as: NextLink, href });

const ErrandRouteContent: React.FC<ErrandRouteContentProps> = ({ children, route }) => {
  const { t } = useTranslation();
  const registerNewErrand = route.kind === 'register';
  const requestedErrandNumber = route.kind === 'existing' ? route.errandNumber : null;
  const initialFocus = useRef<HTMLBodyElement>(null);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const wizardReset = useWizardStore((s) => s.reset);
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
    if (registerNewErrand) {
      wizardReset();
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
        reset({ ...errand, errandFormData });
        setLoadState('ready');
      })
      .catch(() => {
        if (active) setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [registerNewErrand, requestedErrandNumber, reset, wizardReset]);

  const errandStatus = methods.watch('status');
  const errandNumber = methods.watch('errandNumber');
  const isDraft = errandStatus === 'DRAFT';

  const getHeaderTitle = () => {
    if (registerNewErrand) {
      return t('filtering:new_errand');
    }
    if (isDraft) {
      return `${t('errand-information:draft')} ${errandNumber}`;
    }
    return `${t('errand-information:errand')} ${errandNumber}`;
  };

  if (loadState !== 'ready') {
    return (
      <FormProvider {...methods}>
        <div className="bg-background-100 h-screen min-h-screen flex items-center justify-center p-24">
          {loadState === 'error' ?
            <ErrorAlert message={t('api_errors.errand')} />
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
        {registerNewErrand && <ReporterInit />}
        <BaseErrandLayout registerNewErrand={registerNewErrand}>
          {isMobile && registerNewErrand ?
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
                          <Tabs.Item key={tab.label}>
                            <Tabs.Button {...createLinkTabProps(tab.path)} className="text-base whitespace-nowrap">
                              {tab.label}
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

  // En routeidentitet äger exakt en RHF-instans. Nyckeln river ned föregående
  // formulär synkront vid A→B-navigation, innan B hinner rendera header eller
  // åtgärder, medan requestupprensningen avvisar varje sent A-svar.
  return (
    <ErrandRouteContent key={route.identity} route={route}>
      {children}
    </ErrandRouteContent>
  );
};
