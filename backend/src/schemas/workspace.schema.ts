import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(100, 'Name must be less than 100 characters'),
    icon: z.string().optional(),
    description: z.string().max(500).optional(),
    settings: z
      .object({
        aiCreditsShared: z.boolean().optional(),
        allowPublicSharing: z.boolean().optional(),
        defaultDocumentStatus: z.enum(['draft', 'published']).optional(),
        allowGuestComments: z.boolean().optional(),
        requireApproval: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    icon: z.string().optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    settings: z
      .object({
        aiCreditsShared: z.boolean().optional(),
        allowPublicSharing: z.boolean().optional(),
        defaultDocumentStatus: z.enum(['draft', 'published']).optional(),
        allowGuestComments: z.boolean().optional(),
        requireApproval: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const workspaceIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['admin', 'editor', 'viewer']),
    message: z.string().max(500).optional(),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    role: z.enum(['admin', 'editor', 'viewer']),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export const leaveWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>['body'];
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>['body'];
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>['body'];
