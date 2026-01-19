// Shipment management system
const SHIPMENTS_STORAGE_KEY = 'awb_shipments';

// Get all shipments
function getAllShipments() {
    const shipmentsData = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (!shipmentsData) {
        return [];
    }
    
    try {
        const shipments = JSON.parse(shipmentsData);
        // Convert to Shipment objects if Shipment class is available
        if (window.Shipment) {
            return shipments.map(s => new Shipment(s));
        }
        return shipments;
    } catch (e) {
        console.error('Error parsing shipments:', e);
        return [];
    }
}

// Get shipment by AWB number
function getShipmentByAWB(awbNumber) {
    const shipments = getAllShipments();
    return shipments.find(s => s.awbNumber === awbNumber);
}

// Get shipments for current user
function getUserShipments(userId = null) {
    if (!userId) {
        const user = getCurrentUser();
        if (!user) return [];
        userId = user.id;
    }
    
    const shipments = getAllShipments();
    return shipments.filter(s => 
        s.createdBy === userId || 
        s.participants.some(p => p.userId === userId)
    );
}

// Create new shipment
function createShipment(formDataOrOptions = {}) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'Not authenticated' };
    }
    
    // Handle both old format (just formData) and new format (options object)
    let formData = {};
    let awbNumber = null;
    let pdfBase64 = null;
    let pdfCreatedAt = null;
    
    if (formDataOrOptions && typeof formDataOrOptions === 'object') {
        if (formDataOrOptions.awbNumber || formDataOrOptions.pdfBase64) {
            // New format: { formData: {...}, awbNumber: "...", pdfBase64: "...", pdfCreatedAt: "..." }
            awbNumber = formDataOrOptions.awbNumber || null;
            formData = formDataOrOptions.formData || formDataOrOptions;
            pdfBase64 = formDataOrOptions.pdfBase64 || null;
            pdfCreatedAt = formDataOrOptions.pdfCreatedAt || null;
        } else if (formDataOrOptions.formData) {
            // Also new format
            formData = formDataOrOptions.formData;
            awbNumber = formDataOrOptions.awbNumber || null;
            pdfBase64 = formDataOrOptions.pdfBase64 || null;
            pdfCreatedAt = formDataOrOptions.pdfCreatedAt || null;
        } else {
            // Old format: just formData object
            formData = formDataOrOptions;
        }
    }
    
    const Shipment = window.Shipment || (typeof require !== 'undefined' ? require('../models/shipment.js') : null);
    
    let newShipment;
    if (Shipment) {
        const shipmentData = {
            createdBy: user.id,
            formData: formData
        };
        if (awbNumber) {
            shipmentData.awbNumber = awbNumber;
        }
        if (pdfBase64) {
            shipmentData.pdfBase64 = pdfBase64;
        }
        if (pdfCreatedAt) {
            shipmentData.pdfCreatedAt = pdfCreatedAt;
        }
        newShipment = new Shipment(shipmentData);
    } else {
        // Fallback if Shipment class not loaded
        let generatedAWB;
        if (awbNumber) {
            generatedAWB = awbNumber;
        } else {
            const prefix = Math.floor(Math.random() * 900) + 100;
            const suffix = Math.floor(Math.random() * 90000000) + 10000000;
            generatedAWB = `${prefix}-${suffix}`;
        }
        newShipment = {
            awbNumber: generatedAWB,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            status: 'draft',
            participants: [{
                userId: user.id,
                role: user.role,
                invitedAt: new Date().toISOString(),
                invitedBy: user.id
            }],
            formData: formData,
            fees: [],
            totalFees: 0,
            paidBy: null,
            paidAt: null,
            notes: '',
            pdfBase64: pdfBase64 || null,
            pdfCreatedAt: pdfCreatedAt || null
        };
    }
    
    // Add creator as participant
    if (newShipment.addParticipant) {
        newShipment.addParticipant(user.id, user.role, user.id);
    }
    
    // Save shipment
    const shipments = getAllShipments();
    shipments.push(newShipment.toJSON ? newShipment.toJSON() : newShipment);
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
    
    return { success: true, shipment: newShipment };
}

// Update shipment
function updateShipment(awbNumber, updates) {
    const shipments = getAllShipments();
    const index = shipments.findIndex(s => s.awbNumber === awbNumber);
    
    if (index === -1) {
        return { success: false, message: 'Shipment not found' };
    }
    
    // Merge updates
    shipments[index] = { ...shipments[index], ...updates };
    
    // Recalculate fees if needed
    if (updates.fees || updates.fee) {
        const shipment = shipments[index];
        shipment.totalFees = (shipment.fees || []).reduce((sum, fee) => sum + (fee.amount || 0), 0);
    }
    
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
    
    return { success: true, shipment: shipments[index] };
}

// Save AWB form data to shipment
function saveAWBFormData(awbNumber, formData) {
    return updateShipment(awbNumber, { formData: formData });
}

// Add fee to shipment
function addFeeToShipment(awbNumber, role, amount, description) {
    const shipment = getShipmentByAWB(awbNumber);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (shipment.addFee) {
        shipment.addFee(role, amount, description);
    } else {
        // Fallback
        if (!shipment.fees) shipment.fees = [];
        shipment.fees.push({
            id: 'fee_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            role: role,
            amount: parseFloat(amount) || 0,
            description: description || '',
            addedAt: new Date().toISOString()
        });
        shipment.totalFees = shipment.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    }
    
    return updateShipment(awbNumber, shipment.toJSON ? shipment.toJSON() : shipment);
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.getAllShipments = getAllShipments;
    window.getShipmentByAWB = getShipmentByAWB;
    window.getUserShipments = getUserShipments;
    window.createShipment = createShipment;
    window.updateShipment = updateShipment;
    window.saveAWBFormData = saveAWBFormData;
    window.addFeeToShipment = addFeeToShipment;
}
