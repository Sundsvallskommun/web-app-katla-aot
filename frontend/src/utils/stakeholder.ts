import { RoleDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { appConfig } from 'src/config/appconfig';
import * as yup from 'yup';

export const shouldShowContactDetails = (roles?: string[]) =>
  !(roles?.includes('PRIMARY') && appConfig.features.reducedStakeholderInfo);

export const emptyStakeholder: StakeholderDTO = {
  externalIdType: 'PERSON',
  externalId: '',
  personNumber: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  emails: [''],
  zipCode: '',
  phoneNumbers: [''],
  role: '',
};

const personNumberRegex = /^\d{8}-?\d{4}$/;
const phoneRegExp = /^$|^(?:\+|0)[0-9\s-]{6,19}$/;
const emailRegExp =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function phoneNumberFormatter(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return '';

  let formatted = phoneNumber.trim().replaceAll('-', '').replaceAll(' ', '');

  formatted = formatted.replace(/^0{3,}/, '00');

  if (formatted.startsWith('00')) {
    return formatted.replace(/^00/, '+');
  }

  if (formatted.startsWith('0')) {
    return formatted.replace(/^0/, '+46');
  }

  return formatted;
}

export const stakeholderSchema = yup.object({
  firstName: yup.string().trim().required('Förnamn får inte vara tomt'),
  lastName: yup.string().trim().required('Efternamn får inte vara tomt'),
  personNumber: yup
    .string()
    .nullable()
    .notRequired()
    .matches(personNumberRegex, {
      message: 'Personnummer måste vara ÅÅÅÅMMDDXXXX eller ÅÅÅÅMMDD-XXXX',
      excludeEmptyString: true,
    })
    .test('valid-date', 'Ogiltigt datum i personnummer', (value) => {
      if (!value) return true;
      const normalized = value.replace('-', '');

      const year = Number(normalized.slice(0, 4));
      const month = Number(normalized.slice(4, 6)) - 1;
      const day = Number(normalized.slice(6, 8));

      const date = new Date(year, month, day);
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    }),
  emails: yup
    .array()
    .of(
      yup.string().matches(emailRegExp, {
        message: 'Ogiltig e-postadress',
        excludeEmptyString: true,
      })
    )
    .notRequired(),
  phoneNumbers: yup
    .array()
    .of(
      yup
        .string()
        .matches(
          phoneRegExp,
          'Fyll i ett giltigt mobilnummer, till exempel 0731234567, +46731234567 eller 0046731234567.'
        )
        .nullable()
        .optional()
    )
    .notRequired(),
});

export const getReporterStakeholder: (stakeholders: StakeholderDTO[] | undefined) => StakeholderDTO | undefined = (
  stakeholders
) => stakeholders?.find((s) => s.role?.includes('REPORTER'));

export const getStakeholderRoleDisplayName: (stakeholder: StakeholderDTO, roles: RoleDTO[] | undefined) => string = (
  stakeholder,
  role
) => {
  return role?.find((role) => role?.name === stakeholder?.role)?.displayName ?? '';
};
