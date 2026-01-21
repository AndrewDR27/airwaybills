// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Module-level variables for state
let pdfDoc = null;
let formFields = [];
let originalPdfBytes = null; // Will store as ArrayBuffer or Uint8Array
let currentAirlineImage = null; // Store the current airline logo image (base64 data URL)

// DOM element references (will be initialized when DOM is ready)
let loading, error, formSection, generatedForm;
let submitBtn, printPreviewBtn, fillPdfBtn, fillAndFlattenBtn, results, resultsContent;
let templateSelect, templateNameInput, templateNameGroup, templateNameLabel, saveTemplateBtn, deleteTemplateBtn, renameTemplateBtn, clearFormBtn;
let isRenamingTemplate = false;
let currentTemplateName = null; // Track which template is currently loaded
let missingFieldsModal, missingFieldsList, cancelMissingFieldsBtn, confirmMissingFieldsBtn;
let missingFieldsCallback = null; // Store the callback for when user confirms/cancels

// Contact management elements
let contactControlsSection, shipperSelect, consigneeSelect, addShipperBtn, addConsigneeBtn;
let routingControlsSection, airlineSelect1, addAirlineBtn1, destinationSelect, addDestinationBtn, directFlightSelect, interlineCarrierSelect1, interlineCarrierSelect2, addInterlineCarrier2Btn;
let contactModal, contactForm, contactId, contactType, contactCompanyName, contactName, contactEmail, contactPhone, contactAddress, contactFormattedValue, contactAccountInfo, accountInfoGroup, contactOrigin, originInfoGroup, formattedValueGroup, contactAWBP, awbpInfoGroup, contactAirlineAbbreviation, airlineAbbreviationGroup, contactAoDEP, aoDEPInfoGroup, contactHandlingInfo, handlingInfoGroup, contactField06, contactField06Group, contactNameGroup;
let contactNameLabel, contactEmailLabel, contactPhoneLabel, contactAddressLabel, formattedValueLabel;
let closeContactModal, cancelContactBtn, saveContactBtn, modalTitle;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

function initializeApp() {
    // Get DOM elements
    loading = document.getElementById('loading');
    error = document.getElementById('error');
    formSection = document.getElementById('formSection');
    generatedForm = document.getElementById('generatedForm');
    submitBtn = document.getElementById('submitBtn');
    printPreviewBtn = document.getElementById('printPreviewBtn');
    fillPdfBtn = document.getElementById('fillPdfBtn');
    fillAndFlattenBtn = document.getElementById('fillAndFlattenBtn');
    results = document.getElementById('results');
    resultsContent = document.getElementById('resultsContent');
    
    // Template management elements
    templateSelect = document.getElementById('templateSelect');
    templateNameInput = document.getElementById('templateNameInput');
    templateNameGroup = document.getElementById('templateNameGroup');
    templateNameLabel = templateNameGroup ? templateNameGroup.querySelector('label') : null;
    saveTemplateBtn = document.getElementById('saveTemplateBtn');
    deleteTemplateBtn = document.getElementById('deleteTemplateBtn');
    renameTemplateBtn = document.getElementById('renameTemplateBtn');
    clearFormBtn = document.getElementById('clearFormBtn');
    missingFieldsModal = document.getElementById('missingFieldsModal');
    missingFieldsList = document.getElementById('missingFieldsList');
    cancelMissingFieldsBtn = document.getElementById('cancelMissingFieldsBtn');
    confirmMissingFieldsBtn = document.getElementById('confirmMissingFieldsBtn');
    
    // Contact management elements
    contactControlsSection = document.getElementById('contactControlsSection');
    shipperSelect = document.getElementById('shipperSelect');
    consigneeSelect = document.getElementById('consigneeSelect');
    addShipperBtn = document.getElementById('addShipperBtn');
    addConsigneeBtn = document.getElementById('addConsigneeBtn');
    contactModal = document.getElementById('contactModal');
    contactForm = document.getElementById('contactForm');
    contactId = document.getElementById('contactId');
    contactType = document.getElementById('contactType');
    contactCompanyName = document.getElementById('contactCompanyName');
    contactName = document.getElementById('contactName');
    contactEmail = document.getElementById('contactEmail');
    contactPhone = document.getElementById('contactPhone');
    contactAddress = document.getElementById('contactAddress');
    contactFormattedValue = document.getElementById('contactFormattedValue');
    contactAccountInfo = document.getElementById('contactAccountInfo');
    accountInfoGroup = document.getElementById('accountInfoGroup');
    contactOrigin = document.getElementById('contactOrigin');
    originInfoGroup = document.getElementById('originInfoGroup');
    contactAoDEP = document.getElementById('contactAoDEP');
    aoDEPInfoGroup = document.getElementById('aoDEPInfoGroup');
    contactHandlingInfo = document.getElementById('contactHandlingInfo');
    handlingInfoGroup = document.getElementById('handlingInfoGroup');
    contactField06 = document.getElementById('contactField06');
    contactField06Group = document.getElementById('contactField06Group');
    contactNameGroup = document.getElementById('contactNameGroup');
    contactAWBP = document.getElementById('contactAWBP');
    awbpInfoGroup = document.getElementById('awbpInfoGroup');
    contactAirlineAbbreviation = document.getElementById('contactAirlineAbbreviation');
    airlineAbbreviationGroup = document.getElementById('airlineAbbreviationGroup');
    formattedValueGroup = document.getElementById('formattedValueGroup');
    formattedValueLabel = document.getElementById('formattedValueLabel');
    contactNameLabel = document.getElementById('contactNameLabel');
    contactEmailLabel = document.getElementById('contactEmailLabel');
    contactPhoneLabel = document.getElementById('contactPhoneLabel');
    contactAddressLabel = document.getElementById('contactAddressLabel');
    routingControlsSection = document.getElementById('routingControlsSection');
    airlineSelect1 = document.getElementById('airlineSelect1');
    addAirlineBtn1 = document.getElementById('addAirlineBtn1');
    destinationSelect = document.getElementById('destinationSelect');
    addDestinationBtn = document.getElementById('addDestinationBtn');
    directFlightSelect = document.getElementById('directFlightSelect');
    interlineCarrierSelect1 = document.getElementById('interlineCarrierSelect1');
    interlineCarrierSelect2 = document.getElementById('interlineCarrierSelect2');
    addInterlineCarrier2Btn = document.getElementById('addInterlineCarrier2Btn');
    closeContactModal = document.getElementById('closeContactModal');
    cancelContactBtn = document.getElementById('cancelContactBtn');
    saveContactBtn = document.getElementById('saveContactBtn');
    modalTitle = document.getElementById('modalTitle');

    // Button event handlers - verify buttons exist first
    if (fillPdfBtn) {
        fillPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Fill PDF button clicked - handler triggered');
            handleFillPdf(false); // false = don't flatten
        });
        console.log('Fill PDF button event listener attached');
    } else {
        // fillPdfBtn is optional - edit page doesn't have it, only has fillAndFlattenBtn
        console.log('Fill PDF button not found (this is OK for edit page)');
    }
    
    if (fillAndFlattenBtn) {
        fillAndFlattenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Fill and Flatten PDF button clicked');
            handleFillPdf(true); // true = flatten the form
        });
        console.log('Fill and Flatten PDF button event listener attached');
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }
    
    if (printPreviewBtn) {
        printPreviewBtn.addEventListener('click', handlePrintPreview);
    }
    
    // Template management event handlers
    if (templateSelect) {
        templateSelect.addEventListener('change', handleTemplateSelect);
    }
    
    if (saveTemplateBtn) {
        saveTemplateBtn.addEventListener('click', handleSaveTemplate);
    }
    
    if (deleteTemplateBtn) {
        deleteTemplateBtn.addEventListener('click', handleDeleteTemplate);
    }
    
    if (renameTemplateBtn) {
        renameTemplateBtn.addEventListener('click', handleRenameTemplate);
    }
    
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', handleClearForm);
    }
    
    // Missing fields modal event handlers
    if (cancelMissingFieldsBtn) {
        cancelMissingFieldsBtn.addEventListener('click', () => {
            if (missingFieldsModal) {
                missingFieldsModal.style.display = 'none';
            }
            if (missingFieldsCallback) {
                missingFieldsCallback(false);
                missingFieldsCallback = null;
            }
        });
    }
    
    if (confirmMissingFieldsBtn) {
        confirmMissingFieldsBtn.addEventListener('click', () => {
            if (missingFieldsModal) {
                missingFieldsModal.style.display = 'none';
            }
            if (missingFieldsCallback) {
                missingFieldsCallback(true);
                missingFieldsCallback = null;
            }
        });
    }
    
    // Close modal when clicking outside
    if (missingFieldsModal) {
        missingFieldsModal.addEventListener('click', (e) => {
            if (e.target === missingFieldsModal) {
                missingFieldsModal.style.display = 'none';
                if (missingFieldsCallback) {
                    missingFieldsCallback(false);
                    missingFieldsCallback = null;
                }
            }
        });
    }
    
    // Allow Enter key to save template
    if (templateNameInput) {
        templateNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSaveTemplate();
            }
        });
    }
    
    // Contact management event handlers
    if (addShipperBtn) {
        addShipperBtn.addEventListener('click', () => {
            const selectedId = shipperSelect ? shipperSelect.value : null;
            if (selectedId && selectedId !== '' && selectedId !== 'edit') {
                openContactModal('Shipper', selectedId);
            } else {
                openContactModal('Shipper', null);
            }
        });
    }
    
    if (addConsigneeBtn) {
        addConsigneeBtn.addEventListener('click', () => {
            const selectedId = consigneeSelect ? consigneeSelect.value : null;
            if (selectedId && selectedId !== '' && selectedId !== 'edit') {
                openContactModal('Consignee', selectedId);
            } else {
                openContactModal('Consignee', null);
            }
        });
    }
    
    
    // Airline 1 handlers - redirect to airlines.html instead of opening contact modal
    if (addAirlineBtn1) {
        addAirlineBtn1.addEventListener('click', () => {
            // Redirect to airlines management page instead of opening contact modal
            if (window.parent && window.parent !== window) {
                // In iframe - tell parent to navigate
                window.parent.location.href = 'airlines.html';
            } else {
                // Not in iframe - direct navigation
                window.location.href = 'airlines.html';
            }
        });
    }
    
    if (airlineSelect1) {
        airlineSelect1.addEventListener('change', (e) => {
            const value = e.target.value;
            console.log('airlineSelect1 changed to:', value);
            if (value) {
                // Wait a bit to ensure form is ready, then fill
                // Try multiple times in case form is still loading
                let attempts = 0;
                const tryFill = async () => {
                    attempts++;
                    if (!generatedForm && attempts < 10) {
                        setTimeout(tryFill, 100);
                        return;
                    }
                    await fillAirlineField(value);
                };
                tryFill();
                updateContactButtonText('Airline', addAirlineBtn1, airlineSelect1);
                setTimeout(() => updatePromptIndicators(), 100);
            } else {
                // Clear fields when no airline selected
                clearAirlineFields();
                updateContactButtonText('Airline', addAirlineBtn1, airlineSelect1);
                setTimeout(() => updatePromptIndicators(), 100);
            }
        });
    }
    
    // Destination handlers
    if (addDestinationBtn) {
        addDestinationBtn.addEventListener('click', () => {
            // Open destinations page in a new tab/window or navigate to it
            window.open('destinations.html', '_blank');
        });
    }
    
    if (destinationSelect) {
        destinationSelect.addEventListener('change', async (e) => {
            const value = e.target.value;
            if (value) {
                await fillDestinationFields(value);
                setTimeout(() => updatePromptIndicators(), 100);
            }
            updateContactButtonText('Destination', addDestinationBtn, destinationSelect);
            setTimeout(() => updatePromptIndicators(), 100);
        });
    }
    
    // Direct Flight dropdown handler
    if (directFlightSelect) {
        directFlightSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            handleDirectFlightChange(value === 'Yes');
        });
    }
    
    // Interline Shipment dropdown handler
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    if (interlineShipmentSelect) {
        interlineShipmentSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            handleInterlineShipmentChange(value === 'Yes');
        });
    }
    
    // Interline Carrier handlers (no add buttons, just change listeners)
    if (interlineCarrierSelect1) {
        interlineCarrierSelect1.addEventListener('change', async (e) => {
            const value = e.target.value;
            if (value) {
                await fillInterlineCarrier1Field(value);
            }
        });
    }
    
    // Add Interline Carrier 2 button handler
    if (addInterlineCarrier2Btn) {
        addInterlineCarrier2Btn.addEventListener('click', async () => {
            const addBtnGroup = document.getElementById('addInterlineCarrier2BtnGroup');
            const interlineCarrierGroup2 = document.getElementById('interlineCarrierGroup2');
            
            if (addBtnGroup) {
                addBtnGroup.style.display = 'none';
            }
            if (interlineCarrierGroup2) {
                interlineCarrierGroup2.style.display = 'flex';
            }
            
            // Always populate the dropdown when it's shown - use airlinesAPI only with deduplication
            if (interlineCarrierSelect2) {
                const currentValue = interlineCarrierSelect2.value;
                interlineCarrierSelect2.innerHTML = '<option value="">-- Select Airline --</option>';
                
                // Only load from airlinesAPI (Locations > Airlines) - no contacts fallback
                let airlines = [];
                if (window.airlinesAPI) {
                    try {
                        airlines = await window.airlinesAPI.getAll();
                        console.log('Loaded airlines for Interline Carrier 2 from API:', airlines.length);
                    } catch (error) {
                        console.error('Could not load airlines from API:', error);
                        airlines = [];
                    }
                } else {
                    console.warn('airlinesAPI not available');
                    airlines = [];
                }
                
                // Deduplicate airlines by ID and company name to prevent duplicates
                const seenIds = new Set();
                const seenNames = new Set();
                const uniqueAirlines = airlines.filter(airline => {
                    // Check for duplicate ID
                    if (seenIds.has(airline.id)) {
                        console.warn('Duplicate airline ID found:', airline.id, airline.companyName);
                        return false;
                    }
                    // Check for duplicate company name (case-insensitive)
                    const nameKey = (airline.companyName || '').toLowerCase().trim();
                    if (nameKey && seenNames.has(nameKey)) {
                        console.warn('Duplicate airline name found:', airline.companyName, 'ID:', airline.id);
                        return false;
                    }
                    seenIds.add(airline.id);
                    if (nameKey) seenNames.add(nameKey);
                    return true;
                });
                
                console.log(`Displaying ${uniqueAirlines.length} unique airlines for Interline Carrier 2 (${airlines.length} total loaded)`);
                
                uniqueAirlines.forEach(airline => {
                    const option = document.createElement('option');
                    option.value = airline.id;
                    // Format: "ABBREVIATION - Company Name" or just "Company Name" if no abbreviation
                    const displayText = airline.airlineAbbreviation 
                        ? `${airline.airlineAbbreviation} - ${airline.companyName}`
                        : airline.companyName;
                    option.textContent = displayText;
                    interlineCarrierSelect2.appendChild(option);
                });
                
                // Restore selection if it still exists
                if (currentValue && currentValue !== 'edit') {
                    interlineCarrierSelect2.value = currentValue;
                }
            }
        });
    }
    
    // Interline Carrier 2 handler
    if (interlineCarrierSelect2) {
        interlineCarrierSelect2.addEventListener('change', async (e) => {
            const value = e.target.value;
            if (value) {
                // Unlock fields 13 and 14 and fill field 14 with airline abbreviation
                await handleInterlineCarrier2Change(value);
            } else {
                // If cleared, lock fields 13 and 14 again
                await handleInterlineCarrier2Change(null);
            }
        });
    }
    
    // Dangerous Goods dropdown handler
    const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    if (dangerousGoodsSelect) {
        dangerousGoodsSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            handleDangerousGoodsChange(value === 'Yes');
        });
    }
    
    // Declared Values dropdown handler
    const declaredValuesSelect = document.getElementById('declaredValuesSelect');
    if (declaredValuesSelect) {
        declaredValuesSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            handleDeclaredValuesChange(value === 'No');
        });
    }
    
    // Insurance dropdown handler
    const insuranceSelect = document.getElementById('insuranceSelect');
    if (insuranceSelect) {
        insuranceSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            handleInsuranceChange(value === 'No');
        });
    }
    
    // Prepaid or Collect dropdown handler
    const prepaidCollectSelect = document.getElementById('prepaidCollectSelect');
    if (prepaidCollectSelect) {
        prepaidCollectSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            handlePrepaidCollectChange(value);
        });
    }
    
    // Dimensions handlers
    const addDimensionsBoxBtn = document.getElementById('addDimensionsBoxBtn');
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    const minimizeDimensionsBtn = document.getElementById('minimizeDimensionsBtn');
    
    if (addDimensionsBoxBtn && dimensionsContainer) {
        addDimensionsBoxBtn.addEventListener('click', addDimensionsRow);
        
        // Set up event delegation for remove buttons
        dimensionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('dim-remove-btn')) {
                const row = e.target.closest('.dimensions-row');
                if (row) {
                    removeDimensionsRow(row);
                }
            }
        });
        
        // Minimize button handler
        if (minimizeDimensionsBtn) {
            minimizeDimensionsBtn.addEventListener('click', toggleDimensionsMinimize);
        }
        
        // Update add button state
        updateDimensionsAddButton();
        updateMinimizeButton();
        
        // Set up event listeners for first row inputs to update field 34
        setupDimensionsField34Update();
        
        // Update dimensions fields state on initial load
        setTimeout(() => {
            updateDimensionsFieldsState();
        }, 100);
    }
    
    // Commodity dropdown handler
    const commoditySelect = document.getElementById('commoditySelect');
    if (commoditySelect) {
        // Populate commodity dropdown from user profile
        populateCommodityDropdown();
        
        // Handle commodity selection
        commoditySelect.addEventListener('change', (e) => {
            const selectedCommodity = e.target.value;
            if (selectedCommodity) {
                fillField33FromCommodity(selectedCommodity);
            }
        });
    }
    
    if (shipperSelect) {
        shipperSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value) {
                fillContactField('04', value);
                updateContactButtonText('Shipper', addShipperBtn, shipperSelect);
                setTimeout(() => updatePromptIndicators(), 100);
            } else {
                updateContactButtonText('Shipper', addShipperBtn, shipperSelect);
                setTimeout(() => updatePromptIndicators(), 100);
            }
        });
    }
    
    if (consigneeSelect) {
        consigneeSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value) {
                fillContactField('05', value);
                updateContactButtonText('Consignee', addConsigneeBtn, consigneeSelect);
                setTimeout(() => updatePromptIndicators(), 100);
            } else {
                updateContactButtonText('Consignee', addConsigneeBtn, consigneeSelect);
                setTimeout(() => updatePromptIndicators(), 100);
            }
        });
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleSaveContact);
    }
    
    if (closeContactModal) {
        closeContactModal.addEventListener('click', closeContactModalHandler);
    }
    
    if (cancelContactBtn) {
        cancelContactBtn.addEventListener('click', closeContactModalHandler);
    }
    
    // Close modal when clicking outside
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                closeContactModalHandler();
            }
        });
    }
    
    
    // Update template dropdown when form is generated
    // This will be called after generateForm()
    
    // Initialize tabs
    initializeTabs();
    
    // Auto-load default PDF if available (with small delay to ensure page is fully loaded)
    setTimeout(() => {
        loadDefaultPDF().then(() => {
            // Don't auto-restore form data - form should start fresh
            // restoreFormData() is only called explicitly when editing a shipment
            console.log('PDF loaded - form ready for fresh input');
        });
    }, 100);
    
    // Don't auto-save form data on create page - only save when explicitly needed
    // setupFormDataAutoSave(); // Disabled - form should start fresh each time
}

// Load default PDF (AWB1.pdf)
async function loadDefaultPDF() {
    // Only try to fetch if we're on http/https (not file:// protocol)
    // CORS blocks file:// protocol from fetching local files
    if (window.location.protocol === 'file:') {
        console.log('Running from file:// protocol - skipping auto-load of default PDF (CORS restriction)');
        return;
    }
    
    // Determine correct path based on current page location
    // If we're in a subdirectory (like shipments/), go up one level
    let pdfPath = 'AWB1.pdf';
    if (window.location.pathname.includes('/shipments/')) {
        pdfPath = '../AWB1.pdf';
    }
    
    try {
        const response = await fetch(pdfPath);
        if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], 'AWB1.pdf', { type: 'application/pdf' });
            console.log('Loading default PDF:', pdfPath);
            handlePDF(file);
        } else {
            console.log('Default PDF (' + pdfPath + ') not found');
        }
    } catch (error) {
        console.log('Could not load default PDF:', error.message);
    }
}

// Handle PDF file
async function handlePDF(file) {
    hideError();
    showLoading();
    hideForm();
    
    try {
        // Read file as ArrayBuffer and store it
        const arrayBuffer = await file.arrayBuffer();
        // Store a copy as ArrayBuffer for pdf-lib
        originalPdfBytes = arrayBuffer.slice(0); // Create a copy to ensure it's not modified
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Extract form fields from all pages
        formFields = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const annotations = await page.getAnnotations();
            
            annotations.forEach(annotation => {
                if (annotation.subtype === 'Widget') {
                    // Add page index to annotation for later use
                    annotation.pageIndex = i - 1; // 0-based index
                    const field = extractFieldInfo(annotation);
                    if (field) {
                        formFields.push(field);
                    }
                }
            });
        }
        
        if (formFields.length === 0) {
            showError('No fillable form fields found in this PDF.');
            hideLoading();
            return;
        }
        
        generateForm();
        hideLoading();
        showForm();
        
        // Don't auto-restore form data - form should start fresh
        // restoreFormData() is only called explicitly when editing a shipment
    } catch (err) {
        console.error('Error processing PDF:', err);
        showError('Error processing PDF: ' + err.message);
        hideLoading();
    }
}

// Extract field information from annotation
function extractFieldInfo(annotation) {
    const fieldName = annotation.fieldName || annotation.id?.name || `field_${annotation.id?.num || Date.now()}`;
    const fieldType = annotation.fieldType;
    const fieldValue = annotation.fieldValue || '';
    
    // Skip if it's not a form field
    if (!fieldType) {
        return null;
    }
    
    const field = {
        name: fieldName,
        pdfFieldName: fieldName, // Store original PDF field name for filling
        type: fieldType,
        value: fieldValue,
        required: annotation.required || false,
        readOnly: annotation.readOnly || false,
        rect: annotation.rect || null, // Store rectangle for positioning
        pageIndex: annotation.pageIndex || 0 // Store page index
    };
    
    // Handle different field types
    switch (fieldType) {
        case 'Tx': // Text field
            field.htmlType = 'text';
            if (annotation.maxLen) {
                field.maxLength = annotation.maxLen;
            }
            
            // Check multiple ways to detect multiline fields
            // Log all annotation properties for debugging
            console.log(`Checking field ${fieldName} for multiline:`, {
                multiline: annotation.multiline,
                flags: annotation.flags,
                fieldFlags: annotation.fieldFlags,
                rect: annotation.rect,
                height: annotation.rect ? (annotation.rect[3] - annotation.rect[1]) : null,
                allProps: Object.keys(annotation)
            });
            
            // Check various properties that might indicate multiline
            const rect = annotation.rect || [];
            const fieldHeight = rect.length === 4 ? (rect[3] - rect[1]) : 0;
            const fieldWidth = rect.length === 4 ? (rect[2] - rect[0]) : 0;
            
            // Multiline detection: check multiple indicators
            const isMultiline = 
                annotation.multiline === true ||
                annotation.multiline === 1 ||
                (annotation.flags && (annotation.flags & 0x1000) !== 0) || // Multiline flag (bit 12)
                (annotation.fieldFlags && (annotation.fieldFlags & 0x1000) !== 0) ||
                fieldHeight > 30; // If height is significantly larger than typical single-line field
            
            if (isMultiline) {
                field.htmlType = 'textarea';
                console.log(`✓ Multiline field detected: ${fieldName}`, {
                    multiline: annotation.multiline,
                    flags: annotation.flags,
                    fieldFlags: annotation.fieldFlags,
                    height: fieldHeight,
                    width: fieldWidth
                });
            } else {
                console.log(`Single-line field: ${fieldName} (height: ${fieldHeight})`);
            }
            break;
        case 'Ch': // Choice field (dropdown or checkbox)
            if (annotation.checkBox) {
                field.htmlType = 'checkbox';
            } else {
                field.htmlType = 'select';
                field.options = annotation.options || [];
            }
            break;
        case 'Btn': // Button (usually checkbox or radio)
            if (annotation.checkBox) {
                field.htmlType = 'checkbox';
            } else if (annotation.radioButton) {
                field.htmlType = 'radio';
                field.radioGroup = annotation.radioButtonGroup;
            }
            break;
        default:
            field.htmlType = 'text';
    }
    
    // Extract label from alternate name or use field name
    field.label = annotation.alternateName || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return field;
}

// Generate HTML form from extracted fields
function generateForm() {
    generatedForm.innerHTML = '';
    
    // Debug: Log all fields and their types
    console.log('Generating form with fields:');
    formFields.forEach(field => {
        console.log(`  - ${field.name}: type=${field.type}, htmlType=${field.htmlType}, multiline=${field.htmlType === 'textarea'}`);
    });
    
    // Group fields by name to consolidate duplicates
    const fieldsByName = new Map();
    const radioGroups = {};
    
    // First pass: group all fields by name
    formFields.forEach(field => {
        if (field.htmlType === 'radio') {
            const groupName = field.radioGroup || field.name.split('_')[0];
            if (!radioGroups[groupName]) {
                radioGroups[groupName] = [];
            }
            radioGroups[groupName].push(field);
            return; // Skip, will render as group
        }
        
        const fieldName = field.name;
        if (!fieldsByName.has(fieldName)) {
            fieldsByName.set(fieldName, []);
        }
        fieldsByName.get(fieldName).push(field);
    });
    
    // Second pass: create form inputs, one per unique field name (sorted with special handling for numeric fields)
    const sortedFieldNames = Array.from(fieldsByName.keys()).sort((a, b) => {
        // Extract numeric prefixes for fields that start with numbers (e.g., "99. AirlineLogo" -> 99, "100" -> 100)
        const getNumericPrefix = (name) => {
            const match = name.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : null;
        };
        
        const numA = getNumericPrefix(a);
        const numB = getNumericPrefix(b);
        
        // If both have numeric prefixes, sort numerically
        if (numA !== null && numB !== null) {
            return numA - numB;
        }
        
        // If only one has a numeric prefix, numeric comes first
        if (numA !== null) return -1;
        if (numB !== null) return 1;
        
        // Otherwise, sort alphabetically, case-insensitive
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    
    // Check if we have fields starting with 01, 03, 19, 20
    const rowFieldPrefixes = ['01', '03', '19', '20'];
    const fieldsToRow = {};
    rowFieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            fieldsToRow[prefix] = matchingField;
        }
    });
    
    // Create row container if we have at least one field
    const hasAnyRowFields = rowFieldPrefixes.some(prefix => fieldsToRow[prefix]);
    let rowContainer = null;
    if (hasAnyRowFields) {
        rowContainer = document.createElement('div');
        rowContainer.className = 'form-row';
        
        // Add row fields in correct order (01, 03, 19, 20)
        rowFieldPrefixes.forEach(prefix => {
            const fieldName = fieldsToRow[prefix];
            const fieldsWithSameName = fieldsByName.get(fieldName);
            const primaryField = fieldsWithSameName[0];
            
            primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
            primaryField.duplicateCount = fieldsWithSameName.length;
            
            if (fieldsWithSameName.length > 1) {
                console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                    fieldsWithSameName.map(f => f.pdfFieldName));
            }
            
            const formGroup = createFormField(primaryField);
            rowContainer.appendChild(formGroup);
        });
    }
    
    // Check if we have fields starting with 02, 08, 18
    const rowFieldPrefixes2 = ['02', '08', '18'];
    const fieldsToRow2 = {};
    rowFieldPrefixes2.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            fieldsToRow2[prefix] = matchingField;
        }
    });
    
    // Create row container for fields 02, 08, 18 (create if at least one exists)
    let rowContainer2 = null;
    const hasAnyRowFields2 = rowFieldPrefixes2.some(prefix => fieldsToRow2[prefix]);
    if (hasAnyRowFields2) {
        rowContainer2 = document.createElement('div');
        rowContainer2.className = 'form-row';
        
        // Add row fields in correct order (02, 08, 18)
        rowFieldPrefixes2.forEach(prefix => {
            const fieldName = fieldsToRow2[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                rowContainer2.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have fields starting with 09, 10, 11, 12, 13, 14
    const rowFieldPrefixes3 = ['09', '10', '11', '12', '13', '14'];
    const fieldsToRow3 = {};
    rowFieldPrefixes3.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            fieldsToRow3[prefix] = matchingField;
        }
    });
    
    // Create row container for fields 09-14 (create if at least one exists)
    let rowContainer3 = null;
    const hasAnyRowFields3 = rowFieldPrefixes3.some(prefix => fieldsToRow3[prefix]);
    if (hasAnyRowFields3) {
        rowContainer3 = document.createElement('div');
        rowContainer3.className = 'form-row';
        
        // Add row fields in correct order (09, 10, 11, 12, 13, 14)
        rowFieldPrefixes3.forEach(prefix => {
            const fieldName = fieldsToRow3[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                rowContainer3.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have billing fields starting with 26, 27, 28, 30, 31, 32
    const billingRowFieldPrefixes = ['26', '27', '28', '30', '31', '32'];
    const billingFieldsToRow = {};
    billingRowFieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 26, 27, 28, 30, 31, 32 (create if at least one exists)
    let billingRowContainer = null;
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const hasAnyBillingRowFields = billingRowFieldPrefixes.some(prefix => billingFieldsToRow[prefix]);
    if (hasAnyBillingRowFields && billingFieldsForm) {
        billingRowContainer = document.createElement('div');
        billingRowContainer.className = 'form-row';
        
        // Add row fields in correct order (26, 27, 28, 30, 31, 32)
        billingRowFieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer.appendChild(formGroup);
            }
        });
        
        // Append billing row container to billing fields form
        billingFieldsForm.appendChild(billingRowContainer);
    }
    
    // Check if we have billing fields starting with 16, 17, 21, 23, 24, 25
    const billingRow2FieldPrefixes = ['16', '17', '21', '23', '24', '25'];
    const billingFieldsToRow2 = {};
    billingRow2FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow2[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 16, 17, 21, 23, 24, 25 (create if at least one exists)
    let billingRowContainer2 = null;
    const hasAnyBillingRow2Fields = billingRow2FieldPrefixes.some(prefix => billingFieldsToRow2[prefix]);
    if (hasAnyBillingRow2Fields && billingFieldsForm) {
        billingRowContainer2 = document.createElement('div');
        billingRowContainer2.className = 'form-row';
        
        // Add row fields in correct order (16, 17, 21, 23, 24, 25)
        billingRow2FieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow2[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer2.appendChild(formGroup);
            }
        });
        
        // Append billing row container 2 to billing fields form
        billingFieldsForm.appendChild(billingRowContainer2);
    }
    
    // Check if we have billing fields starting with 15, 29
    const billingRow3FieldPrefixes = ['15', '29'];
    const billingFieldsToRow3 = {};
    billingRow3FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow3[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 15, 29 (create if at least one exists)
    let billingRowContainer3 = null;
    const hasAnyBillingRow3Fields = billingRow3FieldPrefixes.some(prefix => billingFieldsToRow3[prefix]);
    if (hasAnyBillingRow3Fields && billingFieldsForm) {
        billingRowContainer3 = document.createElement('div');
        billingRowContainer3.className = 'form-row';
        
        // Add row fields in correct order (15, 29)
        billingRow3FieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow3[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer3.appendChild(formGroup);
            }
        });
        
        // Append billing row container 3 to billing fields form
        billingFieldsForm.appendChild(billingRowContainer3);
    }
    
    
    // Check if we have dimensions fields starting with 34, 35, 36
    const dimensionsRow1FieldPrefixes = ['34', '35', '36'];
    const dimensionsFieldsToRow1 = {};
    dimensionsRow1FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            dimensionsFieldsToRow1[prefix] = matchingField;
        }
    });
    
    // Create row container for dimensions fields 34, 35, 36 (create if at least one exists)
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    let dimensionsRowContainer1 = null;
    const hasAnyDimensionsRow1Fields = dimensionsRow1FieldPrefixes.some(prefix => dimensionsFieldsToRow1[prefix]);
    if (hasAnyDimensionsRow1Fields && dimensionsFieldsForm) {
        dimensionsRowContainer1 = document.createElement('div');
        dimensionsRowContainer1.className = 'form-row';
        
        // Add row fields in correct order (34, 35, 36)
        dimensionsRow1FieldPrefixes.forEach(prefix => {
            const fieldName = dimensionsFieldsToRow1[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                dimensionsRowContainer1.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have dimensions fields starting with 37, 38, 39
    const dimensionsRow2FieldPrefixes = ['37', '38', '39'];
    const dimensionsFieldsToRow2 = {};
    dimensionsRow2FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            dimensionsFieldsToRow2[prefix] = matchingField;
        }
    });
    
    // Create row container for dimensions fields 37, 38, 39 (create if at least one exists)
    let dimensionsRowContainer2 = null;
    const hasAnyDimensionsRow2Fields = dimensionsRow2FieldPrefixes.some(prefix => dimensionsFieldsToRow2[prefix]);
    if (hasAnyDimensionsRow2Fields && dimensionsFieldsForm) {
        dimensionsRowContainer2 = document.createElement('div');
        dimensionsRowContainer2.className = 'form-row';
        
        // Add row fields in correct order (37, 38, 39)
        dimensionsRow2FieldPrefixes.forEach(prefix => {
            const fieldName = dimensionsFieldsToRow2[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                dimensionsRowContainer2.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have dimensions fields starting with 33, 41
    const dimensionsRow3FieldPrefixes = ['33', '41'];
    const dimensionsFieldsToRow3 = {};
    dimensionsRow3FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            dimensionsFieldsToRow3[prefix] = matchingField;
        }
    });
    
    // Create row container for dimensions fields 33, 41 (create if at least one exists)
    let dimensionsRowContainer3 = null;
    const hasAnyDimensionsRow3Fields = dimensionsRow3FieldPrefixes.some(prefix => dimensionsFieldsToRow3[prefix]);
    if (hasAnyDimensionsRow3Fields && dimensionsFieldsForm) {
        dimensionsRowContainer3 = document.createElement('div');
        dimensionsRowContainer3.className = 'form-row';
        
        // Add row fields in correct order (33, 41)
        dimensionsRow3FieldPrefixes.forEach(prefix => {
            const fieldName = dimensionsFieldsToRow3[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                dimensionsRowContainer3.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have billing fields starting with 42, 43, 44, 45
    const billingRow6FieldPrefixes = ['42', '43', '44', '45'];
    const billingFieldsToRow6 = {};
    billingRow6FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow6[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 42, 43, 44, 45 (create if at least one exists)
    // Note: This row will be appended after individual fields 40 and 41 are processed
    let billingRowContainer6 = null;
    const hasAnyBillingRow6Fields = billingRow6FieldPrefixes.some(prefix => billingFieldsToRow6[prefix]);
    if (hasAnyBillingRow6Fields && billingFieldsForm) {
        billingRowContainer6 = document.createElement('div');
        billingRowContainer6.className = 'form-row';
        
        // Add row fields in correct order (42, 43, 44, 45)
        billingRow6FieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow6[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer6.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have billing fields starting with 46, 47, 48, 49
    const billingRow7FieldPrefixes = ['46', '47', '48', '49'];
    const billingFieldsToRow7 = {};
    billingRow7FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow7[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 46, 47, 48, 49 (create if at least one exists)
    // Note: This row will be appended after field 45 is processed
    let billingRowContainer7 = null;
    const hasAnyBillingRow7Fields = billingRow7FieldPrefixes.some(prefix => billingFieldsToRow7[prefix]);
    if (hasAnyBillingRow7Fields && billingFieldsForm) {
        billingRowContainer7 = document.createElement('div');
        billingRowContainer7.className = 'form-row';
        
        // Add row fields in correct order (46, 47, 48, 49)
        billingRow7FieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow7[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer7.appendChild(formGroup);
            }
        });
    }
    
    // Check if we have billing fields starting with 50, 51, 52, 53, 54, 55
    const billingRow8FieldPrefixes = ['50', '51', '52', '53', '54', '55'];
    const billingFieldsToRow8 = {};
    billingRow8FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow8[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 50, 51, 52, 53, 54, 55 (create if at least one exists)
    // Note: This row will be appended after field 49 is processed
    let billingRowContainer8 = null;
    const hasAnyBillingRow8Fields = billingRow8FieldPrefixes.some(prefix => billingFieldsToRow8[prefix]);
    if (hasAnyBillingRow8Fields && billingFieldsForm) {
        billingRowContainer8 = document.createElement('div');
        billingRowContainer8.className = 'form-row';
        
        // Add row fields in correct order (50, 51, 52, 53, 54, 55)
        billingRow8FieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow8[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer8.appendChild(formGroup);
            }
        });
    }
    
    const billingRow9FieldPrefixes = ['57', '56', '58', '59'];
    const billingFieldsToRow9 = {};
    billingRow9FieldPrefixes.forEach(prefix => {
        const matchingField = sortedFieldNames.find(name => name.startsWith(prefix));
        if (matchingField) {
            billingFieldsToRow9[prefix] = matchingField;
        }
    });
    
    // Create row container for billing fields 57, 56, 58, 59 (create if at least one exists)
    // Note: Order is intentional (57, 56, 58, 59)
    let billingRowContainer9 = null;
    const hasAnyBillingRow9Fields = billingRow9FieldPrefixes.some(prefix => billingFieldsToRow9[prefix]);
    if (hasAnyBillingRow9Fields && billingFieldsForm) {
        billingRowContainer9 = document.createElement('div');
        billingRowContainer9.className = 'form-row';
        
        // Add row fields in correct order (57, 56, 58, 59)
        billingRow9FieldPrefixes.forEach(prefix => {
            const fieldName = billingFieldsToRow9[prefix];
            if (fieldName) {
                const fieldsWithSameName = fieldsByName.get(fieldName);
                const primaryField = fieldsWithSameName[0];
                
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                
                if (fieldsWithSameName.length > 1) {
                    console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                        fieldsWithSameName.map(f => f.pdfFieldName));
                }
                
                const formGroup = createFormField(primaryField);
                billingRowContainer9.appendChild(formGroup);
            }
        });
    }
    
    // Process remaining fields
    sortedFieldNames.forEach(fieldName => {
        // Skip fields that are already in the first row (01, 03, 19, 20)
        const isRowField = Object.values(fieldsToRow).includes(fieldName);
        if (isRowField) {
            return;
        }
        
        // Skip fields that are already in the second row (02, 08, 18)
        const isRowField2 = Object.values(fieldsToRow2).includes(fieldName);
        if (isRowField2) {
            return;
        }
        
        // Skip fields that are already in the third row (09, 10, 11, 12, 13, 14)
        const isRowField3 = Object.values(fieldsToRow3).includes(fieldName);
        if (isRowField3) {
            return;
        }
        
        // Skip fields that are already in the billing row (26, 27, 28, 30, 31, 32)
        const isBillingRowField = Object.values(billingFieldsToRow).includes(fieldName);
        if (isBillingRowField) {
            return;
        }
        
        // Skip fields that are already in the billing row 2 (16, 17, 21, 23, 24, 25)
        const isBillingRowField2 = Object.values(billingFieldsToRow2).includes(fieldName);
        if (isBillingRowField2) {
            return;
        }
        
        // Skip fields that are already in the billing row 3 (15, 29)
        const isBillingRowField3 = Object.values(billingFieldsToRow3).includes(fieldName);
        if (isBillingRowField3) {
            return;
        }
        
        
        // Skip fields that are already in the billing row 6 (42, 43, 44, 45)
        const isBillingRowField6 = Object.values(billingFieldsToRow6).includes(fieldName);
        if (isBillingRowField6) {
            return;
        }
        
        // Skip fields that are already in the billing row 7 (46, 47, 48, 49)
        const isBillingRowField7 = Object.values(billingFieldsToRow7).includes(fieldName);
        if (isBillingRowField7) {
            return;
        }
        
        // Skip fields that are already in the billing row 8 (50, 51, 52, 53, 54, 55)
        const isBillingRowField8 = Object.values(billingFieldsToRow8).includes(fieldName);
        if (isBillingRowField8) {
            return;
        }
        
        // Skip fields that are already in the billing row 9 (57, 56, 58, 59)
        const isBillingRowField9 = Object.values(billingFieldsToRow9).includes(fieldName);
        if (isBillingRowField9) {
            return;
        }
        
        // Skip fields that are already in the dimensions row 1 (34, 35, 36)
        const isDimensionsRowField1 = Object.values(dimensionsFieldsToRow1).includes(fieldName);
        if (isDimensionsRowField1) {
            return;
        }
        
        // Skip fields that are already in the dimensions row 2 (37, 38, 39)
        const isDimensionsRowField2 = Object.values(dimensionsFieldsToRow2).includes(fieldName);
        if (isDimensionsRowField2) {
            return;
        }
        
        // Skip fields that are already in the dimensions row 3 (33, 41)
        const isDimensionsRowField3 = Object.values(dimensionsFieldsToRow3).includes(fieldName);
        if (isDimensionsRowField3) {
            return;
        }
        
        // Get field prefix for routing (but don't skip field 40 - it needs to be processed)
        const fieldPrefix = fieldName.substring(0, 2);
        
        // Skip field 40 from being added to main form, but it will be routed to dimensions tab
        if (fieldPrefix === '40') {
            // Process field 40 separately for dimensions tab
            const fieldsWithSameName = fieldsByName.get(fieldName);
            if (fieldsWithSameName && fieldsWithSameName.length > 0) {
                const primaryField = fieldsWithSameName[0];
                primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
                primaryField.duplicateCount = fieldsWithSameName.length;
                const formGroup = createFormField(primaryField);
                
                const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
                if (dimensionsFieldsForm) {
                    dimensionsFieldsForm.appendChild(formGroup);
                    
                    // Append the 34-36 row after field 40
                    if (dimensionsRowContainer1 && !dimensionsRowContainer1.parentNode) {
                        dimensionsFieldsForm.appendChild(dimensionsRowContainer1);
                    }
                    
                    // Append the 37-39 row after the 34-36 row
                    if (dimensionsRowContainer2 && !dimensionsRowContainer2.parentNode) {
                        dimensionsFieldsForm.appendChild(dimensionsRowContainer2);
                    }
                    
                    // Append the 33-41 row after the 37-39 row (below field 40)
                    if (dimensionsRowContainer3 && !dimensionsRowContainer3.parentNode) {
                        dimensionsFieldsForm.appendChild(dimensionsRowContainer3);
                    }
                }
            }
            return;
        }
        
        const fieldsWithSameName = fieldsByName.get(fieldName);
        // Use the first field as the template, but store all PDF field names
        const primaryField = fieldsWithSameName[0];
        
        // Store all PDF field names that should be filled with the same value
        primaryField.allPdfFieldNames = fieldsWithSameName.map(f => f.pdfFieldName);
        
        // Store the duplicate count for display
        primaryField.duplicateCount = fieldsWithSameName.length;
        
        // If there are multiple fields with the same name, log it
        if (fieldsWithSameName.length > 1) {
            console.log(`Consolidating ${fieldsWithSameName.length} fields with name "${fieldName}":`, 
                fieldsWithSameName.map(f => f.pdfFieldName));
        }
        
        const formGroup = createFormField(primaryField);
        
        // Add row containers before first non-row field if they exist
        if (rowContainer && !rowContainer.parentNode) {
            generatedForm.appendChild(rowContainer);
        }
        if (rowContainer2 && !rowContainer2.parentNode) {
            generatedForm.appendChild(rowContainer2);
        }
        if (rowContainer3 && !rowContainer3.parentNode) {
            generatedForm.appendChild(rowContainer3);
        }
        
        // Move fields 04, 05, 06, 07 to Contacts tab
        // Move fields 33, 34, 35, 36, 37, 38, 39, 40, 41 to Dimensions tab
        // Move fields 15, 16, 17, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59 to Billing tab
        const contactFieldsForm = document.getElementById('contactFieldsForm');
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
        
        if ((fieldPrefix === '04' || fieldPrefix === '05' || fieldPrefix === '06' || fieldPrefix === '07') && contactFieldsForm) {
            // Append to contact fields form in Contacts tab
            contactFieldsForm.appendChild(formGroup);
        } else if ((fieldPrefix === '15' || fieldPrefix === '16' || fieldPrefix === '17' || fieldPrefix === '21' || fieldPrefix === '23' || fieldPrefix === '24' || fieldPrefix === '25' || fieldPrefix === '26' || fieldPrefix === '27' || fieldPrefix === '28' || fieldPrefix === '29' || fieldPrefix === '30' || fieldPrefix === '31' || fieldPrefix === '32' || fieldPrefix === '42' || fieldPrefix === '43' || fieldPrefix === '44' || fieldPrefix === '45' || fieldPrefix === '46' || fieldPrefix === '47' || fieldPrefix === '48' || fieldPrefix === '49' || fieldPrefix === '50' || fieldPrefix === '51' || fieldPrefix === '52' || fieldPrefix === '53' || fieldPrefix === '54' || fieldPrefix === '55' || fieldPrefix === '56' || fieldPrefix === '57' || fieldPrefix === '58' || fieldPrefix === '59') && billingFieldsForm) {
            // Append to billing fields form in Billing tab
            billingFieldsForm.appendChild(formGroup);
            
            // If this is field 42, append the 42-45 row after it (fields 43-45 are skipped from individual processing)
            if (fieldPrefix === '42' && billingRowContainer6 && !billingRowContainer6.parentNode) {
                billingFieldsForm.appendChild(billingRowContainer6);
            }
            
            // If this is field 45, append the 46-49 row after it (fields 46-49 are skipped from individual processing)
            if (fieldPrefix === '45' && billingRowContainer7 && !billingRowContainer7.parentNode) {
                billingFieldsForm.appendChild(billingRowContainer7);
            }
            
            // If this is field 49, append the 50-55 row after it (fields 50-55 are skipped from individual processing)
            if (fieldPrefix === '49' && billingRowContainer8 && !billingRowContainer8.parentNode) {
                billingFieldsForm.appendChild(billingRowContainer8);
            }
            
            // If this is field 55, append the 57-59 row after it (fields 57, 56, 58, 59 are skipped from individual processing)
            if (fieldPrefix === '55' && billingRowContainer9 && !billingRowContainer9.parentNode) {
                billingFieldsForm.appendChild(billingRowContainer9);
            }
        } else {
            // Append to main form in Routing tab
            generatedForm.appendChild(formGroup);
        }
    });
    
    // Make sure row containers are added if they exist and haven't been added yet
    if (rowContainer && !rowContainer.parentNode) {
        generatedForm.appendChild(rowContainer);
    }
    if (rowContainer2 && !rowContainer2.parentNode) {
        generatedForm.appendChild(rowContainer2);
    }
    if (rowContainer3 && !rowContainer3.parentNode) {
        generatedForm.appendChild(rowContainer3);
    }
    
    // Make sure billing row containers are added if they exist and haven't been added yet
    if (billingFieldsForm) {
        if (billingRowContainer6 && !billingRowContainer6.parentNode) {
            billingFieldsForm.appendChild(billingRowContainer6);
        }
        if (billingRowContainer7 && !billingRowContainer7.parentNode) {
            billingFieldsForm.appendChild(billingRowContainer7);
        }
        if (billingRowContainer8 && !billingRowContainer8.parentNode) {
            billingFieldsForm.appendChild(billingRowContainer8);
        }
        if (billingRowContainer9 && !billingRowContainer9.parentNode) {
            billingFieldsForm.appendChild(billingRowContainer9);
        }
    }
    
    // Make sure dimensions row containers are added to dimensionsFieldsForm if they exist and have content
    const dimensionsFieldsFormFinal = document.getElementById('dimensionsFieldsForm');
    if (dimensionsFieldsFormFinal) {
        // Check if field 40 exists to determine insertion point
        const field40Elements = Array.from(dimensionsFieldsFormFinal.elements).filter(el => el.name && el.name.startsWith('40'));
        const hasField40 = field40Elements.length > 0;
        
        // Append row containers if they exist, have content, and haven't been appended yet
        if (dimensionsRowContainer1 && !dimensionsRowContainer1.parentNode && dimensionsRowContainer1.children.length > 0) {
            if (hasField40 && field40Elements[0].closest('.form-group')) {
                // Insert after field 40's form group
                const field40Group = field40Elements[0].closest('.form-group');
                field40Group.parentNode.insertBefore(dimensionsRowContainer1, field40Group.nextSibling);
            } else {
                dimensionsFieldsFormFinal.appendChild(dimensionsRowContainer1);
            }
        }
        if (dimensionsRowContainer2 && !dimensionsRowContainer2.parentNode && dimensionsRowContainer2.children.length > 0) {
            dimensionsFieldsFormFinal.appendChild(dimensionsRowContainer2);
        }
        if (dimensionsRowContainer3 && !dimensionsRowContainer3.parentNode && dimensionsRowContainer3.children.length > 0) {
            dimensionsFieldsFormFinal.appendChild(dimensionsRowContainer3);
        }
    }
    
    // Update fields 34-39 state based on number of active dimension rows
    // This must be called after form generation but before radio groups
    setTimeout(() => {
        updateDimensionsFieldsState();
    }, 100);
    
    // Render radio button groups (sorted alphabetically)
    const sortedRadioGroupNames = Object.keys(radioGroups).sort((a, b) => {
        // Sort alphabetically, case-insensitive
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    
    sortedRadioGroupNames.forEach(groupName => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = groupName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        group.appendChild(label);
        
        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-group';
        
        radioGroups[groupName].forEach(field => {
            const radioDiv = document.createElement('div');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = groupName;
            radio.id = field.name;
            // Store the PDF field name as a data attribute for filling
            radio.setAttribute('data-pdf-field', field.pdfFieldName);
            radio.value = field.pdfFieldName; // Use PDF field name as value for proper mapping
            if (field.required) radio.required = true;
            if (field.readOnly) radio.disabled = true;
            
            const radioLabel = document.createElement('label');
            radioLabel.htmlFor = field.name;
            radioLabel.textContent = field.label;
            radioLabel.style.fontSize = '12px'; // Set font size to 12px
            
            radioDiv.appendChild(radio);
            radioDiv.appendChild(radioLabel);
            radioContainer.appendChild(radioDiv);
        });
        
        group.appendChild(radioContainer);
        generatedForm.appendChild(group);
    });
    
    // Update template dropdown after form is generated
    updateTemplateDropdown();
    
    // Show contact section and update dropdowns
    // Note: showContactSection is async but we don't await it here to avoid making generateForm async
    showContactSection().catch(err => console.error('Error in showContactSection:', err));
    
    // Initialize tabs
    initializeTabs();
    
    // Calculate field 32 if fields 30 and 31 have values
    setTimeout(() => calculateField32(), 100);
    
    // Update validation indicators after form is generated
    setTimeout(() => {
        updateTabValidationIndicators();
        // Update dimensions fields state after form is fully generated
        updateDimensionsFieldsState();
    }, 100);
}

// Template Management Functions
function getTemplates() {
    try {
        const templatesJson = localStorage.getItem('awbTemplates');
        return templatesJson ? JSON.parse(templatesJson) : {};
    } catch (error) {
        console.warn('Could not read templates from localStorage:', error);
        return {};
    }
}

function saveTemplates(templates) {
    try {
        localStorage.setItem('awbTemplates', JSON.stringify(templates));
        updateTemplateDropdown();
        return true;
    } catch (error) {
        console.warn('Could not save templates to localStorage:', error);
        showError('Error saving template. Storage may be full.');
        return false;
    }
}

function updateTemplateDropdown() {
    if (!templateSelect) return;
    
    const templates = getTemplates();
    const currentValue = templateSelect.value;
    
    // Clear and rebuild dropdown
    templateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    
    const templateNames = Object.keys(templates).sort();
    templateNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        templateSelect.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && templateNames.includes(currentValue)) {
        templateSelect.value = currentValue;
    }
    
    // Show/hide delete/rename buttons based on selection
    if (templateSelect.value) {
        deleteTemplateBtn.style.display = 'inline-block';
        renameTemplateBtn.style.display = 'inline-block';
        templateNameGroup.style.display = 'none';
        currentTemplateName = templateSelect.value;
        // Update button text to "Update Template" since a template is selected
        if (saveTemplateBtn) {
            saveTemplateBtn.textContent = 'Update Template';
        }
    } else {
        deleteTemplateBtn.style.display = 'none';
        renameTemplateBtn.style.display = 'none';
        currentTemplateName = null;
        // Change button text back to "Save Template" since no template is selected
        if (saveTemplateBtn) {
            saveTemplateBtn.textContent = 'Save Template';
        }
    }
}

function collectFormDataForTemplate() {
    if (!generatedForm) return {};
    
    const formData = {};
    const formElements = generatedForm.elements;
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const contactFormElements = contactFieldsForm ? contactFieldsForm.elements : [];
    const billingFormElements = billingFieldsForm ? billingFieldsForm.elements : [];
    
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        const name = element.name;
        
        if (!name) continue;
        
        // Skip fields 03, 20, 26, 27, 30, 31, 32, 40 - do not save in template
        // Note: Field 33 is kept in template (not excluded)
        if (name.startsWith('03') || name.startsWith('20') || name.startsWith('26') || name.startsWith('27') || name.startsWith('30') || name.startsWith('31') || name.startsWith('32') || name.startsWith('40')) continue;
        
        if (element.type === 'checkbox') {
            formData[name] = element.checked.toString();
        } else if (element.type === 'radio') {
            if (element.checked) {
                formData[name] = element.value;
            }
        } else {
            formData[name] = element.value || '';
        }
    }
    
    // Also collect from contact fields form
    for (let i = 0; i < contactFormElements.length; i++) {
        const element = contactFormElements[i];
        const name = element.name;
        
        if (!name) continue;
        
        // Skip fields 03, 20, 26, 27, 30, 31, 32, 40 - do not save in template
        // Note: Field 33 is kept in template (not excluded)
        if (name.startsWith('03') || name.startsWith('20') || name.startsWith('26') || name.startsWith('27') || name.startsWith('30') || name.startsWith('31') || name.startsWith('32') || name.startsWith('40')) continue;
        
        if (element.type === 'checkbox') {
            formData[name] = element.checked.toString();
        } else if (element.type === 'radio') {
            if (element.checked) {
                formData[name] = element.value;
            }
        } else {
            formData[name] = element.value || '';
        }
    }
    
    // Also collect from billing fields form
    for (let i = 0; i < billingFormElements.length; i++) {
        const element = billingFormElements[i];
        const name = element.name;
        
        if (!name) continue;
        
        // Skip fields 03, 20, 26, 27, 30, 31, 32, 40 - do not save in template
        // Note: Field 33 is kept in template (not excluded)
        if (name.startsWith('03') || name.startsWith('20') || name.startsWith('26') || name.startsWith('27') || name.startsWith('30') || name.startsWith('31') || name.startsWith('32') || name.startsWith('40')) continue;
        
        if (element.type === 'checkbox') {
            formData[name] = element.checked.toString();
        } else if (element.type === 'radio') {
            if (element.checked) {
                formData[name] = element.value;
            }
        } else {
            formData[name] = element.value || '';
        }
    }
    
    // Also capture contact dropdown selections
    if (shipperSelect) {
        formData['_shipperContactId'] = shipperSelect.value || '';
    }
    if (consigneeSelect) {
        formData['_consigneeContactId'] = consigneeSelect.value || '';
    }
    
    // Capture routing dropdown selections
    if (airlineSelect1) {
        formData['_airlineContactId1'] = airlineSelect1.value || '';
    }
    if (destinationSelect) {
        formData['_destinationId'] = destinationSelect.value || '';
    }
    const directFlightSelect = document.getElementById('directFlightSelect');
    if (directFlightSelect) {
        formData['_directFlight'] = directFlightSelect.value || '';
    }
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    if (interlineShipmentSelect) {
        formData['_interlineShipment'] = interlineShipmentSelect.value || '';
    }
    if (interlineCarrierSelect1) {
        formData['_interlineCarrierContactId1'] = interlineCarrierSelect1.value || '';
    }
    if (interlineCarrierSelect2) {
        formData['_interlineCarrierContactId2'] = interlineCarrierSelect2.value || '';
        // Save whether Interline Carrier 2 was shown (has a value or was displayed)
        const interlineCarrierGroup2 = document.getElementById('interlineCarrierGroup2');
        formData['_showInterlineCarrier2'] = (interlineCarrierSelect2.value || (interlineCarrierGroup2 && interlineCarrierGroup2.style.display !== 'none')) ? 'true' : 'false';
    }
    // Dangerous Goods is excluded from template - do not save
    // const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    // if (dangerousGoodsSelect) {
    //     formData['_dangerousGoods'] = dangerousGoodsSelect.value || '';
    // }
    
    // Capture billing dropdown selections
    const declaredValuesSelect = document.getElementById('declaredValuesSelect');
    if (declaredValuesSelect) {
        formData['_declaredValues'] = declaredValuesSelect.value || '';
    }
    const insuranceSelect = document.getElementById('insuranceSelect');
    if (insuranceSelect) {
        formData['_insurance'] = insuranceSelect.value || '';
    }
    const prepaidCollectSelect = document.getElementById('prepaidCollectSelect');
    if (prepaidCollectSelect) {
        formData['_prepaidCollect'] = prepaidCollectSelect.value || '';
    }
    
    // Capture dimensions data (L, W, H only - exclude QTY)
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (dimensionsContainer) {
        const dimensionsRows = dimensionsContainer.querySelectorAll('.dimensions-row');
        const dimensionsData = [];
        dimensionsRows.forEach((row, index) => {
            const lengthInput = row.querySelector('.dim-length');
            const widthInput = row.querySelector('.dim-width');
            const heightInput = row.querySelector('.dim-height');
            // QTY is excluded - not saved to template
            
            if (lengthInput || widthInput || heightInput) {
                dimensionsData.push({
                    length: lengthInput ? lengthInput.value : '',
                    width: widthInput ? widthInput.value : '',
                    height: heightInput ? heightInput.value : ''
                });
            }
        });
        if (dimensionsData.length > 0) {
            formData['_dimensions'] = dimensionsData;
        }
    }
    
    return formData;
}

function loadTemplateData(templateName) {
    const templates = getTemplates();
    return templates[templateName] || null;
}

async function populateFormFromTemplate(templateData) {
    if (!generatedForm || !templateData) return;
    
    const formElements = generatedForm.elements;
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const contactFormElements = contactFieldsForm ? contactFieldsForm.elements : [];
    const billingFormElements = billingFieldsForm ? billingFieldsForm.elements : [];
    
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        const name = element.name;
        
        if (!name || !(name in templateData)) continue;
        
        const value = templateData[name];
        
        if (element.type === 'checkbox') {
            element.checked = value === 'true' || value === true;
        } else if (element.type === 'radio') {
            if (element.value === value) {
                element.checked = true;
            }
        } else {
            element.value = value;
        }
    }
    
    // Also populate contact fields form
    for (let i = 0; i < contactFormElements.length; i++) {
        const element = contactFormElements[i];
        const name = element.name;
        
        if (!name || !(name in templateData)) continue;
        
        const value = templateData[name];
        
        if (element.type === 'checkbox') {
            element.checked = value === 'true' || value === true;
        } else if (element.type === 'radio') {
            if (element.value === value) {
                element.checked = true;
            }
        } else {
            element.value = value;
        }
    }
    
    // Also populate billing fields form
    for (let i = 0; i < billingFormElements.length; i++) {
        const element = billingFormElements[i];
        const name = element.name;
        
        if (!name || !(name in templateData)) continue;
        
        const value = templateData[name];
        
        if (element.type === 'checkbox') {
            element.checked = value === 'true' || value === true;
        } else if (element.type === 'radio') {
            if (element.value === value) {
                element.checked = true;
            }
        } else {
            element.value = value;
        }
    }
    
    // Restore contact dropdown selections
    if (templateData['_shipperContactId'] && shipperSelect) {
        shipperSelect.value = templateData['_shipperContactId'];
        if (shipperSelect.value) {
            fillContactField('04', shipperSelect.value);
            updateContactButtonText('Shipper', addShipperBtn, shipperSelect);
        }
    }
    
    if (templateData['_consigneeContactId'] && consigneeSelect) {
        consigneeSelect.value = templateData['_consigneeContactId'];
        if (consigneeSelect.value) {
            fillContactField('05', consigneeSelect.value);
            updateContactButtonText('Consignee', addConsigneeBtn, consigneeSelect);
        }
    }
    
    // Restore routing dropdown selections
    if (templateData['_airlineContactId1'] && airlineSelect1) {
        airlineSelect1.value = templateData['_airlineContactId1'];
        if (airlineSelect1.value) {
            fillAirlineField(airlineSelect1.value);
            updateContactButtonText('Airline', addAirlineBtn1, airlineSelect1);
        }
    }
    
    if (templateData['_destinationId'] && destinationSelect) {
        destinationSelect.value = templateData['_destinationId'];
        if (destinationSelect.value) {
            await fillDestinationFields(destinationSelect.value);
            if (addDestinationBtn) {
                updateContactButtonText('Destination', addDestinationBtn, destinationSelect);
            }
        }
    }
    
    const directFlightSelect = document.getElementById('directFlightSelect');
    if (directFlightSelect && templateData['_directFlight']) {
        directFlightSelect.value = templateData['_directFlight'];
        handleDirectFlightChange(directFlightSelect.value === 'Yes');
    }
    
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    if (interlineShipmentSelect && templateData['_interlineShipment']) {
        interlineShipmentSelect.value = templateData['_interlineShipment'];
        handleInterlineShipmentChange(interlineShipmentSelect.value === 'Yes');
    }
    
    if (interlineCarrierSelect1 && templateData['_interlineCarrierContactId1']) {
        interlineCarrierSelect1.value = templateData['_interlineCarrierContactId1'];
        if (interlineCarrierSelect1.value) {
            await fillInterlineCarrier1Field(interlineCarrierSelect1.value);
        }
    }
    
    // Restore Interline Carrier 2 if it was shown
    if (templateData['_showInterlineCarrier2'] === 'true' || templateData['_interlineCarrierContactId2']) {
        const addInterlineCarrier2BtnGroup = document.getElementById('addInterlineCarrier2BtnGroup');
        const interlineCarrierGroup2 = document.getElementById('interlineCarrierGroup2');
        
        if (addInterlineCarrier2BtnGroup) {
            addInterlineCarrier2BtnGroup.style.display = 'none';
        }
        if (interlineCarrierGroup2) {
            interlineCarrierGroup2.style.display = 'flex';
        }
        
        // Make sure the dropdown is populated before setting the value
        if (interlineCarrierSelect2) {
            // Populate the dropdown if it hasn't been populated yet - use airlinesAPI only with deduplication
            if (interlineCarrierSelect2.options.length <= 1) {
                interlineCarrierSelect2.innerHTML = '<option value="">-- Select Airline --</option>';
                
                // Only load from airlinesAPI (Locations > Airlines) - no contacts fallback
                let airlines = [];
                if (window.airlinesAPI) {
                    try {
                        airlines = await window.airlinesAPI.getAll();
                        console.log('Loaded airlines for Interline Carrier 2 (template) from API:', airlines.length);
                    } catch (error) {
                        console.error('Could not load airlines from API:', error);
                        airlines = [];
                    }
                } else {
                    console.warn('airlinesAPI not available');
                    airlines = [];
                }
                
                // Deduplicate airlines by ID and company name to prevent duplicates
                const seenIds = new Set();
                const seenNames = new Set();
                const uniqueAirlines = airlines.filter(airline => {
                    // Check for duplicate ID
                    if (seenIds.has(airline.id)) {
                        console.warn('Duplicate airline ID found:', airline.id, airline.companyName);
                        return false;
                    }
                    // Check for duplicate company name (case-insensitive)
                    const nameKey = (airline.companyName || '').toLowerCase().trim();
                    if (nameKey && seenNames.has(nameKey)) {
                        console.warn('Duplicate airline name found:', airline.companyName, 'ID:', airline.id);
                        return false;
                    }
                    seenIds.add(airline.id);
                    if (nameKey) seenNames.add(nameKey);
                    return true;
                });
                
                console.log(`Displaying ${uniqueAirlines.length} unique airlines for Interline Carrier 2 (template) (${airlines.length} total loaded)`);
                
                uniqueAirlines.forEach(airline => {
                    const option = document.createElement('option');
                    option.value = airline.id;
                    // Format: "ABBREVIATION - Company Name" or just "Company Name" if no abbreviation
                    const displayText = airline.airlineAbbreviation 
                        ? `${airline.airlineAbbreviation} - ${airline.companyName}`
                        : airline.companyName;
                    option.textContent = displayText;
                    interlineCarrierSelect2.appendChild(option);
                });
            }
            
            // Set the value if it exists in the template
            if (templateData['_interlineCarrierContactId2']) {
                interlineCarrierSelect2.value = templateData['_interlineCarrierContactId2'];
                // Unlock fields 13 and 14 and fill field 14 with abbreviation
                if (interlineCarrierSelect2.value) {
                    await handleInterlineCarrier2Change(interlineCarrierSelect2.value);
                }
            }
        }
    }
    // Dangerous Goods is excluded from template - do not restore
    // const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    // if (dangerousGoodsSelect && templateData['_dangerousGoods']) {
    //     dangerousGoodsSelect.value = templateData['_dangerousGoods'];
    //     handleDangerousGoodsChange(dangerousGoodsSelect.value === 'Yes');
    // }
    
    // Restore billing dropdown selections
    const declaredValuesSelect = document.getElementById('declaredValuesSelect');
    if (declaredValuesSelect && templateData['_declaredValues']) {
        declaredValuesSelect.value = templateData['_declaredValues'];
        handleDeclaredValuesChange(declaredValuesSelect.value === 'No');
    }
    
    const insuranceSelect = document.getElementById('insuranceSelect');
    if (insuranceSelect && templateData['_insurance']) {
        insuranceSelect.value = templateData['_insurance'];
        handleInsuranceChange(insuranceSelect.value === 'No');
    }
    
    const prepaidCollectSelect = document.getElementById('prepaidCollectSelect');
    if (prepaidCollectSelect && templateData['_prepaidCollect']) {
        prepaidCollectSelect.value = templateData['_prepaidCollect'];
        handlePrepaidCollectChange(prepaidCollectSelect.value);
    }
    
    // Restore dimensions data (L, W, H only - QTY is excluded)
    if (templateData['_dimensions'] && Array.isArray(templateData['_dimensions'])) {
        const dimensionsContainer = document.getElementById('dimensionsContainer');
        if (dimensionsContainer) {
            const dimensionsData = templateData['_dimensions'];
            const existingRows = dimensionsContainer.querySelectorAll('.dimensions-row');
            
            // Clear existing rows except the first one
            for (let i = existingRows.length - 1; i > 0; i--) {
                existingRows[i].remove();
            }
            
            // Restore dimensions to rows
            dimensionsData.forEach((dimData, index) => {
                let row;
                if (index === 0) {
                    // Use first row
                    row = dimensionsContainer.querySelector('.dimensions-row');
                } else {
                    // Create new row for additional dimensions
                    if (dimensionsContainer.querySelectorAll('.dimensions-row').length < 6) {
                        addDimensionsRow();
                        row = dimensionsContainer.querySelectorAll('.dimensions-row')[index];
                    } else {
                        return; // Max 6 rows
                    }
                }
                
                if (row) {
                    const lengthInput = row.querySelector('.dim-length');
                    const widthInput = row.querySelector('.dim-width');
                    const heightInput = row.querySelector('.dim-height');
                    
                    if (lengthInput && dimData.length) lengthInput.value = dimData.length;
                    if (widthInput && dimData.width) widthInput.value = dimData.width;
                    if (heightInput && dimData.height) heightInput.value = dimData.height;
                    // QTY is not restored - left empty
                }
            });
            
            // Update button states
            updateDimensionsAddButton();
            const allRows = dimensionsContainer.querySelectorAll('.dimensions-row');
            if (allRows.length > 1) {
                allRows.forEach((row, idx) => {
                    const removeBtn = row.querySelector('.dim-remove-btn');
                    const addBtn = row.querySelector('.dim-add-box-btn');
                    if (removeBtn) removeBtn.style.display = 'block';
                    if (addBtn) addBtn.style.display = idx === 0 ? 'block' : 'none';
                });
            } else if (allRows.length === 1) {
                const firstRow = allRows[0];
                const removeBtn = firstRow.querySelector('.dim-remove-btn');
                const addBtn = firstRow.querySelector('.dim-add-box-btn');
                if (removeBtn) removeBtn.style.display = 'none';
                if (addBtn) addBtn.style.display = 'block';
            }
        }
    }
    
    // Calculate field 32 if fields 30 and 31 have values
    setTimeout(() => calculateField32(), 100);
}

// Template event handlers
async function handleTemplateSelect() {
    const selectedTemplate = templateSelect.value;
    
    if (!selectedTemplate) {
        deleteTemplateBtn.style.display = 'none';
        renameTemplateBtn.style.display = 'none';
        templateNameGroup.style.display = 'none';
        currentTemplateName = null;
        // Change button text back to "Save Template"
        if (saveTemplateBtn) {
            saveTemplateBtn.textContent = 'Save Template';
        }
        return;
    }
    
    deleteTemplateBtn.style.display = 'inline-block';
    renameTemplateBtn.style.display = 'inline-block';
    templateNameGroup.style.display = 'none';
    currentTemplateName = selectedTemplate;
    
    // Change button text to "Update Template"
    if (saveTemplateBtn) {
        saveTemplateBtn.textContent = 'Update Template';
    }
    
    // Load the selected template
    const templateData = loadTemplateData(selectedTemplate);
    if (templateData) {
        await populateFormFromTemplate(templateData);
        showError('✓ Template loaded: ' + selectedTemplate);
        setTimeout(() => hideError(), 2000);
    }
}

function handleSaveTemplate() {
    if (!generatedForm) {
        showError('Error: Form not found.');
        return;
    }
    
    // Handle rename mode
    if (isRenamingTemplate) {
        const selectedTemplate = templateSelect.value;
        const newName = templateNameInput.value.trim();
        
        if (!newName) {
            showError('Please enter a template name.');
            return;
        }
        
        if (newName === selectedTemplate) {
            // No change, just cancel rename mode
            isRenamingTemplate = false;
            templateNameGroup.style.display = 'none';
            templateNameInput.value = '';
            if (templateNameLabel) {
                templateNameLabel.textContent = 'Template Name:';
            }
            return;
        }
        
        const templates = getTemplates();
        
        if (templates[newName]) {
            showError('A template with that name already exists.');
            return;
        }
        
        // Rename: copy data to new name, delete old
        templates[newName] = templates[selectedTemplate];
        delete templates[selectedTemplate];
        
        if (saveTemplates(templates)) {
            templateSelect.value = newName;
            currentTemplateName = newName;
            isRenamingTemplate = false;
            templateNameGroup.style.display = 'none';
            templateNameInput.value = '';
            if (templateNameLabel) {
                templateNameLabel.textContent = 'Template Name:';
            }
            updateTemplateDropdown();
            showError('✓ Template renamed: ' + selectedTemplate + ' → ' + newName);
            setTimeout(() => hideError(), 2000);
        }
        return;
    }
    
    // If a template is already loaded, update it directly without prompting for name
    if (currentTemplateName) {
        // Collect current form data
        const formData = collectFormDataForTemplate();
        
        // Update the existing template
        const templates = getTemplates();
        templates[currentTemplateName] = formData;
        
        if (saveTemplates(templates)) {
            showError('✓ Template updated: ' + currentTemplateName);
            setTimeout(() => hideError(), 2000);
        }
        return;
    }
    
    // If no template is loaded, show template name input for creating a new template
    if (templateNameGroup.style.display === 'none') {
        templateNameGroup.style.display = 'flex';
        templateNameInput.value = '';
        templateNameInput.focus();
        if (templateNameLabel) {
            templateNameLabel.textContent = 'Template Name:';
        }
        return;
    }
    
    // Get template name
    const templateName = templateNameInput.value.trim();
    
    if (!templateName) {
        showError('Please enter a template name.');
        return;
    }
    
    // Collect current form data
    const formData = collectFormDataForTemplate();
    
    // Save template
    const templates = getTemplates();
    templates[templateName] = formData;
    
    if (saveTemplates(templates)) {
        templateSelect.value = templateName;
        currentTemplateName = templateName;
        templateNameGroup.style.display = 'none';
        templateNameInput.value = '';
        deleteTemplateBtn.style.display = 'inline-block';
        renameTemplateBtn.style.display = 'inline-block';
        // Update button text to "Update Template" since a template is now loaded
        if (saveTemplateBtn) {
            saveTemplateBtn.textContent = 'Update Template';
        }
        showError('✓ Template saved: ' + templateName);
        setTimeout(() => hideError(), 2000);
    }
}

function handleDeleteTemplate() {
    const selectedTemplate = templateSelect.value;
    
    if (!selectedTemplate) {
        showError('No template selected.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete the template "${selectedTemplate}"?`)) {
        return;
    }
    
    const templates = getTemplates();
    delete templates[selectedTemplate];
    
    if (saveTemplates(templates)) {
        templateSelect.value = '';
        currentTemplateName = null;
        deleteTemplateBtn.style.display = 'none';
        renameTemplateBtn.style.display = 'none';
        // Change button text back to "Save Template" since no template is selected
        if (saveTemplateBtn) {
            saveTemplateBtn.textContent = 'Save Template';
        }
        showError('✓ Template deleted: ' + selectedTemplate);
        setTimeout(() => hideError(), 2000);
    }
}

function handleRenameTemplate() {
    const selectedTemplate = templateSelect.value;
    
    if (!selectedTemplate) {
        showError('No template selected.');
        return;
    }
    
    // Set rename mode and show the input field
    isRenamingTemplate = true;
    if (templateNameGroup && templateNameInput) {
        templateNameGroup.style.display = 'flex';
        templateNameInput.value = selectedTemplate;
        templateNameInput.focus();
        templateNameInput.select(); // Select all text for easy editing
        
        // Update label to indicate renaming
        if (templateNameLabel) {
            templateNameLabel.textContent = 'Rename Template:';
        }
    }
}

function handleClearForm() {
    if (!generatedForm) return;
    
    if (!confirm('Are you sure you want to clear all form fields?')) {
        return;
    }
    
    const formElements = generatedForm.elements;
    
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        
        if (element.type === 'checkbox') {
            element.checked = false;
        } else if (element.type === 'radio') {
            element.checked = false;
        } else {
            // Reset field 15 to USD and field 28 to kg
            if (element.name && element.name.startsWith('15')) {
                element.value = 'USD';
            } else if (element.name && element.name.startsWith('28')) {
                element.value = 'kg';
            } else {
                element.value = '';
            }
        }
    }
    
    // Clear template selection
    if (templateSelect) {
        templateSelect.value = '';
        currentTemplateName = null;
        deleteTemplateBtn.style.display = 'none';
        renameTemplateBtn.style.display = 'none';
        templateNameGroup.style.display = 'none';
    }
    
    // Clear contact dropdowns
    if (shipperSelect) {
        shipperSelect.value = '';
        updateContactButtonText('Shipper', addShipperBtn, shipperSelect);
    }
    
    if (consigneeSelect) {
        consigneeSelect.value = '';
        updateContactButtonText('Consignee', addConsigneeBtn, consigneeSelect);
    }
    
    if (airlineSelect1) {
        airlineSelect1.value = '';
        updateContactButtonText('Airline', addAirlineBtn1, airlineSelect1);
    }
    
    if (destinationSelect) {
        destinationSelect.value = '';
        if (addDestinationBtn) {
            updateContactButtonText('Destination', addDestinationBtn, destinationSelect);
        }
    }
    
    // Clear Direct Flight and Interline Shipment dropdowns
    if (directFlightSelect) {
        directFlightSelect.value = '';
        // Re-enable fields 11, 12, 13, 14 if they were disabled
        handleDirectFlightChange(false);
    }
    
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    if (interlineShipmentSelect) {
        interlineShipmentSelect.value = '';
        handleInterlineShipmentChange(false); // Hide interline carrier dropdown
    }
    
    if (interlineCarrierSelect1) {
        interlineCarrierSelect1.value = '';
    }
    
    if (interlineCarrierSelect2) {
        interlineCarrierSelect2.value = '';
    }
    
    // Hide Interline Carrier 2 and show the add button again
    const interlineCarrierGroup2 = document.getElementById('interlineCarrierGroup2');
    if (interlineCarrierGroup2) {
        interlineCarrierGroup2.style.display = 'none';
    }
    // Don't show the button here - it will be shown by handleInterlineShipmentChange if needed
    
    const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    if (dangerousGoodsSelect) {
        dangerousGoodsSelect.value = '';
    }
    
    const declaredValuesSelect = document.getElementById('declaredValuesSelect');
    if (declaredValuesSelect) {
        declaredValuesSelect.value = '';
        // Re-enable fields 16, 17 if they were disabled
        handleDeclaredValuesChange(false);
    }
    
    const insuranceSelect = document.getElementById('insuranceSelect');
    if (insuranceSelect) {
        insuranceSelect.value = '';
        // Re-enable field 21 if it was disabled
        handleInsuranceChange(false);
    }
    
    const prepaidCollectSelect = document.getElementById('prepaidCollectSelect');
    if (prepaidCollectSelect) {
        prepaidCollectSelect.value = '';
        handlePrepaidCollectChange('');
    }
    
    // Also clear contact fields form
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    if (contactFieldsForm) {
        const contactFormElements = contactFieldsForm.elements;
        for (let i = 0; i < contactFormElements.length; i++) {
            const element = contactFormElements[i];
            if (element.type === 'checkbox') {
                element.checked = false;
            } else if (element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
        }
    }
    
    // Also clear billing fields form
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    if (billingFieldsForm) {
        const billingFormElements = billingFieldsForm.elements;
        for (let i = 0; i < billingFormElements.length; i++) {
            const element = billingFormElements[i];
            if (element.type === 'checkbox') {
                element.checked = false;
            } else if (element.type === 'radio') {
                element.checked = false;
            } else {
                // Reset field 15 to USD and field 28 to K
                if (element.name && element.name.startsWith('15')) {
                    element.value = 'USD';
                } else if (element.name && element.name.startsWith('28')) {
                    element.value = 'K';
                } else {
                    element.value = '';
                }
            }
        }
    }
    
    // Update validation indicators
    setTimeout(() => updateTabValidationIndicators(), 50);
    
    showError('✓ Form cleared');
    setTimeout(() => hideError(), 2000);
}

// Create a form field element
function createFormField(field) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = field.name;
    // Add asterisk for multiline fields (use different symbol to distinguish from required)
    const multilineIndicator = field.htmlType === 'textarea' ? ' *' : '';
    const requiredIndicator = field.required ? ' *' : '';
    // Add duplicate count if field name appears multiple times
    const duplicateCount = field.duplicateCount || 0;
    const duplicateIndicator = duplicateCount > 1 ? ` (${duplicateCount})` : '';
    const labelText = field.label + requiredIndicator + multilineIndicator + duplicateIndicator;
    label.textContent = labelText;
    
    // Debug: log if we expect a duplicate count
    if (duplicateCount > 1) {
        console.log(`Field "${field.name}" label set to: "${labelText}" (duplicateCount: ${duplicateCount})`);
    }
    
    // Debug logging
    if (field.duplicateCount && field.duplicateCount > 1) {
        console.log(`Creating field "${field.name}" with duplicate count: ${field.duplicateCount}, label: "${labelText}"`);
    }
    if (field.htmlType === 'textarea') {
        console.log(`Creating multiline field: ${field.name} with label: "${labelText}"`);
    }
    
    formGroup.appendChild(label);
    
    let input;
    
    switch (field.htmlType) {
        case 'textarea':
            input = document.createElement('textarea');
            input.rows = 4;
            input.style.fontSize = '12px'; // Set font size to 12px
            // Ensure Enter key creates line breaks
            input.addEventListener('keydown', (e) => {
                // Enter key should create line break (default behavior)
                // Don't prevent default - let it create the line break
                if (e.key === 'Enter') {
                    // Default behavior is to insert newline, which is what we want
                    // Make sure form doesn't submit
                    e.stopPropagation();
                }
            });
            console.log(`Textarea created for field: ${field.name}`);
            break;
        case 'select':
            input = document.createElement('select');
            if (field.options && field.options.length > 0) {
                field.options.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option;
                    optionEl.textContent = option;
                    input.appendChild(optionEl);
                });
            }
            // Check if this is field 15 (currency) and set default to USD
            const isField15Select = field.name.startsWith('15');
            
            // Also check if this is a currency field by name/label
            const isCurrencySelect = field.name.toLowerCase().includes('currency') || 
                                   field.label.toLowerCase().includes('currency') ||
                                   field.pdfFieldName.toLowerCase().includes('currency');
            
            // Check if this is field 28 and set default to kg
            const isField28Select = field.name.startsWith('28');
            
            if ((isField15Select || isCurrencySelect) && !field.value) {
                // Check if USD option exists, if so select it
                const usdOption = Array.from(input.options).find(opt => 
                    opt.value.toUpperCase() === 'USD' || opt.textContent.toUpperCase() === 'USD'
                );
                if (usdOption) {
                    input.value = usdOption.value;
                } else if (input.options.length > 0) {
                    // If USD doesn't exist, try to add it as first option and select it
                    const usdOptionEl = document.createElement('option');
                    usdOptionEl.value = 'USD';
                    usdOptionEl.textContent = 'USD';
                    input.insertBefore(usdOptionEl, input.firstChild);
                    input.value = 'USD';
                }
            } else if (isField28Select && !field.value) {
                // Check if kg option exists, if so select it
                const kgOption = Array.from(input.options).find(opt => 
                    opt.value.toUpperCase() === 'KG' || opt.textContent.toUpperCase() === 'KG'
                );
                if (kgOption) {
                    input.value = kgOption.value;
                } else if (input.options.length > 0) {
                    // If kg doesn't exist, try to add it as first option and select it
                    const kgOptionEl = document.createElement('option');
                    kgOptionEl.value = 'kg';
                    kgOptionEl.textContent = 'kg';
                    input.insertBefore(kgOptionEl, input.firstChild);
                    input.value = 'kg';
                }
            }
            break;
        case 'checkbox':
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-group';
            input = document.createElement('input');
            input.type = 'checkbox';
            input.id = field.name;
            input.name = field.name;
            input.checked = field.value === 'Yes' || field.value === true;
            if (field.required) input.required = true;
            if (field.readOnly) input.disabled = true;
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.htmlFor = field.name;
            checkboxLabel.textContent = field.label;
            checkboxLabel.style.fontSize = '12px'; // Set font size to 12px
            
            checkboxContainer.appendChild(input);
            checkboxContainer.appendChild(checkboxLabel);
            formGroup.appendChild(checkboxContainer);
            return formGroup;
        default:
            input = document.createElement('input');
            input.type = field.htmlType || 'text';
    }
    
    input.id = field.name;
    input.name = field.name;
    
    // Check if this is field 15 (currency) and set default to USD
    const isField15 = field.name.startsWith('15');
    
    // Also check if this is a currency field by name/label
    const isCurrencyField = field.name.toLowerCase().includes('currency') || 
                           field.label.toLowerCase().includes('currency') ||
                           field.pdfFieldName.toLowerCase().includes('currency');
    
    // Check if this is field 28 and set default to kg
    const isField28 = field.name.startsWith('28');
    
    // Check if this is field 100 and set default to ORIGINAL
    const isField100 = field.name.startsWith('100');
    
    if ((isField15 || isCurrencyField) && !field.value) {
        input.value = 'USD';
    } else if (isField28 && !field.value) {
        input.value = 'kg';
    } else if (isField100 && !field.value) {
        input.value = 'ORIGINAL';
    } else {
        input.value = field.value || '';
    }
    
    input.style.fontSize = '12px'; // Set font size to 12px
    if (field.required) input.required = true;
    if (field.readOnly) input.disabled = true;
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.placeholder) input.placeholder = field.placeholder;
    
    // Check if this is field 31, 32, or 43-49 (dollar amounts)
    const isField31 = field.name.startsWith('31');
    const isField32 = field.name.startsWith('32');
    const isField43 = field.name.startsWith('43');
    const isField44 = field.name.startsWith('44');
    const isField45 = field.name.startsWith('45');
    const isField46 = field.name.startsWith('46');
    const isField47 = field.name.startsWith('47');
    const isField48 = field.name.startsWith('48');
    const isField49 = field.name.startsWith('49');
    
    if (isField31 || isField32 || isField43 || isField44 || isField45 || isField46 || isField47 || isField48 || isField49) {
        // Set up dollar formatting
        input.type = 'text'; // Use text input to allow $ formatting
        
        // Format initial value if present
        if (input.value) {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                input.value = formatDollarAmount(numValue);
            }
        }
        
        // Format on blur (when user leaves field)
        input.addEventListener('blur', (e) => {
            const value = parseDollarAmount(e.target.value);
            if (!isNaN(value)) {
                e.target.value = formatDollarAmount(value);
            }
        });
        
        // Allow only numeric input and $ symbol
        input.addEventListener('input', (e) => {
            let value = e.target.value;
            // Remove $ and commas for processing
            value = value.replace(/[$,]/g, '');
            // Allow only numbers and decimal point
            if (value && !/^\d*\.?\d*$/.test(value)) {
                // Remove invalid characters
                value = value.replace(/[^\d.]/g, '');
                // Only allow one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                // Don't format during typing, just store the numeric value
                e.target.value = value;
            }
        });
        
        // Format on focus (show formatted value)
        input.addEventListener('focus', (e) => {
            const value = parseDollarAmount(e.target.value);
            if (!isNaN(value)) {
                e.target.value = formatDollarAmount(value);
            }
        });
    }
    
    formGroup.appendChild(input);
    return formGroup;
}

// Format number as dollar amount (e.g., 123.45 -> "$123.45")
function formatDollarAmount(value) {
    if (value === null || value === undefined || isNaN(value)) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return '$' + num.toFixed(2);
}

// Parse dollar amount string to number (e.g., "$123.45" -> 123.45)
function parseDollarAmount(value) {
    if (!value) return NaN;
    // Remove $ and commas, then parse
    const cleaned = value.toString().replace(/[$,]/g, '');
    return parseFloat(cleaned);
}

// Fill PDF and download handler
async function handleFillPdf(flatten = false) {
    console.log('Fill PDF button clicked', flatten ? '(with flattening)' : '(editable)');
    
    if (!generatedForm) {
        showError('Error: Form not found. Please refresh the page.');
        return;
    }
    
    // Update validation indicators to ensure accurate missing field list
    updateTabValidationIndicators();
    
    // Check for missing fields
    const missingFields = getMissingFieldNames();
    if (missingFields.length > 0) {
        const fieldList = missingFields.map(field => `• ${field}`).join('\n');
        const message = `The following fields are missing:\n\n${fieldList}\n\nDo you want to continue anyway?`;
        if (!confirm(message)) {
            return; // User cancelled
        }
    }
    
    if (!originalPdfBytes) {
        showError('Error: Original PDF not available. Please refresh the page.');
        return;
    }
    
    showLoading();
    try {
        console.log('Collecting form data...');
        const formData = collectFormData();
        console.log('Form data collected:', formData);
        
        console.log('Filling PDF...');
        const filledPdfBytes = await fillPdfWithData(formData, flatten);
        console.log('PDF filled successfully', flatten ? '(and flattened)' : '');
        
        // Download the filled PDF
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = flatten ? 'filled-form-clean.pdf' : 'filled-form.pdf';
        document.body.appendChild(a); // Required for some browsers
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        hideLoading();
        showError(flatten ? '✓ Clean PDF (flattened) downloaded successfully!' : '✓ PDF filled and downloaded successfully!');
        setTimeout(() => {
            hideError();
        }, 3000);
    } catch (err) {
        console.error('Error filling PDF:', err);
        showError('Error filling PDF: ' + err.message + '. Check console for details.');
        hideLoading();
    }
}

// Collect form data
function collectFormData() {
    const data = {};
    
    // Get all form elements from all forms (main form, contact fields form, and billing fields form)
    const formElements = generatedForm.elements;
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const contactFormElements = contactFieldsForm ? contactFieldsForm.elements : [];
    const billingFormElements = billingFieldsForm ? billingFieldsForm.elements : [];
    
    // Collect all form data manually to ensure we get everything from main form
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        const name = element.name;
        
        if (!name) continue; // Skip elements without names
        
        if (element.type === 'checkbox') {
            data[name] = element.checked;
        } else if (element.type === 'radio') {
            if (element.checked) {
                data[name] = element.value;
            }
        } else if (element.type === 'select-one' || element.type === 'select-multiple') {
            if (element.selectedIndex >= 0) {
                data[name] = element.options[element.selectedIndex].value;
            }
        } else if (element.tagName === 'TEXTAREA') {
            // Textarea - preserve line breaks (\n)
            data[name] = element.value || '';
            console.log(`Multiline field ${name} captured with ${(element.value.match(/\n/g) || []).length} line breaks`);
        } else {
            // Text input, etc.
            let value = element.value || '';
            // Keep dollar amounts with $ symbol for fields 31, 32, and 43-49
            // (value already has the $ from the form, so we keep it as is for PDF)
            data[name] = value;
        }
    }
    
    // Collect data from contact fields form (fields 04, 05, 06, 07)
    for (let i = 0; i < contactFormElements.length; i++) {
        const element = contactFormElements[i];
        const name = element.name;
        
        if (!name) continue; // Skip elements without names
        
        if (element.type === 'checkbox') {
            data[name] = element.checked;
        } else if (element.type === 'radio') {
            if (element.checked) {
                data[name] = element.value;
            }
        } else if (element.type === 'select-one' || element.type === 'select-multiple') {
            if (element.selectedIndex >= 0) {
                data[name] = element.options[element.selectedIndex].value;
            }
        } else if (element.tagName === 'TEXTAREA') {
            // Textarea - preserve line breaks (\n)
            data[name] = element.value || '';
            console.log(`Multiline field ${name} captured with ${(element.value.match(/\n/g) || []).length} line breaks`);
        } else {
            // Text input, etc.
            let value = element.value || '';
            // Keep dollar amounts with $ symbol for fields 31, 32, and 43-49
            // (value already has the $ from the form, so we keep it as is for PDF)
            data[name] = value;
        }
    }
    
    // Collect data from billing fields form (fields 16, 17)
    for (let i = 0; i < billingFormElements.length; i++) {
        const element = billingFormElements[i];
        const name = element.name;
        
        if (!name) continue; // Skip elements without names
        
        if (element.type === 'checkbox') {
            data[name] = element.checked;
        } else if (element.type === 'radio') {
            if (element.checked) {
                data[name] = element.value;
            }
        } else if (element.type === 'select-one' || element.type === 'select-multiple') {
            if (element.selectedIndex >= 0) {
                data[name] = element.options[element.selectedIndex].value;
            }
        } else if (element.tagName === 'TEXTAREA') {
            // Textarea - preserve line breaks (\n)
            data[name] = element.value || '';
            console.log(`Multiline field ${name} captured with ${(element.value.match(/\n/g) || []).length} line breaks`);
        } else {
            // Text input, etc.
            let value = element.value || '';
            // Keep dollar amounts with $ symbol for fields 31, 32, and 43-49
            // (value already has the $ from the form, so we keep it as is for PDF)
            data[name] = value;
        }
    }
    
    // Also use FormData as backup for any missed fields from main form
    const formData = new FormData(generatedForm);
    formData.forEach((value, key) => {
        // Only add if not already captured
        if (!(key in data)) {
            data[key] = value;
        }
    });
    
    // Also use FormData for contact fields form
    if (contactFieldsForm) {
        const contactFormData = new FormData(contactFieldsForm);
        contactFormData.forEach((value, key) => {
            // Only add if not already captured
            if (!(key in data)) {
                data[key] = value;
            }
        });
    }
    
    // Also use FormData for billing fields form
    if (billingFieldsForm) {
        const billingFormData = new FormData(billingFieldsForm);
        billingFormData.forEach((value, key) => {
            // Only add if not already captured
            if (!(key in data)) {
                data[key] = value;
            }
        });
    }
    
    // Handle checkboxes that weren't checked (set to false explicitly)
    formFields.forEach(field => {
        if (field.htmlType === 'checkbox' && !(field.name in data)) {
            data[field.name] = false;
        }
    });
    
    console.log('Collected form data:', data);
    return data;
}

// Fill PDF with form data using pdf-lib
async function fillPdfWithData(formData, flatten = false) {
    if (!originalPdfBytes) {
        throw new Error('Original PDF not available');
    }
    
    if (typeof PDFLib === 'undefined') {
        throw new Error('PDF-lib library not loaded. Please check your internet connection.');
    }
    
    console.log('Loading PDF with pdf-lib...');
    console.log('PDF bytes type:', originalPdfBytes.constructor.name);
    console.log('PDF bytes length:', originalPdfBytes.byteLength || originalPdfBytes.length);
    
    // Verify we have valid PDF data by checking the first few bytes
    let view;
    if (originalPdfBytes instanceof ArrayBuffer) {
        view = new Uint8Array(originalPdfBytes, 0, Math.min(10, originalPdfBytes.byteLength));
    } else if (originalPdfBytes instanceof Uint8Array) {
        view = originalPdfBytes.slice(0, Math.min(10, originalPdfBytes.length));
    } else {
        throw new Error('Invalid PDF data format');
    }
    
    // Check for PDF header (%PDF)
    const header = String.fromCharCode.apply(null, Array.from(view.slice(0, 4)));
    console.log('PDF header check:', header);
    if (header !== '%PDF') {
        throw new Error('Invalid PDF file - header not found. File may be corrupted.');
    }
    
    // Ensure we have ArrayBuffer for pdf-lib
    let pdfBytes = originalPdfBytes;
    if (originalPdfBytes instanceof Uint8Array) {
        // Convert Uint8Array to ArrayBuffer
        pdfBytes = originalPdfBytes.buffer.slice(
            originalPdfBytes.byteOffset,
            originalPdfBytes.byteOffset + originalPdfBytes.byteLength
        );
    } else if (!(originalPdfBytes instanceof ArrayBuffer)) {
        throw new Error('PDF data is not in a valid format');
    }
    
    // Load the PDF with pdf-lib
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Embed bold font for text fields (Helvetica-Bold)
    let helveticaBoldFont;
    try {
        // Try different ways to access StandardFonts for bold
        if (PDFLib.StandardFonts && PDFLib.StandardFonts.HelveticaBold) {
            helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        } else if (PDFLib.StandardFonts) {
            // Try accessing as property
            const boldFontName = PDFLib.StandardFonts['HelveticaBold'] || PDFLib.StandardFonts.HelveticaBold;
            if (boldFontName) {
                helveticaBoldFont = await pdfDoc.embedFont(boldFontName);
            } else {
                // Fallback to regular Helvetica if bold not available
                helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                console.warn('HelveticaBold not found, using regular Helvetica');
            }
        } else {
            // Last resort: try regular Helvetica
            helveticaBoldFont = await pdfDoc.embedFont('Helvetica');
            console.warn('StandardFonts not available, using regular Helvetica');
        }
        console.log('Bold font embedded successfully');
    } catch (e) {
        console.warn('Could not embed bold font, trying regular Helvetica:', e);
        try {
            // Fallback to regular Helvetica if bold fails
            helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            console.log('Using regular Helvetica as fallback');
        } catch (e2) {
            helveticaBoldFont = null;
            console.error('Could not embed any font:', e2);
        }
    }
    
    // Get all form fields from pdf-lib
    const pdfFields = form.getFields();
    
    console.log('PDF fields found by pdf-lib:', pdfFields.length);
    console.log('Form fields extracted by PDF.js:', formFields.length);
    
    // Create a map of field names to arrays of pdf-lib field objects (to handle duplicates)
    const fieldMap = new Map();
    pdfFields.forEach(field => {
        const fieldName = field.getName();
        if (!fieldMap.has(fieldName)) {
            fieldMap.set(fieldName, []);
        }
        fieldMap.get(fieldName).push(field);
        console.log('PDF field name:', fieldName, 'Type:', field.constructor.name);
    });
    
    // Log duplicate field names
    fieldMap.forEach((fields, name) => {
        if (fields.length > 1) {
            console.log(`Found ${fields.length} PDF fields with name "${name}"`);
        }
    });
    
    console.log('Form data to fill:', formData);
    
    // Embed regular font for field 98 (non-bold)
    let helveticaRegularFont;
    try {
        helveticaRegularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        console.log('Regular font embedded for field 98');
    } catch (e) {
        console.warn('Could not embed regular font:', e);
    }
    
    // Update all field appearances to use bold font at once (more efficient)
    // Note: Field 98 will be updated separately with regular font
    if (helveticaBoldFont && typeof form.updateFieldAppearances === 'function') {
        try {
            form.updateFieldAppearances(helveticaBoldFont);
            console.log('All field appearances updated to bold font (field 98 will be updated separately)');
            
            // After updating all fields to bold, update field 98 specifically to regular font
            if (helveticaRegularFont) {
                try {
                    const field98Fields = form.getFields().filter(f => {
                        const name = f.getName();
                        return name && name.startsWith('98');
                    });
                    field98Fields.forEach(field98 => {
                        if (typeof field98.updateAppearances === 'function') {
                            field98.updateAppearances(helveticaRegularFont);
                            console.log(`Field 98 (${field98.getName()}) updated to regular (non-bold) font`);
                        }
                    });
                } catch (e) {
                    console.warn('Could not update field 98 to regular font:', e);
                }
            }
        } catch (e) {
            console.warn('Could not update all field appearances at once:', e);
        }
    }
    
    // Group radio buttons by their group name
    const radioGroups = {};
    formFields.forEach(field => {
        if (field.htmlType === 'radio' && field.radioGroup) {
            const groupName = field.radioGroup;
            if (!radioGroups[groupName]) {
                radioGroups[groupName] = [];
            }
            radioGroups[groupName].push(field);
        }
    });
    
    let fieldsFilled = 0;
    let fieldsSkipped = 0;
    
    // Track which form field names we've already processed (to avoid processing duplicates)
    const processedFieldNames = new Set();
    
    // Fill each field
    formFields.forEach(field => {
        // Skip radio buttons - they'll be handled separately
        if (field.htmlType === 'radio') {
            return;
        }
        
        const formFieldName = field.name;
        
        // Skip field 99 - it will be handled separately with setImage for airline logo
        if (formFieldName && (formFieldName.startsWith('99') || 
                             formFieldName.toLowerCase().includes('99') ||
                             formFieldName.toLowerCase().includes('airlinelogo'))) {
            console.log(`Skipping field ${formFieldName} - will be handled separately with setImage`);
            return;
        }
        
        // Skip if we've already processed this field name (it was consolidated)
        if (processedFieldNames.has(formFieldName)) {
            return;
        }
        
        // Mark this field name as processed
        processedFieldNames.add(formFieldName);
        
        let formValue = formData[formFieldName];
        
        // Keep dollar amounts with $ symbol for fields 31, 32, and 43-49 when filling PDF
        // (formValue already has the $ from the form, so we keep it as is)
        // No need to parse - just use the formatted value with $ symbol
        
        // Get all PDF field names that should be filled with this value
        // If field was consolidated, use allPdfFieldNames; otherwise use single pdfFieldName
        const pdfFieldNamesToFill = field.allPdfFieldNames || [field.pdfFieldName];
        
        console.log(`Attempting to fill field: Form name="${formFieldName}", Value="${formValue}", PDF names to fill:`, pdfFieldNamesToFill);
        
        // Fill all PDF fields with the same name
        let filledCount = 0;
        pdfFieldNamesToFill.forEach(pdfFieldName => {
            // Try exact match first
            let pdfFieldsArray = fieldMap.get(pdfFieldName);
            
            // If not found, try case-insensitive match
            if (!pdfFieldsArray || pdfFieldsArray.length === 0) {
                for (const [name, fieldObjs] of fieldMap.entries()) {
                    if (name.toLowerCase() === pdfFieldName.toLowerCase()) {
                        pdfFieldsArray = fieldObjs;
                        console.log(`Found fields with case-insensitive match: ${name}`);
                        break;
                    }
                }
            }
            
            // If still not found, try partial match
            if (!pdfFieldsArray || pdfFieldsArray.length === 0) {
                for (const [name, fieldObjs] of fieldMap.entries()) {
                    if (name.includes(pdfFieldName) || pdfFieldName.includes(name)) {
                        pdfFieldsArray = fieldObjs;
                        console.log(`Found fields with partial match: ${name}`);
                        break;
                    }
                }
            }
            
            if (!pdfFieldsArray || pdfFieldsArray.length === 0) {
                console.warn(`No PDF fields found for name: ${pdfFieldName}. Available fields:`, Array.from(fieldMap.keys()));
                fieldsSkipped++;
                return;
            }
            
            // Fill all PDF fields with this name
            pdfFieldsArray.forEach(pdfField => {
                try {
                    fillSinglePdfField(pdfField, pdfFieldName, formValue, field, helveticaBoldFont, pdfDoc);
                    filledCount++;
                } catch (error) {
                    console.error(`Error filling PDF field "${pdfFieldName}":`, error);
                }
            });
        });
        
        if (filledCount > 0) {
            fieldsFilled += filledCount;
            console.log(`✓ Filled ${filledCount} PDF field(s) for form field "${formFieldName}"`);
        }
    });
    
    // Helper function to fill a single PDF field
    function fillSinglePdfField(pdfField, pdfFieldName, formValue, field, helveticaBoldFont, pdfDoc) {
        
        try {
            // Use method detection instead of constructor.name (more reliable with minified code)
            const hasSetText = typeof pdfField.setText === 'function';
            const hasCheck = typeof pdfField.check === 'function';
            const hasSelect = typeof pdfField.select === 'function';
            const hasGetOptions = typeof pdfField.getOptions === 'function';
            
            console.log(`Filling field ${pdfFieldName} - Methods: setText=${hasSetText}, check=${hasCheck}, select=${hasSelect}, getOptions=${hasGetOptions}`);
            console.log(`Field value to set:`, formValue);
            
            // Text field - has setText method
            if (hasSetText) {
                // Check if this is a multiline field
                const isMultiline = field.htmlType === 'textarea';
                
                // Check if this is field 28 - use 7 points, field 98 - use 6 points, field 100 - use 12 points, others use 8 points
                const isField28 = field.name && field.name.startsWith('28');
                const isField98 = field.name && field.name.startsWith('98');
                const isField100 = field.name && field.name.startsWith('100');
                const isField01 = field.name && field.name.startsWith('01');
                const isField02 = field.name && field.name.startsWith('02');
                const isField03 = field.name && field.name.startsWith('03');
                const isField101 = field.name && field.name.startsWith('101');
                const fontSize = isField28 ? 7 : (isField98 ? 6 : (isField100 ? 12 : (isField02 ? 12 : (isField01 || isField03 || isField101 ? 12 : 8))));
                
                // Check if this is field 42 - set center alignment
                const isField42 = field.name && field.name.startsWith('42');
                
                // Set font size (PDF uses points, not pixels)
                try {
                    if (typeof pdfField.setFontSize === 'function') {
                        pdfField.setFontSize(fontSize);
                        console.log(`Font size set to ${fontSize} for field: ${pdfFieldName} (multiline: ${isMultiline})`);
                    }
                } catch (fontSizeError) {
                    console.warn(`Could not set font size for ${pdfFieldName}:`, fontSizeError);
                }
                
                // Set the text - preserve line breaks for multiline fields
                const textToSet = String(formValue || '');
                
                // For multiline fields, ensure the PDF field supports multiline
                if (isMultiline) {
                    // Try to enable multiline if the method exists
                    try {
                        if (typeof pdfField.enableMultiline === 'function') {
                            pdfField.enableMultiline();
                            console.log(`Multiline enabled for field: ${pdfFieldName}`);
                        }
                    } catch (e) {
                        // Field may already be multiline or method doesn't exist
                        console.log(`Field ${pdfFieldName} is multiline (method check skipped)`);
                    }
                    
                    if (textToSet.includes('\n')) {
                        const lineCount = textToSet.split('\n').length;
                        console.log(`Multiline text detected: ${pdfFieldName} with ${lineCount} lines`);
                        console.log(`Sample text (first 100 chars): ${textToSet.substring(0, 100).replace(/\n/g, '\\n')}`);
                    }
                }
                
                // Set the text - pdf-lib's setText should preserve \n characters for multiline fields
                pdfField.setText(textToSet);
                
                // For fields 01, 03, and 101, set blue color BEFORE updating appearances
                if ((isField01 || isField03 || isField101) && pdfField.acroField) {
                    try {
                        const acroField = pdfField.acroField;
                        // Dark pastel blue color DA string: "/Helvetica-Bold 12 Tf 0.27 0.51 0.71 rg"
                        const daString = '/Helvetica-Bold 12 Tf 0.27 0.51 0.71 rg';
                        
                        // Set on acroField dictionary
                        if (acroField.dict) {
                            acroField.dict.set(PDFLib.PDFName.of('DA'), PDFLib.PDFString.of(daString));
                            console.log(`Blue color DA set on acroField for field ${pdfFieldName}`);
                        }
                        
                        // Set on widget annotations
                        try {
                            const widgets = acroField.getWidgets();
                            if (widgets && widgets.length > 0) {
                                widgets.forEach(widget => {
                                    if (widget.dict) {
                                        widget.dict.set(PDFLib.PDFName.of('DA'), PDFLib.PDFString.of(daString));
                                        console.log(`Blue color DA set on widget for field ${pdfFieldName}`);
                                    }
                                });
                            }
                        } catch (e) {
                            console.warn(`Could not set DA on widgets:`, e);
                        }
                    } catch (e) {
                        console.warn(`Could not set blue color DA for field ${pdfFieldName}:`, e);
                    }
                }
                
                // Set center alignment for field 42 AFTER setting text
                if (isField42) {
                    try {
                        // Try different methods to set center alignment
                        if (typeof pdfField.setAlignment === 'function') {
                            // Try with TextAlignment enum if available
                            if (PDFLib && PDFLib.TextAlignment) {
                                pdfField.setAlignment(PDFLib.TextAlignment.Center);
                                console.log(`Center alignment set for field: ${pdfFieldName}`);
                            } else {
                                // Fallback: try with string or numeric value
                                try {
                                    pdfField.setAlignment('center');
                                } catch (e) {
                                    pdfField.setAlignment(1); // Center = 1
                                }
                                console.log(`Center alignment set for field: ${pdfFieldName} (fallback)`);
                            }
                        } else if (pdfField.alignment !== undefined) {
                            // Alternative: set alignment property directly
                            if (PDFLib && PDFLib.TextAlignment) {
                                pdfField.alignment = PDFLib.TextAlignment.Center;
                            } else {
                                pdfField.alignment = 1; // Center alignment value (0=Left, 1=Center, 2=Right)
                            }
                            console.log(`Center alignment set for field: ${pdfFieldName} (via property)`);
                        }
                    } catch (alignmentError) {
                        console.warn(`Could not set center alignment for ${pdfFieldName}:`, alignmentError);
                    }
                }
                
                // Update appearances with bold font AFTER setting text (setText may reset appearance)
                // But NOT for field 98 - field 98 should use regular (non-bold) font
                // Field 100 should use bold font
                if (helveticaBoldFont && !isField98) {
                    try {
                        // Try different methods to apply bold font
                        if (typeof pdfField.updateAppearances === 'function') {
                            pdfField.updateAppearances(helveticaBoldFont);
                            console.log(`Bold font applied to field: ${pdfFieldName}`);
                        } else if (typeof pdfField.defaultUpdateAppearances === 'function') {
                            pdfField.defaultUpdateAppearances(helveticaBoldFont);
                            console.log(`Bold font applied (default) to field: ${pdfFieldName}`);
                        }
                    } catch (appearanceError) {
                        console.warn(`Could not update appearances for ${pdfFieldName}:`, appearanceError);
                    }
                } else if (isField98) {
                    // For field 98, skip bold font - it will be updated to regular font later
                    console.log(`Field 98 (${pdfFieldName}) - skipping bold font, will use regular font`);
                }
                
                // For field 100, set text color to red AFTER all appearance updates
                // For fields 01 and 03, set text color to blue AFTER all appearance updates
                // pdf-lib requires setting color via default appearance (DA) string
                if (isField100 || isField01 || isField03 || isField101) {
                    try {
                        // Access the acroField to set default appearance with color
                        if (pdfField.acroField) {
                            const acroField = pdfField.acroField;
                            
                            let daString;
                            let colorName;
                            
                            if (isField100) {
                                // Red color for field 100: "/Helvetica-Bold 12 Tf 1 0 0 rg"
                                daString = '/Helvetica-Bold 12 Tf 1 0 0 rg';
                                colorName = 'red';
                            } else if (isField01 || isField03 || isField101) {
                                // Dark pastel blue color for fields 01, 03, and 101: "/Helvetica-Bold 12 Tf 0.27 0.51 0.71 rg"
                                daString = '/Helvetica-Bold 12 Tf 0.27 0.51 0.71 rg';
                                colorName = 'blue';
                            }
                            
                            // Try to set DA directly on the acro field dictionary
                            try {
                                if (acroField.dict && daString) {
                                    acroField.dict.set(PDFLib.PDFName.of('DA'), PDFLib.PDFString.of(daString));
                                    console.log(`${colorName} color set via acroField DA for field ${pdfFieldName}`);
                                }
                            } catch (e) {
                                console.warn(`Could not set DA on acroField for field ${pdfFieldName}:`, e);
                            }
                            
                            // Also try setting on widget annotations
                            try {
                                const widgets = acroField.getWidgets();
                                if (widgets && widgets.length > 0 && daString) {
                                    widgets.forEach(widget => {
                                        try {
                                            if (widget.dict) {
                                                widget.dict.set(PDFLib.PDFName.of('DA'), PDFLib.PDFString.of(daString));
                                                console.log(`${colorName} color set via widget DA for field ${pdfFieldName}`);
                                            }
                                        } catch (e) {
                                            console.warn(`Could not set DA on widget:`, e);
                                        }
                                    });
                                }
                            } catch (e) {
                                console.warn(`Could not set DA on widgets for field ${pdfFieldName}:`, e);
                            }
                            
                            // Force update appearances after setting color
                            try {
                                if (typeof pdfField.updateAppearances === 'function') {
                                    pdfField.updateAppearances(helveticaBoldFont);
                                }
                            } catch (e) {
                                console.warn(`Could not update appearances after setting color:`, e);
                            }
                        }
                    } catch (colorError) {
                        console.warn(`Could not set text color for field ${pdfFieldName}:`, colorError);
                    }
                }
                
                const previewText = formValue && formValue.length > 50 ? formValue.substring(0, 50) + '...' : formValue;
                console.log(`✓ Text field filled: ${pdfFieldName} = "${previewText}"`);
            } 
            // Checkbox - has check/uncheck methods
            else if (hasCheck) {
                if (formValue === true || formValue === 'true' || formValue === 'on' || formValue === 'Yes' || formValue === 'yes') {
                    pdfField.check();
                    console.log(`✓ Checkbox checked: ${pdfFieldName}`);
                } else {
                    pdfField.uncheck();
                    console.log(`✓ Checkbox unchecked: ${pdfFieldName}`);
                }
            } 
            // Dropdown - has select and getOptions methods
            else if (hasSelect && hasGetOptions) {
                if (formValue) {
                    try {
                        pdfField.select(String(formValue));
                        console.log(`✓ Dropdown selected: ${pdfFieldName} = ${formValue}`);
                    } catch (e) {
                        // Try to find matching option
                        const options = pdfField.getOptions();
                        console.log(`Dropdown options for ${pdfFieldName}:`, options);
                        const matchingOption = options.find(opt => 
                            opt.toLowerCase() === String(formValue).toLowerCase() ||
                            opt.toLowerCase().includes(String(formValue).toLowerCase()) ||
                            String(formValue).toLowerCase().includes(opt.toLowerCase())
                        );
                        if (matchingOption) {
                            pdfField.select(matchingOption);
                            console.log(`✓ Dropdown selected (matched): ${pdfFieldName} = ${matchingOption}`);
                        } else {
                            console.warn(`Could not set dropdown value: ${formValue} for field ${pdfFieldName}`);
                        }
                    }
                }
            } 
            // Radio button group - might have select method but different behavior
            else if (hasSelect) {
                // Try as radio button or dropdown
                try {
                    pdfField.select(String(formValue));
                    console.log(`✓ Radio/Dropdown selected: ${pdfFieldName} = ${formValue}`);
                } catch (e) {
                    console.warn(`Could not select value for field ${pdfFieldName}:`, e.message);
                }
            }
            else {
                // Try to inspect the field object
                console.warn(`Unknown field type for ${pdfFieldName}. Available methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(pdfField)));
                // Last resort: try setText if it exists
                if (typeof pdfField.setText === 'function') {
                    try {
                        pdfField.setText(String(formValue || ''));
                        console.log(`✓ Field filled (fallback): ${pdfFieldName}`);
                    } catch (e) {
                        console.error(`Failed to fill field ${pdfFieldName}:`, e);
                    }
                }
            }
        } catch (err) {
            console.error(`Error filling field ${pdfFieldName}:`, err);
            throw err; // Re-throw to be caught by outer try-catch
        }
    }
    
    console.log(`Fields filled: ${fieldsFilled}, Fields skipped: ${fieldsSkipped}`);
    
    // Flatten the form if requested (removes form fields, makes it look clean/printed)
    if (flatten) {
        console.log('Flattening PDF form (removing field boxes)...');
        try {
            form.flatten();
            console.log('✓ PDF form flattened successfully');
        } catch (err) {
            console.warn('Warning: Could not flatten form:', err);
            // Continue anyway - the PDF will still be filled, just not flattened
        }
    }
    
    // Handle radio button groups
    Object.keys(radioGroups).forEach(groupName => {
        const selectedValue = formData[groupName];
        if (selectedValue) {
            // Find the radio button field that matches the selected value
            const selectedField = radioGroups[groupName].find(f => f.pdfFieldName === selectedValue);
            if (selectedField) {
                const pdfField = fieldMap.get(selectedField.pdfFieldName);
                if (pdfField) {
                    try {
                        // For radio buttons, we need to check the specific field
                        if (pdfField.constructor.name === 'PDFRadioGroup') {
                            // Get the radio group and select the option
                            const options = pdfField.getOptions();
                            // Try to find the option that matches
                            const optionToSelect = options.find(opt => 
                                opt.toLowerCase().includes(selectedField.label.toLowerCase()) ||
                                selectedField.label.toLowerCase().includes(opt.toLowerCase())
                            ) || options[0];
                            if (optionToSelect) {
                                pdfField.select(optionToSelect);
                            }
                        } else if (pdfField.constructor.name === 'PDFCheckBox') {
                            // Some PDFs use checkboxes for radio-like behavior
                            pdfField.check();
                        }
                    } catch (err) {
                        console.warn(`Error filling radio group ${groupName}:`, err);
                    }
                }
            }
        }
    });
    
    // Handle airline logo image for field 99
    // Do this BEFORE flattening, and use the fieldMap that was created earlier
    if (currentAirlineImage) {
        try {
            console.log('Attempting to place airline logo in field 99...');
            const result = await fillPdfImageField99(pdfDoc, form, currentAirlineImage, fieldMap);
            if (result && result.success) {
                console.log('✓ Airline logo placed in field 99');
                showError('✓ Airline logo successfully placed in PDF field 99');
                setTimeout(() => hideError(), 3000);
            } else {
                console.warn('Logo placement did not return success');
            }
        } catch (error) {
            console.error('Could not place airline logo in field 99:', error);
            showError('⚠ Could not place airline logo in PDF: ' + error.message);
            setTimeout(() => hideError(), 3000);
            // Don't throw - allow PDF to save even if logo placement fails
        }
    }
    
    // Save and return the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    return filledPdfBytes;
}

// Fill PDF field 99 with airline logo using setImage method
async function fillPdfImageField99(pdfDoc, form, imageDataUrl, fieldMap) {
    try {
        // Find field 99 in formFields array first
        // The actual PDF field name is "99. AirlineLogo" (with space)
        const formField99 = formFields.find(f => 
            f.name && (f.name === '99. AirlineLogo' ||
                       f.name === '99. AirlineLogo_af_image' ||
                       f.name.startsWith('99') || 
                       f.name.toLowerCase().includes('99') ||
                       f.name.toLowerCase().includes('airlinelogo'))
        );
        
        if (!formField99) {
            console.warn('Field 99 not found in formFields array');
            return { success: false, message: 'Field 99 not found in formFields' };
        }
        
        console.log('Found field 99 in formFields array:', {
            name: formField99.name,
            pdfFieldName: formField99.pdfFieldName,
            type: formField99.type
        });
        
        // Try to get the field directly by name using pdf-lib's form API
        // The actual PDF field name is "99. AirlineLogo" (with space)
        // Try multiple variations of the field name
        const possibleNames = [
            '99. AirlineLogo',  // The actual PDF field name
            formField99.pdfFieldName || formField99.name,
            '99. AirlineLogo_af_image',
            '99.AIrline_af_image'
        ];
        
        let targetField = null;
        let pdfFieldName = null;
        
        // Try each possible name
        for (const name of possibleNames) {
            if (!name) continue;
            
            // Try fieldMap first
            const pdfFieldsArray = fieldMap.get(name);
            if (pdfFieldsArray && pdfFieldsArray.length > 0) {
                targetField = pdfFieldsArray[0];
                pdfFieldName = name;
                console.log(`Found field in fieldMap: "${name}"`);
                break;
            }
            
            // Try getButton (since it's type 'Btn')
            try {
                if (typeof form.getButton === 'function') {
                    targetField = form.getButton(name);
                    if (targetField) {
                        pdfFieldName = name;
                        console.log(`Got field using getButton: "${name}"`);
                        break;
                    }
                }
            } catch (e) {
                // Field not found with this name, try next
            }
        }
        
        // If still not found, try case-insensitive search
        if (!targetField) {
            console.log('Exact match not found, trying case-insensitive search...');
            for (const name of possibleNames) {
                if (!name) continue;
                
                // Try case-insensitive in fieldMap
                for (const [mapName, fieldObjs] of fieldMap.entries()) {
                    if (mapName.toLowerCase() === name.toLowerCase()) {
                        targetField = fieldObjs[0];
                        pdfFieldName = mapName;
                        console.log(`Found field with case-insensitive match in fieldMap: ${mapName}`);
                        break;
                    }
                }
                if (targetField) break;
            }
        }
        
        if (!targetField) {
            console.warn('Field 99 not found via any method.');
            console.warn('Tried field names:', possibleNames);
            console.warn('FieldMap size:', fieldMap.size);
            if (fieldMap.size > 0) {
                console.warn('Available field names in fieldMap:', Array.from(fieldMap.keys()));
            }
            // Try one more time with just "99. AirlineLogo" directly
            try {
                if (typeof form.getButton === 'function') {
                    const directField = form.getButton('99. AirlineLogo');
                    if (directField) {
                        targetField = directField;
                        pdfFieldName = '99. AirlineLogo';
                        console.log('Successfully got field with direct name "99. AirlineLogo"');
                    }
                }
            } catch (e) {
                console.warn('Direct getButton("99. AirlineLogo") failed:', e.message);
            }
        }
        
        if (!targetField) {
            return { success: false, message: 'Field 99 not accessible via pdf-lib form API' };
        }
        
        console.log(`Using field: "${targetField.getName ? targetField.getName() : pdfFieldName}"`);
        
        // Try setImage first, but if it fails, draw the image directly on the page
        let useSetImage = false;
        if (typeof targetField.setImage === 'function') {
            useSetImage = true;
            console.log(`Field "${targetField.getName()}" has setImage method - will try it first`);
        } else {
            console.log(`Field "${targetField.getName()}" does not have setImage method - will draw on page instead`);
        }
        
        // Convert base64 data URL to image bytes
        const base64Data = imageDataUrl.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Determine image format and embed
        let pdfImage;
        if (imageDataUrl.includes('data:image/jpeg') || imageDataUrl.includes('data:image/jpg')) {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else if (imageDataUrl.includes('data:image/png')) {
            pdfImage = await pdfDoc.embedPng(imageBytes);
        } else {
            // Try PNG as default
            try {
                pdfImage = await pdfDoc.embedPng(imageBytes);
            } catch (e) {
                pdfImage = await pdfDoc.embedJpg(imageBytes);
            }
        }
        
        console.log('PDF Image dimensions:', pdfImage.width, 'x', pdfImage.height);
        
        // Try setImage method first
        if (useSetImage) {
            try {
                console.log('Calling setImage on field:', targetField.getName());
                targetField.setImage(pdfImage);
                console.log('setImage called successfully');
                
                // Update appearances to ensure image is visible
                try {
                    if (typeof targetField.updateAppearances === 'function') {
                        targetField.updateAppearances();
                        console.log('Field appearances updated');
                    } else if (typeof targetField.defaultUpdateAppearances === 'function') {
                        targetField.defaultUpdateAppearances();
                        console.log('Field appearances updated (default method)');
                    }
                } catch (e) {
                    console.warn('Could not update field appearances:', e);
                }
                
                console.log(`✓ Image successfully set in field "${targetField.getName()}" using setImage method`);
                return { success: true, message: `Image set in field "${targetField.getName()}"` };
            } catch (setImageError) {
                console.warn('setImage method failed, will draw image on page instead:', setImageError.message);
                useSetImage = false; // Fall through to drawing on page
            }
        }
        
        // If setImage failed or doesn't exist, draw the image directly on the page
        if (!useSetImage) {
            console.log('Drawing image directly on page at field location...');
            
            // Use the formField99 we already found earlier
            if (!formField99) {
                throw new Error('Could not find field 99 in formFields array');
            }
            
            // Check if rect exists, if not try to get it from the targetField
            let rect = formField99.rect;
            
            if (!rect && targetField) {
                // Try to get rectangle from the PDF field directly
                try {
                    if (targetField.acroField && targetField.acroField.getRectangle) {
                        const rectArray = targetField.acroField.getRectangle();
                        if (rectArray && rectArray.length === 4) {
                            rect = rectArray;
                            console.log('Got rectangle from PDF field:', rect);
                        }
                    }
                } catch (e) {
                    console.warn('Could not get rectangle from PDF field:', e);
                }
            }
            
            if (!rect) {
                console.error('Field 99 rect not available. formField99:', formField99);
                throw new Error('Could not determine field position for drawing image. Field rect not available.');
            }
            
            // Get the page (use pageIndex from formField99 if available, otherwise default to first page)
            const pages = pdfDoc.getPages();
            const pageIndex = formField99.pageIndex || 0;
            const page = pages[pageIndex] || pages[0];
            const fieldX = rect[0];
            const fieldY = rect[1];
            const fieldWidth = rect[2] - rect[0];
            const fieldHeight = rect[3] - rect[1];
            
            console.log('Field 99 rectangle (PDF.js coordinates):', {
                x1: rect[0],
                y1: rect[1],
                x2: rect[2],
                y2: rect[3],
                width: fieldWidth,
                height: fieldHeight
            });
            
            // Calculate scaling to fit the field while maintaining aspect ratio
            const imageDims = pdfImage.scale(1);
            const imageWidth = imageDims.width;
            const imageHeight = imageDims.height;
            
            const scaleX = fieldWidth / imageWidth;
            const scaleY = fieldHeight / imageHeight;
            const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit within bounds
            
            const scaledWidth = imageWidth * scale;
            const scaledHeight = imageHeight * scale;
            
            // Center the image in the field
            const xOffset = (fieldWidth - scaledWidth) / 2;
            const yOffset = (fieldHeight - scaledHeight) / 2;
            
            // Coordinate system conversion:
            // PDF.js uses bottom-left origin (like PDF standard)
            // pdf-lib also uses bottom-left origin
            // rect[1] is bottom Y, rect[3] is top Y in PDF.js coordinates
            // Both use the same coordinate system, so we can use rect[1] directly for bottom
            const pageHeight = page.getHeight();
            
            // Use the bottom Y coordinate (rect[1]) and add the offset
            // The image should be drawn from its bottom-left corner
            const imageX = fieldX + xOffset;
            const imageY = rect[1] + yOffset; // rect[1] is bottom Y, add offset for centering
            
            console.log('Page and coordinate info:', {
                pageHeight: pageHeight,
                pdfJsBottomY: rect[1],
                pdfJsTopY: rect[3],
                calculatedImageY: imageY,
                imageX: imageX,
                scaledWidth: scaledWidth,
                scaledHeight: scaledHeight,
                yOffset: yOffset
            });
            
            console.log('Drawing image at:', {
                x: imageX,
                y: imageY,
                width: scaledWidth,
                height: scaledHeight
            });
            
            // Draw the image on the page
            page.drawImage(pdfImage, {
                x: fieldX + xOffset,
                y: imageY,
                width: scaledWidth,
                height: scaledHeight,
            });
            
            console.log(`✓ Image successfully drawn on page at field "${targetField.getName()}" location`);
            return { success: true, message: `Image drawn on page at field "${targetField.getName()}" location` };
        }
    } catch (error) {
        console.error('Error filling field 99 with airline logo:', error);
        throw error;
    }
}

// Submit form handler (toggles form data display)
function handleSubmit() {
    // Check if results are currently visible
    const isVisible = results && results.style.display === 'block';
    
    if (isVisible) {
        // Hide the results
        hideResults();
        if (submitBtn) {
            submitBtn.textContent = 'View Form Data';
        }
    } else {
        // Show the results
        if (generatedForm.checkValidity()) {
            const data = collectFormData();
            
            // Display results
            resultsContent.textContent = JSON.stringify(data, null, 2);
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
            
            // Update button text
            if (submitBtn) {
                submitBtn.textContent = 'Hide Form Data';
            }
        } else {
            generatedForm.reportValidity();
        }
    }
}

// Print Preview handler
async function handlePrintPreview() {
    console.log('Print Preview button clicked');
    
    if (!generatedForm) {
        showError('Error: Form not found. Please refresh the page.');
        return;
    }
    
    // Update validation indicators to ensure accurate missing field list
    updateTabValidationIndicators();
    
    // Check for missing fields
    const missingFields = getMissingFieldNames();
    if (missingFields.length > 0) {
        // Show custom modal and wait for user response
        const shouldContinue = await showMissingFieldsModal(missingFields);
        if (!shouldContinue) {
            return; // User cancelled
        }
    }
    
    if (!originalPdfBytes) {
        showError('Error: Original PDF not available. Please refresh the page.');
        return;
    }
    
    showLoading();
    
    try {
        console.log('Collecting form data for print preview...');
        const formData = collectFormData();
        console.log('Form data collected:', formData);
        
        // Fill and flatten the PDF for clean print preview
        console.log('Generating print preview PDF...');
        const filledPdfBytes = await fillPdfWithData(formData, true); // true = flatten for clean preview
        console.log('Print preview PDF generated');
        
        // Create blob and open in new window for print preview
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Open PDF in new window for print preview
        const printWindow = window.open(url, '_blank');
        
        if (printWindow) {
            // Wait for PDF to load, then trigger print dialog
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
            
            hideLoading();
            showError('✓ Print preview opened');
            setTimeout(() => hideError(), 2000);
        } else {
            // If popup blocked, create download link as fallback
            const a = document.createElement('a');
            a.href = url;
            a.download = 'print-preview.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            hideLoading();
            showError('✓ PDF downloaded (popup blocked - open and use browser print)');
            setTimeout(() => hideError(), 3000);
        }
        
        // Clean up URL after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10000);
        
    } catch (err) {
        console.error('Error generating print preview:', err);
        showError('Error generating print preview: ' + err.message + '. Check console for details.');
        hideLoading();
    }
}

// Utility functions
function showLoading() {
    if (loading) loading.style.display = 'block';
}

function hideLoading() {
    if (loading) loading.style.display = 'none';
}

function showError(message) {
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
}

function hideError() {
    if (error) error.style.display = 'none';
}


function showForm() {
    const contentWrapper = document.getElementById('contentWrapper');
    if (contentWrapper) {
        contentWrapper.style.display = 'flex';
    }
}

function hideForm() {
    const contentWrapper = document.getElementById('contentWrapper');
    if (contentWrapper) {
        contentWrapper.style.display = 'none';
    }
}


function hideResults() {
    if (results) results.style.display = 'none';
}

// ==================== Contact Management Functions ====================

// Get all contacts from localStorage
function getContacts() {
    try {
        const contactsJson = localStorage.getItem('awbContacts');
        return contactsJson ? JSON.parse(contactsJson) : [];
    } catch (error) {
        console.warn('Could not read contacts from localStorage:', error);
        return [];
    }
}

// Save contacts to localStorage
function saveContacts(contacts) {
    try {
        localStorage.setItem('awbContacts', JSON.stringify(contacts));
        updateContactDropdowns();
        return true;
    } catch (error) {
        console.warn('Could not save contacts to localStorage:', error);
        showError('Error saving contact. Storage may be full.');
        return false;
    }
}

// Get user profile from localStorage
function getUserProfile() {
    try {
        const profileJson = localStorage.getItem('awbUserProfile');
        return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
        console.warn('Could not read user profile from localStorage:', error);
        return null;
    }
}

// Save user profile to localStorage
function saveUserProfile(profile) {
    try {
        localStorage.setItem('awbUserProfile', JSON.stringify(profile));
        return true;
    } catch (error) {
        console.warn('Could not save user profile to localStorage:', error);
        showError('Error saving user profile. Storage may be full.');
        return false;
    }
}

// Update contact dropdowns
let isUpdatingDropdowns = false;
async function updateContactDropdowns() {
    if (!shipperSelect || !consigneeSelect) return;
    
    // Prevent multiple simultaneous calls
    if (isUpdatingDropdowns) {
        console.log('updateContactDropdowns already in progress, skipping...');
        return;
    }
    isUpdatingDropdowns = true;
    
    try {
        const contacts = getContacts();
    const currentShipperValue = shipperSelect.value;
    const currentConsigneeValue = consigneeSelect.value;
    const currentAirlineValue1 = airlineSelect1 ? airlineSelect1.value : null;
    
    // Clear and rebuild shipper dropdown
    shipperSelect.innerHTML = '<option value="">-- Select Shipper --</option>';
    contacts.filter(c => c.type === 'Shipper').forEach(contact => {
        const option = document.createElement('option');
        option.value = contact.id;
        option.textContent = contact.companyName;
        shipperSelect.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentShipperValue && currentShipperValue !== 'edit') {
        shipperSelect.value = currentShipperValue;
    }
    
    // Update button text based on selection
    updateContactButtonText('Shipper', addShipperBtn, shipperSelect);
    
    // Clear and rebuild consignee dropdown
    consigneeSelect.innerHTML = '<option value="">-- Select Consignee --</option>';
    contacts.filter(c => c.type === 'Consignee').forEach(contact => {
        const option = document.createElement('option');
        option.value = contact.id;
        option.textContent = contact.companyName;
        consigneeSelect.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentConsigneeValue && currentConsigneeValue !== 'edit') {
        consigneeSelect.value = currentConsigneeValue;
    }
    
    // Update button text based on selection
    updateContactButtonText('Consignee', addConsigneeBtn, consigneeSelect);
    
    // Helper function to populate airline dropdown
    const populateAirlineDropdown = async (select, btn, currentValue) => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Select Airline --</option>';
        
        // Only load from airlinesAPI (Locations > Airlines) - no contacts fallback
        let airlines = [];
        if (window.airlinesAPI) {
            try {
                airlines = await window.airlinesAPI.getAll();
                console.log('Loaded airlines from API:', airlines.length);
            } catch (error) {
                console.error('Could not load airlines from API:', error);
                // Don't fallback to contacts - airlines should only be in Locations
                airlines = [];
            }
        } else {
            console.warn('airlinesAPI not available - airlines can only be managed in Locations > Airlines');
            airlines = [];
        }
        
        // Deduplicate airlines by ID, company name, and display text to prevent duplicates
        const seenIds = new Set();
        const seenNames = new Set();
        const seenDisplayTexts = new Set();
        const uniqueAirlines = airlines.filter(airline => {
            // Check for duplicate ID
            if (seenIds.has(airline.id)) {
                console.warn('Duplicate airline ID found:', airline.id, airline.companyName);
                return false;
            }
            // Check for duplicate company name (case-insensitive)
            const nameKey = (airline.companyName || '').toLowerCase().trim();
            if (nameKey && seenNames.has(nameKey)) {
                console.warn('Duplicate airline name found:', airline.companyName, 'ID:', airline.id);
                return false;
            }
            // Check for duplicate display text (what will actually show in dropdown)
            const displayText = airline.airlineAbbreviation 
                ? `${airline.airlineAbbreviation} - ${airline.companyName}`
                : airline.companyName;
            const displayKey = displayText.toLowerCase().trim();
            if (displayKey && seenDisplayTexts.has(displayKey)) {
                console.warn('Duplicate airline display text found:', displayText, 'ID:', airline.id);
                return false;
            }
            seenIds.add(airline.id);
            if (nameKey) seenNames.add(nameKey);
            if (displayKey) seenDisplayTexts.add(displayKey);
            return true;
        });
        
        console.log(`Displaying ${uniqueAirlines.length} unique airlines (${airlines.length} total loaded)`);
        
        uniqueAirlines.forEach(airline => {
            const option = document.createElement('option');
            option.value = airline.id;
            // Format: "ABBREVIATION - Company Name" or just "Company Name" if no abbreviation
            const displayText = airline.airlineAbbreviation 
                ? `${airline.airlineAbbreviation} - ${airline.companyName}`
                : airline.companyName;
            option.textContent = displayText;
            select.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentValue && currentValue !== 'edit') {
            select.value = currentValue;
        }
        
        // Update button text based on selection
        if (btn) {
            updateContactButtonText('Airline', btn, select);
        }
    };
    
    // Populate airline dropdown (now async)
    await populateAirlineDropdown(airlineSelect1, addAirlineBtn1, currentAirlineValue1);
    
    // Populate destination dropdown
    if (destinationSelect) {
        const currentDestinationValue = destinationSelect.value;
        destinationSelect.innerHTML = '<option value="">-- Select Destination --</option>';
        
        // Only load from destinationsAPI - no localStorage fallback
        let destinations = [];
        if (window.destinationsAPI) {
            try {
                destinations = await window.destinationsAPI.getAll();
                console.log('Loaded destinations from API:', destinations.length);
            } catch (error) {
                console.error('Could not load destinations from API:', error);
                // Don't fallback to localStorage - destinations should only be in API
                destinations = [];
            }
        } else {
            console.warn('destinationsAPI not available - destinations can only be managed in Locations > Destinations');
            destinations = [];
        }
        
        // Deduplicate destinations by ID, airport code, and display text to prevent duplicates
        const seenIds = new Set();
        const seenCodes = new Set();
        const seenDisplayTexts = new Set();
        const uniqueDestinations = destinations.filter(destination => {
            // Check for duplicate ID
            if (seenIds.has(destination.id)) {
                console.warn('Duplicate destination ID found:', destination.id, destination.airportCode);
                return false;
            }
            // Check for duplicate airport code (case-insensitive)
            const codeKey = (destination.airportCode || '').toLowerCase().trim();
            if (codeKey && seenCodes.has(codeKey)) {
                console.warn('Duplicate airport code found:', destination.airportCode, 'ID:', destination.id);
                return false;
            }
            // Check for duplicate display text (what will actually show in dropdown)
            const displayText = destination.airportName 
                ? `${destination.airportCode} - ${destination.airportName}`
                : destination.airportCode;
            const displayKey = displayText.toLowerCase().trim();
            if (displayKey && seenDisplayTexts.has(displayKey)) {
                console.warn('Duplicate destination display text found:', displayText, 'ID:', destination.id);
                return false;
            }
            seenIds.add(destination.id);
            if (codeKey) seenCodes.add(codeKey);
            if (displayKey) seenDisplayTexts.add(displayKey);
            return true;
        });
        
        console.log(`Displaying ${uniqueDestinations.length} unique destinations (${destinations.length} total loaded)`);
        
        uniqueDestinations.forEach(destination => {
            const option = document.createElement('option');
            option.value = destination.id;
            // Display as "Airport Code - Airport Name" or just "Airport Code" if no name
            const displayText = destination.airportName 
                ? `${destination.airportCode} - ${destination.airportName}`
                : destination.airportCode;
            option.textContent = displayText;
            destinationSelect.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentDestinationValue && currentDestinationValue !== 'edit') {
            destinationSelect.value = currentDestinationValue;
        }
        
        // Update button text based on selection
        if (addDestinationBtn) {
            updateContactButtonText('Destination', addDestinationBtn, destinationSelect);
        }
    }
    
    // Populate interline carrier dropdown (now async)
    const currentInterlineCarrierValue1 = interlineCarrierSelect1 ? interlineCarrierSelect1.value : null;
    await populateAirlineDropdown(interlineCarrierSelect1, null, currentInterlineCarrierValue1);
    } finally {
        isUpdatingDropdowns = false;
    }
}

// Update contact button text (Add vs Edit)
function updateContactButtonText(type, button, select) {
    if (!button || !select) return;
    
    const selectedId = select.value;
    if (selectedId && selectedId !== '' && selectedId !== 'edit') {
        button.textContent = 'Edit';
    } else {
        button.textContent = '+ Add';
    }
}

// Open contact modal for adding/editing
function openContactModal(type, contactIdToEdit) {
    if (!contactModal || !contactForm) return;
    
    // Prevent airlines from being managed through contact modal - redirect to airlines.html
    if (type === 'Airline') {
        if (window.parent && window.parent !== window) {
            // In iframe - tell parent to navigate
            window.parent.location.href = 'airlines.html';
        } else {
            // Not in iframe - direct navigation
            window.location.href = 'airlines.html';
        }
        return;
    }
    
    contactType.value = type;
    contactId.value = contactIdToEdit || '';
    
    // Show/hide fields based on contact type
    const isAirline = type === 'Airline';
    const isUser = type === 'User';
    const isUserAccount = type === 'UserAccount';
    const isConsignee = type === 'Consignee';
    
    // Check if current user is an agent (issuing-carrier-agent or admin)
    let isAgent = false;
    try {
        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            isAgent = user && (user.role === 'issuing-carrier-agent' || user.role === 'admin');
        }
    } catch (error) {
        console.warn('Error getting current user for agent check:', error);
    }
    
    // Hide formatted value field for airlines
    if (formattedValueGroup) {
        formattedValueGroup.style.display = isAirline ? 'none' : 'block';
    }
    
    // Update formatted value label based on contact type
    if (formattedValueLabel) {
        if (isConsignee) {
            formattedValueLabel.textContent = '05. CNA *';
        } else {
            formattedValueLabel.textContent = 'Formatted Field Value *';
        }
    }
    
    // Show/hide AWBP field for airlines
    if (awbpInfoGroup) {
        awbpInfoGroup.style.display = isAirline ? 'block' : 'none';
    }
    
    // Show/hide Airline Abbreviation field for airlines
    if (airlineAbbreviationGroup) {
        airlineAbbreviationGroup.style.display = isAirline ? 'block' : 'none';
    }
    
    // Show/hide Airline Image field for airlines
    const airlineImageGroup = document.getElementById('airlineImageGroup');
    if (airlineImageGroup) {
        airlineImageGroup.style.display = isAirline ? 'block' : 'none';
    }
    
    // Make fields optional for airlines (only company name required)
    if (isAirline) {
        if (contactName) contactName.required = false;
        if (contactEmail) contactEmail.required = false;
        if (contactPhone) contactPhone.required = false;
        if (contactAddress) contactAddress.required = false;
        if (contactFormattedValue) contactFormattedValue.required = false;
        
        // Update labels to remove asterisks
        if (contactNameLabel) contactNameLabel.textContent = 'Contact Name';
        if (contactEmailLabel) contactEmailLabel.textContent = 'Email';
        if (contactPhoneLabel) contactPhoneLabel.textContent = 'Phone Number';
        if (contactAddressLabel) contactAddressLabel.textContent = 'Address';
    } else {
        // Make fields required for other types
        if (contactName) contactName.required = true;
        if (contactEmail) contactEmail.required = true;
        if (contactPhone) contactPhone.required = true;
        if (contactAddress) contactAddress.required = true;
        if (contactFormattedValue) contactFormattedValue.required = true;
        
        // Update labels to add asterisks
        if (contactNameLabel) contactNameLabel.textContent = 'Contact Name *';
        if (contactEmailLabel) contactEmailLabel.textContent = 'Email *';
        if (contactPhoneLabel) contactPhoneLabel.textContent = 'Phone Number *';
        if (contactAddressLabel) contactAddressLabel.textContent = 'Address *';
    }
    
    // Show/hide origin, AoDEP, Handling Info, Field 06 and account info fields based on contact type
    if (originInfoGroup) {
        originInfoGroup.style.display = isUser ? 'block' : 'none';
    }
    if (aoDEPInfoGroup) {
        aoDEPInfoGroup.style.display = isUser ? 'block' : 'none';
    }
    if (handlingInfoGroup) {
        handlingInfoGroup.style.display = isUser ? 'block' : 'none';
    }
    if (contactField06Group) {
        contactField06Group.style.display = isUser ? 'block' : 'none';
    }
    
    // Show signature fields for User, UserAccount, or when current user is an agent
    const showSignatureFields = isUser || isUserAccount || isAgent;
    const contactSignatureIssuingCarrierGroup = document.getElementById('contactSignatureIssuingCarrierGroup');
    const contactSignatureShipperGroup = document.getElementById('contactSignatureShipperGroup');
    const contactSignaturePlaceGroup = document.getElementById('contactSignaturePlaceGroup');
    if (contactSignatureIssuingCarrierGroup) {
        contactSignatureIssuingCarrierGroup.style.display = showSignatureFields ? 'block' : 'none';
    }
    if (contactSignatureShipperGroup) {
        contactSignatureShipperGroup.style.display = showSignatureFields ? 'block' : 'none';
    }
    if (contactSignaturePlaceGroup) {
        contactSignaturePlaceGroup.style.display = showSignatureFields ? 'block' : 'none';
    }
    if (accountInfoGroup) {
        accountInfoGroup.style.display = isConsignee ? 'block' : 'none';
    }
    
    if (contactIdToEdit) {
        // Editing existing contact
        const contacts = getContacts();
        const contact = contacts.find(c => c.id === contactIdToEdit);
        if (contact) {
            modalTitle.textContent = `Edit ${type}`;
            contactCompanyName.value = contact.companyName || '';
            contactName.value = contact.contactName || '';
            contactEmail.value = contact.email || '';
            contactPhone.value = contact.phone || '';
            contactAddress.value = contact.address || '';
            contactFormattedValue.value = contact.formattedValue || '';
            if (contactAccountInfo) {
                contactAccountInfo.value = contact.accountInfo || '';
            }
            if (contactAWBP) {
                contactAWBP.value = contact.awbp || '';
            }
            if (contactAirlineAbbreviation) {
                contactAirlineAbbreviation.value = contact.airlineAbbreviation || '';
            }
            // Load airline image if it exists
            const airlineImageInput = document.getElementById('contactAirlineImage');
            const airlineImagePreview = document.getElementById('airlineImagePreview');
            const airlineImagePreviewImg = document.getElementById('airlineImagePreviewImg');
            if (contact.image && airlineImagePreview && airlineImagePreviewImg) {
                airlineImagePreviewImg.src = contact.image;
                airlineImagePreview.style.display = 'block';
            } else if (airlineImagePreview) {
                airlineImagePreview.style.display = 'none';
            }
            if (airlineImageInput) {
                airlineImageInput.value = ''; // Clear file input
            }
        }
    } else {
        // Adding new contact
        modalTitle.textContent = `Add ${type}`;
        contactForm.reset();
        contactId.value = '';
        contactType.value = type;
        if (contactAccountInfo) {
            contactAccountInfo.value = '';
        }
        if (contactAWBP) {
            contactAWBP.value = '';
        }
        if (contactAirlineAbbreviation) {
            contactAirlineAbbreviation.value = '';
        }
        if (contactAoDEP) {
            contactAoDEP.value = '';
        }
        if (contactHandlingInfo) {
            contactHandlingInfo.value = '';
        }
    }
    
    contactModal.style.display = 'flex';
}

// Open user profile modal
function openUserProfileModal() {
    if (!contactModal || !contactForm) return;
    
    const profile = getUserProfile();
    
    contactType.value = 'User';
    contactId.value = 'user';
    modalTitle.textContent = 'Edit My Information';
    
    // Show origin, AoDEP, Handling Info, and Field 06 fields and hide account info for user profile
    if (originInfoGroup) {
        originInfoGroup.style.display = 'block';
    }
    if (aoDEPInfoGroup) {
        aoDEPInfoGroup.style.display = 'block';
    }
    if (handlingInfoGroup) {
        handlingInfoGroup.style.display = 'block';
    }
    if (contactField06Group) {
        contactField06Group.style.display = 'block';
    }
    if (contactNameGroup) {
        contactNameGroup.style.display = 'block';
    }
    const contactPhoneGroup = document.getElementById('contactPhoneGroup');
    const contactAddressGroup = document.getElementById('contactAddressGroup');
    if (contactPhoneGroup) {
        contactPhoneGroup.style.display = 'block';
    }
    if (contactAddressGroup) {
        contactAddressGroup.style.display = 'block';
    }
    const contactSignatureIssuingCarrierGroup = document.getElementById('contactSignatureIssuingCarrierGroup');
    const contactSignatureShipperGroup = document.getElementById('contactSignatureShipperGroup');
    const contactSignaturePlaceGroup = document.getElementById('contactSignaturePlaceGroup');
    if (contactSignatureIssuingCarrierGroup) {
        contactSignatureIssuingCarrierGroup.style.display = 'block';
    }
    if (contactSignatureShipperGroup) {
        contactSignatureShipperGroup.style.display = 'block';
    }
    if (contactSignaturePlaceGroup) {
        contactSignaturePlaceGroup.style.display = 'block';
    }
    if (accountInfoGroup) {
        accountInfoGroup.style.display = 'none';
    }
    
    if (profile) {
        contactCompanyName.value = profile.companyName || '';
        contactName.value = profile.contactName || '';
        contactEmail.value = profile.email || '';
        contactPhone.value = profile.phone || '';
        contactAddress.value = profile.address || '';
        contactFormattedValue.value = profile.formattedValue || '';
        if (contactOrigin) {
            contactOrigin.value = profile.origin || '';
        }
        if (contactAoDEP) {
            contactAoDEP.value = profile.aoDEP || '';
        }
        if (contactHandlingInfo) {
            contactHandlingInfo.value = profile.handlingInfo || '';
        }
        if (contactField06) {
            contactField06.value = profile.field06 || profile.formattedValue || '';
        }
        const contactSignatureIssuingCarrier = document.getElementById('contactSignatureIssuingCarrier');
        if (contactSignatureIssuingCarrier) {
            contactSignatureIssuingCarrier.value = profile.signatureIssuingCarrier || '';
        }
        const contactSignatureShipper = document.getElementById('contactSignatureShipper');
        if (contactSignatureShipper) {
            contactSignatureShipper.value = profile.signatureShipper || '';
        }
        const contactSignaturePlace = document.getElementById('contactSignaturePlace');
        if (contactSignaturePlace) {
            contactSignaturePlace.value = profile.signaturePlace || '';
        }
    } else {
        contactForm.reset();
        contactId.value = 'user';
    }
    
    contactModal.style.display = 'flex';
}

// Close contact modal
function closeContactModalHandler() {
    
    if (contactModal) {
        contactModal.style.display = 'none';
        contactForm.reset();
        if (accountInfoGroup) {
            accountInfoGroup.style.display = 'none';
        }
        if (originInfoGroup) {
            originInfoGroup.style.display = 'none';
        }
        if (aoDEPInfoGroup) {
            aoDEPInfoGroup.style.display = 'none';
        }
        if (handlingInfoGroup) {
            handlingInfoGroup.style.display = 'none';
        }
        if (contactField06Group) {
            contactField06Group.style.display = 'none';
        }
        if (awbpInfoGroup) {
            awbpInfoGroup.style.display = 'none';
        }
        if (airlineAbbreviationGroup) {
            airlineAbbreviationGroup.style.display = 'none';
        }
        const airlineImagePreview = document.getElementById('airlineImagePreview');
        if (airlineImagePreview) {
            airlineImagePreview.style.display = 'none';
        }
    }
}

// Handle save contact
function handleSaveContact(e) {
    e.preventDefault();
    
    const type = contactType.value;
    const id = contactId.value || Date.now().toString();
    const companyName = contactCompanyName.value.trim();
    const contactNameValue = contactName ? contactName.value.trim() : '';
    const email = contactEmail ? contactEmail.value.trim() : '';
    const phone = contactPhone ? contactPhone.value.trim() : '';
    const address = contactAddress ? contactAddress.value.trim() : '';
    const formattedValue = contactFormattedValue ? contactFormattedValue.value.trim() : '';
    
    // Validation based on contact type
    const isAirline = type === 'Airline';
    
    if (!companyName) {
        showError('Company Name is required.');
        return;
    }
    
    if (!isAirline) {
        // For non-airlines, require all fields
        if (!contactNameValue || !email || !phone || !address || !formattedValue) {
            showError('Please fill in all required fields.');
            return;
        }
    }
    
    const accountInfo = contactAccountInfo ? contactAccountInfo.value.trim() : '';
    const awbp = contactAWBP ? contactAWBP.value.trim() : '';
    const airlineAbbreviation = contactAirlineAbbreviation ? contactAirlineAbbreviation.value.trim() : '';
    
    if (type === 'User') {
        // Save user profile
        const origin = contactOrigin ? contactOrigin.value.trim() : '';
        const aoDEP = contactAoDEP ? contactAoDEP.value.trim() : '';
        const handlingInfo = contactHandlingInfo ? contactHandlingInfo.value.trim() : '';
        const contactField06 = document.getElementById('contactField06');
        const field06 = contactField06 ? contactField06.value.trim() : '';
        const contactSignatureIssuingCarrier = document.getElementById('contactSignatureIssuingCarrier');
        const signatureIssuingCarrier = contactSignatureIssuingCarrier ? contactSignatureIssuingCarrier.value.trim() : '';
        const contactSignatureShipper = document.getElementById('contactSignatureShipper');
        const signatureShipper = contactSignatureShipper ? contactSignatureShipper.value.trim() : '';
        const contactSignaturePlace = document.getElementById('contactSignaturePlace');
        const signaturePlace = contactSignaturePlace ? contactSignaturePlace.value.trim() : '';
        const profile = {
            companyName,
            contactName: contactNameValue,
            email,
            phone,
            address,
            formattedValue,
            field06: field06,
            origin,
            aoDEP,
            handlingInfo,
            signatureIssuingCarrier: signatureIssuingCarrier,
            signatureShipper: signatureShipper,
            signaturePlace: signaturePlace
        };
        
        if (saveUserProfile(profile)) {
            closeContactModalHandler();
            showError('✓ User profile saved successfully!');
            setTimeout(() => hideError(), 2000);
            
            // Auto-fill field 06, 02, and 08 if form is loaded
            fillContactField('06', 'user');
            if (origin) {
                fillContactField('02', 'user');
            }
            if (aoDEP) {
                fillContactField('08', 'user');
            }
        }
    } else {
        // Save contact
        const contacts = getContacts();
        const contactIndex = contacts.findIndex(c => c.id === id);
        
        const contact = {
            id,
            type,
            companyName
        };
        
        // Add optional fields (not required for airlines)
        if (contactNameValue) contact.contactName = contactNameValue;
        if (email) contact.email = email;
        if (phone) contact.phone = phone;
        if (address) contact.address = address;
        if (formattedValue) contact.formattedValue = formattedValue;
        
        // Add AWBP, Airline Abbreviation, and Image for Airline contacts
        if (type === 'Airline') {
            if (awbp) {
                contact.awbp = awbp;
            }
            if (airlineAbbreviation) {
                contact.airlineAbbreviation = airlineAbbreviation;
            }
            // Handle image upload
            const airlineImageInput = document.getElementById('contactAirlineImage');
            const airlineImagePreviewImg = document.getElementById('airlineImagePreviewImg');
            if (airlineImageInput && airlineImageInput.files && airlineImageInput.files[0]) {
                // New image uploaded
                const file = airlineImageInput.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    contact.image = e.target.result; // Store as base64
                    saveContactWithImage(contact, contactIndex, contacts);
                };
                reader.readAsDataURL(file);
                return; // Exit early, save will happen in reader.onload
            } else if (airlineImagePreviewImg && airlineImagePreviewImg.src && airlineImagePreviewImg.src.startsWith('data:')) {
                // Existing image (not removed)
                contact.image = airlineImagePreviewImg.src;
            }
            // If image was removed (preview hidden), don't include image property
        }
        
        // Add account info for Consignee contacts
        if (type === 'Consignee') {
            if (accountInfo) {
                contact.accountInfo = accountInfo;
            }
        }
        
        // Save contact (if image wasn't uploaded, this will be called directly)
        if (type !== 'Airline' || !document.getElementById('contactAirlineImage')?.files?.[0]) {
            if (contactIndex >= 0) {
                // Update existing contact
                contacts[contactIndex] = contact;
            } else {
                // Add new contact
                contacts.push(contact);
            }
            
            if (saveContacts(contacts)) {
                closeContactModalHandler();
                showError(`✓ ${type} contact saved successfully!`);
                setTimeout(() => hideError(), 2000);
            }
        }
    }
}

// Save contact with image (called after image is loaded)
function saveContactWithImage(contact, contactIndex, contacts) {
    if (contactIndex >= 0) {
        contacts[contactIndex] = contact;
    } else {
        contacts.push(contact);
    }
    
    if (saveContacts(contacts)) {
        closeContactModalHandler();
        showError(`✓ ${contact.type} contact saved successfully!`);
        setTimeout(() => hideError(), 2000);
    }
}

// Fill airline fields (01. AWBP and 10. BFC/Airline Abbreviation)
async function fillAirlineField(airlineId) {
    console.log('fillAirlineField called with airlineId:', airlineId);
    
    if (!generatedForm) {
        console.warn('fillAirlineField: generatedForm not found');
        return;
    }
    
    // Only get airline from airlinesAPI (Locations > Airlines) - no contacts fallback
    let airline = null;
    if (window.airlinesAPI) {
        try {
            const airlines = await window.airlinesAPI.getAll();
            airline = airlines.find(a => a.id === airlineId);
            if (airline) {
                console.log('Found airline from API:', airline.companyName);
            }
        } catch (error) {
            console.error('Could not load airlines from API:', error);
        }
    }
    
    // Don't fallback to contacts - airlines should only be in Locations > Airlines
    
    if (!airline) {
        console.warn(`Airline not found for ${airlineId}`);
        console.log('Available contacts:', contacts.map(c => ({ id: c.id, type: c.type, companyName: c.companyName })));
        return;
    }
    
    console.log('Found airline:', { id: airline.id, companyName: airline.companyName, awbp: airline.awbp, airlineAbbreviation: airline.airlineAbbreviation });
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    let field01Filled = false;
    let field10Filled = false;
    
    // Fill field 01 (AWBP) - search in all forms and all elements
    if (airline.awbp) {
        console.log('Attempting to fill field 01 with AWBP:', airline.awbp);
        for (const form of formsToCheck) {
            if (!form) continue;
            
            // Try form.elements first
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('01')) {
                    element.value = airline.awbp;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`✓ Filled field ${element.name} with AWBP: ${airline.awbp}`);
                    field01Filled = true;
                    break;
                }
            }
            
            // Also try querySelector as fallback
            if (!field01Filled) {
                const field01Elements = form.querySelectorAll('input[name^="01"], textarea[name^="01"], select[name^="01"]');
                field01Elements.forEach(element => {
                    if (element.name && element.name.startsWith('01')) {
                        element.value = airline.awbp;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`✓ Filled field ${element.name} with AWBP (via querySelector): ${airline.awbp}`);
                        field01Filled = true;
                    }
                });
            }
            
            if (field01Filled) break;
        }
        if (!field01Filled) {
            console.warn('Field 01 (AWBP) not found in any form. Searched forms:', formsToCheck.map(f => f ? f.id : 'null'));
            // Try searching in the entire document as last resort
            const allField01 = document.querySelectorAll('input[name^="01"], textarea[name^="01"], select[name^="01"]');
            if (allField01.length > 0) {
                console.log('Found field 01 elements in document:', allField01.length);
                allField01.forEach(element => {
                    if (element.name && element.name.startsWith('01')) {
                        element.value = airline.awbp;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`✓ Filled field ${element.name} with AWBP (document search): ${airline.awbp}`);
                        field01Filled = true;
                    }
                });
            }
        }
    } else {
        console.warn('Airline has no AWBP value');
    }
    
    // Fill field 10 with Airline Abbreviation - search in all forms and all elements
    if (airline.airlineAbbreviation) {
        console.log('Attempting to fill field 10 with abbreviation:', airline.airlineAbbreviation);
        for (const form of formsToCheck) {
            if (!form) continue;
            
            // Try form.elements first
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('10')) {
                    element.value = airline.airlineAbbreviation;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`✓ Filled field ${element.name} with Airline Abbreviation: ${airline.airlineAbbreviation}`);
                    field10Filled = true;
                    break;
                }
            }
            
            // Also try querySelector as fallback
            if (!field10Filled) {
                const field10Elements = form.querySelectorAll('input[name^="10"], textarea[name^="10"], select[name^="10"]');
                field10Elements.forEach(element => {
                    if (element.name && element.name.startsWith('10')) {
                        element.value = airline.airlineAbbreviation;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`✓ Filled field ${element.name} with Airline Abbreviation (via querySelector): ${airline.airlineAbbreviation}`);
                        field10Filled = true;
                    }
                });
            }
            
            if (field10Filled) break;
        }
        if (!field10Filled) {
            console.warn('Field 10 (Airline Abbreviation) not found in any form. Searched forms:', formsToCheck.map(f => f ? f.id : 'null'));
            // Try searching in the entire document as last resort
            const allField10 = document.querySelectorAll('input[name^="10"], textarea[name^="10"], select[name^="10"]');
            if (allField10.length > 0) {
                console.log('Found field 10 elements in document:', allField10.length);
                allField10.forEach(element => {
                    if (element.name && element.name.startsWith('10')) {
                        element.value = airline.airlineAbbreviation;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`✓ Filled field ${element.name} with Airline Abbreviation (document search): ${airline.airlineAbbreviation}`);
                        field10Filled = true;
                    }
                });
            }
        }
    } else {
        console.warn('Airline has no airlineAbbreviation value');
    }
    
    // Fill field 98 with Airline Address - search in all forms and all elements
    let field98Filled = false;
    if (airline.address) {
        console.log('Attempting to fill field 98 with airline address:', airline.address);
        for (const form of formsToCheck) {
            if (!form) continue;
            
            // Try form.elements first
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('98')) {
                    element.value = airline.address;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`✓ Filled field ${element.name} with Airline Address: ${airline.address}`);
                    field98Filled = true;
                    break;
                }
            }
            
            // Also try querySelector as fallback
            if (!field98Filled) {
                const field98Elements = form.querySelectorAll('input[name^="98"], textarea[name^="98"], select[name^="98"]');
                field98Elements.forEach(element => {
                    if (element.name && element.name.startsWith('98')) {
                        element.value = airline.address;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`✓ Filled field ${element.name} with Airline Address (via querySelector): ${airline.address}`);
                        field98Filled = true;
                    }
                });
            }
            
            if (field98Filled) break;
        }
        if (!field98Filled) {
            console.warn('Field 98 (Airline Address) not found in any form. Searched forms:', formsToCheck.map(f => f ? f.id : 'null'));
            // Try searching in the entire document as last resort
            const allField98 = document.querySelectorAll('input[name^="98"], textarea[name^="98"], select[name^="98"]');
            if (allField98.length > 0) {
                console.log('Found field 98 elements in document:', allField98.length);
                allField98.forEach(element => {
                    if (element.name && element.name.startsWith('98')) {
                        element.value = airline.address;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`✓ Filled field ${element.name} with Airline Address (document search): ${airline.address}`);
                        field98Filled = true;
                    }
                });
            }
        }
    } else {
        console.warn('Airline has no address value');
    }
    
    // Store airline image for PDF filling into field 99
    if (airline.image) {
        currentAirlineImage = airline.image;
        console.log('Airline image stored for PDF filling into field 99');
        
        // Display the image in field 99 on the form
        displayAirlineLogoInField99(airline.image);
    } else {
        currentAirlineImage = null;
        // Clear image display if no image
        displayAirlineLogoInField99(null);
    }
    
    setTimeout(() => {
        updateTabValidationIndicators();
        updatePromptIndicators();
    }, 100);
}

// Display airline logo in field 99 on the form
function displayAirlineLogoInField99(imageDataUrl) {
    if (!generatedForm) return;
    
    // Find field 99 in the form - try multiple ways
    let field99 = generatedForm.querySelector('input[name*="99"], input[id*="99"], textarea[name*="99"], textarea[id*="99"]');
    
    if (!field99) {
        // Try to find by searching all inputs and their labels
        const allInputs = generatedForm.querySelectorAll('input, textarea');
        for (let input of allInputs) {
            const label = generatedForm.querySelector(`label[for="${input.id}"]`);
            const searchText = (label ? label.textContent : '') + ' ' + input.name + ' ' + input.id;
            if (input.name.startsWith('99') || 
                input.id.startsWith('99') ||
                searchText.toLowerCase().includes('99') ||
                searchText.toLowerCase().includes('airlinelogo')) {
                field99 = input;
                break;
            }
        }
    }
    
    if (!field99) {
        console.log('Field 99 not found in form - image will still be placed in PDF');
        return;
    }
    
    updateField99WithImage(field99, imageDataUrl);
}

// Update field 99 to display an image
function updateField99WithImage(inputElement, imageDataUrl) {
    if (!inputElement) return;
    
    // Find the form group container
    let formGroup = inputElement.closest('.form-group');
    if (!formGroup) {
        formGroup = inputElement.parentElement;
    }
    
    if (!formGroup) return;
    
    // Remove existing image display if any
    const existingImageDisplay = formGroup.querySelector('.airline-logo-display-99');
    if (existingImageDisplay) {
        existingImageDisplay.remove();
    }
    
    // Hide the input field
    inputElement.style.display = 'none';
    
    if (imageDataUrl) {
        // Create image display container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'airline-logo-display-99';
        imageContainer.style.cssText = `
            margin-top: 5px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            text-align: center;
        `;
        
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.alt = 'Airline Logo';
        img.style.cssText = `
            max-width: 200px;
            max-height: 100px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        `;
        
        const label = document.createElement('div');
        label.textContent = 'Airline Logo (will be placed in PDF)';
        label.style.cssText = `
            margin-top: 5px;
            font-size: 11px;
            color: #666;
            font-style: italic;
        `;
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(label);
        
        // Insert after the input
        inputElement.parentNode.insertBefore(imageContainer, inputElement.nextSibling);
        
        // Mark field 99 as complete
        inputElement.setAttribute('data-logo-complete', 'true');
        
        // Add green checkmark to the field label
        const fieldLabel = formGroup.querySelector('label');
        if (fieldLabel) {
            // Remove any existing checkmarks
            const existingCheckmarks = fieldLabel.querySelectorAll('span[style*="color: #28a745"]');
            existingCheckmarks.forEach(span => span.remove());
            fieldLabel.textContent = fieldLabel.textContent.replace(' ✓', '');
            
            // Add green checkmark
            const checkmark = document.createElement('span');
            checkmark.textContent = ' ✓';
            checkmark.style.color = '#28a745';
            checkmark.style.fontWeight = 'bold';
            fieldLabel.appendChild(checkmark);
        }
        
        // Update validation indicators
        setTimeout(() => updateTabValidationIndicators(), 50);
        
        console.log('Airline logo displayed in field 99 - marked as complete');
    } else {
        // Show the input field again if no image
        inputElement.style.display = '';
        
        // Remove complete marker if image is removed
        inputElement.removeAttribute('data-logo-complete');
        
        // Remove checkmark from label
        const fieldLabel = formGroup.querySelector('label');
        if (fieldLabel) {
            const existingCheckmarks = fieldLabel.querySelectorAll('span[style*="color: #28a745"]');
            existingCheckmarks.forEach(span => span.remove());
            fieldLabel.textContent = fieldLabel.textContent.replace(' ✓', '');
        }
        
        // Update validation indicators
        setTimeout(() => updateTabValidationIndicators(), 50);
    }
}

// Save form data to localStorage
function saveFormDataToStorage() {
    if (!generatedForm) return;
    
    try {
        const formData = collectFormData();
        
        // Also save dropdown selections
        const dropdownData = {
            shipperContactId: shipperSelect ? shipperSelect.value : '',
            consigneeContactId: consigneeSelect ? consigneeSelect.value : '',
            airlineId: airlineSelect1 ? airlineSelect1.value : '',
            destination: destinationSelect ? destinationSelect.value : '',
            directFlight: directFlightSelect ? directFlightSelect.value : '',
            interlineCarrier1: interlineCarrierSelect1 ? interlineCarrierSelect1.value : '',
            interlineCarrier2: interlineCarrierSelect2 ? interlineCarrierSelect2.value : ''
        };
        
        const dataToSave = {
            formData: formData,
            dropdownData: dropdownData,
            timestamp: Date.now()
        };
        
        localStorage.setItem('awbFormData', JSON.stringify(dataToSave));
        console.log('Form data saved to localStorage');
    } catch (error) {
        console.warn('Could not save form data to localStorage:', error);
    }
}

// Restore form data from localStorage
function restoreFormData() {
    if (!generatedForm) return;
    
    try {
        const savedDataJson = localStorage.getItem('awbFormData');
        if (!savedDataJson) {
            console.log('No saved form data found');
            return;
        }
        
        const savedData = JSON.parse(savedDataJson);
        const formData = savedData.formData || {};
        const dropdownData = savedData.dropdownData || {};
        
        console.log('Restoring form data from localStorage');
        
        // Restore form fields
        const formElements = generatedForm.elements;
        const contactFieldsForm = document.getElementById('contactFieldsForm');
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const contactFormElements = contactFieldsForm ? contactFieldsForm.elements : [];
        const billingFormElements = billingFieldsForm ? billingFieldsForm.elements : [];
        
        const allFormElements = [...formElements, ...contactFormElements, ...billingFormElements];
        
        allFormElements.forEach(element => {
            const name = element.name;
            if (!name || !formData.hasOwnProperty(name)) return;
            
            const value = formData[name];
            
            if (element.type === 'checkbox') {
                element.checked = value === true || value === 'true';
            } else if (element.type === 'radio') {
                if (element.value === value) {
                    element.checked = true;
                }
            } else if (element.type === 'select-one' || element.type === 'select-multiple') {
                element.value = value || '';
            } else {
                element.value = value || '';
            }
            
            // Trigger input event to update any dependent fields
            element.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        // Restore dropdown selections
        if (dropdownData.shipperContactId && shipperSelect) {
            shipperSelect.value = dropdownData.shipperContactId;
            shipperSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (dropdownData.consigneeContactId && consigneeSelect) {
            consigneeSelect.value = dropdownData.consigneeContactId;
            consigneeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (dropdownData.airlineId && airlineSelect1) {
            airlineSelect1.value = dropdownData.airlineId;
            airlineSelect1.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (dropdownData.destination && destinationSelect) {
            destinationSelect.value = dropdownData.destination;
            destinationSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (dropdownData.directFlight && directFlightSelect) {
            directFlightSelect.value = dropdownData.directFlight;
            directFlightSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (dropdownData.interlineCarrier1 && interlineCarrierSelect1) {
            interlineCarrierSelect1.value = dropdownData.interlineCarrier1;
            interlineCarrierSelect1.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (dropdownData.interlineCarrier2 && interlineCarrierSelect2) {
            interlineCarrierSelect2.value = dropdownData.interlineCarrier2;
            interlineCarrierSelect2.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Restore billing dropdowns
        const declaredValuesSelect = document.getElementById('declaredValuesSelect');
        const insuranceSelect = document.getElementById('insuranceSelect');
        const prepaidCollectSelect = document.getElementById('prepaidCollectSelect');
        if (dropdownData.declaredValues && declaredValuesSelect) {
            declaredValuesSelect.value = dropdownData.declaredValues;
            declaredValuesSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (dropdownData.insurance && insuranceSelect) {
            insuranceSelect.value = dropdownData.insurance;
            insuranceSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (dropdownData.prepaidCollect && prepaidCollectSelect) {
            prepaidCollectSelect.value = dropdownData.prepaidCollect;
            prepaidCollectSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Restore Dangerous Goods dropdown
        const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
        if (dropdownData.dangerousGoods && dangerousGoodsSelect) {
            dangerousGoodsSelect.value = dropdownData.dangerousGoods;
            dangerousGoodsSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Restore dimensions data (including QTY)
        if (dropdownData.dimensions && Array.isArray(dropdownData.dimensions)) {
            const dimensionsContainer = document.getElementById('dimensionsContainer');
            if (dimensionsContainer) {
                const dimensionsData = dropdownData.dimensions;
                const existingRows = dimensionsContainer.querySelectorAll('.dimensions-row');
                
                // Clear existing rows except the first one
                for (let i = existingRows.length - 1; i > 0; i--) {
                    existingRows[i].remove();
                }
                
                // Restore dimensions to rows
                dimensionsData.forEach((dimData, index) => {
                    let row;
                    if (index === 0) {
                        // Use first row
                        row = dimensionsContainer.querySelector('.dimensions-row');
                    } else {
                        // Create new row for additional dimensions
                        if (dimensionsContainer.querySelectorAll('.dimensions-row').length < 6) {
                            if (typeof addDimensionsRow === 'function') {
                                addDimensionsRow();
                                row = dimensionsContainer.querySelectorAll('.dimensions-row')[index];
                            } else {
                                return; // Function not available
                            }
                        } else {
                            return; // Max 6 rows
                        }
                    }
                    
                    if (row) {
                        const lengthInput = row.querySelector('.dim-length');
                        const widthInput = row.querySelector('.dim-width');
                        const heightInput = row.querySelector('.dim-height');
                        const qtyInput = row.querySelector('.dim-qty');
                        
                        if (lengthInput && dimData.length) lengthInput.value = dimData.length;
                        if (widthInput && dimData.width) widthInput.value = dimData.width;
                        if (heightInput && dimData.height) heightInput.value = dimData.height;
                        if (qtyInput && dimData.qty) qtyInput.value = dimData.qty;
                        
                        // Trigger update events
                        if (lengthInput) lengthInput.dispatchEvent(new Event('input', { bubbles: true }));
                        if (widthInput) widthInput.dispatchEvent(new Event('input', { bubbles: true }));
                        if (heightInput) heightInput.dispatchEvent(new Event('input', { bubbles: true }));
                        if (qtyInput) qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
                
                // Update button states
                if (typeof updateDimensionsAddButton === 'function') {
                    updateDimensionsAddButton();
                }
            }
        }
        
        // Update validation indicators
        setTimeout(() => {
            updateTabValidationIndicators();
        }, 100);
        
        console.log('Form data restored from localStorage');
    } catch (error) {
        console.warn('Could not restore form data from localStorage:', error);
    }
}

// Setup auto-save for form data
function setupFormDataAutoSave() {
    // Use debouncing to avoid saving too frequently
    let saveTimeout = null;
    
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveFormDataToStorage();
        }, 500); // Save 500ms after last change
    }
    
    // Listen for changes on all forms
    document.addEventListener('input', (e) => {
        if (generatedForm && (generatedForm.contains(e.target) || 
            document.getElementById('contactFieldsForm')?.contains(e.target) ||
            document.getElementById('billingFieldsForm')?.contains(e.target))) {
            debouncedSave();
        }
    });
    
    document.addEventListener('change', (e) => {
        if (generatedForm && (generatedForm.contains(e.target) || 
            document.getElementById('contactFieldsForm')?.contains(e.target) ||
            document.getElementById('billingFieldsForm')?.contains(e.target) ||
            shipperSelect === e.target ||
            consigneeSelect === e.target ||
            airlineSelect1 === e.target ||
            destinationSelect === e.target ||
            directFlightSelect === e.target ||
            interlineCarrierSelect1 === e.target ||
            interlineCarrierSelect2 === e.target)) {
            debouncedSave();
        }
    });
}

// Fill field 12 with airline abbreviation when Interline Carrier 1 is selected
async function fillInterlineCarrier1Field(airlineId) {
    if (!generatedForm) return;
    
    // Only get airline from airlinesAPI (Locations > Airlines) - no contacts fallback
    let airline = null;
    if (window.airlinesAPI) {
        try {
            const airlines = await window.airlinesAPI.getAll();
            airline = airlines.find(a => a.id === airlineId);
        } catch (error) {
            console.error('Could not load airlines from API:', error);
        }
    }
    
    if (!airline) {
        console.warn(`Airline not found for ${airlineId} - airlines should be managed in Locations > Airlines`);
        return;
    }
    
    // Fill field 12 with Airline Abbreviation
    if (airline.airlineAbbreviation) {
        const contactFieldsForm = document.getElementById('contactFieldsForm');
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const formsToCheck = [generatedForm];
        if (contactFieldsForm) {
            formsToCheck.push(contactFieldsForm);
        }
        if (billingFieldsForm) {
            formsToCheck.push(billingFieldsForm);
        }
        
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('12')) {
                    element.value = airline.airlineAbbreviation;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with Airline Abbreviation: ${airline.airlineAbbreviation}`);
                    break;
                }
            }
        }
    }
    
    setTimeout(() => updateTabValidationIndicators(), 50);
}

// Fill contact field in form
function fillContactField(fieldPrefix, contactIdOrUser) {
    if (!generatedForm) return;
    
    let contactData = null;
    
    if (contactIdOrUser === 'user') {
        // Get user profile
        contactData = getUserProfile();
    } else {
        // Get contact from list
        const contacts = getContacts();
        contactData = contacts.find(c => c.id === contactIdOrUser);
    }
    
    // For user profile, handle special cases for field 02 (origin) and field 08 (aoDEP)
    if (contactIdOrUser === 'user' && fieldPrefix === '02') {
        if (!contactData || !contactData.origin) {
            console.warn(`Origin data not found for user profile`);
            return;
        }
        
        // Fill field 02 with origin
        const contactFieldsForm = document.getElementById('contactFieldsForm');
        const formsToCheck = [generatedForm];
        if (contactFieldsForm) {
            formsToCheck.push(contactFieldsForm);
        }
        
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('02')) {
                    element.value = contactData.origin;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with origin data`);
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    return;
                }
            }
        }
        return;
    }
    
    // For user profile, handle field 22 (handlingInfo)
    if (contactIdOrUser === 'user' && fieldPrefix === '22') {
        if (!contactData || !contactData.handlingInfo) {
            console.warn(`Handling Info data not found for user profile`);
            return;
        }
        
        // Fill field 22 with handlingInfo
        const contactFieldsForm = document.getElementById('contactFieldsForm');
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const formsToCheck = [generatedForm];
        if (contactFieldsForm) {
            formsToCheck.push(contactFieldsForm);
        }
        if (billingFieldsForm) {
            formsToCheck.push(billingFieldsForm);
        }
        
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('22')) {
                    element.value = contactData.handlingInfo;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with handling info data`);
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    return;
                }
            }
        }
        return;
    }
    
    // For user profile, handle field 08 (aoDEP)
    if (contactIdOrUser === 'user' && fieldPrefix === '08') {
        if (!contactData || !contactData.aoDEP) {
            console.warn(`AoDEP data not found for user profile`);
            return;
        }
        
        // Fill field 08 with aoDEP
        const contactFieldsForm = document.getElementById('contactFieldsForm');
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const formsToCheck = [generatedForm];
        if (contactFieldsForm) {
            formsToCheck.push(contactFieldsForm);
        }
        if (billingFieldsForm) {
            formsToCheck.push(billingFieldsForm);
        }
        
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('08')) {
                    element.value = contactData.aoDEP;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with AoDEP data`);
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    return;
                }
            }
        }
        return;
    }
    
    // For user profile, handle field 33 (field33 - Commodity name Autofill Text)
    // Note: Field 33 is now filled via commodity dropdown selection, not auto-filled on load
    // This handler is kept for backward compatibility but field 33 should be filled via commoditySelect change event
    if (contactIdOrUser === 'user' && fieldPrefix === '33') {
        // Field 33 is handled by commodity dropdown, not auto-filled
        return;
    }
    
    // For user profile, handle field 56 (signatureShipper)
    if (contactIdOrUser === 'user' && fieldPrefix === '56') {
        if (!contactData || !contactData.signatureShipper) {
            console.warn(`Signature of Shipper data not found for user profile`);
            return;
        }
        
        // Fill field 56 with signatureShipper
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
        const formsToCheck = [generatedForm];
        if (billingFieldsForm) {
            formsToCheck.push(billingFieldsForm);
        }
        if (dimensionsFieldsForm) {
            formsToCheck.push(dimensionsFieldsForm);
        }
        
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('56')) {
                    element.value = contactData.signatureShipper;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with Signature of Shipper data`);
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    return;
                }
            }
        }
        return;
    }
    
    // For user profile, handle field 58 (signaturePlace)
    if (contactIdOrUser === 'user' && fieldPrefix === '58') {
        if (!contactData || !contactData.signaturePlace) {
            console.warn(`At (Place) data not found for user profile`);
            return;
        }
        
        // Fill field 58 with signaturePlace
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
        const formsToCheck = [generatedForm];
        if (billingFieldsForm) {
            formsToCheck.push(billingFieldsForm);
        }
        if (dimensionsFieldsForm) {
            formsToCheck.push(dimensionsFieldsForm);
        }
        
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('58')) {
                    element.value = contactData.signaturePlace;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with At (Place) data`);
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    return;
                }
            }
        }
        return;
    }
    
    // For user profile, handle field 59 (signatureIssuingCarrier)
    if (contactIdOrUser === 'user' && fieldPrefix === '59') {
        if (!contactData || !contactData.signatureIssuingCarrier) {
            console.warn(`Signature of Issuing Carrier data not found for user profile`);
            return;
        }
        
        // Fill field 59 with signatureIssuingCarrier
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
        const formsToCheck = [generatedForm];
        if (billingFieldsForm) {
            formsToCheck.push(billingFieldsForm);
        }
        if (dimensionsFieldsForm) {
            formsToCheck.push(dimensionsFieldsForm);
        }
        
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('59')) {
                    element.value = contactData.signatureIssuingCarrier;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with Signature of Issuing Carrier data`);
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    return;
                }
            }
        }
        return;
    }
    
    // For field 06, check for field06 first, then formattedValue
    // For other fields, check for formattedValue
    let hasValue = false;
    if (fieldPrefix === '06') {
        hasValue = contactData && (contactData.field06 || contactData.formattedValue);
    } else {
        hasValue = contactData && contactData.formattedValue;
    }
    
    if (!hasValue) {
        console.warn(`Contact data not found for ${contactIdOrUser} (field ${fieldPrefix})`);
        return;
    }
    
    // Find the form field that starts with the prefix (check all forms)
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    // For field 06, use field06 if available, otherwise fallback to formattedValue
    let valueToFill = contactData.formattedValue || '';
    if (fieldPrefix === '06' && contactData.field06) {
        valueToFill = contactData.field06;
    }
    
    let fieldFilled = false;
    for (const form of formsToCheck) {
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith(fieldPrefix)) {
                element.value = valueToFill;
                // Trigger input event to ensure any listeners are notified
                element.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`Filled field ${element.name} with contact data`);
                fieldFilled = true;
                break; // Found and filled, break inner loop
            }
        }
        if (fieldFilled) break; // Break outer loop if field was found
    }
    
    // If this is a Consignee (field 05) and has account info, also fill field 07
    if (fieldPrefix === '05' && contactData.accountInfo) {
        // Fill field 07 with account info (check both forms)
        for (const form of formsToCheck) {
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('07')) {
                    element.value = contactData.accountInfo;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with account info`);
                    // Update validation indicators after filling
                    setTimeout(() => updateTabValidationIndicators(), 50);
                    break;
                }
            }
        }
    }
    
    // Update validation indicators after filling
    setTimeout(() => updateTabValidationIndicators(), 50);
}

// Fill destination fields (09 with airport code, 18 with airport name)
async function fillDestinationFields(destinationId) {
    if (!generatedForm) return;
    
    // Get destinations from API only - no localStorage fallback
    let destinations = [];
    if (window.destinationsAPI) {
        try {
            destinations = await window.destinationsAPI.getAll();
        } catch (error) {
            console.error('Could not load destinations from API:', error);
            destinations = [];
        }
    } else {
        console.warn('destinationsAPI not available');
        destinations = [];
    }
    
    const destination = destinations.find(d => d.id === destinationId);
    
    if (!destination) {
        console.warn(`Destination not found for ${destinationId}`);
        return;
    }
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    // Fill field 09 with airport code
    if (destination.airportCode) {
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('09')) {
                    element.value = destination.airportCode;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with Airport Code: ${destination.airportCode}`);
                    break;
                }
            }
        }
    }
    
    // Fill field 18 with airport name
    if (destination.airportName) {
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('18')) {
                    element.value = destination.airportName;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with Airport Name: ${destination.airportName}`);
                    break;
                }
            }
        }
    }
    
    setTimeout(() => updateTabValidationIndicators(), 50);
}

// Auto-fill user profile on form load
function autoFillUserProfile() {
    const profile = getUserProfile();
    if (profile) {
        // Wait a bit for form to be fully generated
        setTimeout(() => {
            if (profile.field06 || profile.formattedValue) {
                fillContactField('06', 'user');
            }
            if (profile.origin) {
                fillContactField('02', 'user');
            }
            // Always auto-fill field 08 (AoDEP) if it exists
            if (profile.aoDEP) {
                fillContactField('08', 'user');
            }
            // Field 33 is now handled by commodity dropdown selection, not auto-filled on load
            if (profile.handlingInfo) {
                fillContactField('22', 'user');
            }
            if (profile.signatureShipper) {
                fillContactField('56', 'user');
            }
            if (profile.signaturePlace) {
                fillContactField('58', 'user');
            }
            if (profile.signatureIssuingCarrier) {
                fillContactField('59', 'user');
            }
            
            // Populate commodity dropdown after profile is loaded
            populateCommodityDropdown();
        }, 500);
    }
}


// Handle Direct Flight change - disable/grey out fields 11, 12, 13, 14 when Yes
function handleDirectFlightChange(isDirectFlight) {
    if (!generatedForm) return;
    
    // When Direct Flight is "No", only unlock fields 11 and 12
    // Fields 13 and 14 will be unlocked when Interline Carrier 2 is selected
    const fieldPrefixes = ['11', '12', '13', '14'];
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    fieldPrefixes.forEach(prefix => {
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith(prefix)) {
                    // Find the form group containing this field
                    const formGroup = element.closest('.form-group');
                    
                    if (isDirectFlight) {
                        // Disable and grey out the field
                        element.disabled = true;
                        element.style.backgroundColor = '#e9ecef';
                        element.style.color = '#6c757d';
                        element.style.cursor = 'not-allowed';
                        
                        // Mark the form group as complete/disabled
                        if (formGroup) {
                            formGroup.style.opacity = '0.6';
                            // Add a green checkmark indicator that it's complete
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove any existing checkmarks first
                                const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                existingCheckmarks.forEach(span => span.remove());
                                // Also remove text-based checkmarks
                                label.textContent = label.textContent.replace(' ✓', '');
                                
                                // Create a span for the green checkmark
                                const checkmark = document.createElement('span');
                                checkmark.textContent = ' ✓';
                                checkmark.style.color = '#28a745';
                                checkmark.style.fontWeight = 'bold';
                                checkmark.style.marginLeft = '5px';
                                label.appendChild(checkmark);
                            }
                        }
                        
                        // Set a special attribute to mark as complete for validation
                        element.setAttribute('data-direct-flight-complete', 'true');
                        
                        // Clear the value
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                        // When Direct Flight is "No", only unlock fields 11 and 12
                        // Fields 13 and 14 remain locked until Interline Carrier 2 is selected
                        if (prefix === '11' || prefix === '12') {
                            // Re-enable the field
                            element.disabled = false;
                            element.style.backgroundColor = '';
                            element.style.color = '';
                            element.style.cursor = '';
                            
                            // Restore form group appearance
                            if (formGroup) {
                                formGroup.style.opacity = '1';
                                // Remove the checkmark from label
                                const label = formGroup.querySelector('label');
                                if (label) {
                                    // Remove any checkmark spans
                                    const checkmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                    checkmarks.forEach(span => span.remove());
                                    // Also remove text-based checkmarks
                                    label.textContent = label.textContent.replace(' ✓', '');
                                }
                            }
                            
                            // Remove the complete marker
                            element.removeAttribute('data-direct-flight-complete');
                        }
                        // Fields 13 and 14 remain disabled when Direct Flight is "No"
                    }
                }
            }
        }
    });
    
    // Handle Interline Shipment dropdown
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    const interlineShipmentGroup = interlineShipmentSelect ? interlineShipmentSelect.closest('.contact-select-group') : null;
    
    if (interlineShipmentSelect) {
        if (isDirectFlight) {
            // Disable and grey out the Interline Shipment dropdown
            interlineShipmentSelect.disabled = true;
            interlineShipmentSelect.style.backgroundColor = '#e9ecef';
            interlineShipmentSelect.style.color = '#6c757d';
            interlineShipmentSelect.style.cursor = 'not-allowed';
            
            // Grey out the group
            if (interlineShipmentGroup) {
                interlineShipmentGroup.style.opacity = '0.6';
            }
            
            // Clear the value and hide Interline Carrier dropdown if visible
            interlineShipmentSelect.value = '';
            handleInterlineShipmentChange(false);
        } else {
            // Re-enable the Interline Shipment dropdown
            interlineShipmentSelect.disabled = false;
            interlineShipmentSelect.style.backgroundColor = '';
            interlineShipmentSelect.style.color = '';
            interlineShipmentSelect.style.cursor = '';
            
            // Restore group appearance
            if (interlineShipmentGroup) {
                interlineShipmentGroup.style.opacity = '1';
            }
        }
    }
    
    // Update Interline Shipment label color based on Direct Flight selection
    // Reuse interlineShipmentSelect from above (already declared at line 5745)
    const interlineShipmentLabel = interlineShipmentSelect ? interlineShipmentSelect.closest('.contact-select-group')?.querySelector('label') : null;
    
    if (interlineShipmentLabel) {
        if (isDirectFlight || (interlineShipmentSelect && interlineShipmentSelect.value && interlineShipmentSelect.value !== '')) {
            // Remove red color when Direct Flight is Yes or when Interline Shipment is selected
            interlineShipmentLabel.style.color = '';
        } else {
            // Keep red color when not selected (and Direct Flight is not Yes)
            interlineShipmentLabel.style.color = 'red';
        }
    }
    
    // Update validation indicators
    setTimeout(() => {
        updateTabValidationIndicators();
        updatePromptIndicators();
    }, 100);
}

// Handle Interline Shipment change - show/hide Interline Carrier dropdown and add button
function handleInterlineShipmentChange(isInterlineYes) {
    const interlineCarrierGroup = document.getElementById('interlineCarrierGroup');
    const addInterlineCarrier2BtnGroup = document.getElementById('addInterlineCarrier2BtnGroup');
    const interlineCarrierGroup2 = document.getElementById('interlineCarrierGroup2');
    
    if (interlineCarrierGroup) {
        interlineCarrierGroup.style.display = isInterlineYes ? 'flex' : 'none';
    }
    
    // Show/hide the "Add Interline Carrier 2" button
    if (addInterlineCarrier2BtnGroup) {
        // Only show button if Interline Carrier 2 is not already visible
        const showButton = isInterlineYes && (!interlineCarrierGroup2 || interlineCarrierGroup2.style.display === 'none');
        addInterlineCarrier2BtnGroup.style.display = showButton ? 'flex' : 'none';
    }
    
    // If Interline is No, clear the interline carrier selections and hide everything
    if (!isInterlineYes) {
        if (interlineCarrierSelect1) {
            interlineCarrierSelect1.value = '';
        }
        if (interlineCarrierSelect2) {
            interlineCarrierSelect2.value = '';
        }
        if (interlineCarrierGroup2) {
            interlineCarrierGroup2.style.display = 'none';
        }
        if (addInterlineCarrier2BtnGroup) {
            addInterlineCarrier2BtnGroup.style.display = 'none';
        }
    }
    
    // Update Interline Shipment label color based on selection
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    const interlineShipmentLabel = interlineShipmentSelect ? interlineShipmentSelect.closest('.contact-select-group')?.querySelector('label') : null;
    const directFlightSelect = document.getElementById('directFlightSelect');
    const isDirectFlight = directFlightSelect && directFlightSelect.value === 'Yes';
    
    if (interlineShipmentLabel) {
        if (isDirectFlight || (interlineShipmentSelect && interlineShipmentSelect.value && interlineShipmentSelect.value !== '')) {
            // Remove red color when selected or when Direct Flight is Yes
            interlineShipmentLabel.style.color = '';
        } else {
            // Keep red color when not selected (and Direct Flight is not Yes)
            interlineShipmentLabel.style.color = 'red';
        }
    }
    
    // Update validation indicators
    setTimeout(() => {
        updateTabValidationIndicators();
        updatePromptIndicators();
    }, 100);
}

// Handle Interline Carrier 2 change - unlock fields 13 and 14, fill field 14 with abbreviation
async function handleInterlineCarrier2Change(airlineId) {
    if (!generatedForm) return;
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    const fieldPrefixes = ['13', '14'];
    
    if (airlineId) {
        // Get airline data from airlinesAPI (Locations > Airlines) - no contacts fallback
        let airline = null;
        if (window.airlinesAPI) {
            try {
                const airlines = await window.airlinesAPI.getAll();
                airline = airlines.find(a => a.id === airlineId);
            } catch (error) {
                console.error('Could not load airlines from API:', error);
            }
        }
        
        if (!airline) {
            console.warn(`Airline not found for ${airlineId} - airlines should be managed in Locations > Airlines`);
            return;
        }
        
        fieldPrefixes.forEach(prefix => {
            for (const form of formsToCheck) {
                if (!form) continue;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith(prefix)) {
                        const formGroup = element.closest('.form-group');
                        
                        // Unlock the field
                        element.disabled = false;
                        element.style.backgroundColor = '';
                        element.style.color = '';
                        element.style.cursor = '';
                        
                        // Restore form group appearance
                        if (formGroup) {
                            formGroup.style.opacity = '1';
                            // Remove the checkmark from label
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove any checkmark spans
                                const checkmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                checkmarks.forEach(span => span.remove());
                                // Also remove text-based checkmarks
                                label.textContent = label.textContent.replace(' ✓', '');
                            }
                        }
                        
                        // Remove the complete marker
                        element.removeAttribute('data-direct-flight-complete');
                        
                        // Fill field 14 with airline abbreviation
                        if (prefix === '14' && airline && airline.airlineAbbreviation) {
                            element.value = airline.airlineAbbreviation;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log(`Filled field ${element.name} with Airline Abbreviation: ${airline.airlineAbbreviation}`);
                        }
                    }
                }
            }
        });
    } else {
        // Lock fields 13 and 14 again
        fieldPrefixes.forEach(prefix => {
            for (const form of formsToCheck) {
                if (!form) continue;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith(prefix)) {
                        const formGroup = element.closest('.form-group');
                        
                        // Disable and grey out the field
                        element.disabled = true;
                        element.style.backgroundColor = '#e9ecef';
                        element.style.color = '#6c757d';
                        element.style.cursor = 'not-allowed';
                        
                        // Mark the form group as complete/disabled
                        if (formGroup) {
                            formGroup.style.opacity = '0.6';
                            // Add a green checkmark indicator that it's complete
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove any existing checkmarks first
                                const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                existingCheckmarks.forEach(span => span.remove());
                                // Also remove text-based checkmarks
                                label.textContent = label.textContent.replace(' ✓', '');
                                
                                // Create a span for the green checkmark
                                const checkmark = document.createElement('span');
                                checkmark.textContent = ' ✓';
                                checkmark.style.color = '#28a745';
                                checkmark.style.fontWeight = 'bold';
                                checkmark.style.marginLeft = '5px';
                                label.appendChild(checkmark);
                            }
                        }
                        
                        // Set a special attribute to mark as complete for validation
                        element.setAttribute('data-direct-flight-complete', 'true');
                        
                        // Clear the value
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        });
    }
    
    setTimeout(() => updateTabValidationIndicators(), 50);
}

// Handle Dangerous Goods change - clear field 22 when Yes
function handleDangerousGoodsChange(isDangerousGoods) {
    if (!generatedForm) return;
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    for (const form of formsToCheck) {
        if (!form) continue;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith('22')) {
                if (isDangerousGoods) {
                    // Clear field 22 when Dangerous Goods is Yes
                    element.value = '';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
                // If No or empty, field can be filled normally (no action needed)
            }
        }
    }
    
    // Update Dangerous Goods label color based on selection
    const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    const dangerousGoodsLabel = dangerousGoodsSelect ? dangerousGoodsSelect.closest('.contact-select-group')?.querySelector('label') : null;
    if (dangerousGoodsLabel) {
        if (dangerousGoodsSelect && dangerousGoodsSelect.value && dangerousGoodsSelect.value !== '') {
            // Remove red color when selected
            dangerousGoodsLabel.style.color = '';
        } else {
            // Keep red color when not selected
            dangerousGoodsLabel.style.color = 'red';
        }
    }
    
    // Update validation indicators
    setTimeout(() => {
        updateTabValidationIndicators();
        updatePromptIndicators();
    }, 100);
}

// Handle Declared Values change - grey out fields 16 and 17 when No
function handleDeclaredValuesChange(isDeclaredNo) {
    if (!generatedForm) return;
    
    const fieldPrefixes = ['16', '17'];
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    fieldPrefixes.forEach(prefix => {
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith(prefix)) {
                    const formGroup = element.closest('.form-group');
                    
                    if (isDeclaredNo) {
                        // Auto-fill field 16 with "NVC" and field 17 with "NVD"
                        if (prefix === '16') {
                            element.value = 'NVC';
                        } else if (prefix === '17') {
                            element.value = 'NVD';
                        }
                        
                        // Keep fields enabled (not greyed out)
                        element.disabled = false;
                        element.style.backgroundColor = '';
                        element.style.color = '';
                        element.style.cursor = '';
                        
                        if (formGroup) {
                            formGroup.style.opacity = '1';
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove any existing checkmarks
                                const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                existingCheckmarks.forEach(span => span.remove());
                                label.textContent = label.textContent.replace(' ✓', '');
                            }
                        }
                        
                        // Mark as complete for validation
                        element.setAttribute('data-declared-values-complete', 'true');
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                        // Re-enable the field
                        element.disabled = false;
                        element.style.backgroundColor = '';
                        element.style.color = '';
                        element.style.cursor = '';
                        
                        if (formGroup) {
                            formGroup.style.opacity = '1';
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove checkmarks
                                const checkmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                checkmarks.forEach(span => span.remove());
                                label.textContent = label.textContent.replace(' ✓', '');
                            }
                        }
                        
                        // Remove the complete marker
                        element.removeAttribute('data-declared-values-complete');
                    }
                }
            }
        }
    });
    
    // Update validation indicators
    setTimeout(() => {
        updateTabValidationIndicators();
        updatePromptIndicators();
    }, 100);
}

// Handle Insurance change - grey out field 21 when No
function handleInsuranceChange(isInsuranceNo) {
    if (!generatedForm) return;
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    for (const form of formsToCheck) {
        if (!form) continue;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith('21')) {
                const formGroup = element.closest('.form-group');
                
                if (isInsuranceNo) {
                    // Auto-fill field 21 with "NILL"
                    element.value = 'NILL';
                    
                    // Keep field enabled (not greyed out)
                    element.disabled = false;
                    element.style.backgroundColor = '';
                    element.style.color = '';
                    element.style.cursor = '';
                    
                    if (formGroup) {
                        formGroup.style.opacity = '1';
                        const label = formGroup.querySelector('label');
                        if (label) {
                            // Remove any existing checkmarks
                            const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                            existingCheckmarks.forEach(span => span.remove());
                            label.textContent = label.textContent.replace(' ✓', '');
                        }
                    }
                    
                    // Mark as complete for validation
                    element.setAttribute('data-insurance-complete', 'true');
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    // Re-enable the field
                    element.disabled = false;
                    element.style.backgroundColor = '';
                    element.style.color = '';
                    element.style.cursor = '';
                    
                    if (formGroup) {
                        formGroup.style.opacity = '1';
                        const label = formGroup.querySelector('label');
                        if (label) {
                            // Remove checkmarks
                            const checkmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                            checkmarks.forEach(span => span.remove());
                            label.textContent = label.textContent.replace(' ✓', '');
                        }
                    }
                    
                    // Remove the complete marker
                    element.removeAttribute('data-insurance-complete');
                }
            }
        }
    }
    
    // Update validation indicators
    setTimeout(() => {
        updateTabValidationIndicators();
        updatePromptIndicators();
    }, 100);
}

// Handle Prepaid or Collect change - fill field 23 and check/grey out fields 24 and 25
function handlePrepaidCollectChange(value) {
    if (!generatedForm) return;
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    if (value === 'Prepaid') {
        // Fill field 23 with "PP"
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('23')) {
                    element.value = 'PP';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with PP`);
                    break;
                }
            }
        }
        
        // Check field 24 and grey out field 25
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('24')) {
                    element.checked = true;
                    element.disabled = false;
                    element.style.backgroundColor = '';
                    element.style.color = '';
                    element.style.cursor = '';
                    const formGroup = element.closest('.form-group');
                    if (formGroup) {
                        formGroup.style.opacity = '1';
                    }
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Checked field ${element.name}`);
                } else if (element.name && element.name.startsWith('25')) {
                    element.checked = false;
                    element.disabled = true;
                    element.style.backgroundColor = '#e9ecef';
                    element.style.color = '#6c757d';
                    element.style.cursor = 'not-allowed';
                    const formGroup = element.closest('.form-group');
                    if (formGroup) {
                        formGroup.style.opacity = '0.6';
                        const label = formGroup.querySelector('label');
                        if (label) {
                            // Remove any existing checkmarks
                            const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                            existingCheckmarks.forEach(span => span.remove());
                            label.textContent = label.textContent.replace(' ✓', '');
                            
                            // Add green checkmark
                            const checkmark = document.createElement('span');
                            checkmark.textContent = ' ✓';
                            checkmark.style.color = '#28a745';
                            checkmark.style.fontWeight = 'bold';
                            checkmark.style.marginLeft = '5px';
                            label.appendChild(checkmark);
                        }
                    }
                    // Mark as complete for validation
                    element.setAttribute('data-prepaid-collect-complete', 'true');
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Greyed out field ${element.name}`);
                }
            }
        }
    } else if (value === 'Collect') {
        // Fill field 23 with "CC"
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('23')) {
                    element.value = 'CC';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`Filled field ${element.name} with CC`);
                    break;
                }
            }
        }
        
        // Check field 25 and grey out field 24
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('25')) {
                    element.checked = true;
                    element.disabled = false;
                    element.style.backgroundColor = '';
                    element.style.color = '';
                    element.style.cursor = '';
                    const formGroup = element.closest('.form-group');
                    if (formGroup) {
                        formGroup.style.opacity = '1';
                    }
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Checked field ${element.name}`);
                } else if (element.name && element.name.startsWith('24')) {
                    element.checked = false;
                    element.disabled = true;
                    element.style.backgroundColor = '#e9ecef';
                    element.style.color = '#6c757d';
                    element.style.cursor = 'not-allowed';
                    const formGroup = element.closest('.form-group');
                    if (formGroup) {
                        formGroup.style.opacity = '0.6';
                        const label = formGroup.querySelector('label');
                        if (label) {
                            // Remove any existing checkmarks
                            const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                            existingCheckmarks.forEach(span => span.remove());
                            label.textContent = label.textContent.replace(' ✓', '');
                            
                            // Add green checkmark
                            const checkmark = document.createElement('span');
                            checkmark.textContent = ' ✓';
                            checkmark.style.color = '#28a745';
                            checkmark.style.fontWeight = 'bold';
                            checkmark.style.marginLeft = '5px';
                            label.appendChild(checkmark);
                        }
                    }
                    // Mark as complete for validation
                    element.setAttribute('data-prepaid-collect-complete', 'true');
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Greyed out field ${element.name}`);
                }
            }
        }
    } else {
        // If cleared, reset fields
        for (const form of formsToCheck) {
            if (!form) continue;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith('23')) {
                    element.value = '';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (element.name && (element.name.startsWith('24') || element.name.startsWith('25'))) {
                    element.checked = false;
                    element.disabled = false;
                    element.style.backgroundColor = '';
                    element.style.color = '';
                    element.style.cursor = '';
                    const formGroup = element.closest('.form-group');
                    if (formGroup) {
                        formGroup.style.opacity = '1';
                        const label = formGroup.querySelector('label');
                        if (label) {
                            // Remove any existing checkmarks
                            const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                            existingCheckmarks.forEach(span => span.remove());
                            label.textContent = label.textContent.replace(' ✓', '');
                        }
                    }
                    // Remove the complete marker
                    element.removeAttribute('data-prepaid-collect-complete');
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }
    
    setTimeout(() => updateTabValidationIndicators(), 50);
}

// Show contact section when form is generated
async function showContactSection() {
    if (contactControlsSection) {
        contactControlsSection.style.display = 'block';
        await updateContactDropdowns();
        autoFillUserProfile();
    }
    
    // Show routing controls section
    if (routingControlsSection) {
        routingControlsSection.style.display = 'block';
        // Don't call updateContactDropdowns again - already called above
        
        // Check if Interline Shipment is already set to Yes and show Interline Carrier if needed
        const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
        if (interlineShipmentSelect && interlineShipmentSelect.value === 'Yes') {
            handleInterlineShipmentChange(true);
        }
    }
}

// Initialize tabs functionality (called after DOM is ready)
function initializeTabs() {
    // Always default to contacts tab when opening Create AWB
    const defaultTab = 'contacts';
    
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.awb-tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.awb-tab-content').forEach(content => content.classList.remove('active'));
    
    // Set the contacts tab as active
    const tabButton = document.querySelector(`.awb-tab-button[data-tab="${defaultTab}"]`);
    const tabContent = document.getElementById(`${defaultTab}-tab`);
    
    if (tabButton && tabContent) {
        tabButton.classList.add('active');
        tabContent.classList.add('active');
        // Save to localStorage so it persists if user switches tabs
        localStorage.setItem('awbLastActiveTab', defaultTab);
    } else {
        // Fallback to routing if contacts tab doesn't exist
        const routingButton = document.querySelector('.awb-tab-button[data-tab="routing"]');
        const routingContent = document.getElementById('routing-tab');
        if (routingButton) routingButton.classList.add('active');
        if (routingContent) routingContent.classList.add('active');
    }
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.awb-tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.awb-tab-content').forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById(`${tabName}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // Save active tab to localStorage
            localStorage.setItem('awbLastActiveTab', tabName);
            
            // If Preview AWB tab (form tab) is clicked, generate preview
            if (tabName === 'form' && typeof window.generatePDFPreview === 'function') {
                setTimeout(() => {
                    window.generatePDFPreview();
                }, 100);
            }
        });
    });
    
    // Initialize validation indicators
    updateTabValidationIndicators();
    
    // Update indicators when form fields change
    if (generatedForm) {
        generatedForm.addEventListener('input', updateTabValidationIndicators);
        generatedForm.addEventListener('change', updateTabValidationIndicators);
    }
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    if (contactFieldsForm) {
        contactFieldsForm.addEventListener('input', updateTabValidationIndicators);
        contactFieldsForm.addEventListener('change', updateTabValidationIndicators);
    }
    
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    if (billingFieldsForm) {
        billingFieldsForm.addEventListener('input', updateTabValidationIndicators);
        billingFieldsForm.addEventListener('change', updateTabValidationIndicators);
    }
    
    // Set up calculation for field 32 (30 * 31)
    setupField32Calculation();
    
    // Set up validation for field 26 (must match total PCS)
    setupField26Validation();
    
    // Set up autofill for field 40 (sum of all dimension QTY)
    setupField40Autofill();
    
    // Set up autofill for field 101 (01-03 format)
    setupField101Autofill();
}

// Calculate field 32 as field 30 * field 31
function calculateField32() {
    if (!generatedForm) return;
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const formsToCheck = [generatedForm];
    if (contactFieldsForm) {
        formsToCheck.push(contactFieldsForm);
    }
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    
    let field30Value = null;
    let field31Value = null;
    let field32Element = null;
    
    // Find fields 30, 31, and 32
    for (const form of formsToCheck) {
        if (!form) continue;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (!element.name) continue;
            
            if (element.name.startsWith('30')) {
                const value = parseFloat(element.value);
                if (!isNaN(value)) {
                    field30Value = value;
                }
            } else if (element.name.startsWith('31')) {
                const value = parseDollarAmount(element.value);
                if (!isNaN(value)) {
                    field31Value = value;
                }
            } else if (element.name.startsWith('32')) {
                field32Element = element;
            }
        }
    }
    
    // Calculate and set field 32 if both 30 and 31 have values
    if (field32Element && field30Value !== null && field31Value !== null) {
        const result = field30Value * field31Value;
        // Format as dollar amount
        const formattedValue = formatDollarAmount(result);
        field32Element.value = formattedValue;
        // Trigger input event to ensure validation updates
        field32Element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Check prepaid/collect dropdown and autofill field 42 or 43
        const prepaidCollectSelect = document.getElementById('prepaidCollectSelect');
        if (prepaidCollectSelect) {
            const selectedValue = prepaidCollectSelect.value;
            
            if (selectedValue === 'Prepaid') {
                // Autofill field 42 with field 32's value
                for (const form of formsToCheck) {
                    if (!form) continue;
                    const formElements = form.elements;
                    for (let i = 0; i < formElements.length; i++) {
                        const element = formElements[i];
                        if (element.name && element.name.startsWith('42')) {
                            element.value = formattedValue;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log(`Filled field ${element.name} with field 32 value: ${formattedValue}`);
                            break;
                        }
                    }
                }
            } else if (selectedValue === 'Collect') {
                // Autofill field 43 with field 32's value
                for (const form of formsToCheck) {
                    if (!form) continue;
                    const formElements = form.elements;
                    for (let i = 0; i < formElements.length; i++) {
                        const element = formElements[i];
                        if (element.name && element.name.startsWith('43')) {
                            element.value = formattedValue;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log(`Filled field ${element.name} with field 32 value: ${formattedValue}`);
                            break;
                        }
                    }
                }
            }
        }
    } else if (field32Element && (field30Value === null || field31Value === null)) {
        // Clear field 32 if either 30 or 31 is empty
        field32Element.value = '';
        field32Element.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Set up event listeners for fields 30 and 31 to calculate field 32
function setupField32Calculation() {
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    if (!billingFieldsForm) return;
    
    // Use event delegation on the billing form to catch input/change events
    billingFieldsForm.addEventListener('input', (e) => {
        if (e.target.name && (e.target.name.startsWith('30') || e.target.name.startsWith('31'))) {
            calculateField32();
        }
    });
    
    billingFieldsForm.addEventListener('change', (e) => {
        if (e.target.name && (e.target.name.startsWith('30') || e.target.name.startsWith('31'))) {
            calculateField32();
        }
    });
}

// Calculate total PCS from all dimensions rows
function calculateTotalPCS() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return 0;
    
    let totalPCS = 0;
    const dimensionsRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    
    dimensionsRows.forEach(row => {
        const qtyInput = row.querySelector('.dim-qty');
        if (qtyInput && qtyInput.value.trim()) {
            const qty = parseInt(qtyInput.value.trim());
            if (!isNaN(qty)) {
                totalPCS += qty;
            }
        }
    });
    
    return totalPCS;
}

// Update field 40 with the sum of all dimension QTY values formatted as "X PCS"
function updateField40() {
    const totalQTY = calculateTotalPCS();
    
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const generatedForm = document.getElementById('generatedForm');
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
    
    formsToCheck.forEach(form => {
        if (!form) return;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith('40')) {
                element.value = totalQTY > 0 ? `${totalQTY} PCS` : '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                break;
            }
        }
    });
}

// Set up autofill for field 40 (sum of all dimension QTY)
function setupField40Autofill() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Use event delegation to catch input/change events on any QTY field
    dimensionsContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('dim-qty')) {
            // Update field 40 when any QTY changes
            setTimeout(() => updateField40(), 10);
        }
    });
    
    dimensionsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('dim-qty')) {
            // Update field 40 when any QTY changes
            setTimeout(() => updateField40(), 10);
        }
    });
    
    // Initial update
    setTimeout(() => updateField40(), 100);
}

// Update field 101 with format "X-Y" where X is field 01 and Y is field 03
function updateField101() {
    const generatedForm = document.getElementById('generatedForm');
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const formsToCheck = [generatedForm, contactFieldsForm].filter(f => f);
    
    let field01Value = '';
    let field03Value = '';
    
    // Find fields 01 and 03
    for (const form of formsToCheck) {
        if (!form) continue;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (!element.name) continue;
            
            if (element.name.startsWith('01') && !field01Value) {
                field01Value = element.value.trim();
            }
            if (element.name.startsWith('03') && !field03Value) {
                field03Value = element.value.trim();
            }
        }
    }
    
    // Format as "X-Y" if both values exist, otherwise empty
    const field101Value = (field01Value && field03Value) ? `${field01Value}-${field03Value}` : '';
    
    // Find and update field 101
    for (const form of formsToCheck) {
        if (!form) continue;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith('101')) {
                element.value = field101Value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                break;
            }
        }
    }
}

// Set up autofill for field 101 (01-03 format)
function setupField101Autofill() {
    const generatedForm = document.getElementById('generatedForm');
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const formsToCheck = [generatedForm, contactFieldsForm].filter(f => f);
    
    if (formsToCheck.length === 0) return;
    
    // Use event delegation to catch input/change events on fields 01 and 03
    formsToCheck.forEach(form => {
        if (!form) return;
        
        form.addEventListener('input', (e) => {
            if (e.target.name && (e.target.name.startsWith('01') || e.target.name.startsWith('03'))) {
                setTimeout(() => updateField101(), 10);
            }
        });
        
        form.addEventListener('change', (e) => {
            if (e.target.name && (e.target.name.startsWith('01') || e.target.name.startsWith('03'))) {
                setTimeout(() => updateField101(), 10);
            }
        });
    });
    
    // Initial update
    setTimeout(() => updateField101(), 100);
}

// Check if field 26 matches total PCS
function isField26Valid(element) {
    if (!element || !element.name || !element.name.startsWith('26')) return true;
    
    const fieldValue = element.value.trim();
    if (!fieldValue || fieldValue === '') return false; // Empty is invalid
    
    const inputValue = parseInt(fieldValue);
    if (isNaN(inputValue)) return false; // Not a number is invalid
    
    const totalPCS = calculateTotalPCS();
    return inputValue === totalPCS;
}

// Set up validation for field 26
function setupField26Validation() {
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const generatedForm = document.getElementById('generatedForm');
    
    // Validate when field 26 changes
    const validateField26OnChange = (e) => {
        if (e.target.name && e.target.name.startsWith('26')) {
            const element = e.target;
            const isValid = isField26Valid(element);
            
            // Update styling
            const formGroup = element.closest('.form-group');
            if (formGroup) {
                const label = formGroup.querySelector('label');
                if (label) {
                    if (!isValid) {
                        label.style.color = 'red';
                        element.style.borderColor = '#c62828';
                        element.style.backgroundColor = '#ffebee';
                    } else {
                        label.style.color = '';
                        element.style.borderColor = '';
                        element.style.backgroundColor = '';
                    }
                }
            }
            
            // Update validation indicators
            setTimeout(() => updateTabValidationIndicators(), 50);
        }
    };
    
    if (billingFieldsForm) {
        billingFieldsForm.addEventListener('input', validateField26OnChange);
        billingFieldsForm.addEventListener('change', validateField26OnChange);
    }
    
    if (generatedForm) {
        generatedForm.addEventListener('input', validateField26OnChange);
        generatedForm.addEventListener('change', validateField26OnChange);
    }
    
    // Also validate when dimensions QTY fields change
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (dimensionsContainer) {
        dimensionsContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('dim-qty')) {
                // Re-validate field 26 when any QTY changes
                setTimeout(() => {
                    const billingFieldsForm = document.getElementById('billingFieldsForm');
                    const generatedForm = document.getElementById('generatedForm');
                    const formsToCheck = [billingFieldsForm, generatedForm].filter(f => f);
                    formsToCheck.forEach(form => {
                        if (!form) return;
                        const formElements = form.elements;
                        for (let i = 0; i < formElements.length; i++) {
                            const element = formElements[i];
                            if (element.name && element.name.startsWith('26')) {
                                validateField26OnChange({ target: element });
                                break;
                            }
                        }
                    });
                }, 100);
            }
        });
        
        dimensionsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('dim-qty')) {
                // Re-validate field 26 when any QTY changes
                setTimeout(() => {
                    const billingFieldsForm = document.getElementById('billingFieldsForm');
                    const generatedForm = document.getElementById('generatedForm');
                    const formsToCheck = [billingFieldsForm, generatedForm].filter(f => f);
                    formsToCheck.forEach(form => {
                        if (!form) return;
                        const formElements = form.elements;
                        for (let i = 0; i < formElements.length; i++) {
                            const element = formElements[i];
                            if (element.name && element.name.startsWith('26')) {
                                validateField26OnChange({ target: element });
                                break;
                            }
                        }
                    });
                }, 100);
            }
        });
    }
}

// Update validation indicators for all tabs
function updateTabValidationIndicators() {
    if (!generatedForm) return;
    
    // Count missing fields in Form tab (no fields now)
    updateTabIndicator('form', 0);
    
    // Count missing fields in Contacts tab
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const contactsMissing = contactFieldsForm ? countMissingFields(contactFieldsForm) : 0;
    updateTabIndicator('contacts', contactsMissing);
    
    // Count missing fields in Routing tab (all main form fields are here now)
    let routingMissing = countMissingFields(generatedForm);
    
    // Check Destination dropdown (required)
    const destinationSelect = document.getElementById('destinationSelect');
    if (destinationSelect && (!destinationSelect.value || destinationSelect.value === '')) {
        routingMissing++;
    }
    
    // Check Dangerous Goods dropdown (required)
    const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    const dangerousGoodsLabel = dangerousGoodsSelect ? dangerousGoodsSelect.closest('.contact-select-group')?.querySelector('label') : null;
    if (dangerousGoodsSelect && (!dangerousGoodsSelect.value || dangerousGoodsSelect.value === '')) {
        routingMissing++;
        // Dangerous Goods label should be red when not selected
        if (dangerousGoodsLabel) {
            dangerousGoodsLabel.style.color = 'red';
        }
    } else if (dangerousGoodsLabel) {
        // Dangerous Goods is selected, remove red color
        dangerousGoodsLabel.style.color = '';
    }
    
    // Check Interline Shipment dropdown (required, but only if Direct Flight is not Yes)
    const directFlightSelect = document.getElementById('directFlightSelect');
    const isDirectFlight = directFlightSelect && directFlightSelect.value === 'Yes';
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    const interlineShipmentLabel = interlineShipmentSelect ? interlineShipmentSelect.closest('.contact-select-group')?.querySelector('label') : null;
    if (interlineShipmentSelect && !isDirectFlight && (!interlineShipmentSelect.value || interlineShipmentSelect.value === '')) {
        routingMissing++;
        // Interline Shipment label should be red when not selected (and Direct Flight is not Yes)
        if (interlineShipmentLabel) {
            interlineShipmentLabel.style.color = 'red';
        }
    } else if (interlineShipmentLabel) {
        // Interline Shipment is selected or Direct Flight is Yes, remove red color
        if (isDirectFlight || (interlineShipmentSelect && interlineShipmentSelect.value && interlineShipmentSelect.value !== '')) {
            interlineShipmentLabel.style.color = '';
        }
    }
    
    updateTabIndicator('routing', routingMissing);
    
    // Count missing fields in Dimensions tab
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    const dimensionsMissing = dimensionsFieldsForm ? countMissingFields(dimensionsFieldsForm) : 0;
    updateTabIndicator('dimensions', dimensionsMissing);
    
    // Count missing fields in Billing tab
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const billingMissing = billingFieldsForm ? countMissingFields(billingFieldsForm) : 0;
    updateTabIndicator('billing', billingMissing);
    
    // Update prompt indicators after a short delay to ensure labels are updated
    setTimeout(() => {
        updatePromptIndicators();
    }, 100);
}

// Get list of missing field names with their labels
function getMissingFieldNames() {
    const missingFields = [];
    
    // Check all forms
    const formsToCheck = [];
    if (generatedForm) formsToCheck.push(generatedForm);
    
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    if (contactFieldsForm) formsToCheck.push(contactFieldsForm);
    
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    if (billingFieldsForm) formsToCheck.push(billingFieldsForm);
    
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    if (dimensionsFieldsForm) formsToCheck.push(dimensionsFieldsForm);
    
    // Check routing dropdowns
    const destinationSelect = document.getElementById('destinationSelect');
    if (destinationSelect && (!destinationSelect.value || destinationSelect.value === '')) {
        const label = destinationSelect.closest('.contact-select-group')?.querySelector('label');
        missingFields.push(label ? label.textContent.trim() : 'Destination');
    }
    
    const dangerousGoodsSelect = document.getElementById('dangerousGoodsSelect');
    if (dangerousGoodsSelect && (!dangerousGoodsSelect.value || dangerousGoodsSelect.value === '')) {
        const label = dangerousGoodsSelect.closest('.contact-select-group')?.querySelector('label');
        missingFields.push(label ? label.textContent.trim() : 'Dangerous Goods');
    }
    
    // Check Interline Shipment dropdown (required, but only if Direct Flight is not Yes)
    const directFlightSelect = document.getElementById('directFlightSelect');
    const isDirectFlight = directFlightSelect && directFlightSelect.value === 'Yes';
    const interlineShipmentSelect = document.getElementById('interlineShipmentSelect');
    if (interlineShipmentSelect && !isDirectFlight && (!interlineShipmentSelect.value || interlineShipmentSelect.value === '')) {
        const label = interlineShipmentSelect.closest('.contact-select-group')?.querySelector('label');
        missingFields.push(label ? label.textContent.trim() : 'Interline Shipment');
    }
    
    // Check form fields
    formsToCheck.forEach(form => {
        if (!form) return;
        
        const formElements = form.elements;
        const processedRadioGroups = new Set();
        
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            const name = element.name;
            
            if (!name) continue;
            
            // Skip buttons and hidden inputs
            if (element.type === 'button' || element.type === 'submit' || element.type === 'hidden') {
                continue;
            }
            
            // Skip fields marked as complete by Direct Flight
            if (element.hasAttribute('data-direct-flight-complete')) {
                continue;
            }
            
            // Skip fields marked as complete by Declared Values
            if (element.hasAttribute('data-declared-values-complete')) {
                continue;
            }
            
            // Skip fields marked as complete by Insurance
            if (element.hasAttribute('data-insurance-complete')) {
                continue;
            }
            
            // Skip fields marked as complete by Prepaid/Collect (fields 24 or 25 when greyed out)
            if (element.hasAttribute('data-prepaid-collect-complete')) {
                continue;
            }
            
            // Skip fields marked as complete by Dimensions (fields 34-39 when no corresponding row exists)
            if (element.hasAttribute('data-dimensions-complete')) {
                continue;
            }
            
            // Skip field 99 if logo is complete
            if (name.startsWith('99') && element.hasAttribute('data-logo-complete')) {
                continue;
            }
            
            // Skip field 29 - optional field, not counted as missing
            if (name.startsWith('29')) {
                continue;
            }
            
            // Special validation for field 26 - must match total PCS
            if (name.startsWith('26')) {
                if (!isField26Valid(element)) {
                    const formGroup = element.closest('.form-group');
                    let fieldLabel = name;
                    
                    if (formGroup) {
                        const label = formGroup.querySelector('label');
                        if (label) {
                            fieldLabel = label.textContent.trim();
                        }
                    }
                    
                    const totalPCS = calculateTotalPCS();
                    const fieldValue = element.value.trim();
                    const inputValue = parseInt(fieldValue);
                    
                    // Add message about mismatch
                    let message = fieldLabel;
                    if (!fieldValue || fieldValue === '') {
                        message = `${fieldLabel} (must match total PCS: ${totalPCS})`;
                    } else if (!isNaN(inputValue)) {
                        message = `${fieldLabel} (${inputValue} does not match total PCS: ${totalPCS})`;
                    } else {
                        message = `${fieldLabel} (must match total PCS: ${totalPCS})`;
                    }
                    
                    // Avoid duplicates
                    if (!missingFields.includes(message)) {
                        missingFields.push(message);
                    }
                }
                continue; // Skip normal empty check for field 26
            }
            
            // Check if field is empty
            let isEmpty = false;
            
            if (element.type === 'radio') {
                // Only process each radio group once
                if (processedRadioGroups.has(name)) {
                    continue;
                }
                processedRadioGroups.add(name);
                
                const radioGroup = form.querySelectorAll(`input[type="radio"][name="${name}"]`);
                const hasChecked = Array.from(radioGroup).some(radio => radio.checked);
                isEmpty = !hasChecked;
            } else if (element.type === 'checkbox') {
                // For fields 24 and 25, count unchecked checkboxes as missing
                if (name.startsWith('24') || name.startsWith('25')) {
                    isEmpty = !element.checked;
                } else {
                    // Don't count other unchecked checkboxes as missing
                    isEmpty = false;
                }
            } else if (element.tagName === 'SELECT') {
                isEmpty = !element.value || element.value === '';
            } else {
                isEmpty = !element.value || element.value.trim() === '';
            }
            
            if (isEmpty) {
                // Get the label for this field
                const formGroup = element.closest('.form-group');
                let fieldLabel = name;
                
                if (formGroup) {
                    const label = formGroup.querySelector('label');
                    if (label) {
                        fieldLabel = label.textContent.trim();
                    }
                }
                
                // Avoid duplicates
                if (!missingFields.includes(fieldLabel)) {
                    missingFields.push(fieldLabel);
                }
            }
        }
    });
    
    return missingFields;
}

// Count missing fields in a form and update label colors
function countMissingFields(form) {
    if (!form) return 0;
    
    let missingCount = 0;
    const formElements = form.elements;
    
    // First, reset all label colors to default (except special labels that should stay red)
    const allLabels = form.querySelectorAll('label');
    allLabels.forEach(label => {
        // Only reset if it's not a special label (like Dangerous Goods)
        if (!label.closest('.contact-select-group')) {
            label.style.color = '';
        }
    });
    
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        const name = element.name;
        
        if (!name) continue; // Skip elements without names
        
        // Skip buttons and hidden inputs
        if (element.type === 'button' || element.type === 'submit' || element.type === 'hidden') {
            continue;
        }
        
        // Skip fields marked as complete by Direct Flight (fields 11, 12, 13, 14 when Direct Flight is Yes)
        if (element.hasAttribute('data-direct-flight-complete')) {
            continue;
        }
        
        // Skip fields marked as complete by Declared Values (fields 16, 17 when Declared Values is No)
        if (element.hasAttribute('data-declared-values-complete')) {
            continue;
        }
        
        // Skip fields marked as complete by Insurance (field 21 when Insurance is No)
        if (element.hasAttribute('data-insurance-complete')) {
            continue;
        }
        
        // Skip fields marked as complete by Prepaid/Collect (fields 24 or 25 when greyed out)
        if (element.hasAttribute('data-prepaid-collect-complete')) {
            continue;
        }
        
        // Skip fields marked as complete by Dimensions (fields 34-39 when no corresponding row exists)
        if (element.hasAttribute('data-dimensions-complete')) {
            continue;
        }
        
        // Skip field 99 if logo is complete
        if (name.startsWith('99') && element.hasAttribute('data-logo-complete')) {
            continue;
        }
        
        // Skip field 29 - optional field, not counted as missing
        if (name.startsWith('29')) {
            continue;
        }
        
        // Special validation for field 26 - must match total PCS
        if (name.startsWith('26')) {
            if (!isField26Valid(element)) {
                missingCount++;
                // Make the label red for missing fields
                const formGroup = element.closest('.form-group');
                if (formGroup) {
                    const label = formGroup.querySelector('label');
                    if (label) {
                        label.style.color = 'red';
                    }
                }
                // Keep field red
                element.style.borderColor = '#c62828';
                element.style.backgroundColor = '#ffebee';
            } else {
                // Field is valid, ensure label is not red
                const formGroup = element.closest('.form-group');
                if (formGroup) {
                    const label = formGroup.querySelector('label');
                    if (label && !label.closest('.contact-select-group')) {
                        label.style.color = '';
                    }
                }
                element.style.borderColor = '';
                element.style.backgroundColor = '';
            }
            continue; // Skip normal empty check for field 26
        }
        
        // Check if field is empty
        let isEmpty = false;
        
        if (element.type === 'checkbox' || element.type === 'radio') {
            // For checkboxes and radios, check if at least one in the group is checked
            if (element.type === 'radio') {
                const radioGroup = form.querySelectorAll(`input[type="radio"][name="${name}"]`);
                const hasChecked = Array.from(radioGroup).some(radio => radio.checked);
                isEmpty = !hasChecked;
            } else {
                // For fields 24 and 25, count unchecked checkboxes as missing
                if (name.startsWith('24') || name.startsWith('25')) {
                    isEmpty = !element.checked;
                } else {
                    // For other checkboxes, empty means unchecked (but this might not be "missing" depending on requirements)
                    isEmpty = false; // Don't count unchecked checkboxes as missing
                }
            }
        } else if (element.tagName === 'SELECT') {
            isEmpty = !element.value || element.value === '';
        } else {
            isEmpty = !element.value || element.value.trim() === '';
        }
        
        if (isEmpty) {
            missingCount++;
            // Make the label red for missing fields
            const formGroup = element.closest('.form-group');
            if (formGroup) {
                const label = formGroup.querySelector('label');
                if (label) {
                    label.style.color = 'red';
                }
            }
        } else {
            // Field is not empty, ensure label is not red (unless it's a special case)
            const formGroup = element.closest('.form-group');
            if (formGroup) {
                const label = formGroup.querySelector('label');
                if (label && !label.closest('.contact-select-group')) {
                    // Only reset if it's not a special label that should stay red
                    label.style.color = '';
                }
            }
        }
    }
    
    return missingCount;
}

// Map field prefixes to their corresponding prompts
const fieldToPromptMapping = {
    '04': { prompt: 'shipperSelect', label: 'Shipper', tab: 'contacts' },
    '05': { prompt: 'consigneeSelect', label: 'Consignee', tab: 'contacts' },
    '06': { prompt: 'consigneeSelect', label: 'Consignee', tab: 'contacts' },
    '07': { prompt: 'consigneeSelect', label: 'Consignee', tab: 'contacts' },
    '01': { prompt: 'airlineSelect1', label: 'Issuing Carrier', tab: 'routing' },
    '10': { prompt: 'airlineSelect1', label: 'Issuing Carrier', tab: 'routing' },
    '09': { prompt: 'destinationSelect', label: 'Destination', tab: 'routing' },
    '18': { prompt: 'destinationSelect', label: 'Destination', tab: 'routing' },
    '11': { prompt: 'directFlightSelect', label: 'Direct Flight', tab: 'routing' },
    '12': { prompt: 'directFlightSelect', label: 'Direct Flight', tab: 'routing' },
    '13': { prompt: 'interlineCarrierSelect1', label: 'Interline Carrier 1', tab: 'routing' },
    '14': { prompt: 'interlineCarrierSelect1', label: 'Interline Carrier 1', tab: 'routing' },
    '16': { prompt: 'declaredValuesSelect', label: 'Declared Values', tab: 'billing' },
    '17': { prompt: 'declaredValuesSelect', label: 'Declared Values', tab: 'billing' },
    '21': { prompt: 'insuranceSelect', label: 'Insurance', tab: 'billing' },
    '24': { prompt: 'prepaidCollectSelect', label: 'Prepaid or Collect', tab: 'billing' },
    '25': { prompt: 'prepaidCollectSelect', label: 'Prepaid or Collect', tab: 'billing' }
};

// Update prompt indicators based on missing lower section fields
function updatePromptIndicators() {
    // Get all forms with lower section fields
    const forms = [];
    const generatedForm = document.getElementById('generatedForm');
    const contactFieldsForm = document.getElementById('contactFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    
    if (generatedForm) forms.push(generatedForm);
    if (contactFieldsForm) forms.push(contactFieldsForm);
    if (billingFieldsForm) forms.push(billingFieldsForm);
    if (dimensionsFieldsForm) forms.push(dimensionsFieldsForm);
    
    // Track which prompts need indicators
    const promptNeeds = {};
    
    // Scan all forms for fields with red labels (empty fields)
    forms.forEach(form => {
        if (!form) return;
        
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            const name = element.name;
            
            if (!name) continue;
            
            // Skip buttons and hidden inputs
            if (element.type === 'button' || element.type === 'submit' || element.type === 'hidden') {
                continue;
            }
            
            // Skip fields marked as complete
            if (element.hasAttribute('data-direct-flight-complete') ||
                element.hasAttribute('data-declared-values-complete') ||
                element.hasAttribute('data-insurance-complete') ||
                element.hasAttribute('data-prepaid-collect-complete') ||
                element.hasAttribute('data-dimensions-complete') ||
                element.hasAttribute('data-logo-complete')) {
                continue;
            }
            
            // Check if field is empty
            let isEmpty = false;
            if (element.type === 'checkbox' || element.type === 'radio') {
                if (element.type === 'radio') {
                    const radioGroup = form.querySelectorAll(`input[type="radio"][name="${name}"]`);
                    const hasChecked = Array.from(radioGroup).some(radio => radio.checked);
                    isEmpty = !hasChecked;
                } else {
                    if (name.startsWith('24') || name.startsWith('25')) {
                        isEmpty = !element.checked;
                    }
                }
            } else if (element.tagName === 'SELECT') {
                isEmpty = !element.value || element.value === '';
            } else {
                isEmpty = !element.value || element.value.trim() === '';
            }
            
            // Check if label is red (field is missing)
            if (isEmpty) {
                const formGroup = element.closest('.form-group');
                if (formGroup) {
                    const label = formGroup.querySelector('label');
                    if (label && label.style.color === 'red') {
                        // Extract field prefix (first 2 digits)
                        const fieldPrefix = name.substring(0, 2);
                        const mapping = fieldToPromptMapping[fieldPrefix];
                        
                        if (mapping) {
                            const promptId = mapping.prompt;
                            if (!promptNeeds[promptId]) {
                                promptNeeds[promptId] = {
                                    prompt: promptId,
                                    label: mapping.label,
                                    tab: mapping.tab,
                                    fields: []
                                };
                            }
                            promptNeeds[promptId].fields.push(name);
                        }
                    }
                }
            }
        }
    });
    
    // Add/update indicators on prompts
    Object.keys(promptNeeds).forEach(promptId => {
        const promptElement = document.getElementById(promptId);
        if (promptElement) {
            const promptGroup = promptElement.closest('.contact-select-group');
            if (promptGroup) {
                const label = promptGroup.querySelector('label');
                
                // Remove existing indicator
                const existingIndicator = promptGroup.querySelector('.prompt-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                
                // Add new indicator badge
                const indicator = document.createElement('span');
                indicator.className = 'prompt-indicator';
                indicator.style.cssText = 'margin-left: 8px; padding: 2px 8px; background: #dc3545; color: white; border-radius: 12px; font-size: 11px; font-weight: 600;';
                indicator.textContent = `${promptNeeds[promptId].fields.length} field${promptNeeds[promptId].fields.length > 1 ? 's' : ''}`;
                indicator.title = `Missing fields: ${promptNeeds[promptId].fields.join(', ')}`;
                
                if (label) {
                    label.appendChild(indicator);
                }
                
                // Highlight the prompt group
                promptGroup.style.borderLeft = '3px solid #dc3545';
                promptGroup.style.paddingLeft = '8px';
            }
        }
    });
    
    // Remove indicators from prompts that don't need them
    const allPrompts = ['shipperSelect', 'consigneeSelect', 'airlineSelect1', 'destinationSelect', 
                        'directFlightSelect', 'interlineCarrierSelect1', 'interlineCarrierSelect2',
                        'declaredValuesSelect', 'insuranceSelect', 'prepaidCollectSelect'];
    
    allPrompts.forEach(promptId => {
        if (!promptNeeds[promptId]) {
            const promptElement = document.getElementById(promptId);
            if (promptElement) {
                const promptGroup = promptElement.closest('.contact-select-group');
                if (promptGroup) {
                    const indicator = promptGroup.querySelector('.prompt-indicator');
                    if (indicator) {
                        indicator.remove();
                    }
                    promptGroup.style.borderLeft = '';
                    promptGroup.style.paddingLeft = '';
                }
            }
        }
    });
}

// Update individual tab indicator
function updateTabIndicator(tabName, missingCount) {
    const indicator = document.getElementById(`${tabName}-validation-indicator`);
    if (!indicator) return;
    
    if (missingCount === 0) {
        indicator.className = 'tab-validation-indicator complete';
        indicator.textContent = '';
    } else {
        indicator.className = 'tab-validation-indicator missing';
        indicator.textContent = missingCount.toString();
    }
}

// Show custom missing fields confirmation modal
function showMissingFieldsModal(missingFields) {
    return new Promise((resolve) => {
        if (!missingFieldsModal || !missingFieldsList) {
            // Fallback to browser confirm if modal elements not found
            const fieldList = missingFields.map(field => `• ${field}`).join('\n');
            const message = `The following fields are missing:\n\n${fieldList}\n\nDo you want to continue anyway?`;
            resolve(confirm(message));
            return;
        }
        
        // Populate the missing fields list
        missingFieldsList.innerHTML = missingFields.map(field => 
            `<div style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">• ${field}</div>`
        ).join('');
        
        // Store the callback
        missingFieldsCallback = resolve;
        
        // Show the modal
        missingFieldsModal.style.display = 'flex';
    });
}

// Show custom missing fields confirmation modal
function showMissingFieldsModal(missingFields) {
    return new Promise((resolve) => {
        if (!missingFieldsModal || !missingFieldsList) {
            // Fallback to browser confirm if modal elements not found
            const fieldList = missingFields.map(field => `• ${field}`).join('\n');
            const message = `The following fields are missing:\n\n${fieldList}\n\nDo you want to continue anyway?`;
            resolve(confirm(message));
            return;
        }
        
        // Populate the missing fields list
        missingFieldsList.innerHTML = missingFields.map(field => 
            `<div style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">• ${field}</div>`
        ).join('');
        
        // Store the callback
        missingFieldsCallback = resolve;
        
        // Show the modal
        missingFieldsModal.style.display = 'flex';
    });
}
// ==================== Commodity Functions ====================

// Populate commodity dropdown from user profile
function populateCommodityDropdown() {
    const commoditySelect = document.getElementById('commoditySelect');
    if (!commoditySelect) return;
    
    // Clear existing options except the first one
    commoditySelect.innerHTML = '<option value="">-- Select Commodity --</option>';
    
    const profile = getUserProfile();
    if (profile && profile.field33 && Array.isArray(profile.field33) && profile.field33.length > 0) {
        profile.field33.forEach((item) => {
            if (item.commodity) {
                const option = document.createElement('option');
                option.value = item.commodity;
                option.textContent = item.commodity;
                commoditySelect.appendChild(option);
            }
        });
    }
}

// Fill field 33 with autofill text from selected commodity
function fillField33FromCommodity(commodityName) {
    const profile = getUserProfile();
    if (!profile || !profile.field33 || !Array.isArray(profile.field33)) {
        console.warn('Commodity data not found in user profile');
        return;
    }
    
    const commodity = profile.field33.find(item => item.commodity === commodityName);
    if (!commodity || !commodity.autofillText) {
        console.warn(`Autofill text not found for commodity: ${commodityName}`);
        return;
    }
    
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    const formsToCheck = [generatedForm];
    if (billingFieldsForm) {
        formsToCheck.push(billingFieldsForm);
    }
    if (dimensionsFieldsForm) {
        formsToCheck.push(dimensionsFieldsForm);
    }
    
    for (const form of formsToCheck) {
        if (!form) continue;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith('33')) {
                element.value = commodity.autofillText;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`Filled field ${element.name} with autofill text for commodity: ${commodityName}`);
                setTimeout(() => updateTabValidationIndicators(), 50);
                return;
            }
        }
    }
}

// ==================== Dimensions Functions ====================

// Add a new dimensions row
function addDimensionsRow() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Count existing rows
    const existingRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    if (existingRows.length >= 6) {
        return; // Maximum 6 rows
    }
    
    const newRow = document.createElement('div');
    newRow.className = 'dimensions-row';
    newRow.setAttribute('data-row-index', existingRows.length);
    
    newRow.innerHTML = `
        <input type="number" class="dim-input dim-length" placeholder="L (cm)" min="0" step="0.1">
        <input type="number" class="dim-input dim-width" placeholder="W (cm)" min="0" step="0.1">
        <input type="number" class="dim-input dim-height" placeholder="H (cm)" min="0" step="0.1">
        <input type="number" class="dim-input dim-qty" placeholder="QTY" min="1" step="1">
        <button type="button" class="dim-remove-btn">Remove</button>
    `;
    
    dimensionsContainer.appendChild(newRow);
    
    // Show remove buttons on all rows (since we now have more than one)
    // But keep add button only in first row
    const allRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    if (allRows.length > 1) {
        allRows.forEach((row, index) => {
            const removeBtn = row.querySelector('.dim-remove-btn');
            const addBtn = row.querySelector('.dim-add-box-btn');
            
            // Show remove button on all rows
            if (removeBtn) {
                removeBtn.style.display = 'block';
            }
            
            // Keep add button only in first row, hide it in other rows
            if (addBtn) {
                addBtn.style.display = index === 0 ? 'block' : 'none';
            }
        });
    }
    
    // Update add button state
    updateDimensionsAddButton();
    
    // Set up field updates when rows are added
    if (existingRows.length === 1) {
        // This is the second row being added
        setTimeout(() => setupDimensionsField35Update(), 50);
    } else if (existingRows.length === 2) {
        // This is the third row being added
        setTimeout(() => setupDimensionsField36Update(), 50);
    } else if (existingRows.length === 3) {
        // This is the fourth row being added
        setTimeout(() => setupDimensionsField37Update(), 50);
    } else if (existingRows.length === 4) {
        // This is the fifth row being added
        setTimeout(() => setupDimensionsField38Update(), 50);
    } else if (existingRows.length === 5) {
        // This is the sixth row being added
        setTimeout(() => setupDimensionsField39Update(), 50);
    }
    
    // Update field 40 when a new row is added
    setTimeout(() => updateField40(), 100);
    
    // Update fields 34-39 based on number of active rows
    updateDimensionsFieldsState();
}

// Remove a dimensions row
function removeDimensionsRow(row) {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer || !row) return;
    
    row.remove();
    
    // Re-index remaining rows
    const remainingRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    remainingRows.forEach((remainingRow, index) => {
        remainingRow.setAttribute('data-row-index', index);
    });
    
    // Hide remove buttons if only one row remains
    if (remainingRows.length === 1) {
        const removeBtn = remainingRows[0].querySelector('.dim-remove-btn');
        if (removeBtn) {
            removeBtn.style.display = 'none';
        }
    }
    
    // Update add button state
    updateDimensionsAddButton();
    
    // Clear all field update event listeners by removing and re-adding them
    // This ensures we don't have duplicate listeners
    remainingRows.forEach((row, index) => {
        const lengthInput = row.querySelector('.dim-length');
        const widthInput = row.querySelector('.dim-width');
        const heightInput = row.querySelector('.dim-height');
        const qtyInput = row.querySelector('.dim-qty');
        
        if (lengthInput && widthInput && heightInput && qtyInput) {
            // Store current values
            const lengthValue = lengthInput.value;
            const widthValue = widthInput.value;
            const heightValue = heightInput.value;
            const qtyValue = qtyInput.value;
            
            // Clone inputs to remove all event listeners
            const newLengthInput = lengthInput.cloneNode(true);
            const newWidthInput = widthInput.cloneNode(true);
            const newHeightInput = heightInput.cloneNode(true);
            const newQtyInput = qtyInput.cloneNode(true);
            
            // Restore values
            newLengthInput.value = lengthValue;
            newWidthInput.value = widthValue;
            newHeightInput.value = heightValue;
            newQtyInput.value = qtyValue;
            
            lengthInput.parentNode.replaceChild(newLengthInput, lengthInput);
            widthInput.parentNode.replaceChild(newWidthInput, widthInput);
            heightInput.parentNode.replaceChild(newHeightInput, heightInput);
            qtyInput.parentNode.replaceChild(newQtyInput, qtyInput);
        }
    });
    
    // Re-setup field update functions for remaining rows based on their new indices
    // and trigger updates to populate fields with current values
    setTimeout(() => {
        // Row 0 (index 0) -> Field 34
        if (remainingRows.length >= 1) {
            setupDimensionsField34Update();
            triggerFieldUpdate(0, 34);
        } else {
            clearField(34);
        }
        
        // Row 1 (index 1) -> Field 35
        if (remainingRows.length >= 2) {
            setupDimensionsField35Update();
            triggerFieldUpdate(1, 35);
        } else {
            clearField(35);
        }
        
        // Row 2 (index 2) -> Field 36
        if (remainingRows.length >= 3) {
            setupDimensionsField36Update();
            triggerFieldUpdate(2, 36);
        } else {
            clearField(36);
        }
        
        // Row 3 (index 3) -> Field 37
        if (remainingRows.length >= 4) {
            setupDimensionsField37Update();
            triggerFieldUpdate(3, 37);
        } else {
            clearField(37);
        }
        
        // Row 4 (index 4) -> Field 38
        if (remainingRows.length >= 5) {
            setupDimensionsField38Update();
            triggerFieldUpdate(4, 38);
        } else {
            clearField(38);
        }
        
        // Row 5 (index 5) -> Field 39
        if (remainingRows.length >= 6) {
            setupDimensionsField39Update();
            triggerFieldUpdate(5, 39);
        } else {
            clearField(39);
        }
        
        // Update field 40 with new total QTY after row removal
        updateField40();
        
        // Update fields 34-39 based on number of active rows
        updateDimensionsFieldsState();
    }, 50);
}

// Helper function to trigger field update for a specific row index
function triggerFieldUpdate(rowIndex, fieldNumber) {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    const row = dimensionsContainer.querySelector(`.dimensions-row[data-row-index="${rowIndex}"]`);
    if (!row) return;
    
    const lengthInput = row.querySelector('.dim-length');
    const widthInput = row.querySelector('.dim-width');
    const heightInput = row.querySelector('.dim-height');
    const qtyInput = row.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    const length = lengthInput.value.trim();
    const width = widthInput.value.trim();
    const height = heightInput.value.trim();
    const qty = qtyInput.value.trim();
    
    // Check if all 4 inputs have values
    if (length && width && height && qty) {
        // Format: D.M.S (cm) L*W*H : QTY PCS
        const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
        
        // Find and fill the field
        const billingFieldsForm = document.getElementById('billingFieldsForm');
        const generatedForm = document.getElementById('generatedForm');
        const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
        const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
        
        formsToCheck.forEach(form => {
            if (!form) return;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith(fieldNumber.toString())) {
                    element.value = formattedValue;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    break;
                }
            }
        });
    } else {
        // Clear the field if any input is empty
        clearField(fieldNumber);
    }
}

// Helper function to clear a field
function clearField(fieldNumber) {
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const generatedForm = document.getElementById('generatedForm');
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
    
    formsToCheck.forEach(form => {
        if (!form) return;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name.startsWith(fieldNumber.toString())) {
                element.value = '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                break;
            }
        }
    });
}

// Update add button state based on number of rows
function updateDimensionsAddButton() {
    const addDimensionsBoxBtn = document.getElementById('addDimensionsBoxBtn');
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    
    if (!addDimensionsBoxBtn || !dimensionsContainer) return;
    
    const existingRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    addDimensionsBoxBtn.disabled = existingRows.length >= 6;
    
    // Update minimize button visibility
    updateMinimizeButton();
}

// Update minimize button visibility
function updateMinimizeButton() {
    const minimizeDimensionsBtn = document.getElementById('minimizeDimensionsBtn');
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    
    if (!minimizeDimensionsBtn || !dimensionsContainer) return;
    
    const existingRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    const isMinimized = dimensionsContainer.dataset.minimized === 'true';
    
    // Show minimize button if there are 2+ rows
    if (existingRows.length > 1) {
        minimizeDimensionsBtn.style.display = 'flex';
        // Rotate arrow based on state (down when expanded, up when minimized)
        if (isMinimized) {
            minimizeDimensionsBtn.classList.add('expanded');
        } else {
            minimizeDimensionsBtn.classList.remove('expanded');
        }
    } else {
        minimizeDimensionsBtn.style.display = 'none';
    }
}

// Toggle minimize/expand dimensions
function toggleDimensionsMinimize() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    const minimizeDimensionsBtn = document.getElementById('minimizeDimensionsBtn');
    
    if (!dimensionsContainer || !minimizeDimensionsBtn) return;
    
    const allRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    const isMinimized = dimensionsContainer.dataset.minimized === 'true';
    
    if (isMinimized) {
        // Expand - show all rows and inputs
        allRows.forEach(row => {
            row.style.display = '';
            // Show all inputs in row 1
            if (row.getAttribute('data-row-index') === '0') {
                const inputs = row.querySelectorAll('.dim-input');
                inputs.forEach(input => {
                    input.style.display = '';
                });
                // Show the add button
                const addBtn = row.querySelector('.dim-add-box-btn');
                if (addBtn) {
                    addBtn.style.display = '';
                }
                // Hide the message
                const messageDiv = row.querySelector('.dim-minimize-message');
                if (messageDiv) {
                    messageDiv.style.display = 'none';
                }
            }
        });
        
        dimensionsContainer.dataset.minimized = 'false';
        minimizeDimensionsBtn.classList.remove('expanded');
    } else {
        // Check if any row has blank fields - don't allow minimization if so
        let hasBlankFields = false;
        allRows.forEach(row => {
            const lengthInput = row.querySelector('.dim-length');
            const widthInput = row.querySelector('.dim-width');
            const heightInput = row.querySelector('.dim-height');
            const qtyInput = row.querySelector('.dim-qty');
            
            if (!lengthInput || !widthInput || !heightInput || !qtyInput) {
                hasBlankFields = true;
                return;
            }
            
            if (!lengthInput.value.trim() || !widthInput.value.trim() || 
                !heightInput.value.trim() || !qtyInput.value.trim()) {
                hasBlankFields = true;
            }
        });
        
        if (hasBlankFields) {
            alert('Please fill in all fields in all dimensions rows before minimizing.');
            return;
        }
        
        // Calculate total PCS (sum of all QTY fields)
        let totalPCS = 0;
        allRows.forEach(row => {
            const qtyInput = row.querySelector('.dim-qty');
            if (qtyInput && qtyInput.value.trim()) {
                const qty = parseInt(qtyInput.value.trim());
                if (!isNaN(qty)) {
                    totalPCS += qty;
                }
            }
        });
        
        // Minimize - hide all rows except first, hide inputs in first row, show message
        allRows.forEach((row, index) => {
            if (index === 0) {
                // Hide all inputs in row 1
                const inputs = row.querySelectorAll('.dim-input');
                inputs.forEach(input => {
                    input.style.display = 'none';
                });
                
                // Hide the add button
                const addBtn = row.querySelector('.dim-add-box-btn');
                if (addBtn) {
                    addBtn.style.display = 'none';
                }
                
                // Create and show message in the same row, centered where inputs were
                let messageDiv = row.querySelector('.dim-minimize-message');
                if (!messageDiv) {
                    messageDiv = document.createElement('div');
                    messageDiv.className = 'dim-minimize-message';
                    row.appendChild(messageDiv);
                }
                messageDiv.textContent = `${totalPCS} PCS of different sizes`;
                messageDiv.style.display = 'block';
            } else {
                row.style.display = 'none';
            }
        });
        
        dimensionsContainer.dataset.minimized = 'true';
        minimizeDimensionsBtn.classList.add('expanded');
    }
}

// Set up event listeners for first row dimensions inputs to update field 34
function setupDimensionsField34Update() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Get the first row
    const firstRow = dimensionsContainer.querySelector('.dimensions-row[data-row-index="0"]');
    if (!firstRow) return;
    
    const lengthInput = firstRow.querySelector('.dim-length');
    const widthInput = firstRow.querySelector('.dim-width');
    const heightInput = firstRow.querySelector('.dim-height');
    const qtyInput = firstRow.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    // Function to update field 34
    const updateField34 = () => {
        const length = lengthInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();
        const qty = qtyInput.value.trim();
        
        // Check if all 4 inputs have values
        if (length && width && height && qty) {
            // Format: D.M.S (cm) L*W*H : QTY PCS
            const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
            
            // Find and fill field 34
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('34')) {
                        element.value = formattedValue;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        } else {
            // Clear field 34 if any input is empty
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('34')) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        }
    };
    
    // Add event listeners to all 4 inputs
    [lengthInput, widthInput, heightInput, qtyInput].forEach(input => {
        input.addEventListener('input', updateField34);
        input.addEventListener('change', updateField34);
    });
}

// Set up event listeners for second row dimensions inputs to update field 35
function setupDimensionsField35Update() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Get the second row
    const secondRow = dimensionsContainer.querySelector('.dimensions-row[data-row-index="1"]');
    if (!secondRow) return;
    
    const lengthInput = secondRow.querySelector('.dim-length');
    const widthInput = secondRow.querySelector('.dim-width');
    const heightInput = secondRow.querySelector('.dim-height');
    const qtyInput = secondRow.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    // Function to update field 35
    const updateField35 = () => {
        const length = lengthInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();
        const qty = qtyInput.value.trim();
        
        // Check if all 4 inputs have values
        if (length && width && height && qty) {
            // Format: D.M.S (cm) L*W*H : QTY PCS
            const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
            
            // Find and fill field 35
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('35')) {
                        element.value = formattedValue;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        } else {
            // Clear field 35 if any input is empty
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('35')) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        }
    };
    
    // Add event listeners to all 4 inputs
    [lengthInput, widthInput, heightInput, qtyInput].forEach(input => {
        input.addEventListener('input', updateField35);
        input.addEventListener('change', updateField35);
    });
}

// Set up event listeners for third row dimensions inputs to update field 36
function setupDimensionsField36Update() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Get the third row
    const thirdRow = dimensionsContainer.querySelector('.dimensions-row[data-row-index="2"]');
    if (!thirdRow) return;
    
    const lengthInput = thirdRow.querySelector('.dim-length');
    const widthInput = thirdRow.querySelector('.dim-width');
    const heightInput = thirdRow.querySelector('.dim-height');
    const qtyInput = thirdRow.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    // Function to update field 36
    const updateField36 = () => {
        const length = lengthInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();
        const qty = qtyInput.value.trim();
        
        // Check if all 4 inputs have values
        if (length && width && height && qty) {
            // Format: D.M.S (cm) L*W*H : QTY PCS
            const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
            
            // Find and fill field 36
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('36')) {
                        element.value = formattedValue;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        } else {
            // Clear field 36 if any input is empty
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('36')) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        }
    };
    
    // Add event listeners to all 4 inputs
    [lengthInput, widthInput, heightInput, qtyInput].forEach(input => {
        input.addEventListener('input', updateField36);
        input.addEventListener('change', updateField36);
    });
}

// Set up event listeners for fourth row dimensions inputs to update field 37
function setupDimensionsField37Update() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Get the fourth row
    const fourthRow = dimensionsContainer.querySelector('.dimensions-row[data-row-index="3"]');
    if (!fourthRow) return;
    
    const lengthInput = fourthRow.querySelector('.dim-length');
    const widthInput = fourthRow.querySelector('.dim-width');
    const heightInput = fourthRow.querySelector('.dim-height');
    const qtyInput = fourthRow.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    // Function to update field 37
    const updateField37 = () => {
        const length = lengthInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();
        const qty = qtyInput.value.trim();
        
        // Check if all 4 inputs have values
        if (length && width && height && qty) {
            // Format: D.M.S (cm) L*W*H : QTY PCS
            const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
            
            // Find and fill field 37
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('37')) {
                        element.value = formattedValue;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        } else {
            // Clear field 37 if any input is empty
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('37')) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        }
    };
    
    // Add event listeners to all 4 inputs
    [lengthInput, widthInput, heightInput, qtyInput].forEach(input => {
        input.addEventListener('input', updateField37);
        input.addEventListener('change', updateField37);
    });
}

// Set up event listeners for fifth row dimensions inputs to update field 38
function setupDimensionsField38Update() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Get the fifth row
    const fifthRow = dimensionsContainer.querySelector('.dimensions-row[data-row-index="4"]');
    if (!fifthRow) return;
    
    const lengthInput = fifthRow.querySelector('.dim-length');
    const widthInput = fifthRow.querySelector('.dim-width');
    const heightInput = fifthRow.querySelector('.dim-height');
    const qtyInput = fifthRow.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    // Function to update field 38
    const updateField38 = () => {
        const length = lengthInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();
        const qty = qtyInput.value.trim();
        
        // Check if all 4 inputs have values
        if (length && width && height && qty) {
            // Format: D.M.S (cm) L*W*H : QTY PCS
            const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
            
            // Find and fill field 38
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('38')) {
                        element.value = formattedValue;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        } else {
            // Clear field 38 if any input is empty
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('38')) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        }
    };
    
    // Add event listeners to all 4 inputs
    [lengthInput, widthInput, heightInput, qtyInput].forEach(input => {
        input.addEventListener('input', updateField38);
        input.addEventListener('change', updateField38);
    });
}

// Set up event listeners for sixth row dimensions inputs to update field 39
function setupDimensionsField39Update() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    // Get the sixth row
    const sixthRow = dimensionsContainer.querySelector('.dimensions-row[data-row-index="5"]');
    if (!sixthRow) return;
    
    const lengthInput = sixthRow.querySelector('.dim-length');
    const widthInput = sixthRow.querySelector('.dim-width');
    const heightInput = sixthRow.querySelector('.dim-height');
    const qtyInput = sixthRow.querySelector('.dim-qty');
    
    if (!lengthInput || !widthInput || !heightInput || !qtyInput) return;
    
    // Function to update field 39
    const updateField39 = () => {
        const length = lengthInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();
        const qty = qtyInput.value.trim();
        
        // Check if all 4 inputs have values
        if (length && width && height && qty) {
            // Format: D.M.S (cm) L*W*H : QTY PCS
            const formattedValue = `D.M.S (cm) ${length}*${width}*${height} : ${qty} PCS`;
            
            // Find and fill field 39
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('39')) {
                        element.value = formattedValue;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        } else {
            // Clear field 39 if any input is empty
            const billingFieldsForm = document.getElementById('billingFieldsForm');
            const generatedForm = document.getElementById('generatedForm');
            const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
            const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
            
            formsToCheck.forEach(form => {
                if (!form) return;
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name.startsWith('39')) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }
            });
        }
    };
    
    // Add event listeners to all 4 inputs
    [lengthInput, widthInput, heightInput, qtyInput].forEach(input => {
        input.addEventListener('input', updateField39);
        input.addEventListener('change', updateField39);
    });
}

// Update fields 34-39 state based on number of active dimension rows
// Fields should be greyed out and marked complete if there's no corresponding row
function updateDimensionsFieldsState() {
    const dimensionsContainer = document.getElementById('dimensionsContainer');
    if (!dimensionsContainer) return;
    
    const activeRows = dimensionsContainer.querySelectorAll('.dimensions-row');
    const numActiveRows = activeRows.length;
    
    const dimensionsFieldsForm = document.getElementById('dimensionsFieldsForm');
    const billingFieldsForm = document.getElementById('billingFieldsForm');
    const generatedForm = document.getElementById('generatedForm');
    const formsToCheck = [dimensionsFieldsForm, billingFieldsForm, generatedForm].filter(f => f);
    
    // Field mapping: field number -> minimum required rows (1-indexed)
    const fieldToRowMapping = {
        34: 1,  // Field 34 requires at least 1 row
        35: 2,  // Field 35 requires at least 2 rows
        36: 3,  // Field 36 requires at least 3 rows
        37: 4,  // Field 37 requires at least 4 rows
        38: 5,  // Field 38 requires at least 5 rows
        39: 6   // Field 39 requires at least 6 rows
    };
    
    // Update each field
    Object.keys(fieldToRowMapping).forEach(fieldNum => {
        const requiredRows = fieldToRowMapping[fieldNum];
        const shouldBeActive = numActiveRows >= requiredRows;
        
        formsToCheck.forEach(form => {
            if (!form) return;
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.name.startsWith(fieldNum)) {
                    if (shouldBeActive) {
                        // Enable field - remove greyed out state
                        element.disabled = false;
                        element.style.backgroundColor = '';
                        element.style.color = '';
                        element.style.cursor = '';
                        element.removeAttribute('data-dimensions-complete');
                        
                        const formGroup = element.closest('.form-group');
                        if (formGroup) {
                            formGroup.style.opacity = '1';
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove any existing checkmarks
                                const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                existingCheckmarks.forEach(span => {
                                    if (span.textContent.includes('✓')) {
                                        span.remove();
                                    }
                                });
                                label.textContent = label.textContent.replace(' ✓', '');
                            }
                        }
                    } else {
                        // Grey out field - mark as complete
                        element.disabled = true;
                        element.style.backgroundColor = '#e9ecef';
                        element.style.color = '#6c757d';
                        element.style.cursor = 'not-allowed';
                        element.setAttribute('data-dimensions-complete', 'true');
                        
                        const formGroup = element.closest('.form-group');
                        if (formGroup) {
                            formGroup.style.opacity = '0.6';
                            const label = formGroup.querySelector('label');
                            if (label) {
                                // Remove any existing checkmarks
                                const existingCheckmarks = label.querySelectorAll('span[style*="color: #28a745"]');
                                existingCheckmarks.forEach(span => {
                                    if (span.textContent.includes('✓')) {
                                        span.remove();
                                    }
                                });
                                label.textContent = label.textContent.replace(' ✓', '');
                                
                                // Add green checkmark
                                const checkmark = document.createElement('span');
                                checkmark.textContent = ' ✓';
                                checkmark.style.color = '#28a745';
                                checkmark.style.fontWeight = 'bold';
                                checkmark.style.marginLeft = '5px';
                                label.appendChild(checkmark);
                            }
                        }
                    }
                    break; // Only update first matching element
                }
            }
        });
    });
    
    // Trigger missing fields count update
    setTimeout(() => {
        if (typeof updateMissingFieldsCount === 'function') {
            updateMissingFieldsCount();
        }
    }, 50);
}