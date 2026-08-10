import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Account, Employeev2, Employment, PortalPersonData } from '@/data-contracts/employee/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { UserEmploymentDTO } from '@/responses/employee.response';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { addHyphenToPersonNumber } from '@/utils/stakeholder-mapping';

@Controller()
export class EmployeeController {
  private apiService = new ApiService();
  private apiBase = getApiBase('employee');
  private citizenBase = getApiBase('citizen');

  @Get('/employee/personal/:username')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  async getErrand(@Req() req: RequestWithUser, @Param('username') username: string): Promise<StakeholderDTO | null> {
    const personDataurl = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${username}`;

    try {
      const personDataRes = await this.apiService.get<PortalPersonData>({ url: personDataurl }, req);

      if (!personDataRes.data) throw new HttpException(500, 'No data from API');

      const employmentsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employments?PersonId=${personDataRes.data.personid}`;
      const employmentsRes = await this.apiService.get<Employeev2[]>({ url: employmentsUrl }, req);

      if (!employmentsRes.data) throw new HttpException(500, 'No data from API');

      const mainEmployment = employmentsRes.data[0]?.employments?.find(e => e.isMainEmployment);
      if (!mainEmployment) throw new HttpException(500, 'No main employment found');

      const email = personDataRes.data.email;
      const phoneNumber = personDataRes.data.workPhone ?? personDataRes.data.mobilePhone ?? personDataRes.data.extraMobilePhone;

      const stakeholder: StakeholderDTO = {
        externalId: personDataRes.data.personid,
        city: personDataRes.data.city ?? undefined,
        firstName: personDataRes.data.givenname ?? undefined,
        lastName: personDataRes.data.lastname ?? undefined,
        address: personDataRes.data.address ?? undefined,
        zipCode: personDataRes.data.postalCode ?? undefined,
        emails: email ? [email.toLocaleLowerCase()] : undefined,
        phoneNumbers: phoneNumber ? [phoneNumber] : undefined,
        title: mainEmployment.title ?? undefined,
        department: mainEmployment.orgName ?? undefined,
      };

      return stakeholder;
    } catch {
      return null;
    }
  }

  @Get('/employee/personnumber/:personNumber')
  @OpenAPI({ summary: 'Get employee stakeholder using personNumber via citizen and employee APIs' })
  @UseBefore(authMiddleware)
  async getEmployeeByPersonNumber(@Req() req: RequestWithUser, @Param('personNumber') personNumber: string): Promise<StakeholderDTO | null> {
    try {
      const personIdUrl = `${this.citizenBase}/${MUNICIPALITY_ID}/${personNumber}/guid/`;
      const personIdRes = await this.apiService.get<string>({ url: personIdUrl }, req);
      const personId = personIdRes.data;
      if (!personId) throw new HttpException(500, 'No personId from Citizen API');

      const accountsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employed/${personId}/accounts`;
      const accountsRes = await this.apiService.get<Account[]>({ url: accountsUrl }, req);
      const loginname = accountsRes.data?.[0]?.loginname;
      if (!loginname) throw new HttpException(404, 'No loginname found for person');

      const personDataUrl = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${loginname}`;
      const personDataRes = await this.apiService.get<PortalPersonData>({ url: personDataUrl }, req);
      if (!personDataRes.data) throw new HttpException(500, 'No data from Employee API');

      const employmentsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employments?PersonId=${personDataRes.data.personid}`;
      const employmentsRes = await this.apiService.get<Employeev2[]>({ url: employmentsUrl }, req);
      const mainEmployment = employmentsRes.data?.[0]?.employments?.find(e => e.isMainEmployment);

      const email = personDataRes.data.email;
      const phoneNumber = personDataRes.data.workPhone ?? personDataRes.data.mobilePhone ?? personDataRes.data.extraMobilePhone;

      const stakeholder: StakeholderDTO = {
        externalId: personDataRes.data.personid,
        firstName: personDataRes.data.givenname ?? undefined,
        lastName: personDataRes.data.lastname ?? undefined,
        address: personDataRes.data.address ?? undefined,
        city: personDataRes.data.city ?? undefined,
        zipCode: personDataRes.data.postalCode ?? undefined,
        personNumber: addHyphenToPersonNumber(personNumber),
        emails: email ? [email.toLocaleLowerCase()] : undefined,
        phoneNumbers: phoneNumber ? [phoneNumber] : undefined,
        title: mainEmployment?.title ?? undefined,
        department: mainEmployment?.orgName ?? undefined,
      };

      return stakeholder;
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      const status = error instanceof HttpException ? error.status : undefined;
      console.error('getEmployeeByPersonNumber failed at:', message, 'status:', status);
      return null;
    }
  }

  @Get('/employee/employments')
  @OpenAPI({ summary: 'Get current user employments with organization info' })
  @UseBefore(authMiddleware)
  @ResponseSchema(UserEmploymentDTO)
  async getEmployments(@Req() req: RequestWithUser): Promise<UserEmploymentDTO[]> {
    try {
      // First, get the user's personId from portalpersondata
      const personalUrl = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${req.user.username}`;
      const personalRes = await this.apiService.get<PortalPersonData>({ url: personalUrl }, req);

      if (!personalRes.data?.personid) {
        console.error('Could not get personId for user');
        return [];
      }

      const personId = personalRes.data.personid;

      // Then fetch employments using personId
      const employmentsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employments?PersonId=${personId}`;
      const res = await this.apiService.get<Employeev2[]>({ url: employmentsUrl }, req);

      // The response is an array of Employeev2 objects
      const employees = res.data || [];
      const firstEmployee = employees[0];
      if (!firstEmployee?.employments) {
        return [];
      }

      // Map employments to DTOs, sorted with main employment first
      const employments: UserEmploymentDTO[] = firstEmployee.employments
        .filter((emp: Employment) => emp.orgId && emp.orgName)
        .map((emp: Employment) => ({
          orgId: emp.orgId,
          orgName: emp.orgName ?? undefined,
          topOrgId: emp.topOrgId,
          isMainEmployment: emp.isMainEmployment,
          manager: emp.manager
            ? {
                personId: emp.manager.personId,
                givenname: emp.manager.givenname ?? undefined,
                lastname: emp.manager.lastname ?? undefined,
                emailAddress: emp.manager.emailAddress ?? undefined,
              }
            : undefined,
        }))
        .sort((a: UserEmploymentDTO, b: UserEmploymentDTO) => {
          // Main employment first
          if (a.isMainEmployment && !b.isMainEmployment) return -1;
          if (!a.isMainEmployment && b.isMainEmployment) return 1;
          return 0;
        });

      return employments;
    } catch (error) {
      console.error('Failed to get employments:', error);
      return [];
    }
  }
}
