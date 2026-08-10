import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

import ApiResponse from '@/interfaces/api-service.interface';
import { ClientUser } from '@/interfaces/users.interface';

// export class Permissions implements IPermissions {
//   @IsBoolean()
//   canEditSystemMessages: boolean;
// }

export class User implements ClientUser {
  @IsString()
  name!: string;
  @IsString()
  username!: string;
  @IsString()
  initials!: string;
  // @IsEnum(InternalRoleEnum)
  // role: InternalRole;
  // @ValidateNested()
  // @Type(() => Permissions)
  // permissions: Permissions;
}

export class UserApiResponse implements ApiResponse<User> {
  @ValidateNested()
  @Type(() => User)
  data!: User;
  @IsString()
  message!: string;
}
