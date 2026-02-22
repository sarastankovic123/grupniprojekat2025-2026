const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');

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

const RECOMMENDATION_SERVICE_URL =
    process.env.RECOMMENDATION_SERVICE_URL || 'https://recommendation-service:8004';

const JWT_SECRET =
    process.env.JWT_SECRET || 'dev-secret-min-32-chars';

const TLS_CA_FILE = process.env.TLS_CA_FILE || '/certs/tls.crt';
let httpsAgent = null;
try {
    const ca = fs.readFileSync(TLS_CA_FILE);
    httpsAgent = new https.Agent({ ca });
    console.log(`API Gateway: loaded TLS CA from ${TLS_CA_FILE}`);
} catch (e) {
    // Fallback: still allow HTTPS (encrypted), but without cert verification (dev-only).
    httpsAgent = new https.Agent({ rejectUnauthorized: false });
    console.warn(`API Gateway: failed to read TLS CA at ${TLS_CA_FILE}, using rejectUnauthorized=false`);
}

// =========================
// Middleware
// =========================
// Parse JSON bodies, but skip multipart requests so the raw stream
// stays intact for proxying file uploads.
app.use((req, res, next) => {
    const ct = String(req.headers['content-type'] || '');
    if (ct.startsWith('multipart/form-data')) return next();
    express.json()(req, res, next);
});

function readCookie(req, name) {
    const cookieHeader = req.headers['cookie'];
    if (!cookieHeader) return null;

    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const [k, ...rest] = part.trim().split('=');
        if (k === name) {
            return decodeURIComponent(rest.join('=') || '');
        }
    }
    return null;
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ message: 'Invalid Authorization format' });
        }
        token = parts[1];
    } else {
        token = readCookie(req, 'access_token');
        if (!token) {
            return res.status(401).json({ message: 'Authorization token is missing' });
        }
    }

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
        const isHttps = String(targetUrl || '').startsWith('https://');
        const url = `${targetUrl}${req.originalUrl}`;
        const wantsStream =
            req.method === 'GET' &&
            /^\/api\/content\/songs\/[^/]+\/audio$/.test(req.originalUrl);

        // For multipart uploads, forward raw request stream (express.json won't parse it).
        const contentType = String(req.headers['content-type'] || '');
        const isMultipart = contentType.startsWith('multipart/form-data');

        if (wantsStream) {
            const upstream = await axios({
                method: req.method,
                url,
                headers: req.headers,
                responseType: 'stream',
                validateStatus: () => true,
                ...(isHttps ? { httpsAgent } : null),
            });

            if (upstream.headers['set-cookie']) {
                res.setHeader('set-cookie', upstream.headers['set-cookie']);
            }

            res.status(upstream.status);
            for (const [k, v] of Object.entries(upstream.headers || {})) {
                const key = String(k).toLowerCase();
                if (key === 'transfer-encoding') continue;
                if (key === 'content-encoding') continue;
                res.setHeader(k, v);
            }

            upstream.data.pipe(res);
            return;
        }

        // For multipart uploads, pipe the raw request stream directly to upstream.
        if (isMultipart) {
            const response = await axios({
                method: req.method,
                url,
                headers: req.headers,
                data: req,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                validateStatus: () => true,
                ...(isHttps ? { httpsAgent } : {}),
            });

            if (response.headers['set-cookie']) {
                res.setHeader('set-cookie', response.headers['set-cookie']);
            }
            return res.status(response.status).json(response.data);
        }

        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            ...(isHttps ? { httpsAgent } : {}),
        });

        if (response.headers['set-cookie']) {
            res.setHeader('set-cookie', response.headers['set-cookie']);
        }

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error:', req.method, req.originalUrl, error.message);
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

// Recommendations
app.use('/api/recommendations', authMiddleware, (req, res) =>
    proxy(req, res, RECOMMENDATION_SERVICE_URL)
);

// =========================
// Start server
// =========================
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
