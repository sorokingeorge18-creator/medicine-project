import { describe, test, expect } from 'vitest';
import { format } from 'date-fns';
import {
  calculateDiaryDates,
  getPreopEpicrisisDate,
  formatDateRu,
  formatDateShort,
} from './dateCalculations';

// Июнь 2026: 1 июня — понедельник
const d = (entryDate: Date) => format(entryDate, 'yyyy-MM-dd');

describe('calculateDiaryDates — базовый сценарий', () => {
  // Поступление пн 01.06 в 19:00, операция чт 04.06, выписка чт 11.06
  const entries = calculateDiaryDates('2026-06-01', '2026-06-04', '2026-06-11', '19:00');

  test('дневники идут по возрастанию дат без дубликатов', () => {
    const dates = entries.map((e) => d(e.date));
    expect(dates).toEqual([...dates].sort());
    expect(new Set(dates).size).toBe(dates.length);
  });

  test('поступление после 15:00 → осмотр на следующий день в 10:00', () => {
    // Arrange/Act — entries выше
    const admission = entries[0];
    // Assert
    expect(d(admission.date)).toBe('2026-06-02');
    expect(admission.time).toBe('10:00');
    expect(admission.type).toBe('withHead');
    expect(admission.isAdmission).toBe(true);
  });

  test('полный набор дат: осмотр, СР до операции, послеоп день, ПН/СР после, выписка', () => {
    expect(entries.map((e) => d(e.date))).toEqual([
      '2026-06-02', // осмотр при поступлении (вт)
      '2026-06-03', // среда до операции
      '2026-06-05', // первые сутки после операции (пт)
      '2026-06-08', // понедельник — с заведующим
      '2026-06-10', // среда
      '2026-06-11', // выписка (чт)
    ]);
  });

  test('понедельник после операции — обход с заведующим и послеоперационный', () => {
    const monday = entries.find((e) => d(e.date) === '2026-06-08')!;
    expect(monday.type).toBe('withHead');
    expect(monday.isPostOp).toBe(true);
  });

  test('день выписки помечен isDischarge и isPostOp', () => {
    const last = entries[entries.length - 1];
    expect(d(last.date)).toBe('2026-06-11');
    expect(last.isDischarge).toBe(true);
    expect(last.isPostOp).toBe(true);
  });

  test('среда до операции — обычный дневник без послеоперационного флага', () => {
    const wed = entries.find((e) => d(e.date) === '2026-06-03')!;
    expect(wed.type).toBe('regular');
    expect(wed.isPostOp).toBe(false);
  });
});

describe('calculateDiaryDates — время первичного осмотра', () => {
  test('поступление до 08:00 → тот же день, 10:00', () => {
    const entries = calculateDiaryDates('2026-06-01', '2026-06-04', '2026-06-11', '07:00');
    expect(d(entries[0].date)).toBe('2026-06-01');
    expect(entries[0].time).toBe('10:00');
  });

  test('поступление 09:30 → тот же день, +2 ч с округлением вверх (12:00)', () => {
    const entries = calculateDiaryDates('2026-06-01', '2026-06-04', '2026-06-11', '09:30');
    expect(d(entries[0].date)).toBe('2026-06-01');
    expect(entries[0].time).toBe('12:00');
  });

  test('поступление 14:59 → максимум 16:00 того же дня', () => {
    const entries = calculateDiaryDates('2026-06-01', '2026-06-04', '2026-06-11', '14:59');
    expect(d(entries[0].date)).toBe('2026-06-01');
    expect(entries[0].time).toBe('16:00');
  });

  test('поступление ровно в 15:00 → следующий день, 10:00', () => {
    const entries = calculateDiaryDates('2026-06-01', '2026-06-04', '2026-06-11', '15:00');
    expect(d(entries[0].date)).toBe('2026-06-02');
    expect(entries[0].time).toBe('10:00');
  });
});

describe('calculateDiaryDates — крайние случаи', () => {
  test('послеоперационный день совпадает со средой — запись одна, без дубликата', () => {
    // операция вт 02.06 → послеоп день ср 03.06 (тоже день ПН/СР/ПТ)
    const entries = calculateDiaryDates('2026-06-01', '2026-06-02', '2026-06-08', '10:00');
    const dates = entries.map((e) => d(e.date));
    expect(new Set(dates).size).toBe(dates.length);
    const postOpDay = entries.find((e) => d(e.date) === '2026-06-03')!;
    expect(postOpDay.isPostOp).toBe(true);
  });

  test('выписка на следующий день после операции — один дневник с обоими флагами', () => {
    const entries = calculateDiaryDates('2026-06-01', '2026-06-04', '2026-06-05', '10:00');
    const matches = entries.filter((e) => d(e.date) === '2026-06-05');
    expect(matches).toHaveLength(1);
    expect(matches[0].isPostOp).toBe(true);
    expect(matches[0].isDischarge).toBe(true);
  });
});

describe('вспомогательные функции дат', () => {
  test('getPreopEpicrisisDate — за день до операции', () => {
    expect(d(getPreopEpicrisisDate('2026-06-04'))).toBe('2026-06-03');
  });

  test('formatDateRu — русский длинный формат', () => {
    expect(formatDateRu(new Date(2026, 3, 5))).toBe('5 апреля 2026 г.');
  });

  test('formatDateShort — DD.MM.YYYY с ведущими нулями', () => {
    expect(formatDateShort(new Date(2026, 3, 5))).toBe('05.04.2026');
  });
});
