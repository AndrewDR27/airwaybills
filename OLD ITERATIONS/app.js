// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const pdfInput = document.getElementById('pdfInput');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const formSection = document.getElementById('formSection');
const generatedForm = document.getElementById('generatedForm');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadBtn');
const fillPdfBtn = document.getElementById('fillPdfBtn');
const resetBtn = document.getElementById('resetBtn');
const results = document.getElementById('results');
const resultsContent = document.getElementById('resultsContent');

let pdfDoc = null;
let formFields = [];
let originalPdfBytes = null; // Store original PDF for filling

// Upload area click handler
uploadArea.addEventListener('click', () => {
    pdfInput.click();
});

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        handlePDF(file);
    } else {
        showError('Please drop a valid PDF file.');
    }
});

// File input change handler
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handlePDF(file);
    }
});

// Handle PDF file
async function handlePDF(file) {
    hideError();
    showLoading();
    hideForm();
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        originalPdfBytes = new Uint8Array(arrayBuffer); // Store original PDF bytes
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
fillPdfBtn.addEventListener('click', async () => {
    if (!generatedForm.checkValidity()) {
        generatedForm.reportValidity();
        return;
    }
    
    showLoading();
    try {
        const formData = collectFormData();
        const filledPdfBytes = await fillPdfWithData(formData);
        
        // Download the filled PDF
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'filled-form.pdf';
        a.click();
        URL.revokeObjectURL(url);
        
        hideLoading();
        showError('✓ PDF filled and downloaded successfully!');
        setTimeout(() => {
            hideError();
        }, 3000);
    } catch (err) {
        console.error('Error filling PDF:', err);
        showError('Error filling PDF: ' + err.message);
        hideLoading();
    }
}

// Collect form data
function collectFormData() {
    const formData = new FormData(generatedForm);
    const data = {};
    
    // Collect all form data
    formData.forEach((value, key) => {
        if (data[key]) {
            // Handle multiple values (checkboxes, etc.)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    });
    
    // Handle checkboxes that weren't checked
    formFields.forEach(field => {
        if (field.htmlType === 'checkbox' && !data[field.name]) {
            data[field.name] = false;
        }
    });
    
    return data;
}

// Fill PDF with form data using pdf-lib
async function fillPdfWithData(formData) {
    if (!originalPdfBytes) {
        throw new Error('Original PDF not available');
    }
    
    // Load the PDF with pdf-lib
    const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all form fields from pdf-lib
    const pdfFields = form.getFields();
    
    // Create a map of field names to pdf-lib field objects
    const fieldMap = new Map();
    pdfFields.forEach(field => {
        const fieldName = field.getName();
        fieldMap.set(fieldName, field);
    });
    
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
    
    // Fill each field
    formFields.forEach(field => {
        // Skip radio buttons - they'll be handled separately
        if (field.htmlType === 'radio') {
            return;
        }
        
        const pdfFieldName = field.pdfFieldName;
        const pdfField = fieldMap.get(pdfFieldName);
        const formValue = formData[field.name];
        
        if (!pdfField) {
            console.warn(`Field not found in PDF: ${pdfFieldName}`);
            return;
        }
        
        try {
            const fieldType = pdfField.constructor.name;
            
            if (fieldType === 'PDFTextField') {
                pdfField.setText(String(formValue || ''));
            } else if (fieldType === 'PDFCheckBox') {
                if (formValue === true || formValue === 'true' || formValue === 'on' || formValue === 'Yes') {
                    pdfField.check();
                } else {
                    pdfField.uncheck();
                }
            } else if (fieldType === 'PDFDropdown') {
                if (formValue) {
                    try {
                        pdfField.select(String(formValue));
                    } catch (e) {
                        // Try to find matching option
                        const options = pdfField.getOptions();
                        const matchingOption = options.find(opt => 
                            opt.toLowerCase() === String(formValue).toLowerCase() ||
                            opt.toLowerCase().includes(String(formValue).toLowerCase()) ||
                            String(formValue).toLowerCase().includes(opt.toLowerCase())
                        );
                        if (matchingOption) {
                            pdfField.select(matchingOption);
                        } else {
                            console.warn(`Could not set dropdown value: ${formValue}`);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn(`Error filling field ${pdfFieldName}:`, err);
        }
    });
    
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
submitBtn.addEventListener('click', () => {
    if (generatedForm.checkValidity()) {
        const data = collectFormData();
        
        // Display results
        resultsContent.textContent = JSON.stringify(data, null, 2);
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth' });
    } else {
        generatedForm.reportValidity();
    }
});

// Download form data as JSON
downloadBtn.addEventListener('click', () => {
    const data = collectFormData();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-data.json';
    a.click();
    URL.revokeObjectURL(url);
});

// Reset button handler
resetBtn.addEventListener('click', () => {
    pdfInput.value = '';
    hideForm();
    hideError();
    hideResults();
    formFields = [];
    pdfDoc = null;
    originalPdfBytes = null;
});

// Utility functions
function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
}

function hideError() {
    error.style.display = 'none';
}

function showForm() {
    formSection.style.display = 'block';
}

function hideForm() {
    formSection.style.display = 'none';
}

function hideResults() {
    results.style.display = 'none';
}
