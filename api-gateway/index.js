const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const app = express();

// =========================
// Configuration (from env)
// =========================
const PORT = process.env.PORT || 3000;

// VAŽNO: u Docker mreži koristi nazive servisa: http://users-service:8001 itd.
// Lokalno (van docker-a) može localhost.
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://users-service:8001";
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || "http://content-service:8002";
const NOTIFICATIONS_SERVICE_URL =
  process.env.NOTIFICATIONS_SERVICE_URL || "http://notification-service:8003";

// Treba min 32 chars u tvojim servisima
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-min-32-chars-CHANGE-ME!!";

// =========================
// Middleware
// =========================
app.use(express.json());

// Health check (da znaš da gateway radi)
app.get("/health", (req, res) => {
  res.json({ status: "api-gateway up" });
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid Authorization format" });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
}

// =========================
// Helper: proxy request
// =========================
async function proxy(req, res, targetBaseUrl) {
  // originalUrl uključuje path + query (npr /api/auth/login?x=1)
  const url = `${targetBaseUrl}${req.originalUrl}`;

  try {
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      timeout: 15000,
      // NE bacaj exception za 4xx/5xx — samo prosledi status
      validateStatus: () => true,
      headers: {
        ...req.headers,
        host: undefined, // izbegni host konflikt
      },
    });

    // Prosledi status i payload
    res.status(response.status);

    // Ako backend vrati plain text ili json, ovo radi i za jedno i za drugo.
    // (Express će sam setovati content-type ako je JSON objekat)
    return res.send(response.data);
  } catch (error) {
    // Ako target servis ne radi / nije dostupan
    console.error("Proxy error:", error.message);
    return res.status(502).json({
      message: "Bad Gateway",
      target: targetBaseUrl,
      details: error.message,
    });
  }
}

// =========================
// Routes
// =========================

// Users / Auth (public)
app.use("/api/auth", (req, res) => proxy(req, res, USERS_SERVICE_URL));

// Public content (artists) - public
app.use("/api/content/artists", (req, res) => proxy(req, res, CONTENT_SERVICE_URL));

// Protected content - sve ostalo iz /api/content zahteva token
app.use("/api/content", authMiddleware, (req, res) => proxy(req, res, CONTENT_SERVICE_URL));

// Notifications - protected
app.use("/api/notifications", authMiddleware, (req, res) => proxy(req, res, NOTIFICATIONS_SERVICE_URL));

// Ako hoćeš da vidiš odmah kad tražiš rutu koja ne postoji u gateway-u:
app.use((req, res) => {
  res.status(404).json({ message: "Gateway route not found", path: req.originalUrl });
});

// =========================
// Start server
// =========================
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log("USERS_SERVICE_URL:", USERS_SERVICE_URL);
  console.log("CONTENT_SERVICE_URL:", CONTENT_SERVICE_URL);
  console.log("NOTIFICATIONS_SERVICE_URL:", NOTIFICATIONS_SERVICE_URL);
});
