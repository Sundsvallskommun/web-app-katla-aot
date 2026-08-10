'use client';

import { MobileWizard } from '@components/wizard/mobile-wizard.component';
import { VisibleTabs } from '@components/tabs/tabs';
import { FormValidationProvider } from '@contexts/form-validation-context';
import { yupResolver } from '@hookform/resolvers/yup';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { ErrandFormDTO } from '@interfaces/errand-form';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import Main from '@layouts/main/main.component';
import { Tabs } from '@sk-web-gui/react';
import { useAutoInitReporter } from 'src/hooks/use-auto-init-reporter';
import { useWizardStore } from 'src/stores/wizard-store';
import { default as NextLink } from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const ReporterInit: React.FC = () => {
  useAutoInitReporter();
  return null;
};

const FormSchema = yup.object({}).required();

export const ErrandLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const pathName = usePathname();
  const registerNewErrand = !!pathName.includes('/registrera');
  const initialFocus = useRef<HTMLBodyElement>(null);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const wizardReset = useWizardStore((s) => s.reset);

  useEffect(() => {
    if (registerNewErrand) {
      wizardReset();
    }
  }, [registerNewErrand, wizardReset]);

  const setInitalFocus = () => {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      initialFocus.current && initialFocus.current.focus();
    });
  };

  const defaultErrand: ErrandFormDTO = {
    title: 'Empty errand',
    priority: 'MEDIUM',
    status: 'DRAFT',
    //TODO: Change channel to ESERVICE_KATLA?
    channel: 'ESERVICE',
    resolution: 'INFORMED',
  };

  const methods = useForm<ErrandFormDTO>({
    resolver: yupResolver(FormSchema) as unknown as Resolver<ErrandFormDTO>,
    defaultValues: defaultErrand,
    mode: 'onSubmit',
  });

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

  return (
    <FormProvider {...methods}>
      <FormValidationProvider>
        <NextLink
          href="#content"
          passHref
          tabIndex={1}
          onClick={() => setInitalFocus()}
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
