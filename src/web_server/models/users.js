let idCounter = 0;
const users = []; // array to store all users in memory.

const createUser = ({ username, password, phone_number, birthDate, gender, image }) => {
  
  // Creating a new user.
  const newUser = { 
    id: ++idCounter,
    username,  
    password,
    phone_number,
    birthDate,
    gender,
    image: image || null
  };

  // Adds user to the array and than returns him.
  users.push(newUser);
  return newUser;
};

// Returns a user by id.
const getUserById = (id) => users.find(u => u.id === id);

// checks if the username and passwords that was entered is in the array users.
const getUserByCredentials = (username, password) =>
  users.find(u => u.username === username && u.password === password);

// Exports all the model's functions.
module.exports = {
  createUser,
  getUserById,
  getUserByCredentials
};
