// Shipment data model (AWB-based)
class Shipment {
    constructor(data = {}) {
        this.awbNumber = data.awbNumber || this.generateAWBNumber();
        this.createdBy = data.createdBy || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.status = data.status || 'draft'; // draft, in-progress, completed, cancelled
        this.participants = data.participants || [];
        this.formData = data.formData || {}; // All AWB form data from create-awb.html
        this.fees = data.fees || [];
        this.totalFees = data.totalFees || 0;
        this.paidBy = data.paidBy || null;
        this.paidAt = data.paidAt || null;
        this.notes = data.notes || '';
        this.pdfBase64 = data.pdfBase64 || null; // Store PDF as base64 string
        this.pdfCreatedAt = data.pdfCreatedAt || null;
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

    toJSON() {
        return {
            awbNumber: this.awbNumber,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            status: this.status,
            participants: this.participants,
            formData: this.formData,
            fees: this.fees,
            totalFees: this.totalFees,
            paidBy: this.paidBy,
            paidAt: this.paidAt,
            notes: this.notes,
            pdfBase64: this.pdfBase64,
            pdfCreatedAt: this.pdfCreatedAt
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
