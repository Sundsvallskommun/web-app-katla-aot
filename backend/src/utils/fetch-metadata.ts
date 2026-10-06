import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { MetadataResponse } from '@/data-contracts/support-management-alkt-sprint/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@/services/api.service';

export async function fetchMetadata(apiService: ApiService, apiBase: string, req: RequestWithUser): Promise<MetadataResponse> {
  const url = `${apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/metadata`;
  const res = await apiService.get<MetadataResponse>({ url }, req);
  if (!res.data) throw new HttpException(502, 'Invalid response when reading metadata');

  return res.data;
}
