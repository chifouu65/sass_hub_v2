import { HttpClient } from '@angular/common/http';
import {
  computed,
  effect,
  inject,
  Injectable,
  resource,
  signal,
} from '@angular/core';
import {
  AddOrganizationMemberRequest,
  CreateOrganizationRoleRequest,
  CreateOrganizationRequest,
  OrganizationMemberView,
  OrganizationRoleView,
  OrganizationSummary,
  PermissionView,
  UpdateOrganizationMemberRoleRequest,
  UpdateOrganizationRequest,
  UpdateOrganizationRoleRequest,
} from '@sass-hub-v2/shared-types';
import { firstValueFrom, forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

type OrganizationContext = {
  roles: OrganizationRoleView[];
  permissions: PermissionView[];
  members: OrganizationMemberView[];
};

const EMPTY_CONTEXT: OrganizationContext = {
  roles: [],
  permissions: [],
  members: [],
};

@Injectable({
  providedIn: 'root',
})
export class OrganizationRolesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/organizations';

  private readonly _selectedOrganizationId = signal<string | null>(null);
  private readonly _error = signal<string | null>(null);

  private readonly organizationsResource = resource<OrganizationSummary[], undefined>({
    loader: () => this.fetchOrganizations(),
    defaultValue: [],
  });

  private readonly organizationContextResource = resource<OrganizationContext, string | null>({
    params: () => this._selectedOrganizationId(),
    loader: ({ params }) =>
      params ? this.fetchOrganizationContext(params) : Promise.resolve(EMPTY_CONTEXT),
    defaultValue: EMPTY_CONTEXT,
  });

  organizations = computed(() => this.organizationsResource.value() ?? []);
  roles = computed(() => this.organizationContextResource.value()?.roles ?? []);
  permissions = computed(
    () => this.organizationContextResource.value()?.permissions ?? [],
  );
  members = computed(
    () => this.organizationContextResource.value()?.members ?? [],
  );

  selectedOrganizationId = this._selectedOrganizationId.asReadonly();
  error = this._error.asReadonly();

  loading = computed(() => {
    const organizationsLoading = this.organizationsResource.isLoading();
    const contextLoading =
      !!this._selectedOrganizationId() &&
      this.organizationContextResource.isLoading();
    return organizationsLoading || contextLoading;
  });

  membersLoading = computed(
    () =>
      !!this._selectedOrganizationId() &&
      this.organizationContextResource.isLoading(),
  );

  constructor() {
    effect(() => {
      const organizations = this.organizations();
      const current = this._selectedOrganizationId();

      if (!organizations.length) {
        if (current !== null) {
          this._selectedOrganizationId.set(null);
        }
        return;
      }

      if (!current || !organizations.some((org) => org.id === current)) {
        this._selectedOrganizationId.set(organizations[0].id);
      }
    });
  }

  loadOrganizations(): void {
    this.organizationsResource.reload();
  }

  selectOrganization(organizationId: string): void {
    if (!organizationId) {
      this._selectedOrganizationId.set(null);
      return;
    }

    if (organizationId === this._selectedOrganizationId()) {
      this.organizationContextResource.reload();
      return;
    }

    this._selectedOrganizationId.set(organizationId);
  }

  refreshSelection(): void {
    this.organizationsResource.reload();
    if (this._selectedOrganizationId()) {
      this.organizationContextResource.reload();
    }
  }

  createOrganization(
    payload: CreateOrganizationRequest
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .post<OrganizationSummary>(`${this.baseUrl}`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap((organization) => {
          this.organizationsResource.reload();
          this._selectedOrganizationId.set(organization.id);
          this.organizationContextResource.reload();
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
    payload: UpdateOrganizationRequest,
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .patch<OrganizationSummary>(`${this.baseUrl}/${organizationId}`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap((updated) => {
          this.organizationsResource.reload();
          this._selectedOrganizationId.set(updated.id);
          this.organizationContextResource.reload();
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
          const current = this._selectedOrganizationId();
          this.organizationsResource.reload();
          if (current === organizationId) {
            this._selectedOrganizationId.set(null);
          }
        }),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  createRole(
    organizationId: string,
    payload: CreateOrganizationRoleRequest,
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .post<OrganizationRoleView>(`${this.baseUrl}/${organizationId}/roles`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.organizationContextResource.reload()),
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
    payload: UpdateOrganizationRoleRequest,
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
        tap(() => this.organizationContextResource.reload()),
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
        tap(() => this.organizationContextResource.reload()),
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
        tap(() => this.organizationContextResource.reload()),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  reloadMembers(organizationId: string): void {
    if (!organizationId) {
      return;
    }
    this.organizationContextResource.reload();
  }

  addMember(
    organizationId: string,
    payload: AddOrganizationMemberRequest,
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .post<void>(`${this.baseUrl}/${organizationId}/users`, payload, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.organizationContextResource.reload()),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  updateMemberRole(
    organizationId: string,
    userId: string,
    payload: UpdateOrganizationMemberRoleRequest,
  ): Observable<void> {
    this._error.set(null);
    return this.http
      .patch<void>(
        `${this.baseUrl}/${organizationId}/users/${userId}/role`,
        payload,
        {
          headers: this.authService.getAuthHeaders(),
        },
      )
      .pipe(
        tap(() => this.organizationContextResource.reload()),
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
        tap(() => this.organizationContextResource.reload()),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  private fetchOrganizations(): Promise<OrganizationSummary[]> {
    return firstValueFrom(this.fetchOrganizations$());
  }

  private fetchOrganizations$(): Observable<OrganizationSummary[]> {
    return this.http
      .get<OrganizationSummary[]>(`${this.baseUrl}/my`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this._error.set(null)),
        catchError((error) => {
          this._error.set(this.resolveError(error));
          return throwError(() => error);
        }),
      );
  }

  private fetchOrganizationContext(
    organizationId: string,
  ): Promise<OrganizationContext> {
    return firstValueFrom(this.fetchOrganizationContext$(organizationId));
  }

  private fetchOrganizationContext$(
    organizationId: string,
  ): Observable<OrganizationContext> {
    const headers = this.authService.getAuthHeaders();
    return forkJoin({
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
    }).pipe(
      tap(() => this._error.set(null)),
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

