// Invitation data model
class Invitation {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.shipmentAWB = data.shipmentAWB || '';
        this.invitedBy = data.invitedBy || '';
        this.invitedUser = data.invitedUser || ''; // User ID or email
        this.role = data.role || '';
        this.status = data.status || 'pending'; // pending, accepted, declined
        this.createdAt = data.createdAt || new Date().toISOString();
        this.respondedAt = data.respondedAt || null;
    }

    generateId() {
        return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    accept() {
        this.status = 'accepted';
        this.respondedAt = new Date().toISOString();
    }

    decline() {
        this.status = 'declined';
        this.respondedAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            shipmentAWB: this.shipmentAWB,
            invitedBy: this.invitedBy,
            invitedUser: this.invitedUser,
            role: this.role,
            status: this.status,
            createdAt: this.createdAt,
            respondedAt: this.respondedAt
        };
    }

    static fromJSON(data) {
        return new Invitation(data);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Invitation;
}
