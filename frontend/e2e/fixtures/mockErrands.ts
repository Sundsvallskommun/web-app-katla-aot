import type { PageErrandDTO } from '@data-contracts/backend/data-contracts';

import { MOCK_EMAIL, MOCK_PHONE_NUMBER } from '../utils/constants';

export const mockErrands: PageErrandDTO = {
  content: [
    {
      id: '3f67229c-57aa-44b0-b5e0-79d2f8a8e38a',
      errandNumber: 'AIA-25120019',
      title: 'Empty errand',
      priority: 'MEDIUM',
      stakeholders: [
        {
          externalId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          role: 'REPORTER',
          city: '',
          firstName: 'Test',
          lastName: 'Testsson',
          address: '',
          zipCode: '',
          emails: [MOCK_EMAIL],
          phoneNumbers: [MOCK_PHONE_NUMBER],
        },
      ],
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
    },
  ],
  pageable: {
    pageNumber: 0,
    pageSize: 12,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: false,
  totalElements: 17,
  totalPages: 2,
  size: 12,
  number: 0,
  first: true,
  numberOfElements: 12,
  empty: false,
};
