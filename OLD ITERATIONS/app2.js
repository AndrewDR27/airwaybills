// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Module-level variables for state
let pdfDoc = null;
let formFields = [];
let originalPdfBytes = null; // Will store as ArrayBuffer or Uint8Array

// DOM element references (will be initialized when DOM is ready)
let uploadArea, pdfInput, loading, error, formSection, generatedForm;
let submitBtn, downloadBtn, fillPdfBtn, resetBtn, results, resultsContent;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

function initializeApp() {
    // Get DOM elements
    uploadArea = document.getElementById('uploadArea');
    pdfInput = document.getElementById('pdfInput');
    loading = document.getElementById('loading');
    error = document.getElementById('error');
    formSection = document.getElementById('formSection');
    generatedForm = document.getElementById('generatedForm');
    submitBtn = document.getElementById('submitBtn');
    downloadBtn = document.getElementById('downloadBtn');
    fillPdfBtn = document.getElementById('fillPdfBtn');
    resetBtn = document.getElementById('resetBtn');
    results = document.getElementById('results');
    resultsContent = document.getElementById('resultsContent');

    // Verify critical elements exist
    if (!uploadArea || !pdfInput) {
        console.error('Required DOM elements not found');
        showError('Error: Page elements not loaded properly. Please refresh the page.');
        return;
    }

    // Prevent default drag behaviors on the entire document to stop browser from opening PDFs
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // Drag and drop handlers for upload area
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                handlePDF(file);
            } else {
                showError('Please drop a valid PDF file.');
            }
        }
    });

    // File input change handler
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handlePDF(file);
        }
    });

    // Button event handlers - verify buttons exist first
    if (fillPdfBtn) {
        fillPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Fill PDF button clicked - handler triggered');
            handleFillPdf();
        });
        console.log('Fill PDF button event listener attached');
    } else {
        console.error('fillPdfBtn not found');
        showError('Error: Fill PDF button not found on page.');
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownloadJSON);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
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
                    const field = extractFieldInfo(annotation);
                    if (field) {
                        formFields.push(field);
                    }
                }
            });
        }
        
        if (formFields.length === 0) {
            showError('No fillable form fields found in this PDF. Please upload a PDF with form fields.');
            hideLoading();
            return;
        }
        
        generateForm();
        hideLoading();
        showForm();
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
        readOnly: annotation.readOnly || false
    };
    
    // Handle different field types
    switch (fieldType) {
        case 'Tx': // Text field
            field.htmlType = 'text';
            if (annotation.maxLen) {
                field.maxLength = annotation.maxLen;
            }
            if (annotation.multiline) {
                field.htmlType = 'textarea';
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
    
    // Group radio buttons by their group
    const radioGroups = {};
    
    formFields.forEach(field => {
        if (field.htmlType === 'radio') {
            const groupName = field.radioGroup || field.name.split('_')[0];
            if (!radioGroups[groupName]) {
                radioGroups[groupName] = [];
            }
            radioGroups[groupName].push(field);
            return; // Skip individual rendering, will render as group
        }
        
        const formGroup = createFormField(field);
        generatedForm.appendChild(formGroup);
    });
    
    // Render radio button groups
    Object.keys(radioGroups).forEach(groupName => {
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
            
            radioDiv.appendChild(radio);
            radioDiv.appendChild(radioLabel);
            radioContainer.appendChild(radioDiv);
        });
        
        group.appendChild(radioContainer);
        generatedForm.appendChild(group);
    });
}

// Create a form field element
function createFormField(field) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label + (field.required ? ' *' : '');
    formGroup.appendChild(label);
    
    let input;
    
    switch (field.htmlType) {
        case 'textarea':
            input = document.createElement('textarea');
            input.rows = 4;
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
    input.value = field.value || '';
    if (field.required) input.required = true;
    if (field.readOnly) input.disabled = true;
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.placeholder) input.placeholder = field.placeholder;
    
    formGroup.appendChild(input);
    return formGroup;
}

// Fill PDF and download handler
async function handleFillPdf() {
    console.log('Fill PDF button clicked');
    
    if (!generatedForm) {
        showError('Error: Form not found. Please upload a PDF first.');
        return;
    }
    
    if (!generatedForm.checkValidity()) {
        generatedForm.reportValidity();
        return;
    }
    
    if (!originalPdfBytes) {
        showError('Error: Original PDF not available. Please upload a PDF first.');
        return;
    }
    
    showLoading();
    try {
        console.log('Collecting form data...');
        const formData = collectFormData();
        console.log('Form data collected:', formData);
        
        console.log('Filling PDF...');
        const filledPdfBytes = await fillPdfWithData(formData);
        console.log('PDF filled successfully');
        
        // Download the filled PDF
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'filled-form.pdf';
        document.body.appendChild(a); // Required for some browsers
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        hideLoading();
        showError('✓ PDF filled and downloaded successfully!');
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
    
    // Get all form elements
    const formElements = generatedForm.elements;
    
    // Collect all form data manually to ensure we get everything
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
        } else {
            // Text, textarea, etc.
            data[name] = element.value || '';
        }
    }
    
    // Also use FormData as backup for any missed fields
    const formData = new FormData(generatedForm);
    formData.forEach((value, key) => {
        // Only add if not already captured
        if (!(key in data)) {
            data[key] = value;
        }
    });
    
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
async function fillPdfWithData(formData) {
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
    
    // Get all form fields from pdf-lib
    const pdfFields = form.getFields();
    
    console.log('PDF fields found by pdf-lib:', pdfFields.length);
    console.log('Form fields extracted by PDF.js:', formFields.length);
    
    // Create a map of field names to pdf-lib field objects
    const fieldMap = new Map();
    pdfFields.forEach(field => {
        const fieldName = field.getName();
        fieldMap.set(fieldName, field);
        console.log('PDF field name:', fieldName, 'Type:', field.constructor.name);
    });
    
    console.log('Form data to fill:', formData);
    
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
    
    // Fill each field
    formFields.forEach(field => {
        // Skip radio buttons - they'll be handled separately
        if (field.htmlType === 'radio') {
            return;
        }
        
        const pdfFieldName = field.pdfFieldName;
        const formFieldName = field.name;
        const formValue = formData[formFieldName];
        
        console.log(`Attempting to fill field: PDF name="${pdfFieldName}", Form name="${formFieldName}", Value="${formValue}"`);
        
        // Try exact match first
        let pdfField = fieldMap.get(pdfFieldName);
        
        // If not found, try case-insensitive match
        if (!pdfField) {
            for (const [name, fieldObj] of fieldMap.entries()) {
                if (name.toLowerCase() === pdfFieldName.toLowerCase()) {
                    pdfField = fieldObj;
                    console.log(`Found field with case-insensitive match: ${name}`);
                    break;
                }
            }
        }
        
        // If still not found, try partial match
        if (!pdfField) {
            for (const [name, fieldObj] of fieldMap.entries()) {
                if (name.includes(pdfFieldName) || pdfFieldName.includes(name)) {
                    pdfField = fieldObj;
                    console.log(`Found field with partial match: ${name}`);
                    break;
                }
            }
        }
        
        if (!pdfField) {
            console.warn(`Field not found in PDF: ${pdfFieldName}. Available fields:`, Array.from(fieldMap.keys()));
            fieldsSkipped++;
            return;
        }
        
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
                pdfField.setText(String(formValue || ''));
                fieldsFilled++;
                console.log(`✓ Text field filled: ${pdfFieldName} = "${formValue}"`);
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
                fieldsFilled++;
            } 
            // Dropdown - has select and getOptions methods
            else if (hasSelect && hasGetOptions) {
                if (formValue) {
                    try {
                        pdfField.select(String(formValue));
                        fieldsFilled++;
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
                            fieldsFilled++;
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
                    fieldsFilled++;
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
                        fieldsFilled++;
                        console.log(`✓ Field filled (fallback): ${pdfFieldName}`);
                    } catch (e) {
                        console.error(`Failed to fill field ${pdfFieldName}:`, e);
                    }
                }
            }
        } catch (err) {
            console.error(`Error filling field ${pdfFieldName}:`, err);
        }
    });
    
    console.log(`Fields filled: ${fieldsFilled}, Fields skipped: ${fieldsSkipped}`);
    
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
    
    // Save and return the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    return filledPdfBytes;
}

// Submit form handler
function handleSubmit() {
    if (generatedForm.checkValidity()) {
        const data = collectFormData();
        
        // Display results
        resultsContent.textContent = JSON.stringify(data, null, 2);
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth' });
    } else {
        generatedForm.reportValidity();
    }
}

// Download form data as JSON
function handleDownloadJSON() {
    const data = collectFormData();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Reset button handler
function handleReset() {
    pdfInput.value = '';
    hideForm();
    hideError();
    hideResults();
    formFields = [];
    pdfDoc = null;
    originalPdfBytes = null;
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
    if (formSection) formSection.style.display = 'block';
}

function hideForm() {
    if (formSection) formSection.style.display = 'none';
}

function hideResults() {
    if (results) results.style.display = 'none';
}
