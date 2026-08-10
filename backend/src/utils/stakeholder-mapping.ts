import { MUNICIPALITY_ID } from '@/config';
import { ContactChannel, Parameter, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { apiURL } from './util';

export async function mapStakeholderToStakeholderDTO(stakeholder: Stakeholder, req: RequestWithUser): Promise<StakeholderDTO> {
  const apiService = new ApiService();
  const citizenUrl = `${MUNICIPALITY_ID}/${stakeholder.externalId}/personnumber`;
  const baseURL = apiURL('citizen');
  let personNumber = '';

  if (stakeholder.externalId) {
    personNumber = (await apiService.get<string>({ url: citizenUrl, baseURL }, req)).data.toString();
  }

  const { contactChannels = [], parameters, ...rest } = stakeholder;

  const { emails, phoneNumbers } = contactChannels.reduce<{
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
  } as StakeholderDTO;
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

  const parameters: Parameter[] = [
    title && {
      key: 'title',
      displayName: title,
    },
    department && {
      key: 'department',
      displayName: department,
    },
  ].filter(Boolean);

  return {
    ...rest,
    contactChannels: contactChannels.length ? contactChannels : undefined,
    ...(!!parameters ? { parameters } : {}),
  } as Stakeholder;
}

export function addHyphenToPersonNumber(personNumber: string): string {
  if (!personNumber) return personNumber;

  const digitsOnly = personNumber.replace(/\D/g, '');

  if (digitsOnly.length !== 12) return personNumber;

  return `${digitsOnly.slice(0, 8)}-${digitsOnly.slice(8)}`;
}
