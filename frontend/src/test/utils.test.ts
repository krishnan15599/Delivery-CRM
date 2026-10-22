import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../utils/formatters';
import { isValidEmail, isValidPhone, isPositiveNumber } from '../utils/validators';
import { cn } from '../utils/cn';

describe('Utility Functions', () => {
  describe('cn (Classnames)', () => {
    it('combines truthy class names and filters falsy ones', () => {
      const isPrimary = true;
      const isHidden = false;
      expect(cn('btn', isPrimary && 'btn-primary', isHidden && 'hidden', null, undefined, 'active')).toBe(
        'btn btn-primary active'
      );
    });
  });

  describe('formatCurrency', () => {
    it('formats Indian rupee amounts correctly', () => {
      expect(formatCurrency(1500)).toBe('₹1,500');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      expect(formatCurrency(0)).toBe('₹0');
    });
  });

  describe('formatDate', () => {
    it('formats ISO dates accurately', () => {
      const res = formatDate('2026-10-07T10:00:00Z');
      expect(res).toContain('2026');
    });

    it('returns N/A on empty input', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });
  });

  describe('validators', () => {
    it('validates email formats', () => {
      expect(isValidEmail('admin@deliverycrm.in')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@domain')).toBe(false);
    });

    it('validates phone numbers', () => {
      expect(isValidPhone('+91 98450 12345')).toBe(true);
      expect(isValidPhone('9845012345')).toBe(true);
      expect(isValidPhone('12345')).toBe(false);
    });

    it('validates positive numbers', () => {
      expect(isPositiveNumber(500)).toBe(true);
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-10)).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
    });
  });
});
