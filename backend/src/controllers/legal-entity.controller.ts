import { Controller, Get, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { MyOrganizationsDTO } from '@/responses/legal-entity.response';

@Controller()
export class LegalEntityController {
  /**
   * Served from the session rather than read again from LegalEntity, so the organisations the
   * citizen is offered are the same ones the errand endpoints scope by. Re-reading could hand
   * back an organisation the session does not carry, and an errand filed for it would come back
   * 404 on the very next read.
   */
  @Get('/my-organizations')
  @OpenAPI({ summary: 'Organizations the logged in citizen may act for' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MyOrganizationsDTO)
  myOrganizations(@Req() req: RequestWithUser): MyOrganizationsDTO {
    const organizations = req.session.representingBusinessChoices;

    // Resolved at login. Absent means the lookup failed, which must read as a failure rather than
    // as "belongs to nothing" — the same fail-closed rule the errand endpoints apply.
    if (organizations === undefined) {
      throw new HttpException(403, 'No organizations in session');
    }

    return { organizations };
  }
}
