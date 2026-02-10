import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AIGenerateRequest,
  AIEnhanceRequest,
  AIResponse,
} from '../../../models/ai-request.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AICredits {
  total: number;
  used: number;
  remaining: number;
  resetDate: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly API_URL = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  generate(request: AIGenerateRequest): Observable<AIResponse> {
    return this.http
      .post<ApiResponse<AIResponse>>(`${this.API_URL}/generate`, request)
      .pipe(map((response) => response.data));
  }

  enhance(request: AIEnhanceRequest): Observable<AIResponse> {
    return this.http
      .post<ApiResponse<AIResponse>>(`${this.API_URL}/enhance`, request)
      .pipe(map((response) => response.data));
  }

  getCredits(): Observable<AICredits> {
    return this.http
      .get<ApiResponse<AICredits>>(`${this.API_URL}/credits`)
      .pipe(map((response) => response.data));
  }
}
