const bcrypt = require('bcrypt');
require('dotenv').config(); // loads process.env.BCRYPT_SALT_ROUNDS
const Labels = require('./labels');

let idCounter = 0;
const users = []; // array to store all users in memory.

// - const createUser = ({ email, password, phone_number, birthDate, gender, image }) => {
  async function createUser({ email, password, first_name, last_name, phone_number, birthDate, gender, image }) {
    const saltRounds = +process.env.BCRYPT_SALT_ROUNDS || 10; // get number of saltrounds or use default -> 10
    // create salt & hash of password
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

  // Creating a new user - but saving passwordHash
  const newUser = { 
    id: ++idCounter,
    email,  
    passwordHash,
    first_name, 
    last_name,
    phone_number,
    birthDate,
    gender,
    image: image || null
  };

  // Create default labels for this user
  const defaultLabels = ["Inbox", "Sent", "Starred", "Important", "Draft", "Spam"];
  defaultLabels.forEach(labelName => {
    Labels.createLabel({ name: labelName, userId: newUser.id });
  });

  // Adds user to the array and than returns him.
  users.push(newUser);
  return newUser;
}

// Returns a user by id.
// - const getUserById = (id) => users.find(u => u.id === id);
function getUserById(id) {
  return users.find(u => u.id === id);
}

// checks if the username and passwords that was entered is in the array users.
// - const getUserByEmail = (email) => users.find(u => u.email === email);
function getUserByEmail(email) {
  return users.find(u => u.email === email);
}

// checks if the username and passwords that was entered is in the array users.
// - const getUserByCredentials = (email, password) => users.find(u => u.email === email && u.password === password);
async function getUserByCredentials(email, password) {
  const user = getUserByEmail(email);
  if (!user) return undefined;

    // bcrypt.compare returns Promise<boolean>
  const match = await bcrypt.compare(password, user.passwordHash);
  return match ? user : undefined;
}

// Exports all the model's functions.
module.exports = {
  createUser,
  getUserById,
  getUserByCredentials,
  getUserByEmail
};
