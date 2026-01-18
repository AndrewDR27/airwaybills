require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Route for root - redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 Login page: http://localhost:${PORT}/login.html`);
    console.log(`📋 Dashboard: http://localhost:${PORT}/dashboard.html`);
});
