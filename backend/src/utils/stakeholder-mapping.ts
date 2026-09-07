import { ContactChannel, Parameter, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { StakeholderDTO } from '@/responses/supportmanagement.response';

// Disabled together with the Citizen lookup below — see the FIXME there.
//
// import { MUNICIPALITY_ID } from '@/config';
// import { HttpException } from '@/exceptions/HttpException';
// import ApiService from '@/services/api.service';
// import { apiURL } from './util';
//
// const getCitizenPersonNumber = (value: unknown): string => {
//   if (typeof value === 'string') return value;
//
//   // Citizen documents the response as a string, but the gateway may JSON-parse the
//   // twelve-digit value as a number. Accept only integers that convert losslessly.
//   if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
//
//   throw new HttpException(502, 'Invalid person number response from Citizen API');
// };

// FIXME(katla-aot): pending a team decision. This resolved a stakeholder's externalId into a
// person number via the Citizen API. externalId can come from the client on create, so the
// response turned a caller-supplied id into personal data. Re-enable only behind a check that
// the externalId belongs to the caller — and drop it entirely if nothing needs the number.
//
// Re-enabling makes this async again: the two callers in supportmanagement.controller.ts must go
// back to `await Promise.all(...)` around the map.
//
// const apiService = new ApiService();
// const citizenUrl = `${MUNICIPALITY_ID}/${stakeholder.externalId}/personnumber`;
// const baseURL = apiURL('citizen');
// if (stakeholder.externalId) {
//   const citizenResponse = await apiService.get<unknown>({ url: citizenUrl, baseURL }, _req);
//   personNumber = getCitizenPersonNumber(citizenResponse.data);
// }
/** Parameter key for the serving location. */
const SERVERINGSSTALLE_PARAMETER = 'serveringsstalle';

export function mapStakeholderToStakeholderDTO(stakeholder: Stakeholder, _req: RequestWithUser): StakeholderDTO {
  const { contactChannels, parameters, ...rest } = stakeholder;

  const { emails, phoneNumbers } = (contactChannels ?? []).reduce<{
    emails: string[];
    phoneNumbers: string[];
  }>(
    (acc, { type, value }) => {
      if (!value) return acc;

      if (type === 'email') acc.emails.push(value.toLocaleLowerCase());
      if (type === 'phone') acc.phoneNumbers.push(value);

      return acc;
    },
    { emails: [], phoneNumbers: [] },
  );

  return {
    ...rest,
    // Stays undefined while the Citizen lookup above is disabled.
    personNumber: undefined,
    title: parameters?.find(p => p.key === 'title')?.displayName ?? undefined,
    department: parameters?.find(p => p.key === 'department')?.displayName ?? undefined,
    // values, not displayName: this one carries data the citizen entered, not a label.
    serveringsstalle: parameters?.find(p => p.key === SERVERINGSSTALLE_PARAMETER)?.values?.[0] ?? undefined,
    emails: emails.length ? emails : undefined,
    phoneNumbers: phoneNumbers.length ? phoneNumbers : undefined,
  };
}

export function mapStakeholderDTOToStakeholder(stakeholder: StakeholderDTO): Stakeholder {
  delete stakeholder.personNumber;
  const { emails, phoneNumbers, title, department, serveringsstalle, ...rest } = stakeholder;

  const contactChannels: ContactChannel[] = [
    ...(emails?.map(email => ({
      type: 'email',
      value: email,
    })) ?? []),

    ...(phoneNumbers?.map(phone => ({
      type: 'phone',
      value: phone,
    })) ?? []),
  ];

  const parameters: Parameter[] = [];
  if (title) {
    parameters.push({
      key: 'title',
      displayName: title,
    });
  }
  if (department) {
    parameters.push({
      key: 'department',
      displayName: department,
    });
  }
  if (serveringsstalle) {
    parameters.push({
      key: SERVERINGSSTALLE_PARAMETER,
      values: [serveringsstalle],
    });
  }

  return {
    ...rest,
    contactChannels: contactChannels.length ? contactChannels : undefined,
    parameters,
  };
}

export function addHyphenToPersonNumber(personNumber: string): string {
  if (!personNumber) return personNumber;

  const digitsOnly = personNumber.replace(/\D/g, '');

  if (digitsOnly.length !== 12) return personNumber;

  return `${digitsOnly.slice(0, 8)}-${digitsOnly.slice(8)}`;
}
