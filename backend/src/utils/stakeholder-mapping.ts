import { MUNICIPALITY_ID } from '@/config';
import { ContactChannel, Parameter, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';

import { apiURL } from './util';

const getCitizenPersonNumber = (value: unknown): string => {
  if (typeof value === 'string') return value;

  // Citizen documents the response as a string, but the gateway may JSON-parse the
  // twelve-digit value as a number. Accept only integers that convert losslessly.
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);

  throw new HttpException(502, 'Invalid person number response from Citizen API');
};

export async function mapStakeholderToStakeholderDTO(stakeholder: Stakeholder, req: RequestWithUser): Promise<StakeholderDTO> {
  const apiService = new ApiService();
  const citizenUrl = `${MUNICIPALITY_ID}/${stakeholder.externalId}/personnumber`;
  const baseURL = apiURL('citizen');
  let personNumber = '';

  if (stakeholder.externalId) {
    const citizenResponse = await apiService.get<unknown>({ url: citizenUrl, baseURL }, req);
    personNumber = getCitizenPersonNumber(citizenResponse.data);
  }

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
    personNumber: addHyphenToPersonNumber(personNumber),
    title: parameters?.find(p => p.key === 'title')?.displayName ?? undefined,
    department: parameters?.find(p => p.key === 'department')?.displayName ?? undefined,
    emails: emails.length ? emails : undefined,
    phoneNumbers: phoneNumbers.length ? phoneNumbers : undefined,
  };
}

export function mapStakeholderDTOToStakeholder(stakeholder: StakeholderDTO): Stakeholder {
  delete stakeholder.personNumber;
  const { emails, phoneNumbers, title, department, ...rest } = stakeholder;

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
