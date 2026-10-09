const rateLimit = require('express-rate-limit');

const dummyLimiter = (req, res, next) => next();

let authLimiter = dummyLimiter;
let apiLimiter = dummyLimiter;

if (process.env.NODE_ENV === 'production') {
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" }
  });

  apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" }
  });
}

module.exports = { authLimiter, apiLimiter };
