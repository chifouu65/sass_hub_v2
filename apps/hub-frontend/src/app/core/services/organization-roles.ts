import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, forkJoin, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { AuthService } from './auth';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  databaseName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRoleView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string | null;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

export interface PermissionView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMemberView {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  organizationRoleId: string | null;
  organizationRoleSlug: string | null;
  organizationRoleName: string | null;
  createdAt: string;
}

export interface CreateRolePayload {
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  isDefault?: boolean;
  permissions?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationRolesStore {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/organizations';

  private readonly _organizations = signal<OrganizationSummary[]>([]);
  private readonly _roles = signal<OrganizationRoleView[]>([]);
  private readonly _permissions = signal<PermissionView[]>([]);
  private readonly _members = signal<OrganizationMemberView[]>([]);
  private readonly _selectedOrganizationId = signal<string | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _membersLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  organizations = this._organizations.asReadonly();
  roles = this._roles.asReadonly();
  permissions = this._permissions.asReadonly();
  members = this._members.asReadonly();
  selectedOrganizationId = this._selectedOrganizationId.asReadonly();
  loading = this._loading.asReadonly();
  membersLoading = this._membersLoading.asReadonly();
  error = this._error.asReadonly();

  loadOrganizations(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<OrganizationSummary[]>(`${this.baseUrl}/my`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap((organizations) => {
          this._organizations.set(organizations);

          if (!organizations.length) {
            this._selectedOrganizationId.set(null);
            this._roles.set([]);
            this._permissions.set([]);
            this._loading.set(false);
            return;
          }

          const currentSelection = this._selectedOrganizationId();
          const selectionExists = currentSelection
            ? organizations.some((org) => org.id === currentSelection)
            : false;

          const nextSelection = selectionExists
            ? currentSelection
            : organizations[0]?.id ?? null;

          if (nextSelection) {
            this._selectedOrganizationId.set(nextSelection);
            this.fetchOrganizationContext(nextSelection);
          } else {
            this._loading.set(false);
          }
        }),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          this._organizations.set([]);
          this._roles.set([]);
          this._permissions.set([]);
          this._selectedOrganizationId.set(null);
          this._loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  selectOrganization(organizationId: string): void {
    if (!organizationId || organizationId === this._selectedOrganizationId()) {
      if (organizationId) {
        this.fetchOrganizationContext(organizationId);
      }
      return;
    }

    this._selectedOrganizationId.set(organizationId);
    this.fetchOrganizationContext(organizationId);
  }

  refreshSelection(): void {
    const current = this._selectedOrganizationId();
    if (current) {
      this.fetchOrganizationContext(current);
    } else {
      this.loadOrganizations();
    }
  }

  createOrganization(payload: { name: string; slug: string; databaseName?: string | null }): Observable<void> {
    this._error.set(null);
    return this.http
      .post<OrganizationSummary>(`${this.baseUrl}`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap((organization) => {
          this._organizations.set([organization, ...this._organizations()]);
          this._selectedOrganizationId.set(organization.id);
          this.fetchOrganizationContext(organization.id);
        }),
        map(() => void 0),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  updateOrganization(
    organizationId: string,
    payload: { name?: string; slug?: string; databaseName?: string | null },
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .patch<OrganizationSummary>(`${this.baseUrl}/${organizationId}`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap((updated) => {
          this._organizations.set(
            this._organizations().map((org) =>
              org.id === updated.id ? updated : org,
            ),
          );
          this.fetchOrganizationContext(updated.id);
        }),
        map(() => void 0),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  deleteOrganization(organizationId: string): Observable<void> {
    this._error.set(null);
    return this.http
      .delete<void>(`${this.baseUrl}/${organizationId}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => {
          const remaining = this._organizations().filter(
            (org) => org.id !== organizationId,
          );
          this._organizations.set(remaining);
          const nextSelection = remaining[0]?.id ?? null;
          this._selectedOrganizationId.set(nextSelection);
          if (nextSelection) {
            this.fetchOrganizationContext(nextSelection);
          } else {
            this._roles.set([]);
            this._permissions.set([]);
            this._members.set([]);
          }
        }),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  createRole(organizationId: string, payload: CreateRolePayload): Observable<void> {
    this._error.set(null);
    return this.http
      .post<OrganizationRoleView>(`${this.baseUrl}/${organizationId}/roles`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.fetchOrganizationContext(organizationId)),
        map(() => void 0),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  updateRole(
    organizationId: string,
    roleId: string,
    payload: UpdateRolePayload,
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .patch<OrganizationRoleView>(
        `${this.baseUrl}/${organizationId}/roles/${roleId}`,
        payload,
        {
          headers: this.authService.getAuthHeaders(),
        },
      )
      .pipe(
        tap(() => this.fetchOrganizationContext(organizationId)),
        map(() => void 0),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  updateRolePermissions(
    organizationId: string,
    roleId: string,
    permissions: string[],
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .put<OrganizationRoleView>(
        `${this.baseUrl}/${organizationId}/roles/${roleId}/permissions`,
        { permissions },
        {
          headers: this.authService.getAuthHeaders(),
        },
      )
      .pipe(
        tap(() => this.fetchOrganizationContext(organizationId)),
        map(() => void 0),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  deleteRole(organizationId: string, roleId: string): Observable<void> {
    this._error.set(null);
    return this.http
      .delete<void>(`${this.baseUrl}/${organizationId}/roles/${roleId}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.fetchOrganizationContext(organizationId)),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  private fetchOrganizationContext(organizationId: string): void {
    if (!organizationId) {
      this._roles.set([]);
      this._permissions.set([]);
      this._members.set([]);
      this._loading.set(false);
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const headers = this.authService.getAuthHeaders();

    forkJoin({
      roles: this.http.get<OrganizationRoleView[]>(
        `${this.baseUrl}/${organizationId}/roles`,
        { headers },
      ),
      permissions: this.http.get<PermissionView[]>(
        `${this.baseUrl}/${organizationId}/roles/available-permissions`,
        { headers },
      ),
      members: this.http.get<OrganizationMemberView[]>(
        `${this.baseUrl}/${organizationId}/users`,
        { headers },
      ),
    })
      .pipe(
        tap(({ roles, permissions, members }) => {
          this._roles.set(roles);
          this._permissions.set(permissions);
          this._members.set(members);
        }),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          this._roles.set([]);
          this._permissions.set([]);
          this._members.set([]);
          return EMPTY;
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  reloadMembers(organizationId: string): void {
    if (!organizationId) {
      this._members.set([]);
      return;
    }

    this._membersLoading.set(true);
    this.http
      .get<OrganizationMemberView[]>(`${this.baseUrl}/${organizationId}/users`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap((members) => this._members.set(members)),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          this._members.set([]);
          return EMPTY;
        }),
        finalize(() => this._membersLoading.set(false)),
      )
      .subscribe();
  }

  addMember(
    organizationId: string,
    payload: {
      userId?: string;
      email?: string;
      role?: string;
      organizationRoleId?: string | null;
    },
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .post<void>(`${this.baseUrl}/${organizationId}/users`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.reloadMembers(organizationId)),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  updateMemberRole(
    organizationId: string,
    userId: string,
    payload: { role?: string; organizationRoleId?: string | null },
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .patch<void>(`${this.baseUrl}/${organizationId}/users/${userId}/role`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.reloadMembers(organizationId)),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  removeMember(organizationId: string, userId: string): Observable<void> {
    this._error.set(null);
    return this.http
      .delete<void>(`${this.baseUrl}/${organizationId}/users/${userId}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.reloadMembers(organizationId)),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  private resolveError(error: unknown): string {
    if (!error) {
      return 'Une erreur inconnue est survenue.';
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error: unknown }).error === 'object'
    ) {
      const payload = (error as { error: { message?: string } }).error;
      if (payload?.message) {
        return payload.message;
      }
    }

    return 'Impossible de récupérer les données organisationnelles.';
  }
}

