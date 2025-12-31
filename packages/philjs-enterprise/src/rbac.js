/**
 * Role-Based Access Control for PhilJS Enterprise
 */
export class RBACManager {
    roles = new Map();
    permissions = new Map();
    superAdminRole;
    constructor(config) {
        config.roles.forEach(r => this.roles.set(r.id, r));
        config.permissions.forEach(p => this.permissions.set(p.id, p));
        this.superAdminRole = config.superAdminRole || 'super_admin';
    }
    hasPermission(userRoles, permission, context) {
        if (userRoles.includes(this.superAdminRole))
            return true;
        const allPermissions = this.expandRoles(userRoles);
        if (!allPermissions.has(permission))
            return false;
        const perm = this.permissions.get(permission);
        if (!perm?.conditions || perm.conditions.length === 0)
            return true;
        return perm.conditions.every(c => this.evaluateCondition(c, context));
    }
    can(userRoles, action, resource, context) {
        const permissionId = `${resource}:${action}`;
        return this.hasPermission(userRoles, permissionId, context);
    }
    getRole(roleId) {
        return this.roles.get(roleId);
    }
    getAllPermissions(roleIds) {
        return this.expandRoles(roleIds);
    }
    expandRoles(roleIds) {
        const permissions = new Set();
        const visited = new Set();
        const expand = (roleId) => {
            if (visited.has(roleId))
                return;
            visited.add(roleId);
            const role = this.roles.get(roleId);
            if (!role)
                return;
            role.permissions.forEach(p => permissions.add(p));
            role.inherits?.forEach(expand);
        };
        roleIds.forEach(expand);
        return permissions;
    }
    evaluateCondition(condition, context) {
        if (!context)
            return false;
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
export function createRBACManager(config) {
    return new RBACManager(config);
}
//# sourceMappingURL=rbac.js.map