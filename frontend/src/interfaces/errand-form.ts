import { ErrandDTO } from '@data-contracts/backend/data-contracts';

export interface ErrandFormDataItem {
  schemaName: string;
  schemaId?: string;
  data: string; // JSON string
}

/**
 * A bilaga on the form. `file` is set while the attachment is still only in the browser: the
 * errand has to exist before SupportManagement will take an upload, so files picked during
 * registration are held here and sent once the errand has an id. `id` is set for the ones that
 * have been stored upstream.
 */
export interface ErrandFormAttachment {
  id?: string;
  /** Key from ATTACHMENT_TYPES, chosen by the user. */
  category?: string;
  fileName: string;
  mimeType?: string;
  created?: string;
  file?: File;
}

export interface ErrandFormDTO extends ErrandDTO {
  errandFormData?: ErrandFormDataItem[];
  attachments?: ErrandFormAttachment[];
}
