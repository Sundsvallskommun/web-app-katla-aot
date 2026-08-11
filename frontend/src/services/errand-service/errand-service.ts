import { ErrandDTO, MetadataResponseDTO, NotificationDTO, PageErrandDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

export interface ErrandQuery {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  statuses?: string[];
}

export const getErrandUsingErrandNumber = async (errandNumber: string): Promise<ErrandDTO> => {
  return apiService.get<ErrandDTO>(`supportmanagement/errand/${errandNumber}`).then((res) => res.data);
};

export const getErrands = async (q?: ErrandQuery): Promise<PageErrandDTO> => {
  const params: Record<string, string | number> = {};

  if (q?.statuses && q.statuses.length > 0) {
    params.status = q.statuses.join(',');
  }

  if (q?.page !== undefined) params.page = q.page;
  if (q?.size !== undefined) params.size = q.size;
  if (q?.sortColumn) {
    params.sort = `${q.sortColumn}%2C${q.sortOrder ?? 'desc'}`;
  }

  return apiService
    .get<PageErrandDTO>('supportmanagement/errands', {
      params: { ...params },
    })
    .then((res) => res.data);
};

export const getErrandsCount = async (q?: ErrandQuery): Promise<{ count: number }> => {
  const params: Record<string, string | number> = {};

  if (q?.statuses && q.statuses.length > 0) {
    params.status = q.statuses.join(',');
  }

  return apiService
    .get<{ count: number }>('supportmanagement/count', {
      params: { ...params },
    })
    .then((res) => res.data);
};

export const getMetadata = async (): Promise<MetadataResponseDTO> => {
  return apiService.get<MetadataResponseDTO>('supportmanagement/metadata').then((res) => res.data);
};

export const createErrand = async (errand: ErrandDTO): Promise<ErrandDTO> => {
  return apiService.post<ErrandDTO>('supportmanagement/errand/create', errand).then((res) => res.data);
};

export const updateErrand = async (id: string, errand: Partial<ErrandDTO>): Promise<ErrandDTO> => {
  return apiService.patch<ErrandDTO>(`supportmanagement/errand/${id}`, errand).then((res) => res.data);
};

export const saveErrand = async (errand: ErrandDTO): Promise<ErrandDTO> => {
  return apiService.patch<ErrandDTO>('supportmanagement/errand/save', errand).then((res) => res.data);
};

export const getNotifications = async (): Promise<NotificationDTO[]> => {
  return apiService.get<NotificationDTO[]>('supportmanagement/notifications').then((res) => res.data);
};

export const acknowledgeNotification: (notification: NotificationDTO) => Promise<boolean> = (notification) => {
  if (!notification.id) {
    return Promise.reject(new Error('Missing id on notification'));
  }
  const data = [{ ...notification, acknowledged: true }];
  return apiService
    .patch<boolean>(`supportmanagement/notifications`, data)
    .then(() => {
      return true;
    })
    .catch((e: unknown) => {
      console.error('Something went wrong when acknowledging notification');
      throw e;
    });
};

export const upsertErrand = async (errand: ErrandDTO): Promise<ErrandDTO> => {
  return errand.id ? saveErrand(errand) : createErrand(errand);
};
