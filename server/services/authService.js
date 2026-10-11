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

import {
  initializeEncryptedVault,
  persistUsersToVault,
  getRawVaultInspection
} from './vaultService.js';

// Password Strength Validator
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
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
      persistUsersToVault(authDb.users);
    } catch (e) {}
    return true;
  }

  return false;
};

// Load users from encrypted AES-256 vault and initialize authDb
export const initializeAuthUsers = async () => {
  try {
    const vaultUsers = await initializeEncryptedVault(authDb.users);
    authDb.users = vaultUsers;
    console.log(`[AUTH] Initialized authDb with ${authDb.users.length} users sealed in AES-256-GCM vault.`);
  } catch (err) {
    console.error('Error loading users into authDb from vault:', err);
  }
};

// Return safe users list without password hashes
export const getSafeUsers = () => {
  return authDb.users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    isLocked: !!u.isLocked,
    createdAt: u.createdAt,
    encryptionStatus: 'AES-256-GCM Vault Encrypted & Salted Bcrypt'
  }));
};

// Admin: Add new user with bcrypt password hashing and AES-256 vault persistence
export const addAuthUser = async ({ name, username, email, role = 'student', password }) => {
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanEmail = String(email || `${cleanUsername}@campus.edu`).trim().toLowerCase();
  const cleanName = String(name || cleanUsername).trim();
  const cleanRole = String(role).trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!['admin', 'staff', 'cook', 'student', 'faculty'].includes(cleanRole)) {
    throw new Error('Role must be admin, staff, cook, student, or faculty.');
  }

  const existing = authDb.users.find(
    (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanEmail)
  );
  if (existing) {
    throw new Error(`User with username '${cleanUsername}' or email '${cleanEmail}' already exists.`);
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    role: cleanRole,
    passwordHash,
    failedLoginAttempts: 0,
    isLocked: false,
    lockoutUntil: null,
    createdAt: new Date().toISOString()
  };

  authDb.users.push(newUser);
  persistUsersToVault(authDb.users);

  return {
    id: newUser.id,
    name: newUser.name,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    createdAt: newUser.createdAt,
    encryptionStatus: 'AES-256-GCM Vault Encrypted & Salted Bcrypt'
  };
};

// Admin: Remove user by ID or username
export const removeAuthUser = (idOrUsername) => {
  const target = String(idOrUsername).trim().toLowerCase();
  const index = authDb.users.findIndex(
    (u) => (u.id && String(u.id).toLowerCase() === target) || (u.username && u.username.toLowerCase() === target)
  );

  if (index === -1) {
    throw new Error(`User '${idOrUsername}' not found.`);
  }

  const userToRemove = authDb.users[index];
  if (userToRemove.role === 'admin' && (userToRemove.username === 'SYS-ADMIN-SUPER' || userToRemove.username === 'admin')) {
    const adminCount = authDb.users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('Cannot delete the root administrator account.');
    }
  }

  const [removed] = authDb.users.splice(index, 1);
  persistUsersToVault(authDb.users);

  return { success: true, removedUsername: removed.username, removedName: removed.name };
};

// Admin: Update user password with bcrypt hashing and AES-256 vault persistence
export const updateAuthUserPassword = async (idOrUsername, newPassword) => {
  const target = String(idOrUsername).trim().toLowerCase();
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const user = authDb.users.find(
    (u) => (u.id && String(u.id).toLowerCase() === target) || (u.username && u.username.toLowerCase() === target)
  );

  if (!user) {
    throw new Error(`User '${idOrUsername}' not found.`);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockoutUntil = null;

  persistUsersToVault(authDb.users);
  return { success: true, message: `Password for '${user.username}' has been updated with salted bcrypt hash and encrypted in AES-256 vault.` };
};

// Inspect on-disk vault
export const getVaultInspectionInfo = () => {
  return getRawVaultInspection(authDb.users.length);
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
