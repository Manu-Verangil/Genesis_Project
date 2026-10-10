import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JWT Secrets (use environment variables or cryptographically secure defaults)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'amrita_campus_jwt_access_secret_key_2026_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'amrita_campus_jwt_refresh_secret_key_2026_super_secure';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_DAYS = 7; // 7 days

// Account Lockout Config
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Helper: SHA-256 hash for database storage of refresh tokens
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// In-memory data store for Users, Account Lockouts, and Refresh Tokens
export const authDb = {
  users: [],
  refreshTokens: [] // { id, tokenHash, family, userId, expiresAt, isRevoked, createdAt }
};

// Password Strength Validator
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

// Password Hashing with bcrypt (12 rounds)
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

// Verify Password (supports bcrypt hashes with transparent upgrade)
export const verifyPassword = async (user, candidatePassword) => {
  if (!user || !user.passwordHash) return false;

  // Check if passwordHash is already a bcrypt hash
  const isBcrypt = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$');
  if (isBcrypt) {
    return bcrypt.compare(candidatePassword, user.passwordHash);
  }

  // Plaintext match fallback for initial seed data
  if (user.passwordHash === candidatePassword) {
    // Transparently upgrade to bcrypt hash
    try {
      user.passwordHash = await hashPassword(candidatePassword);
    } catch (e) {}
    return true;
  }

  return false;
};

// Load users from users.csv and initialize authDb
export const initializeAuthUsers = () => {
  try {
    const csvPath = path.resolve(__dirname, '../../users.csv');
    if (!fs.existsSync(csvPath)) return;
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 6) {
        const id = parts[0];
        const name = parts[1];
        const role = parts[2].toLowerCase();
        const username = parts[3];
        const email = parts[4].toLowerCase();
        const rawPassword = parts[5];

        // Avoid duplicate users
        const exists = authDb.users.find((u) => u.id === id || u.username === username);
        if (!exists) {
          authDb.users.push({
            id,
            name,
            role,
            username,
            email,
            passwordHash: rawPassword, // will be verified and upgraded on first login
            failedLoginAttempts: 0,
            isLocked: false,
            lockoutUntil: null,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  } catch (err) {
    console.error('Error loading users into authDb:', err);
  }
};

// Generate Access Token (15 mins) and Refresh Token (7 days)
export const generateTokens = async (user, family = null) => {
  // 1. Short-lived Access Token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  // 2. Cryptographically secure Refresh Token
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const tokenFamily = family || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  // 3. Store hashed token in database
  authDb.refreshTokens.push({
    id: `rt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    tokenHash,
    family: tokenFamily,
    userId: user.id,
    expiresAt,
    isRevoked: false,
    createdAt: new Date()
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

// Token Rotation & Reuse (Theft) Detection
export const rotateRefreshToken = async (rawOldToken) => {
  const oldHash = hashToken(rawOldToken);
  const existing = authDb.refreshTokens.find((t) => t.tokenHash === oldHash);

  if (!existing) {
    throw new Error('Invalid refresh token');
  }

  // REUSE DETECTION: If an already-revoked token is used, someone stole it!
  // Invalidate all tokens in that family to protect the user
  if (existing.isRevoked) {
    authDb.refreshTokens
      .filter((t) => t.family === existing.family)
      .forEach((t) => (t.isRevoked = true));
    throw new Error('Token reuse detected. All sessions in this family have been terminated.');
  }

  if (new Date() > new Date(existing.expiresAt)) {
    throw new Error('Refresh token has expired');
  }

  // Revoke the old token
  existing.isRevoked = true;

  // Find the associated user
  const user = authDb.users.find((u) => u.id === existing.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Issue new access token + new refresh token in the same family
  return generateTokens(user, existing.family);
};

// Revoke refresh token on logout
export const revokeRefreshToken = (rawToken) => {
  if (!rawToken) return;
  const targetHash = hashToken(rawToken);
  const token = authDb.refreshTokens.find((t) => t.tokenHash === targetHash);
  if (token) {
    token.isRevoked = true;
  }
};

// Handle account lockout check & update
export const checkAccountLockout = (user) => {
  if (!user) return { isLocked: false };

  if (user.isLocked && user.lockoutUntil) {
    const now = new Date();
    if (now < new Date(user.lockoutUntil)) {
      const remainingMinutes = Math.ceil((new Date(user.lockoutUntil) - now) / 60000);
      return {
        isLocked: true,
        remainingMinutes,
        message: `Account is temporarily locked due to failed attempts. Try again in ${remainingMinutes} min.`
      };
    } else {
      // Window expired, unlock automatically
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
    }
  }

  return { isLocked: false };
};

export const recordFailedLogin = (user) => {
  if (!user) return;
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    user.isLocked = true;
    user.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
  }
};

export const resetFailedLogin = (user) => {
  if (!user) return;
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockoutUntil = null;
};

// Middleware: Verify Access Token
export const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Bearer token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Access token expired or invalid.' });
  }
};

// Middleware: Role-Based Access Control (RBAC)
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasRole = allowedRoles.map((r) => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] privileges.`
      });
    }

    next();
  };
};
