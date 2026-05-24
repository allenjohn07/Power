import { hash, compare } from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3) return "Username must be at least 3 characters.";
  if (trimmed.length > 32) return "Username must be at most 32 characters.";
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, and underscores.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  return null;
}
