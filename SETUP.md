# Setup Instructions

## Initial Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   Create a file named `.env` in the root directory with:
   ```
   PORT=3000
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Login: http://localhost:3000/login.html
   - Dashboard: http://localhost:3000/dashboard.html

## Default Credentials

- Username: `admin`
- Password: `admin123`

Or:
- Username: `user`
- Password: `password123`

## Project Structure

- `server.js` - Express server
- `package.json` - Dependencies and scripts
- `.env` - Environment variables (create this file)
- `login.html` - Login page
- `dashboard.html` - Main dashboard with sidebar
- `create-awb.html` - PDF converter application
- `app4.js` - PDF conversion logic
- `AWB1.pdf` - Default PDF (auto-loads when served via HTTP)

## Commands

- `npm run dev` - Start development server
- `npm start` - Start production server (same as dev for now)
