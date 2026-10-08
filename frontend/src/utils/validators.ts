export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  // Matches 10-digit Indian numbers or with +91 / 0 prefix
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned);
}

export function isPositiveNumber(val: unknown): boolean {
  const num = Number(val);
  return !isNaN(num) && num > 0;
}
