// Role definitions and permissions
const ROLES = {
    SHIPPER: 'shipper',
    ISSUING_CARRIER_AGENT: 'issuing-carrier-agent',
    CONSIGNEE: 'consignee',
    CUSTOMS_BROKER: 'customs-broker',
    COURIER: 'courier'
};

const ROLE_LABELS = {
    [ROLES.SHIPPER]: 'Shipper',
    [ROLES.ISSUING_CARRIER_AGENT]: 'Issuing Carrier\'s Agent',
    [ROLES.CONSIGNEE]: 'Consignee',
    [ROLES.CUSTOMS_BROKER]: 'Customs Broker',
    [ROLES.COURIER]: 'Courier'
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
        allowedInviteRoles: []
    }
};

// Check if user has permission
function hasPermission(userRole, permission) {
    if (!userRole || !PERMISSIONS[userRole]) {
        return false;
    }
    return PERMISSIONS[userRole][permission] === true;
}

// Get role label
function getRoleLabel(role) {
    return ROLE_LABELS[role] || role;
}

// Get all roles (for dropdowns)
function getAllRoles() {
    return Object.values(ROLES);
}

// Get roles that can be invited by a specific role
function getAllowedInviteRoles(userRole) {
    if (!userRole || !PERMISSIONS[userRole]) {
        return [];
    }
    return PERMISSIONS[userRole].allowedInviteRoles || [];
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.ROLES = ROLES;
    window.ROLE_LABELS = ROLE_LABELS;
    window.PERMISSIONS = PERMISSIONS;
    window.hasPermission = hasPermission;
    window.getRoleLabel = getRoleLabel;
    window.getAllRoles = getAllRoles;
    window.getAllowedInviteRoles = getAllowedInviteRoles;
}
