import { ALCOHOL_PERMIT_SERVICE_PATH } from 'src/constants/routes';

interface TabItem {
  labelKey: string;
  path: string;
  visible: boolean;
}

export const VisibleTabs: TabItem[] = [
  { labelKey: 'common:tabs.basic_information', path: ALCOHOL_PERMIT_SERVICE_PATH, visible: true },
  // { labelKey: 'common:tabs.messages', path: `/arende/${errandnumber}/meddelanden`, visible: true },
  // { labelKey: 'common:tabs.attachments', path: `/arende/${errandnumber}/bilagor`, visible: true },
];
