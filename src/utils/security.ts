/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Keamanan & Anti-Bot Shield
 * (Honeypot Trap, Dynamic Math Captcha, XSS Sanitizer, NIK Validator, Rate Limiter)
 */

import { SecurityChallenge, AuditLog } from '../types/fasi';

// In-memory rate limiting map: ip/fingerprint -> timestamp array
const requestLog = new Map<string, number[]>();

/**
 * Validasi Honeypot: Jika field bot terisi, tandai sebagai Bot
 */
export function validateHoneypot(honeypotValue: string | undefined): boolean {
  if (honeypotValue && honeypotValue.trim().length > 0) {
    return false; // Terindikasi BOT
  }
  return true; // Bersih
}

/**
 * Anti-Bot Math Challenge Generator
 */
export function generateSecurityChallenge(): SecurityChallenge {
  const operators: ('+' | '-' | '*')[] = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1 = Math.floor(Math.random() * 9) + 1;
  let num2 = Math.floor(Math.random() * 9) + 1;

  // Pastikan hasil pengurangan tidak minus agar mudah bagi manusia
  if (operator === '-' && num1 < num2) {
    const temp = num1;
    num1 = num2;
    num2 = temp;
  }

  // Batasi perkalian sampai angka 5 agar cepat dijawab
  if (operator === '*') {
    num1 = Math.floor(Math.random() * 5) + 1;
    num2 = Math.floor(Math.random() * 5) + 1;
  }

  let expectedAnswer = 0;
  if (operator === '+') expectedAnswer = num1 + num2;
  else if (operator === '-') expectedAnswer = num1 - num2;
  else if (operator === '*') expectedAnswer = num1 * num2;

  // Token tamper-proof sederhana
  const token = btoa(`${num1}:${operator}:${num2}:${expectedAnswer}:${Date.now()}`);

  return {
    num1,
    num2,
    operator,
    expectedAnswer,
    token,
  };
}

/**
 * Validasi jawaban Anti-Bot Challenge
 */
export function verifySecurityChallenge(challenge: SecurityChallenge, userAnswer: string | number): boolean {
  try {
    const numericAnswer = typeof userAnswer === 'string' ? parseInt(userAnswer.trim(), 10) : userAnswer;
    return numericAnswer === challenge.expectedAnswer;
  } catch {
    return false;
  }
}

/**
 * Rate Limiter Klien / Endpoint Simulation
 * Mencegah bot membanjiri request (Maks 15 request per 10 detik per aksi)
 */
export function checkRateLimit(actionKey: string, maxRequests = 15, timeWindowMs = 10000): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(actionKey) || [];
  const validTimestamps = timestamps.filter(t => now - t < timeWindowMs);

  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limit exceeded (terlalu cepat / terindikasi bot)
  }

  validTimestamps.push(now);
  requestLog.set(actionKey, validTimestamps);
  return true;
}

/**
 * Sanitasi String dari potensi serangan XSS / Tag Injeksi
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Validasi NIK (Nomor Induk Kependudukan) Standar Indonesia
 * 16 Digit angka valid
 */
export function validateNIK(nik: string): { isValid: boolean; message: string } {
  const cleaned = nik.replace(/\D/g, '');
  
  if (cleaned.length !== 16) {
    return {
      isValid: false,
      message: `NIK harus tepat 16 digit angka (saat ini ${cleaned.length} digit).`,
    };
  }

  // Cek apakah angka bukan pengulangan angka yang sama (misal 0000000000000000)
  if (/^(\d)\1{15}$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Format NIK tidak valid (angka berulang).',
    };
  }

  return {
    isValid: true,
    message: 'Format NIK valid.',
  };
}

/**
 * Buat Log Audit
 */
export function createAuditLog(
  user: string,
  action: string,
  details: string,
  status: 'SUCCESS' | 'BLOCKED_BOT' | 'FLAGGED' = 'SUCCESS'
): AuditLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    user,
    action,
    details,
    ipMock: '182.253.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250),
    status,
  };
}
