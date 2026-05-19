const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Protect route - Verify JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_kitchen_secret');

      // Fetch user from DB to verify they still exist and get the latest role
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

// Restrict to roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not allowed to access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
