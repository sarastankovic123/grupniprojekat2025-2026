const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();

// =========================
// Configuration (from env)
// =========================
const PORT = process.env.PORT || 3000;

const USERS_SERVICE_URL =
    process.env.USERS_SERVICE_URL || 'http://users-service:8001';

const CONTENT_SERVICE_URL =
    process.env.CONTENT_SERVICE_URL || 'http://content-service:8002';

const NOTIFICATIONS_SERVICE_URL =
    process.env.NOTIFICATIONS_SERVICE_URL || 'http://notification-service:8003';

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
// Base routes
// =========================
app.get('/', (req, res) => {
    res.json({ status: 'API Gateway is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'gateway up' });
});

// =========================
// Proxy helper
// =========================
async function proxy(req, res, targetUrl) {
    try {
        const response = await axios({
            method: req.method,
            url: `${targetUrl}${req.originalUrl}`,
            headers: req.headers,
            data: req.body,
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Gateway error' });
    }
}

// =========================
// Routes
// =========================

// Users / Auth
app.use('/api/auth', (req, res) =>
    proxy(req, res, USERS_SERVICE_URL)
);

// Public content
app.use('/api/content/artists', (req, res) =>
    proxy(req, res, CONTENT_SERVICE_URL)
);

// Protected content
app.use('/api/content', authMiddleware, (req, res) =>
    proxy(req, res, CONTENT_SERVICE_URL)
);

// Notifications
app.use('/api/notifications', authMiddleware, (req, res) =>
    proxy(req, res, NOTIFICATIONS_SERVICE_URL)
);

// =========================
// Start server
// =========================
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
