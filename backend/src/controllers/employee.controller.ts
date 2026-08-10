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
import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class EmployeeController {
  private apiService = new ApiService();
  private apiBase = getApiBase('employee');
  private citizenBase = getApiBase('citizen');

  @Get('/employee/personal/:username')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  async getErrand(@Req() req: RequestWithUser, @Param('username') username: string): Promise<StakeholderDTO> {
    const personDataurl = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${username}`;

    try {
      const personDataRes = await this.apiService.get<PortalPersonData>({ url: personDataurl }, req);

      if (!personDataRes.data) throw new HttpException(500, 'No data from API');

      const employmentsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employments?PersonId=${personDataRes.data.personid}`;
      const employmentsRes = await this.apiService.get<Employeev2[]>({ url: employmentsUrl }, req);

      if (!employmentsRes.data) throw new HttpException(500, 'No data from API');

      const mainEmployment = employmentsRes.data[0].employments.find(e => e.isMainEmployment === true);

      const stakeholder: StakeholderDTO = {
        externalId: personDataRes.data.personid,
        city: personDataRes.data.city,
        firstName: personDataRes.data.givenname,
        lastName: personDataRes.data.lastname,
        address: personDataRes.data.address,
        zipCode: personDataRes.data.postalCode,
        emails: [personDataRes.data.email?.toLocaleLowerCase()],
        phoneNumbers: [personDataRes.data.workPhone ?? personDataRes.data.mobilePhone ?? personDataRes.data.extraMobilePhone],
        title: mainEmployment.title,
        department: mainEmployment.orgName,
      };

      return stakeholder;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      return null;
    }
  }

  @Get('/employee/personnumber/:personNumber')
  @OpenAPI({ summary: 'Get employee stakeholder using personNumber via citizen and employee APIs' })
  @UseBefore(authMiddleware)
  async getEmployeeByPersonNumber(@Req() req: RequestWithUser, @Param('personNumber') personNumber: string): Promise<StakeholderDTO> {
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
      const mainEmployment = employmentsRes.data?.[0]?.employments?.find(e => e.isMainEmployment === true);

      const stakeholder: StakeholderDTO = {
        externalId: personDataRes.data.personid,
        firstName: personDataRes.data.givenname,
        lastName: personDataRes.data.lastname,
        address: personDataRes.data.address,
        city: personDataRes.data.city,
        zipCode: personDataRes.data.postalCode,
        personNumber: addHyphenToPersonNumber(personNumber),
        emails: [personDataRes.data.email?.toLocaleLowerCase()],
        phoneNumbers: [personDataRes.data.workPhone ?? personDataRes.data.mobilePhone ?? personDataRes.data.extraMobilePhone],
        title: mainEmployment?.title,
        department: mainEmployment?.orgName,
      };

      return stakeholder;
    } catch (error: any) {
      console.error('getEmployeeByPersonNumber failed at:', error.message, 'status:', error.status);
      if (error.status === 404) {
        return null;
      }
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
      if (employees.length === 0 || !employees[0]?.employments) {
        return [];
      }

      // Map employments to DTOs, sorted with main employment first
      const employments: UserEmploymentDTO[] = employees[0].employments
        .filter((emp: Employment) => emp.orgId && emp.orgName)
        .map((emp: Employment) => ({
          orgId: emp.orgId,
          orgName: emp.orgName,
          topOrgId: emp.topOrgId,
          isMainEmployment: emp.isMainEmployment,
          manager: emp.manager
            ? {
                personId: emp.manager.personId,
                givenname: emp.manager.givenname,
                lastname: emp.manager.lastname,
                emailAddress: emp.manager.emailAddress,
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
    } catch (error: any) {
      console.error('Failed to get employments:', error);
      return [];
    }
  }
}
