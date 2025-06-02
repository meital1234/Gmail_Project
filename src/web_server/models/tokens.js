// In-memory token store
const tokens = []; // Each entry: { token: '1', userId: 1 }

function createToken(userId) {
  const token = String(userId); // Currently: token === userId
  tokens.push({ token, userId });
  return token;
}

function getUserByToken(token) {
  const entry = tokens.find(t => t.token === token);
  return entry ? entry.userId : null;
}

module.exports = {
  createToken,
  getUserByToken
};
