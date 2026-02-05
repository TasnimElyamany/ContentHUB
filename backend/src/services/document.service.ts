import mongoose from 'mongoose';
import { ContentDocument, IDocument, Workspace } from '../models';
import { ApiError } from '../utils/apiError';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  ListDocumentsQuery,
  AddCollaboratorInput,
} from '../schemas/document.schema';

class DocumentService {
  async getDocuments(
    userId: string,
    query: ListDocumentsQuery
  ): Promise<{ documents: IDocument[]; total: number }> {
    const filter: any = {
      $or: [
        { owner: userId },
        { 'collaborators.userId': userId },
      ],
    };

    if (query.workspaceId) {
      const workspace = await Workspace.findById(query.workspaceId);
      if (!workspace) {
        throw ApiError.notFound('Workspace not found');
      }

      const hasAccess =
        workspace.owner.toString() === userId ||
        workspace.members.some((m) => m.userId.toString() === userId);

      if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this workspace');
      }

      filter.workspace = query.workspaceId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      ContentDocument.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email avatar')
        .populate('collaborators.userId', 'name email avatar'),
      ContentDocument.countDocuments(filter),
    ]);

    return { documents, total };
  }

  async getDocumentById(documentId: string, userId: string): Promise<IDocument> {
    const document = await ContentDocument.findById(documentId)
      .populate('owner', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar');

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    const hasAccess = await this.checkDocumentAccess(document, userId);
    if (!hasAccess) {
      throw ApiError.forbidden('You do not have access to this document');
    }

    return document;
  }

  async createDocument(
    userId: string,
    data: CreateDocumentInput
  ): Promise<IDocument> {
    const workspace = await Workspace.findById(data.workspaceId);
    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const hasAccess =
      workspace.owner.toString() === userId ||
      workspace.members.some(
        (m) =>
          m.userId.toString() === userId &&
          ['owner', 'admin', 'editor'].includes(m.role)
      );

    if (!hasAccess) {
      throw ApiError.forbidden('You do not have permission to create documents in this workspace');
    }

    const document = await ContentDocument.create({
      title: data.title,
      content: data.content || '',
      owner: userId,
      workspace: data.workspaceId,
      status: workspace.settings.defaultDocumentStatus || 'draft',
    });

    return document;
  }

  async updateDocument(
    documentId: string,
    userId: string,
    data: UpdateDocumentInput
  ): Promise<IDocument> {
    const document = await ContentDocument.findById(documentId);

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    const canEdit = await this.checkDocumentEditAccess(document, userId);
    if (!canEdit) {
      throw ApiError.forbidden('You do not have permission to edit this document');
    }

    if (data.title !== undefined) document.title = data.title;
    if (data.content !== undefined) {
      document.content = data.content;
      document.version += 1;
    }
    if (data.status !== undefined) document.status = data.status;
    if (data.tags !== undefined) document.tags = data.tags;

    await document.save();
    return document;
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await ContentDocument.findById(documentId);

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    if (document.owner.toString() !== userId) {
      throw ApiError.forbidden('Only the document owner can delete it');
    }

    await ContentDocument.findByIdAndDelete(documentId);
  }

  async addCollaborator(
    documentId: string,
    ownerId: string,
    data: AddCollaboratorInput
  ): Promise<IDocument> {
    const document = await ContentDocument.findById(documentId);

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    if (document.owner.toString() !== ownerId) {
      throw ApiError.forbidden('Only the document owner can add collaborators');
    }

    const existingCollaborator = document.collaborators.find(
      (c) => c.userId.toString() === data.userId
    );

    if (existingCollaborator) {
      throw ApiError.conflict('User is already a collaborator');
    }

    document.collaborators.push({
      userId: new mongoose.Types.ObjectId(data.userId),
      role: data.role,
    });

    await document.save();
    return document;
  }

  async removeCollaborator(
    documentId: string,
    ownerId: string,
    targetUserId: string
  ): Promise<IDocument> {
    const document = await ContentDocument.findById(documentId);

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    if (document.owner.toString() !== ownerId) {
      throw ApiError.forbidden('Only the document owner can remove collaborators');
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.userId.toString() !== targetUserId
    );

    await document.save();
    return document;
  }

  private async checkDocumentAccess(
    document: IDocument,
    userId: string
  ): Promise<boolean> {
    // Owner has access
    if (document.owner.toString() === userId) {
      return true;
    }

    // Collaborator has access
    if (document.collaborators.some((c) => c.userId.toString() === userId)) {
      return true;
    }

    // Workspace member has access
    const workspace = await Workspace.findById(document.workspace);
    if (workspace) {
      return workspace.members.some((m) => m.userId.toString() === userId);
    }

    return false;
  }

  private async checkDocumentEditAccess(
    document: IDocument,
    userId: string
  ): Promise<boolean> {
    if (document.owner.toString() === userId) {
      return true;
    }

    const collaborator = document.collaborators.find(
      (c) => c.userId.toString() === userId
    );
    if (collaborator && collaborator.role === 'editor') {
      return true;
    }

    const workspace = await Workspace.findById(document.workspace);
    if (workspace) {
      const member = workspace.members.find(
        (m) => m.userId.toString() === userId
      );
      if (member && ['owner', 'admin', 'editor'].includes(member.role)) {
        return true;
      }
    }

    return false;
  }
}

export const documentService = new DocumentService();
