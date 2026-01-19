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

// Get shipment by space ID
function getShipmentBySpaceId(spaceId) {
    const shipments = getAllShipments();
    const shipment = shipments.find(s => s.spaceId === spaceId);
    if (shipment && window.Shipment) {
        return new Shipment(shipment);
    }
    return shipment;
}

// Get shipments for current user (excluding deleted)
function getUserShipments(userId = null) {
    if (!userId) {
        const user = getCurrentUser();
        if (!user) return [];
        userId = user.id;
    }
    
    const user = getCurrentUser();
    const shipments = getAllShipments();
    
    // Admin can see all shipments
    if (user && user.role === 'admin') {
        return shipments.filter(s => s.status !== 'deleted');
    }
    
    return shipments.filter(s => {
        // Exclude deleted shipments
        if (s.status === 'deleted') return false;
        
        // Include if user is creator or participant
        return s.createdBy === userId || 
               s.participants.some(p => p.userId === userId);
    });
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

// Create shipment space (without AWB initially)
function createShipmentSpace(participants = []) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'Not authenticated' };
    }
    
    if (user.role !== 'issuing-carrier-agent') {
        return { success: false, message: 'Only Issuing Carrier Agents can create shipment spaces' };
    }
    
    // Try to get Shipment class from window, or use fallback
    let Shipment = window.Shipment;
    
    // Helper function to generate space ID
    const generateSpaceId = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    
    // Fallback: create a simple shipment object if class not available
    if (!Shipment) {
        console.warn('Shipment class not found on window, using fallback implementation');
        
        const newShipment = {
            spaceId: generateSpaceId(),
            awbNumber: null,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            status: 'pending',
            subStatus: null,
            isConfirmed: false,
            confirmedAt: null,
            confirmedBy: null,
            participants: [],
            formData: {},
            fees: [],
            totalFees: 0,
            paidBy: null,
            paidAt: null,
            notes: '',
            pdfBase64: null,
            pdfCreatedAt: null,
            isShared: false,
            sharedAt: null,
            factoryInvoice: null,
            factoryInvoiceUploadedAt: null,
            factoryInvoiceUploadedBy: null,
            addParticipant: function(userId, role, invitedBy) {
                const existing = this.participants.find(p => p.userId === userId);
                if (!existing) {
                    this.participants.push({
                        userId: userId,
                        role: role,
                        invitedAt: new Date().toISOString(),
                        invitedBy: invitedBy
                    });
                }
            },
            toJSON: function() {
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
        };
        
        // Add creator as participant
        newShipment.addParticipant(user.id, user.role, user.id);
        
        // Add invited participants
        participants.forEach(participant => {
            newShipment.addParticipant(participant.userId, participant.role, user.id);
        });
        
        // Save shipment
        const shipments = getAllShipments();
        shipments.push(newShipment.toJSON());
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
        
        return { success: true, shipment: newShipment };
    }
    
    // Use Shipment class if available
    const newShipment = new Shipment({
        createdBy: user.id,
        status: 'pending'
    });
    
    // Add creator as participant
    newShipment.addParticipant(user.id, user.role, user.id);
    
    // Add invited participants
    participants.forEach(participant => {
        newShipment.addParticipant(participant.userId, participant.role, user.id);
    });
    
    // Save shipment
    const shipments = getAllShipments();
    shipments.push(newShipment.toJSON());
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
    
    return { success: true, shipment: newShipment };
}

// Update shipment (by spaceId or awbNumber)
function updateShipment(identifier, updates) {
    const shipments = getAllShipments();
    let index = -1;
    
    // Try to find by spaceId first, then by awbNumber
    if (typeof identifier === 'string' && identifier.length === 10) {
        // Likely a spaceId (10 characters)
        index = shipments.findIndex(s => s.spaceId === identifier);
    }
    
    if (index === -1) {
        // Try by awbNumber
        index = shipments.findIndex(s => s.awbNumber === identifier);
    }
    
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

// Cancel shipment
function cancelShipment(spaceId) {
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (shipment.cancel) {
        shipment.cancel();
    } else {
        shipment.status = 'cancelled';
    }
    
    return updateShipment(spaceId, shipment.toJSON ? shipment.toJSON() : shipment);
}

// Uncancel shipment
function uncancelShipment(spaceId) {
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (shipment.uncancel) {
        shipment.uncancel();
    } else {
        shipment.status = 'active';
    }
    
    return updateShipment(spaceId, shipment.toJSON ? shipment.toJSON() : shipment);
}

// Delete shipment (only cancelled ones, by Agent only)
function deleteShipment(spaceId) {
    const user = getCurrentUser();
    if (!user || (user.role !== 'issuing-carrier-agent' && user.role !== 'admin')) {
        return { success: false, message: 'Only Issuing Carrier Agents or Administrators can delete shipments' };
    }
    
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (shipment.status !== 'cancelled') {
        return { success: false, message: 'Only cancelled shipments can be deleted' };
    }
    
    // Mark as deleted
    const shipments = getAllShipments();
    const index = shipments.findIndex(s => s.spaceId === spaceId);
    if (index !== -1) {
        shipments[index].status = 'deleted';
        shipments[index].deletedAt = new Date().toISOString();
        shipments[index].deletedBy = user.id;
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
        
        // Remove from other participants' views by filtering in getUserShipments
        return { success: true };
    }
    
    return { success: false, message: 'Shipment not found' };
}

// Mark shipment as shared
function shareShipment(spaceId) {
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (shipment.markAsShared) {
        shipment.markAsShared();
    } else {
        shipment.isShared = true;
        shipment.sharedAt = new Date().toISOString();
    }
    
    return updateShipment(spaceId, shipment.toJSON ? shipment.toJSON() : shipment);
}

// Confirm AWB (Agent only)
function confirmAWB(spaceId) {
    const user = getCurrentUser();
    if (!user || user.role !== 'issuing-carrier-agent') {
        return { success: false, message: 'Only Issuing Carrier Agents can confirm AWBs' };
    }
    
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (!shipment.awbNumber) {
        return { success: false, message: 'AWB number must be created before confirmation' };
    }
    
    if (shipment.confirmAWB) {
        shipment.confirmAWB(user.id);
    } else {
        shipment.isConfirmed = true;
        shipment.confirmedAt = new Date().toISOString();
        shipment.confirmedBy = user.id;
        if (shipment.status === 'pending') {
            shipment.status = 'active';
        }
    }
    
    return updateShipment(spaceId, shipment.toJSON ? shipment.toJSON() : shipment);
}

// Set shipment status
function setShipmentStatus(spaceId, status, subStatus = null) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'Not authenticated' };
    }
    
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    // Role-based permissions (admin has all permissions)
    if (user.role === 'admin') {
        // Admin can do anything - skip permission checks
    } else if (status === 'in-transit') {
        if (user.role !== 'issuing-carrier-agent') {
            return { success: false, message: 'Only Agents can set status to In Transit' };
        }
    } else if (status === 'in-transit' && subStatus) {
        // Setting substatus for in-transit shipments
        // Status must already be in-transit or we're updating it
        if (subStatus === 'at-destination') {
            if (user.role !== 'consignee' && user.role !== 'issuing-carrier-agent') {
                return { success: false, message: 'Only Consignees and Agents can set At Destination status' };
            }
        } else if (subStatus === 'ready-for-pickup') {
            if (user.role !== 'consignee' && user.role !== 'issuing-carrier-agent') {
                return { success: false, message: 'Only Consignees and Agents can set Ready for Pickup status' };
            }
        } else if (subStatus === 'delivered') {
            if (user.role !== 'consignee' && user.role !== 'courier') {
                return { success: false, message: 'Only Consignees and Couriers can set Delivered status' };
            }
        }
        // When setting substatus, ensure status is in-transit
        status = 'in-transit';
    }
    
    if (shipment.setStatus) {
        shipment.setStatus(status, subStatus);
    } else {
        shipment.status = status;
        shipment.subStatus = subStatus;
    }
    
    return updateShipment(spaceId, shipment.toJSON ? shipment.toJSON() : shipment);
}

// Upload factory invoice
function uploadFactoryInvoice(spaceId, fileBase64) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'Not authenticated' };
    }
    
    // Only shipper, consignee, agent, or admin can upload
    if (user.role !== 'shipper' && user.role !== 'consignee' && user.role !== 'issuing-carrier-agent' && user.role !== 'admin') {
        return { success: false, message: 'You do not have permission to upload factory invoices' };
    }
    
    const shipment = getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    if (shipment.status !== 'active' || !shipment.isConfirmed) {
        return { success: false, message: 'Factory invoices can only be uploaded for confirmed active shipments' };
    }
    
    shipment.factoryInvoice = fileBase64;
    shipment.factoryInvoiceUploadedAt = new Date().toISOString();
    shipment.factoryInvoiceUploadedBy = user.id;
    
    return updateShipment(spaceId, shipment.toJSON ? shipment.toJSON() : shipment);
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
    window.getShipmentBySpaceId = getShipmentBySpaceId;
    window.getUserShipments = getUserShipments;
    window.createShipment = createShipment;
    window.createShipmentSpace = createShipmentSpace;
    window.updateShipment = updateShipment;
    window.saveAWBFormData = saveAWBFormData;
    window.addFeeToShipment = addFeeToShipment;
    window.cancelShipment = cancelShipment;
    window.uncancelShipment = uncancelShipment;
    window.deleteShipment = deleteShipment;
    window.shareShipment = shareShipment;
    window.confirmAWB = confirmAWB;
    window.setShipmentStatus = setShipmentStatus;
    window.uploadFactoryInvoice = uploadFactoryInvoice;
}
