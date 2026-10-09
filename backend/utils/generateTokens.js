const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (id, role) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
};

const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken
};
