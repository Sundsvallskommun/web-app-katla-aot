// Bilagor follow the errand's own access rules: reading is scoped by the session's organisations,
// writing to the citizen who registered the errand. These drive the controller directly with the
// session and the upstream answer each case needs.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportManagementAttachmentController } from '@/controllers/supportmanagement-attachment.controller';
import { CreateErrandAttachmentDTO } from '@/responses/supportmanagement-attachment.response';

import {
  mockCitizenPartyId,
  mockErrandId,
  mockForeignOrganizationPartyId,
  mockOrganizationPartyId,
  mockOtherCitizenPartyId,
} from './helpers/mock-data';

const { get, post, deleteRequest } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), deleteRequest: vi.fn() }));

vi.mock('@/services/api.service', () => ({
  default: class {
    get = get;
    post = post;
    delete = deleteRequest;
    patch = vi.fn();
    put = vi.fn();
  },
}));

const representing = (partyId: string) => ({ partyId, organizationNumber: `nr-${partyId}`, organizationName: `Org ${partyId}` });

const requestAs = (partyId: string, organizationPartyIds: string[] = [mockOrganizationPartyId]) =>
  ({
    user: { partyId },
    session: { representingBusinessChoices: organizationPartyIds.map(representing) },
  }) as never;

const upstreamErrand = (reporterUserId: string, organizationPartyId: string) => {
  get.mockResolvedValue({
    data: { id: mockErrandId, reporterUserId, stakeholders: [{ role: 'PRIMARY', externalId: organizationPartyId }] },
  });
};

const pdf = (): Express.Multer.File => ({ originalname: 'planritning.pdf', buffer: Buffer.from('%PDF') }) as Express.Multer.File;

const attachmentDto = (category?: string): CreateErrandAttachmentDTO => ({ category });

/**
 * The multipart body the upstream call was handed, as field name to value. form-data keeps each
 * part as a header entry followed by its value entry, so the value is the entry after the header.
 */
const uploadedFields = (): Record<string, string> => {
  const data = (post.mock.calls[0]?.[0] as { data: { _streams: unknown[] } }).data;
  const fields: Record<string, string> = {};

  data._streams.forEach((stream, index) => {
    if (typeof stream !== 'string') return;
    const name = /name="([^"]+)"/.exec(stream)?.[1];
    if (!name) return;
    const value = data._streams[index + 1];
    fields[name] = typeof value === 'string' ? value : String(value);
  });

  return fields;
};

/** Every part header of the multipart body, joined — where the file name is declared. */
const uploadedHeaders = (): string => {
  const data = (post.mock.calls[0]?.[0] as { data: { _streams: unknown[] } }).data;
  return data._streams.filter((stream): stream is string => typeof stream === 'string').join('\n');
};

describe('errand attachment access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({ data: {} });
    deleteRequest.mockResolvedValue({ data: {} });
  });

  it('uploads to an errand the citizen registered', async () => {
    upstreamErrand(mockCitizenPartyId, mockOrganizationPartyId);

    await new SupportManagementAttachmentController().createAttachment(requestAs(mockCitizenPartyId), mockErrandId, [pdf()], attachmentDto());

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('refuses to attach to an errand another citizen registered, without reaching upstream', async () => {
    upstreamErrand(mockOtherCitizenPartyId, mockOrganizationPartyId);

    await expect(
      new SupportManagementAttachmentController().createAttachment(requestAs(mockCitizenPartyId), mockErrandId, [pdf()], attachmentDto()),
    ).rejects.toMatchObject({ status: 403 });
    expect(post).not.toHaveBeenCalled();
  });

  it('refuses to delete from an errand another citizen registered', async () => {
    upstreamErrand(mockOtherCitizenPartyId, mockOrganizationPartyId);

    await expect(
      new SupportManagementAttachmentController().deleteAttachment(requestAs(mockCitizenPartyId), mockErrandId, 'attachment-id'),
    ).rejects.toMatchObject({ status: 403 });
    expect(deleteRequest).not.toHaveBeenCalled();
  });

  it('rejects a request whose file the upload filter dropped', async () => {
    upstreamErrand(mockCitizenPartyId, mockOrganizationPartyId);

    await expect(
      new SupportManagementAttachmentController().createAttachment(requestAs(mockCitizenPartyId), mockErrandId, [], attachmentDto()),
    ).rejects.toMatchObject({ status: 400 });
    expect(post).not.toHaveBeenCalled();
  });

  // The bilagetyp is collected and validated in the client, but SupportManagement has no field for
  // it yet. Sending one anyway is what this guards against; see UPSTREAM_CATEGORY_FIELD.
  it('sends the file and the channel upstream, and not the category', async () => {
    upstreamErrand(mockCitizenPartyId, mockOrganizationPartyId);

    await new SupportManagementAttachmentController().createAttachment(
      requestAs(mockCitizenPartyId),
      mockErrandId,
      [pdf()],
      attachmentDto('bifogaPlanritning'),
    );

    const fields = uploadedFields();
    expect(Object.keys(fields)).toEqual(['errandAttachment', 'channel']);
    expect(uploadedHeaders()).toContain('filename="planritning.pdf"');
    expect(fields.channel).toBe('ESERVICE');
  });

  it('lists the attachments of an errand belonging to a session organisation', async () => {
    upstreamErrand(mockOtherCitizenPartyId, mockOrganizationPartyId);
    get.mockResolvedValueOnce({
      data: { id: mockErrandId, reporterUserId: mockOtherCitizenPartyId, stakeholders: [{ role: 'PRIMARY', externalId: mockOrganizationPartyId }] },
    });
    get.mockResolvedValueOnce({ data: [{ id: 'attachment-id', fileName: 'planritning.pdf' }] });

    // A colleague in the same organisation reads it even though someone else registered it.
    const attachments = await new SupportManagementAttachmentController().getAttachments(requestAs(mockCitizenPartyId), mockErrandId);

    expect(attachments).toHaveLength(1);
  });

  it('answers 404 for an errand outside the session organisations', async () => {
    upstreamErrand(mockCitizenPartyId, mockForeignOrganizationPartyId);

    await expect(new SupportManagementAttachmentController().getAttachments(requestAs(mockCitizenPartyId), mockErrandId)).rejects.toMatchObject({
      status: 404,
    });
  });
});
