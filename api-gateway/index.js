const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const usersServiceUrl = 'http://localhost:4000';
const contentServiceUrl = 'http://localhost:5000';
const notificationsServiceUrl = 'http://localhost:6000';

app.use((req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Authorization token is missing' });
    }

    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }


        req.user = decoded;
        next();
    });
});

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
        res.status(error.response ? error.response.status : 500).json(error.message);
    }
});

app.use('/api/content', async (req, res) => {
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
        res.status(error.response ? error.response.status : 500).json(error.message);
    }
});

app.use('/api/notifications', async (req, res) => {
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
        res.status(error.response ? error.response.status : 500).json(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway je pokrenut na portu ${PORT}`);
});
