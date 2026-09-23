import { REGISTER_ERRAND_PATH } from 'src/constants/routes';

interface TabItem {
  labelKey: string;
  path: string;
  visible: boolean;
}

export const VisibleTabs: TabItem[] = [
  { labelKey: 'common:tabs.basic_information', path: REGISTER_ERRAND_PATH, visible: true },
  // { labelKey: 'common:tabs.messages', path: `/arende/${errandnumber}/meddelanden`, visible: true },
  // { labelKey: 'common:tabs.attachments', path: `/arende/${errandnumber}/bilagor`, visible: true },
];
