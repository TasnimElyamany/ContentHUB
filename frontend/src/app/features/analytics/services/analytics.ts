import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface WorkspaceStats {
  totalDocuments: number;
  totalMembers: number;
  aiCreditsUsed: number;
  documentsCreatedThisMonth: number;
  activeMembers: number;
}

export interface UserActivity {
  documentsCreated: number;
  documentsEdited: number;
  commentsAdded: number;
  aiRequestsMade: number;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  byAction: Record<string, number>;
  byDay: { date: string; count: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getWorkspaceStats(workspaceId: string): Observable<WorkspaceStats> {
    return this.http
      .get<ApiResponse<WorkspaceStats>>(`${this.API_URL}/workspace/${workspaceId}`)
      .pipe(map((response) => response.data));
  }

  getUserActivity(): Observable<UserActivity> {
    return this.http
      .get<ApiResponse<UserActivity>>(`${this.API_URL}/user`)
      .pipe(map((response) => response.data));
  }

  getAIUsageStats(workspaceId?: string): Observable<AIUsageStats> {
    let params = new HttpParams();
    if (workspaceId) {
      params = params.set('workspaceId', workspaceId);
    }

    return this.http
      .get<ApiResponse<AIUsageStats>>(`${this.API_URL}/ai-usage`, { params })
      .pipe(map((response) => response.data));
  }
}
