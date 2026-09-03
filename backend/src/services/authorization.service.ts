// import { AUTHORIZED_GROUPS } from '@/config';
import { ADRole, InternalRole, Permissions } from '@interfaces/auth.interface';

import { AUTHORIZED_GROUPS } from '@/config';

export function authorizeGroups(groups: string) {
  const authorizedGroupsList = (AUTHORIZED_GROUPS ?? '').split(',');
  const groupsList = groups.split(',').map((g: string) => g.toLowerCase());
  return authorizedGroupsList.some(authorizedGroup => groupsList.includes(authorizedGroup.toLowerCase()));
}

export const defaultPermissions: () => Permissions = () => ({
  canEditSystemMessages: false,
});

enum RoleOrderEnum {
  app_read,
  app_admin,
}

const roles = new Map<InternalRole, Partial<Permissions>>([
  [
    'app_admin',
    {
      canEditSystemMessages: true,
    },
  ],
  ['app_read', {}],
]);

type RoleADMapping = Record<ADRole, InternalRole>;
const roleADMapping: RoleADMapping = {
  sg_appl_app_read: 'app_read',
  sg_appl_app_admin: 'app_admin',
};
// An unknown key (a group outside the mapping) must yield undefined, hence the wider type.
const roleADMappingLookup: Partial<Record<string, InternalRole>> = roleADMapping;

/**
 *
 * @param groups Array of groups/roles
 * @param internalGroups Whether to use internal groups or external group-mappings
 * @returns collected permissions for all matching role groups
 */
export const getPermissions = (groups: string[], internalGroups = false): Permissions => {
  const permissions: Permissions = defaultPermissions();
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = internalGroups ? (groupLower as InternalRole) : roleADMappingLookup[groupLower];
    if (role === undefined) return;
    const groupPermissions = roles.get(role);
    if (!groupPermissions) return;
    (Object.keys(groupPermissions) as (keyof Permissions)[]).forEach(permission => {
      if (groupPermissions[permission] === true) {
        permissions[permission] = true;
      }
    });
  });
  return permissions;
};

/**
 * Ensures to return only the role with most permissions
 * @param groups List of AD roles
 * @returns role with most permissions
 */
export const getRole = (groups: string[]): InternalRole | undefined => {
  const [firstGroup] = groups;
  if (groups.length == 1 && firstGroup !== undefined) return roleADMapping[firstGroup as ADRole]; // app_read

  const roles: InternalRole[] = [];
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = roleADMappingLookup[groupLower];
    if (role) {
      roles.push(role);
    }
  });

  return roles.sort((a, b) => (RoleOrderEnum[a] > RoleOrderEnum[b] ? 1 : 0))[0];
};
