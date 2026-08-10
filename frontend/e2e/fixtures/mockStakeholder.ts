import type { StakeholderDTO } from '@data-contracts/backend/data-contracts';

import { MOCK_COUNTRY_CODE_PHONE_NUMBER, MOCK_EMAIL, MOCK_HYPHEN_PERSON_NUMBER } from '../utils/constants';

export const mockReporterStakeholder: StakeholderDTO = {
  externalId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  city: '',
  firstName: 'Test',
  lastName: 'Testsson',
  address: '',
  zipCode: '',
  emails: [MOCK_EMAIL],
  phoneNumbers: [MOCK_COUNTRY_CODE_PHONE_NUMBER],
  role: 'REPORTER',
  title: 'mockTitle',
  department: 'mockDepartment',
};

export const mockStakeholder: StakeholderDTO = {
  personNumber: MOCK_HYPHEN_PERSON_NUMBER,
  externalId: 'aaaaaaaa-ffff-cccc-dddd-eeeeeeeeeeee',
  city: 'mockCity',
  firstName: 'Mock',
  lastName: 'Person',
  address: 'mockAddress 1',
  zipCode: '12345',
  careOf: '',
};

export const mockManualEditStakeholder: StakeholderDTO = {
  externalId: 'aaaaaaaa-ffff-gggg-dddd-eeeeeeeeeeee',
  city: 'mockEditCity',
  firstName: 'TestFirstName',
  lastName: 'TestLastName',
  address: 'mockAddress 2',
  zipCode: '12346',
  careOf: 'mockEditCareOf',
};
