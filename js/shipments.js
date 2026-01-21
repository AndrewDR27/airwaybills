// Shipment management system
// Uses Upstash Redis database via API
// Database required everywhere (localhost and production)
// Note: localStorage may be used for caching, but NOT as a data source

const SHIPMENTS_STORAGE_KEY = 'awb_shipments';

// Get shipmentsAPI (will be available when api.js loads)
let shipmentsAPI = null;
if (typeof window !== 'undefined') {
    // Set immediately if already available
    if (window.shipmentsAPI) {
        shipmentsAPI = window.shipmentsAPI;
    }
    
    // Listen for apiReady event
    window.addEventListener('apiReady', () => {
        if (window.shipmentsAPI) {
            shipmentsAPI = window.shipmentsAPI;
        }
    });
    
    // Also check periodically in case event already fired
    const checkAPI = setInterval(() => {
        if (window.shipmentsAPI && !shipmentsAPI) {
            shipmentsAPI = window.shipmentsAPI;
        }
    }, 100);
    setTimeout(() => clearInterval(checkAPI), 5000);
}

// Get all shipments
async function getAllShipments() {
    if (!shipmentsAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        const shipments = await shipmentsAPI.getAll();
        // Convert to Shipment objects if Shipment class is available
        if (window.Shipment) {
            return shipments.map(s => new Shipment(s));
        }
        // Update localStorage cache (optional caching, not a data source)
        try {
            localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
        } catch (e) {
            console.warn('Could not update localStorage cache:', e);
        }
        return shipments;
    } catch (error) {
        console.error('Error fetching shipments from API:', error);
        throw error; // Database required
    }
}

// Note: localStorage fallback functions removed - database required everywhere

// Get shipment by AWB number
async function getShipmentByAWB(awbNumber) {
    if (!shipmentsAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        return await shipmentsAPI.getByAWB(awbNumber);
    } catch (error) {
        console.error('Error fetching shipment from API:', error);
        throw error; // Database required
    }
}

// Get shipment by space ID
async function getShipmentBySpaceId(spaceId) {
    if (!shipmentsAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
        const shipment = shipments.find(s => s.spaceId === spaceId);
        if (shipment && window.Shipment) {
            return new Shipment(shipment);
        }
        return shipment;
    }
    
    try {
        const shipment = await shipmentsAPI.getBySpaceId(spaceId);
        if (shipment && window.Shipment) {
            return new Shipment(shipment);
        }
        return shipment;
    } catch (error) {
        console.error('Error fetching shipment from API:', error);
        throw new Error('Database API not available. Please ensure the database is configured.');
        const shipment = shipments.find(s => s.spaceId === spaceId);
        if (shipment && window.Shipment) {
            return new Shipment(shipment);
        }
        return shipment;
    }
}

// Get shipments for current user (excluding deleted)
async function getUserShipments(userId = null) {
    if (!userId) {
        const user = getCurrentUser();
        if (!user) return [];
        userId = user.id;
    }
    
    // Check both module-level and window-level API
    let apiAvailable = shipmentsAPI || (typeof window !== 'undefined' && window.shipmentsAPI);
    if (!apiAvailable) {
        // Wait for apiReady event or poll for API
        await new Promise((resolve) => {
            if (window.shipmentsAPI) {
                apiAvailable = window.shipmentsAPI;
                resolve();
                return;
            }
            window.addEventListener('apiReady', () => {
                if (window.shipmentsAPI) {
                    apiAvailable = window.shipmentsAPI;
                    resolve();
                }
            }, { once: true });
            let checks = 0;
            const checkInterval = setInterval(() => {
                checks++;
                if (window.shipmentsAPI) {
                    apiAvailable = window.shipmentsAPI;
                    clearInterval(checkInterval);
                    resolve();
                } else if (checks >= 50) { // 5 seconds
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
        
        // After waiting, check again - API might have become available
        apiAvailable = shipmentsAPI || (typeof window !== 'undefined' && window.shipmentsAPI);
        
        if (!apiAvailable) {
            throw new Error('Database API not available. Please ensure the database is configured.');
        }
        
        // Update shipmentsAPI if window.shipmentsAPI is available
        if (window.shipmentsAPI && !shipmentsAPI) {
            shipmentsAPI = window.shipmentsAPI;
        }
    }
    
    // Use window.shipmentsAPI directly if module-level isn't set
    const apiToUse = shipmentsAPI || window.shipmentsAPI;
    
    // Final check - if still not available, throw error
    if (!apiToUse) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        const shipments = await apiToUse.getByUser(userId);
        const user = getCurrentUser();
        
        // Admin can see all shipments
        if (user && user.role === 'admin') {
            const allShipments = await apiToUse.getAll();
            return allShipments.filter(s => s.status !== 'deleted');
        }
        
        return shipments.filter(s => s.status !== 'deleted');
    } catch (error) {
        console.error('Error fetching user shipments from API:', error);
        throw error; // Database required
    }
}

// Create new shipment
async function createShipment(formDataOrOptions = {}) {
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
    const shipmentData = newShipment.toJSON ? newShipment.toJSON() : newShipment;
    
    if (shipmentsAPI) {
        try {
            const saved = await shipmentsAPI.create(shipmentData);
            return { success: true, shipment: newShipment };
        } catch (error) {
            console.error('Error creating shipment via API:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    }
    
    // Database required - no localStorage fallback
    
    throw new Error('Database API not available. Please ensure the database is configured.');
}

// Create shipment space (without AWB initially)
async function createShipmentSpace(participants = []) {
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
                // Return a clean object without functions
                const json = {
                    spaceId: this.spaceId,
                    awbNumber: this.awbNumber,
                    createdBy: this.createdBy,
                    createdAt: this.createdAt,
                    status: this.status,
                    subStatus: this.subStatus,
                    isConfirmed: this.isConfirmed,
                    confirmedAt: this.confirmedAt,
                    confirmedBy: this.confirmedBy,
                    participants: Array.isArray(this.participants) ? this.participants : [],
                    formData: this.formData || {},
                    fees: Array.isArray(this.fees) ? this.fees : [],
                    totalFees: this.totalFees || 0,
                    paidBy: this.paidBy,
                    paidAt: this.paidAt,
                    notes: this.notes || '',
                    pdfBase64: this.pdfBase64,
                    pdfCreatedAt: this.pdfCreatedAt,
                    isShared: this.isShared || false,
                    sharedAt: this.sharedAt,
                    factoryInvoice: this.factoryInvoice,
                    factoryInvoiceUploadedAt: this.factoryInvoiceUploadedAt,
                    factoryInvoiceUploadedBy: this.factoryInvoiceUploadedBy
                };
                // Remove any undefined values to ensure clean JSON
                Object.keys(json).forEach(key => {
                    if (json[key] === undefined) {
                        delete json[key];
                    }
                });
                return json;
            }
        };
        
        // Add creator as participant
        newShipment.addParticipant(user.id, user.role, user.id);
        
        // Add invited participants
        participants.forEach(participant => {
            newShipment.addParticipant(participant.userId, participant.role, user.id);
        });
        
        // Save shipment
        const shipmentData = newShipment.toJSON();
        
        // Ensure shipmentsAPI is available
        let apiToUse = shipmentsAPI || (typeof window !== 'undefined' && window.shipmentsAPI);
        if (!apiToUse) {
            // Wait for API to be available
            await new Promise((resolve) => {
                if (window.shipmentsAPI) {
                    apiToUse = window.shipmentsAPI;
                    resolve();
                    return;
                }
                window.addEventListener('apiReady', () => {
                    if (window.shipmentsAPI) {
                        apiToUse = window.shipmentsAPI;
                        resolve();
                    }
                }, { once: true });
                let checks = 0;
                const checkInterval = setInterval(() => {
                    checks++;
                    if (window.shipmentsAPI) {
                        apiToUse = window.shipmentsAPI;
                        clearInterval(checkInterval);
                        resolve();
                    } else if (checks >= 50) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        if (!apiToUse) {
            throw new Error('Database API not available. Please ensure the database is configured.');
        }
        
        if (apiToUse) {
            try {
                // Log the data being sent for debugging
                console.log('Creating shipment with data (fallback):', JSON.stringify(shipmentData, null, 2));
                console.log('Shipment data keys (fallback):', Object.keys(shipmentData));
                console.log('Has spaceId (fallback):', !!shipmentData.spaceId, shipmentData.spaceId);
                console.log('Has createdBy (fallback):', !!shipmentData.createdBy, shipmentData.createdBy);
                console.log('Participants (fallback):', shipmentData.participants);
                
                const saved = await apiToUse.create(shipmentData);
                // Use the saved shipment from API (it might have additional fields or different structure)
                if (saved && saved.spaceId) {
                    // Update newShipment with saved data to ensure consistency
                    if (newShipment.spaceId !== saved.spaceId) {
                        newShipment.spaceId = saved.spaceId;
                    }
                    // Also update localStorage cache for immediate access (optional caching)
                    try {
                        const shipments = JSON.parse(localStorage.getItem(SHIPMENTS_STORAGE_KEY) || '[]');
                        const existingIndex = shipments.findIndex(s => s.spaceId === saved.spaceId);
                        if (existingIndex >= 0) {
                            shipments[existingIndex] = saved;
                        } else {
                            shipments.push(saved);
                        }
                        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
                    } catch (e) {
                        console.warn('Could not update localStorage cache:', e);
                    }
                    return { success: true, shipment: saved };
                }
                return { success: true, shipment: newShipment };
            } catch (error) {
                console.error('Error creating shipment via API:', error);
            // Database required - no localStorage fallback
                throw error; // Require database in production
            }
        }
        
            // Database required - no localStorage fallback
        
        throw new Error('Database API not available. Please ensure the database is configured.');
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
    const shipmentData = newShipment.toJSON();
    
    // Ensure shipmentsAPI is available
    let apiToUse = shipmentsAPI || (typeof window !== 'undefined' && window.shipmentsAPI);
    if (!apiToUse) {
        // Wait for API to be available
        await new Promise((resolve) => {
            if (window.shipmentsAPI) {
                apiToUse = window.shipmentsAPI;
                resolve();
                return;
            }
            window.addEventListener('apiReady', () => {
                if (window.shipmentsAPI) {
                    apiToUse = window.shipmentsAPI;
                    resolve();
                }
            }, { once: true });
            let checks = 0;
            const checkInterval = setInterval(() => {
                checks++;
                if (window.shipmentsAPI) {
                    apiToUse = window.shipmentsAPI;
                    clearInterval(checkInterval);
                    resolve();
                } else if (checks >= 50) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    if (!apiToUse) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        // Log the data being sent for debugging
        console.log('Creating shipment with data:', JSON.stringify(shipmentData, null, 2));
        console.log('Shipment data keys:', Object.keys(shipmentData));
        console.log('Has spaceId:', !!shipmentData.spaceId, shipmentData.spaceId);
        console.log('Has createdBy:', !!shipmentData.createdBy, shipmentData.createdBy);
        console.log('Participants:', shipmentData.participants);
        
        const saved = await apiToUse.create(shipmentData);
        // Use the saved shipment from API (it might have additional fields or different structure)
        if (saved && saved.spaceId) {
            // Update newShipment with saved data to ensure consistency
            if (newShipment.spaceId !== saved.spaceId) {
                newShipment.spaceId = saved.spaceId;
            }
            // Also update localStorage cache for immediate access (optional caching)
            try {
                const shipments = JSON.parse(localStorage.getItem(SHIPMENTS_STORAGE_KEY) || '[]');
                const existingIndex = shipments.findIndex(s => s.spaceId === saved.spaceId);
                if (existingIndex >= 0) {
                    shipments[existingIndex] = saved;
                } else {
                    shipments.push(saved);
                }
                localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
            } catch (e) {
                console.warn('Could not update localStorage cache:', e);
            }
            return { success: true, shipment: saved };
        }
        return { success: true, shipment: newShipment };
    } catch (error) {
        console.error('Error creating shipment via API:', error);
        // Database required - no localStorage fallback
        throw error;
    }
}

// Update shipment (by spaceId or awbNumber)
async function updateShipment(identifier, updates) {
    // Get shipment first to find spaceId
    let shipment;
    if (typeof identifier === 'string' && identifier.length === 10) {
        shipment = await getShipmentBySpaceId(identifier);
    } else {
        shipment = await getShipmentByAWB(identifier);
    }
    
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    const spaceId = shipment.spaceId;
    
    // Merge updates
    const currentShipment = shipment;
    if (updates.participants && Array.isArray(updates.participants)) {
        // If participants are explicitly provided, replace them (don't merge)
        // This allows for removal of participants
        // The array passed in is the complete, final list
        updates.participants = updates.participants;
    }
    
    // Merge updates
    const updatedShipment = { ...currentShipment, ...updates };
    
    // Recalculate fees if needed
    if (updates.fees || updates.fee) {
        updatedShipment.totalFees = (updatedShipment.fees || []).reduce((sum, fee) => sum + (fee.amount || 0), 0);
    }
    
    // Save via API
    if (shipmentsAPI) {
        try {
            const saved = await shipmentsAPI.update({ ...updatedShipment, spaceId });
            return { success: true, shipment: saved };
        } catch (error) {
            console.error('Error updating shipment via API:', error);
            // Database required - no localStorage fallback
            throw error; // Require database in production
        }
    }
    
    // Database required - no localStorage fallback
    
    throw new Error('Database API not available. Please ensure the database is configured.');
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

// Delete shipment (by Agent or Admin only)
async function deleteShipment(spaceId) {
    // Try to get user - use async version to ensure we have the latest user data
    let user = getCurrentUser();
    if (!user && typeof window !== 'undefined' && typeof window.getCurrentUserAsync === 'function') {
        try {
            user = await window.getCurrentUserAsync();
        } catch (error) {
            console.warn('getCurrentUserAsync failed, trying sync version:', error);
            user = getCurrentUser();
        }
    }
    
    console.log('deleteShipment - user:', user, 'role:', user?.role);
    if (!user || (user.role !== 'issuing-carrier-agent' && user.role !== 'admin')) {
        console.log('deleteShipment - Access denied. User:', user ? `role=${user.role}` : 'null');
        return { success: false, message: 'Only Issuing Carrier Agents or Administrators can delete shipments' };
    }
    
    const shipment = await getShipmentBySpaceId(spaceId);
    if (!shipment) {
        return { success: false, message: 'Shipment not found' };
    }
    
    // Allow deletion of any space that is not already deleted or in-transit
    if (shipment.status === 'deleted') {
        return { success: false, message: 'This shipment has already been deleted' };
    }
    
    if (shipment.status === 'in-transit') {
        return { success: false, message: 'Cannot delete shipments that are in-transit' };
    }
    
    // Ensure shipmentsAPI is available
    let apiToUse = shipmentsAPI || (typeof window !== 'undefined' && window.shipmentsAPI);
    if (!apiToUse) {
        // Wait for API to be available
        await new Promise((resolve) => {
            if (window.shipmentsAPI) {
                apiToUse = window.shipmentsAPI;
                resolve();
                return;
            }
            window.addEventListener('apiReady', () => {
                if (window.shipmentsAPI) {
                    apiToUse = window.shipmentsAPI;
                    resolve();
                }
            }, { once: true });
            let checks = 0;
            const checkInterval = setInterval(() => {
                checks++;
                if (window.shipmentsAPI) {
                    apiToUse = window.shipmentsAPI;
                    clearInterval(checkInterval);
                    resolve();
                } else if (checks >= 50) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    if (!apiToUse) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    // Delete via API
    try {
        await apiToUse.delete(spaceId, user.id);
        return { success: true };
    } catch (error) {
        console.error('Error deleting shipment via API:', error);
        // Database required - no localStorage fallback
        throw error; // Require database in production
    }
}

// Expose deleteShipment to window for use in HTML pages
if (typeof window !== 'undefined') {
    window.deleteShipment = deleteShipment;
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
