const express = require('express');
const app = express();

// Imports the user and token routers from the routes folder.
const usersRouter = require('./routes/users');
const tokensRouter = require('./routes/tokens');
// Import mails router
const mailsRouter = require('./routes/mails')

app.use(express.json()); // Allows the application to parse JSON requests and read the request body (req.body).

// Connects the routers to the /api/users and /api/tokens and /api/mails paths.
app.use('/api/users', usersRouter);
app.use('/api/tokens', tokensRouter);
app.use('api/mails', mailsRouter)

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
