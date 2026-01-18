# PDF to Webform Converter

A web application that converts fillable PDF forms into interactive HTML web forms using PDF.js, with login authentication and dashboard interface.

## Features

- 🔐 Login authentication system
- 📋 Dashboard with left sidebar navigation
- 📄 Upload fillable PDF files via drag-and-drop or file browser
- 🔍 Automatically extracts form fields from PDFs (text fields, checkboxes, radio buttons, dropdowns, textareas)
- 🎨 Modern, responsive UI with beautiful gradient design
- ✅ Form validation support
- 📝 **Fill PDF with form data and download the completed PDF**
- 🖨️ **Download clean/flattened PDF** (removes form field boxes)
- 💾 Download form data as JSON
- 📱 Mobile-friendly interface
- 🔄 Auto-loads default PDF (AWB1.pdf) when served over HTTP

## How It Works

1. **Login**: Access the application through the login page
2. **Dashboard**: Navigate to "Create AWB" from the sidebar
3. **PDF Processing**: AWB1.pdf auto-loads, or upload your own fillable PDF
4. **Form Generation**: The app uses PDF.js to parse the PDF and extract all form field information, then generates a dynamic HTML form
5. **Fill & Download**: Fill out the generated form and click "Fill PDF & Download" to get a completed PDF with your data filled in
6. **Clean PDF**: Use "Download Clean PDF (Flattened)" to get a professional-looking PDF without form field boxes

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Open your browser and go to: `http://localhost:3000/login.html`
   - Default credentials:
     - Username: `admin` / Password: `admin123`
     - Username: `user` / Password: `password123`

### Environment Variables

Create a `.env` file in the root directory:
```
PORT=3000
```

The server will use port 3000 by default if no `.env` file is present.

## Project Structure

```
├── server.js          # Express server
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (create this)
├── login.html        # Login page
├── dashboard.html    # Dashboard with sidebar navigation
├── create-awb.html   # PDF converter application
├── app4.js           # PDF conversion logic
├── styles.css        # Application styles
└── AWB1.pdf         # Default PDF (auto-loads)
```

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser that supports ES6+ and PDF.js

## Technical Details

- **Node.js/Express**: Backend server for serving static files
- **PDF.js**: Used for parsing PDF files and extracting form field annotations
- **pdf-lib**: Used for filling PDF forms with collected data
- **Vanilla JavaScript**: No frontend framework dependencies
- **Modern CSS**: Responsive design with gradient styling

## Commands

- `npm run dev` - Start development server
- `npm start` - Start production server (same as dev)

## Limitations

- Only works with fillable PDFs (PDFs with form fields)
- Some complex PDF form structures may not be fully supported
- PDF.js and pdf-lib are loaded from CDN, so an internet connection is required
- Radio button groups may require specific PDF structure for optimal results
- Current authentication uses localStorage (for production, implement backend authentication)
