// In-memory token store
const tokens = []; // Each entry: { token: '1', userId: 1 }

//gets userId & jwToken & stores them as object in memory
function storeToken(userId, jwtToken) {
  // - const token = { token: jwtToken, userId } 
  tokens.push({ token: jwtToken, userId });
  // - return token;
}

// checks if a JWT is valid
function isValidToken(jwtToken) {
  return tokens.some(entry => entry.token === jwtToken);
}

// gets jwToken & removes from list (for logout for example)
function removeToken(jwtToken) {
  const idx = tokens.findIndex(entry => entry.token === jwtToken);
  if (idx !== -1) tokens.splice(idx, 1);
}


function getUserByToken(token) {
  const entry = tokens.find(t => t.token === token);
  return entry ? entry.userId : null;
}

module.exports = {
  storeToken,
  isValidToken,
  removeToken,
  getUserByToken
};
