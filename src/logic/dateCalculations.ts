// ============================================================
// Логика расчёта дат дневников наблюдения
// ============================================================

import {
  parseISO,
  addDays,
  isSameDay,
  isAfter,
  isBefore,
  getDay,
  format,
} from 'date-fns';
import { DiaryType } from '../types';

/** Результат расчёта дат */
export interface DiaryDateEntry {
  date: Date;
  type: DiaryType;
  isPostOp: boolean;
  isAdmission: boolean;
  isDischarge: boolean;
}

/**
 * Определяет тип дневника по дате.
 * День поступления и понедельник → "с заведующим".
 * Остальные дни → "обычный".
 */
function getDiaryType(date: Date, admissionDate: Date): DiaryType {
  const isAdmission = isSameDay(date, admissionDate);
  const isMonday = getDay(date) === 1; // 1 = понедельник
  return isAdmission || isMonday ? 'withHead' : 'regular';
}

/**
 * Убирает дубликаты дат из массива.
 * При совпадении дат приоритет имеет запись с большим "весом":
 * withHead > regular, послеоперационная > обычная.
 */
function deduplicateDates(entries: DiaryDateEntry[]): DiaryDateEntry[] {
  const map = new Map<string, DiaryDateEntry>();
  for (const entry of entries) {
    const key = format(entry.date, 'yyyy-MM-dd');
    const existing = map.get(key);
    if (!existing) {
      map.set(key, entry);
    } else {
      // Приоритет: withHead > regular
      if (entry.type === 'withHead' && existing.type === 'regular') {
        map.set(key, { ...entry });
      }
      // Если тип совпадает, объединяем флаги
      if (entry.type === existing.type) {
        map.set(key, {
          ...existing,
          isPostOp: existing.isPostOp || entry.isPostOp,
          isDischarge: existing.isDischarge || entry.isDischarge,
        });
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

/**
 * Основная функция расчёта дат дневников.
 *
 * Алгоритм:
 * 1. День поступления → дневник с заведующим
 * 2. Все ПН/СР/ПТ строго между поступлением (не включая) и операцией (не включая)
 * 3. День после операции → послеоперационный дневник
 *    (если совпадает с ПН/СР/ПТ → обновляем существующую запись, не дублируем)
 * 4. День выписки
 * 5. Убрать дубликаты, отсортировать
 */
export function calculateDiaryDates(
  admissionDateStr: string,
  operationDateStr: string,
  dischargeDateStr: string
): DiaryDateEntry[] {
  const admission = parseISO(admissionDateStr);
  const operation = parseISO(operationDateStr);
  const discharge = parseISO(dischargeDateStr);

  const entries: DiaryDateEntry[] = [];

  // 1. День поступления
  entries.push({
    date: admission,
    type: 'withHead',
    isPostOp: false,
    isAdmission: true,
    isDischarge: isSameDay(admission, discharge),
  });

  // 2. ПН/СР/ПТ строго между поступлением (не включая) и операцией (не включая)
  let current = addDays(admission, 1);
  while (isBefore(current, operation)) {
    const dayOfWeek = getDay(current); // 0=вс, 1=пн, 2=вт, 3=ср, 4=чт, 5=пт, 6=сб
    const isMWF = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    if (isMWF) {
      entries.push({
        date: new Date(current),
        type: getDiaryType(current, admission),
        isPostOp: false,
        isAdmission: false,
        isDischarge: isSameDay(current, discharge),
      });
    }
    current = addDays(current, 1);
  }

  // 3. День после операции
  const postOpDay = addDays(operation, 1);
  // Проверяем, не совпадает ли с уже добавленной датой
  const postOpKey = format(postOpDay, 'yyyy-MM-dd');
  const existingPostOp = entries.find(
    (e) => format(e.date, 'yyyy-MM-dd') === postOpKey
  );
  if (existingPostOp) {
    // Обновляем флаг — это послеоперационный день
    existingPostOp.isPostOp = true;
  } else {
    entries.push({
      date: postOpDay,
      type: getDiaryType(postOpDay, admission),
      isPostOp: true,
      isAdmission: false,
      isDischarge: isSameDay(postOpDay, discharge),
    });
  }

  // 4. День выписки (если ещё не добавлен)
  const dischargeKey = format(discharge, 'yyyy-MM-dd');
  const existingDischarge = entries.find(
    (e) => format(e.date, 'yyyy-MM-dd') === dischargeKey
  );
  if (existingDischarge) {
    existingDischarge.isDischarge = true;
  } else {
    // Выписка после операции → послеоперационный тип
    const isAfterOp = isAfter(discharge, operation);
    entries.push({
      date: discharge,
      type: getDiaryType(discharge, admission),
      isPostOp: isAfterOp,
      isAdmission: false,
      isDischarge: true,
    });
  }

  return deduplicateDates(entries);
}

/**
 * Вычисляет дату предоперационного эпикриза (за 1 день до операции).
 */
export function getPreopEpicrisisDate(operationDateStr: string): Date {
  return addDays(parseISO(operationDateStr), -1);
}

/**
 * Форматирует дату в русский длинный формат: "5 апреля 2026 г."
 */
export function formatDateRu(date: Date): string {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y} г.`;
}

/**
 * Форматирует дату в формат DD/MM/YYYY.
 */
export function formatDateShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
