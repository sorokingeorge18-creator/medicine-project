import { describe, test, expect } from 'vitest';
import { generateUniqueVitalSigns } from './statusGenerator';

describe('generateUniqueVitalSigns', () => {
  const sets = generateUniqueVitalSigns(30);

  test('все показатели в пределах нормы', () => {
    for (const v of sets) {
      expect(v.bpSystolic).toBeGreaterThanOrEqual(110);
      expect(v.bpSystolic).toBeLessThanOrEqual(139);
      expect(v.bpDiastolic).toBeGreaterThanOrEqual(70);
      expect(v.bpDiastolic).toBeLessThanOrEqual(89);
      expect(v.pulse).toBeGreaterThanOrEqual(60);
      expect(v.pulse).toBeLessThanOrEqual(89);
      expect(v.rr).toBeGreaterThanOrEqual(16);
      expect(v.rr).toBeLessThanOrEqual(18);
      expect(v.temperature).toBeGreaterThanOrEqual(36.3);
      expect(v.temperature).toBeLessThanOrEqual(36.7);
    }
  });

  test('наборы не повторяются', () => {
    const keys = sets.map((v) => `${v.bpSystolic}/${v.bpDiastolic}-${v.pulse}-${v.temperature}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('генерация детерминирована (одинаковый вход → одинаковый выход)', () => {
    expect(generateUniqueVitalSigns(10)).toEqual(generateUniqueVitalSigns(10));
  });
});
