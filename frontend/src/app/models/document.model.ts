export interface Document {
  _id: string;
  title: string;
  content: string;
  owner: string;
  workspace: string;
  collaborators: Collaborator[];
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  aiUsage: {
    generateCalls: number;
    improveCalls: number;
    totalTokens: number;
  };
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collaborator {
  userId: string;
  role: 'editor' | 'viewer';
}

export interface CreateDocumentRequest {
  title: string;
  workspaceId?: string;
  content?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
}
