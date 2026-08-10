import { PageErrandDTO } from '@data-contracts/backend/data-contracts';

export const mockEmptyErrands: PageErrandDTO = {
  content: [],
  pageable: {
    pageNumber: 0,
    pageSize: 12,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalElements: 0,
  totalPages: 0,
  size: 12,
  number: 0,
  first: true,
  numberOfElements: 0,
  empty: true,
};
