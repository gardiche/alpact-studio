// Chiffrement AES-256-GCM pour les tokens OAuth Notion.
// La clé est stockée dans NOTION_TOKEN_ENCRYPTION_KEY (hex, 64 chars = 32 bytes).

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommandé pour GCM
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.NOTION_TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "NOTION_TOKEN_ENCRYPTION_KEY manquant ou invalide (attendu : 64 caractères hex)"
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Chiffre un texte en clair.
 * Format de sortie : iv (12 bytes) + authTag (16 bytes) + ciphertext, encodé en base64.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // iv + authTag + ciphertext → base64
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Déchiffre un texte chiffré produit par `encrypt()`.
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const combined = Buffer.from(encoded, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
