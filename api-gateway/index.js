const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(express.json());

const usersServiceUrl = 'http://localhost:8001';
const contentServiceUrl = 'http://localhost:8002';
const notificationsServiceUrl = 'http://localhost:8003';

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

    jwt.verify(token, 'your-secret-key-change-in-production-min-32-chars', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
}

app.use('/api/auth', async (req, res) => {
    const url = `${usersServiceUrl}${req.originalUrl}`;
    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error' });
    }
});

app.use('/api/content/artists', async (req, res) => {
    const url = `${contentServiceUrl}${req.originalUrl}`;
    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error' });
    }
});

app.use('/api/content', authMiddleware, async (req, res) => {
    const url = `${contentServiceUrl}${req.originalUrl}`;
    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error' });
    }
});

app.use('/api/notifications', authMiddleware, async (req, res) => {
    const url = `${notificationsServiceUrl}${req.originalUrl}`;
    try {
        const response = await axios({
            method: req.method,
            url,
            headers: req.headers,
            data: req.body
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error' });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
