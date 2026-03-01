const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();

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
const UPSTREAM_TIMEOUT_MS = Number.parseInt(process.env.UPSTREAM_TIMEOUT_MS || '3000', 10);
const USER_RESPONSE_TIMEOUT_MS = Number.parseInt(process.env.USER_RESPONSE_TIMEOUT_MS || '5000', 10);
const CIRCUIT_OPEN_MS = Number.parseInt(process.env.CIRCUIT_OPEN_MS || '15000', 10);
const CIRCUIT_FAILURE_THRESHOLD = Number.parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD || '3', 10);
const RETRY_MAX_ATTEMPTS = Number.parseInt(process.env.RETRY_MAX_ATTEMPTS || '2', 10);
const RETRY_BASE_DELAY_MS = Number.parseInt(process.env.RETRY_BASE_DELAY_MS || '100', 10);

const httpAgent = new http.Agent({ keepAlive: true });
let httpsAgent = null;
try {
    const ca = fs.readFileSync(TLS_CA_FILE);
    httpsAgent = new https.Agent({ ca, keepAlive: true });
    console.log(`API Gateway: loaded TLS CA from ${TLS_CA_FILE}`);
} catch (e) {
    httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
    console.warn(`API Gateway: failed to read TLS CA at ${TLS_CA_FILE}, using rejectUnauthorized=false`);
}

class CircuitBreaker {
    constructor({ failureThreshold, openMs }) {
        this.failureThreshold = failureThreshold;
        this.openMs = openMs;
        this.consecutiveFailures = 0;
        this.openUntil = 0;
    }

    isOpen() {
        return Date.now() < this.openUntil;
    }

    success() {
        this.consecutiveFailures = 0;
        this.openUntil = 0;
    }

    failure() {
        this.consecutiveFailures += 1;
        if (this.consecutiveFailures >= this.failureThreshold) {
            this.openUntil = Date.now() + this.openMs;
        }
    }
}

const breakers = new Map();
function getBreaker(key) {
    if (!breakers.has(key)) {
        breakers.set(
            key,
            new CircuitBreaker({
                failureThreshold: CIRCUIT_FAILURE_THRESHOLD,
                openMs: CIRCUIT_OPEN_MS,
            })
        );
    }
    return breakers.get(key);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAxiosError(err) {
    const code = err && err.code;
    const status = err && err.response && err.response.status;
    if (status && status >= 500) return true;
    return (
        code === 'ECONNABORTED' ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'EAI_AGAIN' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNREFUSED'
    );
}

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

app.get('/', (req, res) => {
    res.json({ status: 'API Gateway is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'gateway up' });
});

async function proxy(req, res, targetUrl) {
    res.setTimeout(USER_RESPONSE_TIMEOUT_MS);

    try {
        const isHttps = String(targetUrl || '').startsWith('https://');
        const url = `${targetUrl}${req.originalUrl}`;
        const breakerKey = targetUrl;
        const breaker = getBreaker(breakerKey);

        if (breaker.isOpen()) {
            if (req.method === 'GET' && req.originalUrl.startsWith('/api/recommendations')) {
                return res.status(200).json([]);
            }
            return res.status(503).json({ message: 'Upstream temporarily unavailable (circuit open)' });
        }

        const wantsStream =
            req.method === 'GET' &&
            /^\/api\/content\/songs\/[^/]+\/audio$/.test(req.originalUrl);

        const contentType = String(req.headers['content-type'] || '');
        const isMultipart = contentType.startsWith('multipart/form-data');

        const controller = new AbortController();
        const userTimeout = setTimeout(() => controller.abort(), USER_RESPONSE_TIMEOUT_MS);

        const baseAxiosConfig = {
            method: req.method,
            url,
            headers: req.headers,
            timeout: UPSTREAM_TIMEOUT_MS,
            signal: controller.signal,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true,
            ...(isHttps ? { httpsAgent } : { httpAgent }),
        };

        try {
            if (wantsStream) {
                const upstream = await axios({
                    ...baseAxiosConfig,
                    responseType: 'stream',
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
                breaker.success();
                return;
            }

            if (isMultipart) {
                const response = await axios({
                    ...baseAxiosConfig,
                    data: req,
                });

                if (response.headers['set-cookie']) {
                    res.setHeader('set-cookie', response.headers['set-cookie']);
                }
                breaker.success();
                return res.status(response.status).json(response.data);
            }

            const canRetry = req.method === 'GET' || req.method === 'HEAD';
            let response = null;
            let lastErr = null;
            const attempts = canRetry ? Math.max(1, RETRY_MAX_ATTEMPTS) : 1;
            for (let i = 1; i <= attempts; i++) {
                try {
                    response = await axios({
                        ...baseAxiosConfig,
                        data: req.body,
                    });
                    lastErr = null;
                    break;
                } catch (err) {
                    lastErr = err;
                    if (!canRetry || i === attempts || !isRetryableAxiosError(err)) break;
                    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, i - 1);
                    await sleep(delay);
                }
            }
            if (lastErr) throw lastErr;

            if (response.headers['set-cookie']) {
                res.setHeader('set-cookie', response.headers['set-cookie']);
            }

            breaker.success();
            res.status(response.status).json(response.data);
        } finally {
            clearTimeout(userTimeout);
        }
    } catch (error) {
        console.error('Proxy error:', req.method, req.originalUrl, error.message);
        const breaker = getBreaker(targetUrl);
        breaker.failure();

        if ((req.method === 'GET' || req.method === 'HEAD') && req.originalUrl.startsWith('/api/recommendations')) {
            return res.status(200).json([]);
        }
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Gateway error' });
    }
}


app.use('/api/auth', (req, res) =>
    proxy(req, res, USERS_SERVICE_URL)
);

app.use('/api/content/artists', (req, res) =>
    proxy(req, res, CONTENT_SERVICE_URL)
);

app.use('/api/content', authMiddleware, (req, res) =>
    proxy(req, res, CONTENT_SERVICE_URL)
);

app.use('/api/notifications', authMiddleware, (req, res) =>
    proxy(req, res, NOTIFICATIONS_SERVICE_URL)
);

app.use('/api/recommendations', authMiddleware, (req, res) =>
    proxy(req, res, RECOMMENDATION_SERVICE_URL)
);

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
