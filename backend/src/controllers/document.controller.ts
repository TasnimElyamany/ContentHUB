import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { documentService } from '../services/document.service';

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { documents, total } = await documentService.getDocuments(
    req.user!.userId,
    req.query as any
  );

  res.json({
    success: true,
    data: documents,
    meta: {
      total,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    },
  });
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.getDocumentById(
    req.params.id,
    req.user!.userId
  );

  res.json({
    success: true,
    data: document,
  });
});

export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.createDocument(
    req.user!.userId,
    req.body
  );

  res.status(201).json({
    success: true,
    data: document,
  });
});

export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.updateDocument(
    req.params.id,
    req.user!.userId,
    req.body
  );

  res.json({
    success: true,
    data: document,
  });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  await documentService.deleteDocument(req.params.id, req.user!.userId);

  res.json({
    success: true,
    message: 'Document deleted successfully',
  });
});

export const addCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.addCollaborator(
    req.params.id,
    req.user!.userId,
    req.body
  );

  res.json({
    success: true,
    data: document,
  });
});

export const removeCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.removeCollaborator(
    req.params.id,
    req.user!.userId,
    req.params.userId
  );

  res.json({
    success: true,
    data: document,
  });
});
