import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type SitePasscodeValidationInput = {
  passcode: string;
  confirmPasscode: string;
  hint: string;
  hasExistingPasscode: boolean;
};

const SCRYPT_KEY_LENGTH = 32;

export function validateSitePasscode(input: SitePasscodeValidationInput) {
  const passcode = input.passcode.trim();
  const confirmPasscode = input.confirmPasscode.trim();
  const hint = input.hint.trim();
  const isChangingPasscode = Boolean(passcode || confirmPasscode);
  const errors: string[] = [];

  if (!input.hasExistingPasscode || isChangingPasscode) {
    if (!/^\d{4}$/.test(passcode)) {
      errors.push("Website giriş şifresi tam 4 rakam olmalı.");
    }

    if (confirmPasscode !== passcode) {
      errors.push("Website giriş şifresi tekrarı aynı olmalı.");
    }
  }

  if (hint.length < 2) {
    errors.push("Şifre ipucu zorunlu.");
  } else if (hint.length > 80) {
    errors.push("Şifre ipucu en fazla 80 karakter olabilir.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedHint: hint,
    shouldHashPasscode: !input.hasExistingPasscode || isChangingPasscode,
  };
}

export function hashSitePasscode(passcode: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passcode, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifySitePasscode(passcode: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expectedHash = Buffer.from(hash, "hex");
  const actualHash = scryptSync(passcode, salt, expectedHash.length);

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
}
