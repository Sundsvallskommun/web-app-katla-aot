import type { ErrandFormAttachment } from '@interfaces/errand-form';
import { apiService } from '@services/api-service';

export interface ErrandAttachmentDTO {
  id: string;
  fileName: string;
  mimeType?: string;
  created?: string;
}

/** Mirrors the backend's multer limit; checked here so an oversized file never leaves the browser. */
export const MAX_ATTACHMENT_SIZE_MB = 50;

export const getErrandAttachments = async (errandId: string): Promise<ErrandAttachmentDTO[]> =>
  apiService.get<ErrandAttachmentDTO[]>(`supportmanagement/errand/${errandId}/attachments`).then((res) => res.data);

export const uploadErrandAttachment = async (errandId: string, file: File, category?: string): Promise<void> => {
  const formData = new FormData();
  formData.append('files', file, file.name);
  if (category) formData.append('category', category);

  // Empty headers so axios sets multipart/form-data with its own boundary; the shared default of
  // application/json would make the upload unparsable upstream.
  await apiService.post(`supportmanagement/errand/${errandId}/attachments`, formData, { headers: {} });
};

export const deleteErrandAttachment = async (errandId: string, attachmentId: string): Promise<void> => {
  await apiService.delete(`supportmanagement/errand/${errandId}/attachments/${attachmentId}`);
};

export const downloadErrandAttachment = async (errandId: string, attachmentId: string): Promise<Blob> =>
  apiService
    .get<Blob>(`supportmanagement/errand/${errandId}/attachments/${attachmentId}`, { responseType: 'blob' })
    .then((res) => res.data);

/**
 * SupportManagement takes an attachment only for an errand that exists, so files picked during
 * registration wait in form state and are sent once the errand has an id. Uploads run one at a
 * time: the first failure stops the rest, and the files it did not reach are still in form state.
 */
export async function uploadPendingAttachments(
  errandId: string,
  attachments: ErrandFormAttachment[] | undefined
): Promise<void> {
  for (const attachment of attachments ?? []) {
    if (!attachment.file) continue;
    await uploadErrandAttachment(errandId, attachment.file, attachment.category);
  }
}
