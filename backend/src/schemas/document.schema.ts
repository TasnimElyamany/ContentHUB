import { z } from 'zod';

export const createDocumentSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters'),
    workspaceId: z.string().optional(),
    content: z.string().optional(),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),
});

export const documentIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
});

export const listDocumentsSchema = z.object({
  query: z.object({
    workspaceId: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    search: z.string().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
  }),
});

export const addCollaboratorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['editor', 'viewer']),
  }),
});

export const removeCollaboratorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>['body'];
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>['body'];
export type ListDocumentsQuery = z.infer<typeof listDocumentsSchema>['query'];
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>['body'];
