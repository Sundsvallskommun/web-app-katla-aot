import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { LegalEntity2, PersonEngagement } from '@/data-contracts/legalentity/data-contracts';
import { GrantorDetails, MandateDetails, Mandates } from '@/data-contracts/myrepresentatives/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { OrganizationDTO } from '@/responses/legal-entity.response';
import ApiService, { Sender } from '@/services/api.service';
import { logger } from '@/utils/logger';

/** Injectable so tests can drive the mapping without an upstream. */
type LegalEntityApi = Pick<ApiService, 'get'>;

const defaultApi = new ApiService();
const legalEntityBase = getApiBase('legalentity');
const myRepresentativesBase = getApiBase('myrepresentatives');

/**
 * Engagements are keyed by organisation number, but an errand references an organisation by its
 * LegalEntity guid — the party id it carries as the primary stakeholder's externalId. This is the
 * lookup between the two.
 */
export const getOrganizationPartyId = async (organizationNumber: string, req: Sender, api: LegalEntityApi = defaultApi): Promise<string> => {
  const url = `${legalEntityBase}/${MUNICIPALITY_ID}/${organizationNumber}/guid`;
  const res = await api.get<string>({ url }, req);

  if (typeof res.data !== 'string' || res.data === '') {
    throw new HttpException(502, 'Invalid guid response from LegalEntity API');
  }

  return res.data;
};

/** Organisations the citizen is registered in directly. */
export const getPersonEngagements = async (personNumber: string, req: Sender, api: LegalEntityApi = defaultApi): Promise<PersonEngagement[]> => {
  const url = `${legalEntityBase}/${MUNICIPALITY_ID}/engagements/person/${personNumber}`;
  const res = await api.get<PersonEngagement[]>({ url }, req);

  return res.data ?? [];
};

/**
 * Organisations that granted the citizen a mandate. These do not appear among the person's own
 * engagements, but they carry the same right to act for the organisation.
 */
export const getMandateEngagements = async (partyId: string, req: Sender, api: LegalEntityApi = defaultApi): Promise<PersonEngagement[]> => {
  const url = `${myRepresentativesBase}/${MUNICIPALITY_ID}/${NAMESPACE}/mandates`;
  const res = await api.get<Mandates>({ url, params: { granteePartyId: partyId } }, req);

  const mandates = (res.data?.mandateDetailsList ?? []).filter((mandate): mandate is MandateDetails & { grantorDetails: GrantorDetails } =>
    Boolean(mandate.grantorDetails),
  );

  // The mandate names the grantor by party id only, so each one costs a LegalEntity read to get
  // the organisation behind it. allSettled: one unreadable grantor must not drop the rest.
  const results = await Promise.allSettled(
    mandates.map(async (mandate): Promise<PersonEngagement> => {
      const grantorUrl = `${legalEntityBase}/${MUNICIPALITY_ID}/${mandate.grantorDetails.grantorPartyId}`;
      const grantor = await api.get<LegalEntity2>({ url: grantorUrl }, req);

      return {
        organizationNumber: grantor.data?.organizationNumber ?? '',
        name: grantor.data?.name ?? '',
        isAuthorizedSignatory: false,
      };
    }),
  );

  const rejected = results.filter(result => result.status === 'rejected').length;
  if (rejected > 0) {
    logger.warn(`Could not read ${rejected} of ${mandates.length} mandate grantors; those organizations are left out`);
  }

  return results.filter((result): result is PromiseFulfilledResult<PersonEngagement> => result.status === 'fulfilled').map(result => result.value);
};

const dedupeByOrganizationNumber = (engagements: PersonEngagement[]): PersonEngagement[] => {
  const seen = new Set<string>();

  return engagements.filter(engagement => {
    const organizationNumber = engagement.organizationNumber;
    if (!organizationNumber || seen.has(organizationNumber)) {
      return false;
    }
    seen.add(organizationNumber);
    return true;
  });
};

/**
 * Every organisation the citizen may act for — their own engagements plus any granted by mandate —
 * each resolved to the party id that errands are scoped by.
 *
 * An organisation whose party id cannot be resolved is dropped rather than failing the whole call:
 * one unresolvable engagement must not lock the citizen out of the others. Dropping narrows the
 * scope and never widens it, but it is logged, because it silently hides that organisation's
 * errands.
 */
export const getMyOrganizations = async (
  personNumber: string,
  partyId: string,
  req: Sender,
  api: LegalEntityApi = defaultApi,
): Promise<OrganizationDTO[]> => {
  const [personEngagements, mandateEngagements] = await Promise.all([
    getPersonEngagements(personNumber, req, api).catch((error: unknown) => {
      logger.error('Could not read the citizen engagements', error);
      return [] as PersonEngagement[];
    }),
    getMandateEngagements(partyId, req, api).catch((error: unknown) => {
      logger.error('Could not read the mandate engagements', error);
      return [] as PersonEngagement[];
    }),
  ]);

  const engagements = dedupeByOrganizationNumber([...personEngagements, ...mandateEngagements]);

  const organizations = await Promise.all(
    engagements.map(async (engagement): Promise<OrganizationDTO | undefined> => {
      const organizationNumber = engagement.organizationNumber ?? '';

      try {
        return {
          partyId: await getOrganizationPartyId(organizationNumber, req, api),
          organizationNumber,
          organizationName: engagement.name ?? '',
          isAuthorizedSignatory: engagement.isAuthorizedSignatory ?? false,
        };
      } catch (error) {
        logger.warn(`Could not resolve a party id for organization ${organizationNumber}; leaving it out of the citizen's organizations`);
        logger.debug(error);
        return undefined;
      }
    }),
  );

  return organizations.filter((organization): organization is OrganizationDTO => organization !== undefined);
};
