const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();

// =========================
// Configuration (from env)
// =========================
const PORT = process.env.PORT || 3000;

const USERS_SERVICE_URL =
    process.env.USERS_SERVICE_URL || 'http://localhost:8001';

const CONTENT_SERVICE_URL =
    process.env.CONTENT_SERVICE_URL || 'http://localhost:8002';

const NOTIFICATIONS_SERVICE_URL =
    process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:8003';

const JWT_SECRET =
    process.env.JWT_SECRET || 'dev-secret-min-32-chars';

// =========================
// Middleware
// =========================
app.use(express.json());

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid Authorization format' });
    }

    const token = parts[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
}

// =========================
// Routes
// =========================

// Users / Auth
app.use('/api/auth', async (req, res) => {
    const url = `${USERS_SERVICE_URL}${req.originalUrl}`;

    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Error' });
    }
});

// Public content (artists)
app.use('/api/content/artists', async (req, res) => {
    const url = `${CONTENT_SERVICE_URL}${req.originalUrl}`;

    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Error' });
    }
});

// Protected content
app.use('/api/content', authMiddleware, async (req, res) => {
    const url = `${CONTENT_SERVICE_URL}${req.originalUrl}`;

    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Error' });
    }
});

// Notifications
app.use('/api/notifications', authMiddleware, async (req, res) => {
    const url = `${NOTIFICATIONS_SERVICE_URL}${req.originalUrl}`;

    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Error' });
    }
});

// =========================
// Start server
// =========================
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
