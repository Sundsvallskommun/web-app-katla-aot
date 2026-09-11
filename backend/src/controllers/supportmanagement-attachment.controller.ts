import { Response } from 'express';
import FormData from 'form-data';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, Res, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { ErrandAttachment, ErrandAttachmentChannelEnum } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { CreateErrandAttachmentDTO, ErrandAttachmentDTO } from '@/responses/supportmanagement-attachment.response';
import ApiService from '@/services/api.service';
import { assertErrandOwnedByUser, assertErrandReadableByUser } from '@/utils/errand-access';
import { fileUploadOptions } from '@/utils/file-upload-options';
import { apiURL } from '@/utils/util';

/**
 * SupportManagement stores an attachment as a file name and nothing else — there is no category
 * on the model yet. The category the citizen picked travels all the way down here and is dropped
 * at the upstream call; name the form-data field here when it exists, and the bilagetyp is filed
 * with the document instead of only validated on the way in.
 */
const UPSTREAM_CATEGORY_FIELD: string | null = null;

@Controller()
export class SupportManagementAttachmentController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  private attachmentsUrl(id: string): string {
    return `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${id}/attachments`;
  }

  @Get('/supportmanagement/errand/:id/attachments')
  @OpenAPI({ summary: 'List the attachments on an errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandAttachmentDTO, { isArray: true })
  async getAttachments(@Req() req: RequestWithUser, @Param('id') id: string): Promise<ErrandAttachment[]> {
    await assertErrandReadableByUser(this.apiService, this.apiBase, id, req);

    const res = await this.apiService.get<ErrandAttachment[]>({ baseURL: apiURL(this.apiBase), url: this.attachmentsUrl(id) }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading attachments');

    return res.data;
  }

  @Get('/supportmanagement/errand/:id/attachments/:attachmentId')
  @OpenAPI({ summary: 'Download one attachment' })
  @UseBefore(authMiddleware)
  async getAttachment(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ): Promise<Response> {
    await assertErrandReadableByUser(this.apiService, this.apiBase, id, req);

    const res = await this.apiService.get<Buffer>(
      { baseURL: apiURL(this.apiBase), url: `${this.attachmentsUrl(id)}/${attachmentId}`, responseType: 'arraybuffer' },
      req,
    );

    // Served back as an opaque download: the file came from a citizen, so it must never be
    // rendered inline in the app's own origin.
    return response.setHeader('Content-Type', 'application/octet-stream').setHeader('Content-Disposition', 'attachment').send(res.data);
  }

  @Post('/supportmanagement/errand/:id/attachments')
  @HttpCode(201)
  @OpenAPI({ summary: 'Attach a file to an errand' })
  @UseBefore(authMiddleware)
  async createAttachment(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @UploadedFiles('files', { options: fileUploadOptions, required: false }) files: Express.Multer.File[],
    @Body() attachment: CreateErrandAttachmentDTO,
  ): Promise<{ message: string }> {
    await assertErrandOwnedByUser(this.apiService, this.apiBase, id, req);

    const file = files?.[0];
    // The file filter rejects a disallowed type by dropping it, which leaves no file here.
    if (!file) throw new HttpException(400, 'No file of an accepted type in the request');

    const data = new FormData();
    data.append('errandAttachment', file.buffer, { filename: file.originalname });
    data.append('channel', ErrandAttachmentChannelEnum.ESERVICE);
    if (UPSTREAM_CATEGORY_FIELD && attachment.category) data.append(UPSTREAM_CATEGORY_FIELD, attachment.category);

    await this.apiService.post(
      {
        baseURL: apiURL(this.apiBase),
        url: this.attachmentsUrl(id),
        data,
        headers: { 'Content-Type': data.getHeaders()['content-type'] as string },
        propagateClientError: true,
      },
      req,
    );

    return { message: 'success' };
  }

  @Delete('/supportmanagement/errand/:id/attachments/:attachmentId')
  @OpenAPI({ summary: 'Remove an attachment from an errand' })
  @UseBefore(authMiddleware)
  async deleteAttachment(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<{ message: string }> {
    await assertErrandOwnedByUser(this.apiService, this.apiBase, id, req);

    await this.apiService.delete(
      { baseURL: apiURL(this.apiBase), url: `${this.attachmentsUrl(id)}/${attachmentId}`, propagateClientError: true },
      req,
    );

    return { message: 'success' };
  }
}
