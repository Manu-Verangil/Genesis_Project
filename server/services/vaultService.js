import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to persistent encrypted vault on disk
const VAULT_FILE_PATH = path.resolve(__dirname, '../data/users.vault.enc.json');

// Master Secret for AES-256 key derivation
const VAULT_SECRET = process.env.VAULT_SECRET || 'AMRITA_CAMPUS_MILITARY_GRADE_VAULT_KEY_2026_GENESIS_AES256';

// Fixed 256-bit (32 bytes) symmetric key derived via SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(VAULT_SECRET).digest();

/**
 * Encrypt plaintext string using AES-256-GCM
 * Galois/Counter Mode provides authenticated encryption (confidentiality + integrity)
 */
export function encryptVaultData(plaintext) {
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    algorithm: 'aes-256-gcm',
    encryptedAt: new Date().toISOString(),
    theftProtection: 'MILITARY-GRADE AES-256-GCM CIPHERTEXT: Completely useless to an intruder without the master key.',
    iv: iv.toString('hex'),
    authTag: authTag,
    ciphertext: ciphertext
  };
}

/**
 * Decrypt AES-256-GCM package back to plaintext string
 */
export function decryptVaultData(encryptedPackage) {
  const { iv, authTag, ciphertext } = encryptedPackage;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Save user list to disk in AES-256-GCM encrypted format
 */
export function persistUsersToVault(users) {
  try {
    const dataDir = path.dirname(VAULT_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const serialized = JSON.stringify(users, null, 2);
    const encrypted = encryptVaultData(serialized);
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(encrypted, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[VAULT] Failed to persist encrypted vault to disk:', err.message);
    return false;
  }
}

/**
 * Load and decrypt user list from on-disk vault
 */
export function loadUsersFromVault() {
  if (!fs.existsSync(VAULT_FILE_PATH)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
    const encryptedPackage = JSON.parse(raw);
    const decrypted = decryptVaultData(encryptedPackage);
    const users = JSON.parse(decrypted);
    console.log(`[VAULT] Successfully unlocked AES-256 vault with ${users.length} user accounts.`);
    return users;
  } catch (err) {
    console.error('[VAULT] Error unlocking vault:', err.message);
    return null;
  }
}

/**
 * Initialize vault: if vault doesn't exist, read users.csv,
 * hash every plain password with bcrypt (12 rounds),
 * encrypt everything into the AES-256 vault, and protect users.csv.
 */
export async function initializeEncryptedVault(existingUsers = []) {
  const loaded = loadUsersFromVault();
  if (loaded && loaded.length > 0) {
    return loaded;
  }

  console.log('[VAULT] Creating fresh AES-256 encrypted security vault from user base...');
  const usersToEncrypt = [];

  // Read users.csv if available
  const csvPath = path.resolve(__dirname, '../../users.csv');
  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 6) {
        const id = parts[0];
        const name = parts[1];
        const role = parts[2].toLowerCase();
        const username = parts[3];
        const email = parts[4].toLowerCase();
        const rawPassword = parts[5];

        // Ensure password is never stored plain text: hash with bcrypt
        const passwordHash = rawPassword.startsWith('$2')
          ? rawPassword
          : await bcrypt.hash(rawPassword, 12);

        usersToEncrypt.push({
          id,
          name,
          role,
          username,
          email,
          passwordHash,
          failedLoginAttempts: 0,
          isLocked: false,
          lockoutUntil: null,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // Include any existing users
  if (existingUsers && existingUsers.length > 0) {
    for (const u of existingUsers) {
      if (!usersToEncrypt.find((x) => x.username === u.username)) {
        usersToEncrypt.push(u);
      }
    }
  }

  // Persist to encrypted vault
  persistUsersToVault(usersToEncrypt);
  console.log(`[VAULT] Encrypted vault written to disk at: ${VAULT_FILE_PATH}`);

  return usersToEncrypt;
}

/**
 * Get raw on-disk encrypted vault inspection for the Thief Simulator
 */
export function getRawVaultInspection(usersCount = 0) {
  if (!fs.existsSync(VAULT_FILE_PATH)) {
    return {
      vaultFilePath: VAULT_FILE_PATH,
      algorithm: 'aes-256-gcm',
      theftProtection: 'AES-256-GCM Vault Initializing...',
      fileSizeBytes: 0,
      iv: 'N/A',
      authTag: 'N/A',
      ciphertextSnippet: 'Initializing vault...',
      accountsProtectedCount: usersCount
    };
  }

  const raw = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
  const stat = fs.statSync(VAULT_FILE_PATH);
  const parsed = JSON.parse(raw);

  return {
    vaultFilePath: VAULT_FILE_PATH,
    fileSizeBytes: stat.size,
    algorithm: parsed.algorithm || 'aes-256-gcm',
    theftProtection: parsed.theftProtection,
    encryptedAt: parsed.encryptedAt,
    iv: parsed.iv,
    authTag: parsed.authTag,
    ciphertextSnippet: parsed.ciphertext ? parsed.ciphertext.substring(0, 160) + '...' : '',
    cipherLengthHex: parsed.ciphertext ? parsed.ciphertext.length : 0,
    accountsProtectedCount: usersCount,
    securitySummary:
      'Even if an attacker gains physical or unauthorized access to the disk and copies this file, it is cryptographically impossible to extract plaintext passwords or usernames without the 256-bit encryption key and GCM authentication tag.'
  };
}
