'use client';

import { jsonParametersToErrandFormData } from '@components/json/utils/schema-utils';
import { VisibleTabs } from '@components/tabs/tabs';
import { MobileWizard } from '@components/wizard/mobile-wizard.component';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import { yupResolver } from '@hookform/resolvers/yup';
import { ErrandFormDTO } from '@interfaces/errand-form';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import Main from '@layouts/main/main.component';
import { getErrandUsingErrandNumber } from '@services/errand-service/errand-service';
import { Alert, Spinner, Tabs } from '@sk-web-gui/react';
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
        if (errand.errandNumber !== requestedErrandNumber) {
          throw new Error('The fetched errand does not match the requested route');
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
            <div role="alert">
              <Alert type="error">
                <Alert.Icon />
                <Alert.Content>
                  <Alert.Content.Description>{t('api_errors.errand')}</Alert.Content.Description>
                </Alert.Content>
              </Alert>
            </div>
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
          tabIndex={1}
          onClick={() => {
            setInitalFocus();
          }}
          className="sr-only focus:not-sr-only bg-primary-light border-2 border-black p-4 text-black inline-block focus:absolute focus:top-0 focus:left-0 focus:right-0 focus:m-auto focus:w-80 text-center"
        >
          Hoppa till innehåll
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
                            <Tabs.Button className={'text-base whitespace-nowrap'}>
                              <NextLink href={tab.path} className="block w-full h-full">
                                {tab.label}
                              </NextLink>
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

  // A route identity owns exactly one RHF instance. The key tears down the
  // previous form synchronously on A→B navigation, before B can render a header
  // or actions, while the request cleanup rejects every late A response.
  return (
    <ErrandRouteContent key={route.identity} route={route}>
      {children}
    </ErrandRouteContent>
  );
};
