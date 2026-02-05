import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Comment, CreateCommentRequest } from '../../../models/comment.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getComments(documentId: string): Observable<Comment[]> {
    return this.http
      .get<ApiResponse<Comment[]>>(
        `${this.API_URL}/comments/documents/${documentId}/comments`
      )
      .pipe(map((response) => response.data));
  }

  createComment(
    documentId: string,
    data: CreateCommentRequest
  ): Observable<Comment> {
    return this.http
      .post<ApiResponse<Comment>>(
        `${this.API_URL}/comments/documents/${documentId}/comments`,
        data
      )
      .pipe(map((response) => response.data));
  }

  updateComment(commentId: string, content: string): Observable<Comment> {
    return this.http
      .put<ApiResponse<Comment>>(`${this.API_URL}/comments/${commentId}`, {
        content,
      })
      .pipe(map((response) => response.data));
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.API_URL}/comments/${commentId}`)
      .pipe(map(() => undefined));
  }

  resolveComment(commentId: string): Observable<Comment> {
    return this.http
      .post<ApiResponse<Comment>>(
        `${this.API_URL}/comments/${commentId}/resolve`,
        {}
      )
      .pipe(map((response) => response.data));
  }

  replyToComment(commentId: string, content: string): Observable<Comment> {
    return this.http
      .post<ApiResponse<Comment>>(
        `${this.API_URL}/comments/${commentId}/reply`,
        { content }
      )
      .pipe(map((response) => response.data));
  }
}
