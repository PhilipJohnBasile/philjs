/**
 * Role-Based Access Control for PhilJS Enterprise
 */

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  inherits?: string[];
  tenantId?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'contains' | 'startsWith';
  value: unknown;
}

export interface RBACConfig {
  roles: Role[];
  permissions: Permission[];
  superAdminRole?: string;
}

export class RBACManager {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private superAdminRole: string;

  constructor(config: RBACConfig) {
    config.roles.forEach(r => this.roles.set(r.id, r));
    config.permissions.forEach(p => this.permissions.set(p.id, p));
    this.superAdminRole = config.superAdminRole || 'super_admin';
  }

  hasPermission(
    userRoles: string[],
    permission: string,
    context?: Record<string, unknown>
  ): boolean {
    if (userRoles.includes(this.superAdminRole)) return true;

    const allPermissions = this.expandRoles(userRoles);

    if (!allPermissions.has(permission)) return false;

    const perm = this.permissions.get(permission);
    if (!perm?.conditions || perm.conditions.length === 0) return true;

    return perm.conditions.every(c => this.evaluateCondition(c, context));
  }

  can(userRoles: string[], action: string, resource: string, context?: Record<string, unknown>): boolean {
    const permissionId = `${resource}:${action}`;
    return this.hasPermission(userRoles, permissionId, context);
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  getAllPermissions(roleIds: string[]): Set<string> {
    return this.expandRoles(roleIds);
  }

  private expandRoles(roleIds: string[]): Set<string> {
    const permissions = new Set<string>();
    const visited = new Set<string>();

    const expand = (roleId: string) => {
      if (visited.has(roleId)) return;
      visited.add(roleId);

      const role = this.roles.get(roleId);
      if (!role) return;

      role.permissions.forEach(p => permissions.add(p));
      role.inherits?.forEach(expand);
    };

    roleIds.forEach(expand);
    return permissions;
  }

  private evaluateCondition(condition: PermissionCondition, context?: Record<string, unknown>): boolean {
    if (!context) return false;

    const value = context[condition.field];

    switch (condition.operator) {
      case 'eq': return value === condition.value;
      case 'ne': return value !== condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      case 'contains': return String(value).includes(String(condition.value));
      case 'startsWith': return String(value).startsWith(String(condition.value));
      default: return false;
    }
  }
}

export function createRBACManager(config: RBACConfig): RBACManager {
  return new RBACManager(config);
}
