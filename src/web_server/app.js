const express = require('express');
const app = express();

// imports the routers from the routes folder
const usersRouter  = require('./routes/users');
const tokensRouter  = require('./routes/tokens');
const mailsRouter  = require('./routes/mails');
const blacklistRouter = require('./routes/blacklist');
const configRouter  = require('./routes/config'); 
const TCP = require('./utils/TCPclient');

app.use(express.json()); // Allows the application to parse JSON requests and read req.body.

// connects the routers to the /api/users, /api/tokens, /api/mails and /api/blacklist paths.
app.use('/api/users', usersRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/mails', mailsRouter);
app.use('/api/blacklist', blacklistRouter);
app.use('/api/config', configRouter); 

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});