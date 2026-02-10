import {User} from './user.model';
export interface Comment {
  _id: string;
  documentId: string;
  userId: string;
  user?: User;
  content: string;
  position: {
    start: number;
    end: number;
  };
  parentCommentId?: string;
  replies?: Comment[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentRequest {
  content: string;
  position: {
    start: number;
    end: number;
  };
  parentCommentId?: string;
}
