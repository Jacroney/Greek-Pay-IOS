import {
  formatCurrency,
  formatDate,
  formatDateLong,
  getInitials,
  getFirstName,
  getYearLabel,
  getDaysRemaining,
} from '../format';

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats decimal amounts', () => {
    expect(formatCurrency(49.99)).toBe('$49.99');
  });

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1250)).toBe('$1,250.00');
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('50.00');
  });
});

describe('formatDate', () => {
  it('formats a valid date string', () => {
    // Use a UTC timestamp to avoid timezone issues
    const result = formatDate('2025-03-15T12:00:00Z');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2025/);
  });

  it('returns a non-empty string', () => {
    const result = formatDate('2025-01-01T12:00:00Z');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateLong', () => {
  it('formats with long month name', () => {
    const result = formatDateLong('2025-03-15T12:00:00Z');
    expect(result).toMatch(/March/);
    expect(result).toMatch(/2025/);
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial from one name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns ? for undefined', () => {
    expect(getInitials(undefined)).toBe('?');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns ? for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('?');
  });

  it('handles three-part name (first + last)', () => {
    expect(getInitials('John Michael Doe')).toBe('JD');
  });

  it('uppercases initials', () => {
    expect(getInitials('jane doe')).toBe('JD');
  });
});

describe('getFirstName', () => {
  it('returns first name from full name', () => {
    expect(getFirstName('John Doe')).toBe('John');
  });

  it('returns single name', () => {
    expect(getFirstName('John')).toBe('John');
  });

  it('returns Member for undefined', () => {
    expect(getFirstName(undefined)).toBe('Member');
  });

  it('returns Member for empty string', () => {
    expect(getFirstName('')).toBe('Member');
  });
});

describe('getYearLabel', () => {
  it('maps year codes to labels', () => {
    expect(getYearLabel('1')).toBe('Freshman');
    expect(getYearLabel('2')).toBe('Sophomore');
    expect(getYearLabel('3')).toBe('Junior');
    expect(getYearLabel('4')).toBe('Senior');
    expect(getYearLabel('Graduate')).toBe('Graduate');
    expect(getYearLabel('Alumni')).toBe('Alumni');
  });

  it('returns raw value for unknown code', () => {
    expect(getYearLabel('5th Year')).toBe('5th Year');
  });

  it('returns Not specified for undefined', () => {
    expect(getYearLabel(undefined)).toBe('Not specified');
  });
});

describe('getDaysRemaining', () => {
  it('returns positive days for future deadline', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = getDaysRemaining(future.toISOString());
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it('returns negative days for past deadline', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = getDaysRemaining(past.toISOString());
    expect(result).toBeLessThanOrEqual(-4);
  });

  it('returns 0 or 1 for today', () => {
    const today = new Date();
    const result = getDaysRemaining(today.toISOString());
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
