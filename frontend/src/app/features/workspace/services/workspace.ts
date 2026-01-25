import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Workspace, WorkspaceMember, CreateWorkspaceRequest, InviteMemberRequest } from '../../../models/workspace.model';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../core/services/auth';
import { WORKSPACE_ROLE_HIERARCHY } from '../../../models/workspace.constants';
import { getUserRole , canPerformAction } from '../../../models/workspace.helpers';

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
    return this.http.get<Workspace[]>(this.API_URL).pipe(
      map(workspaces => {
        this.workspacesCache = workspaces;
        return workspaces;
      })
    );
  }


  getWorkspace(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.API_URL}/${id}`).pipe(
      map(workspace => {
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
    return this.http.post<Workspace>(this.API_URL, data).pipe(
      map(workspace => {
        this.workspacesCache.push(workspace);
        return workspace;
      })
    );
  }


  updateWorkspace(id: string, data: Partial<Workspace>): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.API_URL}/${id}`, data).pipe(
      map(workspace => {
        const index = this.workspacesCache.findIndex(w => w._id === id);
        if (index !== -1) {
          this.workspacesCache[index] = workspace;
        }
        return workspace;
      })
    );
  }


  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      map(() => {
        this.workspacesCache = this.workspacesCache.filter(w => w._id !== id);
      })
    );
  }


  inviteMember(workspaceId: string, data: InviteMemberRequest): Observable<Workspace> {
    return this.http.post<Workspace>(
      `${this.API_URL}/${workspaceId}/invite`,
      data
    ).pipe(
      map(workspace => {
        const index = this.workspacesCache.findIndex(w => w._id === workspaceId);
        if (index !== -1) {
          this.workspacesCache[index] = workspace;
        }
        return workspace;
      })
    );
  }

  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer'
  ): Observable<Workspace> {
    return this.http.put<Workspace>(
      `${this.API_URL}/${workspaceId}/members/${userId}`,
      { role }
    ).pipe(
      map(workspace => {
        // Update cache
        const index = this.workspacesCache.findIndex(w => w._id === workspaceId);
        if (index !== -1) {
          this.workspacesCache[index] = workspace;
        }
        return workspace;
      })
    );
  }


  removeMember(workspaceId: string, userId: string): Observable<Workspace> {
    return this.http.delete<Workspace>(
      `${this.API_URL}/${workspaceId}/members/${userId}`
    ).pipe(
      map(workspace => {
        const index = this.workspacesCache.findIndex(w => w._id === workspaceId);
        if (index !== -1) {
          this.workspacesCache[index] = workspace;
        }
        return workspace;
      })
    );
  }

  leaveWorkspace(workspaceId: string): Observable<void> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    return this.http.post<void>(
      `${this.API_URL}/${workspaceId}/leave`,
      {}
    ).pipe(
      map(() => {
        this.workspacesCache = this.workspacesCache.filter(w => w._id !== workspaceId);
      })
    );
  }

  getWorkspaceMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.http.get<WorkspaceMember[]>(
      `${this.API_URL}/${workspaceId}/members`
    );
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
