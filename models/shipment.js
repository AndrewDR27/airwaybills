// Shipment data model (AWB-based)
class Shipment {
    constructor(data = {}) {
        this.spaceId = data.spaceId || this.generateSpaceId(); // 10-digit alphanumeric ID
        this.awbNumber = data.awbNumber || null; // AWB number (set when AWB is created)
        this.createdBy = data.createdBy || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.status = data.status || 'pending'; // pending, active, in-transit, cancelled, deleted
        this.subStatus = data.subStatus || null; // at-destination, ready-for-pickup, delivered (for in-transit)
        this.isConfirmed = data.isConfirmed || false; // Whether agent has confirmed the AWB
        this.confirmedAt = data.confirmedAt || null; // When AWB was confirmed by agent
        this.confirmedBy = data.confirmedBy || null; // Who confirmed the AWB
        this.participants = data.participants || [];
        this.formData = data.formData || {}; // All AWB form data from create-awb.html
        this.fees = data.fees || [];
        this.totalFees = data.totalFees || 0;
        this.paidBy = data.paidBy || null;
        this.paidAt = data.paidAt || null;
        this.notes = data.notes || '';
        this.pdfBase64 = data.pdfBase64 || null; // Store PDF as base64 string
        this.pdfCreatedAt = data.pdfCreatedAt || null;
        this.isShared = data.isShared || false; // Whether AWB is marked as ready for participants
        this.sharedAt = data.sharedAt || null; // When AWB was shared
        this.factoryInvoice = data.factoryInvoice || null; // Factory invoice PDF as base64
        this.factoryInvoiceUploadedAt = data.factoryInvoiceUploadedAt || null;
        this.factoryInvoiceUploadedBy = data.factoryInvoiceUploadedBy || null;
    }

    generateSpaceId() {
        // Generate 10-digit alphanumeric ID (numbers and capital letters)
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateAWBNumber() {
        // Generate a simple AWB number: XXX-XXXXXXXX format
        const prefix = Math.floor(Math.random() * 900) + 100; // 100-999
        const suffix = Math.floor(Math.random() * 90000000) + 10000000; // 8 digits
        return `${prefix}-${suffix}`;
    }

    addParticipant(userId, role, invitedBy) {
        const existing = this.participants.find(p => p.userId === userId);
        if (!existing) {
            this.participants.push({
                userId: userId,
                role: role,
                invitedAt: new Date().toISOString(),
                invitedBy: invitedBy
            });
        }
    }

    removeParticipant(userId) {
        this.participants = this.participants.filter(p => p.userId !== userId);
    }

    addFee(role, amount, description) {
        this.fees.push({
            id: 'fee_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            role: role,
            amount: parseFloat(amount) || 0,
            description: description || '',
            addedAt: new Date().toISOString()
        });
        this.calculateTotalFees();
    }

    removeFee(feeId) {
        this.fees = this.fees.filter(f => f.id !== feeId);
        this.calculateTotalFees();
    }

    calculateTotalFees() {
        this.totalFees = this.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    }

    markAsPaid(paidBy) {
        this.paidBy = paidBy;
        this.paidAt = new Date().toISOString();
        this.status = 'completed';
    }

    cancel() {
        this.status = 'cancelled';
    }

    uncancel() {
        if (this.status === 'cancelled') {
            this.status = 'active';
        }
    }

    markAsShared() {
        this.isShared = true;
        this.sharedAt = new Date().toISOString();
    }

    confirmAWB(confirmedBy) {
        this.isConfirmed = true;
        this.confirmedAt = new Date().toISOString();
        this.confirmedBy = confirmedBy;
        // Move to active status when confirmed
        if (this.status === 'pending') {
            this.status = 'active';
        }
    }

    setStatus(status, subStatus = null) {
        this.status = status;
        this.subStatus = subStatus;
    }

    toJSON() {
        return {
            spaceId: this.spaceId,
            awbNumber: this.awbNumber,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            status: this.status,
            subStatus: this.subStatus,
            isConfirmed: this.isConfirmed,
            confirmedAt: this.confirmedAt,
            confirmedBy: this.confirmedBy,
            participants: this.participants,
            formData: this.formData,
            fees: this.fees,
            totalFees: this.totalFees,
            paidBy: this.paidBy,
            paidAt: this.paidAt,
            notes: this.notes,
            pdfBase64: this.pdfBase64,
            pdfCreatedAt: this.pdfCreatedAt,
            isShared: this.isShared,
            sharedAt: this.sharedAt,
            factoryInvoice: this.factoryInvoice,
            factoryInvoiceUploadedAt: this.factoryInvoiceUploadedAt,
            factoryInvoiceUploadedBy: this.factoryInvoiceUploadedBy
        };
    }

    static fromJSON(data) {
        return new Shipment(data);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Shipment;
}
if (typeof window !== 'undefined') {
    window.Shipment = Shipment;
}