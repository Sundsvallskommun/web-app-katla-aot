import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { mockReporterStakeholder } from './mockStakeholder';

export const mockErrand: ErrandDTO = {
  id: '3f67229c-57aa-44b0-b5e0-79d2f8a8e38a',
  errandNumber: 'AIA-25120019',
  title: 'Empty errand',
  priority: 'MEDIUM',
  stakeholders: [mockReporterStakeholder],
  externalTags: [],
  parameters: [],
  classification: {
    category: 'KATEGORI',
    type: 'TYPETEST',
  },
  status: 'NEW',
  resolution: 'INFORMED',
  channel: 'ESERVICE_KATLA',
  reporterUserId: 'ABC123DEF',
  created: '2025-12-10T14:43:05.203+01:00',
  touched: '2025-12-10T14:43:05+01:00',
};
