// Role definitions and permissions
const ROLES = {
    SHIPPER: 'shipper',
    ISSUING_CARRIER_AGENT: 'issuing-carrier-agent',
    CONSIGNEE: 'consignee',
    CUSTOMS_BROKER: 'customs-broker',
    COURIER: 'courier',
    ADMIN: 'admin' // Hidden role - not visible in registration
};

const ROLE_LABELS = {
    [ROLES.SHIPPER]: 'Shipper',
    [ROLES.ISSUING_CARRIER_AGENT]: 'Issuing Carrier\'s Agent',
    [ROLES.CONSIGNEE]: 'Consignee',
    [ROLES.CUSTOMS_BROKER]: 'Customs Broker',
    [ROLES.COURIER]: 'Courier',
    [ROLES.ADMIN]: 'Administrator'
};

// Role-based permissions
const PERMISSIONS = {
    [ROLES.SHIPPER]: {
        canCreateShipment: true,
        canViewShipments: true,
        canEditShipment: false, // Can only view
        canCreateAWB: false,
        canAddFees: true,
        canApprovePayment: false,
        canInviteUsers: true,
        canEditLocations: false,
        allowedInviteRoles: [ROLES.CONSIGNEE, ROLES.CUSTOMS_BROKER, ROLES.COURIER]
    },
    [ROLES.ISSUING_CARRIER_AGENT]: {
        canCreateShipment: true,
        canViewShipments: true,
        canEditShipment: true,
        canCreateAWB: true, // KEY PERMISSION - only this role can create AWBs
        canAddFees: true,
        canApprovePayment: false,
        canInviteUsers: true,
        canEditLocations: true, // TEMPORARY: For development
        allowedInviteRoles: [ROLES.SHIPPER, ROLES.CONSIGNEE, ROLES.CUSTOMS_BROKER, ROLES.COURIER]
    },
    [ROLES.CONSIGNEE]: {
        canCreateShipment: false,
        canViewShipments: true,
        canEditShipment: false,
        canCreateAWB: false,
        canAddFees: false,
        canApprovePayment: true, // Can approve and pay fees
        canInviteUsers: false,
        canEditLocations: false,
        allowedInviteRoles: []
    },
    [ROLES.CUSTOMS_BROKER]: {
        canCreateShipment: false,
        canViewShipments: true,
        canEditShipment: false,
        canCreateAWB: false,
        canAddFees: true,
        canApprovePayment: false,
        canInviteUsers: false,
        canEditLocations: false,
        allowedInviteRoles: []
    },
    [ROLES.COURIER]: {
        canCreateShipment: false,
        canViewShipments: true,
        canEditShipment: false,
        canCreateAWB: false,
        canAddFees: true,
        canApprovePayment: false,
        canInviteUsers: false,
        canEditLocations: false,
        allowedInviteRoles: []
    },
    [ROLES.ADMIN]: {
        canCreateShipment: false, // Admins cannot create spaces
        canViewShipments: true,
        canEditShipment: true, // Admins can edit all shipments
        canCreateAWB: false, // Admins cannot create AWBs
        canAddFees: true,
        canApprovePayment: true,
        canInviteUsers: true,
        canViewAllUsers: true,
        canViewAllShipments: true,
        canManageUsers: true,
        canEditLocations: true, // Admins can edit locations
        allowedInviteRoles: [ROLES.SHIPPER, ROLES.ISSUING_CARRIER_AGENT, ROLES.CONSIGNEE, ROLES.CUSTOMS_BROKER, ROLES.COURIER, ROLES.ADMIN]
    }
};

// Load custom permissions from storage
function loadCustomPermissions() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
    }
    try {
        const customPermsJson = localStorage.getItem('awb_custom_permissions');
        return customPermsJson ? JSON.parse(customPermsJson) : null;
    } catch (error) {
        console.warn('Error loading custom permissions:', error);
        return null;
    }
}

// Get effective permissions (custom overrides default)
function getEffectivePermissions() {
    const defaultPerms = PERMISSIONS;
    const customPerms = loadCustomPermissions();
    
    if (!customPerms) {
        return defaultPerms;
    }
    
    // Merge custom permissions with defaults
    const effective = {};
    for (const [role, defaultPerm] of Object.entries(defaultPerms)) {
        effective[role] = {
            ...defaultPerm,
            ...(customPerms[role] || {})
        };
        // Preserve allowedInviteRoles array if overridden
        if (customPerms[role] && customPerms[role].allowedInviteRoles) {
            effective[role].allowedInviteRoles = customPerms[role].allowedInviteRoles;
        }
    }
    return effective;
}

// Check if user has permission
function hasPermission(userRole, permission) {
    if (!userRole) {
        return false;
    }
    
    // Admin has all permissions
    if (userRole === ROLES.ADMIN) {
        return true;
    }
    
    // Get effective permissions (includes custom overrides)
    const effectivePerms = getEffectivePermissions();
    
    if (!effectivePerms[userRole]) {
        return false;
    }
    return effectivePerms[userRole][permission] === true;
}

// Get role label
function getRoleLabel(role) {
    return ROLE_LABELS[role] || role;
}

// Get all roles (for dropdowns) - excludes admin
function getAllRoles() {
    return Object.values(ROLES).filter(role => role !== ROLES.ADMIN);
}

// Get all roles including admin (for admin use only)
function getAllRolesIncludingAdmin() {
    return Object.values(ROLES);
}

// Get roles that can be invited by a specific role
function getAllowedInviteRoles(userRole) {
    if (!userRole) {
        return [];
    }
    
    // Get effective permissions (includes custom overrides)
    const effectivePerms = getEffectivePermissions();
    
    if (!effectivePerms[userRole]) {
        return [];
    }
    return effectivePerms[userRole].allowedInviteRoles || [];
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.ROLES = ROLES;
    window.ROLE_LABELS = ROLE_LABELS;
    window.PERMISSIONS = PERMISSIONS;
    window.hasPermission = hasPermission;
    window.getRoleLabel = getRoleLabel;
    window.getAllRoles = getAllRoles;
    window.getAllRolesIncludingAdmin = getAllRolesIncludingAdmin;
    window.getAllowedInviteRoles = getAllowedInviteRoles;
    window.loadCustomPermissions = loadCustomPermissions;
    window.getEffectivePermissions = getEffectivePermissions;
}
