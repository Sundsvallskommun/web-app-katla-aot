import { Controller, Get, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { MyOrganizationsDTO } from '@/responses/legal-entity.response';
import { getMyOrganizations } from '@/services/legal-entity.service';

@Controller()
export class LegalEntityController {
  @Get('/my-organizations')
  @OpenAPI({ summary: 'Organizations the logged in citizen may act for' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MyOrganizationsDTO)
  async myOrganizations(@Req() req: RequestWithUser): Promise<MyOrganizationsDTO> {
    const { personNumber, partyId } = req.user;

    // Both are resolved at login. Without them the citizen's organisations cannot be established,
    // and guessing an empty list would read as "belongs to nothing" rather than as a failure.
    if (personNumber === undefined || partyId === undefined) {
      throw new HttpException(403, 'No citizen identity in session');
    }

    return { organizations: await getMyOrganizations(personNumber, partyId, req) };
  }
}
