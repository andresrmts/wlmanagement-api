const jwt = require('jsonwebtoken');

const generateToken = (email) => {
  const token = jwt.sign({ email }, 'thisisasecret');
  return token;
};

module.exports = generateToken;