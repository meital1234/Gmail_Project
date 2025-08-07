require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const app     = express();

const connectDB = require('./utils/db');
const TCP       = require('./utils/TCPclient');

// --- MIDDLEWARES ---

// serve static utils (e.g. default images)
app.use('/static', express.static(path.join(__dirname, 'utils')));

// parse JSON with 2 MB limit
app.use(express.json({ limit: '2mb' }));

// CORS for your React front-end
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// --- ROUTERS ---
const usersRouter     = require('./routes/users');
const tokensRouter    = require('./routes/tokens');
const mailsRouter     = require('./routes/mails');
const labelsRouter    = require('./routes/labels');
const blacklistRouter = require('./routes/blacklist');
const configRouter    = require('./routes/config');

// default Bloom Filter config at startup
const defaultBitArraySize = parseInt(process.env.BF_SIZE) || 8;
const defaultHashFuncs    = (process.env.BF_HASHES || '1,2').split(',');

(async () => {
  try {
    // 1) Connect to MongoDB
    await connectDB();

    // 2) Initialize Bloom-filter via TCP
    const cfgLine = [defaultBitArraySize, ...defaultHashFuncs].join(' ');
    await TCP.initTCP(cfgLine);

    // 3) Mount public routes
    app.use('/api/users',   usersRouter);
    app.use('/api/tokens',  tokensRouter);

    // 4) Mount protected routes (controllers call getAuthenticatedUser)
    app.use('/api/mails',     mailsRouter);
    app.use('/api/labels',    labelsRouter);
    app.use('/api/blacklist', blacklistRouter);
    app.use('/api/config',    configRouter);

    // 5) 404 handler
    app.use((req, res) =>
      res.status(404).json({ error: 'Route not found' })
    );

    // 6) Global error handler
    app.use((err, req, res, next) => {
      console.error('[UNCAUGHT ERROR]', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 7) Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
})();
