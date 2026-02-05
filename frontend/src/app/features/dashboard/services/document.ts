import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  Collaborator,
} from '../../../models/document.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

interface DocumentListParams {
  workspaceId?: string;
  status?: 'draft' | 'published' | 'archived';
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly API_URL = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  getDocuments(
    params: DocumentListParams = {}
  ): Observable<{ documents: Document[]; total: number }> {
    let httpParams = new HttpParams();

    if (params.workspaceId) httpParams = httpParams.set('workspaceId', params.workspaceId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http
      .get<ApiResponse<Document[]>>(this.API_URL, { params: httpParams })
      .pipe(
        map((response) => ({
          documents: response.data,
          total: response.meta?.total || response.data.length,
        }))
      );
  }

  getDocument(id: string): Observable<Document> {
    return this.http
      .get<ApiResponse<Document>>(`${this.API_URL}/${id}`)
      .pipe(map((response) => response.data));
  }

  createDocument(data: CreateDocumentRequest): Observable<Document> {
    return this.http
      .post<ApiResponse<Document>>(this.API_URL, data)
      .pipe(map((response) => response.data));
  }

  updateDocument(id: string, data: UpdateDocumentRequest): Observable<Document> {
    return this.http
      .put<ApiResponse<Document>>(`${this.API_URL}/${id}`, data)
      .pipe(map((response) => response.data));
  }

  deleteDocument(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.API_URL}/${id}`)
      .pipe(map(() => undefined));
  }

  addCollaborator(
    documentId: string,
    userId: string,
    role: 'editor' | 'viewer'
  ): Observable<Document> {
    return this.http
      .post<ApiResponse<Document>>(`${this.API_URL}/${documentId}/collaborators`, {
        userId,
        role,
      })
      .pipe(map((response) => response.data));
  }

  removeCollaborator(documentId: string, userId: string): Observable<Document> {
    return this.http
      .delete<ApiResponse<Document>>(
        `${this.API_URL}/${documentId}/collaborators/${userId}`
      )
      .pipe(map((response) => response.data));
  }
}
