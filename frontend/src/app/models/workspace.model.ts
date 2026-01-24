import { User } from './user.model';

export interface Workspace {
  _id: string;
  name: string;
  icon?: string;
  description?: string;
  owner: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  stats?: WorkspaceStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  user?: User;
}

// workspace settings
export interface WorkspaceSettings {
  aiCreditsShared: boolean;
  allowPublicSharing: boolean;
  defaultDocumentStatus: 'draft' | 'published';
  allowGuestComments: boolean;
  requireApproval: boolean; // publishing approval
}


export interface WorkspaceStats {
  totalDocuments: number;
  totalMembers: number;
  aiCreditsUsed: number;
  documentsCreatedThisMonth: number;
  activeMembers: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  icon?: string;
  description?: string;
  settings?: Partial<WorkspaceSettings>;
}


export interface UpdateWorkspaceRequest {
  name?: string;
  icon?: string;
  description?: string;
  settings?: Partial<WorkspaceSettings>;
}


export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  message?: string;
}


export interface UpdateMemberRoleRequest {
  role: 'admin' | 'editor' | 'viewer';
}

export interface WorkspaceWithDetails extends Workspace {
  ownerDetails?: User;
  memberDetails?: (WorkspaceMember & { user: User })[];
  recentDocuments?: any[];
}


export interface WorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canDeleteWorkspace: boolean;
}


export interface WorkspaceInvitation {
  _id: string;
  workspaceId: string;
  workspace?: Workspace;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  invitedByUser?: User;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface WorkspaceActivity {
  _id: string;
  workspaceId: string;
  userId: string;
  user?: User;
  action: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed' | 'role_changed' | 'settings_updated';
  description: string;
  metadata?: any;
  createdAt: Date;
}
