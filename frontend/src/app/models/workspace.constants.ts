import { WorkspaceSettings , WorkspacePermissions } from './workspace.model';
export const WORKSPACE_ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1
} as const;

export const WORKSPACE_ROLE_NAMES = {
  owner: 'Owner',
  admin: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer'
} as const;

export const WORKSPACE_ROLE_DESCRIPTIONS = {
  owner: 'Full control over workspace, including deletion',
  admin: 'Can manage members and settings',
  editor: 'Can create, edit, and delete documents',
  viewer: 'Can only view documents'
} as const;

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  aiCreditsShared: true,
  allowPublicSharing: false,
  defaultDocumentStatus: 'draft',
  allowGuestComments: false,
  requireApproval: false
};

export const WORKSPACE_ICONS = [
  '📁', '💼', '🏢', '🎯', '🚀', '💡', '📚', '🎨',
  '🔬', '⚡', '🌟', '🎭', '🏆', '🔥', '✨', '🌈'
];

export const ROLE_PERMISSIONS: Record<string, WorkspacePermissions> = {
  owner: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canManageMembers: true,
    canManageSettings: true,
    canDeleteWorkspace: true
  },
  admin: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canManageMembers: true,
    canManageSettings: true,
    canDeleteWorkspace: false
  },
  editor: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canInvite: false,
    canManageMembers: false,
    canManageSettings: false,
    canDeleteWorkspace: false
  },
  viewer: {
    canView: true,
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canManageMembers: false,
    canManageSettings: false,
    canDeleteWorkspace: false
  }
};
