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
export declare class RBACManager {
    private roles;
    private permissions;
    private superAdminRole;
    constructor(config: RBACConfig);
    hasPermission(userRoles: string[], permission: string, context?: Record<string, unknown>): boolean;
    can(userRoles: string[], action: string, resource: string, context?: Record<string, unknown>): boolean;
    getRole(roleId: string): Role | undefined;
    getAllPermissions(roleIds: string[]): Set<string>;
    private expandRoles;
    private evaluateCondition;
}
export declare function createRBACManager(config: RBACConfig): RBACManager;
//# sourceMappingURL=rbac.d.ts.map