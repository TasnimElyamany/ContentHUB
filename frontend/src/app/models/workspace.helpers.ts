import { WorkspaceMember, WorkspacePermissions } from './workspace.model';
import { WORKSPACE_ROLE_HIERARCHY, ROLE_PERMISSIONS } from './workspace.constants';


export function getPermissionsForRole(role: string): WorkspacePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['viewer'];
}


export function hasHigherRole(
  roleA: keyof typeof WORKSPACE_ROLE_HIERARCHY,
  roleB: keyof typeof WORKSPACE_ROLE_HIERARCHY
): boolean {
  return WORKSPACE_ROLE_HIERARCHY[roleA] >= WORKSPACE_ROLE_HIERARCHY[roleB];
}

export function getUserRole(
  members: WorkspaceMember[],
  userId: string,
  ownerId: string
): 'owner' | 'admin' | 'editor' | 'viewer' | null {
  if (userId === ownerId) {
    return 'owner';
  }

  const member = members.find(m => m.userId === userId);
  return member?.role || null;
}

export function canPerformAction(
  role: string | null,
  action: keyof WorkspacePermissions
): boolean {
  if (!role) return false;
  const permissions = getPermissionsForRole(role);
  return permissions[action] || false;
}


export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer'
  };
  return roleMap[role] || role;
}


export function getRoleColor(role: string): string {
  const colorMap: Record<string, string> = {
    owner: 'primary',
    admin: 'accent',
    editor: 'success',
    viewer: 'default'
  };
  return colorMap[role] || 'default';
}
