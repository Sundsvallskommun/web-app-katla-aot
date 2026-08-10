import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { getApiBase } from '@/config/api-config';
import { OrganizationTree } from '@/data-contracts/company/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { OrgLeafNodeDTO, OrgTreeNodeDTO } from '@/responses/organization.response';
import ApiService from '@/services/api.service';

@Controller()
export class OrganizationController {
  private apiService = new ApiService();
  private apiBase = getApiBase('company');
  private municipalityId = process.env.MUNICIPALITY_ID;

  @Get('/organization/:orgId/orgtree')
  @OpenAPI({ summary: 'Get organization tree from orgId' })
  @UseBefore(authMiddleware)
  @ResponseSchema(OrgTreeNodeDTO)
  async getOrgTree(@Req() req: RequestWithUser, @Param('orgId') orgId: number): Promise<OrganizationTree | null> {
    const url = `${this.apiBase}/${this.municipalityId}/${orgId}/orgtree`;

    try {
      const res = await this.apiService.get<OrganizationTree>({ url }, req);
      return res.data || null;
    } catch {
      return null;
    }
  }

  @Get('/organization/:orgId/leafnodes')
  @OpenAPI({ summary: 'Get leaf nodes from organization tree' })
  @UseBefore(authMiddleware)
  @ResponseSchema(OrgLeafNodeDTO)
  async getLeafNodes(@Req() req: RequestWithUser, @Param('orgId') orgId: number): Promise<OrgLeafNodeDTO[]> {
    const tree = await this.getOrgTree(req, orgId);
    if (!tree) return [];

    return this.flattenToLeafNodes(tree);
  }

  private flattenToLeafNodes(node: OrganizationTree): OrgLeafNodeDTO[] {
    const leafNodes: OrgLeafNodeDTO[] = [];

    const traverse = (n: OrganizationTree) => {
      if (n.isLeafLevel && n.orgId && n.orgName) {
        leafNodes.push({
          orgId: n.orgId,
          orgName: n.orgName,
          parentId: n.parentId ?? undefined,
        });
      }
      if (n.organizations) {
        n.organizations.forEach(traverse);
      }
    };

    traverse(node);
    return leafNodes;
  }
}
