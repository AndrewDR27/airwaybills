// User data model
class User {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.email = data.email || '';
        this.name = data.name || '';
        this.role = data.role || ''; // shipper, issuing-carrier-agent, consignee, customs-broker, courier
        this.company = data.company || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            role: this.role,
            company: this.company,
            createdAt: this.createdAt,
            isActive: this.isActive
        };
    }

    static fromJSON(data) {
        return new User(data);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = User;
}
