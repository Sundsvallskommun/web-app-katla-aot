import { MyOrganizationsDTO, OrganizationDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

/**
 * The organisations the logged-in citizen may act for. The backend answers from the session, so
 * this is the same list the errand endpoints scope by — a choice made here is one the errand can
 * be filed and read back under.
 */
export const getMyOrganizations = async (): Promise<OrganizationDTO[]> => {
  return apiService.get<MyOrganizationsDTO>('my-organizations').then((res) => res.data.organizations);
};
