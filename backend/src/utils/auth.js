import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'transitrecovery_secret_fallback';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const setAuthCookie = (res, token) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
