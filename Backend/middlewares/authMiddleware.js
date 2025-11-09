import jwt from 'jsonwebtoken';

/**
 * Verifies the main Access Token (JWT) from the Authorization header.
 * Attaches the user payload to req.user if valid.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded.user; // { id: '...', role: '...' }
    next();
  } catch (err) {
    // This catches expired tokens. The client should then try to refresh.
    return res.status(401).json({ message: 'Token is not valid or expired' });
  }
};

/**
 * Checks if the authenticated user has the 'Admin' role.
 * Must be used *after* authMiddleware.
 */
export const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
  next();
};

/**
 * Checks if the authenticated user has the 'Teacher' role.
 */
export const verifyTeacher = (req, res, next) => {
  if (req.user.role !== 'Teacher') {
    return res.status(403).json({ message: 'Forbidden: Teacher access only' });
  }
  next();
};

/**
 * Checks if the authenticated user has the 'Student' role.
 */
export const verifyStudent = (req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Forbidden: Student access only' });
  }
  next();
};