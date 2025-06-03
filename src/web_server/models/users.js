const Labels = require('./labels');

let idCounter = 0;
const users = []; // array to store all users in memory.

const createUser = ({ email, password, phone_number, birthDate, gender, image }) => {
  
  // Creating a new user.
  const newUser = { 
    id: ++idCounter,
    email,  
    password,
    phone_number,
    birthDate,
    gender,
    image: image || null
  };

  // for each new user - create a "draft" label
  Labels.createLabel({ name: "draft", userId: newUser.id });

  // Adds user to the array and than returns him.
  users.push(newUser);
  return newUser;
};

// Returns a user by id.
const getUserById = (id) => users.find(u => u.id === id);

// checks if the username and passwords that was entered is in the array users.
const getUserByCredentials = (email, password) =>
  users.find(u => u.email === email && u.password === password);

// checks if the username and passwords that was entered is in the array users.
const getUserByEmail = (email) =>
  users.find(u => u.email === email);

// Exports all the model's functions.
module.exports = {
  createUser,
  getUserById,
  getUserByCredentials,
  getUserByEmail
};
