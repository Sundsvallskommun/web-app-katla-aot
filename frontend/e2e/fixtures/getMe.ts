import type { User } from '@data-contracts/backend/data-contracts';
import type { ApiResponse } from '@services/api-service';

export const getMe: ApiResponse<User> = {
  data: {
    username: 'username',
    name: 'Förnamn Efternamn',
    initials: 'FE',
  },
  message: 'success',
};
