require('dotenv').config(); // loads process.env.BCRYPT_SALT_ROUNDS

const express = require('express');
const cors    = require('cors');
const app = express();
app.use(express.json({ limit: '2mb' }));

/* ===== CORS ===== */
app.use(cors({
  origin: 'http://localhost:3001',               
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // credentials: true  
}));
app.options('*', cors());                          
/* =============== */

// imports the routers from the routes folder
const usersRouter  = require('./routes/users');
const tokensRouter  = require('./routes/tokens');
const mailsRouter  = require('./routes/mails');
const labelsRouter = require('./routes/labels');
const blacklistRouter = require('./routes/blacklist');
const configRouter  = require('./routes/config'); 
const TCP = require('./utils/TCPclient');

// --- 🌟 Default Bloom Filter Config at startup 🌟 ---
const defaultBitArraySize = parseInt(process.env.BF_SIZE) || 8;
const defaultHashFuncs = (process.env.BF_HASHES || "1,2").split(',');

(async () => {
  try {
    const line = [defaultBitArraySize, ...defaultHashFuncs].join(' ');
    await TCP.initTCP(line);
  } catch (err) {
    console.error('[BloomFilter] Initialization failed:', err.message);
  }
})();
// ---------------------------------------------------

const authMiddleware  = require('./utils/auth').getAuthenticatedUser;

app.use(express.json()); // Allows the application to parse JSON requests and read req.body.

// connects the routers to the /api/users, /api/tokens, /api/mails, /api/lables, /api/blacklist & /api/config paths
// public routs
app.use('/api/users', usersRouter);
app.use('/api/tokens', tokensRouter);
// protected routes – wrap each in authMiddleware
app.use('/api/mails', (req, res, next) => {
  const user = authMiddleware(req, res);
  if (!user) return;  // authMiddleware already sent 401/403 if needed
  req.user = user;
  next();
}, mailsRouter);

app.use('/api/labels', (req, res, next) => {
  const user = authMiddleware(req, res);
  if (!user) return;
  req.user = user;
  next();
}, labelsRouter);

app.use('/api/blacklist', (req, res, next) => {
  const user = authMiddleware(req, res);
  if (!user) return;
  req.user = user;
  next();
}, blacklistRouter);

app.use('/api/config', (req, res, next) => {
  const user = authMiddleware(req, res);
  if (!user) return;
  req.user = user;
  next();
}, configRouter);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});