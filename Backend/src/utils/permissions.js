const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    CLIENT: 'CLIENT'
};

const ROLE_LEVEL = {
    [ROLES.SUPER_ADMIN]: 100,
    [ROLES.ADMIN]: 80,
    [ROLES.MANAGER]: 60,
    [ROLES.EMPLOYEE]: 30,
    [ROLES.CLIENT]: 10
};

const PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        description: 'Control total del sistema',
        modules: ['ALL']
    },

    [ROLES.ADMIN]: {
        description: 'Administración general del negocio',
        modules: [
            'users',
            'sales',
            'payments',
            'cash',
            'inventory',
            'production',
            'customers',
            'suppliers',
            'products',
            'categories',
            'reports',
            'purchases',
            'tickets',
            'settings'
        ]
    },

    [ROLES.MANAGER]: {
        description: 'Gestión comercial, operativa y autorizaciones',
        modules: [
            'sales',
            'payments',
            'cash',
            'inventory',
            'production',
            'customers',
            'suppliers',
            'products',
            'categories',
            'reports',
            'purchases',
            'tickets'
        ]
    },

    [ROLES.EMPLOYEE]: {
        description: 'Operación limitada',
        modules: [
            'sales_basic',
            'payments_basic',
            'cash_basic',
            'production',
            'tasks',
            'inventory_view',
            'customers_basic',
            'tickets_basic'
        ]
    },

    [ROLES.CLIENT]: {
        description: 'Cliente externo',
        modules: [
            'client_portal'
        ]
    }
};

const normalizeRole = (role) => {
    return String(role || '').toUpperCase();
};

const hasPermission = (role, moduleName) => {
    const normalizedRole = normalizeRole(role);

    if (!PERMISSIONS[normalizedRole]) return false;
    if (PERMISSIONS[normalizedRole].modules.includes('ALL')) return true;

    return PERMISSIONS[normalizedRole].modules.includes(moduleName);
};

const isSuperAdmin = (role) => {
    return normalizeRole(role) === ROLES.SUPER_ADMIN;
};

const isAdminOrAbove = (role) => {
    const normalizedRole = normalizeRole(role);
    return (ROLE_LEVEL[normalizedRole] || 0) >= ROLE_LEVEL[ROLES.ADMIN];
};

const isManagerOrAbove = (role) => {
    const normalizedRole = normalizeRole(role);
    return (ROLE_LEVEL[normalizedRole] || 0) >= ROLE_LEVEL[ROLES.MANAGER];
};

const canCreateRole = (creatorRole, targetRole) => {
    const creator = normalizeRole(creatorRole);
    const target = normalizeRole(targetRole);

    if (!ROLE_LEVEL[creator] || !ROLE_LEVEL[target]) return false;

    if (creator === ROLES.SUPER_ADMIN) {
        return true;
    }

    if (creator === ROLES.ADMIN) {
        return [ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT].includes(target);
    }

    if (creator === ROLES.MANAGER) {
        return [ROLES.EMPLOYEE, ROLES.CLIENT].includes(target);
    }

    return false;
};

const canChangeRole = (actorRole, currentTargetRole, newTargetRole) => {
    const actor = normalizeRole(actorRole);
    const currentTarget = normalizeRole(currentTargetRole);
    const newTarget = normalizeRole(newTargetRole);

    if (!ROLE_LEVEL[actor] || !ROLE_LEVEL[currentTarget] || !ROLE_LEVEL[newTarget]) {
        return false;
    }

    if (actor === ROLES.SUPER_ADMIN) {
        return true;
    }

    // Nadie debajo de SUPER_ADMIN puede modificar SUPER_ADMIN.
    if (currentTarget === ROLES.SUPER_ADMIN || newTarget === ROLES.SUPER_ADMIN) {
        return false;
    }

    if (actor === ROLES.ADMIN) {
        return [ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT].includes(newTarget);
    }

    return false;
};

const canManageUser = (actorRole, targetRole) => {
    const actor = normalizeRole(actorRole);
    const target = normalizeRole(targetRole);

    if (!ROLE_LEVEL[actor] || !ROLE_LEVEL[target]) return false;

    if (actor === ROLES.SUPER_ADMIN) return true;

    if (target === ROLES.SUPER_ADMIN) return false;

    return ROLE_LEVEL[actor] > ROLE_LEVEL[target];
};

module.exports = {
    ROLES,
    ROLE_LEVEL,
    PERMISSIONS,
    normalizeRole,
    hasPermission,
    isSuperAdmin,
    isAdminOrAbove,
    isManagerOrAbove,
    canCreateRole,
    canChangeRole,
    canManageUser
};