const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE'
};

const PERMISSIONS = {
    [ROLES.ADMIN]: {
        description: 'Acceso total',
        modules: ['ALL']
    },
    [ROLES.MANAGER]: {
        description: 'Acceso a gestión comercial y operativa',
        modules: ['sales', 'inventory', 'production', 'customers', 'suppliers', 'products', 'categories', 'reports', 'purchases']
    },
    [ROLES.EMPLOYEE]: {
        description: 'Acceso a operaciones de planta y tareas',
        modules: ['production', 'tasks', 'inventory_view']
    }
};

/**
 * Helper to check if a specific role has access to a generic module
 * Although middleware usually relies on strict Roles, this helps for granulate checks.
 * @param {string} role - User role
 * @param {string} moduleName - Module to check access to
 * @returns {boolean} Accessible or not
 */
const hasPermission = (role, moduleName) => {
    if (!PERMISSIONS[role]) return false;
    if (PERMISSIONS[role].modules.includes('ALL')) return true;
    return PERMISSIONS[role].modules.includes(moduleName);
};

module.exports = {
    ROLES,
    PERMISSIONS,
    hasPermission
};
