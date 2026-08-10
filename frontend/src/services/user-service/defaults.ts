import { User } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

// export const defaultPermissions: Permissions = {
//     canEditSystemMessages: false,
// };

export const emptyUser: User = {
  name: '',
  username: '',
  initials: '',
  //   permissions: defaultPermissions,
};

export const emptyUserResponse: ApiResponse<User> = {
  data: emptyUser,
  message: 'none',
};
