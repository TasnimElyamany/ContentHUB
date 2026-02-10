import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Workspace, WorkspaceMember, CreateWorkspaceRequest, InviteMemberRequest } from '../../../models/workspace.model';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../core/services/auth';
import { WORKSPACE_ROLE_HIERARCHY } from '../../../models/workspace.constants';
import { getUserRole , canPerformAction } from '../../../models/workspace.helpers';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root'
})

export class WorkspaceService {
  private readonly API_URL = `${environment.apiUrl}/workspaces`;
  // tracking the current workspace
  private currentWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  public currentWorkspace$ = this.currentWorkspaceSubject.asObservable();

  // Cache
  private workspacesCache: Workspace[] = [];

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) {}

  hasAccess(workspaceId: string): boolean {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      return false;
    }

    // Check in cached workspaces
    const workspace = this.workspacesCache.find(w => w._id === workspaceId);

    if (!workspace) {
      // temprarily allow access w el api handle the auth
      return true;
    }

    if (workspace.owner === currentUser._id) {
      return true;
    }

    const isMember = workspace.members.some(
      member => member.userId === currentUser._id
    );

    return isMember;
  }


  hasRole(workspaceId: string, requiredRole: 'owner' | 'admin' | 'editor' | 'viewer'): boolean {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      return false;
    }

    const workspace = this.workspacesCache.find(w => w._id === workspaceId);

    if (!workspace) {
      return false;
    }

    const userRole = getUserRole(workspace.members, currentUser._id, workspace.owner);

    if(!userRole){
    return false;
    }
    return WORKSPACE_ROLE_HIERARCHY[userRole] >= WORKSPACE_ROLE_HIERARCHY[requiredRole];
  }

  getMyWorkspaces(): Observable<Workspace[]> {
    return this.http.get<ApiResponse<Workspace[]>>(this.API_URL).pipe(
      map(response => {
        this.workspacesCache = response.data;
        return response.data;
      })
    );
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.http.get<ApiResponse<Workspace>>(`${this.API_URL}/${id}`).pipe(
      map(response => {
        const workspace = response.data;
        const index = this.workspacesCache.findIndex(w => w._id === id);
        if (index !== -1) {
          this.workspacesCache[index] = workspace;
        } else {
          this.workspacesCache.push(workspace);
        }
        return workspace;
      })
    );
  }

  createWorkspace(data: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http.post<ApiResponse<Workspace>>(this.API_URL, data).pipe(
      map(response => {
        this.workspacesCache.push(response.data);
        return response.data;
      })
    );
  }

  updateWorkspace(id: string, data: Partial<Workspace>): Observable<Workspace> {
    return this.http.put<ApiResponse<Workspace>>(`${this.API_URL}/${id}`, data).pipe(
      map(response => {
        const index = this.workspacesCache.findIndex(w => w._id === id);
        if (index !== -1) {
          this.workspacesCache[index] = response.data;
        }
        return response.data;
      })
    );
  }

  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`).pipe(
      map(() => {
        this.workspacesCache = this.workspacesCache.filter(w => w._id !== id);
      })
    );
  }

  inviteMember(workspaceId: string, data: InviteMemberRequest): Observable<Workspace> {
    return this.http.post<ApiResponse<Workspace>>(
      `${this.API_URL}/${workspaceId}/invite`,
      data
    ).pipe(
      map(response => {
        const index = this.workspacesCache.findIndex(w => w._id === workspaceId);
        if (index !== -1) {
          this.workspacesCache[index] = response.data;
        }
        return response.data;
      })
    );
  }

  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer'
  ): Observable<Workspace> {
    return this.http.put<ApiResponse<Workspace>>(
      `${this.API_URL}/${workspaceId}/members/${userId}`,
      { role }
    ).pipe(
      map(response => {
        const index = this.workspacesCache.findIndex(w => w._id === workspaceId);
        if (index !== -1) {
          this.workspacesCache[index] = response.data;
        }
        return response.data;
      })
    );
  }

  removeMember(workspaceId: string, userId: string): Observable<Workspace> {
    return this.http.delete<ApiResponse<Workspace>>(
      `${this.API_URL}/${workspaceId}/members/${userId}`
    ).pipe(
      map(response => {
        const index = this.workspacesCache.findIndex(w => w._id === workspaceId);
        if (index !== -1) {
          this.workspacesCache[index] = response.data;
        }
        return response.data;
      })
    );
  }

  leaveWorkspace(workspaceId: string): Observable<void> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    return this.http.post<ApiResponse<void>>(
      `${this.API_URL}/${workspaceId}/leave`,
      {}
    ).pipe(
      map(() => {
        this.workspacesCache = this.workspacesCache.filter(w => w._id !== workspaceId);
      })
    );
  }

  getWorkspaceMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.http.get<ApiResponse<WorkspaceMember[]>>(
      `${this.API_URL}/${workspaceId}/members`
    ).pipe(map(response => response.data));
  }


  setCurrentWorkspace(workspace: Workspace | null): void {
    this.currentWorkspaceSubject.next(workspace);
  }


  get currentWorkspaceValue(): Workspace | null {
    return this.currentWorkspaceSubject.value;
  }


  clearCache(): void {
    this.workspacesCache = [];
    this.currentWorkspaceSubject.next(null);
  }


  canEdit(workspaceId: string): boolean {
    return this.hasRole(workspaceId, 'editor');
  }


  canManage(workspaceId: string): boolean {
    return this.hasRole(workspaceId, 'admin');
  }


  isOwner(workspaceId: string): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    const workspace = this.workspacesCache.find(w => w._id === workspaceId);
    return workspace?.owner === currentUser._id;
  }
}
