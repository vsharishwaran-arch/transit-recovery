import { verifyToken } from '../utils/auth.js';

export const authenticate = (req, res, next) => {
  let token = req.cookies?.authToken;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated — no token' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export const requireConductor = (req, res, next) => {
  if (!['admin', 'conductor'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Conductor access required' });
  }
  next();
};
