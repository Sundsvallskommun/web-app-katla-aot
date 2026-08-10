export interface AppConfig {
  applicationName: string;
  features: AppConfigFeatures;
}

interface AppConfigFeatures {
  draftEnabled: boolean;
  errandFilter: boolean;
  reducedStakeholderInfo: boolean;
  disclosureDoneMark: boolean;
  otherPartiesDisclosure: boolean;
}

export const appConfig: AppConfig = {
  applicationName: (process.env.NEXT_PUBLIC_APP_NAME ?? '') || 'appen',
  features: {
    draftEnabled: process.env.NEXT_PUBLIC_DRAFT_ERRAND === 'true',
    errandFilter: process.env.NEXT_PUBLIC_ERRAND_FILTER === 'true',
    reducedStakeholderInfo: process.env.NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO === 'true',
    disclosureDoneMark: process.env.NEXT_PUBLIC_DISCLOSURE_DONE_MARK === 'true',
    otherPartiesDisclosure: process.env.NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE === 'true',
  },
};
